import { describe, expect, it } from 'vitest'
import { compressSession, duplicateCandidates, readinessFromSurvey, recommendProgression, sessionCompletionStatus, volumeLoad } from './training-engine'
import { exercises, sessions } from './seed'
import type { CompletedSetRecord, SurveyAnswer } from './types'

const set = (overrides: Partial<CompletedSetRecord> = {}): CompletedSetRecord => ({
  id: crypto.randomUUID(),
  sessionId: 'session',
  exerciseId: 'competition-bench',
  exerciseName: 'Competition Bench Press',
  family: 'Bench Press',
  primaryRegion: 'chest',
  completedAt: new Date().toISOString(),
  reps: 6,
  load: 175,
  rir: 2,
  technique: 4,
  pain: 0,
  setIndex: 0,
  ...overrides
})

describe('volume load', () => {
  it('sums completed reps times actual load for each set', () => {
    expect(volumeLoad([set({ reps: 5, load: 200 }), set({ reps: 4, load: 210 })])).toBe(1840)
  })
})

describe('readiness hypothesis', () => {
  it('uses pain as a safety-aware override', () => {
    const answers: SurveyAnswer[] = [{ id: 'pain', value: 4, status: 'answered' }]
    expect(readinessFromSurvey(answers, 'stable')).toBe('pain-aware')
  })

  it('does not invent a negative answer from skipped questions', () => {
    const answers: SurveyAnswer[] = [{ id: 'sleepHours', value: null, status: 'skipped' }]
    expect(readinessFromSurvey(answers, 'stable')).toBe('normal')
  })

  it('routes a returning athlete to reacclimation', () => {
    expect(readinessFromSurvey([], 'returning')).toBe('reacclimate')
  })
})

describe('load-first progression hierarchy', () => {
  it('progresses load when the top of the rep range is owned', () => {
    const decision = recommendProgression({ history: [set(), set(), set(), set()], targetLoad: 175, targetReps: 6, targetSets: 4, repRange: [4, 6], increment: 5, continuity: 'stable', readiness: 'normal' })
    expect(decision.action).toBe('load')
    expect(decision.nextLoad).toBe(180)
    expect(decision.nextReps).toBe(4)
  })

  it('progresses reps when load is not yet earned', () => {
    const decision = recommendProgression({ history: [set({ reps: 5 }), set({ reps: 5 }), set({ reps: 5 })], targetLoad: 175, targetReps: 5, targetSets: 3, repRange: [4, 6], increment: 5, continuity: 'stable', readiness: 'normal' })
    expect(decision.action).toBe('reps')
    expect(decision.nextReps).toBe(6)
    expect(decision.nextLoad).toBe(175)
  })

  it('holds rather than adding a set when execution does not pass the gate', () => {
    const decision = recommendProgression({ history: [set({ technique: 2, rir: 0 }), set({ technique: 3, rir: 0 })], targetLoad: 175, targetReps: 6, targetSets: 2, repRange: [4, 6], increment: 5, continuity: 'stable', readiness: 'protect' })
    expect(decision.action).toBe('hold')
    expect(decision.nextSets).toBe(2)
  })

  it('reacclimates after a meaningful gap without erasing experience', () => {
    const decision = recommendProgression({ history: [set()], targetLoad: 175, targetReps: 6, targetSets: 4, repRange: [4, 6], increment: 5, continuity: 'returning', readiness: 'reacclimate' })
    expect(decision.action).toBe('reacclimate')
    expect(decision.nextLoad).toBeLessThan(175)
  })
})

describe('time-aware session compression', () => {
  it('protects at least the primary minimum before lower-priority work', () => {
    const compressed = compressSession(structuredClone(sessions[0]), 15)
    const primary = compressed.exercises.find((exercise) => exercise.role === 'primary')
    expect(primary).toBeDefined()
    expect(primary?.sets.length).toBeGreaterThanOrEqual(2)
    expect(compressed.exercises.some((exercise) => exercise.role === 'optional')).toBe(false)
  })
})

describe('session completion truth', () => {
  it('labels a session partial-primary when some primary work was completed', () => {
    const session = structuredClone(sessions[0])
    session.exercises[0].sets[0].completed = true
    expect(sessionCompletionStatus(session)).toBe('partial-primary')
  })

  it('does not count accessory-only work as a primary exposure', () => {
    const session = structuredClone(sessions[0])
    session.exercises[1].sets[0].completed = true
    expect(sessionCompletionStatus(session)).toBe('partial-no-primary')
  })

  it('requires every remaining planned set for completed status', () => {
    const session = structuredClone(sessions[0])
    session.exercises.forEach((exercise) => exercise.sets.forEach((workSet) => { workSet.completed = true }))
    expect(sessionCompletionStatus(session)).toBe('completed')
  })

  it('does not let an unfinished athlete-added set downgrade a fully completed prescription', () => {
    const session = structuredClone(sessions[0])
    session.exercises.forEach((exercise) => exercise.sets.forEach((workSet) => { workSet.completed = true }))
    session.exercises[0].sets.push({ id: 'set-added-1', targetLoad: 100, targetReps: 8, targetRir: 2, completed: false, athleteAdded: true })
    expect(sessionCompletionStatus(session)).toBe('completed')
  })

  it('still reports a partial session when a prescribed set is left unfinished alongside added work', () => {
    const session = structuredClone(sessions[0])
    session.exercises.forEach((exercise) => exercise.sets.forEach((workSet) => { workSet.completed = true }))
    session.exercises[1].sets[0].completed = false
    session.exercises[0].sets.push({ id: 'set-added-1', targetLoad: 100, targetReps: 8, targetRir: 2, completed: true, athleteAdded: true })
    expect(sessionCompletionStatus(session)).toBe('partial-primary')
  })
})

describe('exercise identity', () => {
  it('finds exact and alias duplicate candidates before creation', () => {
    expect(duplicateCandidates('2 Board Press', exercises)[0].exercise.id).toBe('two-board-press')
    expect(duplicateCandidates('Competition Bench Press', exercises)[0].score).toBe(1)
  })
})
