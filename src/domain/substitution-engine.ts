import type {
  AthleteProfile,
  CompletedSetRecord,
  EquipmentProfile,
  Exercise,
  PlannedExercise,
  ReadinessOutcome,
  SetPrescription,
  SurveyRecord,
  SubstitutionCandidateSnapshot,
  SubstitutionReason,
  SubstitutionTier
} from './types'
import { recommendProgression } from './training-engine'
import { exerciseEquipmentFit, loadIncrementFor } from './equipment-engine'

export interface RankedSubstitution {
  candidate: Exercise
  snapshot: SubstitutionCandidateSnapshot
  prescription: SetPrescription[]
  prescriptionMethod: 'exact-history' | 'baseline-calibration'
  prescriptionNote: string
}

const latestExactSession = (history: CompletedSetRecord[], exerciseId: string) => {
  const exact = history.filter((workSet) => workSet.exerciseId === exerciseId)
  if (!exact.length) return []
  const latest = [...exact].sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime() || b.id.localeCompare(a.id))[0]
  return exact.filter((workSet) => workSet.sessionId === latest.sessionId).sort((a, b) => a.setIndex - b.setIndex || a.id.localeCompare(b.id))
}

const tierFor = (score: number): SubstitutionTier => score >= 11 ? 'best-match' : score >= 7 ? 'good-alternative' : 'changes-focus'

const repRangeFor = (planned: PlannedExercise): [number, number] => {
  if (planned.role === 'primary') return [3, 6]
  if (planned.role === 'secondary') return [6, 10]
  return [8, 15]
}

function replacementPrescription(input: {
  planned: PlannedExercise
  candidate: Exercise
  history: CompletedSetRecord[]
  athlete: AthleteProfile
  readiness: ReadinessOutcome
  equipmentProfile?: EquipmentProfile
  surveys?: SurveyRecord[]
}) {
  const { planned, candidate, history, athlete, readiness, equipmentProfile, surveys } = input
  const exactHistory = history.filter((workSet) => workSet.exerciseId === candidate.id)
  const latest = latestExactSession(history, candidate.id)
  if (!latest.length) {
    const count = planned.role === 'primary' ? Math.min(2, planned.sets.length) : planned.sets.length
    const sets = planned.sets.slice(0, count).map((workSet) => ({
      ...workSet,
      targetLoad: 0,
      targetRir: Math.max(3, workSet.targetRir),
      completed: false,
      completedLoad: undefined,
      completedReps: undefined,
      actualRir: undefined
    }))
    return {
      sets,
      method: 'baseline-calibration' as const,
      note: `No completed ${candidate.name} history. Choose a conservative load that leaves at least three repetitions in reserve. The replaced movement's load was not copied.`
    }
  }

  const reference = latest[0]
  const repRange = repRangeFor(planned)
  const targetReps = Math.min(repRange[1], Math.max(repRange[0], reference.reps))
  const targetSets = Math.min(planned.sets.length, latest.length)
  const increment = equipmentProfile ? loadIncrementFor(candidate, equipmentProfile).value : reference.load > 0 && reference.load < 100 ? 2.5 : 5
  const decision = recommendProgression({
    history: exactHistory,
    surveys,
    targetLoad: reference.load,
    targetReps,
    targetSets,
    repRange,
    increment,
    continuity: athlete.continuity,
    readiness
  })
  const count = Math.max(1, Math.min(planned.sets.length, decision.nextSets))
  const sets = planned.sets.slice(0, count).map((workSet) => ({
    ...workSet,
    targetLoad: decision.nextLoad,
    targetReps: decision.nextReps,
    targetRir: Math.max(workSet.targetRir, readiness === 'normal' ? 1 : 2),
    completed: false,
    completedLoad: undefined,
    completedReps: undefined,
    actualRir: undefined
  }))
  return {
    sets,
    method: 'exact-history' as const,
    note: `${decision.title}. Recalculated from the last exact ${candidate.name} exposure of ${latest.length} sets at ${reference.load} × ${reference.reps}; the original movement load was not copied.`
  }
}

export function rankExerciseSubstitutions(input: {
  planned: PlannedExercise
  original: Exercise
  exercises: Exercise[]
  history: CompletedSetRecord[]
  athlete: AthleteProfile
  readiness: ReadinessOutcome
  reason: SubstitutionReason
  equipmentProfile?: EquipmentProfile
  surveys?: SurveyRecord[]
}): RankedSubstitution[] {
  const { planned, original, exercises, history, athlete, readiness, reason, equipmentProfile, surveys } = input
  return exercises
    .filter((candidate) => candidate.id !== original.id && !candidate.retired && candidate.jointFeeling !== 'avoid' && !candidate.disliked)
    .filter((candidate) => !equipmentProfile || exerciseEquipmentFit(candidate, equipmentProfile).available)
    .map((candidate) => {
      const reasons: string[] = []
      let score = 0
      if (candidate.pattern === original.pattern) { score += 5; reasons.push('same movement pattern') }
      if (candidate.primaryRegion === original.primaryRegion) { score += 4; reasons.push(`same primary ${original.primaryRegion} target`) }
      else if (candidate.regions.includes(original.primaryRegion)) { score += 2; reasons.push(`still trains ${original.primaryRegion}`) }
      if (candidate.family === original.family) { score += 3; reasons.push('same exercise family') }
      if (candidate.roleTags.some((tag) => original.roleTags.includes(tag))) { score += 2; reasons.push('overlapping training role') }
      if (candidate.jointFeeling === 'great') { score += 3; reasons.push('great prior joint response') }
      else if (candidate.jointFeeling === 'good') { score += 2; reasons.push('good prior joint response') }
      else if (candidate.jointFeeling === 'irritating') { score -= 6; reasons.push('irritating prior joint response') }
      if (candidate.favorite) { score += 2; reasons.push('preferred movement') }
      if (equipmentProfile) reasons.unshift(`available at ${equipmentProfile.name}`)

      const prior = history.filter((workSet) => workSet.exerciseId === candidate.id)
      const latest = prior.length ? [...prior].sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())[0] : null
      if (prior.length >= 6) { score += 2; reasons.push('familiar exact history') }
      else if (prior.length) { score += 1; reasons.push('some exact history') }

      const changesEquipment = original.equipment.some((item) => !candidate.equipment.includes(item))
      if (reason === 'pain') {
        if (candidate.jointFeeling === 'great') score += 5
        if (candidate.pattern !== original.pattern && candidate.primaryRegion === original.primaryRegion) score += 2
      }
      if (reason === 'equipment' && changesEquipment) { score += 5; reasons.unshift('changes the required equipment') }
      if (reason === 'time' && (candidate.roleTags.includes('short setup') || candidate.roleTags.includes('low fatigue'))) { score += 4; reasons.unshift('lower setup or fatigue cost') }
      if (reason === 'fatigue' && (candidate.roleTags.includes('low fatigue') || candidate.equipment.some((item) => item.includes('machine')))) { score += 4; reasons.unshift('more stable fatigue profile') }
      if (reason === 'target-feel' && candidate.primaryRegion === original.primaryRegion) score += 4
      if (reason === 'variety' && !prior.length) { score += 4; reasons.unshift('new exact movement exposure') }
      if (reason === 'preference' && candidate.favorite) score += 4
      if (reason === 'harder' && candidate.roleTags.some((tag) => ['strength', 'overload', 'secondary builder'].includes(tag))) { score += 3; reasons.unshift('higher strength or overload emphasis') }
      if (reason === 'easier' && (candidate.roleTags.includes('low fatigue') || candidate.jointFeeling === 'great')) { score += 3; reasons.unshift('lower-friction option') }
      if (['protect', 'pain-aware', 'reacclimate'].includes(readiness) && candidate.jointFeeling === 'great') score += 2

      score = Math.max(0, score)

      const prescription = replacementPrescription({ planned, candidate, history, athlete, readiness, equipmentProfile, surveys })
      const samePurpose = candidate.pattern === original.pattern && candidate.regions.includes(original.primaryRegion)
      const snapshot: SubstitutionCandidateSnapshot = {
        exerciseId: candidate.id,
        exerciseName: candidate.name,
        rank: 0,
        score,
        tier: tierFor(score),
        reasons: reasons.slice(0, 5),
        preserves: samePurpose ? `${planned.role} role, ${original.primaryRegion} target, and ${original.pattern.replace('-', ' ')} pattern` : `${original.primaryRegion} involvement and a safe completed-work path`,
        changes: candidate.pattern === original.pattern ? `Exact movement identity, equipment, and progression clock` : `Movement pattern, specificity, equipment, and exact progression clock`,
        lastExposureAt: latest?.completedAt ?? null,
        priorSetCount: prior.length
      }
      return { candidate, snapshot, prescription: prescription.sets, prescriptionMethod: prescription.method, prescriptionNote: prescription.note }
    })
    .sort((a, b) => b.snapshot.score - a.snapshot.score || a.candidate.name.localeCompare(b.candidate.name))
    .map((item, index) => ({ ...item, snapshot: { ...item.snapshot, rank: index + 1, tier: tierFor(item.snapshot.score) } }))
}
