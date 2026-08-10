import { describe, expect, it } from 'vitest'
import { applyPlacementDecision, buildPlacementAssessment, legacyPlacementForAthlete, placementAssessmentError } from './placement-engine'
import type { PlacementInputs } from './types'

const inputs = (overrides: Partial<PlacementInputs> = {}): PlacementInputs => ({
  goal: 'strength', fixedEvent: null, trainingAge: 8, continuity: 'stable', movementSkill: 5,
  strengthTolerance: 4, volumeTolerance: 4, scheduleStability: 4, dataConfidence: 4,
  painState: 'none', weeklyOpportunities: 3, defaultMinutes: 60,
  equipmentProfileId: 'equipment-commercial-gym', skippedFields: [], ...overrides
})

describe('placement-v2 with placement-v1 compatibility', () => {
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

  it('places exact protected movements independently inside one goal-specific cycle', () => {
    const result = buildPlacementAssessment(inputs({
      movementProfiles: [
        { exerciseId: 'competition-squat', exerciseName: 'Competition Back Squat', family: 'Squat', movementSkill: 1, strengthTolerance: 2, dataConfidence: 2 },
        { exerciseId: 'competition-bench', exerciseName: 'Competition Bench Press', family: 'Bench Press', movementSkill: 5, strengthTolerance: 5, dataConfidence: 5 },
        { exerciseId: 'sumo-deadlift', exerciseName: 'Sumo Deadlift', family: 'Deadlift', movementSkill: 3, strengthTolerance: 3, dataConfidence: 1 }
      ]
    }))
    expect(result).toMatchObject({ ruleVersion: 'placement-v2', recommendedRoute: 'strength' })
    expect(result.movementPlacements?.map((movement) => [movement.exerciseId, movement.selectedRoute])).toEqual([
      ['competition-squat', 'introductory-skill'],
      ['competition-bench', 'strength'],
      ['sumo-deadlift', 'bridge-calibration']
    ])
    expect(result.movementPlacements?.[0].reasons.join(' ')).toMatch(/new or not yet repeatable/i)
    expect(result.movementPlacements?.[1].reasons.join(' ')).toMatch(/own history/i)
  })

  it('keeps unknown per-movement answers unknown and applies athlete conservatism to every lane', () => {
    const result = buildPlacementAssessment(inputs({
      movementProfiles: [{ exerciseId: 'competition-bench', exerciseName: 'Competition Bench Press', family: 'Bench Press', movementSkill: null, strengthTolerance: null, dataConfidence: null }]
    }))
    expect(result.confidence).toBe('medium')
    expect(result.movementPlacements?.[0]).toMatchObject({ recommendedRoute: 'bridge-calibration', confidence: 'medium', movementSkill: 3, strengthTolerance: 3, dataConfidence: 3 })
    expect(result.uncertainInputs).toContain('Competition Bench Press movement skill')
    expect(applyPlacementDecision(result, 'conservative').movementPlacements?.[0].selectedRoute).toBe('reacclimation')
  })

  it('rejects forged movement placement and preserves legacy placement without invented lanes', () => {
    const result = buildPlacementAssessment(inputs({
      movementProfiles: [{ exerciseId: 'competition-bench', exerciseName: 'Competition Bench Press', family: 'Bench Press', movementSkill: 5, strengthTolerance: 5, dataConfidence: 5 }]
    }))
    const forged = structuredClone(result)
    forged.movementPlacements![0].selectedRoute = 'introductory-skill'
    expect(placementAssessmentError(forged)).toMatch(/does not reconcile/i)
    const legacy = legacyPlacementForAthlete({ trainingAge: 8, continuity: 'stable' })
    expect(legacy.ruleVersion).toBe('placement-v1')
    expect(legacy.movementPlacements).toBeUndefined()
    expect(placementAssessmentError(legacy)).toBeNull()
  })
})
