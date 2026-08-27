import { describe, expect, it } from 'vitest'
import type { SetPrescription } from './types'
import { applyWorkoutSetEntry } from './set-entry-autofill'

const straightSets = (): SetPrescription[] => Array.from({ length: 4 }, (_, index) => ({
  id: `set-${index + 1}`,
  targetLoad: 100,
  targetReps: 8,
  targetRir: 2,
  completed: false
}))

describe('active-workout set entry autofill', () => {
  it('copies each Set 1 field into untouched later straight sets without completing them', () => {
    let sets = applyWorkoutSetEntry(straightSets(), 'set-1', { load: 135 })
    sets = applyWorkoutSetEntry(sets, 'set-1', { reps: 10 })
    sets = applyWorkoutSetEntry(sets, 'set-1', { rir: 4 })

    expect(sets).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'set-1', completedLoad: 135, completedReps: 10, actualRir: 4, completed: false, entryOrigins: { load: 'manual', reps: 'manual', rir: 'manual' } }),
      expect.objectContaining({ id: 'set-2', completedLoad: 135, completedReps: 10, actualRir: 4, completed: false, valuesEntered: true, entryOrigins: { load: 'top-set-autofill', reps: 'top-set-autofill', rir: 'top-set-autofill' } })
    ]))
    expect(sets.every((workSet) => !workSet.completed && !workSet.skipped)).toBe(true)
  })

  it('preserves later manual edits and completed, skipped, or structured rows', () => {
    let sets = applyWorkoutSetEntry(straightSets(), 'set-3', { reps: 7 })
    sets[1] = { ...sets[1], completed: true, completedLoad: 120 }
    sets[3] = { ...sets[3], grouping: { groupId: 'drop-1', groupKind: 'drop-set', groupRole: 'drop', groupPosition: 1 } }
    sets = applyWorkoutSetEntry(sets, 'set-1', { load: 135, reps: 10, rir: 4 })

    expect(sets[1]).toMatchObject({ completed: true, completedLoad: 120 })
    expect(sets[2]).toMatchObject({ completedLoad: 135, completedReps: 7, actualRir: 4, entryOrigins: { load: 'top-set-autofill', reps: 'manual', rir: 'top-set-autofill' } })
    expect(sets[3]).not.toHaveProperty('completedLoad')
    expect(sets[3]).not.toHaveProperty('completedReps')
    expect(sets[3]).not.toHaveProperty('actualRir')
  })

  it('refreshes prior autofill when Set 1 changes but does not overwrite an old unexplained actual value', () => {
    const legacyActual = { ...straightSets()[2], completedReps: 6 }
    let sets = applyWorkoutSetEntry([straightSets()[0], straightSets()[1], legacyActual], 'set-1', { reps: 10 })
    sets = applyWorkoutSetEntry(sets, 'set-1', { reps: 11 })

    expect(sets[1]).toMatchObject({ completedReps: 11, entryOrigins: { reps: 'top-set-autofill' } })
    expect(sets[2]).toMatchObject({ completedReps: 6 })
    expect(sets[2].entryOrigins).toBeUndefined()
  })
})
