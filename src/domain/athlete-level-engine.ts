import type { CompletedSetRecord, PersonalRecord, TrainingSession } from './types'

export const ATHLETE_LEVEL_RULE = 'athlete-level-v2'

/** Four forms the athlete's avatar takes as training accumulates. */
export type AthleteForm = 'apprentice' | 'forged' | 'champion' | 'apex'

export interface AthleteFormDefinition {
  form: AthleteForm
  name: string
  minimumLevel: number
  blurb: string
}

/**
 * Forms are earned, never bought or chosen. Each one marks a genuine change in what the athlete has
 * accumulated, so the art is a readout of training history rather than decoration.
 */
export const athleteForms: AthleteFormDefinition[] = [
  { form: 'apprentice', name: 'Uncharted', minimumLevel: 1, blurb: 'ForgePath is beginning to map your completed work. Your experience outside this journal remains separate.' },
  { form: 'forged', name: 'Established', minimumLevel: 10, blurb: 'Your journal now holds repeatable completed work and exact movement history.' },
  { form: 'champion', name: 'Well mapped', minimumLevel: 25, blurb: 'Your journal spans many exact exposures and source-backed wins.' },
  { form: 'apex', name: 'Long record', minimumLevel: 50, blurb: 'Years of completed work are visible in one durable training journal.' }
]

export interface LevelSource {
  label: string
  detail: string
  points: number
}

export interface AthleteLevel {
  ruleVersion: typeof ATHLETE_LEVEL_RULE
  level: number
  form: AthleteForm
  formName: string
  formBlurb: string
  points: number
  pointsIntoLevel: number
  pointsForNextLevel: number
  progressToNextLevel: number
  nextForm: AthleteFormDefinition | null
  sources: LevelSource[]
}

/**
 * Missing days and conservative training never subtract points. The derived display is recomputed
 * from source truth when evidence is corrected or the versioned economy changes, so an inflated old
 * display can be repaired without touching the training itself. Sources remain individually visible.
 */
const POINTS = {
  completedSession: 100,
  partialSession: 70,
  validatedRecordSession: 25,
  numericRecordSession: 10,
  establishedMovement: 25
}

/**
 * Level 2 takes two ordinary workouts instead of arriving from one record-heavy first session. Each
 * later level costs another 75 points, creating a steadily slower long-term arc without tying progress
 * to unsafe loading, extra sets, workout duration, or raw tonnage.
 */
export function pointsForLevel(level: number): number {
  return 200 + Math.max(0, level - 1) * 75
}

function totalPointsThroughLevel(level: number): number {
  let total = 0
  for (let index = 1; index < level; index += 1) total += pointsForLevel(index)
  return total
}

export function athleteLevel(input: {
  history: CompletedSetRecord[]
  records: PersonalRecord[]
  sessions: TrainingSession[]
}): AthleteLevel {
  // Counted the same way badges count them: a session that produced completed work happened, whether
  // or not a planned session record exists for it.
  const sessionStatus = new Map(input.sessions.map((session) => [session.id, session.status]))
  const finishedSessions = new Set(input.sessions.filter((session) => session.status === 'completed' || session.status === 'partial-primary').map((session) => session.id))
  for (const workSet of input.history) finishedSessions.add(workSet.sessionId)
  const partialSessions = [...finishedSessions].filter((sessionId) => sessionStatus.get(sessionId) === 'partial-primary')
  const completedSessions = finishedSessions.size - partialSessions.length

  // A workout can create many record views from the same completed sets. Reward the source workout
  // once, not every record row, so a first workout cannot leap several levels.
  const validatedRecordSessions = new Set(input.records.filter((record) => record.validation === 'validated').map((record) => record.sourceSessionId))
  const numericRecordSessions = new Set(input.records.filter((record) => record.validation === 'numeric-only' && !validatedRecordSessions.has(record.sourceSessionId)).map((record) => record.sourceSessionId))

  // Breadth comes from repeated exposures, not piling more sets into one workout.
  const exposuresByExercise = new Map<string, Set<string>>()
  for (const workSet of input.history) {
    const exposures = exposuresByExercise.get(workSet.exerciseId) ?? new Set<string>()
    exposures.add(workSet.sessionId)
    exposuresByExercise.set(workSet.exerciseId, exposures)
  }
  const establishedMovements = [...exposuresByExercise.values()].filter((exposures) => exposures.size >= 3).length

  const sources: LevelSource[] = [
    { label: 'Workouts completed', detail: `${completedSessions} completed`, points: completedSessions * POINTS.completedSession },
    { label: 'Honest partial workouts', detail: `${partialSessions.length} with primary work completed`, points: partialSessions.length * POINTS.partialSession },
    { label: 'Validated record workouts', detail: `${validatedRecordSessions.size} source-backed workout${validatedRecordSessions.size === 1 ? '' : 's'}`, points: validatedRecordSessions.size * POINTS.validatedRecordSession },
    { label: 'Numeric-only record workouts', detail: `${numericRecordSessions.size} source-backed workout${numericRecordSessions.size === 1 ? '' : 's'}`, points: numericRecordSessions.size * POINTS.numericRecordSession },
    { label: 'Established movements', detail: `${establishedMovements} trained in three or more workouts`, points: establishedMovements * POINTS.establishedMovement }
  ].filter((source) => source.points > 0)

  const points = sources.reduce((total, source) => total + source.points, 0)

  let level = 1
  while (points >= totalPointsThroughLevel(level + 1)) level += 1

  const earnedThroughThisLevel = totalPointsThroughLevel(level)
  const pointsIntoLevel = points - earnedThroughThisLevel
  const pointsForNextLevel = pointsForLevel(level)
  const definition = [...athleteForms].reverse().find((entry) => level >= entry.minimumLevel) ?? athleteForms[0]
  const nextForm = athleteForms.find((entry) => entry.minimumLevel > level) ?? null

  return {
    ruleVersion: ATHLETE_LEVEL_RULE,
    level,
    form: definition.form,
    formName: definition.name,
    formBlurb: definition.blurb,
    points,
    pointsIntoLevel,
    pointsForNextLevel,
    progressToNextLevel: pointsForNextLevel > 0 ? Math.min(1, pointsIntoLevel / pointsForNextLevel) : 0,
    nextForm,
    sources
  }
}
