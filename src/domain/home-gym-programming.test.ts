import { describe, expect, it } from 'vitest'
import { equipmentProfiles, exercises } from './seed'
import {
  HOME_GYM_PROGRAMMING_RULE_VERSION,
  homeGymAccessoryRegionAllowed,
  homeGymFrequentRowTarget,
  homeGymInitialPrescription,
  homeGymProgrammingPreference,
  homeGymPullUpTarget
} from './home-gym-programming'

describe(HOME_GYM_PROGRAMMING_RULE_VERSION, () => {
  const home = equipmentProfiles.find((profile) => profile.id === 'equipment-home-gym')!
  const commercial = equipmentProfiles.find((profile) => profile.id === 'equipment-commercial-gym')!
  const preference = (exerciseId: string) => homeGymProgrammingPreference(exercises.find((exercise) => exercise.id === exerciseId)!, home)

  it('strongly ranks JB preferred home movements', () => {
    const preferred = [
      'squat-press', 'abx-cambered-bar-chest-supported-row', 'abx-chest-supported-db-row',
      'incline-barbell-press', 'incline-db-press', 'cambered-bar-bench', 'ssb-squat',
      'high-bar-squat', 'bulgarian-split-squat', 'leg-extension', 'lying-leg-curl',
      'red-band-pull-apart', 'weighted-dip', 'parallel-bar-dip', 'deficit-conventional',
      'romanian-deadlift', 'stiff-leg-deadlift', 'pull-up', 'barbell-shrug'
    ]
    preferred.forEach((exerciseId) => expect(preference(exerciseId).score).toBeGreaterThan(0))
    expect(home.equipment).toContain('deficit platform')
    expect(preference('squat-press').score).toBeGreaterThan(preference('front-squat').score)
  })

  it('blocks automatic low-bar support work and de-prioritizes unlisted squat volume', () => {
    expect(preference('low-bar-squat')).toMatchObject({ automaticEligible: false })
    expect(preference('front-squat').score).toBeLessThan(0)
    expect(preference('ssb-squat').score).toBeGreaterThan(preference('front-squat').score)
  })

  it('does not impose JB Home Gym preferences on other locations', () => {
    const lowBar = exercises.find((exercise) => exercise.id === 'low-bar-squat')!
    expect(homeGymProgrammingPreference(lowBar, commercial)).toMatchObject({ automaticEligible: true, score: 0 })
  })

  it('turns JB pull-up capacity into a provisional target without inventing completed history', () => {
    const pullUp = exercises.find((exercise) => exercise.id === 'pull-up')!
    expect(homeGymInitialPrescription(pullUp, home)).toEqual({ sets: 3, reps: 5 })
    expect(homeGymInitialPrescription(pullUp, commercial)).toBeNull()
  })

  it('reserves rows for most sessions, one weekly pull-up exposure, and no more than one automatic calf opportunity', () => {
    expect([0, 1, 2].map((index) => homeGymFrequentRowTarget(index, 3, home))).toEqual([true, true, false])
    expect([0, 1, 2].map((index) => homeGymPullUpTarget(index, 3, home))).toEqual([false, false, true])
    expect([0, 1, 2].map((index) => homeGymAccessoryRegionAllowed('calves', index, 3, home))).toEqual([false, false, true])
    expect(preference('standing-calf-raise').score).toBeLessThan(0)
  })
})
