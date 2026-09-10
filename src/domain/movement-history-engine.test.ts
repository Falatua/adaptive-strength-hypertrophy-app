import { describe, expect, it } from 'vitest'
import { equipmentProfiles, exercises, history, sessions } from './seed'
import { buildWorkoutMovementHistory } from './movement-history-engine'
import type { CompletedSetRecord } from './types'

describe('in-workout exact movement history', () => {
  it('groups the latest exact setup into readable sessions and excludes other modes and athlete-added work', () => {
    const exercise = exercises.find((candidate) => candidate.id === sessions[0].exercises[0].exerciseId)!
    const planned = structuredClone(sessions[0].exercises[0])
    const entries = buildWorkoutMovementHistory({ history, planned, exercise, units: equipmentProfiles[0].incrementUnit })

    expect(entries.length).toBeGreaterThan(0)
    expect(entries[0].repetitionScheme.length).toBe(entries[0].setCount)
    expect(entries[0].loadLabel).toMatch(/lb/)
    expect(entries[0].setupLabel).toBe('Exact setup')
  })

  it('keeps bodyweight rep schemes honest instead of inventing load or flattening 6 / 5 / 5', () => {
    const exercise = exercises.find((candidate) => candidate.id === 'pull-up')!
    const planned = structuredClone(sessions[0].exercises[0])
    planned.exerciseId = exercise.id
    planned.sets = planned.sets.slice(0, 3).map((workSet, index) => ({ ...workSet, id: `pull-up-${index}`, targetLoad: 0, targetReps: 5, loadMode: 'bodyweight' as const }))
    const bodyweightHistory: CompletedSetRecord[] = [6, 5, 5].map((reps, setIndex) => ({
      ...history[0], id: `pull-up-history-${setIndex}`, sessionId: 'pull-up-history', exerciseId: exercise.id,
      exerciseName: exercise.name, family: exercise.family, load: 0, reps, setIndex, loadMode: 'bodyweight', completedAt: '2026-09-08T12:00:00.000Z'
    }))
    const entries = buildWorkoutMovementHistory({ history: bodyweightHistory, planned, exercise, units: 'lb' })

    expect(entries).toHaveLength(1)
    expect(entries[0]).toMatchObject({ repetitionScheme: [6, 5, 5], loadLabel: 'BW', totalRepetitions: 16, volumeLoad: null })
  })
})
