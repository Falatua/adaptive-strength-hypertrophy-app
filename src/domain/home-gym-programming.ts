import type { BodyRegion, EquipmentProfile, Exercise } from './types'

export const HOME_GYM_PROGRAMMING_RULE_VERSION = 'home-gym-preference-v3' as const

const rotatingTricepsPresses = ['two-board-press', 'close-grip-bench', 'spoto-press'] as const
export const HOME_GYM_TRICEPS_PRESS_IDS: readonly string[] = rotatingTricepsPresses
const purposefulFlatPresses = new Set<string>([...rotatingTricepsPresses, 'cambered-bar-bench'])

const preferredScores: Readonly<Record<string, number>> = {
  'squat-press': 24,
  'abx-cambered-bar-chest-supported-row': 22,
  'abx-chest-supported-db-row': 18,
  'incline-barbell-press': 38,
  'incline-db-press': 35,
  'two-board-press': 24,
  'close-grip-bench': 23,
  'spoto-press': 22,
  'cambered-bar-bench': 10,
  'ssb-squat': 14,
  'high-bar-squat': 10,
  'bulgarian-split-squat': 14,
  'leg-extension': 16,
  'single-leg-extension': 12,
  'lying-leg-curl': 14,
  'red-band-pull-apart': 13,
  'weighted-dip': 13,
  'parallel-bar-dip': 11,
  'deficit-conventional': 22,
  'romanian-deadlift': 20,
  'stiff-leg-deadlift': 18,
  'pull-up': 21,
  'barbell-shrug': 17
}

const isJbHomeGym = (profile?: EquipmentProfile) => {
  if (!profile || profile.kind !== 'home-gym') return false
  const available = new Set(profile.equipment.map((item) => item.toLowerCase()))
  return profile.id === 'equipment-home-gym' || available.has('freak athlete abx bench')
}

export const homeGymInitialPrescription = (exercise: Exercise, profile?: EquipmentProfile) => {
  if (!isJbHomeGym(profile) || exercise.id !== 'pull-up') return null
  return { sets: 3, reps: 5 }
}

export const homeGymFrequentRowTarget = (sessionIndex: number, sessionCount: number, profile?: EquipmentProfile) => {
  if (!isJbHomeGym(profile) || sessionCount <= 0) return false
  return sessionIndex < Math.ceil(sessionCount * 2 / 3)
}

export const homeGymPullUpTarget = (sessionIndex: number, sessionCount: number, profile?: EquipmentProfile) => {
  if (!isJbHomeGym(profile) || sessionCount <= 0) return false
  return sessionIndex === sessionCount - 1
}

export const homeGymInclinePressTarget = (sessionIndex: number, sessionCount: number, profile?: EquipmentProfile) => {
  if (!isJbHomeGym(profile) || sessionCount <= 0) return false
  return sessionIndex === 0
}

export const homeGymTricepsPressTarget = (sessionIndex: number, sessionCount: number, profile?: EquipmentProfile) => {
  if (!isJbHomeGym(profile) || sessionCount <= 0) return false
  return sessionIndex === sessionCount - 1
}

export const homeGymTricepsPressId = (planVersion: number) => {
  const stableVersion = Math.max(1, Math.trunc(planVersion))
  return rotatingTricepsPresses[(stableVersion - 1) % rotatingTricepsPresses.length]
}

export const homeGymAccessoryRegionAllowed = (region: BodyRegion, sessionIndex: number, sessionCount: number, profile?: EquipmentProfile) => {
  if (!isJbHomeGym(profile) || region !== 'calves') return true
  return sessionCount > 0 && sessionIndex === sessionCount - 1
}

/** Soft ranking applies only to automatic support-work selection. Protected anchors remain athlete-controlled. */
export const homeGymProgrammingPreference = (exercise: Exercise, profile?: EquipmentProfile) => {
  if (!isJbHomeGym(profile)) return { automaticEligible: true, score: 0, ruleVersion: HOME_GYM_PROGRAMMING_RULE_VERSION }
  if (exercise.id === 'low-bar-squat') return { automaticEligible: false, score: -100, ruleVersion: HOME_GYM_PROGRAMMING_RULE_VERSION }

  const preferred = preferredScores[exercise.id] ?? 0
  const squatPenalty = exercise.pattern === 'squat' && preferred === 0 ? -12 : 0
  const calfPenalty = exercise.primaryRegion === 'calves' ? -20 : 0
  const generalFlatPressPenalty = exercise.family === 'Bench Press' && !purposefulFlatPresses.has(exercise.id) ? -14 : 0
  return {
    automaticEligible: true,
    score: preferred + squatPenalty + calfPenalty + generalFlatPressPenalty,
    ruleVersion: HOME_GYM_PROGRAMMING_RULE_VERSION
  }
}
