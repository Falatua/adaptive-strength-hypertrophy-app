import { describe, expect, it } from 'vitest'
import { buildPlanExecutionAnalysis, buildTrainingRhythm } from './training-analysis-engine'
import { exercises } from './seed'
import type { CompletedSetRecord, TrainingSession } from './types'

const completedSet = (id: string, completedAt: string, overrides: Partial<CompletedSetRecord> = {}): CompletedSetRecord => ({
  id,
  sessionId: 'session-1',
  exerciseId: 'competition-bench',
  exerciseName: 'Competition Bench Press',
  family: 'Barbell Bench Press',
  primaryRegion: 'chest',
  completedAt,
  reps: 5,
  load: 100,
  rir: 2,
  rirKnown: true,
  numbersEntered: true,
  technique: 4,
  pain: 0,
  qualityConfirmed: true,
  setIndex: 0,
  plannedExerciseId: 'planned-bench',
  ...overrides
})

const session: TrainingSession = {
  id: 'session-1',
  title: 'Upper route',
  objective: 'Progress the press',
  dayLabel: 'Day 1',
  plannedDate: '2026-08-10T09:00:00.000Z',
  status: 'completed',
  durationMinutes: 50,
  exercises: [{
    id: 'planned-bench', exerciseId: 'competition-bench', role: 'primary', purpose: 'Strength', restSeconds: 180, estimatedMinutes: 20, optional: false,
    sets: [
      { id: 'target-1', targetLoad: 100, targetReps: 5, targetRir: 2, completed: true },
      { id: 'target-2', targetLoad: 100, targetReps: 5, targetRir: 2, completed: true }
    ]
  }]
}

describe('training rhythm and muscle recency', () => {
  it('counts distinct trained days and preserves each calendar-day gap', () => {
    const history = [
      completedSet('day-1-a', '2026-08-01T08:00:00.000Z'),
      completedSet('day-1-b', '2026-08-01T09:00:00.000Z', { setIndex: 1 }),
      completedSet('day-4', '2026-08-04T08:00:00.000Z'),
      completedSet('day-10', '2026-08-10T08:00:00.000Z')
    ]
    const rhythm = buildTrainingRhythm({ history, exercises, now: new Date('2026-08-12T12:00:00.000Z') })
    expect(rhythm).toMatchObject({ totalTrainingDays: 3, daysSinceLastTraining: 2, latestGapDays: 6, averageGapDays: 4.5, longestGapDays: 6 })
    expect(rhythm.recentTrainingDays.map((day) => [day.dayKey, day.gapFromPriorDays])).toEqual([
      ['2026-08-10', 6], ['2026-08-04', 3], ['2026-08-01', null]
    ])
  })

  it('tracks direct and assisting muscle recency without inventing unmapped credit', () => {
    const history = [
      completedSet('bench-old', '2026-08-01T08:00:00.000Z'),
      completedSet('bench-new', '2026-08-10T08:00:00.000Z'),
      completedSet('unknown', '2026-08-11T08:00:00.000Z', { exerciseId: 'custom-unmapped', exerciseName: 'Custom Unmapped' })
    ]
    const rhythm = buildTrainingRhythm({ history, exercises, now: new Date('2026-08-12T12:00:00.000Z') })
    expect(rhythm).toMatchObject({ mappedSetCount: 2, unmappedSetCount: 1 })
    expect(rhythm.muscles.find((point) => point.muscle === 'pectorals')).toMatchObject({ exposureDays: 2, directSetCount: 2, daysSinceLastExposure: 2, latestGapDays: 9, latestCredit: 'direct' })
    expect(rhythm.muscles.find((point) => point.muscle === 'triceps')).toMatchObject({ secondarySetCount: 2, latestCredit: 'secondary' })
  })
})

describe('planned versus actual execution', () => {
  it('compares entered load, reps, and RIR to the exact planned set', () => {
    const history = [
      completedSet('set-1', '2026-08-10T10:00:00.000Z', { load: 105, reps: 6, rir: 2, setIndex: 0 }),
      completedSet('set-2', '2026-08-10T10:05:00.000Z', { load: 105, reps: 5, rir: 2, setIndex: 1 })
    ]
    const analysis = buildPlanExecutionAnalysis({ sessions: [session], history, exercises, range: 'today', now: new Date('2026-08-10T18:00:00.000Z') })
    expect(analysis).toMatchObject({ plannedSets: 2, completedPlannedSets: 2, enteredNumberSets: 2, unknownNumberSets: 0, rirKnownSets: 2 })
    expect(analysis.load).toMatchObject({ comparableSets: 2, higher: 2, averageDelta: 5 })
    expect(analysis.reps).toMatchObject({ higher: 1, same: 1, averageDelta: 0.5 })
    expect(analysis.rir).toMatchObject({ same: 2, averageDelta: 0 })
    expect(analysis.movements[0]).toMatchObject({ signal: 'supports-review', plannedReps: 10, actualEnteredReps: 11 })
  })

  it('does not mistake fallback targets or athlete-added work for progression evidence', () => {
    const withAdded = structuredClone(session)
    withAdded.exercises[0].sets.push({ id: 'bonus-target', targetLoad: 100, targetReps: 5, targetRir: 2, completed: true, athleteAdded: true })
    const history = [
      completedSet('set-1', '2026-08-10T10:00:00.000Z', { numbersEntered: false, rirKnown: false }),
      completedSet('bonus', '2026-08-10T10:05:00.000Z', { setIndex: 2, athleteAdded: true })
    ]
    const analysis = buildPlanExecutionAnalysis({ sessions: [withAdded], history, exercises, range: 'today', now: new Date('2026-08-10T18:00:00.000Z') })
    expect(analysis).toMatchObject({ plannedSets: 2, completedPlannedSets: 1, unplannedCompletedSets: 1, enteredNumberSets: 0, unknownNumberSets: 1, rirKnownSets: 0 })
    expect(analysis.movements[0].signal).toBe('below-plan')
  })

  it('keeps a load-to-establish target out of load-difference evidence', () => {
    const baseline = structuredClone(session)
    baseline.exercises[0].sets[0].targetLoad = 0
    const analysis = buildPlanExecutionAnalysis({
      sessions: [baseline],
      history: [completedSet('set-1', '2026-08-10T10:00:00.000Z', { load: 95 })],
      exercises,
      range: 'today',
      now: new Date('2026-08-10T18:00:00.000Z')
    })
    expect(analysis.load).toMatchObject({ comparableSets: 0, averageDelta: null })
  })

  it('flags a bigger number paired with lower RIR as harder, not clean progression', () => {
    const history = [
      completedSet('set-1', '2026-08-10T10:00:00.000Z', { load: 105, rir: 1, setIndex: 0 }),
      completedSet('set-2', '2026-08-10T10:05:00.000Z', { load: 105, rir: 1, setIndex: 1 })
    ]
    const analysis = buildPlanExecutionAnalysis({ sessions: [session], history, exercises, range: 'today', now: new Date('2026-08-10T18:00:00.000Z') })
    expect(analysis.movements[0]).toMatchObject({ signal: 'harder-than-planned' })
    expect(analysis.movements[0].interpretation).toMatch(/Do not treat the bigger number alone/)
  })

  it('counts only unfinished targets as pending during an active workout', () => {
    const active = structuredClone(session)
    active.status = 'active'
    const analysis = buildPlanExecutionAnalysis({
      sessions: [active],
      history: [completedSet('set-1', '2026-08-10T10:00:00.000Z')],
      exercises,
      range: 'today',
      now: new Date('2026-08-10T18:00:00.000Z')
    })
    expect(analysis.movements[0]).toMatchObject({ plannedSets: 2, completedPlannedSets: 1, pendingPlannedSets: 1, signal: 'insufficient-evidence' })
  })
})
