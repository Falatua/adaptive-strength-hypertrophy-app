import { describe, expect, it } from 'vitest'
import { athleteLevel, athleteForms, pointsForLevel } from './athlete-level-engine'
import type { CompletedSetRecord, PersonalRecord, TrainingSession } from './types'

const setFor = (id: string, load = 100, reps = 10, sessionId = 'session-1', exerciseId = 'bench'): CompletedSetRecord => ({
  id, sessionId, exerciseId, exerciseName: exerciseId, family: 'Bench',
  primaryRegion: 'chest', completedAt: '2026-08-01T12:00:00.000Z', reps, load, rir: 2, technique: 4, pain: 0, setIndex: 0
})

const sessionFor = (id: string, status: TrainingSession['status'] = 'completed'): TrainingSession => ({
  id, title: 'Session', objective: '', dayLabel: 'Day', plannedDate: '2026-08-01', status,
  durationMinutes: 60, exercises: []
})

const recordFor = (id: string, validation: PersonalRecord['validation'] = 'validated', sourceSessionId = 'session-1'): PersonalRecord => ({
  id, exerciseId: 'bench', exerciseName: 'Bench', type: 'absolute-load', category: 'strength', scope: 'all-time',
  value: 200, achievedAt: '2026-08-01T12:00:00.000Z', sourceSessionId, sourceSetIds: ['a'],
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
    expect(result.points).toBe(200)
    expect(result.sources).toHaveLength(1)
    expect(result.sources[0].label).toBe('Workouts completed')
  })

  it('counts a partial session with primary work, since the work was real', () => {
    expect(level({ sessions: [sessionFor('a', 'partial-primary')] }).points).toBe(70)
    expect(level({ sessions: [sessionFor('a', 'planned')] }).points).toBe(0)
  })

  it('rewards a quality-confirmed record workout above a numeric-only one', () => {
    expect(level({ records: [recordFor('a', 'validated')] }).points).toBe(25)
    expect(level({ records: [recordFor('a', 'numeric-only')] }).points).toBe(10)
  })

  it('bounds every record view from one workout to one quality bonus', () => {
    const records = Array.from({ length: 24 }, (_, index) => recordFor(`record-${index}`))
    expect(level({ records }).points).toBe(25)
    expect(level({ records }).sources).toEqual([expect.objectContaining({ label: 'Validated record workouts', points: 25 })])
  })

  it('does not stack numeric-only credit on a workout that already has a validated record', () => {
    expect(level({ records: [recordFor('validated'), recordFor('numeric', 'numeric-only')] }).points).toBe(25)
    expect(level({ records: [recordFor('validated'), recordFor('numeric', 'numeric-only', 'session-2')] }).points).toBe(35)
  })

  it('establishes a movement through three workouts rather than extra sets in one workout', () => {
    const nineInOneWorkout = Array.from({ length: 9 }, (_, index) => setFor(`s${index}`))
    const threeExposures = Array.from({ length: 3 }, (_, index) => setFor(`e${index}`, 100, 10, `session-${index + 1}`))
    expect(level({ history: nineInOneWorkout }).sources.some((source) => source.label === 'Established movements')).toBe(false)
    expect(level({ history: threeExposures }).sources).toContainEqual(expect.objectContaining({ label: 'Established movements', points: 25 }))
  })

  it('does not award extra points for moving more tonnage or adding sets to one workout', () => {
    const short = level({ history: [setFor('short', 20, 5)] })
    const heavy = level({ history: Array.from({ length: 20 }, (_, index) => setFor(`heavy-${index}`, 1000, 20)) })
    expect(short.points).toBe(100)
    expect(heavy.points).toBe(100)
  })

  it('keeps a record-heavy first workout at level one', () => {
    const history = Array.from({ length: 15 }, (_, index) => setFor(`set-${index}`, 135, 10, 'first-workout', `movement-${index % 5}`))
    const records = Array.from({ length: 30 }, (_, index) => recordFor(`record-${index}`, 'validated', 'first-workout'))
    const result = level({ history, records, sessions: [sessionFor('first-workout')] })
    expect(result).toMatchObject({ level: 1, points: 125, pointsIntoLevel: 125, pointsForNextLevel: 200 })
  })

  it('climbs through the forms as accumulated work grows', () => {
    expect(level({ sessions: Array.from({ length: 3 }, (_, index) => sessionFor(`s${index}`)) }).form).toBe('apprentice')
    expect(level({ sessions: Array.from({ length: 45 }, (_, index) => sessionFor(`s${index}`)) }).form).toBe('forged')
    expect(level({ sessions: Array.from({ length: 255 }, (_, index) => sessionFor(`s${index}`)) }).form).toBe('champion')
    expect(level({ sessions: Array.from({ length: 980 }, (_, index) => sessionFor(`s${index}`)) }).form).toBe('apex')
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
    expect(level({ sessions: Array.from({ length: 980 }, (_, index) => sessionFor(`s${index}`)) }).nextForm).toBeNull()
  })

  it('makes every level cost more than the last', () => {
    expect(pointsForLevel(1)).toBe(200)
    expect(pointsForLevel(2)).toBe(275)
    expect(pointsForLevel(10)).toBe(875)
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
    expect(result.ruleVersion).toBe('athlete-level-v2')
  })
})
