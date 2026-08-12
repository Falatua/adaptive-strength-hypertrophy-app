import type { Exercise, ExerciseRole, SetGroupKind, SetGroupRole, SetPrescription } from './types'

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
