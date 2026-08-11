import type { Exercise, MovementNoteRecord, PlannedExercise, TrainingSession } from './types'

export const MOVEMENT_NOTE_RULE_VERSION = 'movement-note-v1' as const
export const MOVEMENT_NOTE_MAX_LENGTH = 1000

export interface MovementNoteInput {
  notes: MovementNoteRecord[]
  session: TrainingSession
  plannedExercise: PlannedExercise
  exercise: Exercise
  body: string
  now?: string
  id?: string
}

export function upsertMovementNote(input: MovementNoteInput): MovementNoteRecord[] {
  const body = input.body.slice(0, MOVEMENT_NOTE_MAX_LENGTH)
  const existing = input.notes.find((note) => note.sessionId === input.session.id
    && note.plannedExerciseId === input.plannedExercise.id
    && note.exerciseId === input.exercise.id)
  if (!body.trim()) return existing ? input.notes.filter((note) => note.id !== existing.id) : input.notes

  const now = input.now ?? new Date().toISOString()
  if (existing) return input.notes.map((note) => note.id === existing.id ? { ...note, body, updatedAt: now } : note)

  const note: MovementNoteRecord = {
    id: input.id ?? `movement-note:${input.session.id}:${input.plannedExercise.id}:${input.exercise.id}`,
    ruleVersion: MOVEMENT_NOTE_RULE_VERSION,
    sessionId: input.session.id,
    sessionTitle: input.session.title,
    plannedExerciseId: input.plannedExercise.id,
    exerciseId: input.exercise.id,
    exerciseName: input.exercise.name,
    mesocycleId: input.session.mesocycleId ?? null,
    planVersion: input.session.planVersion ?? null,
    microcycleNumber: input.session.microcycleNumber ?? null,
    sessionDate: input.session.startedAt ?? input.session.plannedDate,
    body,
    createdAt: now,
    updatedAt: now
  }
  return [...input.notes, note]
}

export function movementNotesForExercise(notes: MovementNoteRecord[], exerciseId: string) {
  return notes.filter((note) => note.exerciseId === exerciseId).sort((first, second) =>
    new Date(second.sessionDate).getTime() - new Date(first.sessionDate).getTime()
      || new Date(second.updatedAt).getTime() - new Date(first.updatedAt).getTime()
      || second.id.localeCompare(first.id))
}

export function projectMovementNoteMerge(notes: MovementNoteRecord[], sourceIds: string[], target: Exercise) {
  const sourceSet = new Set(sourceIds)
  return notes.map((note) => sourceSet.has(note.exerciseId) ? {
    ...note,
    originalExerciseId: note.originalExerciseId ?? note.exerciseId,
    originalExerciseName: note.originalExerciseName ?? note.exerciseName,
    exerciseId: target.id,
    exerciseName: target.name
  } : note)
}

export function movementNoteError(note: unknown) {
  if (!note || typeof note !== 'object' || Array.isArray(note)) return 'Movement note must be an object.'
  const value = note as Record<string, unknown>
  if (value.ruleVersion !== MOVEMENT_NOTE_RULE_VERSION) return 'Movement note rule version is invalid.'
  if (['id', 'sessionId', 'sessionTitle', 'plannedExerciseId', 'exerciseId', 'exerciseName', 'body'].some((key) => typeof value[key] !== 'string')) return 'Movement note identity or text is invalid.'
  if (['id', 'sessionId', 'sessionTitle', 'plannedExerciseId', 'exerciseId', 'exerciseName'].some((key) => !String(value[key]).trim())) return 'Movement note identity or label is empty.'
  if (!String(value.body).trim() || String(value.body).length > MOVEMENT_NOTE_MAX_LENGTH) return 'Movement note text is empty or too long.'
  if (Number.isNaN(new Date(String(value.sessionDate)).getTime()) || Number.isNaN(new Date(String(value.createdAt)).getTime()) || Number.isNaN(new Date(String(value.updatedAt)).getTime())) return 'Movement note date is invalid.'
  if (!(value.mesocycleId === null || typeof value.mesocycleId === 'string')) return 'Movement note mesocycle identity is invalid.'
  if (!(value.planVersion === null || (typeof value.planVersion === 'number' && Number.isInteger(value.planVersion) && value.planVersion >= 1))) return 'Movement note plan version is invalid.'
  if (!(value.microcycleNumber === null || (typeof value.microcycleNumber === 'number' && Number.isInteger(value.microcycleNumber) && value.microcycleNumber >= 1))) return 'Movement note microcycle number is invalid.'
  if (value.originalExerciseId !== undefined && typeof value.originalExerciseId !== 'string') return 'Movement note original exercise identity is invalid.'
  if (value.originalExerciseName !== undefined && typeof value.originalExerciseName !== 'string') return 'Movement note original exercise name is invalid.'
  if ((value.originalExerciseId === undefined) !== (value.originalExerciseName === undefined)) return 'Movement note original exercise identity is incomplete.'
  return null
}
