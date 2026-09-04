import type { LoadMode, SetEntryField, SetEntryOrigin, SetPrescription } from './types'

export type WorkoutSetEntry = Partial<Record<SetEntryField, number>>

const legacyEntry = (workSet: SetPrescription) => workSet.valuesEntered === true && workSet.entryOrigins === undefined

/** A displayed prescription is not athlete-entered evidence. */
export function hasEnteredLoadAndReps(workSet: SetPrescription, loadMode: LoadMode): boolean {
  const legacy = legacyEntry(workSet)
  const repetitionsEntered = workSet.entryOrigins?.reps !== undefined || (legacy && workSet.completedReps !== undefined)
  const loadEntered = loadMode === 'bodyweight' || workSet.entryOrigins?.load !== undefined || (legacy && workSet.completedLoad !== undefined)
  return repetitionsEntered && loadEntered
}

export function hasEnteredRir(workSet: SetPrescription): boolean {
  return workSet.entryOrigins?.rir !== undefined || (legacyEntry(workSet) && workSet.actualRir !== undefined)
}

const actualValueKey: Record<SetEntryField, 'completedLoad' | 'completedReps' | 'actualRir'> = {
  load: 'completedLoad',
  reps: 'completedReps',
  rir: 'actualRir'
}

const withEntry = (
  workSet: SetPrescription,
  data: WorkoutSetEntry,
  origin: SetEntryOrigin
): SetPrescription => {
  const entryOrigins = { ...workSet.entryOrigins }
  const updated = { ...workSet }
  let changed = false

  for (const field of ['load', 'reps', 'rir'] as const) {
    const value = data[field]
    if (value === undefined) continue
    updated[actualValueKey[field]] = value
    entryOrigins[field] = origin
    changed = true
  }

  return changed ? { ...updated, entryOrigins, valuesEntered: true } : workSet
}

const canReceiveTopSetValue = (workSet: SetPrescription, field: SetEntryField) => {
  if (workSet.completed || workSet.skipped || workSet.grouping) return false
  const origin = workSet.entryOrigins?.[field]
  if (origin === 'manual') return false
  const actualValue = workSet[actualValueKey[field]]
  return origin === 'top-set-autofill' || actualValue === undefined
}

/**
 * Records one athlete edit and uses Set 1 as a convenience template for untouched later straight sets.
 * Copied values are still only draft entries: no set is completed, skipped, or judged by this helper.
 */
export function applyWorkoutSetEntry(sets: SetPrescription[], setId: string, data: WorkoutSetEntry): SetPrescription[] {
  const editedIndex = sets.findIndex((workSet) => workSet.id === setId)
  if (editedIndex < 0) return sets

  return sets.map((workSet, index) => {
    if (index === editedIndex) return withEntry(workSet, data, 'manual')
    if (editedIndex !== 0 || index === 0) return workSet

    const eligibleData: WorkoutSetEntry = {}
    for (const field of ['load', 'reps', 'rir'] as const) {
      if (data[field] !== undefined && canReceiveTopSetValue(workSet, field)) eligibleData[field] = data[field]
    }
    return withEntry(workSet, eligibleData, 'top-set-autofill')
  })
}
