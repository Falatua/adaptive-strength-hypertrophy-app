import { addDays } from 'date-fns'
import { makeSets } from './training-engine'
import type {
  BodyRegion,
  CompletedSetRecord,
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
  regionSets: Partial<Record<BodyRegion, number>>
  protectedAnchors: string[]
  explanations: string[]
}

interface GenerationContext {
  exercises: Exercise[]
  currentSessions: TrainingSession[]
  history: CompletedSetRecord[]
  planId: string
  planVersion: number
  startsAt?: Date
  sessionKeyPrefix?: string
  microcycleNumber?: number
}

const adaptationCopy = {
  powerbuilding: {
    primary: 'Practice and progress the strength anchor while preserving hypertrophy work.',
    suffix: 'Strength + Development'
  },
  strength: {
    primary: 'Prioritize a high-quality strength exposure with fatigue kept inside the current budget.',
    suffix: 'Strength Practice'
  },
  hypertrophy: {
    primary: 'Keep the anchor practiced while allocating more of the session to priority muscle work.',
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

const exerciseScore = (exercise: Exercise, role: 'secondary' | 'accessory', priorityRegions: BodyRegion[]) => {
  let score = 0
  if (exercise.jointFeeling === 'great') score += 5
  if (exercise.jointFeeling === 'good') score += 3
  if (exercise.favorite) score += 2
  if (role === 'secondary' && exercise.roleTags.includes('secondary builder')) score += 7
  if (role === 'accessory' && exercise.roleTags.includes('accessory')) score += 4
  if (priorityRegions.includes(exercise.primaryRegion)) score += 6
  return score
}

function latestCompletedSet(history: CompletedSetRecord[], exerciseId: string) {
  return history
    .filter((record) => record.exerciseId === exerciseId)
    .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())[0]
}

function priorPrescription(currentSessions: TrainingSession[], history: CompletedSetRecord[], exerciseId: string) {
  const planned = currentSessions
    .flatMap((session) => session.exercises)
    .find((exercise) => exercise.exerciseId === exerciseId)
  if (planned?.sets.length) {
    return {
      sets: planned.sets.length,
      reps: planned.sets[0].targetReps,
      load: planned.sets[0].targetLoad,
      rir: planned.sets[0].targetRir
    }
  }
  const latest = latestCompletedSet(history, exerciseId)
  return latest
    ? { sets: 3, reps: latest.reps, load: latest.load, rir: Math.max(1, latest.rir) }
    : { sets: 3, reps: 10, load: 0, rir: 3 }
}

function plannedExercise(
  exercise: Exercise,
  role: ExerciseRole,
  purpose: string,
  sessionKey: string,
  context: GenerationContext,
  adaptation: MesocycleDraft['dominantAdaptation']
): PlannedExercise {
  const prior = priorPrescription(context.currentSessions, context.history, exercise.id)
  const isPrimary = role === 'primary'
  const reacclimating = adaptation === 'reacclimation'
  const setCount = Math.max(2, prior.sets - (reacclimating ? 1 : 0))
  const targetLoad = reacclimating ? Math.round((prior.load * 0.9) / 5) * 5 : prior.load
  const estimatedMinutes = isPrimary ? Math.min(23, 9 + setCount * 3) : role === 'secondary' ? Math.min(15, 6 + setCount * 2.5) : Math.min(10, 4 + setCount * 1.5)
  return {
    id: `${sessionKey}-${role}-${exercise.id}`,
    exerciseId: exercise.id,
    role,
    purpose,
    sets: makeSets(setCount, prior.reps, targetLoad, reacclimating ? Math.max(3, prior.rir) : prior.rir)
      .map((workSet, index) => ({ ...workSet, id: `${sessionKey}-${exercise.id}-set-${index + 1}` })),
    restSeconds: isPrimary ? 180 : role === 'secondary' ? 135 : 75,
    estimatedMinutes: Math.round(estimatedMinutes),
    optional: role === 'optional'
  }
}

function chooseSecondary(anchor: Exercise, exercises: Exercise[], excluded: Set<string>, priorityRegions: BodyRegion[]) {
  return exercises
    .filter((exercise) => !excluded.has(exercise.id) && exercise.jointFeeling !== 'avoid')
    .filter((exercise) => exercise.pattern === anchor.pattern || exercise.family === anchor.family)
    .sort((a, b) => exerciseScore(b, 'secondary', priorityRegions) - exerciseScore(a, 'secondary', priorityRegions) || a.name.localeCompare(b.name))[0]
}

function chooseAccessories(exercises: Exercise[], excluded: Set<string>, regions: BodyRegion[], count: number, offset: number) {
  if (regions.length === 0 || count === 0) return []
  const rotated = [...regions.slice(offset % regions.length), ...regions.slice(0, offset % regions.length)]
  const selected: Exercise[] = []
  rotated.forEach((region) => {
    if (selected.length >= count) return
    const match = exercises
      .filter((exercise) => !excluded.has(exercise.id) && !selected.some((item) => item.id === exercise.id) && exercise.jointFeeling !== 'avoid' && exercise.primaryRegion === region)
      .sort((a, b) => exerciseScore(b, 'accessory', regions) - exerciseScore(a, 'accessory', regions) || a.name.localeCompare(b.name))[0]
    if (match) selected.push(match)
  })
  return selected
}

function fitToTime(exercises: PlannedExercise[], minutes: number) {
  const selected: PlannedExercise[] = []
  let used = 0
  exercises.forEach((exercise) => {
    if (used + exercise.estimatedMinutes <= minutes || exercise.role === 'primary' || selected.length < 2) {
      selected.push(exercise)
      used += exercise.estimatedMinutes
    }
  })
  const total = selected.reduce((sum, exercise) => sum + exercise.estimatedMinutes, 0)
  const timeFitted = total <= minutes ? selected : selected.slice(0, 2).map((exercise, index, required) => {
    const requiredTotal = required.reduce((sum, item) => sum + item.estimatedMinutes, 0)
    const allocated = index === required.length - 1
      ? minutes - required.slice(0, index).reduce((sum, item) => sum + Math.round((item.estimatedMinutes / requiredTotal) * minutes), 0)
      : Math.round((exercise.estimatedMinutes / requiredTotal) * minutes)
    return { ...exercise, estimatedMinutes: allocated }
  })
  return timeFitted.map((exercise, index) => ({
    ...exercise,
    optional: exercise.optional || index >= 3
  }))
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
    maintenanceRegions: [...plan.maintenanceRegions]
  }
}

export function buildMesocyclePreview(draft: MesocycleDraft, context: GenerationContext): MesocyclePreview {
  const anchors = draft.strengthAnchors
    .map((id) => context.exercises.find((exercise) => exercise.id === id))
    .filter((exercise): exercise is Exercise => Boolean(exercise))
  const requiredExposureCount = Math.max(anchors.length, draft.weeklyOpportunities)
  const startsAt = context.startsAt ?? new Date()
  const sessions = Array.from({ length: requiredExposureCount }, (_, index) => {
    const anchor = anchors[index % Math.max(1, anchors.length)] ?? context.exercises.find((exercise) => exercise.jointFeeling !== 'avoid')!
    const sessionKey = `${context.sessionKeyPrefix ?? context.planId}-session-${index + 1}`
    const excluded = new Set<string>([anchor.id])
    const secondary = chooseSecondary(anchor, context.exercises, excluded, draft.priorityRegions)
    if (secondary) excluded.add(secondary.id)
    const accessoryCount = draft.defaultMinutes <= 30 ? 1 : draft.defaultMinutes <= 45 ? 2 : 3
    const priorityCount = Math.min(accessoryCount, Math.max(1, accessoryCount - 1))
    const priorityAccessories = chooseAccessories(context.exercises, excluded, draft.priorityRegions, priorityCount, index)
    priorityAccessories.forEach((exercise) => excluded.add(exercise.id))
    const maintenanceAccessories = chooseAccessories(context.exercises, excluded, draft.maintenanceRegions, accessoryCount - priorityAccessories.length, index)
    const accessories = [...priorityAccessories, ...maintenanceAccessories]
    const exercisePlan = [
      plannedExercise(anchor, 'primary', adaptationCopy[draft.dominantAdaptation].primary, sessionKey, context, draft.dominantAdaptation),
      ...(secondary ? [plannedExercise(secondary, 'secondary', `Build transfer to ${anchor.name}.`, sessionKey, context, draft.dominantAdaptation)] : []),
      ...accessories.map((exercise) => plannedExercise(
        exercise,
        draft.priorityRegions.includes(exercise.primaryRegion) ? 'priority' : 'maintenance',
        draft.priorityRegions.includes(exercise.primaryRegion) ? `Develop ${exercise.primaryRegion} for the active mesocycle.` : `Maintain ${exercise.primaryRegion} with a recoverable dose.`,
        sessionKey,
        context,
        draft.dominantAdaptation
      ))
    ]
    const fitted = fitToTime(exercisePlan, draft.defaultMinutes)
    return {
      id: sessionKey,
      title: titleFor(anchor, adaptationCopy[draft.dominantAdaptation].suffix),
      objective: `${draft.objective} Today's protected anchor is ${anchor.name}.`,
      dayLabel: index === 0 ? 'Next best session' : `Queued · ${index + 1}`,
      plannedDate: addDays(startsAt, index * 2).toISOString(),
      status: 'planned',
      durationMinutes: fitted.reduce((sum, exercise) => sum + exercise.estimatedMinutes, 0),
      exercises: fitted,
      mesocycleId: context.planId,
      planVersion: context.planVersion,
      microcycleNumber: context.microcycleNumber ?? 1
    } satisfies TrainingSession
  })

  const regionSets: Partial<Record<BodyRegion, number>> = {}
  sessions.flatMap((session) => session.exercises).forEach((planned) => {
    const exercise = context.exercises.find((candidate) => candidate.id === planned.exerciseId)
    if (exercise) regionSets[exercise.primaryRegion] = (regionSets[exercise.primaryRegion] ?? 0) + planned.sets.length
  })

  return {
    sessions,
    requiredExposureCount,
    projectedSets: sessions.flatMap((session) => session.exercises).reduce((sum, exercise) => sum + exercise.sets.length, 0),
    projectedMinutes: sessions.reduce((sum, session) => sum + session.durationMinutes, 0),
    regionSets,
    protectedAnchors: anchors.map((anchor) => anchor.id),
    explanations: [
      `${anchors.length} strength anchors remain protected as required exposures.`,
      `${draft.weeklyOpportunities} weekly opportunities estimate the calendar pace; exposure completion controls progression.`,
      `${draft.defaultMinutes} minutes caps each generated session before optional work is added.`,
      `Load, repetitions, and sets are copied from existing prescriptions or the latest exact exposure; reacclimation alone begins conservatively.`
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
