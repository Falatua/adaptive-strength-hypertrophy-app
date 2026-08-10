import type { CompletedSetRecord, Exercise } from './types'
import { duplicateCandidates } from './training-engine'

export type ImportUnit = 'lb' | 'kg'
export type ImportMappingStatus = 'exact' | 'review' | 'unmatched'

export interface TrainingHistoryImportRow {
  rowNumber: number
  sourceDate: string
  sourceExerciseName: string
  sourceSessionName: string
  sourceLoad: number
  sourceUnits: ImportUnit
  normalizedLoad: number
  reps: number
  rir: number
  rirKnown: boolean
  fingerprint: string
}

export interface TrainingHistoryImportMapping {
  sourceExerciseName: string
  rowCount: number
  status: ImportMappingStatus
  exactExerciseId: string | null
  suggestedExerciseId: string | null
  suggestedScore: number | null
}

export interface TrainingHistoryImportPreview {
  sourceName: string
  sourceUnits: ImportUnit
  appUnits: ImportUnit
  rows: TrainingHistoryImportRow[]
  mappings: TrainingHistoryImportMapping[]
  errors: string[]
  duplicateFingerprints: string[]
  earliestDate: string | null
  latestDate: string | null
  convertedLoads: number
}

export interface TrainingHistoryImportProjection {
  records: CompletedSetRecord[]
  skippedDuplicates: number
}

const normalizedHeader = (value: string) => value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')
const normalizedIdentity = (value: string) => value.trim().toLowerCase().replace(/[^a-z0-9]/g, '')
const roundLoad = (value: number) => Math.round(value * 10) / 10

const headerAliases = {
  date: ['date', 'completed_at', 'completed_date', 'workout_date'],
  exercise: ['exercise', 'exercise_name', 'movement', 'movement_name'],
  load: ['load', 'weight', 'load_weight'],
  reps: ['reps', 'repetitions'],
  rir: ['rir', 'reps_in_reserve'],
  session: ['session', 'session_name', 'workout', 'workout_name']
} as const

function csvRows(raw: string) {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let quoted = false
  for (let index = 0; index < raw.length; index += 1) {
    const character = raw[index]
    if (quoted) {
      if (character === '"' && raw[index + 1] === '"') {
        field += '"'
        index += 1
      } else if (character === '"') quoted = false
      else field += character
      continue
    }
    if (character === '"') quoted = true
    else if (character === ',') {
      row.push(field)
      field = ''
    } else if (character === '\n' || character === '\r') {
      if (character === '\r' && raw[index + 1] === '\n') index += 1
      row.push(field)
      if (row.some((value) => value.trim())) rows.push(row)
      row = []
      field = ''
    } else field += character
  }
  if (quoted) throw new Error('The CSV has an unclosed quoted field.')
  row.push(field)
  if (row.some((value) => value.trim())) rows.push(row)
  return rows
}

function columnIndex(headers: string[], aliases: readonly string[]) {
  return headers.findIndex((header) => aliases.includes(header))
}

function isoDate(value: string) {
  const trimmed = value.trim()
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:?\d{2})?)?$/.exec(trimmed)
  if (!match) return null
  const calendarCheck = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])))
  if (calendarCheck.getUTCFullYear() !== Number(match[1]) || calendarCheck.getUTCMonth() + 1 !== Number(match[2]) || calendarCheck.getUTCDate() !== Number(match[3])) return null
  const parsed = new Date(trimmed.length === 10 ? `${trimmed}T12:00:00` : trimmed)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed.toISOString()
}

function convertedLoad(load: number, sourceUnits: ImportUnit, appUnits: ImportUnit) {
  if (sourceUnits === appUnits || load === 0) return load
  return roundLoad(sourceUnits === 'kg' ? load * 2.2046226218 : load / 2.2046226218)
}

function fingerprintFor(input: Pick<TrainingHistoryImportRow, 'sourceDate' | 'sourceExerciseName' | 'sourceSessionName' | 'normalizedLoad' | 'reps' | 'rir' | 'rirKnown'>) {
  return [
    input.sourceDate,
    normalizedIdentity(input.sourceExerciseName),
    normalizedIdentity(input.sourceSessionName),
    input.normalizedLoad,
    input.reps,
    input.rirKnown ? input.rir : 'unknown'
  ].join('|')
}

export function parseTrainingHistoryCsv(input: {
  raw: string
  sourceName: string
  sourceUnits: ImportUnit
  appUnits: ImportUnit
  exercises: Exercise[]
  existingHistory?: CompletedSetRecord[]
}): TrainingHistoryImportPreview {
  const parsed = csvRows(input.raw.replace(/^\uFEFF/, ''))
  if (parsed.length < 2) throw new Error('Add a header row and at least one completed set.')
  if (parsed.length > 10_001) throw new Error('Import no more than 10,000 completed sets at once.')
  const headers = parsed[0].map(normalizedHeader)
  const indexes = {
    date: columnIndex(headers, headerAliases.date),
    exercise: columnIndex(headers, headerAliases.exercise),
    load: columnIndex(headers, headerAliases.load),
    reps: columnIndex(headers, headerAliases.reps),
    rir: columnIndex(headers, headerAliases.rir),
    session: columnIndex(headers, headerAliases.session)
  }
  const missing = (['date', 'exercise', 'load', 'reps'] as const).filter((key) => indexes[key] < 0)
  if (missing.length) throw new Error(`Missing required column${missing.length === 1 ? '' : 's'}: ${missing.join(', ')}.`)

  const errors: string[] = []
  const rows: TrainingHistoryImportRow[] = []
  const fingerprintOccurrences = new Map<string, number>()
  parsed.slice(1).forEach((values, offset) => {
    const rowNumber = offset + 2
    const sourceDate = isoDate(values[indexes.date] ?? '')
    const sourceExerciseName = (values[indexes.exercise] ?? '').trim().replace(/\s+/g, ' ')
    const sourceSessionName = indexes.session >= 0 ? (values[indexes.session] ?? '').trim().replace(/\s+/g, ' ') : ''
    const sourceLoad = Number((values[indexes.load] ?? '').trim())
    const reps = Number((values[indexes.reps] ?? '').trim())
    const rawRir = indexes.rir >= 0 ? (values[indexes.rir] ?? '').trim() : ''
    const rirKnown = rawRir !== ''
    const rir = rirKnown ? Number(rawRir) : 0
    if (!sourceDate) errors.push(`Row ${rowNumber}: date must use YYYY-MM-DD or an ISO date and time.`)
    if (!sourceExerciseName) errors.push(`Row ${rowNumber}: exercise is required.`)
    if (!Number.isFinite(sourceLoad) || sourceLoad < 0) errors.push(`Row ${rowNumber}: load must be zero or greater.`)
    if (!Number.isInteger(reps) || reps < 1 || reps > 1000) errors.push(`Row ${rowNumber}: reps must be a whole number from 1 to 1000.`)
    if (!Number.isFinite(rir) || rir < 0 || rir > 10) errors.push(`Row ${rowNumber}: RIR must be blank or a number from 0 to 10.`)
    if (!sourceDate || !sourceExerciseName || !Number.isFinite(sourceLoad) || sourceLoad < 0 || !Number.isInteger(reps) || reps < 1 || reps > 1000 || !Number.isFinite(rir) || rir < 0 || rir > 10) return
    const row: TrainingHistoryImportRow = {
      rowNumber,
      sourceDate,
      sourceExerciseName,
      sourceSessionName,
      sourceLoad,
      sourceUnits: input.sourceUnits,
      normalizedLoad: convertedLoad(sourceLoad, input.sourceUnits, input.appUnits),
      reps,
      rir,
      rirKnown,
      fingerprint: ''
    }
    const baseFingerprint = fingerprintFor(row)
    const occurrence = (fingerprintOccurrences.get(baseFingerprint) ?? 0) + 1
    fingerprintOccurrences.set(baseFingerprint, occurrence)
    row.fingerprint = `${baseFingerprint}|occurrence:${occurrence}`
    rows.push(row)
  })

  const activeExercises = input.exercises.filter((exercise) => !exercise.retired)
  const mappingNames = [...new Set(rows.map((row) => row.sourceExerciseName))]
  const mappings = mappingNames.map((sourceExerciseName): TrainingHistoryImportMapping => {
    const candidates = duplicateCandidates(sourceExerciseName, activeExercises)
    const exact = candidates.filter((candidate) => candidate.score === 1)
    const exactExerciseId = exact.length === 1 ? exact[0].exercise.id : null
    return {
      sourceExerciseName,
      rowCount: rows.filter((row) => row.sourceExerciseName === sourceExerciseName).length,
      status: exactExerciseId ? 'exact' : candidates.length ? 'review' : 'unmatched',
      exactExerciseId,
      suggestedExerciseId: exactExerciseId ?? candidates[0]?.exercise.id ?? null,
      suggestedScore: exactExerciseId ? 1 : candidates[0]?.score ?? null
    }
  })
  const existingFingerprints = new Set((input.existingHistory ?? []).flatMap((workSet) => workSet.importFingerprint ?? []))
  const duplicateFingerprints = rows.filter((row) => existingFingerprints.has(row.fingerprint)).map((row) => row.fingerprint)
  const dates = rows.map((row) => row.sourceDate).sort()
  return {
    sourceName: input.sourceName,
    sourceUnits: input.sourceUnits,
    appUnits: input.appUnits,
    rows,
    mappings,
    errors,
    duplicateFingerprints,
    earliestDate: dates[0] ?? null,
    latestDate: dates.at(-1) ?? null,
    convertedLoads: rows.filter((row) => row.sourceUnits !== input.appUnits && row.sourceLoad !== 0).length
  }
}

export function buildTrainingHistoryImport(input: {
  preview: TrainingHistoryImportPreview
  exerciseMappings: Record<string, string>
  exercises: Exercise[]
  existingHistory: CompletedSetRecord[]
  batchId: string
}): TrainingHistoryImportProjection {
  if (input.preview.errors.length) throw new Error('Fix every invalid CSV row before importing.')
  const activeById = new Map(input.exercises.filter((exercise) => !exercise.retired).map((exercise) => [exercise.id, exercise]))
  const existingFingerprints = new Set(input.existingHistory.flatMap((workSet) => workSet.importFingerprint ?? []))
  const unresolved = input.preview.mappings.filter((mapping) => !activeById.has(input.exerciseMappings[mapping.sourceExerciseName]))
  if (unresolved.length) throw new Error(`Choose one canonical movement for: ${unresolved.map((mapping) => mapping.sourceExerciseName).join(', ')}.`)

  const setCounters = new Map<string, number>()
  const records = input.preview.rows.flatMap((row) => {
    if (existingFingerprints.has(row.fingerprint)) return []
    const exercise = activeById.get(input.exerciseMappings[row.sourceExerciseName])!
    const day = row.sourceDate.slice(0, 10)
    const sessionIdentity = normalizedIdentity(row.sourceSessionName) || 'workout'
    const sessionId = `import-session-${input.batchId}-${day}-${sessionIdentity}`
    const counterKey = `${sessionId}|${exercise.id}`
    const setIndex = setCounters.get(counterKey) ?? 0
    setCounters.set(counterKey, setIndex + 1)
    return [{
      id: `import-set-${input.batchId}-${row.rowNumber}`,
      sessionId,
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      family: exercise.family,
      primaryRegion: exercise.primaryRegion,
      completedAt: row.sourceDate,
      reps: row.reps,
      load: row.normalizedLoad,
      rir: row.rir,
      rirKnown: row.rirKnown,
      technique: 0,
      pain: 0,
      qualityConfirmed: false,
      setIndex,
      originalExerciseName: row.sourceExerciseName,
      importBatchId: input.batchId,
      importRow: row.rowNumber,
      importSourceName: input.preview.sourceName,
      importFingerprint: row.fingerprint,
      importUnits: row.sourceUnits
    } satisfies CompletedSetRecord]
  })
  return { records, skippedDuplicates: input.preview.rows.length - records.length }
}
