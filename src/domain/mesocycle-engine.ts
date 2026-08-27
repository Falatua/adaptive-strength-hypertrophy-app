import { addDays } from 'date-fns'
import { makeSets } from './training-engine'
import { equipmentGenerationEvidence, exerciseEquipmentFit, loadIncrementFor, nearestExecutableLoad } from './equipment-engine'
import { EQUIPMENT_ROUTE_SESSION_RULE_VERSION, ROUTE_SESSION_RULE_VERSION, prescriptionForRole, routeSessionProfile, type RouteSessionProfile } from './route-session-engine'
import {
  HOME_GYM_TRICEPS_PRESS_IDS,
  homeGymAccessoryRegionAllowed,
  homeGymFrequentRowTarget,
  homeGymInclinePressTarget,
  homeGymInitialPrescription,
  homeGymProgrammingPreference,
  homeGymPullUpTarget,
  homeGymTricepsPressId,
  homeGymTricepsPressTarget
} from './home-gym-programming'
import type {
  BodyRegion,
  CompletedSetRecord,
  EquipmentProfile,
  Exercise,
  ExerciseRole,
  MesocycleDraft,
  MesocyclePlan,
  PlannedExercise,
  TrainingSession
} from './types'

export interface MesocyclePreview {
  sessions: TrainingSession[]
  requiredExposureCount: number
  projectedSets: number
  projectedMinutes: number
  projectedBlockSets: number
  projectedBlockMinutes: number
  regionSets: Partial<Record<BodyRegion, number>>
  protectedAnchors: string[]
  explanations: string[]
}

export interface GenerationContext {
  exercises: Exercise[]
  currentSessions: TrainingSession[]
  history: CompletedSetRecord[]
  planId: string
  planVersion: number
  startsAt?: Date
  sessionKeyPrefix?: string
  microcycleNumber?: number
  placementCreatedAt?: string
  equipmentProfile?: EquipmentProfile
}

const adaptationCopy = {
  powerbuilding: {
    primary: 'Practice and progress your main lifts while preserving hypertrophy work.',
    suffix: 'Strength + Development'
  },
  strength: {
    primary: 'Prioritize a high-quality strength exposure with fatigue kept inside the current budget.',
    suffix: 'Strength Practice'
  },
  hypertrophy: {
    primary: 'Keep your main lift practiced while allocating more of the session to priority muscle work.',
    suffix: 'Anchor + Hypertrophy'
  },
  reacclimation: {
    primary: 'Rebuild tolerance with familiar technique, conservative loading, and no catch-up volume.',
    suffix: 'Return Exposure'
  }
} as const

const titleFor = (exercise: Exercise, suffix: string) => {
  if (exercise.pattern === 'horizontal-push') return `Bench ${suffix}`
  if (exercise.pattern === 'squat') return `Squat ${suffix}`
  if (exercise.pattern === 'hinge') return `Hinge ${suffix}`
  return `${exercise.name} ${suffix}`
}

const homeEquipmentPreferenceScore = (exercise: Exercise, equipmentProfile?: EquipmentProfile) => {
  return homeGymProgrammingPreference(exercise, equipmentProfile).score
}

const exerciseScore = (exercise: Exercise, role: 'secondary' | 'accessory', priorityRegions: BodyRegion[], equipmentProfile?: EquipmentProfile) => {
  let score = 0
  if (exercise.jointFeeling === 'great') score += 5
  if (exercise.jointFeeling === 'good') score += 3
  if (exercise.favorite) score += 2
  if (exercise.disliked) score -= 100
  if (role === 'secondary' && exercise.roleTags.includes('secondary builder')) score += 7
  if (role === 'accessory' && exercise.roleTags.includes('accessory')) score += 4
  if (priorityRegions.includes(exercise.primaryRegion)) score += 6
  score += homeEquipmentPreferenceScore(exercise, equipmentProfile)
  return score
}

function latestCompletedSet(history: CompletedSetRecord[], exerciseId: string) {
  return history
    .filter((record) => record.exerciseId === exerciseId)
    .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())[0]
}

function priorPrescription(currentSessions: TrainingSession[], history: CompletedSetRecord[], exercise: Exercise, equipmentProfile?: EquipmentProfile) {
  const latest = latestCompletedSet(history, exercise.id)
  if (latest) {
    const latestSessionSets = history
      .filter((record) => record.exerciseId === exercise.id && record.sessionId === latest.sessionId)
      .sort((a, b) => a.setIndex - b.setIndex)
    return { sets: latestSessionSets.length || 3, reps: latest.reps, load: latest.load, rir: Math.max(0, latest.rir), angles: latestSessionSets.map((workSet) => workSet.benchAngleDeg), source: 'completed-history' as const }
  }
  const planned = currentSessions
    .flatMap((session) => session.exercises)
    .find((plannedExercise) => plannedExercise.exerciseId === exercise.id)
  if (planned?.sets.length) {
    return {
      sets: planned.sets.length,
      reps: planned.sets[0].targetReps,
      load: planned.sets[0].targetLoad,
      rir: planned.sets[0].targetRir,
      angles: planned.sets.map((workSet) => workSet.benchAngleDeg),
      source: 'existing-plan' as const
    }
  }
  const homeGymInitial = homeGymInitialPrescription(exercise, equipmentProfile)
  if (homeGymInitial) return { ...homeGymInitial, load: 0, rir: 3, angles: [] as Array<number | undefined>, source: 'home-gym-provisional' as const }
  return { sets: 3, reps: 10, load: 0, rir: 3, angles: [] as Array<number | undefined>, source: 'calibration' as const }
}

function routeLoad(prior: ReturnType<typeof priorPrescription>, intensity: number, increment: number) {
  if (prior.load <= 0 || intensity <= 0) return 0
  const estimatedMaximum = prior.load * (1 + (prior.reps + prior.rir) / 30)
  return nearestExecutableLoad(estimatedMaximum * intensity, increment)
}

function plannedExercise(
  exercise: Exercise,
  role: ExerciseRole,
  purpose: string,
  sessionKey: string,
  context: GenerationContext,
  adaptation: MesocycleDraft['dominantAdaptation'],
  routeProfile?: RouteSessionProfile
): PlannedExercise {
  const prior = priorPrescription(context.currentSessions, context.history, exercise, context.equipmentProfile)
  const isPrimary = role === 'primary'
  const reacclimating = adaptation === 'reacclimation'
  const routePrescription = routeProfile ? prescriptionForRole(routeProfile, role) : null
  const homeGymProvisional = prior.source === 'home-gym-provisional'
  const setCount = homeGymProvisional
    ? prior.sets
    : routePrescription?.sets ?? Math.max(2, prior.sets - (reacclimating ? 1 : 0))
  const targetReps = homeGymProvisional ? prior.reps : routePrescription?.reps ?? prior.reps
  const targetRir = routePrescription?.rir ?? (reacclimating ? Math.max(3, prior.rir) : prior.rir)
  const increment = context.equipmentProfile ? loadIncrementFor(exercise, context.equipmentProfile).value : 5
  const targetLoad = routePrescription ? routeLoad(prior, routePrescription.intensity, increment) : reacclimating ? nearestExecutableLoad(prior.load * 0.9, increment) : nearestExecutableLoad(prior.load, increment)
  const restSeconds = routePrescription?.restSeconds ?? (isPrimary ? 180 : role === 'secondary' ? 135 : 75)
  const setupMinutes = isPrimary ? 7 : role === 'secondary' ? 4 : 3
  const estimatedMinutes = Math.max(4, Math.round(setupMinutes + (setCount * 0.75) + Math.max(0, setCount - 1) * restSeconds / 60))
  return {
    id: `${sessionKey}-${role}-${exercise.id}`,
    exerciseId: exercise.id,
    role,
    purpose,
    sets: makeSets(setCount, targetReps, targetLoad, targetRir)
      .map((workSet, index) => {
        const benchAngleDeg = prior.angles[index] ?? (prior.angles.length === 1 ? prior.angles[0] : undefined)
        return { ...workSet, id: `${sessionKey}-${exercise.id}-set-${index + 1}`, ...(benchAngleDeg === undefined ? {} : { benchAngleDeg }) }
      }),
    restSeconds,
    estimatedMinutes: Math.round(estimatedMinutes),
    optional: role === 'tertiary',
  }
}

function chooseSecondary(anchor: Exercise, exercises: Exercise[], excluded: Set<string>, priorityRegions: BodyRegion[], equipmentProfile?: EquipmentProfile) {
  return exercises
    .filter((exercise) => !excluded.has(exercise.id) && exercise.jointFeeling !== 'avoid' && !exercise.disliked)
    .filter((exercise) => homeGymProgrammingPreference(exercise, equipmentProfile).automaticEligible)
    .filter((exercise) => !equipmentProfile || exerciseEquipmentFit(exercise, equipmentProfile).available)
    .filter((exercise) => exercise.pattern === anchor.pattern || exercise.family === anchor.family)
    .sort((a, b) => exerciseScore(b, 'secondary', priorityRegions, equipmentProfile) - exerciseScore(a, 'secondary', priorityRegions, equipmentProfile) || a.name.localeCompare(b.name))[0]
}

function chooseAccessories(exercises: Exercise[], excluded: Set<string>, regions: BodyRegion[], count: number, offset: number, equipmentProfile?: EquipmentProfile) {
  if (regions.length === 0 || count === 0) return []
  const rotated = [...regions.slice(offset % regions.length), ...regions.slice(0, offset % regions.length)]
  const selected: Exercise[] = []
  rotated.forEach((region) => {
    if (selected.length >= count) return
    const match = exercises
      .filter((exercise) => !excluded.has(exercise.id) && !selected.some((item) => item.id === exercise.id) && exercise.jointFeeling !== 'avoid' && !exercise.disliked && exercise.primaryRegion === region)
      .filter((exercise) => homeGymProgrammingPreference(exercise, equipmentProfile).automaticEligible)
      .filter((exercise) => !equipmentProfile || exerciseEquipmentFit(exercise, equipmentProfile).available)
      .sort((a, b) => exerciseScore(b, 'accessory', regions, equipmentProfile) - exerciseScore(a, 'accessory', regions, equipmentProfile) || a.name.localeCompare(b.name))[0]
    if (match) selected.push(match)
  })
  return selected
}

function chooseNamedHomeGymMovement(exercises: Exercise[], excluded: Set<string>, exerciseId: string, equipmentProfile?: EquipmentProfile) {
  return exercises.find((exercise) => exercise.id === exerciseId
    && !excluded.has(exercise.id)
    && exercise.jointFeeling !== 'avoid'
    && !exercise.disliked
    && homeGymProgrammingPreference(exercise, equipmentProfile).automaticEligible
    && (!equipmentProfile || exerciseEquipmentFit(exercise, equipmentProfile).available))
}

function chooseHomeGymRow(exercises: Exercise[], excluded: Set<string>, priorityRegions: BodyRegion[], equipmentProfile?: EquipmentProfile) {
  return exercises
    .filter((exercise) => !excluded.has(exercise.id) && exercise.pattern === 'horizontal-pull' && exercise.primaryRegion === 'back' && exercise.jointFeeling !== 'avoid' && !exercise.disliked)
    .filter((exercise) => homeGymProgrammingPreference(exercise, equipmentProfile).automaticEligible)
    .filter((exercise) => !equipmentProfile || exerciseEquipmentFit(exercise, equipmentProfile).available)
    .sort((a, b) => exerciseScore(b, 'accessory', priorityRegions, equipmentProfile) - exerciseScore(a, 'accessory', priorityRegions, equipmentProfile) || a.name.localeCompare(b.name))[0]
}

function fitToTime(exercises: PlannedExercise[], minutes: number, reservedExerciseIds: Set<string> = new Set()) {
  const primary = exercises.find((exercise) => exercise.role === 'primary')
  if (!primary) return []
  const selected = [{ ...primary }]
  let used = primary.estimatedMinutes
  const support = exercises.filter((exercise) => exercise !== primary)
  const addIfFits = (exercise: PlannedExercise) => {
    if (used + exercise.estimatedMinutes <= minutes) {
      selected.push(exercise)
      used += exercise.estimatedMinutes
    }
  }
  support.filter((exercise) => reservedExerciseIds.has(exercise.exerciseId)).forEach(addIfFits)
  support.filter((exercise) => !reservedExerciseIds.has(exercise.exerciseId)).forEach(addIfFits)
  const selectedIds = new Set(selected.map((exercise) => exercise.id))
  return exercises.filter((exercise) => selectedIds.has(exercise.id)).map((exercise, index) => ({
    ...exercise,
    optional: exercise.optional || index >= 3
  }))
}

function applyBenchAngleOverride(planned: PlannedExercise, benchAngleDeg: number | null | undefined) {
  if (benchAngleDeg === undefined) return planned
  return {
    ...planned,
    sets: planned.sets.map((workSet) => {
      const withoutAngle = { ...workSet }
      delete withoutAngle.benchAngleDeg
      return benchAngleDeg === null ? withoutAngle : { ...withoutAngle, benchAngleDeg }
    })
  }
}

export function draftFromPlan(plan: MesocyclePlan): MesocycleDraft {
  return {
    title: plan.title,
    objective: plan.objective,
    dominantAdaptation: plan.dominantAdaptation,
    revisionReason: '',
    entryCriteria: plan.entryCriteria,
    progressionModel: plan.progressionModel,
    targetMicrocycles: plan.targetMicrocycles,
    minimumProductiveExposures: plan.minimumProductiveExposures,
    successCriteria: plan.successCriteria,
    exitPlan: plan.exitPlan,
    weeklyOpportunities: plan.weeklyOpportunities,
    defaultMinutes: plan.defaultMinutes,
    strengthAnchors: [...plan.strengthAnchors],
    priorityRegions: [...plan.priorityRegions],
    maintenanceRegions: [...plan.maintenanceRegions],
    entryRoute: plan.entryRoute,
    generationRuleVersion: plan.generationRuleVersion,
    placementCreatedAt: plan.placementCreatedAt,
    generationEquipment: plan.generationEquipment ? structuredClone(plan.generationEquipment) : undefined,
    movementPlacements: plan.movementPlacements ? structuredClone(plan.movementPlacements) : undefined,
    movementOverrides: plan.movementOverrides ? structuredClone(plan.movementOverrides) : undefined
  }
}

export function buildMesocyclePreview(draft: MesocycleDraft, context: GenerationContext): MesocyclePreview {
  const planRouteProfile = draft.entryRoute && draft.generationRuleVersion ? routeSessionProfile(draft.entryRoute) : undefined
  if ((draft.generationRuleVersion === EQUIPMENT_ROUTE_SESSION_RULE_VERSION || draft.generationRuleVersion === ROUTE_SESSION_RULE_VERSION) && !context.equipmentProfile) throw new Error(`${draft.generationRuleVersion} requires an equipment profile.`)
  const anchors = draft.strengthAnchors
    .map((id) => context.exercises.find((exercise) => exercise.id === id))
    .filter((exercise): exercise is Exercise => Boolean(exercise))
  const requiredExposureCount = Math.max(anchors.length, draft.weeklyOpportunities)
  const startsAt = context.startsAt ?? new Date()
  const sessions = Array.from({ length: requiredExposureCount }, (_, index) => {
    const anchor = anchors[index % Math.max(1, anchors.length)] ?? context.exercises.find((exercise) => exercise.jointFeeling !== 'avoid')!
    const movementPlacement = draft.generationRuleVersion === ROUTE_SESSION_RULE_VERSION
      ? draft.movementPlacements?.find((placement) => placement.exerciseId === anchor.id)
      : undefined
    if (draft.generationRuleVersion === ROUTE_SESSION_RULE_VERSION && !movementPlacement) throw new Error(`${ROUTE_SESSION_RULE_VERSION} requires placement evidence for ${anchor.name}.`)
    const routeProfile = movementPlacement
      ? routeSessionProfile(movementPlacement.selectedRoute)
      : planRouteProfile
    const sessionKey = `${context.sessionKeyPrefix ?? context.planId}-session-${index + 1}`
    const excluded = new Set<string>([anchor.id])
    draft.movementOverrides
      ?.filter((choice) => choice.sessionIndex === index && choice.slotIndex > 0)
      .forEach((choice) => excluded.add(choice.exerciseId))
    const secondary = chooseSecondary(anchor, context.exercises, excluded, draft.priorityRegions, context.equipmentProfile)
    if (secondary) excluded.add(secondary.id)
    const timeAccessoryCount = draft.defaultMinutes <= 30 ? 1 : draft.defaultMinutes <= 45 ? 2 : 3
    const accessoryCount = routeProfile ? Math.min(timeAccessoryCount, routeProfile.maximumAccessories) : timeAccessoryCount
    const reservedAccessories: Exercise[] = []
    const automaticPreferenceSlotsOpen = !draft.movementOverrides?.length
    const hasRow = [anchor, secondary].some((exercise) => exercise?.pattern === 'horizontal-pull' && exercise.primaryRegion === 'back')
    if (automaticPreferenceSlotsOpen && !hasRow && homeGymFrequentRowTarget(index, requiredExposureCount, context.equipmentProfile)) {
      const row = chooseHomeGymRow(context.exercises, excluded, draft.priorityRegions, context.equipmentProfile)
      if (row) {
        reservedAccessories.push(row)
        excluded.add(row.id)
      }
    }
    const hasInclinePress = [anchor, secondary, ...reservedAccessories].some((exercise) => exercise?.family === 'Incline Press')
    if (automaticPreferenceSlotsOpen && !hasInclinePress && reservedAccessories.length < accessoryCount && homeGymInclinePressTarget(index, requiredExposureCount, context.equipmentProfile)) {
      const inclinePress = chooseNamedHomeGymMovement(context.exercises, excluded, 'incline-barbell-press', context.equipmentProfile)
      if (inclinePress) {
        reservedAccessories.push(inclinePress)
        excluded.add(inclinePress.id)
      }
    }
    const hasPullUp = [anchor, secondary, ...reservedAccessories].some((exercise) => exercise?.id === 'pull-up')
    if (automaticPreferenceSlotsOpen && !hasPullUp && reservedAccessories.length < accessoryCount && homeGymPullUpTarget(index, requiredExposureCount, context.equipmentProfile)) {
      const pullUp = chooseNamedHomeGymMovement(context.exercises, excluded, 'pull-up', context.equipmentProfile)
      if (pullUp) {
        reservedAccessories.push(pullUp)
        excluded.add(pullUp.id)
      }
    }
    const tricepsPressId = homeGymTricepsPressId(context.planVersion)
    const hasTricepsPress = [anchor, secondary, ...reservedAccessories].some((exercise) => exercise?.id === tricepsPressId)
    if (automaticPreferenceSlotsOpen && !hasTricepsPress && reservedAccessories.length < accessoryCount && homeGymTricepsPressTarget(index, requiredExposureCount, context.equipmentProfile)) {
      const tricepsPress = chooseNamedHomeGymMovement(context.exercises, excluded, tricepsPressId, context.equipmentProfile)
      if (tricepsPress) {
        reservedAccessories.push(tricepsPress)
        HOME_GYM_TRICEPS_PRESS_IDS.forEach((exerciseId) => excluded.add(exerciseId))
      }
    }
    const remainingAccessoryCount = Math.max(0, accessoryCount - reservedAccessories.length)
    const allowedPriorityRegions = draft.priorityRegions.filter((region) => homeGymAccessoryRegionAllowed(region, index, requiredExposureCount, context.equipmentProfile))
    const allowedMaintenanceRegions = draft.maintenanceRegions.filter((region) => homeGymAccessoryRegionAllowed(region, index, requiredExposureCount, context.equipmentProfile))
    const priorityCount = Math.min(remainingAccessoryCount, Math.max(1, remainingAccessoryCount - 1))
    const priorityAccessories = chooseAccessories(context.exercises, excluded, allowedPriorityRegions, priorityCount, index, context.equipmentProfile)
    priorityAccessories.forEach((exercise) => excluded.add(exercise.id))
    const maintenanceAccessories = chooseAccessories(context.exercises, excluded, allowedMaintenanceRegions, remainingAccessoryCount - priorityAccessories.length, index, context.equipmentProfile)
    const accessories = [...reservedAccessories, ...priorityAccessories, ...maintenanceAccessories]
    const suggestedExercisePlan = [
      plannedExercise(anchor, 'primary', routeProfile?.strategy ?? adaptationCopy[draft.dominantAdaptation].primary, sessionKey, context, draft.dominantAdaptation, routeProfile),
      ...(secondary ? [plannedExercise(secondary, 'secondary', `Build transfer to ${anchor.name}.`, sessionKey, context, draft.dominantAdaptation, routeProfile)] : []),
      ...accessories.map((exercise) => plannedExercise(
        exercise,
        reservedAccessories.some((reserved) => reserved.id === exercise.id) || draft.priorityRegions.includes(exercise.primaryRegion) ? 'accessory' : 'tertiary',
        reservedAccessories.some((reserved) => reserved.id === exercise.id)
          ? exercise.id === 'pull-up'
            ? 'Build repeatable pull-up strength from the current provisional capacity; completed sets will replace this estimate.'
            : exercise.id === 'incline-barbell-press'
              ? 'Emphasize ABX incline pressing instead of adding another general flat-press exposure.'
              : exercise.id === tricepsPressId
                ? 'Build triceps with this block’s selected flat-press exception.'
                : 'Keep low-fatigue rowing present across most Home Gym sessions for upper-back development.'
          : draft.priorityRegions.includes(exercise.primaryRegion) ? `Develop ${exercise.primaryRegion} for the active mesocycle.` : `Maintain ${exercise.primaryRegion} with a recoverable dose.`,
        sessionKey,
        context,
        draft.dominantAdaptation,
        routeProfile
      ))
    ]
    const exercisePlan = suggestedExercisePlan.map((suggested, slotIndex) => {
      const override = draft.movementOverrides?.find((choice) => choice.sessionIndex === index && choice.slotIndex === slotIndex)
      if (!override) return suggested
      if (suggested.role === 'primary' && override.exerciseId !== suggested.exerciseId) throw new Error('Protected main-lift choices must be changed through the block anchor controls.')
      const selected = context.exercises.find((exercise) => exercise.id === override.exerciseId)
      if (!selected || selected.retired || selected.disliked || selected.jointFeeling === 'avoid') throw new Error('A saved block movement is no longer available for programming.')
      if (context.equipmentProfile && !exerciseEquipmentFit(selected, context.equipmentProfile).available) throw new Error(`${selected.name} is not available with ${context.equipmentProfile.name}.`)
      const purpose = suggested.role === 'primary'
        ? suggested.purpose
        : suggested.role === 'secondary'
          ? `Build transfer to ${anchor.name}.`
          : draft.priorityRegions.includes(selected.primaryRegion)
            ? `Develop ${selected.primaryRegion} for the active training block.`
            : `Maintain ${selected.primaryRegion} with a recoverable dose.`
      return applyBenchAngleOverride(plannedExercise(selected, suggested.role, purpose, sessionKey, context, draft.dominantAdaptation, routeProfile), override.benchAngleDeg)
    })
    if (new Set(exercisePlan.map((planned) => planned.exerciseId)).size !== exercisePlan.length) throw new Error('Choose a different movement for each slot in a training day.')
    const fitted = fitToTime(exercisePlan, draft.defaultMinutes, new Set(reservedAccessories.map((exercise) => exercise.id)))
    return {
      id: sessionKey,
      title: titleFor(anchor, routeProfile ? `${routeProfile.label} Session` : adaptationCopy[draft.dominantAdaptation].suffix),
      objective: `${draft.objective} Today's main lift is ${anchor.name}.${routeProfile ? ` ${routeProfile.strategy}` : ''}`,
      dayLabel: index === 0 ? 'Next best session' : `Queued · ${index + 1}`,
      plannedDate: addDays(startsAt, index * 2).toISOString(),
      status: 'planned',
      durationMinutes: fitted.reduce((sum, exercise) => sum + exercise.estimatedMinutes, 0),
      exercises: fitted,
      mesocycleId: context.planId,
      planVersion: context.planVersion,
      microcycleNumber: context.microcycleNumber ?? 1,
      generation: routeProfile && draft.placementCreatedAt ? {
        ruleVersion: draft.generationRuleVersion ?? routeProfile.ruleVersion,
        placementCreatedAt: draft.placementCreatedAt,
        route: routeProfile.route,
        strategy: routeProfile.strategy,
        reasons: [...routeProfile.reasons],
        ...((draft.generationRuleVersion === EQUIPMENT_ROUTE_SESSION_RULE_VERSION || draft.generationRuleVersion === ROUTE_SESSION_RULE_VERSION) && context.equipmentProfile
          ? { equipment: equipmentGenerationEvidence(context.equipmentProfile) }
          : {}),
        ...(draft.generationRuleVersion === ROUTE_SESSION_RULE_VERSION && movementPlacement && draft.entryRoute
          ? { planRoute: draft.entryRoute, movementPlacement: structuredClone(movementPlacement) }
          : {})
      } : undefined
    } satisfies TrainingSession
  })

  const regionSets: Partial<Record<BodyRegion, number>> = {}
  sessions.flatMap((session) => session.exercises).forEach((planned) => {
    const exercise = context.exercises.find((candidate) => candidate.id === planned.exerciseId)
    if (exercise) regionSets[exercise.primaryRegion] = (regionSets[exercise.primaryRegion] ?? 0) + planned.sets.length
  })

  const projectedSets = sessions.flatMap((session) => session.exercises).reduce((sum, exercise) => sum + exercise.sets.length, 0)
  const projectedMinutes = sessions.reduce((sum, session) => sum + session.durationMinutes, 0)
  return {
    sessions,
    requiredExposureCount,
    projectedSets,
    projectedMinutes,
    projectedBlockSets: projectedSets * draft.targetMicrocycles,
    projectedBlockMinutes: projectedMinutes * draft.targetMicrocycles,
    regionSets,
    protectedAnchors: anchors.map((anchor) => anchor.id),
    explanations: [
      ...(draft.generationRuleVersion === ROUTE_SESSION_RULE_VERSION ? [
        `Per-movement placement under ${ROUTE_SESSION_RULE_VERSION} lets each protected anchor use its own starting route without changing the cycle's ${planRouteProfile?.label ?? 'global'} goal.`,
        ...(draft.movementPlacements ?? []).map((movement) => {
          const profile = routeSessionProfile(movement.selectedRoute)
          return `${movement.exerciseName} uses ${profile.label}: ${profile.primary.sets} × ${profile.primary.reps} at ${profile.primary.rir} RIR.`
        })
      ] : planRouteProfile ? [`${planRouteProfile.label} uses ${planRouteProfile.primary.sets} × ${planRouteProfile.primary.reps} at ${planRouteProfile.primary.rir} RIR for primary work under ${planRouteProfile.ruleVersion}.`, ...planRouteProfile.reasons, planRouteProfile.progressionPolicy] : []),
      `${anchors.length} strength anchors remain protected as required exposures.`,
      `${draft.weeklyOpportunities} weekly opportunities estimate the calendar pace; exposure completion controls progression.`,
      `${draft.defaultMinutes} minutes caps each generated session before optional work is added.`,
      ...(homeGymFrequentRowTarget(0, requiredExposureCount, context.equipmentProfile) ? [
        'Home Gym support work reserves a low-fatigue row in most sessions and one weekly pull-up exposure when time, equipment, pain, and athlete-approved block choices permit.',
        'The initial pull-up target is a provisional 3 × 5 capacity estimate, not completed history; exact logged sets replace it.',
        `Home Gym pressing favors ABX incline work over general flat assistance and rotates one targeted triceps exception by block: ${context.exercises.find((exercise) => exercise.id === homeGymTricepsPressId(context.planVersion))?.name ?? 'Two-Board, Close-Grip, or Spoto Press'}.`
      ] : []),
      ...(draft.movementOverrides?.length ? [`${draft.movementOverrides.length} athlete-approved movement or incline choice${draft.movementOverrides.length === 1 ? '' : 's'} will repeat in each generated training round until the block is revised.`] : []),
      ...(context.equipmentProfile ? [
        `${context.equipmentProfile.name} filters secondary and accessory choices before generation and supplies executable ${context.equipmentProfile.incrementUnit} load increments.`,
        ...anchors.filter((anchor) => !exerciseEquipmentFit(anchor, context.equipmentProfile!).available).map((anchor) => `${anchor.name} remains protected but needs equipment review: ${exerciseEquipmentFit(anchor, context.equipmentProfile!).missing.join(', ')}.`)
      ] : []),
      planRouteProfile
        ? 'Target loads derive from the latest exact completed set first, then an existing exact prescription, and otherwise remain a zero-load calibration. Different variations never lend each other a load.'
        : 'Load, repetitions, and sets are copied from existing prescriptions or the latest exact exposure; reacclimation alone begins conservatively.'
    ]
  }
}

export function createMesocyclePlan(draft: MesocycleDraft, id: string, version: number, effectiveAt: string, supersedesId: string | null, sessionIds: string[]): MesocyclePlan {
  return {
    ...draft,
    id,
    version,
    status: 'active',
    createdAt: effectiveAt,
    effectiveAt,
    supersedesId,
    sessionIds
  }
}

export function replaceFuturePlan(
  sessions: TrainingSession[],
  plans: MesocyclePlan[],
  nextPlan: MesocyclePlan,
  generatedSessions: TrainingSession[]
) {
  const preservedSessions = sessions.filter((session) => session.status !== 'planned')
  const versionedPlans = plans.map((plan) => plan.status === 'active' ? { ...plan, status: 'superseded' as const } : plan)
  return {
    sessions: [...preservedSessions, ...generatedSessions],
    plans: [...versionedPlans, nextPlan]
  }
}
