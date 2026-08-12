import { describe, expect, it } from 'vitest'
import { badgeDefinitions, earnedBadgeCount, evaluateBadges } from './badge-engine'
import { exercises as seedExercises } from './seed'
import type { CompletedSetRecord, PersonalRecord, TrainingSession } from './types'

const setFor = (id: string, exerciseId = 'competition-bench', completedAt = '2026-08-01T12:00:00.000Z', load = 100): CompletedSetRecord => ({
  id, sessionId: 'session-1', exerciseId, exerciseName: exerciseId, family: 'Bench', primaryRegion: 'chest',
  completedAt, reps: 10, load, rir: 2, technique: 4, pain: 0, setIndex: 0
})

const sessionFor = (id: string, status: TrainingSession['status'] = 'completed'): TrainingSession => ({
  id, title: 'Session', objective: '', dayLabel: 'Day', plannedDate: '2026-08-01', status, durationMinutes: 60, exercises: []
})

const recordFor = (id: string, validation: PersonalRecord['validation'] = 'validated'): PersonalRecord => ({
  id, exerciseId: 'competition-bench', exerciseName: 'Bench', type: 'absolute-load', category: 'strength',
  scope: 'all-time', value: 200, achievedAt: '2026-08-01T12:00:00.000Z', sourceSessionId: 'session-1',
  sourceSetIds: ['a'], context: {}, validation, ruleVersion: 'pr-v2', unit: 'load', label: 'Bench'
})

const evaluate = (over: Partial<Parameters<typeof evaluateBadges>[0]> = {}) =>
  evaluateBadges({ history: [], records: [], sessions: [], exercises: seedExercises, ...over })

const find = (badges: ReturnType<typeof evaluate>, id: string) => badges.find((badge) => badge.definition.id === id)!

describe('evaluateBadges', () => {
  it('starts every badge locked for a new athlete', () => {
    const badges = evaluate()
    expect(badges).toHaveLength(badgeDefinitions.length)
    expect(earnedBadgeCount(badges)).toBe(0)
  })

  it('awards the first badge for a single finished session', () => {
    const badges = evaluate({ sessions: [sessionFor('a')] })
    expect(find(badges, 'first-light').earned).toBe(true)
    expect(find(badges, 'iron-habit').earned).toBe(false)
  })

  it('shows how close a locked badge is rather than leaving it blank', () => {
    const badges = evaluate({ sessions: Array.from({ length: 5 }, (_, index) => sessionFor(`s${index}`)) })
    const habit = find(badges, 'iron-habit')
    expect(habit.earned).toBe(false)
    expect(habit.progress).toBeCloseTo(0.5)
    expect(habit.progressLabel).toBe('5 of 10 sessions')
  })

  it('speaks in the athlete\'s language once earned', () => {
    const badges = evaluate({ sessions: [sessionFor('a')] })
    expect(find(badges, 'first-light').progressLabel).toBe('The hardest session is the one you start.')
  })

  it('separates confirmed records from numeric-only ones', () => {
    const numeric = Array.from({ length: 12 }, (_, index) => recordFor(`r${index}`, 'numeric-only'))
    const badges = evaluate({ records: numeric })
    expect(find(badges, 'record-keeper').earned).toBe(true)
    expect(find(badges, 'archivist').earned).toBe(false)
  })

  it('counts only muscles that received direct work', () => {
    const history = [setFor('a', 'competition-bench'), setFor('b', 'competition-squat')]
    const badges = evaluate({ history })
    expect(find(badges, 'foundation').progress).toBeGreaterThan(0)
    expect(find(badges, 'full-spectrum').earned).toBe(false)
  })

  it('awards the return badge only after a genuine gap', () => {
    const close = [setFor('a', 'competition-bench', '2026-08-01T12:00:00.000Z'), setFor('b', 'competition-bench', '2026-08-04T12:00:00.000Z')]
    const gapped = [setFor('a', 'competition-bench', '2026-07-01T12:00:00.000Z'), setFor('b', 'competition-bench', '2026-08-01T12:00:00.000Z')]
    expect(find(evaluate({ history: close }), 'returner').earned).toBe(false)
    expect(find(evaluate({ history: gapped }), 'returner').earned).toBe(true)
  })

  it('never reports progress outside zero and one', () => {
    const badges = evaluate({ sessions: Array.from({ length: 400 }, (_, index) => sessionFor(`s${index}`)) })
    expect(badges.every((badge) => badge.progress >= 0 && badge.progress <= 1)).toBe(true)
  })

  it('gives every badge a checkable requirement', () => {
    expect(badgeDefinitions.every((badge) => badge.requirement.length > 0 && badge.earnedBlurb.length > 0)).toBe(true)
    expect(new Set(badgeDefinitions.map((badge) => badge.id)).size).toBe(badgeDefinitions.length)
  })
})
