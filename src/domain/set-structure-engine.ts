import type { CompletedSetRecord, Exercise, ExerciseRole, SetGroupKind, SetGroupRole, SetPrescription } from './types'

export const SET_STRUCTURE_RULE = 'set-structure-v1'

export interface StructureGate {
  allowed: boolean
  reason: string
}

export const setStructureLabels: Record<SetGroupKind, string> = {
  superset: 'Superset',
  'drop-set': 'Drop set',
  'myo-reps': 'Myo-reps'
}

/**
 * None of these techniques belong on the primary anchor. The anchor is where placement verification
 * reads its first completed set and where the exact progression clock lives, so its exposures have to
 * stay clean and comparable. The literature also positions all three as secondary strategies for
 * accumulating volume efficiently, not as ways to perform the main strength lift.
 */
export function structureAllowedForRole(role: ExerciseRole, kind: SetGroupKind): StructureGate {
  if (role === 'primary') {
    return { allowed: false, reason: `${setStructureLabels[kind]}s are not used on the primary anchor. Its exposures stay clean so progression and route evidence remain comparable.` }
  }
  if (role === 'secondary' && kind !== 'superset') {
    return { allowed: false, reason: `${setStructureLabels[kind]}s are an accessory and tertiary tool. Secondary work still drives the primary, so it keeps straight sets.` }
  }
  return { allowed: true, reason: `${setStructureLabels[kind]} is available here.` }
}

/**
 * Agonist-antagonist pairing is what preserves volume load and lets more total repetitions be
 * completed. Pairing two movements that share a primary region concentrates fatigue on one muscle and
 * measurably reduces the volume the athlete came for, so it is refused rather than merely discouraged.
 */
export function canPairForSuperset(a: Exercise, b: Exercise): StructureGate {
  if (a.id === b.id) {
    return { allowed: false, reason: 'A movement cannot be supersetted with itself.' }
  }
  if (a.primaryRegion === b.primaryRegion) {
    return { allowed: false, reason: `Both movements train ${a.primaryRegion} first. Pairing the same muscle cuts the volume load you came for, so pair opposing work instead.` }
  }
  const push = new Set(['horizontal-push', 'vertical-push'])
  const pull = new Set(['horizontal-pull', 'vertical-pull'])
  const opposed = (push.has(a.pattern) && pull.has(b.pattern))
    || (pull.has(a.pattern) && push.has(b.pattern))
    || (a.pattern === 'squat' && b.pattern === 'hinge')
    || (a.pattern === 'hinge' && b.pattern === 'squat')
  if (opposed) {
    return { allowed: true, reason: `${a.name} and ${b.name} oppose each other, so each rests while the other works.` }
  }
  return { allowed: true, reason: `${a.name} and ${b.name} train different primary muscles, so they can share a rest window.` }
}

const withGrouping = (
  set: SetPrescription,
  groupId: string,
  groupKind: SetGroupKind,
  groupRole: SetGroupRole,
  groupPosition: number
): SetPrescription => ({ ...set, grouping: { groupId, groupKind, groupRole, groupPosition } })

/**
 * A drop set is one top set followed by immediate reduced-load work. The top set keeps the normal
 * prescription and carries progression; the drops are real training volume that does not set the next
 * target. Loads are rounded to the movement's usable increment so the drop is a weight that exists.
 */
export function buildDropSet(input: {
  topSet: SetPrescription
  groupId: string
  dropCount?: number
  dropPercent?: number
  increment?: number
}): SetPrescription[] {
  const dropCount = Math.max(1, Math.min(3, input.dropCount ?? 2))
  const dropPercent = Math.min(0.5, Math.max(0.1, input.dropPercent ?? 0.2))
  const increment = Math.max(1, input.increment ?? 5)
  // A top set with no load yet has nothing to strip from. Flooring at one increment would invent a
  // number for a movement the app has just admitted it cannot prescribe, so unknown stays unknown.
  const roundToIncrement = (load: number) => input.topSet.targetLoad <= 0 ? 0 : Math.max(increment, Math.round(load / increment) * increment)
  const drops = Array.from({ length: dropCount }, (_, index) => {
    const load = roundToIncrement(input.topSet.targetLoad * Math.pow(1 - dropPercent, index + 1))
    return withGrouping(
      { ...input.topSet, id: `${input.topSet.id}-drop-${index + 1}`, targetLoad: load, targetRir: 0, completed: false, completedLoad: undefined, completedReps: undefined, actualRir: undefined },
      input.groupId, 'drop-set', 'drop', index + 2
    )
  })
  return [withGrouping({ ...input.topSet }, input.groupId, 'drop-set', 'top', 1), ...drops]
}

/**
 * Myo-reps are an activation set taken close to failure, then short mini sets after only a few breaths.
 * The activation set carries progression. Mini sets are deliberately small and taken at zero reps in
 * reserve, which is the point of the technique rather than an accident of fatigue.
 */
export function buildMyoReps(input: {
  activationSet: SetPrescription
  groupId: string
  miniCount?: number
  miniReps?: number
}): SetPrescription[] {
  const miniCount = Math.max(2, Math.min(5, input.miniCount ?? 3))
  const miniReps = Math.max(2, Math.min(5, input.miniReps ?? 3))
  const minis = Array.from({ length: miniCount }, (_, index) => withGrouping(
    { ...input.activationSet, id: `${input.activationSet.id}-mini-${index + 1}`, targetReps: miniReps, targetRir: 0, completed: false, completedLoad: undefined, completedReps: undefined, actualRir: undefined },
    input.groupId, 'myo-reps', 'mini', index + 2
  ))
  return [withGrouping({ ...input.activationSet }, input.groupId, 'myo-reps', 'activation', 1), ...minis]
}

/**
 * Progression compares like with like. A drop or a mini set is real completed work that counts toward
 * volume, muscle dose, and exact history, but it is performed at a reduced load or a truncated rep
 * target, so treating it as a normal exposure would read a productive technique week as a regression.
 */
export function isComparableExposure(grouping?: { groupRole: SetGroupRole }): boolean {
  if (!grouping) return true
  return grouping.groupRole === 'paired' || grouping.groupRole === 'top' || grouping.groupRole === 'activation'
}

/** Estimated seconds saved against performing the same work as straight sets. */
export function structureTimeSaved(kind: SetGroupKind, setCount: number, restSeconds: number): number {
  if (kind === 'superset') return Math.round(restSeconds * 0.5 * setCount)
  return Math.round(restSeconds * 0.75 * Math.max(0, setCount - 1))
}

export const STRUCTURE_PROGRESSION_RULE = 'structure-progression-v1'

/** One completed drop set or myo-rep group, treated as a single progressible unit of work. */
export interface SetGroupSummary {
  groupId: string
  groupKind: SetGroupKind
  exerciseId: string
  sessionId: string
  completedAt: string
  setCount: number
  totalReps: number
  totalVolume: number
  topLoad: number
  topReps: number
}

/**
 * Collects completed sets into the structures they were performed in. A drop set is not three loose
 * sets, it is one block of work, and comparing it block to block is the only way its progress is
 * visible: a heavier top set, more reps across the drops, or an extra drop are all real progress that
 * a set-by-set view would miss.
 */
export function summarizeSetGroups(history: CompletedSetRecord[], exerciseId?: string): SetGroupSummary[] {
  const groups = new Map<string, SetGroupSummary>()
  for (const workSet of history) {
    if (!workSet.grouping || workSet.grouping.groupKind === 'superset') continue
    if (exerciseId && workSet.exerciseId !== exerciseId) continue
    const existing = groups.get(workSet.grouping.groupId)
    const isLead = workSet.grouping.groupRole === 'top' || workSet.grouping.groupRole === 'activation'
    if (!existing) {
      groups.set(workSet.grouping.groupId, {
        groupId: workSet.grouping.groupId,
        groupKind: workSet.grouping.groupKind,
        exerciseId: workSet.exerciseId,
        sessionId: workSet.sessionId,
        completedAt: workSet.completedAt,
        setCount: 1,
        totalReps: workSet.reps,
        totalVolume: workSet.load * workSet.reps,
        topLoad: isLead ? workSet.load : 0,
        topReps: isLead ? workSet.reps : 0
      })
      continue
    }
    existing.setCount += 1
    existing.totalReps += workSet.reps
    existing.totalVolume += workSet.load * workSet.reps
    if (isLead) {
      existing.topLoad = workSet.load
      existing.topReps = workSet.reps
    }
  }
  return [...groups.values()].sort((a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime() || a.groupId.localeCompare(b.groupId))
}

export type StructureProgressionAxis = 'load' | 'reps' | 'sets' | 'hold' | 'baseline'

export interface StructureProgressionDecision {
  ruleVersion: typeof STRUCTURE_PROGRESSION_RULE
  groupKind: SetGroupKind
  exerciseId: string
  axis: StructureProgressionAxis
  latest: SetGroupSummary | null
  prior: SetGroupSummary | null
  totalVolumeChange: number | null
  totalRepChange: number | null
  nextTopLoad: number
  nextSetCount: number
  reasons: string[]
  confidence: 'low' | 'medium' | 'high'
}

/**
 * Progresses a drop set or myo-rep block against the last time the same block was performed, following
 * the same ordering the rest of the app uses: load first, then repetitions, then an added set.
 *
 * Total work across the block is the measure, not the top set alone. Holding the top load while
 * completing more reps across the drops is genuine progress, and so is completing the same total work
 * with an extra drop. Both would be invisible if only the leading set were compared.
 */
export function progressSetStructure(input: {
  groups: SetGroupSummary[]
  increment?: number
  maximumSets?: number
}): StructureProgressionDecision | null {
  const groups = input.groups
  if (!groups.length) return null
  const latest = groups[groups.length - 1]
  const prior = [...groups].slice(0, -1).reverse().find((group) => group.groupKind === latest.groupKind) ?? null
  const increment = Math.max(1, input.increment ?? 5)
  const maximumSets = Math.max(2, input.maximumSets ?? (latest.groupKind === 'drop-set' ? 4 : 6))
  const reasons: string[] = []

  const base = {
    ruleVersion: STRUCTURE_PROGRESSION_RULE,
    groupKind: latest.groupKind,
    exerciseId: latest.exerciseId,
    latest,
    prior,
    totalVolumeChange: prior ? latest.totalVolume - prior.totalVolume : null,
    totalRepChange: prior ? latest.totalReps - prior.totalReps : null
  } as const

  if (!prior) {
    reasons.push(`First recorded ${setStructureLabels[latest.groupKind].toLowerCase()} for this movement. ${latest.totalReps} total reps across ${latest.setCount} sets is now the number to beat.`)
    return { ...base, axis: 'baseline', nextTopLoad: latest.topLoad, nextSetCount: latest.setCount, reasons, confidence: 'low' }
  }

  const volumeChange = latest.totalVolume - prior.totalVolume
  const repChange = latest.totalReps - prior.totalReps
  const loadHeld = latest.topLoad >= prior.topLoad

  if (volumeChange > 0 && loadHeld && latest.topLoad > 0) {
    reasons.push(`Total work rose from ${Math.round(prior.totalVolume).toLocaleString()} to ${Math.round(latest.totalVolume).toLocaleString()} at the same top load or better. Load goes up next time.`)
    return { ...base, axis: 'load', nextTopLoad: latest.topLoad + increment, nextSetCount: latest.setCount, reasons, confidence: 'high' }
  }

  if (repChange > 0) {
    reasons.push(`Total reps rose from ${prior.totalReps} to ${latest.totalReps} without the top load moving. Keep pushing reps across the block before adding load.`)
    return { ...base, axis: 'reps', nextTopLoad: latest.topLoad, nextSetCount: latest.setCount, reasons, confidence: 'medium' }
  }

  if (repChange === 0 && volumeChange >= 0 && latest.setCount < maximumSets) {
    reasons.push(`The block repeated at ${latest.totalReps} total reps. Adding one more ${latest.groupKind === 'drop-set' ? 'drop' : 'short set'} is the next dose that costs almost no clock.`)
    return { ...base, axis: 'sets', nextTopLoad: latest.topLoad, nextSetCount: latest.setCount + 1, reasons, confidence: 'medium' }
  }

  reasons.push(`Total work fell from ${Math.round(prior.totalVolume).toLocaleString()} to ${Math.round(latest.totalVolume).toLocaleString()}. Repeat this block before asking for more.`)
  return { ...base, axis: 'hold', nextTopLoad: latest.topLoad, nextSetCount: latest.setCount, reasons, confidence: 'medium' }
}
