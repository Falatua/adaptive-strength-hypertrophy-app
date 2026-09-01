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
  loadModeLabel(loadModeForSet(workSet, exercise), workSet.targetLoad, units)

export const loadModeLabel = (mode: LoadMode, load: number, units: 'lb' | 'kg') => {
  if (mode === 'bodyweight') return 'Bodyweight'
  if (mode === 'weighted-bodyweight') return load > 0 ? `Bodyweight + ${load} ${units}` : `Bodyweight + load`
  if (mode === 'assisted-bodyweight') return load > 0 ? `${load} ${units} assistance` : 'Choose assistance'
  return `${load || 'Choose load'} ${units}`
}

export const compactLoadLabel = (mode: LoadMode, load: number, units: 'lb' | 'kg') => {
  if (mode === 'bodyweight') return 'BW'
  if (mode === 'weighted-bodyweight') return `BW + ${load} ${units}`
  if (mode === 'assisted-bodyweight') return `${load} ${units} assist`
  return `${load} ${units}`
}
