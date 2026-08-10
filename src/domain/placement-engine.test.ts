import { describe, expect, it } from 'vitest'
import { applyPlacementDecision, buildPlacementAssessment, placementAssessmentError } from './placement-engine'
import type { PlacementInputs } from './types'

const inputs = (overrides: Partial<PlacementInputs> = {}): PlacementInputs => ({
  goal: 'strength', fixedEvent: null, trainingAge: 8, continuity: 'stable', movementSkill: 5,
  strengthTolerance: 4, volumeTolerance: 4, scheduleStability: 4, dataConfidence: 4,
  painState: 'none', weeklyOpportunities: 3, defaultMinutes: 60,
  equipmentProfileId: 'equipment-commercial-gym', skippedFields: [], ...overrides
})

describe('placement-v1', () => {
  it('sends a prepared experienced athlete directly into goal-specific strength work', () => {
    const result = buildPlacementAssessment(inputs(), '2026-08-10T12:00:00.000Z')
    expect(result.recommendedRoute).toBe('strength')
    expect(result.confidence).toBe('high')
    expect(result.dimensions.experience).toBe(5)
    expect(result.reasons.join(' ')).toMatch(/direct goal-specific/i)
  })

  it('preserves experience while reacclimating an athlete after a meaningful gap', () => {
    const result = buildPlacementAssessment(inputs({ continuity: 'returning' }))
    expect(result.recommendedRoute).toBe('reacclimation')
    expect(result.dimensions.experience).toBe(5)
    expect(result.dimensions.recentContinuity).toBe(1)
    expect(result.whyNotLower).toMatch(/not support resetting/i)
  })

  it('uses introductory, bridge, and base routes for different limiting evidence', () => {
    expect(buildPlacementAssessment(inputs({ trainingAge: 0, movementSkill: 1 })).recommendedRoute).toBe('introductory-skill')
    expect(buildPlacementAssessment(inputs({ dataConfidence: 1 })).recommendedRoute).toBe('bridge-calibration')
    expect(buildPlacementAssessment(inputs({ scheduleStability: 2 })).recommendedRoute).toBe('base-building')
  })

  it('requires direct power prerequisites and gives modifying pain priority', () => {
    expect(buildPlacementAssessment(inputs({ goal: 'power', strengthTolerance: 3 })).recommendedRoute).toBe('base-building')
    expect(buildPlacementAssessment(inputs({ goal: 'power', painState: 'modifying' })).recommendedRoute).toBe('pain-aware-modified')
  })

  it('turns skipped evidence into low confidence instead of fabricated readiness', () => {
    const result = buildPlacementAssessment(inputs({
      goal: null, trainingAge: null, continuity: null, movementSkill: null, strengthTolerance: null,
      volumeTolerance: null, scheduleStability: null, dataConfidence: null, painState: 'unknown',
      skippedFields: ['goal', 'history', 'capacity']
    }))
    expect(result.recommendedRoute).toBe('bridge-calibration')
    expect(result.confidence).toBe('low')
    expect(result.uncertainInputs).toContain('current goal')
  })

  it('stores conservative and aggressive-test decisions without bypassing pain priority', () => {
    const direct = buildPlacementAssessment(inputs())
    expect(applyPlacementDecision(direct, 'conservative').selectedRoute).toBe('base-building')
    const aggressive = applyPlacementDecision(direct, 'aggressive-test')
    expect(aggressive).toMatchObject({ selectedRoute: 'strength', decision: 'aggressive-test' })
    expect(aggressive.verificationPlan[0]).toMatch(/faster submaximal/i)
    const pain = buildPlacementAssessment(inputs({ painState: 'modifying' }))
    expect(applyPlacementDecision(pain, 'conservative').selectedRoute).toBe('pain-aware-modified')
    expect(applyPlacementDecision(direct, 'quick-start')).toMatchObject({ selectedRoute: 'strength', decision: 'quick-start', confidence: 'low' })
  })

  it('validates assessment provenance and dimensions', () => {
    const valid = buildPlacementAssessment(inputs())
    expect(placementAssessmentError(valid)).toBeNull()
    expect(placementAssessmentError({ ...valid, dimensions: { ...valid.dimensions, movementSkill: 7 } })).toMatch(/one to five/i)
    expect(placementAssessmentError({ ...valid, ruleVersion: 'placement-v0' })).toMatch(/rule version/i)
  })
})
