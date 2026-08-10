import { describe, expect, it } from 'vitest'
import { builtInMuscleCredits, filterMuscleDose, muscleDoseFor } from './muscle-dose'
import { exercises } from './seed'
import type { CompletedSetRecord } from './types'

const setFor = (id: string, exerciseId: string, exerciseName = exerciseId): CompletedSetRecord => ({
  id,
  sessionId: 'session',
  exerciseId,
  exerciseName,
  family: 'Test',
  primaryRegion: 'chest',
  completedAt: `2026-08-${id === 'bench-1' ? '09' : '10'}T12:00:00.000Z`,
  reps: 10,
  load: 100,
  rir: 2,
  technique: 4,
  pain: 0,
  setIndex: 0
})

describe('muscle-dose-v1', () => {
  it('maps every built-in exercise explicitly and leaves no silent fallback', () => {
    expect(Object.keys(builtInMuscleCredits).sort()).toEqual(exercises.map((exercise) => exercise.id).sort())
  })

  it('separates direct and fractional set-equivalents without changing completed source sets', () => {
    const summary = muscleDoseFor([
      setFor('bench-1', 'competition-bench', 'Competition Bench Press'),
      setFor('bench-2', 'competition-bench', 'Competition Bench Press'),
      setFor('curl-1', 'hammer-curl', 'Cross-Body Hammer Curl')
    ])
    expect(summary).toMatchObject({
      ruleVersion: 'muscle-dose-v1',
      sourceSetCount: 3,
      mappedSourceSetCount: 3,
      unmappedSourceSetCount: 0,
      directSetEquivalents: 3,
      fractionalSetEquivalents: 2.5,
      totalMuscleSetEquivalents: 5.5
    })
    expect(summary.muscles.find((point) => point.muscle === 'pectorals')).toMatchObject({ directDose: 2, fractionalDose: 0, sourceSetCount: 2 })
    expect(summary.muscles.find((point) => point.muscle === 'triceps')).toMatchObject({ directDose: 0, fractionalDose: 1, sourceSetCount: 2 })
    expect(summary.muscles.find((point) => point.muscle === 'biceps')).toMatchObject({ directDose: 1, fractionalDose: 0, sourceSetCount: 1 })
  })

  it('conserves each source set once inside parent rollups while keeping muscles non-additive', () => {
    const summary = muscleDoseFor([
      setFor('bench-1', 'competition-bench'),
      setFor('row-1', 'cambered-row'),
      setFor('sumo-1', 'sumo-deadlift')
    ])
    expect(summary.totalMuscleSetEquivalents).toBeGreaterThan(summary.sourceSetCount)
    expect(summary.areas.find((area) => area.lens === 'whole')).toMatchObject({ conservedDose: 3, sourceSetCount: 3 })
    expect(summary.areas.find((area) => area.lens === 'upper')).toMatchObject({ conservedDose: 2, sourceSetCount: 2 })
    expect(summary.areas.find((area) => area.lens === 'arms')).toMatchObject({ conservedDose: 1, sourceSetCount: 2 })
    expect(summary.areas.find((area) => area.lens === 'lower')).toMatchObject({ conservedDose: 1, sourceSetCount: 1 })
    expect(summary.areas.find((area) => area.lens === 'trunk')).toMatchObject({ conservedDose: 1, sourceSetCount: 2 })
  })

  it('surfaces unmapped custom exercises instead of inventing muscle credit', () => {
    const summary = muscleDoseFor([setFor('custom-1', 'custom-ring-press', 'Ring Press Arc')])
    expect(summary).toMatchObject({ mappedSourceSetCount: 0, unmappedSourceSetCount: 1, totalMuscleSetEquivalents: 0 })
    expect(summary.unmappedExerciseNames).toEqual(['Ring Press Arc'])
    expect(summary.muscles).toHaveLength(17)
    expect(summary.muscles.every((point) => point.totalDose === 0 && point.sourceSetCount === 0)).toBe(true)
  })

  it('filters individual muscle evidence by upper, lower, arms, and trunk lenses', () => {
    const summary = muscleDoseFor([setFor('bench-1', 'competition-bench'), setFor('sumo-1', 'sumo-deadlift')])
    expect(filterMuscleDose(summary.muscles, 'arms').map((point) => point.muscle)).toEqual(['triceps', 'biceps', 'forearms'])
    expect(filterMuscleDose(summary.muscles, 'lower').map((point) => point.muscle)).toEqual(expect.arrayContaining(['gluteals', 'quadriceps', 'hamstrings', 'adductors']))
    expect(filterMuscleDose(summary.muscles, 'trunk').map((point) => point.muscle)).toEqual(expect.arrayContaining(['spinal-erectors', 'abdominals', 'obliques']))
  })
})
