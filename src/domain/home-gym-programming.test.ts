import { describe, expect, it } from 'vitest'
import { equipmentProfiles, exercises } from './seed'
import { HOME_GYM_PROGRAMMING_RULE_VERSION, homeGymProgrammingPreference } from './home-gym-programming'

describe(HOME_GYM_PROGRAMMING_RULE_VERSION, () => {
  const home = equipmentProfiles.find((profile) => profile.id === 'equipment-home-gym')!
  const commercial = equipmentProfiles.find((profile) => profile.id === 'equipment-commercial-gym')!
  const preference = (exerciseId: string) => homeGymProgrammingPreference(exercises.find((exercise) => exercise.id === exerciseId)!, home)

  it('strongly ranks JB preferred home movements', () => {
    const preferred = [
      'squat-press', 'abx-cambered-bar-chest-supported-row', 'abx-chest-supported-db-row',
      'incline-barbell-press', 'incline-db-press', 'cambered-bar-bench', 'ssb-squat',
      'high-bar-squat', 'bulgarian-split-squat', 'leg-extension', 'lying-leg-curl',
      'red-band-pull-apart', 'weighted-dip', 'parallel-bar-dip'
    ]
    preferred.forEach((exerciseId) => expect(preference(exerciseId).score).toBeGreaterThan(0))
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
})
