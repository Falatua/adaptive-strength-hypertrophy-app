import { describe, expect, it } from 'vitest'
import { buildLifeAwareAssessment } from './life-aware-engine'
import { mesocycles, sessions } from './seed'
import type { MissedOpportunityEvent } from './types'

const assessedAt = '2026-08-13T12:00:00.000Z'

const missedEvent = (overrides: Partial<MissedOpportunityEvent> = {}): MissedOpportunityEvent => ({
  id: 'miss-1', ruleVersion: 'missed-opportunity-v1', sessionId: sessions[0].id, mesocycleId: sessions[0].mesocycleId ?? null,
  planVersion: sessions[0].planVersion ?? null, recordedAt: '2026-08-12T12:00:00.000Z', plannedAt: sessions[0].plannedDate,
  priorStatus: 'planned', input: { reason: 'family', trainingOutcome: 'no-training', nextOpportunityAt: '2026-08-14T12:00:00.000Z', nextMinutes: 30, constraintState: 'continuing', note: '', preferredNextSessionId: null },
  continuityBefore: 'stable', continuityAfter: 'interrupted', consecutiveMisses: 1, mode: 'defer-one', queueBefore: sessions.map((session) => session.id), queueAfter: sessions.map((session) => session.id),
  nextSessionId: sessions[1].id, nextPrimaryExerciseId: sessions[1].exercises[0].exerciseId, nextPrimaryLastExposureAt: null, nextPrimaryDaysSinceExposure: null,
  reasons: [], changes: [{ sessionId: sessions[0].id, fromPlannedAt: sessions[0].plannedDate, toPlannedAt: '2026-08-14T12:00:00.000Z', fromStatus: 'planned', toStatus: 'planned', fromDurationMinutes: 60, toDurationMinutes: 30, fromSetCount: 10, toSetCount: 5 }],
  preservedTerminalSessionIds: [], completedSetCountBefore: 0, completedSetCountAfter: 0, openSetCountBefore: 30, openSetCountAfter: 25,
  ...overrides
})

describe('life-aware assessment', () => {
  it('treats an external interruption as a schedule rebuild, not lost fitness or debt', () => {
    const result = buildLifeAwareAssessment({ sessions, history: [], missedOpportunityEvents: [missedEvent()], activePlan: mesocycles[0], priorityRegions: ['chest'], assessedAt })
    expect(result.state).toBe('interrupted')
    expect(result.today.action).toBe('rebuild')
    expect(result.round.action).toBe('extend')
    expect(result.metrics.notCarriedForwardSets).toBe(5)
    expect(result.guardrails.join(' ')).toMatch(/No missed set becomes work owed/i)
  })

  it('separates pain from an ordinary scheduling constraint', () => {
    const pain = missedEvent({ input: { ...missedEvent().input, reason: 'pain', constraintState: 'continuing' }, continuityAfter: 'returning', mode: 'reacclimation-review' })
    const result = buildLifeAwareAssessment({ sessions, history: [], missedOpportunityEvents: [pain], activePlan: mesocycles[0], priorityRegions: [], assessedAt })
    expect(result.latestConstraint.kind).toBe('health-safety')
    expect(result.today.action).toBe('review-safety')
    expect(result.round.action).toBe('recover')
    expect(result.block.action).toBe('review-recovery')
    expect(result.block.approvalRequired).toBe(true)
  })

  it('suggests a schedule-fit review only after repeated evidence', () => {
    const localSessions = sessions.map((session, index) => ({ ...session, plannedDate: `2026-08-${String(5 + index).padStart(2, '0')}T12:00:00.000Z`, status: index === 0 ? 'completed' as const : 'expired' as const }))
    const misses = [missedEvent(), missedEvent({ id: 'miss-2', recordedAt: '2026-08-11T12:00:00.000Z', consecutiveMisses: 2, mode: 'rebuild-sequence' })]
    const result = buildLifeAwareAssessment({ sessions: localSessions, history: [], missedOpportunityEvents: misses, activePlan: mesocycles[0], priorityRegions: [], assessedAt })
    expect(result.metrics.opportunityCompletionRate).toBeCloseTo(1 / 3)
    expect(result.block.action).toBe('review-frequency')
    expect(result.block.approvalRequired).toBe(true)
  })
})
