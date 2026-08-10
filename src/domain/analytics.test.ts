import { describe, expect, it } from 'vitest'
import { analyticsReconciliation, areaVolumeFor, buildAnalytics, exerciseMixFor, priorityAttentionFor } from './analytics'
import type { BodyRegion, CompletedSetRecord } from './types'

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
})
