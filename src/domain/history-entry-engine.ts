import type { CompletedSetRecord, Exercise } from './types'
import { rpeToRir } from './route-session-engine'

export type HistoricalEffortScale = 'rir' | 'rpe' | 'unknown'
export type HistoricalLoadUnit = 'lb' | 'kg'

export interface HistoricalPerformanceInput {
  exerciseId: string
  completedAt: string
  setCount: number
  reps: number
  load: number
  loadUnit: HistoricalLoadUnit
  effortScale: HistoricalEffortScale
  effortValue: number | null
  benchAngleDeg?: number | null
  technique?: number | null
  pain?: number | null
  sessionName?: string
  note?: string
}

export interface HistoricalPerformanceProjection {
  records: CompletedSetRecord[]
  normalizedLoad: number
  normalizedRir: number
  rirKnown: boolean
  qualityConfirmed: boolean
}

const roundLoad = (value: number) => Math.round(value * 10) / 10

export function normalizeHistoricalLoad(load: number, from: HistoricalLoadUnit, to: HistoricalLoadUnit) {
  if (from === to || load === 0) return roundLoad(load)
  return roundLoad(from === 'kg' ? load * 2.2046226218 : load / 2.2046226218)
}

export function historicalPerformanceError(input: HistoricalPerformanceInput, exercise: Exercise | undefined, now = new Date()) {
  if (!exercise || exercise.retired || exercise.id !== input.exerciseId) return 'Choose an active movement from the Library.'
  const completedAt = new Date(input.completedAt)
  if (Number.isNaN(completedAt.getTime())) return 'Choose a valid training date.'
  if (completedAt.getTime() > now.getTime() + 5 * 60_000) return 'Past performance cannot be dated in the future.'
  if (!Number.isInteger(input.setCount) || input.setCount < 1 || input.setCount > 50) return 'Sets must be a whole number from 1 to 50.'
  if (!Number.isInteger(input.reps) || input.reps < 1 || input.reps > 1000) return 'Repetitions must be a whole number from 1 to 1000.'
  if (!Number.isFinite(input.load) || input.load < 0 || input.load > 100_000) return 'Weight must be between 0 and 100,000.'
  if (!['lb', 'kg'].includes(input.loadUnit)) return 'Choose pounds or kilograms.'
  if (!['rir', 'rpe', 'unknown'].includes(input.effortScale)) return 'Choose RIR, RPE, or unknown effort.'
  if (input.effortScale === 'unknown' && input.effortValue !== null) return 'Unknown effort cannot include an effort number.'
  if (input.effortScale === 'rir' && (!Number.isFinite(input.effortValue) || Number(input.effortValue) < 0 || Number(input.effortValue) > 10)) return 'RIR must be between 0 and 10.'
  if (input.effortScale === 'rpe' && (!Number.isFinite(input.effortValue) || Number(input.effortValue) < 1 || Number(input.effortValue) > 10)) return 'RPE must be between 1 and 10.'
  if (input.benchAngleDeg !== undefined && input.benchAngleDeg !== null && (!Number.isFinite(input.benchAngleDeg) || input.benchAngleDeg < 0 || input.benchAngleDeg > 90)) return 'Bench angle must be between 0 and 90 degrees.'
  if (input.technique !== undefined && input.technique !== null && (!Number.isInteger(input.technique) || input.technique < 1 || input.technique > 5)) return 'Technique must be a whole number from 1 to 5.'
  if (input.pain !== undefined && input.pain !== null && (!Number.isInteger(input.pain) || input.pain < 0 || input.pain > 5)) return 'Pain or irritation must be a whole number from 0 to 5.'
  if ((input.technique === null || input.technique === undefined) !== (input.pain === null || input.pain === undefined)) return 'Enter both technique and pain, or leave both unknown.'
  if ((input.sessionName?.trim().length ?? 0) > 120) return 'Session name must be 120 characters or fewer.'
  if ((input.note?.trim().length ?? 0) > 500) return 'Notes must be 500 characters or fewer.'
  return null
}

export function buildHistoricalPerformance(input: {
  entryId: string
  form: HistoricalPerformanceInput
  exercise: Exercise
  appUnits: HistoricalLoadUnit
  enteredAt?: string
  now?: Date
}): HistoricalPerformanceProjection {
  const enteredAt = input.enteredAt ?? new Date().toISOString()
  const error = historicalPerformanceError(input.form, input.exercise, input.now)
  if (error) throw new Error(error)
  if (!input.entryId.trim()) throw new Error('Historical performance needs a stable entry ID.')
  const normalizedLoad = normalizeHistoricalLoad(input.form.load, input.form.loadUnit, input.appUnits)
  const rirKnown = input.form.effortScale !== 'unknown'
  const normalizedRir = input.form.effortScale === 'rpe'
    ? rpeToRir(Number(input.form.effortValue))
    : input.form.effortScale === 'rir' ? Number(input.form.effortValue) : 0
  const qualityConfirmed = input.form.technique !== null && input.form.technique !== undefined && input.form.pain !== null && input.form.pain !== undefined
  const sessionId = `history-entry-session-${input.entryId}`
  const sessionName = input.form.sessionName?.trim() || 'Past training'
  const note = input.form.note?.trim() || undefined
  const records = Array.from({ length: input.form.setCount }, (_, setIndex): CompletedSetRecord => ({
    id: `history-entry-set-${input.entryId}-${setIndex + 1}`,
    sessionId,
    exerciseId: input.exercise.id,
    exerciseName: input.exercise.name,
    family: input.exercise.family,
    primaryRegion: input.exercise.primaryRegion,
    completedAt: new Date(input.form.completedAt).toISOString(),
    reps: input.form.reps,
    load: normalizedLoad,
    rir: normalizedRir,
    rirKnown,
    technique: qualityConfirmed ? Number(input.form.technique) : 0,
    pain: qualityConfirmed ? Number(input.form.pain) : 0,
    qualityConfirmed,
    numbersEntered: true,
    setIndex,
    ...(input.form.benchAngleDeg === null || input.form.benchAngleDeg === undefined ? {} : { benchAngleDeg: input.form.benchAngleDeg }),
    historyEntryId: input.entryId,
    historyEntrySource: 'library',
    historyEntryUnits: input.form.loadUnit,
    historyEntryEffortScale: input.form.effortScale,
    ...(input.form.effortValue === null ? {} : { historyEntryEffortValue: input.form.effortValue }),
    historyEntrySessionName: sessionName,
    ...(note ? { historyEntryNote: note } : {}),
    historyEnteredAt: enteredAt
  }))
  return { records, normalizedLoad, normalizedRir, rirKnown, qualityConfirmed }
}
