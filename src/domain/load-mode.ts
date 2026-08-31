import type { Exercise, LoadMode, PlannedExercise, SetPrescription } from './types'

export const supportsBodyweightMode = (exercise: Exercise) =>
  exercise.roleTags.includes('bodyweight')
  || exercise.equipment.includes('bodyweight')
  || (/pull-up|chin-up|dip/i.test(exercise.name) && !/assisted/i.test(exercise.name))

export const defaultLoadModeFor = (exercise: Exercise): LoadMode =>
  supportsBodyweightMode(exercise) && !/weighted|assisted/i.test(exercise.name) ? 'bodyweight' : 'external'

export const loadModeForSet = (workSet: Pick<SetPrescription, 'loadMode'>, exercise: Exercise): LoadMode =>
  workSet.loadMode ?? defaultLoadModeFor(exercise)

export const plannedLoadMode = (planned: PlannedExercise, exercise: Exercise): LoadMode =>
  loadModeForSet(planned.sets[0] ?? {}, exercise)

export const loadLabel = (workSet: Pick<SetPrescription, 'targetLoad' | 'loadMode'>, exercise: Exercise, units: 'lb' | 'kg') =>
  loadModeForSet(workSet, exercise) === 'bodyweight' ? 'Bodyweight' : `${workSet.targetLoad || 'Choose load'} ${units}`
