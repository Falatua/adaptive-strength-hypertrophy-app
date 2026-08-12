import { historyInRange, rangeWindow, type ProgressRange } from './analytics'
import type { CompletedSetRecord, Exercise, ExerciseMuscleMapping, MuscleId, TrainingSession } from './types'

export const muscleDoseRuleVersion = 'muscle-dose-v1' as const

export type MuscleDoseLens = 'all' | 'upper' | 'lower' | 'arms' | 'trunk'
export type MuscleCredit = 0.5 | 1

export interface MuscleDefinition {
  id: MuscleId
  label: string
  area: Exclude<MuscleDoseLens, 'all' | 'arms'>
}

export const muscleDefinitions: MuscleDefinition[] = [
  { id: 'pectorals', label: 'Pectorals', area: 'upper' },
  { id: 'anterior-deltoids', label: 'Anterior deltoids', area: 'upper' },
  { id: 'lateral-deltoids', label: 'Lateral deltoids', area: 'upper' },
  { id: 'posterior-deltoids', label: 'Posterior deltoids', area: 'upper' },
  { id: 'triceps', label: 'Triceps', area: 'upper' },
  { id: 'biceps', label: 'Biceps', area: 'upper' },
  { id: 'forearms', label: 'Forearms and grip', area: 'upper' },
  { id: 'latissimus', label: 'Latissimus', area: 'upper' },
  { id: 'upper-back', label: 'Upper back', area: 'upper' },
  { id: 'spinal-erectors', label: 'Spinal erectors', area: 'trunk' },
  { id: 'quadriceps', label: 'Quadriceps', area: 'lower' },
  { id: 'hamstrings', label: 'Hamstrings', area: 'lower' },
  { id: 'gluteals', label: 'Gluteals', area: 'lower' },
  { id: 'adductors', label: 'Adductors', area: 'lower' },
  { id: 'calves', label: 'Calves', area: 'lower' },
  { id: 'abdominals', label: 'Abdominals', area: 'trunk' },
  { id: 'obliques', label: 'Obliques', area: 'trunk' }
]

export const muscleIds = muscleDefinitions.map((definition) => definition.id)

export function exerciseMuscleMappingError(mapping: unknown): string | null {
  if (typeof mapping !== 'object' || mapping === null || Array.isArray(mapping)) return 'Muscle mapping must be a structured athlete review.'
  const candidate = mapping as Partial<ExerciseMuscleMapping>
  if (candidate.ruleVersion !== 'exercise-muscle-map-v1' || candidate.source !== 'athlete') return 'Muscle mapping has an unsupported rule version or source.'
  if (!muscleIds.includes(candidate.direct as MuscleId)) return 'Choose one valid direct muscle.'
  if (!Array.isArray(candidate.secondary) || candidate.secondary.some((muscle) => !muscleIds.includes(muscle))) return 'Choose only valid secondary muscles.'
  if (new Set(candidate.secondary).size !== candidate.secondary.length) return 'Choose each secondary muscle once.'
  if (candidate.secondary.includes(candidate.direct as MuscleId)) return 'The direct muscle cannot also receive secondary credit.'
  if (candidate.secondary.length > 8) return 'Use no more than eight secondary muscles for one movement.'
  if (typeof candidate.reviewedAt !== 'string' || Number.isNaN(new Date(candidate.reviewedAt).getTime())) return 'Muscle mapping needs a valid athlete-review date.'
  return null
}

const armMuscles = new Set<MuscleId>(['triceps', 'biceps', 'forearms'])

type ExerciseCreditMap = Partial<Record<MuscleId, MuscleCredit>>

// This versioned product taxonomy is intentionally conservative. It describes
// set attribution, not measured activation, recovery cost, or hypertrophy.
export const builtInMuscleCredits: Readonly<Record<string, ExerciseCreditMap>> = {
  'competition-bench': { pectorals: 1, triceps: 0.5, 'anterior-deltoids': 0.5 },
  'two-board-press': { triceps: 1, pectorals: 0.5, 'anterior-deltoids': 0.5 },
  'three-board-press': { triceps: 1, pectorals: 0.5 },
  'coffin-press': { pectorals: 1, triceps: 0.5 },
  'incline-db-press': { pectorals: 1, 'anterior-deltoids': 0.5, triceps: 0.5 },
  'cable-fly': { pectorals: 1 },
  'sumo-deadlift': { gluteals: 1, quadriceps: 0.5, hamstrings: 0.5, adductors: 0.5, 'spinal-erectors': 0.5 },
  'conventional-deadlift': { hamstrings: 1, gluteals: 0.5, 'spinal-erectors': 0.5, 'upper-back': 0.5 },
  'deficit-conventional': { hamstrings: 1, gluteals: 0.5, 'spinal-erectors': 0.5, 'upper-back': 0.5 },
  'paused-sumo': { gluteals: 1, quadriceps: 0.5, hamstrings: 0.5, adductors: 0.5, 'spinal-erectors': 0.5 },
  'competition-squat': { quadriceps: 1, gluteals: 0.5, adductors: 0.5, 'spinal-erectors': 0.5 },
  'ssb-squat': { quadriceps: 1, gluteals: 0.5, 'upper-back': 0.5, 'spinal-erectors': 0.5 },
  'good-morning': { hamstrings: 1, gluteals: 0.5, 'spinal-erectors': 0.5 },
  'hack-squat': { quadriceps: 1, gluteals: 0.5 },
  'leg-curl': { hamstrings: 1 },
  'cambered-row': { 'upper-back': 1, latissimus: 0.5, biceps: 0.5, forearms: 0.5, 'spinal-erectors': 0.5 },
  'chest-supported-row': { 'upper-back': 1, latissimus: 0.5, biceps: 0.5 },
  'lat-pulldown': { latissimus: 1, biceps: 0.5, 'upper-back': 0.5 },
  'overhead-press': { 'anterior-deltoids': 1, triceps: 0.5, 'lateral-deltoids': 0.5 },
  'lateral-raise': { 'lateral-deltoids': 1 },
  'triceps-extension': { triceps: 1 },
  'hammer-curl': { biceps: 1, forearms: 0.5 },
  'ab-wheel': { abdominals: 1, obliques: 0.5 }
}

const regionMuscle = (exercise: Exercise, region: Exercise['primaryRegion']): MuscleId => {
  if (region === 'chest') return 'pectorals'
  if (region === 'back') return exercise.roleTags.some((tag) => ['lats', 'pullover'].includes(tag)) || exercise.pattern === 'vertical-pull' ? 'latissimus' : 'upper-back'
  if (region === 'shoulders') return exercise.roleTags.includes('rear delts') ? 'posterior-deltoids' : exercise.roleTags.includes('lateral delts') ? 'lateral-deltoids' : 'anterior-deltoids'
  if (region === 'quadriceps') return 'quadriceps'
  if (region === 'hamstrings') return 'hamstrings'
  if (region === 'glutes') return 'gluteals'
  if (region === 'biceps') return 'biceps'
  if (region === 'triceps') return 'triceps'
  if (region === 'forearms') return 'forearms'
  if (region === 'calves') return 'calves'
  return exercise.family === 'Anti-Rotation' || exercise.roleTags.includes('obliques') ? 'obliques' : 'abdominals'
}

const catalogMuscleCredits = (exercise: Exercise): ExerciseCreditMap => {
  const direct = regionMuscle(exercise, exercise.primaryRegion)
  const credits: ExerciseCreditMap = { [direct]: 1 }
  exercise.regions.forEach((region) => {
    const muscle = regionMuscle(exercise, region)
    if (muscle !== direct) credits[muscle] = 0.5
  })
  if (exercise.regions.includes('back') && direct !== 'latissimus' && direct !== 'upper-back') credits['upper-back'] = 0.5
  return credits
}

export function muscleCreditsFor(exerciseId: string, exercises: Exercise[] = []): ExerciseCreditMap | undefined {
  const exercise = exercises.find((candidate) => candidate.id === exerciseId && !candidate.retired)
  if (exercise?.custom && exercise.muscleMapping) {
    return Object.fromEntries([
      [exercise.muscleMapping.direct, 1],
      ...exercise.muscleMapping.secondary.map((muscle) => [muscle, 0.5] as const)
    ]) as ExerciseCreditMap
  }
  return builtInMuscleCredits[exerciseId] ?? (exercise && !exercise.custom ? catalogMuscleCredits(exercise) : undefined)
}

export interface MuscleDoseExercisePoint {
  exerciseId: string
  exerciseName: string
  directDose: number
  fractionalDose: number
  totalDose: number
  sourceSetCount: number
  sourceSetIds: string[]
  lastCompletedAt: string
}

export interface MuscleDosePoint {
  muscle: MuscleId
  label: string
  area: MuscleDefinition['area']
  directDose: number
  fractionalDose: number
  totalDose: number
  sourceSetCount: number
  directSourceSetIds: string[]
  fractionalSourceSetIds: string[]
  lastCompletedAt: string | null
  exercises: MuscleDoseExercisePoint[]
}

export interface MuscleDoseAreaPoint {
  lens: Exclude<MuscleDoseLens, 'all'> | 'whole'
  label: string
  conservedDose: number
  sourceSetCount: number
}

export interface MuscleDoseSummary {
  ruleVersion: typeof muscleDoseRuleVersion
  sourceSetCount: number
  mappedSourceSetCount: number
  unmappedSourceSetCount: number
  unmappedExerciseNames: string[]
  directSetEquivalents: number
  fractionalSetEquivalents: number
  totalMuscleSetEquivalents: number
  muscles: MuscleDosePoint[]
  areas: MuscleDoseAreaPoint[]
}

const definitionById = new Map(muscleDefinitions.map((definition) => [definition.id, definition]))

const matchesLens = (muscle: MuscleId, lens: MuscleDoseLens) => {
  if (lens === 'all') return true
  if (lens === 'arms') return armMuscles.has(muscle)
  return definitionById.get(muscle)?.area === lens
}

export function filterMuscleDose(muscles: MuscleDosePoint[], lens: MuscleDoseLens) {
  return muscles.filter((point) => matchesLens(point.muscle, lens))
}

export function muscleDoseFor(history: CompletedSetRecord[], exercises: Exercise[] = []): MuscleDoseSummary {
  const buckets = new Map<MuscleId, MuscleDosePoint>()
  const mappedSetIds = new Set<string>()
  const unmappedSetIds = new Set<string>()
  const unmappedExerciseNames = new Set<string>()

  history.forEach((workSet) => {
    const credits = muscleCreditsFor(workSet.exerciseId, exercises)
    if (!credits || Object.keys(credits).length === 0) {
      unmappedSetIds.add(workSet.id)
      unmappedExerciseNames.add(workSet.exerciseName)
      return
    }
    mappedSetIds.add(workSet.id)
    Object.entries(credits).forEach(([muscleKey, credit]) => {
      if (credit === undefined) return
      const muscle = muscleKey as MuscleId
      const definition = definitionById.get(muscle)
      if (!definition) return
      const current = buckets.get(muscle) ?? {
        muscle,
        label: definition.label,
        area: definition.area,
        directDose: 0,
        fractionalDose: 0,
        totalDose: 0,
        sourceSetCount: 0,
        directSourceSetIds: [],
        fractionalSourceSetIds: [],
        lastCompletedAt: null,
        exercises: []
      }
      if (credit === 1) {
        current.directDose += 1
        current.directSourceSetIds.push(workSet.id)
      } else {
        current.fractionalDose += credit
        current.fractionalSourceSetIds.push(workSet.id)
      }
      current.totalDose += credit
      current.sourceSetCount += 1
      if (current.lastCompletedAt === null || new Date(workSet.completedAt).getTime() > new Date(current.lastCompletedAt).getTime()) current.lastCompletedAt = workSet.completedAt
      const exercise = current.exercises.find((point) => point.exerciseId === workSet.exerciseId)
      if (exercise) {
        if (credit === 1) exercise.directDose += 1
        else exercise.fractionalDose += credit
        exercise.totalDose += credit
        exercise.sourceSetCount += 1
        exercise.sourceSetIds.push(workSet.id)
        if (new Date(workSet.completedAt).getTime() > new Date(exercise.lastCompletedAt).getTime()) exercise.lastCompletedAt = workSet.completedAt
      } else {
        current.exercises.push({
          exerciseId: workSet.exerciseId,
          exerciseName: workSet.exerciseName,
          directDose: credit === 1 ? 1 : 0,
          fractionalDose: credit === 0.5 ? 0.5 : 0,
          totalDose: credit,
          sourceSetCount: 1,
          sourceSetIds: [workSet.id],
          lastCompletedAt: workSet.completedAt
        })
      }
      buckets.set(muscle, current)
    })
  })

  muscleDefinitions.forEach((definition) => {
    if (buckets.has(definition.id)) return
    buckets.set(definition.id, {
      muscle: definition.id,
      label: definition.label,
      area: definition.area,
      directDose: 0,
      fractionalDose: 0,
      totalDose: 0,
      sourceSetCount: 0,
      directSourceSetIds: [],
      fractionalSourceSetIds: [],
      lastCompletedAt: null,
      exercises: []
    })
  })

  const muscles = [...buckets.values()].map((point) => ({
    ...point,
    exercises: point.exercises.sort((a, b) => b.totalDose - a.totalDose || a.exerciseName.localeCompare(b.exerciseName))
  })).sort((a, b) => b.totalDose - a.totalDose || b.directDose - a.directDose || a.label.localeCompare(b.label))

  const areaLens: Array<Exclude<MuscleDoseLens, 'all'> | 'whole'> = ['whole', 'upper', 'lower', 'arms', 'trunk']
  const areas = areaLens.map((lens) => {
    const perSetCredit = new Map<string, number>()
    history.forEach((workSet) => {
      const credits = muscleCreditsFor(workSet.exerciseId, exercises)
      if (!credits) return
      const highestCredit = Object.entries(credits).reduce((highest, [muscle, credit]) => {
        if (credit === undefined) return highest
        const included = lens === 'whole' || matchesLens(muscle as MuscleId, lens)
        return included ? Math.max(highest, credit) : highest
      }, 0)
      if (highestCredit > 0) perSetCredit.set(workSet.id, highestCredit)
    })
    return {
      lens,
      label: lens === 'whole' ? 'Whole body' : lens === 'upper' ? 'Upper body' : lens === 'lower' ? 'Lower body' : lens === 'arms' ? 'Arms' : 'Trunk',
      conservedDose: [...perSetCredit.values()].reduce((sum, credit) => sum + credit, 0),
      sourceSetCount: perSetCredit.size
    }
  })

  const directSetEquivalents = muscles.reduce((sum, point) => sum + point.directDose, 0)
  const fractionalSetEquivalents = muscles.reduce((sum, point) => sum + point.fractionalDose, 0)
  return {
    ruleVersion: muscleDoseRuleVersion,
    sourceSetCount: history.length,
    mappedSourceSetCount: mappedSetIds.size,
    unmappedSourceSetCount: unmappedSetIds.size,
    unmappedExerciseNames: [...unmappedExerciseNames].sort(),
    directSetEquivalents,
    fractionalSetEquivalents,
    totalMuscleSetEquivalents: directSetEquivalents + fractionalSetEquivalents,
    muscles,
    areas
  }
}

export type PlannedMuscleDoseStatus = 'below-plan' | 'within-plan' | 'above-plan' | 'no-planned-dose'

export interface PlannedMuscleDosePoint {
  muscle: MuscleId
  label: string
  area: MuscleDefinition['area']
  plannedDirect: number
  plannedSecondary: number
  plannedTotal: number
  completedDirect: number
  completedSecondary: number
  completedTotal: number
  plannedSetIds: string[]
  completedSetIds: string[]
  completionRate: number | null
  status: PlannedMuscleDoseStatus
}

export interface PlannedMuscleDoseSummary {
  ruleVersion: 'muscle-plan-dose-v1'
  plannedSessionIds: string[]
  plannedSourceSetCount: number
  plannedMappedSetCount: number
  plannedUnmappedSetCount: number
  plannedUnmappedExerciseNames: string[]
  linkedCompletedSetCount: number
  linkedCompletedMappedSetCount: number
  linkedCompletedUnmappedSetCount: number
  unlinkedCompletedSetCount: number
  points: PlannedMuscleDosePoint[]
}

const plannedStatusFor = (planned: number, completed: number): PlannedMuscleDoseStatus => {
  if (planned === 0) return 'no-planned-dose'
  const rate = completed / planned
  if (rate < 0.85) return 'below-plan'
  if (rate > 1.15) return 'above-plan'
  return 'within-plan'
}

export function filterPlannedMuscleDose(points: PlannedMuscleDosePoint[], lens: MuscleDoseLens) {
  return points.filter((point) => matchesLens(point.muscle, lens))
}

export function plannedMuscleDoseFor(input: {
  sessions: TrainingSession[]
  history: CompletedSetRecord[]
  exercises: Exercise[]
  range: ProgressRange
  now?: Date
}): PlannedMuscleDoseSummary {
  const now = input.now ?? new Date()
  const window = rangeWindow(input.range, now)
  const plannedSessions = input.sessions.filter((session) => {
    const timestamp = new Date(session.plannedDate).getTime()
    return !Number.isNaN(timestamp) && timestamp <= window.end.getTime() && (window.start === null || timestamp >= window.start.getTime())
  })
  const plannedSessionIds = new Set(plannedSessions.map((session) => session.id))
  const selectedHistory = historyInRange(input.history, input.range, now)
  const linkedHistory = selectedHistory.filter((workSet) => plannedSessionIds.has(workSet.sessionId))
  const points = new Map<MuscleId, PlannedMuscleDosePoint>()
  const plannedMappedSetIds = new Set<string>()
  const plannedUnmappedSetIds = new Set<string>()
  const plannedUnmappedExerciseNames = new Set<string>()
  const linkedMappedSetIds = new Set<string>()
  const linkedUnmappedSetIds = new Set<string>()
  const exerciseById = new Map(input.exercises.map((exercise) => [exercise.id, exercise]))
  const ensurePoint = (muscle: MuscleId) => {
    const definition = definitionById.get(muscle)!
    const current = points.get(muscle) ?? {
      muscle,
      label: definition.label,
      area: definition.area,
      plannedDirect: 0,
      plannedSecondary: 0,
      plannedTotal: 0,
      completedDirect: 0,
      completedSecondary: 0,
      completedTotal: 0,
      plannedSetIds: [],
      completedSetIds: [],
      completionRate: null,
      status: 'no-planned-dose' as const
    }
    points.set(muscle, current)
    return current
  }

  plannedSessions.forEach((session) => session.exercises.forEach((planned) => {
    const credits = muscleCreditsFor(planned.exerciseId, input.exercises)
    const exerciseName = exerciseById.get(planned.exerciseId)?.name ?? planned.exerciseId
    planned.sets.forEach((workSet) => {
      const plannedSourceId = `${session.id}:${planned.id}:${workSet.id}`
      if (!credits || Object.keys(credits).length === 0) {
        plannedUnmappedSetIds.add(plannedSourceId)
        plannedUnmappedExerciseNames.add(exerciseName)
        return
      }
      plannedMappedSetIds.add(plannedSourceId)
      Object.entries(credits).forEach(([muscleKey, credit]) => {
        if (credit === undefined) return
        const point = ensurePoint(muscleKey as MuscleId)
        if (credit === 1) point.plannedDirect += 1
        else point.plannedSecondary += credit
        point.plannedTotal += credit
        point.plannedSetIds.push(plannedSourceId)
      })
    })
  }))

  linkedHistory.forEach((workSet) => {
    const credits = muscleCreditsFor(workSet.exerciseId, input.exercises)
    if (!credits || Object.keys(credits).length === 0) {
      linkedUnmappedSetIds.add(workSet.id)
      return
    }
    linkedMappedSetIds.add(workSet.id)
    Object.entries(credits).forEach(([muscleKey, credit]) => {
      if (credit === undefined) return
      const point = ensurePoint(muscleKey as MuscleId)
      if (credit === 1) point.completedDirect += 1
      else point.completedSecondary += credit
      point.completedTotal += credit
      point.completedSetIds.push(workSet.id)
    })
  })

  muscleDefinitions.forEach((definition) => ensurePoint(definition.id))
  const resultPoints = [...points.values()].map((point) => ({
    ...point,
    completionRate: point.plannedTotal ? point.completedTotal / point.plannedTotal : null,
    status: plannedStatusFor(point.plannedTotal, point.completedTotal)
  })).sort((a, b) => b.plannedTotal - a.plannedTotal || b.completedTotal - a.completedTotal || a.label.localeCompare(b.label))

  return {
    ruleVersion: 'muscle-plan-dose-v1',
    plannedSessionIds: [...plannedSessionIds],
    plannedSourceSetCount: plannedSessions.reduce((sum, session) => sum + session.exercises.reduce((exerciseSum, planned) => exerciseSum + planned.sets.length, 0), 0),
    plannedMappedSetCount: plannedMappedSetIds.size,
    plannedUnmappedSetCount: plannedUnmappedSetIds.size,
    plannedUnmappedExerciseNames: [...plannedUnmappedExerciseNames].sort(),
    linkedCompletedSetCount: linkedHistory.length,
    linkedCompletedMappedSetCount: linkedMappedSetIds.size,
    linkedCompletedUnmappedSetCount: linkedUnmappedSetIds.size,
    unlinkedCompletedSetCount: selectedHistory.length - linkedHistory.length,
    points: resultPoints
  }
}
