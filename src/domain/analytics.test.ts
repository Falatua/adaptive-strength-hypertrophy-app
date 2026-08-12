import { describe, expect, it } from 'vitest'
import { analyticsReconciliation, areaVolumeFor, buildAnalytics, exerciseMixFor, plannedVsCompletedDoseFor, priorityAttentionFor } from './analytics'
import type { BodyRegion, CompletedSetRecord, Exercise, TrainingSession } from './types'

const workSet = (id: string, completedAt: Date, region: BodyRegion, load = 100, reps = 10): CompletedSetRecord => ({
  id,
  sessionId: `session-${id}`,
  exerciseId: `exercise-${region}`,
  exerciseName: `${region} movement`,
  family: `${region} family`,
  primaryRegion: region,
  completedAt: completedAt.toISOString(),
  reps,
  load,
  rir: 2,
  technique: 4,
  pain: 0,
  setIndex: 0
})

const now = new Date(2026, 7, 10, 12)
const daysAgo = (amount: number) => new Date(2026, 7, 10 - amount, 9)
const fixture = [
  workSet('today', daysAgo(0), 'chest'),
  workSet('yesterday', daysAgo(1), 'back', 120, 8),
  workSet('eight-days', daysAgo(8), 'quadriceps', 200, 5),
  workSet('forty-days', daysAgo(40), 'biceps', 30, 12),
  workSet('january', new Date(2026, 0, 5, 9), 'trunk', 45, 15),
  workSet('last-year', new Date(2025, 6, 5, 9), 'glutes', 225, 6)
]

describe('multi-horizon source-set analytics', () => {
  it('uses distinct daily, weekly, rolling, calendar-month, quarter, yearly, and all-time windows', () => {
    expect(buildAnalytics(fixture, 'today', now).setCount).toBe(1)
    expect(buildAnalytics(fixture, '7d', now).setCount).toBe(2)
    expect(buildAnalytics(fixture, '28d', now).setCount).toBe(3)
    expect(buildAnalytics(fixture, 'month', now).setCount).toBe(3)
    expect(buildAnalytics(fixture, 'quarter', now).setCount).toBe(4)
    expect(buildAnalytics(fixture, 'quarter', now).points.map((point) => point.label)).toEqual(['Jul', 'Aug'])
    expect(buildAnalytics(fixture, 'year', now).setCount).toBe(5)
    expect(buildAnalytics(fixture, 'all', now).setCount).toBe(6)
  })

  it('reconciles chart and region totals exactly to source sets', () => {
    const summary = buildAnalytics(fixture, 'year', now)
    const reconciliation = analyticsReconciliation(summary)
    expect(reconciliation.exact).toBe(true)
    expect(reconciliation.sourceVolume).toBe(fixture.slice(0, 5).reduce((sum, set) => sum + set.load * set.reps, 0))
  })

  it('keeps upper, lower, arms, and trunk areas mutually exclusive', () => {
    const areas = areaVolumeFor(fixture)
    expect(areas.map((area) => area.label).sort()).toEqual(['Arms', 'Lower body', 'Trunk', 'Upper body'])
    expect(areas.reduce((sum, area) => sum + area.volume, 0)).toBe(fixture.reduce((sum, set) => sum + set.load * set.reps, 0))
  })

  it('reports sessions, active days, repetitions, and average actual load from the selected source sets', () => {
    const summary = buildAnalytics(fixture, '7d', now)
    expect(summary.sessionCount).toBe(2)
    expect(summary.activeDays).toBe(2)
    expect(summary.totalReps).toBe(18)
    expect(summary.averageLoad).toBe(110)
  })

  it('explains exact-movement mix without turning volume share into stimulus share', () => {
    const mix = exerciseMixFor(fixture)
    expect(mix[0].name).toBe('glutes movement')
    expect(mix.reduce((sum, item) => sum + item.volumeShare, 0)).toBeCloseTo(1)
    expect(mix.reduce((sum, item) => sum + item.setShare, 0)).toBeCloseTo(1)
    expect(mix.every((item) => item.sessions === 1)).toBe(true)
  })

  it('shows goal-relative attention as evidence states rather than declaring neglect', () => {
    const attention = priorityAttentionFor({
      selectedHistory: fixture.slice(0, 2),
      allHistory: fixture,
      priorityRegions: ['chest', 'quadriceps', 'calves'],
      now
    })
    expect(attention.map((item) => [item.region, item.status])).toEqual([
      ['chest', 'represented'], ['quadriceps', 'outside-window'], ['calves', 'no-history']
    ])
    expect(attention[0].contributingExercises).toEqual(['chest movement'])
    expect(attention[1].daysSinceLastExposure).toBe(8)
  })

  it('compares only completed sets linked to stored plans and preserves unlinked history', () => {
    const exercise: Exercise = {
      id: 'planned-chest', name: 'Planned Chest', family: 'Press', aliases: [], pattern: 'horizontal-push', regions: ['chest'], primaryRegion: 'chest',
      equipment: ['barbell'], description: 'Test movement', roleTags: [], favorite: false, jointFeeling: 'neutral'
    }
    const session: TrainingSession = {
      id: 'planned-session', title: 'Plan', objective: 'Test dose', dayLabel: 'Today', plannedDate: now.toISOString(), status: 'partial-primary', durationMinutes: 30,
      exercises: [{ id: 'planned-exercise', exerciseId: exercise.id, role: 'primary', purpose: 'Test', restSeconds: 90, estimatedMinutes: 10, optional: false, sets: [
        { id: 'target-1', targetReps: 10, targetLoad: 100, targetRir: 2, completed: true },
        { id: 'target-2', targetReps: 10, targetLoad: 100, targetRir: 2, completed: false }
      ] }]
    }
    const linked = { ...workSet('linked', now, 'chest', 90, 10), sessionId: session.id, exerciseId: exercise.id, plannedExerciseId: 'planned-exercise' }
    const unlinked = workSet('unlinked', now, 'back', 120, 8)
    const dose = plannedVsCompletedDoseFor({ sessions: [session], history: [linked, unlinked], exercises: [exercise], range: 'today', now, focusRegions: ['triceps'] })
    expect(dose).toMatchObject({ plannedSets: 2, plannedVolumeKnown: 2000, linkedCompletedSets: 1, linkedCompletedVolume: 900, unlinkedCompletedSets: 1, unlinkedCompletedVolume: 960 })
    expect(dose.regions.find((point) => point.region === 'chest')).toMatchObject({ completedSets: 1, completionRate: 0.5, status: 'below-plan' })
    expect(dose.regions.find((point) => point.region === 'triceps')).toMatchObject({ plannedSets: 0, completedSets: 0, status: 'no-dose' })
  })

  it('keeps unknown planned loads out of known planned volume and excludes future plans', () => {
    const exercise: Exercise = {
      id: 'bodyweight-core', name: 'Core', family: 'Trunk', aliases: [], pattern: 'carry', regions: ['trunk'], primaryRegion: 'trunk',
      equipment: ['bodyweight'], description: 'Test movement', roleTags: [], favorite: false, jointFeeling: 'neutral'
    }
    const makeSession = (id: string, plannedDate: Date): TrainingSession => ({
      id, title: 'Plan', objective: 'Test', dayLabel: 'Plan', plannedDate: plannedDate.toISOString(), status: 'planned', durationMinutes: 10,
      exercises: [{ id: `${id}-exercise`, exerciseId: exercise.id, role: 'tertiary', purpose: 'Test', restSeconds: 60, estimatedMinutes: 5, optional: true,
        sets: [{ id: `${id}-set`, targetReps: 10, targetLoad: 0, targetRir: 3, completed: false }] }]
    })
    const dose = plannedVsCompletedDoseFor({ sessions: [makeSession('today-plan', now), makeSession('future-plan', daysAgo(-1))], history: [], exercises: [exercise], range: 'today', now })
    expect(dose).toMatchObject({ plannedSets: 1, plannedVolumeKnown: 0, unknownLoadSets: 1, linkedCompletedSets: 0 })
    expect(dose.regions[0]).toMatchObject({ status: 'below-plan', unknownLoadSets: 1 })
  })
})
