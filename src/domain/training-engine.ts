import { isComparableExposure } from './set-structure-engine'
import type {
  CompletedSetRecord,
  ContinuityState,
  Exercise,
  ExerciseRole,
  PlannedExercise,
  ProgressionDecision,
  ReadinessOutcome,
  RegionVolumePoint,
  SetPrescription,
  SurveyAnswer,
  SessionStatus,
  SurveyRecord,
  TrainingSession,
  WeeklyVolumePoint
} from './types'

export const volumeLoad = (sets: Pick<CompletedSetRecord, 'reps' | 'load'>[]) =>
  sets.reduce((total, set) => total + set.reps * set.load, 0)

export const estimatedOneRepMax = (load: number, reps: number) =>
  reps <= 1 ? load : Math.round(load * (1 + reps / 30))

export function sessionCompletionStatus(session: TrainingSession): SessionStatus {
  const primary = session.exercises.find((exercise) => exercise.role === 'primary')
  const primaryStarted = primary?.sets.some((workSet) => workSet.completed) ?? false
  // Athlete-added work is volunteered, so an unfinished bonus set must not turn a session in which
  // every prescribed set was completed into a partial one. Compliance measures the prescription.
  const prescribed = session.exercises.map((exercise) => exercise.sets.filter((workSet) => !workSet.athleteAdded))
  const allComplete = session.exercises.length > 0 && prescribed.every((sets) => sets.every((workSet) => workSet.completed))
  if (allComplete) return 'completed'
  if (primaryStarted) return 'partial-primary'
  return 'partial-no-primary'
}

export function readinessFromSurvey(answers: SurveyAnswer[], continuity: ContinuityState): ReadinessOutcome {
  const byId = Object.fromEntries(answers.filter((answer) => answer.status === 'answered').map((answer) => [answer.id, Number(answer.value)]))
  const pain = byId.pain ?? 0
  if (pain >= 4) return 'pain-aware'
  if (continuity === 'returning') return 'reacclimate'
  const poorSleep = (byId.sleepHours ?? 8) < 5.5 || (byId.sleepQuality ?? 3) <= 1
  const highFatigue = (byId.fatigue ?? 1) >= 4
  const lowEnergy = (byId.energy ?? 3) <= 1
  const highStress = (byId.stress ?? 1) >= 4
  if ([poorSleep, highFatigue, lowEnergy, highStress].filter(Boolean).length >= 2) return 'protect'
  if (poorSleep || highFatigue || lowEnergy || highStress || continuity === 'interrupted') return 'confirm'
  return 'normal'
}

interface ProgressionInput {
  history: CompletedSetRecord[]
  surveys?: SurveyRecord[]
  targetLoad: number
  targetReps: number
  targetSets: number
  repRange: [number, number]
  increment: number
  continuity: ContinuityState
  readiness: ReadinessOutcome
}

export function recommendProgression(input: ProgressionInput): ProgressionDecision {
  const { targetLoad, targetReps, targetSets, repRange, increment, continuity, readiness } = input
  // Drops and myo-rep mini sets are real completed work, but they are performed at a reduced load or a
  // truncated rep target. Comparing them as ordinary exposures would read a productive technique week
  // as a regression, so the progression signal comes only from comparable sets.
  const comparable = input.history
    .filter((workSet) => isComparableExposure(workSet.grouping))
    .sort((a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime() || a.setIndex - b.setIndex || a.id.localeCompare(b.id))
  const athleteAddedSetsExcluded = comparable.filter((workSet) => workSet.athleteAdded).length
  const history = comparable.filter((workSet) => !workSet.athleteAdded)
  const exposureGroups = new Map<string, CompletedSetRecord[]>()
  history.forEach((workSet) => exposureGroups.set(workSet.sessionId, [...(exposureGroups.get(workSet.sessionId) ?? []), workSet]))
  const exposures = [...exposureGroups.values()].sort((a, b) => new Date(a[0].completedAt).getTime() - new Date(b[0].completedAt).getTime())
  const recent = exposures.at(-1) ?? []
  const sourceSessionId = recent[0]?.sessionId ?? null
  const sourcePlannedExerciseId = recent[0]?.plannedExerciseId
  const postFeedback = [...(input.surveys ?? [])]
    .filter((survey) => survey.type === 'post' && survey.sessionId === sourceSessionId)
    .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())[0]
  const movementFeedback = sourcePlannedExerciseId ? [...(input.surveys ?? [])]
    .filter((survey) => survey.type === 'movement' && survey.sessionId === sourceSessionId && survey.plannedExerciseId === sourcePlannedExerciseId)
    .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())[0] : undefined
  const answerFrom = (survey: SurveyRecord | undefined, id: string) => {
    const found = survey?.answers.find((candidate) => candidate.id === id && candidate.status === 'answered')
    return typeof found?.value === 'number' ? found.value : null
  }
  const answer = (id: string, movementId?: string) => movementId
    ? answerFrom(movementFeedback, movementId) ?? answerFrom(postFeedback, id)
    : answerFrom(postFeedback, id)
  const knownRir = recent.filter((workSet) => workSet.rirKnown !== false)
  const confirmedQuality = recent.filter((workSet) => workSet.qualityConfirmed === true)
  const unknownInputs: string[] = []
  if (!knownRir.length) unknownInputs.push('actual RIR')
  if (!confirmedQuality.length) unknownInputs.push('technique and joint response')
  if (!movementFeedback && !postFeedback) unknownInputs.push('movement or session feedback')
  const evidence: ProgressionDecision['evidence'] = {
    sourceSessionId,
    sourceSetIds: recent.map((workSet) => workSet.id),
    comparableExposureCount: exposures.length,
    athleteAddedSetsExcluded,
    rirKnownSets: knownRir.length,
    qualityConfirmedSets: confirmedQuality.length,
    feedbackSourceId: movementFeedback?.id ?? postFeedback?.id ?? null,
    unknownInputs
  }
  const result = (decision: Omit<ProgressionDecision, 'ruleVersion' | 'evidence'>): ProgressionDecision => ({
    ruleVersion: 'progression-v2',
    evidence,
    ...decision
  })
  const reasons: string[] = []
  if (history.length === 0) {
    return result({
      action: 'hold',
      title: 'Establish today’s baseline',
      explanation: 'You have not completed a comparable set of this lift yet. Finish the planned work before it can progress.',
      nextLoad: targetLoad,
      nextReps: targetReps,
      nextSets: targetSets,
      confidence: 'low',
      reasons: [athleteAddedSetsExcluded ? 'Only athlete-added work exists; it counts as dose but cannot automatically earn progression' : 'No comparable prescribed set completed yet']
    })
  }

  const avgRir = knownRir.length ? knownRir.reduce((sum, set) => sum + set.rir, 0) / knownRir.length : null
  const avgTechnique = confirmedQuality.length ? confirmedQuality.reduce((sum, set) => sum + set.technique, 0) / confirmedQuality.length : null
  const maxPain = confirmedQuality.length ? Math.max(...confirmedQuality.map((set) => set.pain)) : null
  const surveyPain = answer('pain', 'movementPain')
  const expectedComparison = answer('expectedComparison')
  const difficulty = answer('difficulty')
  const endFatigue = answer('endFatigue')
  const targetStimulus = answer('targetStimulus', 'targetStimulus')
  const recovery = answer('recovery', 'recovery')
  const movementTechnique = answerFrom(movementFeedback, 'movementTechnique')
  const loadFit = answerFrom(movementFeedback, 'loadFit')
  const volumeFit = answerFrom(movementFeedback, 'volumeFit')
  const latestPrescribed = recent.slice(0, targetSets)
  const targetOwned = latestPrescribed.length >= targetSets && latestPrescribed.every((workSet) => workSet.load >= targetLoad && workSet.reps >= targetReps)
  const sensibleLoadJump = targetLoad > 0 && increment / targetLoad <= 0.1
  const hardFeedback = (expectedComparison !== null && expectedComparison >= 4) || (difficulty !== null && difficulty >= 9) || (endFatigue !== null && endFatigue >= 5) || (movementTechnique !== null && movementTechnique <= 2) || (loadFit !== null && loadFit >= 5)

  if (readiness === 'pain-aware' || (maxPain !== null && maxPain >= 4) || (surveyPain !== null && surveyPain >= 4)) {
    return result({
      action: 'reduce',
      title: 'Protect the affected movement',
      explanation: 'Pain evidence blocks overload. Reduce or substitute this movement and reassess during warm-up.',
      nextLoad: Math.max(0, targetLoad - increment),
      nextReps: targetReps,
      nextSets: Math.max(1, targetSets - 1),
      confidence: 'high',
      reasons: ['Reported pain blocks progression', 'Safety outranks overload']
    })
  }

  if (continuity === 'returning' || readiness === 'reacclimate') {
    return result({
      action: 'reacclimate',
      title: 'Rebuild this lift',
      explanation: 'The recent gap makes your old numbers less certain. Take one easier session before progression resumes.',
      nextLoad: Math.max(increment, Math.round((targetLoad * 0.9) / increment) * increment),
      nextReps: Math.max(repRange[0], targetReps - 1),
      nextSets: Math.max(2, targetSets - 1),
      confidence: 'high',
      reasons: ['Returning continuity state', 'Old capacity needs confirmation']
    })
  }

  if (readiness === 'protect') {
    return result({
      action: 'hold',
      title: 'Confirm today before progressing',
      explanation: 'Several current readiness signals agree that optional fatigue should come down. Keep the existing target provisional and let completed, pain-free work decide what the next exposure earns.',
      nextLoad: targetLoad,
      nextReps: targetReps,
      nextSets: targetSets,
      confidence: 'high',
      reasons: ['Current readiness is protected', 'One difficult day does not erase prior progress or earn more work']
    })
  }

  if (!targetOwned || (avgTechnique !== null && avgTechnique < 3.5) || (avgRir !== null && avgRir < 0.5) || hardFeedback) {
    const holdReasons = [
      !targetOwned ? 'The latest prescribed exposure was not fully owned' : null,
      avgTechnique !== null && avgTechnique < 3.5 ? 'Confirmed technique was below the progression threshold' : null,
      avgRir !== null && avgRir < 0.5 ? 'The latest effort was too close to failure for another increase' : null,
      hardFeedback ? 'The athlete reported that the exact movement was too heavy or technique broke down, or the session was harder or more fatiguing than the next increase allows' : null
    ].filter((reason): reason is string => Boolean(reason))
    return result({
      action: 'hold',
      title: 'Own the current target',
      explanation: 'Technique, effort, or completed repetitions do not support overload yet. Repeat the target and improve execution.',
      nextLoad: targetLoad,
      nextReps: targetReps,
      nextSets: targetSets,
      confidence: 'high',
      reasons: [...holdReasons, 'Hold before adding load, repetitions, or dose']
    })
  }

  if (targetReps >= repRange[1] && avgRir !== null && avgRir >= 1.5 && sensibleLoadJump) {
    reasons.push('Top of rep range reached', 'Target effort was owned', 'Load is the first progression priority')
    return result({
      action: 'load',
      title: `Add ${increment} next exposure`,
      explanation: 'You owned the top of the rep range with acceptable effort and technique. The smallest available load increase is earned.',
      nextLoad: targetLoad + increment,
      nextReps: repRange[0],
      nextSets: targetSets,
      confidence: confirmedQuality.length >= targetSets ? 'high' : 'medium',
      reasons
    })
  }

  if (targetReps < repRange[1] && avgRir !== null && avgRir >= 1) {
    return result({
      action: 'reps',
      title: 'Add one repetition',
      explanation: 'The next load jump is not yet earned, so the next smallest useful win is one more repetition across the work sets.',
      nextLoad: targetLoad,
      nextReps: targetReps + 1,
      nextSets: targetSets,
      confidence: confirmedQuality.length >= targetSets ? 'high' : 'medium',
      reasons: ['Current load is productive', 'Repetition progression remains in range']
    })
  }

  const lowStimulus = targetStimulus !== null && targetStimulus <= 2
  const recoveredEarly = recovery !== null && recovery >= 4
  const manageableFatigue = endFatigue !== null && endFatigue <= 3
  const volumeAllowsMore = volumeFit === null || volumeFit === 1
  if (targetReps >= repRange[1] && !sensibleLoadJump && exposures.length >= 3 && avgRir !== null && avgRir >= 1 && readiness === 'normal' && continuity === 'stable' && lowStimulus && recoveredEarly && manageableFatigue && volumeAllowsMore) {
    return result({
      action: 'sets',
      title: 'One recovered set is available',
      explanation: 'The available load jump is too large, repetitions are at the top of the range, and repeated feedback shows low stimulus with early recovery. One added set is the next athlete-approved dose option.',
      nextLoad: targetLoad,
      nextReps: targetReps,
      nextSets: targetSets + 1,
      confidence: 'medium',
      reasons: ['Load jump exceeds ten percent', 'Repetitions are already at the top of the range', 'Low stimulus and early recovery support a cautious dose increase']
    })
  }

  const missingEvidence = unknownInputs.length ? ` Missing evidence: ${unknownInputs.join(', ')}.` : ''
  return result({
    action: 'hold',
    title: 'Confirm this target once more',
    explanation: `A bigger number is not clearly earned yet. Repeat the current work and use the result to improve confidence.${missingEvidence}`,
    nextLoad: targetLoad,
    nextReps: targetReps,
    nextSets: targetSets,
    confidence: unknownInputs.length ? 'low' : 'medium',
    reasons: [!sensibleLoadJump && targetReps >= repRange[1] ? 'The next load jump is too large and the separate dose gate is not fully supported' : 'Insufficient evidence for a safe increase']
  })
}

// Secondary work drives the primary, accessories drive the secondary, and tertiary work is extra
// hypertrophy. Compression sheds from the bottom up, so tertiary goes before accessory work.
const rolePriority: Record<PlannedExercise['role'], number> = {
  primary: 0,
  secondary: 1,
  accessory: 2,
  tertiary: 3
}

const legacyRoleMap: Record<string, ExerciseRole> = {
  primary: 'primary',
  secondary: 'secondary',
  priority: 'accessory',
  maintenance: 'tertiary',
  optional: 'tertiary',
  accessory: 'accessory',
  tertiary: 'tertiary'
}

/** Maps any stored role, current or legacy, onto the current vocabulary. Unknown values become tertiary. */
export function normalizeExerciseRole(role: string): ExerciseRole {
  return legacyRoleMap[role] ?? 'tertiary'
}

export function compressSession(session: TrainingSession, availableMinutes: number): TrainingSession {
  if (availableMinutes >= session.durationMinutes) return { ...session, durationMinutes: availableMinutes }
  let remaining = availableMinutes
  const exercises = [...session.exercises]
    .sort((a, b) => rolePriority[a.role] - rolePriority[b.role])
    .flatMap((exercise) => {
      if (remaining <= 0) return []
      const minimumSets = exercise.role === 'primary' ? Math.min(2, exercise.sets.length) : 1
      const secondsPerSet = Math.max(120, Math.round((exercise.estimatedMinutes * 60) / exercise.sets.length))
      const possibleSets = Math.floor((remaining * 60) / secondsPerSet)
      const setCount = Math.min(exercise.sets.length, Math.max(exercise.role === 'primary' ? minimumSets : 0, possibleSets))
      if (setCount === 0) return []
      const estimatedMinutes = Math.ceil((setCount * secondsPerSet) / 60)
      remaining -= estimatedMinutes
      return [{ ...exercise, sets: exercise.sets.slice(0, setCount), estimatedMinutes }]
    })
  return { ...session, durationMinutes: availableMinutes, exercises }
}

export function duplicateCandidates(name: string, exercises: Exercise[]) {
  const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, '')
  const needle = normalize(name)
  return exercises
    .map((exercise) => {
      const names = [exercise.name, ...exercise.aliases].map(normalize)
      const exact = names.includes(needle)
      const related = names.some((candidate) => candidate.includes(needle) || needle.includes(candidate))
      return { exercise, score: exact ? 1 : related ? 0.75 : exercise.family.toLowerCase().includes(name.toLowerCase()) ? 0.55 : 0 }
    })
    .filter((candidate) => candidate.score > 0)
    .sort((a, b) => b.score - a.score)
}

export function weeklyVolume(history: CompletedSetRecord[]): WeeklyVolumePoint[] {
  const buckets = new Map<string, WeeklyVolumePoint>()
  history.forEach((set) => {
    const date = new Date(set.completedAt)
    const weekStart = new Date(date)
    weekStart.setDate(date.getDate() - date.getDay())
    const key = weekStart.toISOString().slice(0, 10)
    const current = buckets.get(key) ?? { label: weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), volume: 0, sets: 0 }
    current.volume += set.reps * set.load
    current.sets += 1
    buckets.set(key, current)
  })
  return [...buckets.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([, value]) => value).slice(-8)
}

export function regionVolume(history: CompletedSetRecord[]): RegionVolumePoint[] {
  const buckets = new Map<string, RegionVolumePoint>()
  history.forEach((set) => {
    const current = buckets.get(set.primaryRegion) ?? { region: set.primaryRegion, volume: 0, sets: 0 }
    current.volume += set.reps * set.load
    current.sets += 1
    buckets.set(set.primaryRegion, current)
  })
  return [...buckets.values()].sort((a, b) => b.volume - a.volume)
}

export const makeSets = (count: number, reps: number, load: number, rir = 2): SetPrescription[] =>
  Array.from({ length: count }, (_, index) => ({
    id: `set-${index + 1}`,
    targetReps: reps,
    targetLoad: load,
    targetRir: rir,
    completed: false
  }))
