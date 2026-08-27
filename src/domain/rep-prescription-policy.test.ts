import { describe, expect, it } from 'vitest'
import { athlete, equipmentProfiles, exercises } from './seed'
import { REP_PRESCRIPTION_POLICY_VERSION, applyRepPrescriptionPolicy, athleteReadyForLowRepWork, repRangeForExercise } from './rep-prescription-policy'

describe(REP_PRESCRIPTION_POLICY_VERSION, () => {
  const home = equipmentProfiles.find((profile) => profile.id === 'equipment-home-gym')!
  const bench = exercises.find((exercise) => exercise.id === 'competition-bench')!
  const legExtension = exercises.find((exercise) => exercise.id === 'leg-extension')!
  const lyingLegCurl = exercises.find((exercise) => exercise.id === 'lying-leg-curl')!

  it('keeps returning and undertrained primary work at eight repetitions or higher', () => {
    expect(applyRepPrescriptionPolicy({ exercise: bench, role: 'primary', suggestedReps: 4, route: 'reacclimation' })).toBe(8)
    expect(applyRepPrescriptionPolicy({ exercise: bench, role: 'primary', suggestedReps: 6, route: 'bridge-calibration' })).toBe(8)
    expect(applyRepPrescriptionPolicy({ exercise: bench, role: 'primary', suggestedReps: 4, route: 'introductory-skill' })).toBe(8)
  })

  it('allows low-repetition work only with stable continuity and demonstrated training evidence', () => {
    const ready = { ...structuredClone(athlete), trainingAge: 5, continuity: 'stable' as const, level: { ...athlete.level, experience: 4, movementSkill: 4, strengthTolerance: 4, dataConfidence: 4 } }
    expect(athleteReadyForLowRepWork(ready)).toBe(true)
    expect(applyRepPrescriptionPolicy({ exercise: bench, role: 'primary', suggestedReps: 4, athlete: ready, readiness: 'normal' })).toBe(4)
    expect(applyRepPrescriptionPolicy({ exercise: bench, role: 'primary', suggestedReps: 4, athlete: ready, readiness: 'confirm' })).toBe(8)
  })

  it('starts Freak Athlete Leg Developer extensions and curls at fifteen repetitions', () => {
    expect(applyRepPrescriptionPolicy({ exercise: legExtension, role: 'accessory', suggestedReps: 10, equipmentProfile: home })).toBe(15)
    expect(applyRepPrescriptionPolicy({ exercise: lyingLegCurl, role: 'accessory', suggestedReps: 12, equipmentProfile: home })).toBe(15)
  })

  it('keeps Leg Developer substitution progression inside a fifteen-to-twenty range', () => {
    const returning = { ...structuredClone(athlete), continuity: 'returning' as const }
    expect(repRangeForExercise({ exercise: legExtension, role: 'accessory', athlete: returning, readiness: 'reacclimate', equipmentProfile: home })).toEqual([15, 20])
  })
})

