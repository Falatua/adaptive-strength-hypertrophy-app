import { describe, expect, it } from 'vitest'
import { history as seedHistory, sessions as seedSessions } from './seed'
import { buildMissedOpportunityReplan, missedOpportunityEventError } from './schedule-adaptation-engine'
import type { CompletedSetRecord, MissedOpportunityInput, TrainingSession } from './types'

const recordedAt = '2026-08-10T12:00:00.000Z'
const nextOpportunityAt = '2026-08-12T12:00:00.000Z'

const input = (overrides: Partial<MissedOpportunityInput> = {}): MissedOpportunityInput => ({
  reason: 'family',
  trainingOutcome: 'no-training',
  nextOpportunityAt,
  nextMinutes: 45,
  constraintState: 'continuing',
  note: 'Childcare changed the week.',
  preferredNextSessionId: null,
  ...overrides
})

const completedSet = (exerciseId: string, completedAt: string, id = `${exerciseId}:${completedAt}`): CompletedSetRecord => ({
  id,
  sessionId: `history:${exerciseId}`,
  exerciseId,
  exerciseName: exerciseId,
  family: exerciseId,
  primaryRegion: 'trunk',
  completedAt,
  reps: 5,
  load: 100,
  rir: 2,
  technique: 4,
  pain: 0,
  qualityConfirmed: true,
  setIndex: 0
})

const run = (overrides: Partial<Parameters<typeof buildMissedOpportunityReplan>[0]> = {}) => buildMissedOpportunityReplan({
  eventId: 'miss-1',
  sessions: structuredClone(seedSessions),
  history: [
    completedSet('competition-bench', '2026-08-09T12:00:00.000Z'),
    completedSet('competition-squat', '2026-07-25T12:00:00.000Z'),
    completedSet('sumo-deadlift', '2026-08-04T12:00:00.000Z')
  ],
  priorEvents: [],
  missedSessionId: 'session-bench',
  input: input(),
  continuity: 'stable',
  weeklyOpportunities: 3,
  recordedAt,
  ...overrides
})

describe('missed-opportunity replanning', () => {
  it('ranks the most overdue exact primary, fits the declared time, and adds no catch-up sets', () => {
    const result = run()
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.event.queueAfter[0]).toBe('session-squat')
    expect(result.event.nextPrimaryExerciseId).toBe('competition-squat')
    expect(result.event.nextPrimaryDaysSinceExposure).toBe(16)
    expect(result.sessions.find((session) => session.id === 'session-squat')?.durationMinutes).toBe(45)
    expect(result.sessions.find((session) => session.id === 'session-bench')?.status).toBe('planned')
    expect(result.event.openSetCountAfter).toBeLessThanOrEqual(result.event.openSetCountBefore)
    expect(result.event.completedSetCountAfter).toBe(result.event.completedSetCountBefore)
  })

  it('honors an athlete pin while retaining exact-exposure order for the remaining queue', () => {
    const result = run({ input: input({ preferredNextSessionId: 'session-bench' }) })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.event.ruleVersion).toBe('missed-opportunity-v2')
    expect(result.event.queueAfter).toEqual(['session-bench', 'session-squat', 'session-deadlift'])
    expect(result.event.nextSessionId).toBe('session-bench')
    expect(result.event.reasons[0]).toMatch(/athlete pinned/i)
    expect(missedOpportunityEventError(result.event, result.sessions)).toBeNull()
  })

  it('rejects a stale or forged preferred session', () => {
    const stale = run({ input: input({ preferredNextSessionId: 'missing-session' }) })
    expect(stale).toMatchObject({ ok: false, error: expect.stringMatching(/no longer in the open queue/i) })
    const result = run({ input: input({ preferredNextSessionId: 'session-bench' }) })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(missedOpportunityEventError({ ...result.event, nextSessionId: 'session-squat' }, result.sessions)).toMatch(/was not honored/i)
  })

  it('preserves completed, partial, expired, and stopped session objects instead of deleting the ledger', () => {
    const terminal: TrainingSession[] = structuredClone(seedSessions).map((session, index) => ({
      ...session,
      id: `terminal-${index}`,
      status: (['completed', 'partial-primary', 'stopped'] as const)[index]
    }))
    const sessions = [...terminal, ...structuredClone(seedSessions)]
    const result = run({ sessions })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.sessions).toHaveLength(sessions.length)
    terminal.forEach((session) => expect(result.sessions.find((candidate) => candidate.id === session.id)).toEqual(session))
    expect(result.event.preservedTerminalSessionIds).toEqual(terminal.map((session) => session.id))
  })

  it('rebuilds the sequence and removes optional fatigue after a second miss without completed work', () => {
    const first = run()
    expect(first.ok).toBe(true)
    if (!first.ok) return
    const second = run({
      eventId: 'miss-2',
      sessions: first.sessions,
      priorEvents: [first.event],
      missedSessionId: first.event.nextSessionId,
      recordedAt: '2026-08-12T12:00:00.000Z',
      input: input({ nextOpportunityAt: '2026-08-14T12:00:00.000Z', constraintState: 'uncertain' })
    })
    expect(second.ok).toBe(true)
    if (!second.ok) return
    expect(second.event.consecutiveMisses).toBe(2)
    expect(second.event.mode).toBe('rebuild-sequence')
    const next = second.sessions.find((session) => session.id === second.event.nextSessionId)!
    expect(next.exercises.some((exercise) => exercise.role === 'optional')).toBe(false)
    expect(second.continuity).toBe('interrupted')
  })

  it('routes an ongoing illness or pain interruption to a reacclimation review without diagnosing it', () => {
    const result = run({ input: input({ reason: 'illness', constraintState: 'continuing' }) })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.continuity).toBe('returning')
    expect(result.event.mode).toBe('reacclimation-review')
    expect(result.event.reasons.join(' ')).toMatch(/capacity less certain/i)
  })

  it('records reported unlogged training but awards no exposure or progression credit', () => {
    const result = run({ input: input({ trainingOutcome: 'different-training-unlogged' }) })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.event.completedSetCountAfter).toBe(result.event.completedSetCountBefore)
    expect(result.event.reasons.join(' ')).toMatch(/logged or imported/i)
  })

  it('rejects an opportunity in the past and a session that is already complete', () => {
    const past = run({ input: input({ nextOpportunityAt: '2026-08-09T12:00:00.000Z' }) })
    expect(past).toMatchObject({ ok: false, error: expect.stringMatching(/cannot be before/i) })
    const completedSessions = structuredClone(seedSessions)
    completedSessions[0].status = 'completed'
    const completed = run({ sessions: completedSessions })
    expect(completed).toMatchObject({ ok: false, error: expect.stringMatching(/unstarted/i) })
  })

  it('validates the replayable event and rejects fabricated completed-set changes', () => {
    const result = run({ history: structuredClone(seedHistory) })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(missedOpportunityEventError(result.event, result.sessions)).toBeNull()
    expect(missedOpportunityEventError({ ...result.event, completedSetCountAfter: result.event.completedSetCountBefore + 1 }, result.sessions)).toMatch(/create or remove completed sets/i)
  })
})
