import { describe, expect, it } from 'vitest'
import { athlete, exercises, history, sessions } from './seed'
import { rankExerciseSubstitutions } from './substitution-engine'

const benchSession = structuredClone(sessions.find((session) => session.id === 'session-bench')!)
const benchPlan = benchSession.exercises.find((planned) => planned.id === 'plan-bench')!
const bench = exercises.find((exercise) => exercise.id === 'competition-bench')!

const ranked = (reason: Parameters<typeof rankExerciseSubstitutions>[0]['reason'], sourceHistory = history) => rankExerciseSubstitutions({
  planned: structuredClone(benchPlan),
  original: bench,
  exercises: structuredClone(exercises),
  history: structuredClone(sourceHistory),
  athlete: structuredClone(athlete),
  readiness: 'normal',
  reason
})

describe('explainable exercise substitutions', () => {
  it('is deterministic and preserves ranked evidence snapshots', () => {
    expect(ranked('none').map((item) => item.snapshot)).toEqual(ranked('none').map((item) => item.snapshot))
    const first = ranked('none')[0]
    expect(first.snapshot.rank).toBe(1)
    expect(first.snapshot.reasons.length).toBeGreaterThan(0)
    expect(first.snapshot.preserves).toBeTruthy()
    expect(first.snapshot.changes).toMatch(/progression clock/i)
  })

  it('uses the selected movement exact history and never copies the original load', () => {
    const distinctHistory = history.map((workSet) => workSet.exerciseId === 'two-board-press' ? { ...workSet, load: 80 } : workSet)
    const result = ranked('preference', distinctHistory).find((item) => item.candidate.id === 'two-board-press')!
    expect(result.prescriptionMethod).toBe('exact-history')
    expect(result.prescription.length).toBeLessThanOrEqual(benchPlan.sets.length)
    expect(result.prescription[0].targetLoad).not.toBe(benchPlan.sets[0].targetLoad)
    expect(result.prescriptionNote).toMatch(/original movement load was not copied/i)
  })

  it('creates a conservative calibration when the selected movement has no exact history', () => {
    const result = ranked('equipment').find((item) => item.candidate.id === 'coffin-press')!
    expect(result.prescriptionMethod).toBe('baseline-calibration')
    expect(result.prescription).toHaveLength(2)
    expect(result.prescription.every((workSet) => workSet.targetLoad === 0 && workSet.targetRir >= 3)).toBe(true)
    expect(result.prescriptionNote).toMatch(/was not copied/i)
  })

  it('changes the explanation and score when the athlete supplies a reason', () => {
    const neutral = ranked('none').find((item) => item.candidate.id === 'coffin-press')!
    const equipment = ranked('equipment').find((item) => item.candidate.id === 'coffin-press')!
    expect(equipment.snapshot.score).toBeGreaterThan(neutral.snapshot.score)
    expect(equipment.snapshot.reasons).toContain('changes the required equipment')
  })
})
