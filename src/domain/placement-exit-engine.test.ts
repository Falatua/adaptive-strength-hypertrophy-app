import { describe, expect, it } from 'vitest'
import { buildPlacementAssessment } from './placement-engine'
import { buildMovementPlacementExitAssessment, buildPlacementExitAssessment, movementPlacementExitAssessmentError, movementPlacementExitReviewError, placementExitAssessmentError, placementExitReviewError } from './placement-exit-engine'
import { beginPlacementVerification, completePlacementVerification, recordPlacementWarmup, resolvePlacementRecovery } from './placement-verification-engine'
import type { PlacementInputs, PlacementVerificationEvent, PlacementVerificationSessionEvidence } from './types'

const placementFor = (overrides: Partial<PlacementInputs> = {}) => buildPlacementAssessment({
  goal: 'strength', fixedEvent: null, trainingAge: 8, continuity: 'stable', movementSkill: 5,
  strengthTolerance: 4, volumeTolerance: 4, scheduleStability: 4, dataConfidence: 4,
  painState: 'none', weeklyOpportunities: 3, defaultMinutes: 60,
  equipmentProfileId: 'equipment-commercial-gym', skippedFields: [],
  movementProfiles: [{ exerciseId: 'bench', exerciseName: 'Bench Press', family: 'Bench Press', movementSkill: 5, strengthTolerance: 4, dataConfidence: 4 }],
  ...overrides
}, '2026-08-10T10:00:00.000Z')

const sessionEvidence: PlacementVerificationSessionEvidence = {
  sessionStatus: 'completed', completedSets: 10, plannedSets: 10, completionRate: 1,
  plannedMinutes: 60, actualMinutes: 58, readiness: 'normal', difficulty: 7,
  technique: 4, pain: 0, timeFit: 4, postSurveySkipped: false
}

function verifiedEvent(placement: ReturnType<typeof placementFor>, sequence: number, result: 'support' | 'review' | 'pain', movementIndex = 0): PlacementVerificationEvent {
  const movement = placement.movementPlacements?.[movementIndex]
  const exerciseId = movement?.exerciseId ?? 'plan'
  let event = beginPlacementVerification({ id: `verify-${exerciseId}-${sequence}`, placement, sessionId: `session-${exerciseId}-${sequence}`, sequence, startedAt: `2026-08-1${sequence}T10:00:00.000Z`, movementPlacement: movement })
  event = recordPlacementWarmup(event, result === 'pain' ? 'painful' : result === 'review' ? 'harder' : 'as-expected', `2026-08-1${sequence}T10:05:00.000Z`)
  event = completePlacementVerification(event, {
    firstSet: { sourceSetId: `set-${exerciseId}-${sequence}`, plannedExerciseId: `planned-${exerciseId}-${sequence}`, exerciseId, exerciseName: movement?.exerciseName ?? 'Plan Movement', targetLoad: 180, targetReps: 5, targetRir: 2, actualLoad: 180, actualReps: 5, actualRir: result === 'review' ? 0 : 2 },
    sessionEvidence,
    completedAt: `2026-08-1${sequence}T11:00:00.000Z`
  })
  return event.status === 'awaiting-recovery' ? resolvePlacementRecovery(event, 'recovered', `2026-08-1${sequence + 1}T08:00:00.000Z`) : event
}

describe('placement-exit-v1', () => {
  it('confirms a goal-specific route only after two supportive resolved checks', () => {
    const placement = placementFor()
    const assessment = buildPlacementExitAssessment({ placement, verificationEvents: [verifiedEvent(placement, 1, 'support'), verifiedEvent(placement, 2, 'support')], assessedAt: '2026-08-13T12:00:00.000Z' })
    expect(assessment).toMatchObject({ recommendation: 'confirm-current', suggestedRoute: 'strength', collected: 2, resolved: 2, supports: 2, reassessmentRequired: false })
    expect(assessment.criteria.map((item) => item.state)).toEqual(['met', 'met', 'met', 'met'])
    expect(placementExitAssessmentError(assessment)).toBeNull()
  })

  it('suggests athlete-reviewed advancement from a supported transitional route', () => {
    const placement = placementFor({ goal: null, skippedFields: ['current goal'] })
    expect(placement.selectedRoute).toBe('bridge-calibration')
    const assessment = buildPlacementExitAssessment({ placement, verificationEvents: [verifiedEvent(placement, 1, 'support'), verifiedEvent(placement, 2, 'support')], assessedAt: '2026-08-13T12:00:00.000Z' })
    expect(assessment).toMatchObject({ recommendation: 'review-advance', suggestedRoute: 'base-building' })
    expect(assessment.limitations.join(' ')).toMatch(/does not.*automatically change/i)
  })

  it('suggests a conservative reassessment after repeated review evidence', () => {
    const placement = placementFor()
    const assessment = buildPlacementExitAssessment({ placement, verificationEvents: [verifiedEvent(placement, 1, 'review'), verifiedEvent(placement, 2, 'review')], assessedAt: '2026-08-13T12:00:00.000Z' })
    expect(assessment).toMatchObject({ recommendation: 'review-conservative', suggestedRoute: 'base-building', reviews: 2 })
    expect(assessment.criteria.find((item) => item.id === 'route-support')?.state).toBe('not-met')
  })

  it('prioritizes pain-changing evidence and rejects a forged continue decision', () => {
    const placement = placementFor()
    const assessment = buildPlacementExitAssessment({ placement, verificationEvents: [verifiedEvent(placement, 1, 'pain')], assessedAt: '2026-08-12T12:00:00.000Z' })
    expect(assessment).toMatchObject({ recommendation: 'reassessment-required', suggestedRoute: null, reassessmentRequired: true })
    expect(placementExitReviewError({ id: 'review-1', ruleVersion: 'placement-exit-review-v1', placementCreatedAt: placement.createdAt, createdAt: '2026-08-12T12:01:00.000Z', decision: 'continue-current', reason: 'Keep going', assessment })).toMatch(/cannot be confirmed/i)
  })

  it('rejects altered recommendation evidence', () => {
    const placement = placementFor()
    const assessment = buildPlacementExitAssessment({ placement, verificationEvents: [verifiedEvent(placement, 1, 'support'), verifiedEvent(placement, 2, 'support')], assessedAt: '2026-08-13T12:00:00.000Z' })
    expect(placementExitAssessmentError({ ...assessment, recommendation: 'review-advance' })).toMatch(/does not reconcile/i)
  })

  it('does not let a different movement lane confirm the plan route', () => {
    const placement = placementFor()
    const support = verifiedEvent(placement, 1, 'support')
    const differentLane = { ...verifiedEvent(placement, 2, 'support'), placementRoute: 'bridge-calibration' as const, movementPlacement: { ...verifiedEvent(placement, 2, 'support').movementPlacement!, selectedRoute: 'bridge-calibration' as const, recommendedRoute: 'bridge-calibration' as const } }
    const assessment = buildPlacementExitAssessment({ placement, verificationEvents: [support, differentLane], assessedAt: '2026-08-13T12:00:00.000Z' })
    expect(assessment).toMatchObject({ collected: 1, supports: 1, excludedDifferentRouteChecks: 1, recommendation: 'collect-evidence' })
    expect(assessment.limitations.join(' ')).toMatch(/excluded.*differed from the plan route/i)
  })
})

describe('movement-placement-exit-v1', () => {
  const multiMovementPlacement = () => placementFor({
    movementProfiles: [
      { exerciseId: 'bench', exerciseName: 'Bench Press', family: 'Bench Press', movementSkill: 5, strengthTolerance: 4, dataConfidence: 4 },
      { exerciseId: 'squat', exerciseName: 'Back Squat', family: 'Squat', movementSkill: 2, strengthTolerance: 2, dataConfidence: 2 }
    ]
  })

  it('advances one supported transitional lane without borrowing another movement', () => {
    const placement = multiMovementPlacement()
    const squat = placement.movementPlacements![1]
    expect(squat.selectedRoute).toBe('bridge-calibration')
    const events = [verifiedEvent(placement, 1, 'support', 1), verifiedEvent(placement, 2, 'support', 1), verifiedEvent(placement, 1, 'support', 0)]
    const assessment = buildMovementPlacementExitAssessment({ placement, movementPlacement: squat, verificationEvents: events, assessedAt: '2026-08-13T12:00:00.000Z' })
    expect(assessment).toMatchObject({ exerciseId: 'squat', currentRoute: 'bridge-calibration', recommendation: 'review-advance', suggestedRoute: 'base-building', collected: 2, supports: 2, excludedOtherMovementChecks: 1 })
    expect(assessment.criteria.map((item) => item.state)).toEqual(['met', 'met', 'met', 'met'])
    expect(movementPlacementExitAssessmentError(assessment)).toBeNull()
  })

  it('does not let two supportive bench checks confirm the squat lane', () => {
    const placement = multiMovementPlacement()
    const squat = placement.movementPlacements![1]
    const assessment = buildMovementPlacementExitAssessment({ placement, movementPlacement: squat, verificationEvents: [verifiedEvent(placement, 1, 'support', 0), verifiedEvent(placement, 2, 'support', 0)], assessedAt: '2026-08-13T12:00:00.000Z' })
    expect(assessment).toMatchObject({ collected: 0, supports: 0, excludedOtherMovementChecks: 2, recommendation: 'collect-evidence' })
  })

  it('prioritizes exact-movement pain and rejects keep-current', () => {
    const placement = multiMovementPlacement()
    const squat = placement.movementPlacements![1]
    const assessment = buildMovementPlacementExitAssessment({ placement, movementPlacement: squat, verificationEvents: [verifiedEvent(placement, 1, 'pain', 1)], assessedAt: '2026-08-12T12:00:00.000Z' })
    expect(assessment).toMatchObject({ recommendation: 'reassessment-required', reassessmentRequired: true })
    expect(movementPlacementExitReviewError({ id: 'movement-review', ruleVersion: 'movement-placement-exit-review-v1', placementCreatedAt: placement.createdAt, exerciseId: 'squat', createdAt: '2026-08-12T12:01:00.000Z', decision: 'continue-current', reason: 'Keep the lane', assessment })).toMatch(/cannot be confirmed/i)
  })

  it('rejects an altered movement recommendation and a mismatched movement snapshot', () => {
    const placement = multiMovementPlacement()
    const squat = placement.movementPlacements![1]
    const assessment = buildMovementPlacementExitAssessment({ placement, movementPlacement: squat, verificationEvents: [verifiedEvent(placement, 1, 'support', 1), verifiedEvent(placement, 2, 'support', 1)], assessedAt: '2026-08-13T12:00:00.000Z' })
    expect(movementPlacementExitAssessmentError({ ...assessment, recommendation: 'confirm-current' })).toMatch(/does not reconcile/i)
    expect(() => buildMovementPlacementExitAssessment({ placement, movementPlacement: { ...squat, exerciseName: 'Forged Squat' }, verificationEvents: [], assessedAt: '2026-08-13T12:00:00.000Z' })).toThrow(/exact movement snapshot/i)
  })
})
