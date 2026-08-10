import { describe, expect, it } from 'vitest'
import type { CompletedSetRecord, TrainingSession } from './types'
import { buildCalendarMonth, buildExerciseExposureSequence, buildFixedEventCountdown } from './timeline-engine'

const session = (overrides: Partial<TrainingSession> = {}): TrainingSession => ({
  id: 'bench-session', title: 'Bench day', objective: 'Bench', dayLabel: 'Day 1', plannedDate: '2026-08-03T12:00:00.000Z',
  status: 'completed', durationMinutes: 60, exercises: [{ id: 'bench-slot', exerciseId: 'competition-bench', role: 'primary', purpose: 'Strength', sets: [], restSeconds: 180, estimatedMinutes: 20, optional: false }],
  completedAt: '2026-08-05T12:00:00.000Z', ...overrides
})

const set = (overrides: Partial<CompletedSetRecord> = {}): CompletedSetRecord => ({
  id: 'set-1', sessionId: 'bench-session', exerciseId: 'competition-bench', exerciseName: 'Competition Bench Press', family: 'Bench Press', primaryRegion: 'chest',
  completedAt: '2026-08-05T12:00:00.000Z', reps: 5, load: 200, rir: 2, technique: 4, pain: 0, qualityConfirmed: true, setIndex: 0, ...overrides
})

describe('calendar and exposure timelines', () => {
  it('keeps the planned date and actual completion date linked without collapsing calendar drift', () => {
    const view = buildCalendarMonth({ sessions: [session()], history: [set(), set({ id: 'set-2', setIndex: 1 })], month: new Date(2026, 7, 1), now: new Date(2026, 7, 10) })
    const plannedDay = view.days.find((day) => day.key === '2026-08-03')!
    const actualDay = view.days.find((day) => day.key === '2026-08-05')!
    expect(plannedDay.plans[0]).toMatchObject({ sessionId: 'bench-session', actualDayKey: '2026-08-05', driftDays: 2 })
    expect(actualDay.completions[0]).toMatchObject({ plannedDayKey: '2026-08-03', driftDays: 2, completedSets: 2, volumeLoad: 2000 })
    expect(view).toMatchObject({ plannedOpportunityCount: 1, completedActivityCount: 1, completedSetCount: 2, volumeLoad: 2000 })
  })

  it('shows moved opportunities and preserves imported or otherwise unlinked completed activity', () => {
    const moved = session({ id: 'moved-session', title: 'Moved squat', plannedDate: '2026-08-07T12:00:00.000Z', status: 'deferred', completedAt: undefined })
    const imported = set({ id: 'import-1', sessionId: 'import-session', completedAt: '2026-08-09T12:00:00.000Z', importBatchId: 'batch-1' })
    const view = buildCalendarMonth({ sessions: [moved], history: [imported], month: new Date(2026, 7, 1), now: new Date(2026, 7, 10) })
    expect(view.days.find((day) => day.key === '2026-08-07')).toMatchObject({ missedOrMovedCount: 1, plans: [{ status: 'deferred' }] })
    expect(view.days.find((day) => day.key === '2026-08-09')?.completions[0]).toMatchObject({ linkedToStoredSession: false, imported: true, title: 'Imported training' })
  })

  it('builds an exact-movement exposure sequence with calendar gaps and load-first change labels', () => {
    const history = [
      set({ id: 'a1', sessionId: 'a', completedAt: '2026-08-01T12:00:00.000Z', load: 195, reps: 5 }),
      set({ id: 'a2', sessionId: 'a', completedAt: '2026-08-01T12:00:00.000Z', load: 195, reps: 5, setIndex: 1 }),
      set({ id: 'b1', sessionId: 'b', completedAt: '2026-08-10T12:00:00.000Z', load: 200, reps: 4 }),
      set({ id: 'other', sessionId: 'b', exerciseId: 'two-board-press', exerciseName: 'Two-Board Press', completedAt: '2026-08-10T12:00:00.000Z' })
    ]
    const exposures = buildExerciseExposureSequence(history, 'competition-bench')
    expect(exposures).toHaveLength(2)
    expect(exposures[0]).toMatchObject({ sequence: 1, changeKind: 'baseline', completedSets: 2, heaviestLoad: 195 })
    expect(exposures[1]).toMatchObject({ sequence: 2, daysSincePrior: 9, changeKind: 'load', changeLabel: '+5 heaviest load', heaviestLoad: 200 })
    expect(exposures[1].sourceSetIds).toEqual(['b1'])
  })

  it('uses repetitions, then sets, then volume as descriptive changes when load does not rise', () => {
    const exposures = buildExerciseExposureSequence([
      set({ id: 'a', sessionId: 'a', completedAt: '2026-08-01T12:00:00.000Z', load: 200, reps: 5 }),
      set({ id: 'b', sessionId: 'b', completedAt: '2026-08-02T12:00:00.000Z', load: 200, reps: 6 }),
      set({ id: 'c1', sessionId: 'c', completedAt: '2026-08-03T12:00:00.000Z', load: 200, reps: 6 }),
      set({ id: 'c2', sessionId: 'c', completedAt: '2026-08-03T12:00:00.000Z', load: 190, reps: 6, setIndex: 1 }),
      set({ id: 'd1', sessionId: 'd', completedAt: '2026-08-04T12:00:00.000Z', load: 200, reps: 6 }),
      set({ id: 'd2', sessionId: 'd', completedAt: '2026-08-04T12:00:00.000Z', load: 195, reps: 7, setIndex: 1 })
    ], 'competition-bench')
    expect(exposures.map((point) => point.changeKind)).toEqual(['baseline', 'repetitions', 'sets', 'volume'])
  })

  it('derives a fixed-event countdown only from a valid explicit ISO date', () => {
    expect(buildFixedEventCountdown('Powerlifting meet · 2026-08-20', new Date(2026, 7, 10))).toMatchObject({ state: 'upcoming', date: '2026-08-20', daysRemaining: 10 })
    expect(buildFixedEventCountdown('Powerlifting meet · 2026-08-10', new Date(2026, 7, 10))).toMatchObject({ state: 'today', daysRemaining: 0 })
    expect(buildFixedEventCountdown('Powerlifting meet · 2026-08-01', new Date(2026, 7, 10))).toMatchObject({ state: 'past', daysRemaining: -9 })
  })

  it('keeps an absent or unreadable event date explicit instead of inventing a countdown', () => {
    expect(buildFixedEventCountdown(null)).toEqual({ state: 'none', label: null, date: null, daysRemaining: null })
    expect(buildFixedEventCountdown('Meet sometime this winter')).toEqual({ state: 'unparsed', label: 'Meet sometime this winter', date: null, daysRemaining: null })
    expect(buildFixedEventCountdown('Meet · 2026-02-31')).toEqual({ state: 'unparsed', label: 'Meet · 2026-02-31', date: null, daysRemaining: null })
  })
})
