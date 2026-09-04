import { describe, expect, it } from 'vitest'
import { recommendNextTargetRir } from './effort-progression-engine'
import type { CompletedSetRecord, PlannedExercise, SurveyRecord } from './types'

const planned: PlannedExercise = {
  id: 'planned-bench',
  exerciseId: 'competition-bench',
  role: 'primary',
  purpose: 'Bench',
  restSeconds: 180,
  estimatedMinutes: 20,
  optional: false,
  sets: [{ id: 'prescribed', targetLoad: 175, targetReps: 6, targetRir: 3, completed: true }]
}

const exposure = (sessionId: string, completedAt: string, rir = 3): CompletedSetRecord => ({
  id: `${sessionId}-set`,
  sessionId,
  plannedExerciseId: planned.id,
  exerciseId: planned.exerciseId,
  exerciseName: 'Competition Bench Press',
  family: 'Bench Press',
  primaryRegion: 'chest',
  completedAt,
  reps: 6,
  load: 175,
  rir,
  rirKnown: true,
  technique: 4,
  pain: 0,
  qualityConfirmed: true,
  setIndex: 0
})

const feedback = (sessionId: string): SurveyRecord => ({
  id: `${sessionId}-feedback`,
  sessionId,
  type: 'movement',
  ruleVersion: 'movement-feedback-v1',
  plannedExerciseId: planned.id,
  exerciseId: planned.exerciseId,
  exerciseName: 'Competition Bench Press',
  sourceSetIds: [`${sessionId}-set`],
  completedAt: '2026-08-09T13:00:00.000Z',
  skipped: false,
  answers: [
    { id: 'movementPain', value: 0, status: 'answered' },
    { id: 'movementTechnique', value: 4, status: 'answered' },
    { id: 'loadFit', value: 3, status: 'answered' },
    { id: 'volumeFit', value: 2, status: 'answered' },
    { id: 'recovery', value: 4, status: 'answered' }
  ]
})

describe('gradual feedback-gated RIR progression', () => {
  const history = [
    exposure('week-1', '2026-08-01T12:00:00.000Z'),
    exposure('week-2', '2026-08-08T12:00:00.000Z')
  ]

  it('holds the first-week effort target in round two', () => {
    const decision = recommendNextTargetRir({ currentTargetRir: 3, nextMicrocycleNumber: 2, priorPlanned: planned, history, surveys: [feedback('week-2')] })
    expect(decision).toMatchObject({ ruleVersion: 'rir-progression-v1', action: 'hold', targetRir: 3 })
  })

  it('allows only one RIR of added effort after two supported exact exposures', () => {
    const decision = recommendNextTargetRir({ currentTargetRir: 3, nextMicrocycleNumber: 3, priorPlanned: planned, history, surveys: [feedback('week-2')] })
    expect(decision).toMatchObject({ action: 'reduce-one', targetRir: 2 })
  })

  it('does not prescribe 1 RIR before round five', () => {
    const decision = recommendNextTargetRir({ currentTargetRir: 2, nextMicrocycleNumber: 4, priorPlanned: planned, history, surveys: [feedback('week-2')] })
    expect(decision).toMatchObject({ action: 'hold', targetRir: 2 })
  })

  it('holds when the athlete already trained harder than prescribed', () => {
    const hardHistory = [history[0], exposure('week-2', '2026-08-08T12:00:00.000Z', 1)]
    const decision = recommendNextTargetRir({ currentTargetRir: 3, nextMicrocycleNumber: 3, priorPlanned: planned, history: hardHistory, surveys: [feedback('week-2')] })
    expect(decision).toMatchObject({ action: 'hold', targetRir: 3 })
    expect(decision.reasons.join(' ')).toMatch(/already trained materially harder/i)
  })

  it('does not make RIR harder from displayed values the athlete never entered', () => {
    const assumed = history.map((workSet) => ({ ...workSet, numbersEntered: false }))
    const decision = recommendNextTargetRir({ currentTargetRir: 3, nextMicrocycleNumber: 3, priorPlanned: planned, history: assumed, surveys: [feedback('week-2')] })
    expect(decision).toMatchObject({ action: 'hold', targetRir: 3 })
    expect(decision.reasons.join(' ')).toMatch(/two completed exact exposures/i)
  })
})
