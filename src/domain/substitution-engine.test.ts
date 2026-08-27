import { describe, expect, it } from 'vitest'
import { athlete, equipmentProfiles, exercises, history, sessions } from './seed'
import { rankExerciseSubstitutions } from './substitution-engine'

const benchSession = structuredClone(sessions.find((session) => session.id === 'session-bench')!)
const benchPlan = benchSession.exercises.find((planned) => planned.id === 'plan-bench')!
const bench = exercises.find((exercise) => exercise.id === 'competition-bench')!
const squatSession = structuredClone(sessions.find((session) => session.id === 'session-squat')!)
const squatPlan = squatSession.exercises.find((planned) => planned.id === 'plan-squat')!
const squat = exercises.find((exercise) => exercise.id === 'competition-squat')!

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

  it('excludes every replacement that is unavailable at the active location', () => {
    const travel = equipmentProfiles.find((profile) => profile.id === 'equipment-travel')!
    const result = rankExerciseSubstitutions({
      planned: structuredClone(benchPlan), original: bench, exercises: structuredClone(exercises), history: structuredClone(history),
      athlete: structuredClone(athlete), readiness: 'normal', reason: 'equipment', equipmentProfile: travel
    })
    expect(result.map((item) => item.candidate.id)).toEqual(expect.arrayContaining(['incline-db-press', 'hammer-curl', 'push-up']))
    expect(result.map((item) => item.candidate.id)).not.toEqual(expect.arrayContaining(['competition-squat', 'leg-press-45']))
    expect(result.every((item) => item.snapshot.reasons.includes('available at Travel Setup'))).toBe(true)
  })

  it('offers leg press as a compatible squat replacement without copying squat load', () => {
    const commercial = equipmentProfiles.find((profile) => profile.id === 'equipment-commercial-gym')!
    const result = rankExerciseSubstitutions({
      planned: structuredClone(squatPlan), original: squat, exercises: structuredClone(exercises), history: structuredClone(history),
      athlete: structuredClone(athlete), readiness: 'normal', reason: 'preference', equipmentProfile: commercial
    })
    const legPress = result.find((item) => item.candidate.id === 'leg-press-45')!
    expect(legPress).toBeTruthy()
    expect(legPress.snapshot).toMatchObject({ tier: expect.stringMatching(/best-match|good-alternative/), preserves: expect.stringMatching(/quadriceps.*squat/i) })
    expect(legPress.prescriptionMethod).toBe('baseline-calibration')
    expect(legPress.prescription.every((workSet) => workSet.targetLoad === 0 && workSet.targetRir >= 3)).toBe(true)
    expect(legPress.prescription.every((workSet) => workSet.targetReps >= 8)).toBe(true)
  })

  it('keeps Home Gym Leg Developer substitutions at fifteen repetitions or higher', () => {
    const home = equipmentProfiles.find((profile) => profile.id === 'equipment-home-gym')!
    const returning = { ...structuredClone(athlete), continuity: 'returning' as const }
    const result = rankExerciseSubstitutions({
      planned: structuredClone(squatPlan), original: squat, exercises: structuredClone(exercises), history: [],
      athlete: returning, readiness: 'reacclimate', reason: 'preference', equipmentProfile: home
    })
    const legExtension = result.find((item) => item.candidate.id === 'leg-extension')!
    expect(legExtension.prescriptionMethod).toBe('baseline-calibration')
    expect(legExtension.prescription.every((workSet) => workSet.targetReps >= 15 && workSet.targetRir >= 3)).toBe(true)
  })

  it('never recommends a movement the athlete marked avoid', () => {
    const avoided = structuredClone(exercises).map((exercise) => exercise.id === 'leg-press-45' ? { ...exercise, disliked: true } : exercise)
    const commercial = equipmentProfiles.find((profile) => profile.id === 'equipment-commercial-gym')!
    const result = rankExerciseSubstitutions({
      planned: structuredClone(squatPlan), original: squat, exercises: avoided, history: structuredClone(history),
      athlete: structuredClone(athlete), readiness: 'normal', reason: 'preference', equipmentProfile: commercial
    })
    expect(result.map((item) => item.candidate.id)).not.toContain('leg-press-45')
  })
})
