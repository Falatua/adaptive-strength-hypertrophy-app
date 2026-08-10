import { describe, expect, it } from 'vitest'
import { athlete, exercises, history, sessions } from './seed'
import { derivePersonalRecords, findExerciseDuplicatePairs, historyVolume, projectExerciseMerge } from './history-engine'

describe('source history replay', () => {
  it('derives every record from exact supporting set IDs', () => {
    const records = derivePersonalRecords(history)
    const sourceIds = new Set(history.map((workSet) => workSet.id))
    expect(records.length).toBeGreaterThan(0)
    expect(records.every((record) => record.sourceSetIds.length > 0 && record.sourceSetIds.every((id) => sourceIds.has(id)))).toBe(true)
  })

  it('removes a false load record after its source set is corrected', () => {
    const template = history.find((workSet) => workSet.exerciseId === 'competition-bench')!
    const workSets = [{ ...template, id: 'ordinary-set', load: 180 }, { ...template, id: 'false-record-set', load: 500, completedAt: '2026-08-10T12:00:00.000Z' }]
    const peak = [...workSets].sort((a, b) => b.load - a.load)[0]
    const before = derivePersonalRecords(workSets).find((record) => record.type === 'load')
    const corrected = workSets.map((workSet) => workSet.id === peak.id ? { ...workSet, load: 1 } : workSet)
    const after = derivePersonalRecords(corrected).find((record) => record.type === 'load')
    expect(after?.value).toBeLessThan(before?.value ?? 0)
    expect(after?.sourceSetIds).not.toContain(peak.id)
  })

  it('reconciles an exact deletion delta', () => {
    const removed = history[0]
    const after = history.filter((workSet) => workSet.id !== removed.id)
    expect(historyVolume(history) - historyVolume(after)).toBe(removed.load * removed.reps)
  })
})

describe('duplicate identity control', () => {
  const duplicateA = { ...structuredClone(exercises[0]), id: 'incline-bench-a', name: 'Incline Bench Press', aliases: [] }
  const duplicateB = { ...structuredClone(exercises[0]), id: 'incline-bench-b', name: 'Barbell Incline Bench Press', aliases: ['Incline Bench'] }

  it('finds deterministic probable duplicate pairs', () => {
    const pairs = findExerciseDuplicatePairs([duplicateA, duplicateB])
    expect(pairs).toHaveLength(1)
    expect(pairs[0].score).toBeGreaterThanOrEqual(0.7)
  })

  it('merges history while preserving original entered identity', () => {
    const sourceSet = { ...history[0], id: 'source-set', exerciseId: duplicateB.id, exerciseName: duplicateB.name }
    const projection = projectExerciseMerge({
      exercises: [duplicateA, duplicateB], history: [sourceSet], sessions: [], athlete: { ...athlete, strengthAnchors: [duplicateB.id] },
      sourceIds: [duplicateB.id], targetId: duplicateA.id
    })
    expect(projection.history[0]).toMatchObject({ exerciseId: duplicateA.id, exerciseName: duplicateA.name, originalExerciseId: duplicateB.id, originalExerciseName: duplicateB.name })
    expect(projection.exercises.find((exercise) => exercise.id === duplicateB.id)).toMatchObject({ retired: true, mergedIntoId: duplicateA.id })
    expect(projection.athlete.strengthAnchors).toEqual([duplicateA.id])
  })

  it('updates only future plan references', () => {
    const future = { ...structuredClone(sessions[0]), id: 'future', status: 'planned' as const, exercises: [{ ...structuredClone(sessions[0].exercises[0]), exerciseId: duplicateB.id }] }
    const completed = { ...structuredClone(future), id: 'completed', status: 'completed' as const }
    const projection = projectExerciseMerge({ exercises: [duplicateA, duplicateB], history: [], sessions: [future, completed], athlete, sourceIds: [duplicateB.id], targetId: duplicateA.id })
    expect(projection.sessions[0].exercises[0].exerciseId).toBe(duplicateA.id)
    expect(projection.sessions[1].exercises[0].exerciseId).toBe(duplicateB.id)
  })

  it('leaves input objects untouched so an undo snapshot remains exact', () => {
    const original = structuredClone([duplicateA, duplicateB])
    projectExerciseMerge({ exercises: original, history: [], sessions: [], athlete, sourceIds: [duplicateB.id], targetId: duplicateA.id })
    expect(original[1].retired).toBeUndefined()
    expect(original[0].aliases).not.toContain(duplicateB.name)
  })
})
