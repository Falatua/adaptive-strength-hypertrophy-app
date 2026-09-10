import { benchAngleLabel, comparableAngleHistory, supportsBenchAngle } from './bench-angle-engine'
import { compactLoadLabel, loadModeForSet } from './load-mode'
import { isComparableExposure } from './set-structure-engine'
import type { CompletedSetRecord, Exercise, PlannedExercise } from './types'

export interface WorkoutMovementHistoryEntry {
  sessionId: string
  completedAt: string
  setCount: number
  repetitionScheme: number[]
  loadLabel: string
  effortLabel: string
  setupLabel: string
  totalRepetitions: number
  volumeLoad: number | null
}

export function buildWorkoutMovementHistory(input: {
  history: CompletedSetRecord[]
  planned: PlannedExercise
  exercise: Exercise
  units: 'lb' | 'kg'
  limit?: number
}): WorkoutMovementHistoryEntry[] {
  const mode = loadModeForSet(input.planned.sets[0] ?? {}, input.exercise)
  const exact = comparableAngleHistory(input.history.filter((workSet) => (
    workSet.exerciseId === input.exercise.id
    && workSet.numbersEntered !== false
    && !workSet.athleteAdded
    && isComparableExposure(workSet.grouping)
  )), input.planned).filter((workSet) => loadModeForSet(workSet, input.exercise) === mode)
  const bySession = new Map<string, CompletedSetRecord[]>()
  exact.forEach((workSet) => bySession.set(workSet.sessionId, [...(bySession.get(workSet.sessionId) ?? []), workSet]))

  return [...bySession.values()]
    .map((sets) => sets.sort((a, b) => a.setIndex - b.setIndex || a.id.localeCompare(b.id)))
    .sort((a, b) => new Date(b[0].completedAt).getTime() - new Date(a[0].completedAt).getTime())
    .slice(0, input.limit ?? 5)
    .map((sets) => {
      const loads = sets.map((workSet) => workSet.load)
      const sameLoad = loads.every((load) => load === loads[0])
      const effort = sets.map((workSet) => workSet.rirKnown === false ? '?' : String(workSet.rir))
      const sameEffort = effort.every((value) => value === effort[0])
      const totalRepetitions = sets.reduce((sum, workSet) => sum + workSet.reps, 0)
      return {
        sessionId: sets[0].sessionId,
        completedAt: sets.reduce((latest, workSet) => new Date(workSet.completedAt) > new Date(latest) ? workSet.completedAt : latest, sets[0].completedAt),
        setCount: sets.length,
        repetitionScheme: sets.map((workSet) => workSet.reps),
        loadLabel: sameLoad ? compactLoadLabel(mode, loads[0], input.units) : loads.map((load) => compactLoadLabel(mode, load, input.units)).join(' / '),
        effortLabel: sameEffort ? (effort[0] === '?' ? 'RIR unknown' : `${effort[0]} RIR`) : `RIR ${effort.join(' / ')}`,
        setupLabel: supportsBenchAngle(input.exercise) ? benchAngleLabel(sets[0].benchAngleDeg) : 'Exact setup',
        totalRepetitions,
        volumeLoad: mode === 'bodyweight' ? null : sets.reduce((sum, workSet) => sum + workSet.load * workSet.reps, 0)
      }
    })
}
