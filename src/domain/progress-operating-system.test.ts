import { describe, expect, it } from 'vitest'
import { buildTrainingMomentum } from './momentum-engine'
import { buildTrainingRoundReport } from './round-report-engine'
import { history, mesocycles, sessions } from './seed'

describe('schedule-aware progress reporting', () => {
  it('calls completed priorities on-path without requiring a streak', () => {
    const completed = sessions.map((session) => ({ ...structuredClone(session), status: 'completed' as const, mesocycleId: mesocycles[0].id }))
    const result = buildTrainingMomentum({ sessions: completed, history, missedEvents: [], activePlan: mesocycles[0], now: new Date('2026-08-15') })
    expect(result).toMatchObject({ status: 'on-path', completedPriorities: completed.length, plannedPriorities: completed.length })
    expect(result.explanation).toMatch(/calendar perfection is not required/i)
  })

  it('treats a long gap as a return path instead of debt', () => {
    const completed = [{ ...structuredClone(sessions[0]), status: 'completed' as const, mesocycleId: mesocycles[0].id }]
    const oldHistory = [{ ...history[0], sessionId: completed[0].id, completedAt: '2026-01-01T12:00:00.000Z' }]
    const result = buildTrainingMomentum({ sessions: completed, history: oldHistory, missedEvents: [], activePlan: mesocycles[0], now: new Date('2026-02-01') })
    expect(result.status).toBe('returning')
    expect(result.explanation).toMatch(/not a debt payment/i)
  })

  it('builds a round report only from linked round sessions and completed sets', () => {
    const completed = sessions.map((session) => ({ ...structuredClone(session), status: 'completed' as const, mesocycleId: mesocycles[0].id, microcycleNumber: 1 }))
    const linkedHistory = history.slice(0, 3).map((workSet, index) => ({ ...workSet, id: `round-report-${index}`, sessionId: completed[index % completed.length].id }))
    const report = buildTrainingRoundReport(mesocycles[0], completed, linkedHistory, [], new Date('2026-08-10'))
    expect(report.ruleVersion).toBe('training-round-report-v1')
    expect(report.sourceSessionIds).toEqual(completed.map((session) => session.id))
    expect(report.sourceSetIds).toEqual(linkedHistory.map((workSet) => workSet.id))
    expect(report.summary).toMatch(/priority workouts qualified/i)
  })
})
