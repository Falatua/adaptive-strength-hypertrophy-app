import { describe, expect, it } from 'vitest'
import { applyPlacementDecision, buildPlacementAssessment, legacyPlacementForAthlete, placementAssessmentError } from './placement-engine'
import { buildPlacementHistoryEvidence } from './placement-history-engine'
import type { CompletedSetRecord, PlacementInputs } from './types'

const reorderJsonObjectKeys = <T,>(value: T): T => {
  if (Array.isArray(value)) return value.map((item) => reorderJsonObjectKeys(item)) as T
  if (typeof value !== 'object' || value === null) return value
  return Object.fromEntries(Object.entries(value).reverse().map(([key, item]) => [key, reorderJsonObjectKeys(item)])) as T
}

const inputs = (overrides: Partial<PlacementInputs> = {}): PlacementInputs => ({
  goal: 'strength', fixedEvent: null, trainingAge: 8, continuity: 'stable', movementSkill: 5,
  strengthTolerance: 4, volumeTolerance: 4, scheduleStability: 4, dataConfidence: 4,
  painState: 'none', weeklyOpportunities: 3, defaultMinutes: 60,
  equipmentProfileId: 'equipment-commercial-gym', skippedFields: [], ...overrides
})

describe('placement-v3 with placement-v1 and placement-v2 compatibility', () => {
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

  it('requires stable demonstrated readiness before selecting a low-repetition route', () => {
    expect(buildPlacementAssessment(inputs({ goal: 'strength', continuity: 'interrupted' })).recommendedRoute).toBe('base-building')
    expect(buildPlacementAssessment(inputs({ goal: 'powerbuilding', trainingAge: 1.5 })).recommendedRoute).toBe('base-building')
    expect(buildPlacementAssessment(inputs({ goal: 'event-specific', fixedEvent: 'Meet', continuity: 'interrupted' })).recommendedRoute).toBe('base-building')
    expect(buildPlacementAssessment(inputs({ goal: 'strength', continuity: 'stable' })).recommendedRoute).toBe('strength')
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
    expect(placementAssessmentError(reorderJsonObjectKeys(valid))).toBeNull()
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
    expect(result).toMatchObject({ ruleVersion: 'placement-v3', recommendedRoute: 'strength' })
    expect(result.movementPlacements?.every((movement) => movement.ruleVersion === 'movement-placement-v2')).toBe(true)
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
    const prior = structuredClone(result)
    prior.ruleVersion = 'placement-v2'
    prior.movementPlacements = prior.movementPlacements?.map((movement) => ({ ...movement, ruleVersion: 'movement-placement-v1' as const, historyReview: undefined }))
    expect(placementAssessmentError(prior)).toBeNull()
  })

  it('accepts placement-v3 evidence saved before the route copy was renamed', () => {
    const result = applyPlacementDecision(buildPlacementAssessment(inputs({
      goal: 'powerbuilding',
      movementProfiles: [{ exerciseId: 'competition-bench', exerciseName: 'Competition Bench Press', family: 'Bench Press', movementSkill: 5, strengthTolerance: 5, dataConfidence: 5 }]
    })), 'confirmed')
    expect(result.movementPlacements?.[0].reasons[0]).toContain('Strength and Size')
    const saved = structuredClone(result)
    saved.movementPlacements![0].reasons[0] = saved.movementPlacements![0].reasons[0].replace('Strength and Size', 'Direct Powerbuilding Development')
    expect(placementAssessmentError(saved)).toBeNull()
    const forged = structuredClone(saved)
    forged.movementPlacements![0].reasons[0] = 'Competition Bench Press is cleared for anything.'
    expect(placementAssessmentError(forged)).toMatch(/does not reconcile/i)
  })

  it('preserves explicitly accepted exact-history suggestions without inferring skill', () => {
    const history = [1, 2, 3, 4].map((index): CompletedSetRecord => ({
      id: `set-${index}`, sessionId: `session-${Math.ceil(index / 2)}`, exerciseId: 'competition-bench', exerciseName: 'Competition Bench Press',
      family: 'Bench Press', primaryRegion: 'chest', completedAt: index <= 2 ? '2026-08-01T12:00:00.000Z' : '2026-08-06T12:00:00.000Z',
      reps: 5, load: 185, rir: 2, rirKnown: true, technique: 0, pain: 0, qualityConfirmed: false, setIndex: index % 2,
      importBatchId: 'batch', importSourceName: 'history.csv', importRow: index, importFingerprint: `fingerprint-${index}`, importUnits: 'lb'
    }))
    const evidence = buildPlacementHistoryEvidence({ exercise: { id: 'competition-bench', name: 'Competition Bench Press' }, history, assessedAt: '2026-08-10T12:00:00.000Z' })
    const result = buildPlacementAssessment(inputs({
      movementProfiles: [{
        exerciseId: 'competition-bench', exerciseName: 'Competition Bench Press', family: 'Bench Press', movementSkill: 4,
        strengthTolerance: evidence.suggestedStrengthTolerance, dataConfidence: evidence.suggestedDataConfidence,
        historyReview: { evidence, acceptedFields: ['dataConfidence', 'strengthTolerance'], reviewedAt: '2026-08-10T12:01:00.000Z' }
      }]
    }), '2026-08-10T12:02:00.000Z')
    expect(result.movementPlacements?.[0]).toMatchObject({
      ruleVersion: 'movement-placement-v2', movementSkill: 4, dataConfidence: 4, strengthTolerance: 3,
      historyReview: { acceptedFields: ['dataConfidence', 'strengthTolerance'], evidence: { ruleVersion: 'placement-history-v1', sourceSetIds: ['set-3', 'set-4', 'set-1', 'set-2'] } }
    })
    expect(result.movementPlacements?.[0].reasons.join(' ')).toMatch(/athlete-reviewed exact history.*without inferring movement skill or pain/i)
    expect(placementAssessmentError(result)).toBeNull()
    const forged = structuredClone(result)
    forged.inputs.movementProfiles![0].dataConfidence = 5
    expect(placementAssessmentError(forged)).toMatch(/does not match|reconcile/i)
  })
})
