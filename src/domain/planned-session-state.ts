import type { SetPrescription, TrainingSession } from './types'

export const OPEN_SESSION_STATUSES = ['planned', 'deferred'] as const

export function isOpenUnstartedSession(session: TrainingSession) {
  return OPEN_SESSION_STATUSES.includes(session.status as (typeof OPEN_SESSION_STATUSES)[number])
}

function resetPlannedSet(workSet: SetPrescription): SetPrescription {
  const clean = { ...workSet, completed: false }
  delete clean.skipped
  delete clean.completedLoad
  delete clean.completedReps
  delete clean.actualRir
  delete clean.valuesEntered
  delete clean.entryOrigins
  return clean
}

/**
 * A planned or deferred workout has no completed training truth yet. Older snapshots could carry
 * active-workout entry fields back into an open session, so every open session is normalized at
 * migration and once more at start. Active and terminal sessions are never touched.
 */
export function resetUnstartedSessionTrainingState(session: TrainingSession): TrainingSession {
  if (!isOpenUnstartedSession(session)) return session
  return {
    ...session,
    exercises: session.exercises.map((planned) => ({
      ...planned,
      sets: planned.sets.map(resetPlannedSet)
    }))
  }
}

export function hasUnstartedSessionTrainingState(session: TrainingSession) {
  return isOpenUnstartedSession(session) && session.exercises.some((planned) => planned.sets.some((workSet) =>
    workSet.completed
    || workSet.skipped
    || workSet.completedLoad !== undefined
    || workSet.completedReps !== undefined
    || workSet.actualRir !== undefined
    || workSet.valuesEntered !== undefined
    || workSet.entryOrigins !== undefined
  ))
}
