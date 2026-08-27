import type { CompletedSetRecord, Exercise, PlannedExercise, SetPrescription } from './types'

/** Current ABX back-pad positions. Convenient presets, never a restriction. */
export const ABX_BACK_PAD_ANGLES = [0, 15, 22, 30, 37, 45, 52, 60, 67, 75, 85] as const

export const supportsBenchAngle = (exercise: Exercise) => {
  const identity = [exercise.name, exercise.family, ...exercise.aliases, exercise.description].join(' ').toLowerCase()
  const usesAdjustableBench = exercise.equipment.some((item) => item.toLowerCase().includes('adjustable bench'))
  return usesAdjustableBench && /incline|chest-supported|chest supported|prone|bench angle/.test(identity)
}

export const normalizeBenchAngle = (value: number | null | undefined) => {
  if (value === null || value === undefined || !Number.isFinite(value)) return undefined
  return Math.round(Math.min(90, Math.max(0, value)) * 10) / 10
}

export const benchAngleLabel = (angle: number | undefined) => angle === undefined ? 'Angle untracked' : `${angle}° bench`

export const benchAngleKey = (set: Pick<CompletedSetRecord, 'benchAngleDeg'> | Pick<SetPrescription, 'benchAngleDeg'>) =>
  set.benchAngleDeg === undefined ? 'untracked' : `angle-${String(set.benchAngleDeg).replace('.', '_')}`

export const comparableAngleHistory = (history: CompletedSetRecord[], planned: PlannedExercise) => {
  const keys = new Set(planned.sets.map(benchAngleKey))
  if (keys.size !== 1) return []
  const key = [...keys][0]
  return history.filter((workSet) => benchAngleKey(workSet) === key)
}

const ladderPool = [15, 22, 30, 37, 45]

export const buildBenchAngleLadder = (setCount: number, direction: 'high-to-low' | 'low-to-high') => {
  if (setCount <= 0) return []
  const values = Array.from({ length: setCount }, (_, index) => {
    const poolIndex = setCount === 1 ? 2 : Math.round(index * (ladderPool.length - 1) / (setCount - 1))
    return ladderPool[poolIndex]
  })
  return direction === 'high-to-low' ? values.reverse() : values
}
