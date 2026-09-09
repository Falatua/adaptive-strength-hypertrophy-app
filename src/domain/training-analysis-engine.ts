import { historyInRange, rangeWindow, type ProgressRange } from './analytics'
import { muscleCreditsFor, muscleDefinitions } from './muscle-dose'
import { plannedSetLinkForRecord } from './planned-set-link'
import type { CompletedSetRecord, Exercise, LoadMode, MuscleId, PlannedExercise, SetPrescription, TrainingSession } from './types'

export const TRAINING_RHYTHM_RULE_VERSION = 'training-rhythm-v1' as const
export const PLAN_EXECUTION_RULE_VERSION = 'plan-execution-v1' as const

const DAY_MS = 86_400_000

function validDate(value: string | Date) {
  const date = typeof value === 'string' ? new Date(value) : value
  return Number.isNaN(date.getTime()) ? null : date
}

function localDayNumber(value: string | Date) {
  const date = validDate(value)
  return date ? Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / DAY_MS) : null
}

function localDayKey(value: string | Date) {
  const date = validDate(value)
  if (!date) return null
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function roundedAverage(values: number[]) {
  return values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length * 10) / 10 : null
}

function gapsBetween(dayNumbers: number[]) {
  return dayNumbers.slice(1).map((day, index) => day - dayNumbers[index])
}

export interface TrainingDayPoint {
  dayKey: string
  completedAt: string
  completedSets: number
  sessionCount: number
  gapFromPriorDays: number | null
}

export interface MuscleRecencyPoint {
  muscle: MuscleId
  label: string
  area: (typeof muscleDefinitions)[number]['area']
  exposureDays: number
  sourceSetCount: number
  directSetCount: number
  secondarySetCount: number
  lastCompletedAt: string | null
  daysSinceLastExposure: number | null
  latestGapDays: number | null
  averageGapDays: number | null
  latestCredit: 'direct' | 'secondary' | null
}

export interface TrainingRhythmSummary {
  ruleVersion: typeof TRAINING_RHYTHM_RULE_VERSION
  totalTrainingDays: number
  lastTrainingAt: string | null
  daysSinceLastTraining: number | null
  latestGapDays: number | null
  averageGapDays: number | null
  longestGapDays: number | null
  recentTrainingDays: TrainingDayPoint[]
  muscles: MuscleRecencyPoint[]
  mappedSetCount: number
  unmappedSetCount: number
}

interface MuscleRhythmBucket {
  sets: Array<{ workSet: CompletedSetRecord; credit: number }>
  days: Map<string, { dayNumber: number; completedAt: string; direct: boolean }>
}

export function buildTrainingRhythm(input: {
  history: CompletedSetRecord[]
  exercises: Exercise[]
  now?: Date
  recentDayLimit?: number
}): TrainingRhythmSummary {
  const now = input.now ?? new Date()
  const nowDay = localDayNumber(now)!
  const validHistory = input.history.filter((workSet) => {
    const timestamp = validDate(workSet.completedAt)?.getTime()
    return timestamp !== undefined && timestamp !== null && timestamp <= now.getTime()
  })
  const trainingDayBuckets = new Map<string, { dayNumber: number; completedAt: string; completedSets: number; sessionIds: Set<string> }>()
  validHistory.forEach((workSet) => {
    const key = localDayKey(workSet.completedAt)
    const dayNumber = localDayNumber(workSet.completedAt)
    if (!key || dayNumber === null) return
    const current = trainingDayBuckets.get(key) ?? { dayNumber, completedAt: workSet.completedAt, completedSets: 0, sessionIds: new Set<string>() }
    current.completedSets += 1
    current.sessionIds.add(workSet.sessionId)
    if (new Date(workSet.completedAt).getTime() > new Date(current.completedAt).getTime()) current.completedAt = workSet.completedAt
    trainingDayBuckets.set(key, current)
  })
  const orderedDays = [...trainingDayBuckets.entries()].sort(([, a], [, b]) => a.dayNumber - b.dayNumber)
  const trainingGaps = gapsBetween(orderedDays.map(([, point]) => point.dayNumber))
  const recentTrainingDays = orderedDays.map(([dayKey, point], index): TrainingDayPoint => ({
    dayKey,
    completedAt: point.completedAt,
    completedSets: point.completedSets,
    sessionCount: point.sessionIds.size,
    gapFromPriorDays: index ? point.dayNumber - orderedDays[index - 1][1].dayNumber : null
  })).slice(-(input.recentDayLimit ?? 8)).reverse()

  const muscleBuckets = new Map<MuscleId, MuscleRhythmBucket>()
  let mappedSetCount = 0
  let unmappedSetCount = 0
  validHistory.forEach((workSet) => {
    const credits = muscleCreditsFor(workSet.exerciseId, input.exercises)
    if (!credits || Object.keys(credits).length === 0) {
      unmappedSetCount += 1
      return
    }
    mappedSetCount += 1
    Object.entries(credits).forEach(([muscleKey, credit]) => {
      if (credit === undefined) return
      const muscle = muscleKey as MuscleId
      const key = localDayKey(workSet.completedAt)
      const dayNumber = localDayNumber(workSet.completedAt)
      if (!key || dayNumber === null) return
      const bucket: MuscleRhythmBucket = muscleBuckets.get(muscle) ?? { sets: [], days: new Map() }
      bucket.sets.push({ workSet, credit })
      const currentDay = bucket.days.get(key)
      if (!currentDay || new Date(workSet.completedAt).getTime() > new Date(currentDay.completedAt).getTime()) {
        bucket.days.set(key, { dayNumber, completedAt: workSet.completedAt, direct: credit === 1 || Boolean(currentDay?.direct) })
      } else if (credit === 1) {
        currentDay.direct = true
      }
      muscleBuckets.set(muscle, bucket)
    })
  })

  const muscles = muscleDefinitions.map((definition): MuscleRecencyPoint => {
    const bucket = muscleBuckets.get(definition.id)
    if (!bucket) return {
      muscle: definition.id, label: definition.label, area: definition.area, exposureDays: 0, sourceSetCount: 0,
      directSetCount: 0, secondarySetCount: 0, lastCompletedAt: null, daysSinceLastExposure: null,
      latestGapDays: null, averageGapDays: null, latestCredit: null
    }
    const ordered = [...bucket.days.values()].sort((a, b) => a.dayNumber - b.dayNumber)
    const gaps = gapsBetween(ordered.map((point) => point.dayNumber))
    const latest = ordered.at(-1)!
    return {
      muscle: definition.id,
      label: definition.label,
      area: definition.area,
      exposureDays: ordered.length,
      sourceSetCount: bucket.sets.length,
      directSetCount: bucket.sets.filter((entry) => entry.credit === 1).length,
      secondarySetCount: bucket.sets.filter((entry) => entry.credit !== 1).length,
      lastCompletedAt: latest.completedAt,
      daysSinceLastExposure: Math.max(0, nowDay - latest.dayNumber),
      latestGapDays: gaps.at(-1) ?? null,
      averageGapDays: roundedAverage(gaps),
      latestCredit: latest.direct ? 'direct' : 'secondary'
    }
  }).sort((a, b) => (a.daysSinceLastExposure ?? Number.POSITIVE_INFINITY) - (b.daysSinceLastExposure ?? Number.POSITIVE_INFINITY) || a.label.localeCompare(b.label))

  const lastTrainingDay = orderedDays.at(-1)?.[1]
  return {
    ruleVersion: TRAINING_RHYTHM_RULE_VERSION,
    totalTrainingDays: orderedDays.length,
    lastTrainingAt: lastTrainingDay?.completedAt ?? null,
    daysSinceLastTraining: lastTrainingDay ? Math.max(0, nowDay - lastTrainingDay.dayNumber) : null,
    latestGapDays: trainingGaps.at(-1) ?? null,
    averageGapDays: roundedAverage(trainingGaps),
    longestGapDays: trainingGaps.length ? Math.max(...trainingGaps) : null,
    recentTrainingDays,
    muscles,
    mappedSetCount,
    unmappedSetCount
  }
}

export type PlanExecutionSignal = 'supports-review' | 'as-planned' | 'harder-than-planned' | 'below-plan' | 'protect' | 'mixed' | 'insufficient-evidence'

export interface PlanExecutionMetric {
  comparableSets: number
  higher: number
  same: number
  lower: number
  averageDelta: number | null
}

export interface MovementPlanExecutionPoint {
  exerciseId: string
  exerciseName: string
  plannedSessions: number
  plannedSets: number
  pendingPlannedSets: number
  completedPlannedSets: number
  unplannedCompletedSets: number
  enteredNumberSets: number
  rirKnownSets: number
  plannedReps: number
  actualEnteredReps: number
  plannedVolumeKnown: number
  actualVolumeKnown: number
  load: PlanExecutionMetric
  reps: PlanExecutionMetric
  rir: PlanExecutionMetric
  signal: PlanExecutionSignal
  interpretation: string
}

export interface PlanExecutionSummary {
  ruleVersion: typeof PLAN_EXECUTION_RULE_VERSION
  plannedSessionIds: string[]
  plannedSets: number
  completedPlannedSets: number
  unplannedCompletedSets: number
  targetMatchedSets: number
  enteredNumberSets: number
  unknownNumberSets: number
  rirKnownSets: number
  load: PlanExecutionMetric
  reps: PlanExecutionMetric
  rir: PlanExecutionMetric
  movements: MovementPlanExecutionPoint[]
}

interface MatchedSet {
  record: CompletedSetRecord
  session: TrainingSession
  planned: PlannedExercise
  target: SetPrescription
}

function metric(deltas: number[]): PlanExecutionMetric {
  return {
    comparableSets: deltas.length,
    higher: deltas.filter((delta) => delta > 0).length,
    same: deltas.filter((delta) => delta === 0).length,
    lower: deltas.filter((delta) => delta < 0).length,
    averageDelta: roundedAverage(deltas)
  }
}

function loadModeForComparison(target: SetPrescription, record: CompletedSetRecord): LoadMode {
  return target.loadMode ?? record.loadMode ?? (target.targetLoad === 0 && record.load === 0 ? 'bodyweight' : 'external')
}

function hasComparableLoad(target: SetPrescription, record: CompletedSetRecord) {
  return loadModeForComparison(target, record) !== 'bodyweight' && target.targetLoad > 0
}

function findTarget(session: TrainingSession, record: CompletedSetRecord): MatchedSet | null {
  const link = plannedSetLinkForRecord(session, record)
  return link ? { record, session, ...link } : null
}

function signalFor(point: Omit<MovementPlanExecutionPoint, 'signal' | 'interpretation'>, matches: MatchedSet[]) {
  const knownPain = matches.filter(({ record }) => record.qualityConfirmed === true).map(({ record }) => record.pain)
  if (knownPain.some((pain) => pain >= 4)) return {
    signal: 'protect' as const,
    interpretation: 'Recorded pain changed the meaning of the work. Progression stays blocked until athlete review.'
  }
  if (point.pendingPlannedSets > 0 && point.completedPlannedSets < point.plannedSets) return {
    signal: 'insufficient-evidence' as const,
    interpretation: 'Some planned sets are still open. ForgePath waits for the workout outcome before interpreting plan execution.'
  }
  if (point.completedPlannedSets < point.plannedSets) return {
    signal: 'below-plan' as const,
    interpretation: 'Fewer planned sets were completed. Keep the work as actual dose and review recovery, pain, continuity, or time before progressing.'
  }
  if (point.enteredNumberSets < point.completedPlannedSets || point.rirKnownSets < point.completedPlannedSets) return {
    signal: 'insufficient-evidence' as const,
    interpretation: 'Some completed sets lack entered load, repetitions, or RIR, so ForgePath keeps the progression signal incomplete.'
  }
  const loadUp = (point.load.averageDelta ?? 0) > 0
  const repsUp = (point.reps.averageDelta ?? 0) > 0
  const effortDelta = point.rir.averageDelta ?? 0
  if ((loadUp || repsUp) && effortDelta < 0) return {
    signal: 'harder-than-planned' as const,
    interpretation: 'Load or repetitions rose, but recorded RIR was lower than planned. Do not treat the bigger number alone as clean progression.'
  }
  if ((loadUp || repsUp) && effortDelta >= 0) return {
    signal: 'supports-review' as const,
    interpretation: 'Targets were met or exceeded without a lower recorded RIR. This strengthens the next progression review, but repeated comparable exposures and recovery still decide it.'
  }
  if ((point.load.averageDelta ?? 0) === 0 && (point.reps.averageDelta ?? 0) === 0 && effortDelta === 0) return {
    signal: 'as-planned' as const,
    interpretation: 'The prescription was completed at its entered targets. That is useful repeatability evidence, not an automatic increase.'
  }
  return {
    signal: 'mixed' as const,
    interpretation: 'Load, repetitions, or effort moved in different directions. Review the exact sets instead of collapsing them into one score.'
  }
}

export function buildPlanExecutionAnalysis(input: {
  sessions: TrainingSession[]
  history: CompletedSetRecord[]
  exercises: Exercise[]
  range: ProgressRange
  now?: Date
}): PlanExecutionSummary {
  const now = input.now ?? new Date()
  const window = rangeWindow(input.range, now)
  const plannedSessions = input.sessions.filter((session) => {
    const timestamp = validDate(session.plannedDate)?.getTime()
    return timestamp !== undefined && timestamp !== null && timestamp <= window.end.getTime() && (window.start === null || timestamp >= window.start.getTime())
  })
  const sessionById = new Map(plannedSessions.map((session) => [session.id, session]))
  const selectedHistory = historyInRange(input.history, input.range, now)
  const matches = selectedHistory.flatMap((record) => {
    const session = sessionById.get(record.sessionId)
    if (!session) return []
    const match = findTarget(session, record)
    return match ? [match] : []
  })
  const matchedIds = new Set(matches.map(({ record }) => record.id))
  const unplanned = selectedHistory.filter((record) => !matchedIds.has(record.id))
  const exerciseById = new Map(input.exercises.map((exercise) => [exercise.id, exercise]))
  const movementIds = new Set<string>()
  plannedSessions.forEach((session) => session.exercises.forEach((planned) => {
    if (!planned.athleteAdded && planned.sets.some((workSet) => !workSet.athleteAdded)) movementIds.add(planned.exerciseId)
  }))
  unplanned.forEach((record) => movementIds.add(record.exerciseId))

  const movementPoints = [...movementIds].map((exerciseId) => {
    const plannedEntries = plannedSessions.flatMap((session) => session.exercises.filter((planned) => planned.exerciseId === exerciseId && !planned.athleteAdded).map((planned) => ({ session, planned })))
    const plannedSets = plannedEntries.flatMap(({ planned }) => planned.sets.filter((workSet) => !workSet.athleteAdded))
    const movementMatches = matches.filter(({ record }) => record.exerciseId === exerciseId)
    const entered = movementMatches.filter(({ record }) => record.numbersEntered === true)
    const rirKnown = movementMatches.filter(({ record }) => record.rirKnown === true)
    const loadDeltas = entered.flatMap(({ record, target }) => hasComparableLoad(target, record) ? [record.load - target.targetLoad] : [])
    const repDeltas = entered.map(({ record, target }) => record.reps - target.targetReps)
    const rirDeltas = rirKnown.map(({ record, target }) => record.rir - target.targetRir)
    const base = {
      exerciseId,
      exerciseName: exerciseById.get(exerciseId)?.name ?? movementMatches[0]?.record.exerciseName ?? unplanned.find((record) => record.exerciseId === exerciseId)?.exerciseName ?? exerciseId,
      plannedSessions: new Set(plannedEntries.map(({ session }) => session.id)).size,
      plannedSets: plannedSets.length,
      pendingPlannedSets: Math.max(0,
        plannedEntries.reduce((sum, { session, planned }) => ['planned', 'active'].includes(session.status) ? sum + planned.sets.filter((workSet) => !workSet.athleteAdded).length : sum, 0)
        - movementMatches.filter(({ session }) => ['planned', 'active'].includes(session.status)).length
      ),
      completedPlannedSets: movementMatches.length,
      unplannedCompletedSets: unplanned.filter((record) => record.exerciseId === exerciseId).length,
      enteredNumberSets: entered.length,
      rirKnownSets: rirKnown.length,
      plannedReps: plannedSets.reduce((sum, workSet) => sum + workSet.targetReps, 0),
      actualEnteredReps: entered.reduce((sum, { record }) => sum + record.reps, 0),
      plannedVolumeKnown: plannedSets.reduce((sum, workSet) => workSet.targetLoad > 0 ? sum + workSet.targetLoad * workSet.targetReps : sum, 0),
      actualVolumeKnown: entered.reduce((sum, { record }) => record.load > 0 ? sum + record.load * record.reps : sum, 0),
      load: metric(loadDeltas),
      reps: metric(repDeltas),
      rir: metric(rirDeltas)
    }
    return { ...base, ...signalFor(base, movementMatches) }
  }).sort((a, b) => b.plannedSets - a.plannedSets || b.completedPlannedSets - a.completedPlannedSets || a.exerciseName.localeCompare(b.exerciseName))

  const enteredMatches = matches.filter(({ record }) => record.numbersEntered === true)
  const rirMatches = matches.filter(({ record }) => record.rirKnown === true)
  const plannedSets = plannedSessions.reduce((sum, session) => sum + session.exercises.reduce((movementSum, planned) => planned.athleteAdded ? movementSum : movementSum + planned.sets.filter((workSet) => !workSet.athleteAdded).length, 0), 0)
  return {
    ruleVersion: PLAN_EXECUTION_RULE_VERSION,
    plannedSessionIds: plannedSessions.map((session) => session.id),
    plannedSets,
    completedPlannedSets: matches.length,
    unplannedCompletedSets: unplanned.length,
    targetMatchedSets: matches.length,
    enteredNumberSets: enteredMatches.length,
    unknownNumberSets: matches.length - enteredMatches.length,
    rirKnownSets: rirMatches.length,
    load: metric(enteredMatches.flatMap(({ record, target }) => hasComparableLoad(target, record) ? [record.load - target.targetLoad] : [])),
    reps: metric(enteredMatches.map(({ record, target }) => record.reps - target.targetReps)),
    rir: metric(rirMatches.map(({ record, target }) => record.rir - target.targetRir)),
    movements: movementPoints
  }
}
