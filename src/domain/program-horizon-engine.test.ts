import { describe, expect, it } from 'vitest'
import { buildProgramHorizon, recommendedTrainingRounds } from './program-horizon-engine'
import { athlete, mesocycles, sessions } from './seed'
import type { CycleReviewEvent } from './types'

describe('recommendedTrainingRounds', () => {
  it('uses shorter evidence-dense mesocycles for advanced stable athletes', () => {
    expect(recommendedTrainingRounds({ trainingAge: 8, continuity: 'stable' })).toBe(4)
    expect(recommendedTrainingRounds({ trainingAge: 3, continuity: 'stable' })).toBe(5)
    expect(recommendedTrainingRounds({ trainingAge: 1, continuity: 'stable' })).toBe(6)
  })

  it('starts interrupted or returning athletes with a shorter review horizon', () => {
    expect(recommendedTrainingRounds({ trainingAge: 8, continuity: 'interrupted' })).toBe(3)
    expect(recommendedTrainingRounds({ trainingAge: 8, continuity: 'returning' })).toBe(3)
  })
})

describe('buildProgramHorizon', () => {
  it('identifies the final hard round without calling it a deload', () => {
    const plan = { ...structuredClone(mesocycles[0]), targetMicrocycles: 4 }
    const roundFour = sessions.map((session) => ({ ...structuredClone(session), mesocycleId: plan.id, microcycleNumber: 4 }))
    const result = buildProgramHorizon({ plan, plans: [plan], sessions: roundFour, cycleReviews: [], now: new Date('2026-09-10T12:00:00.000Z') })
    expect(result).toMatchObject({ mesocycleStage: 'final-accumulation', stageLabel: 'Final accumulation round' })
    expect(result.stageGuidance).toContain('Do not turn this round into a hidden deload')
  })

  it('keeps an annual outline evidence-labeled when a full year is unavailable', () => {
    const result = buildProgramHorizon({ plan: mesocycles[0], plans: mesocycles, sessions, cycleReviews: [], now: new Date('2026-09-10T12:00:00.000Z') })
    expect(result.yearlyEvidence).toContain('does not yet have a full year')
    expect(result.horizons.map((horizon) => horizon.id)).toEqual(['mesocycle', 'development-phase', 'training-year'])
  })

  it('counts completed blocks and recovery decisions in the rolling year', () => {
    const plan = { ...structuredClone(mesocycles[0]), status: 'completed' as const, effectiveAt: '2025-01-01T12:00:00.000Z' }
    const completedSession = { ...structuredClone(sessions[0]), mesocycleId: plan.id, status: 'completed' as const, completedAt: '2026-08-01T12:00:00.000Z' }
    const review = {
      id: 'review', mesocycleId: plan.id, planVersion: plan.version, microcycleNumber: 4, decision: 'recover', createdAt: '2026-09-01T12:00:00.000Z',
      reason: 'Fatigue accumulated.', recommendation: 'recover', recommendationReasons: ['Recovery supported.'],
      evidence: { requiredSessions: 3, qualifiedSessions: 3, unresolvedSessions: 0, totalQualifiedExposures: 12, completedSets: 24, volumeLoad: 20_000, averageSessionRpe: 8, maximumPain: 0, calendarDays: 28 },
      generatedSessionIds: [], expiredSessionIds: []
    } satisfies CycleReviewEvent
    const result = buildProgramHorizon({ plan, plans: [plan], sessions: [completedSession], cycleReviews: [review], now: new Date('2026-09-10T12:00:00.000Z') })
    expect(result).toMatchObject({ completedBlocksLastYear: 1, recoveryDecisionsLastYear: 1 })
  })

  it('retains the athlete profile type contract', () => {
    expect(recommendedTrainingRounds(athlete)).toBe(3)
  })
})
