import { describe, expect, it } from 'vitest'
import { athleteLevel, athleteForms, pointsForLevel } from './athlete-level-engine'
import type { CompletedSetRecord, PersonalRecord, TrainingSession } from './types'

const setFor = (id: string, load = 100, reps = 10): CompletedSetRecord => ({
  id, sessionId: 'session-1', exerciseId: 'bench', exerciseName: 'Bench', family: 'Bench',
  primaryRegion: 'chest', completedAt: '2026-08-01T12:00:00.000Z', reps, load, rir: 2, technique: 4, pain: 0, setIndex: 0
})

const sessionFor = (id: string, status: TrainingSession['status'] = 'completed'): TrainingSession => ({
  id, title: 'Session', objective: '', dayLabel: 'Day', plannedDate: '2026-08-01', status,
  durationMinutes: 60, exercises: []
})

const recordFor = (id: string, validation: PersonalRecord['validation'] = 'validated'): PersonalRecord => ({
  id, exerciseId: 'bench', exerciseName: 'Bench', type: 'absolute-load', category: 'strength', scope: 'all-time',
  value: 200, achievedAt: '2026-08-01T12:00:00.000Z', sourceSessionId: 'session-1', sourceSetIds: ['a'],
  context: {}, validation, ruleVersion: 'pr-v2', unit: 'load', label: 'Bench'
})

const level = (over: Partial<Parameters<typeof athleteLevel>[0]> = {}) =>
  athleteLevel({ history: [], records: [], sessions: [], ...over })

describe('athleteLevel', () => {
  it('starts a brand new athlete at level one in the first form', () => {
    const result = level()
    expect(result.level).toBe(1)
    expect(result.form).toBe('apprentice')
    expect(result.points).toBe(0)
    expect(result.sources).toEqual([])
  })

  it('earns points only from work that actually happened', () => {
    const result = level({ sessions: [sessionFor('a'), sessionFor('b')] })
    expect(result.points).toBe(20)
    expect(result.sources).toHaveLength(1)
    expect(result.sources[0].label).toBe('Sessions finished')
  })

  it('counts a partial session with primary work, since the work was real', () => {
    expect(level({ sessions: [sessionFor('a', 'partial-primary')] }).points).toBe(10)
    expect(level({ sessions: [sessionFor('a', 'planned')] }).points).toBe(0)
  })

  it('rewards a quality-confirmed record above a numeric-only one', () => {
    expect(level({ records: [recordFor('a', 'validated')] }).points).toBe(25)
    expect(level({ records: [recordFor('a', 'numeric-only')] }).points).toBe(10)
  })

  it('counts a movement as mastered only once it has a real history', () => {
    const eight = Array.from({ length: 8 }, (_, index) => setFor(`s${index}`))
    const nine = Array.from({ length: 9 }, (_, index) => setFor(`s${index}`))
    expect(level({ history: eight }).sources.some((source) => source.label === 'Movements mastered')).toBe(false)
    expect(level({ history: nine }).sources.some((source) => source.label === 'Movements mastered')).toBe(true)
  })

  it('climbs through the forms as accumulated work grows', () => {
    expect(level({ sessions: Array.from({ length: 3 }, (_, index) => sessionFor(`s${index}`)) }).form).toBe('apprentice')
    expect(level({ sessions: Array.from({ length: 200 }, (_, index) => sessionFor(`s${index}`)) }).form).toBe('forged')
    expect(level({ sessions: Array.from({ length: 900 }, (_, index) => sessionFor(`s${index}`)) }).form).toBe('champion')
    expect(level({ sessions: Array.from({ length: 4000 }, (_, index) => sessionFor(`s${index}`)) }).form).toBe('apex')
  })

  it('never reports negative progress or an impossible level', () => {
    const result = level({ sessions: Array.from({ length: 40 }, (_, index) => sessionFor(`s${index}`)) })
    expect(result.level).toBeGreaterThanOrEqual(1)
    expect(result.pointsIntoLevel).toBeGreaterThanOrEqual(0)
    expect(result.progressToNextLevel).toBeGreaterThanOrEqual(0)
    expect(result.progressToNextLevel).toBeLessThanOrEqual(1)
  })

  it('names the next form until the last one is reached', () => {
    expect(level().nextForm?.form).toBe('forged')
    expect(level({ sessions: Array.from({ length: 4000 }, (_, index) => sessionFor(`s${index}`)) }).nextForm).toBeNull()
  })

  it('makes every level cost more than the last', () => {
    expect(pointsForLevel(2)).toBeGreaterThan(pointsForLevel(1))
    expect(pointsForLevel(10)).toBeGreaterThan(pointsForLevel(9))
  })

  it('keeps the form ladder ordered and reachable', () => {
    const levels = athleteForms.map((entry) => entry.minimumLevel)
    expect(levels).toEqual([...levels].sort((a, b) => a - b))
    expect(athleteForms[0].minimumLevel).toBe(1)
  })

  it('explains itself with a breakdown rather than a bare number', () => {
    const result = level({ sessions: [sessionFor('a')], records: [recordFor('r')], history: [setFor('s', 1000, 10)] })
    expect(result.sources.length).toBeGreaterThan(1)
    expect(result.sources.every((source) => source.detail.length > 0)).toBe(true)
    expect(result.ruleVersion).toBe('athlete-level-v1')
  })
})
