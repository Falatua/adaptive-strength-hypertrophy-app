import type { CompletedSetRecord, PlannedExercise, SetPrescription, TrainingSession } from './types'

export interface PlannedSetLink {
  planned: PlannedExercise
  target: SetPrescription
}

export function isOriginalPlannedSet(planned: PlannedExercise, target: SetPrescription) {
  return !planned.athleteAdded && !target.athleteAdded
}

/**
 * Links completed truth to the exact original prescription. Athlete-added work and ambiguous legacy
 * movement links remain completed dose, but never become plan adherence or automatic progression evidence.
 */
export function plannedSetLinkForRecord(session: TrainingSession, record: CompletedSetRecord): PlannedSetLink | null {
  if (record.athleteAdded) return null
  const planned = record.plannedExerciseId
    ? session.exercises.find((candidate) => candidate.id === record.plannedExerciseId)
    : session.exercises.filter((candidate) => candidate.exerciseId === record.exerciseId).length === 1
      ? session.exercises.find((candidate) => candidate.exerciseId === record.exerciseId)
      : undefined
  if (!planned || planned.exerciseId !== record.exerciseId) return null
  const target = planned.sets[record.setIndex]
  return target && isOriginalPlannedSet(planned, target) ? { planned, target } : null
}
