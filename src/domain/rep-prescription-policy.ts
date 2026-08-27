import type { AthleteProfile, EquipmentProfile, Exercise, ExerciseRole, PlacementRoute, ReadinessOutcome } from './types'

export const REP_PRESCRIPTION_POLICY_VERSION = 'rep-readiness-v1' as const

const rebuildingRoutes = new Set<PlacementRoute>(['introductory-skill', 'reacclimation', 'bridge-calibration', 'base-building'])
const legDeveloperExerciseIds = new Set(['leg-extension', 'single-leg-extension', 'lying-leg-curl'])

const rebuildingFloor: Record<ExerciseRole, number> = {
  primary: 8,
  secondary: 10,
  accessory: 12,
  tertiary: 12
}

const rebuildingCeiling: Record<ExerciseRole, number> = {
  primary: 12,
  secondary: 15,
  accessory: 20,
  tertiary: 20
}

export const isLegExtensionOrCurl = (exercise: Exercise) => {
  return exercise.family === 'Knee Extension' || exercise.family === 'Leg Curl' || legDeveloperExerciseIds.has(exercise.id)
}

export const isFreakAthleteLegDeveloperProfile = (profile?: EquipmentProfile) => {
  if (!profile || profile.kind !== 'home-gym') return false
  return profile.equipment.some((item) => item.toLowerCase() === 'freak athlete leg developer')
}

export function athleteReadyForLowRepWork(athlete: AthleteProfile) {
  return athlete.continuity === 'stable'
    && athlete.trainingAge >= 2
    && athlete.level.experience >= 3
    && athlete.level.movementSkill >= 3
    && athlete.level.strengthTolerance >= 3
    && athlete.level.dataConfidence >= 3
}

export function applyRepPrescriptionPolicy(input: {
  exercise: Exercise
  role: ExerciseRole
  suggestedReps: number
  route?: PlacementRoute
  reacclimating?: boolean
  equipmentProfile?: EquipmentProfile
  athlete?: AthleteProfile
  readiness?: ReadinessOutcome
}) {
  const rebuilding = input.reacclimating === true
    || (input.route !== undefined && rebuildingRoutes.has(input.route))
    || (input.athlete !== undefined && (!athleteReadyForLowRepWork(input.athlete) || input.readiness !== 'normal'))
  const legIsolation = isLegExtensionOrCurl(input.exercise)
  const legFloor = legIsolation ? (isFreakAthleteLegDeveloperProfile(input.equipmentProfile) ? 15 : 12) : 0
  const routeFloor = rebuilding ? rebuildingFloor[input.role] : 0
  return Math.max(input.suggestedReps, routeFloor, legFloor)
}

export function repRangeForExercise(input: {
  exercise: Exercise
  role: ExerciseRole
  athlete: AthleteProfile
  readiness: ReadinessOutcome
  equipmentProfile?: EquipmentProfile
}): [number, number] {
  const base: Record<ExerciseRole, [number, number]> = {
    primary: [3, 6],
    secondary: [6, 10],
    accessory: [8, 15],
    tertiary: [8, 15]
  }
  const [baseFloor, baseCeiling] = base[input.role]
  const rebuilding = !athleteReadyForLowRepWork(input.athlete) || input.readiness !== 'normal'
  const minimum = applyRepPrescriptionPolicy({
    exercise: input.exercise,
    role: input.role,
    suggestedReps: baseFloor,
    athlete: input.athlete,
    readiness: input.readiness,
    equipmentProfile: input.equipmentProfile
  })
  const legIsolation = isLegExtensionOrCurl(input.exercise)
  const maximum = legIsolation ? 20 : rebuilding ? rebuildingCeiling[input.role] : Math.max(baseCeiling, minimum)
  return [minimum, Math.max(minimum, maximum)]
}

