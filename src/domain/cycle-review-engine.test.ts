import { describe, expect, it } from 'vitest'
import { buildCycleReview, buildNextMicrocycle } from './cycle-review-engine'
import { equipmentProfiles, exercises, history, mesocycles, sessions } from './seed'

const plan = structuredClone(mesocycles[0])
const datedSessions = (status: 'planned' | 'completed', start = '2026-08-01T12:00:00.000Z') => sessions.map((session, index) => ({
  ...structuredClone(session),
  status,
  plannedDate: new Date(new Date(start).getTime() + index * 86_400_000).toISOString(),
  microcycleNumber: 1
}))

describe('criterion-based cycle review', () => {
  it('holds an incomplete exposure round before its target date', () => {
    const review = buildCycleReview(plan, datedSessions('planned'), [], new Date('2026-08-05T12:00:00.000Z'))
    expect(review.recommendation).toBe('continue-hold')
    expect(review.eligible.extend).toBe(false)
    expect(review.evidence.unresolvedSessions).toBe(3)
  })

  it('offers extension after the target date but before the maximum span', () => {
    const review = buildCycleReview(plan, datedSessions('planned'), [], new Date('2026-08-10T12:00:00.000Z'))
    expect(review.recommendation).toBe('extend')
    expect(review.eligible.extend).toBe(true)
    expect(review.maximumPassed).toBe(false)
  })

  it('recommends recovery after unresolved work exceeds the maximum span', () => {
    const review = buildCycleReview(plan, datedSessions('planned'), [], new Date('2026-08-20T12:00:00.000Z'))
    expect(review.recommendation).toBe('recover')
    expect(review.maximumPassed).toBe(true)
  })

  it('allows completion only after target rounds and minimum productive exposures', () => {
    const completed = Array.from({ length: 4 }, (_, roundIndex) => datedSessions('completed').map((session) => ({
      ...session,
      id: `${session.id}-round-${roundIndex + 1}`,
      microcycleNumber: roundIndex + 1
    }))).flat()
    const review = buildCycleReview(plan, completed, [], new Date('2026-08-10T12:00:00.000Z'))
    expect(review.microcycleNumber).toBe(4)
    expect(review.recommendation).toBe('complete')
    expect(review.eligible.complete).toBe(true)
    expect(review.evidence.totalQualifiedExposures).toBe(12)
  })

  it('queues a distinctly identified conservative recovery round', () => {
    const next = buildNextMicrocycle({
      plan, sessions: datedSessions('planned'), history, exercises, decision: 'recover', nextMicrocycleNumber: 2,
      startsAt: new Date('2026-08-20T12:00:00.000Z'), key: 'test', equipmentProfile: equipmentProfiles[0]
    })
    expect(next).toHaveLength(3)
    expect(next.every((session) => session.microcycleNumber === 2 && session.mesocycleId === plan.id)).toBe(true)
    expect(new Set(next.map((session) => session.id)).size).toBe(3)
    expect(next[0].exercises[0].sets.length).toBeLessThan(sessions[0].exercises[0].sets.length)
  })
})
