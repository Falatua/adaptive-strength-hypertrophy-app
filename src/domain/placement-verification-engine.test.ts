import { describe, expect, it } from 'vitest'
import { buildPlacementAssessment } from './placement-engine'
import {
  beginPlacementVerification,
  cancelPlacementVerificationForPrimarySubstitution,
  completePlacementVerification,
  placementVerificationError,
  recordPlacementWarmup,
  revisePlacementSessionEvidence,
  resolvePlacementRecovery,
  summarizePlacementVerification
} from './placement-verification-engine'
import type { PlacementInputs, PlacementVerificationFirstSet, PlacementVerificationSessionEvidence } from './types'

const placement = buildPlacementAssessment({
  goal: 'strength', fixedEvent: null, trainingAge: 8, continuity: 'stable', movementSkill: 5,
  strengthTolerance: 4, volumeTolerance: 4, scheduleStability: 4, dataConfidence: 4,
  painState: 'none', weeklyOpportunities: 3, defaultMinutes: 60,
  equipmentProfileId: 'equipment-commercial-gym', skippedFields: [],
  movementProfiles: [{ exerciseId: 'bench', exerciseName: 'Bench Press', family: 'Bench Press', movementSkill: 5, strengthTolerance: 4, dataConfidence: 4 }]
} satisfies PlacementInputs, '2026-08-10T10:00:00.000Z')

const firstSet: PlacementVerificationFirstSet = {
  sourceSetId: 'set-1', plannedExerciseId: 'planned-1', exerciseId: 'bench', exerciseName: 'Bench Press',
  targetLoad: 180, targetReps: 5, targetRir: 2, actualLoad: 180, actualReps: 5, actualRir: 2
}

const evidence = (overrides: Partial<PlacementVerificationSessionEvidence> = {}): PlacementVerificationSessionEvidence => ({
  sessionStatus: 'completed', completedSets: 10, plannedSets: 10, completionRate: 1,
  plannedMinutes: 60, actualMinutes: 58, readiness: 'normal', difficulty: 7,
  technique: 4, pain: 0, timeFit: 4, postSurveySkipped: false, ...overrides
})

const begun = () => beginPlacementVerification({
  id: 'verify-1',
  placement,
  sessionId: 'session-1',
  sequence: 1,
  startedAt: '2026-08-10T11:00:00.000Z',
  movementPlacement: placement.movementPlacements?.[0]
})

const reorderJsonObjectKeys = <T,>(value: T): T => {
  if (Array.isArray(value)) return value.map((item) => reorderJsonObjectKeys(item)) as T
  if (typeof value !== 'object' || value === null) return value
  return Object.fromEntries(Object.entries(value).reverse().map(([key, item]) => [key, reorderJsonObjectKeys(item)])) as T
}

describe('placement-verification-v1', () => {
  it('cancels only the active exact-lane check when the protected primary is substituted', () => {
    const active = begun()
    const otherSession = { ...active, id: 'verify-other', sessionId: 'session-other' }
    const priorResolved = resolvePlacementRecovery(completePlacementVerification({ ...active, id: 'verify-prior', sessionId: 'session-prior' }, { firstSet, sessionEvidence: evidence(), completedAt: '2026-08-10T12:00:00.000Z' }), 'recovered', '2026-08-11T10:00:00.000Z')
    const result = cancelPlacementVerificationForPrimarySubstitution({ events: [active, otherSession, priorResolved], placementCreatedAt: placement.createdAt, sessionId: active.sessionId })
    expect(result.cancelled).toBe(true)
    expect(result.events.map((event) => event.id)).toEqual(['verify-other', 'verify-prior'])
  })

  it('does not alter verification when no active event belongs to the substituted session', () => {
    const active = begun()
    const result = cancelPlacementVerificationForPrimarySubstitution({ events: [active], placementCreatedAt: placement.createdAt, sessionId: 'another-session' })
    expect(result).toEqual({ events: [active], cancelled: false })
  })

  it('starts as a productive non-maximal check and records optional warm-up evidence', () => {
    const event = recordPlacementWarmup(begun(), 'as-expected', '2026-08-10T11:05:00.000Z')
    expect(event).toMatchObject({
      status: 'active',
      warmupResponse: 'as-expected',
      verdict: 'collecting',
      placementRoute: 'strength',
      movementPlacement: { exerciseId: 'bench', selectedRoute: 'strength' }
    })
  })

  it('uses the first completed primary set and waits for recovery', () => {
    const event = completePlacementVerification(begun(), { firstSet, sessionEvidence: evidence(), completedAt: '2026-08-10T12:00:00.000Z' })
    expect(event).toMatchObject({ status: 'awaiting-recovery', verdict: 'pending-recovery', firstSet: { sourceSetId: 'set-1' } })
  })

  it('supports the route only after usable quality and recovery evidence', () => {
    const completed = completePlacementVerification(begun(), { firstSet, sessionEvidence: evidence(), completedAt: '2026-08-10T12:00:00.000Z' })
    const resolved = resolvePlacementRecovery(completed, 'recovered', '2026-08-11T10:00:00.000Z')
    expect(resolved).toMatchObject({ status: 'resolved', verdict: 'supports-route', recoveryResponse: 'recovered' })
  })

  it('keeps skipped quality or recovery evidence explicitly uncertain', () => {
    const completed = completePlacementVerification(begun(), { firstSet, sessionEvidence: evidence({ technique: null, pain: null, timeFit: null, postSurveySkipped: true }), completedAt: '2026-08-10T12:00:00.000Z' })
    expect(resolvePlacementRecovery(completed, 'skipped', '2026-08-11T10:00:00.000Z').verdict).toBe('needs-more-evidence')
  })

  it('replays later optional post-session evidence without changing source-set identity', () => {
    const deferred = completePlacementVerification(begun(), { firstSet, sessionEvidence: evidence({ technique: null, pain: null, timeFit: null, postSurveySkipped: true }), completedAt: '2026-08-10T12:00:00.000Z' })
    const revised = revisePlacementSessionEvidence(deferred, evidence())
    expect(revised).toMatchObject({ status: 'awaiting-recovery', verdict: 'pending-recovery', firstSet: { sourceSetId: 'set-1' }, sessionEvidence: { technique: 4, pain: 0, timeFit: 4, postSurveySkipped: false } })
  })

  it('suggests review after a harder-than-planned set or poor recovery', () => {
    const warmup = recordPlacementWarmup(begun(), 'harder', '2026-08-10T11:05:00.000Z')
    const completed = completePlacementVerification(warmup, { firstSet: { ...firstSet, actualRir: 0 }, sessionEvidence: evidence(), completedAt: '2026-08-10T12:00:00.000Z' })
    expect(resolvePlacementRecovery(completed, 'acceptable', '2026-08-11T10:00:00.000Z').verdict).toBe('review-suggested')
    expect(resolvePlacementRecovery(completePlacementVerification(begun(), { firstSet, sessionEvidence: evidence(), completedAt: '2026-08-10T12:00:00.000Z' }), 'not-recovered', '2026-08-11T10:00:00.000Z').verdict).toBe('review-suggested')
  })

  it('requires reassessment when warm-up or post-session pain changes training', () => {
    const painful = recordPlacementWarmup(begun(), 'painful', '2026-08-10T11:05:00.000Z')
    const event = completePlacementVerification(painful, { firstSet, sessionEvidence: evidence(), completedAt: '2026-08-10T12:00:00.000Z' })
    expect(event).toMatchObject({ status: 'resolved', verdict: 'reassessment-required' })
  })

  it('summarizes the first one to three checks without silently changing the route', () => {
    const one = resolvePlacementRecovery(completePlacementVerification(begun(), { firstSet, sessionEvidence: evidence(), completedAt: '2026-08-10T12:00:00.000Z' }), 'recovered', '2026-08-11T10:00:00.000Z')
    const second = { ...one, id: 'verify-2', sessionId: 'session-2', sequence: 2 }
    expect(summarizePlacementVerification([one, second], placement.createdAt)).toMatchObject({ supports: 2, state: 'route-supported' })
    expect(placementVerificationError(one)).toBeNull()
    expect(placementVerificationError(reorderJsonObjectKeys(one))).toBeNull()
    expect(placementVerificationError({ ...one, verdict: 'review-suggested' })).toMatch(/does not reconcile/i)
  })
})
