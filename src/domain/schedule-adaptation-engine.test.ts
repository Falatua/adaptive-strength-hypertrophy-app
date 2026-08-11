import { describe, expect, it } from 'vitest'
import { equipmentProfiles, exercises, history as seedHistory, sessions as seedSessions } from './seed'
import { buildMissedOpportunityReplan, missedOpportunityEventError } from './schedule-adaptation-engine'
import type { CompletedSetRecord, MissedOpportunityInput, SurveyRecord, TrainingSession } from './types'

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

const preSurvey = (answers: SurveyRecord['answers'], completedAt = '2026-08-10T11:00:00.000Z'): SurveyRecord => ({
  id: `pre:${completedAt}`,
  sessionId: 'session-bench',
  type: 'pre',
  completedAt,
  answers,
  skipped: false,
  mode: 'quick',
  answeredCount: answers.filter((answer) => answer.status === 'answered').length,
  unknownCount: answers.filter((answer) => answer.status !== 'answered').length,
  confidence: 'medium'
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
  priorityRegions: ['chest', 'back', 'triceps'],
  exercises: structuredClone(exercises),
  equipmentProfile: structuredClone(equipmentProfiles[0]),
  safetyGateActive: false,
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
    expect(result.event.eligibility).toMatchObject({ ruleVersion: 'schedule-eligibility-v1', equipmentProfileId: 'equipment-commercial-gym' })
    expect(result.event.readiness).toMatchObject({ ruleVersion: 'schedule-readiness-v1', freshness: 'missing', effectiveOutcome: 'unknown', action: 'unknown' })
  })

  it('honors an athlete pin while retaining exact-exposure order for the remaining queue', () => {
    const result = run({ input: input({ preferredNextSessionId: 'session-bench' }) })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.event.ruleVersion).toBe('missed-opportunity-v5')
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

  it('removes unavailable support while keeping an executable pinned primary', () => {
    const result = run({ input: input({ preferredNextSessionId: 'session-bench' }), equipmentProfile: structuredClone(equipmentProfiles[1]) })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.event.nextSessionId).toBe('session-bench')
    expect(result.event.eligibility?.equipmentProfileName).toBe('Home Gym')
    expect(result.event.eligibility?.removedExerciseNames.length).toBeGreaterThan(0)
    expect(result.event.reasons.join(' ')).toMatch(/impossible work/i)
    const next = result.sessions.find((session) => session.id === 'session-bench')!
    expect(next.exercises.every((planned) => {
      const exercise = exercises.find((candidate) => candidate.id === planned.exerciseId)!
      return exercise.equipment.every((item) => equipmentProfiles[1].equipment.includes(item)) && !['irritating', 'avoid'].includes(exercise.jointFeeling)
    })).toBe(true)
  })

  it('rejects unavailable protected-primary pins and a global safety gate without mutation', () => {
    const unavailable = run({ input: input({ preferredNextSessionId: 'session-bench' }), equipmentProfile: structuredClone(equipmentProfiles[2]) })
    expect(unavailable).toMatchObject({ ok: false, error: expect.stringMatching(/cannot lead at Travel Setup/i) })
    const blocked = run({ safetyGateActive: true, safetyGateReason: 'Reassess the current pain restriction before automatic schedule rebuilding.' })
    expect(blocked).toMatchObject({ ok: false, error: expect.stringMatching(/pain restriction/i) })
  })

  it('uses only fresh readiness evidence and never penalizes missing or stale answers', () => {
    const protective = run({
      input: input({ constraintState: 'ended' }),
      surveys: [preSurvey([
        { id: 'fatigue', value: 4, status: 'answered' },
        { id: 'energy', value: 1, status: 'answered' }
      ])]
    })
    expect(protective.ok).toBe(true)
    if (!protective.ok) return
    expect(protective.event.readiness).toMatchObject({ freshness: 'current', sourceOutcome: 'protect', effectiveOutcome: 'protect', action: 'trim-optional', ageHours: 1 })
    expect(protective.event.reasons.join(' ')).toMatch(/protective/i)
    expect(protective.sessions.find((session) => session.id === protective.event.nextSessionId)?.exercises.some((exercise) => exercise.role === 'optional')).toBe(false)

    const stale = run({
      input: input({ constraintState: 'ended' }),
      surveys: [preSurvey([{ id: 'pain', value: 5, status: 'answered' }], '2026-08-08T11:00:00.000Z')]
    })
    expect(stale.ok).toBe(true)
    if (!stale.ok) return
    expect(stale.event.readiness).toMatchObject({ freshness: 'stale', sourceOutcome: 'pain-aware', effectiveOutcome: 'unknown', action: 'unknown', ageHours: 49 })
    expect(stale.event.mode).toBe('defer-one')
  })

  it('blocks a rebuild from fresh pain readiness and rejects forged readiness actions', () => {
    const surveys = [preSurvey([{ id: 'pain', value: 5, status: 'answered' }])]
    const blocked = run({ surveys })
    expect(blocked).toMatchObject({ ok: false, error: expect.stringMatching(/fresh pain evidence/i) })

    const valid = run({ surveys: [preSurvey([{ id: 'stress', value: 4, status: 'answered' }])] })
    expect(valid.ok).toBe(true)
    if (!valid.ok) return
    expect(valid.event.readiness).toMatchObject({ sourceOutcome: 'confirm', action: 'confirm-at-warmup' })
    expect(missedOpportunityEventError({ ...valid.event, readiness: { ...valid.event.readiness!, action: 'proceed' } }, valid.sessions)).toMatch(/does not match/i)
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

  it('uses relative 28-day priority-region dose only to resolve an otherwise equal queue choice', () => {
    const sessions = structuredClone(seedSessions)
    sessions[0].exercises = sessions[0].exercises.filter((planned) => planned.id !== 'plan-row')
    const equalPrimaryHistory = [
      { ...completedSet('competition-bench', '2026-08-08T12:00:00.000Z', 'equal-bench'), primaryRegion: 'chest' as const },
      { ...completedSet('competition-squat', '2026-08-08T12:00:00.000Z', 'equal-squat'), primaryRegion: 'quadriceps' as const },
      { ...completedSet('sumo-deadlift', '2026-08-08T12:00:00.000Z', 'equal-deadlift'), primaryRegion: 'glutes' as const },
      { ...completedSet('coffin-press', '2026-08-02T12:00:00.000Z', 'chest-dose-1'), primaryRegion: 'chest' as const },
      { ...completedSet('coffin-press', '2026-08-02T12:05:00.000Z', 'chest-dose-2'), primaryRegion: 'chest' as const }
    ]
    const result = run({ sessions, history: equalPrimaryHistory, priorityRegions: ['chest', 'back'] })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.event.nextSessionId).toBe('session-deadlift')
    expect(result.event.priorityDose).toMatchObject({
      ruleVersion: 'schedule-priority-dose-v1', windowDays: 28, appliedAsTieBreak: true,
      selectedSessionId: 'session-deadlift', selectedGapScore: 3, selectedGapRegions: ['back']
    })
    expect(result.event.priorityDose?.regions).toEqual([
      expect.objectContaining({ region: 'chest', completedSetCount: 3, relativeGapSets: 0, sourceSetIds: ['equal-bench', 'chest-dose-1', 'chest-dose-2'] }),
      expect.objectContaining({ region: 'back', completedSetCount: 0, relativeGapSets: 3, sourceSetIds: [] })
    ])
    expect(result.event.openSetCountAfter).toBeLessThanOrEqual(result.event.openSetCountBefore)
    expect(missedOpportunityEventError(result.event, result.sessions)).toBeNull()
    expect(missedOpportunityEventError({ ...result.event, priorityDose: { ...result.event.priorityDose!, selectedGapScore: 99 } }, result.sessions)).toMatch(/selected priority-dose/i)
  })

  it('never lets relative priority-region dose override an athlete next-session pin', () => {
    const sessions = structuredClone(seedSessions)
    sessions[0].exercises = sessions[0].exercises.filter((planned) => planned.id !== 'plan-row')
    const history = [
      { ...completedSet('competition-bench', '2026-08-08T12:00:00.000Z', 'pin-bench'), primaryRegion: 'chest' as const },
      { ...completedSet('competition-squat', '2026-08-08T12:00:00.000Z', 'pin-squat'), primaryRegion: 'quadriceps' as const },
      { ...completedSet('sumo-deadlift', '2026-08-08T12:00:00.000Z', 'pin-deadlift'), primaryRegion: 'glutes' as const },
      { ...completedSet('coffin-press', '2026-08-02T12:00:00.000Z', 'pin-chest-dose'), primaryRegion: 'chest' as const }
    ]
    const result = run({ sessions, history, priorityRegions: ['chest', 'back'], input: input({ preferredNextSessionId: 'session-bench' }) })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.event.nextSessionId).toBe('session-bench')
    expect(result.event.priorityDose).toMatchObject({ appliedAsTieBreak: false, selectedSessionId: 'session-bench', selectedGapScore: 0, selectedGapRegions: [] })
    expect(result.event.priorityDose?.reason).toMatch(/did not override/i)
    expect(missedOpportunityEventError(result.event, result.sessions)).toBeNull()
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
