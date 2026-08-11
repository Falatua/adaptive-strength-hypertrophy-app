import { describe, expect, it } from 'vitest'
import { filterMuscleDose, muscleCreditsFor, muscleDoseFor, plannedMuscleDoseFor } from './muscle-dose'
import { exercises } from './seed'
import type { CompletedSetRecord, Exercise, TrainingSession } from './types'

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
  it('maps every built-in exercise through the protected catalog taxonomy', () => {
    expect(exercises.every((exercise) => Object.keys(muscleCreditsFor(exercise.id, exercises) ?? {}).length > 0)).toBe(true)
    expect(muscleCreditsFor('leg-press-45', exercises)).toMatchObject({ quadriceps: 1, gluteals: 0.5 })
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

  it('uses an athlete-reviewed custom mapping and never infers an unmapped custom movement', () => {
    const reviewed: Exercise = {
      ...structuredClone(exercises[0]), id: 'custom-ring-press', name: 'Ring Press Arc', custom: true,
      muscleMapping: { ruleVersion: 'exercise-muscle-map-v1', direct: 'pectorals', secondary: ['triceps'], source: 'athlete', reviewedAt: '2026-08-10T12:00:00.000Z' }
    }
    const unmapped: Exercise = { ...structuredClone(reviewed), id: 'custom-unmapped', name: 'Unmapped Press', muscleMapping: undefined }
    const summary = muscleDoseFor([setFor('custom-1', reviewed.id, reviewed.name), setFor('custom-2', unmapped.id, unmapped.name)], [...exercises, reviewed, unmapped])
    expect(summary).toMatchObject({ mappedSourceSetCount: 1, unmappedSourceSetCount: 1, directSetEquivalents: 1, fractionalSetEquivalents: 0.5 })
    expect(summary.muscles.find((point) => point.muscle === 'pectorals')).toMatchObject({ directDose: 1 })
    expect(summary.muscles.find((point) => point.muscle === 'triceps')).toMatchObject({ fractionalDose: 0.5 })
    expect(summary.unmappedExerciseNames).toEqual(['Unmapped Press'])
  })

  it('compares mapped planned muscle credit only with session-linked completed source sets', () => {
    const bench = exercises.find((exercise) => exercise.id === 'competition-bench')!
    const custom: Exercise = {
      ...structuredClone(bench), id: 'custom-lateral', name: 'Custom Lateral Press', custom: true,
      muscleMapping: { ruleVersion: 'exercise-muscle-map-v1', direct: 'lateral-deltoids', secondary: ['triceps'], source: 'athlete', reviewedAt: '2026-08-10T12:00:00.000Z' }
    }
    const unmapped: Exercise = { ...structuredClone(custom), id: 'custom-unknown', name: 'Unknown Custom', muscleMapping: undefined }
    const session: TrainingSession = {
      id: 'planned-muscle-session', title: 'Muscle plan', objective: 'Test', dayLabel: 'Today', plannedDate: '2026-08-10T12:00:00.000Z', status: 'planned', durationMinutes: 30,
      exercises: [
        { id: 'planned-bench', exerciseId: bench.id, role: 'primary', purpose: 'Test', restSeconds: 90, estimatedMinutes: 10, optional: false, sets: [
          { id: 'bench-target-1', targetReps: 5, targetLoad: 100, targetRir: 2, completed: true },
          { id: 'bench-target-2', targetReps: 5, targetLoad: 100, targetRir: 2, completed: false }
        ] },
        { id: 'planned-custom', exerciseId: custom.id, role: 'priority', purpose: 'Test', restSeconds: 60, estimatedMinutes: 5, optional: false, sets: [{ id: 'bench-target-1', targetReps: 10, targetLoad: 20, targetRir: 2, completed: true }] },
        { id: 'planned-unmapped', exerciseId: unmapped.id, role: 'optional', purpose: 'Test', restSeconds: 60, estimatedMinutes: 5, optional: true, sets: [{ id: 'bench-target-1', targetReps: 10, targetLoad: 20, targetRir: 2, completed: false }] }
      ]
    }
    const linkedBench = { ...setFor('linked-bench', bench.id, bench.name), sessionId: session.id, plannedExerciseId: 'planned-bench' }
    const linkedCustom = { ...setFor('linked-custom', custom.id, custom.name), sessionId: session.id, plannedExerciseId: 'planned-custom' }
    const unlinked = setFor('unlinked', bench.id, bench.name)
    const dose = plannedMuscleDoseFor({ sessions: [session], history: [linkedBench, linkedCustom, unlinked], exercises: [...exercises, custom, unmapped], range: 'today', now: new Date('2026-08-10T18:00:00.000Z') })
    expect(dose).toMatchObject({ plannedSourceSetCount: 4, plannedMappedSetCount: 3, plannedUnmappedSetCount: 1, linkedCompletedSetCount: 2, linkedCompletedMappedSetCount: 2, unlinkedCompletedSetCount: 1 })
    expect(dose.points.find((point) => point.muscle === 'pectorals')).toMatchObject({ plannedTotal: 2, completedTotal: 1, completionRate: 0.5, status: 'below-plan' })
    expect(dose.points.find((point) => point.muscle === 'lateral-deltoids')).toMatchObject({ plannedTotal: 1, completedTotal: 1, completionRate: 1, status: 'within-plan' })
    expect(dose.points.find((point) => point.muscle === 'triceps')).toMatchObject({ plannedTotal: 1.5, completedTotal: 1, status: 'below-plan' })
    expect(dose.plannedUnmappedExerciseNames).toEqual(['Unknown Custom'])
  })
})
