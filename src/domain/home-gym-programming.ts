import type { EquipmentProfile, Exercise } from './types'

export const HOME_GYM_PROGRAMMING_RULE_VERSION = 'home-gym-preference-v1' as const

const preferredScores: Readonly<Record<string, number>> = {
  'squat-press': 24,
  'abx-cambered-bar-chest-supported-row': 22,
  'abx-chest-supported-db-row': 18,
  'incline-barbell-press': 16,
  'incline-db-press': 16,
  'cambered-bar-bench': 15,
  'ssb-squat': 14,
  'high-bar-squat': 10,
  'bulgarian-split-squat': 14,
  'leg-extension': 14,
  'single-leg-extension': 12,
  'lying-leg-curl': 14,
  'red-band-pull-apart': 13,
  'weighted-dip': 13,
  'parallel-bar-dip': 11
}

const isJbHomeGym = (profile?: EquipmentProfile) => {
  if (!profile || profile.kind !== 'home-gym') return false
  const available = new Set(profile.equipment.map((item) => item.toLowerCase()))
  return profile.id === 'equipment-home-gym' || available.has('freak athlete abx bench')
}

/** Soft ranking applies only to automatic support-work selection. Protected anchors remain athlete-controlled. */
export const homeGymProgrammingPreference = (exercise: Exercise, profile?: EquipmentProfile) => {
  if (!isJbHomeGym(profile)) return { automaticEligible: true, score: 0, ruleVersion: HOME_GYM_PROGRAMMING_RULE_VERSION }
  if (exercise.id === 'low-bar-squat') return { automaticEligible: false, score: -100, ruleVersion: HOME_GYM_PROGRAMMING_RULE_VERSION }

  const preferred = preferredScores[exercise.id] ?? 0
  const squatPenalty = exercise.pattern === 'squat' && preferred === 0 ? -12 : 0
  return {
    automaticEligible: true,
    score: preferred + squatPenalty,
    ruleVersion: HOME_GYM_PROGRAMMING_RULE_VERSION
  }
}

