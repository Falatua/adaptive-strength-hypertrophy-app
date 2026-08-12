import type { CompletedSetRecord, PersonalRecord, TrainingSession } from './types'

export const ATHLETE_LEVEL_RULE = 'athlete-level-v1'

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
  { form: 'apprentice', name: 'Apprentice', minimumLevel: 1, blurb: 'Learning the lifts and building the habit.' },
  { form: 'forged', name: 'Forged', minimumLevel: 10, blurb: 'The work is consistent and the lifts are repeatable.' },
  { form: 'champion', name: 'Champion', minimumLevel: 25, blurb: 'Heavy work is familiar and the record book is filling.' },
  { form: 'apex', name: 'Apex', minimumLevel: 50, blurb: 'Years of accumulated work made visible.' }
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
 * Levelling is cumulative and cannot fall. Points come only from work that actually happened, so a
 * level is a statement about training history rather than about time spent in the app. Sources are
 * returned individually so the athlete can see exactly what earned it.
 */
const POINTS = {
  session: 10,
  validatedRecord: 25,
  numericRecord: 10,
  volumePerThousand: 1,
  masteredMovement: 15
}

/** Each level costs a little more than the last, so the early arc moves and the late arc endures. */
export function pointsForLevel(level: number): number {
  return 50 + Math.max(0, level - 1) * 25
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
  const completedSessions = input.sessions.filter((session) => session.status === 'completed' || session.status === 'partial-primary').length
  const validatedRecords = input.records.filter((record) => record.validation === 'validated').length
  const numericRecords = input.records.length - validatedRecords
  const volumeLoad = input.history.reduce((total, workSet) => total + workSet.load * workSet.reps, 0)
  const volumeThousands = Math.floor(volumeLoad / 1000)

  // A movement counts as mastered once it has been trained enough times to have a real history.
  const exposuresByExercise = new Map<string, number>()
  for (const workSet of input.history) {
    exposuresByExercise.set(workSet.exerciseId, (exposuresByExercise.get(workSet.exerciseId) ?? 0) + 1)
  }
  const masteredMovements = [...exposuresByExercise.values()].filter((count) => count >= 9).length

  const sources: LevelSource[] = [
    { label: 'Sessions finished', detail: `${completedSessions} completed`, points: completedSessions * POINTS.session },
    { label: 'Validated records', detail: `${validatedRecords} with confirmed quality`, points: validatedRecords * POINTS.validatedRecord },
    { label: 'Numeric records', detail: `${numericRecords} without confirmed quality`, points: numericRecords * POINTS.numericRecord },
    { label: 'Volume moved', detail: `${volumeLoad.toLocaleString()} total`, points: volumeThousands * POINTS.volumePerThousand },
    { label: 'Movements mastered', detail: `${masteredMovements} with nine or more logged sets`, points: masteredMovements * POINTS.masteredMovement }
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
