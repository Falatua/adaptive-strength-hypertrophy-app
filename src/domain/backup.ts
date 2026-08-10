import type {
  AppSettings,
  AthleteProfile,
  CompletedSetRecord,
  CycleReviewEvent,
  Exercise,
  HistoryMutationEvent,
  MesocyclePlan,
  PersonalRecord,
  SurveyRecord,
  TrainingSession
} from './types'
import { derivePersonalRecords } from './history-engine'

export const BACKUP_FORMAT = 'forgepath-backup'
export const BACKUP_SCHEMA_VERSION = 6
export const BACKUP_APP_VERSION = '0.6.0'

const settingsDefaults: Pick<AppSettings, 'celebrationLevel' | 'opportunityPrompts' | 'sessionAchievements' | 'confetti' | 'quietMode'> = {
  celebrationLevel: 'subtle',
  opportunityPrompts: true,
  sessionAchievements: true,
  confetti: false,
  quietMode: false
}

export interface RestorableAppState {
  athlete: AthleteProfile
  settings: AppSettings
  exercises: Exercise[]
  sessions: TrainingSession[]
  history: CompletedSetRecord[]
  surveys: SurveyRecord[]
  records: PersonalRecord[]
  historyMutations: HistoryMutationEvent[]
  cycleReviews: CycleReviewEvent[]
  mesocycles: MesocyclePlan[]
  activeMesocycleId: string | null
  activeSessionId: string | null
  onboardingComplete: boolean
}

export interface ForgePathBackup {
  format: typeof BACKUP_FORMAT
  schemaVersion: typeof BACKUP_SCHEMA_VERSION
  appVersion: string
  exportedAt: string
  data: RestorableAppState
  integrity: {
    algorithm: 'fnv1a32'
    value: string
  }
}

export interface BackupPreview {
  backup: ForgePathBackup
  warnings: string[]
  summary: {
    exercises: number
    sessions: number
    completedSets: number
    surveys: number
    records: number
    planVersions: number
    historyChanges: number
    cycleReviews: number
    athleteName: string
    exportedAt: string
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const normalizeSettings = (settings: unknown): AppSettings => ({
  ...settingsDefaults,
  ...(isRecord(settings) ? settings : {})
}) as AppSettings

const replayHistoryMutationRecords = (events: unknown): HistoryMutationEvent[] => Array.isArray(events)
  ? events.map((event) => {
    if (!isRecord(event) || !isRecord(event.before) || !isRecord(event.after) || !Array.isArray(event.before.history) || !Array.isArray(event.after.history)) return event as unknown as HistoryMutationEvent
    return {
      ...event,
      recordsBefore: derivePersonalRecords(event.before.history as CompletedSetRecord[]),
      recordsAfter: derivePersonalRecords(event.after.history as CompletedSetRecord[])
    } as HistoryMutationEvent
  })
  : []

const isFiniteNonNegative = (value: unknown) =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0

const isValidDate = (value: unknown) =>
  typeof value === 'string' && !Number.isNaN(new Date(value).getTime())

const stableStringify = (value: unknown): string => {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`
  if (isRecord(value)) {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}}`
  }
  return JSON.stringify(value)
}

export const fnv1a32 = (value: string) => {
  let hash = 0x811c9dc5
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 0x01000193)
  }
  return (hash >>> 0).toString(16).padStart(8, '0')
}

const integrityFor = (data: RestorableAppState) => fnv1a32(stableStringify(data))

export function createBackup(data: RestorableAppState, exportedAt = new Date().toISOString()): ForgePathBackup {
  return {
    format: BACKUP_FORMAT,
    schemaVersion: BACKUP_SCHEMA_VERSION,
    appVersion: BACKUP_APP_VERSION,
    exportedAt,
    data: structuredClone(data),
    integrity: { algorithm: 'fnv1a32', value: integrityFor(data) }
  }
}

function requireUniqueIds(values: unknown[], label: string, errors: string[]) {
  const ids = values.flatMap((value) => isRecord(value) && typeof value.id === 'string' ? [value.id] : [])
  if (ids.length !== values.length) errors.push(`${label} must all have string IDs.`)
  if (new Set(ids).size !== ids.length) errors.push(`${label} contain duplicate IDs.`)
}

function validateState(candidate: unknown): asserts candidate is RestorableAppState {
  if (!isRecord(candidate)) throw new Error('Backup data is missing or invalid.')
  const errors: string[] = []
  const arrays = ['exercises', 'sessions', 'history', 'surveys', 'records', 'mesocycles', 'historyMutations', 'cycleReviews'] as const
  arrays.forEach((key) => {
    if (!Array.isArray(candidate[key])) errors.push(`${key} must be an array.`)
    else if (candidate[key].length > 500_000) errors.push(`${key} exceeds the private-alpha restore limit.`)
  })
  if (!isRecord(candidate.athlete)) errors.push('Athlete profile is missing.')
  if (!isRecord(candidate.settings)) errors.push('Settings are missing.')
  if (typeof candidate.onboardingComplete !== 'boolean') errors.push('Onboarding state is invalid.')
  if (!(candidate.activeSessionId === null || typeof candidate.activeSessionId === 'string')) errors.push('Active session ID is invalid.')
  if (!(candidate.activeMesocycleId === null || typeof candidate.activeMesocycleId === 'string')) errors.push('Active mesocycle ID is invalid.')
  if (errors.length) throw new Error(errors.join(' '))

  const exercises = candidate.exercises as unknown[]
  const sessions = candidate.sessions as unknown[]
  const history = candidate.history as unknown[]
  const surveys = candidate.surveys as unknown[]
  const records = candidate.records as unknown[]
  const mesocycles = candidate.mesocycles as unknown[]
  const historyMutations = candidate.historyMutations as unknown[]
  const cycleReviews = candidate.cycleReviews as unknown[]
  requireUniqueIds(exercises, 'Exercises', errors)
  requireUniqueIds(sessions, 'Sessions', errors)
  requireUniqueIds(history, 'Completed sets', errors)
  requireUniqueIds(surveys, 'Surveys', errors)
  requireUniqueIds(records, 'Records', errors)
  requireUniqueIds(mesocycles, 'Mesocycles', errors)
  requireUniqueIds(historyMutations, 'History changes', errors)
  requireUniqueIds(cycleReviews, 'Cycle reviews', errors)

  const exerciseIds = new Set(exercises.flatMap((exercise) => isRecord(exercise) && typeof exercise.id === 'string' ? [exercise.id] : []))
  const sessionIds = new Set(sessions.flatMap((session) => isRecord(session) && typeof session.id === 'string' ? [session.id] : []))
  const mesocycleIds = new Set(mesocycles.flatMap((plan) => isRecord(plan) && typeof plan.id === 'string' ? [plan.id] : []))
  const completedSetIds = new Set(history.flatMap((workSet) => isRecord(workSet) && typeof workSet.id === 'string' ? [workSet.id] : []))

  exercises.forEach((exercise) => {
    if (!isRecord(exercise) || typeof exercise.name !== 'string' || !Array.isArray(exercise.aliases) || !Array.isArray(exercise.equipment)) {
      errors.push('An exercise is missing required identity fields.')
    }
  })

  history.forEach((workSet) => {
    if (!isRecord(workSet)) {
      errors.push('A completed set is invalid.')
      return
    }
    if (typeof workSet.exerciseId !== 'string' || !exerciseIds.has(workSet.exerciseId)) errors.push('A completed set references an unknown exercise.')
    if (typeof workSet.sessionId !== 'string') errors.push('A completed set is missing its session reference.')
    if (!isValidDate(workSet.completedAt)) errors.push('A completed set has an invalid date.')
    if (!isFiniteNonNegative(workSet.reps) || !isFiniteNonNegative(workSet.load) || !isFiniteNonNegative(workSet.rir)) errors.push('A completed set has invalid numeric training data.')
    if (workSet.qualityConfirmed !== undefined && typeof workSet.qualityConfirmed !== 'boolean') errors.push('A completed set has an invalid quality-confirmation state.')
  })

  sessions.forEach((session) => {
    if (!isRecord(session) || !Array.isArray(session.exercises) || typeof session.title !== 'string') {
      errors.push('A training session is invalid.')
      return
    }
    session.exercises.forEach((planned) => {
      if (!isRecord(planned) || typeof planned.exerciseId !== 'string' || !exerciseIds.has(planned.exerciseId) || !Array.isArray(planned.sets)) {
        errors.push('A planned exercise references an unknown exercise or invalid sets.')
        return
      }
      planned.sets.forEach((workSet) => {
        if (!isRecord(workSet) || !isFiniteNonNegative(workSet.targetLoad) || !isFiniteNonNegative(workSet.targetReps)) errors.push('A planned set has invalid targets.')
      })
    })
  })

  surveys.forEach((survey) => {
    if (!isRecord(survey) || typeof survey.sessionId !== 'string' || !Array.isArray(survey.answers) || !isValidDate(survey.completedAt)) errors.push('A survey record is invalid.')
  })

  const settings = candidate.settings as Record<string, unknown>
  if (!['off', 'subtle', 'normal', 'high-energy'].includes(String(settings.celebrationLevel)) || typeof settings.opportunityPrompts !== 'boolean' || typeof settings.sessionAchievements !== 'boolean' || typeof settings.confetti !== 'boolean' || typeof settings.quietMode !== 'boolean') errors.push('Gamification settings are invalid.')

  records.forEach((record) => {
    const exactExercise = isRecord(record) && typeof record.exerciseId === 'string' && exerciseIds.has(record.exerciseId)
    const wholeWorkout = isRecord(record) && record.exerciseId === null && record.type === 'workout-session-volume'
    if (!isRecord(record) || !(exactExercise || wholeWorkout) || typeof record.exerciseName !== 'string' || !['absolute-load', 'reps-at-load', 'load-for-reps', 'set-scheme', 'estimated-strength', 'exercise-session-volume', 'workout-session-volume'].includes(String(record.type)) || !['strength', 'repetition', 'scheme', 'workload'].includes(String(record.category)) || record.scope !== 'all-time' || !isFiniteNonNegative(record.value) || !isValidDate(record.achievedAt) || typeof record.sourceSessionId !== 'string' || !Array.isArray(record.sourceSetIds) || record.sourceSetIds.length === 0 || record.sourceSetIds.some((id) => typeof id !== 'string' || !completedSetIds.has(id)) || !isRecord(record.context) || !['validated', 'numeric-only'].includes(String(record.validation)) || record.ruleVersion !== 'pr-v2') errors.push('A personal record is invalid or lacks completed source sets.')
  })
  if (stableStringify(records) !== stableStringify(derivePersonalRecords(history as CompletedSetRecord[]))) errors.push('Personal records do not match the completed source sets.')

  historyMutations.forEach((event) => {
    if (!isRecord(event) || !['set-corrected', 'set-deleted', 'exercise-merged'].includes(String(event.type)) || !isValidDate(event.createdAt) || typeof event.reason !== 'string' || !Array.isArray(event.affectedSetIds) || !isRecord(event.before) || !isRecord(event.after) || !Array.isArray(event.recordsBefore) || !Array.isArray(event.recordsAfter) || !isFiniteNonNegative(event.volumeBefore) || !isFiniteNonNegative(event.volumeAfter)) errors.push('A history change is invalid.')
    if (isRecord(event) && event.undoneAt !== undefined && !isValidDate(event.undoneAt)) errors.push('A history change has an invalid undo date.')
    if (isRecord(event) && isRecord(event.before) && isRecord(event.after) && Array.isArray(event.before.history) && Array.isArray(event.after.history) && (stableStringify(event.recordsBefore) !== stableStringify(derivePersonalRecords(event.before.history as CompletedSetRecord[])) || stableStringify(event.recordsAfter) !== stableStringify(derivePersonalRecords(event.after.history as CompletedSetRecord[])))) errors.push('A history change record projection does not match its source snapshots.')
  })

  cycleReviews.forEach((review) => {
    if (!isRecord(review) || typeof review.mesocycleId !== 'string' || !mesocycleIds.has(review.mesocycleId) || !isFiniteNonNegative(review.planVersion) || !isFiniteNonNegative(review.microcycleNumber) || !['continue-progress', 'continue-hold', 'extend', 'recover', 'complete'].includes(String(review.decision)) || !['continue-progress', 'continue-hold', 'extend', 'recover', 'complete'].includes(String(review.recommendation)) || !isValidDate(review.createdAt) || typeof review.reason !== 'string' || !Array.isArray(review.recommendationReasons) || !isRecord(review.evidence) || !Array.isArray(review.generatedSessionIds) || !Array.isArray(review.expiredSessionIds) || [...(review.generatedSessionIds as unknown[]), ...(review.expiredSessionIds as unknown[])].some((id) => typeof id !== 'string' || !sessionIds.has(id))) errors.push('A cycle review is invalid.')
  })

  mesocycles.forEach((plan) => {
    if (!isRecord(plan) || typeof plan.title !== 'string' || !isFiniteNonNegative(plan.version) || !Array.isArray(plan.sessionIds) || !Array.isArray(plan.strengthAnchors)) {
      errors.push('A mesocycle plan is invalid.')
      return
    }
    if (!isValidDate(plan.createdAt) || !isValidDate(plan.effectiveAt)) errors.push('A mesocycle plan has an invalid date.')
    plan.strengthAnchors.forEach((exerciseId) => {
      if (typeof exerciseId !== 'string' || !exerciseIds.has(exerciseId)) errors.push('A mesocycle references an unknown strength anchor.')
    })
    plan.sessionIds.forEach((sessionId) => {
      if (typeof sessionId !== 'string' || (plan.status === 'active' && !sessionIds.has(sessionId))) errors.push('An active mesocycle references an unknown session.')
    })
  })

  const activeSessionId = candidate.activeSessionId
  if (typeof activeSessionId === 'string' && !sessionIds.has(activeSessionId)) errors.push('The active workout references a session that is not present.')
  const activeMesocycleId = candidate.activeMesocycleId
  if (typeof activeMesocycleId === 'string' && !mesocycleIds.has(activeMesocycleId)) errors.push('The active mesocycle is not present.')
  if (typeof activeMesocycleId === 'string') {
    const activePlan = mesocycles.find((plan) => isRecord(plan) && plan.id === activeMesocycleId)
    if (isRecord(activePlan) && activePlan.status !== 'active') errors.push('The active mesocycle pointer does not reference an active plan.')
  }
  if (mesocycles.filter((plan) => isRecord(plan) && plan.status === 'active').length > 1) errors.push('More than one mesocycle is marked active.')
  if (errors.length) throw new Error([...new Set(errors)].join(' '))
}

function migrateLegacyV1(candidate: Record<string, unknown>): { data: RestorableAppState; exportedAt: string; warning: string } {
  const legacyExportedAt = candidate.exportedAt
  const data = {
    athlete: candidate.athlete,
    settings: normalizeSettings(candidate.settings),
    exercises: candidate.exercises,
    sessions: candidate.sessions,
    history: candidate.history,
    surveys: Array.isArray(candidate.surveys) ? candidate.surveys : [],
    records: derivePersonalRecords((candidate.history as CompletedSetRecord[]) ?? []),
    mesocycles: [],
    historyMutations: [],
    cycleReviews: [],
    activeMesocycleId: null,
    activeSessionId: typeof candidate.activeSessionId === 'string' ? candidate.activeSessionId : null,
    onboardingComplete: typeof candidate.onboardingComplete === 'boolean' ? candidate.onboardingComplete : true
  }
  validateState(data)
  return {
    data,
    exportedAt: typeof legacyExportedAt === 'string' && isValidDate(legacyExportedAt) ? legacyExportedAt : new Date().toISOString(),
    warning: 'Legacy version 1 export migrated to the current version. Survey history may be incomplete.'
  }
}

function migrateV2(candidate: Record<string, unknown>): { data: RestorableAppState; exportedAt: string; warning: string } {
  if (!isRecord(candidate.data)) throw new Error('Backup data is missing or invalid.')
  if (!isRecord(candidate.integrity) || candidate.integrity.algorithm !== 'fnv1a32' || typeof candidate.integrity.value !== 'string') {
    throw new Error('Backup integrity information is missing.')
  }
  if (candidate.integrity.value !== fnv1a32(stableStringify(candidate.data))) throw new Error('Backup integrity check failed. The file may be incomplete or edited.')
  const data = {
    ...candidate.data,
    settings: normalizeSettings(candidate.data.settings),
    mesocycles: [],
    activeMesocycleId: null,
    historyMutations: [],
    cycleReviews: [],
    records: derivePersonalRecords((candidate.data.history as CompletedSetRecord[]) ?? [])
  }
  validateState(data)
  return {
    data,
    exportedAt: typeof candidate.exportedAt === 'string' && isValidDate(candidate.exportedAt) ? candidate.exportedAt : new Date().toISOString(),
    warning: 'Version 2 backup migrated safely. Training history is intact; create a mesocycle to begin versioned planning.'
  }
}

function migrateV3(candidate: Record<string, unknown>): { data: RestorableAppState; exportedAt: string; warning: string } {
  if (!isRecord(candidate.data)) throw new Error('Backup data is missing or invalid.')
  if (!isRecord(candidate.integrity) || candidate.integrity.algorithm !== 'fnv1a32' || typeof candidate.integrity.value !== 'string') throw new Error('Backup integrity information is missing.')
  if (candidate.integrity.value !== fnv1a32(stableStringify(candidate.data))) throw new Error('Backup integrity check failed. The file may be incomplete or edited.')
  const data = {
    ...candidate.data,
    settings: normalizeSettings(candidate.data.settings),
    historyMutations: [],
    cycleReviews: [],
    records: derivePersonalRecords((candidate.data.history as CompletedSetRecord[]) ?? [])
  }
  validateState(data)
  return {
    data,
    exportedAt: typeof candidate.exportedAt === 'string' && isValidDate(candidate.exportedAt) ? candidate.exportedAt : new Date().toISOString(),
    warning: 'Version 3 backup migrated safely. Records were replayed from completed source sets and the correction ledger starts empty.'
  }
}

function migrateV4(candidate: Record<string, unknown>): { data: RestorableAppState; exportedAt: string; warning: string } {
  if (!isRecord(candidate.data)) throw new Error('Backup data is missing or invalid.')
  if (!isRecord(candidate.integrity) || candidate.integrity.algorithm !== 'fnv1a32' || typeof candidate.integrity.value !== 'string') throw new Error('Backup integrity information is missing.')
  if (candidate.integrity.value !== fnv1a32(stableStringify(candidate.data))) throw new Error('Backup integrity check failed. The file may be incomplete or edited.')
  const data = {
    ...candidate.data,
    settings: normalizeSettings(candidate.data.settings),
    historyMutations: replayHistoryMutationRecords(candidate.data.historyMutations),
    cycleReviews: [],
    records: derivePersonalRecords((candidate.data.history as CompletedSetRecord[]) ?? [])
  }
  validateState(data)
  return {
    data,
    exportedAt: typeof candidate.exportedAt === 'string' && isValidDate(candidate.exportedAt) ? candidate.exportedAt : new Date().toISOString(),
    warning: 'Version 4 backup migrated safely. Existing plan and correction history are intact; the cycle-review ledger starts empty.'
  }
}

function migrateV5(candidate: Record<string, unknown>): { data: RestorableAppState; exportedAt: string; warning: string } {
  if (!isRecord(candidate.data)) throw new Error('Backup data is missing or invalid.')
  if (!isRecord(candidate.integrity) || candidate.integrity.algorithm !== 'fnv1a32' || typeof candidate.integrity.value !== 'string') throw new Error('Backup integrity information is missing.')
  if (candidate.integrity.value !== fnv1a32(stableStringify(candidate.data))) throw new Error('Backup integrity check failed. The file may be incomplete or edited.')
  const data = {
    ...candidate.data,
    settings: normalizeSettings(candidate.data.settings),
    historyMutations: replayHistoryMutationRecords(candidate.data.historyMutations),
    records: derivePersonalRecords((candidate.data.history as CompletedSetRecord[]) ?? [])
  }
  validateState(data)
  return {
    data,
    exportedAt: typeof candidate.exportedAt === 'string' && isValidDate(candidate.exportedAt) ? candidate.exportedAt : new Date().toISOString(),
    warning: 'Version 5 backup migrated safely. Completed source sets were replayed through expanded record definitions and celebration controls use quiet defaults.'
  }
}

export function parseBackup(raw: string): BackupPreview {
  let candidate: unknown
  try {
    candidate = JSON.parse(raw)
  } catch {
    throw new Error('This file is not valid JSON.')
  }
  if (!isRecord(candidate)) throw new Error('This file is not a ForgePath backup.')

  const warnings: string[] = []
  let backup: ForgePathBackup
  if (candidate.format === BACKUP_FORMAT && candidate.schemaVersion === BACKUP_SCHEMA_VERSION) {
    if (!isRecord(candidate.integrity) || candidate.integrity.algorithm !== 'fnv1a32' || typeof candidate.integrity.value !== 'string') {
      throw new Error('Backup integrity information is missing.')
    }
    if (candidate.integrity.value !== fnv1a32(stableStringify(candidate.data))) throw new Error('Backup integrity check failed. The file may be incomplete or edited.')
    validateState(candidate.data)
    if (!isValidDate(candidate.exportedAt)) throw new Error('Backup export date is invalid.')
    backup = candidate as unknown as ForgePathBackup
  } else if (candidate.format === BACKUP_FORMAT && candidate.schemaVersion === 2) {
    const migrated = migrateV2(candidate)
    warnings.push(migrated.warning)
    backup = createBackup(migrated.data, migrated.exportedAt)
  } else if (candidate.format === BACKUP_FORMAT && candidate.schemaVersion === 3) {
    const migrated = migrateV3(candidate)
    warnings.push(migrated.warning)
    backup = createBackup(migrated.data, migrated.exportedAt)
  } else if (candidate.format === BACKUP_FORMAT && candidate.schemaVersion === 4) {
    const migrated = migrateV4(candidate)
    warnings.push(migrated.warning)
    backup = createBackup(migrated.data, migrated.exportedAt)
  } else if (candidate.format === BACKUP_FORMAT && candidate.schemaVersion === 5) {
    const migrated = migrateV5(candidate)
    warnings.push(migrated.warning)
    backup = createBackup(migrated.data, migrated.exportedAt)
  } else if (candidate.version === 1) {
    const migrated = migrateLegacyV1(candidate)
    warnings.push(migrated.warning)
    backup = createBackup(migrated.data, migrated.exportedAt)
  } else {
    throw new Error('Unsupported backup format or schema version.')
  }

  return {
    backup,
    warnings,
    summary: {
      exercises: backup.data.exercises.length,
      sessions: backup.data.sessions.length,
      completedSets: backup.data.history.length,
      surveys: backup.data.surveys.length,
      records: backup.data.records.length,
      planVersions: backup.data.mesocycles.length,
      historyChanges: backup.data.historyMutations.length,
      cycleReviews: backup.data.cycleReviews.length,
      athleteName: backup.data.athlete.name,
      exportedAt: backup.exportedAt
    }
  }
}

export function backupStateFrom(source: RestorableAppState): RestorableAppState {
  return {
    athlete: structuredClone(source.athlete),
    settings: structuredClone(source.settings),
    exercises: structuredClone(source.exercises),
    sessions: structuredClone(source.sessions),
    history: structuredClone(source.history),
    surveys: structuredClone(source.surveys),
    records: structuredClone(source.records),
    historyMutations: structuredClone(source.historyMutations),
    cycleReviews: structuredClone(source.cycleReviews),
    mesocycles: structuredClone(source.mesocycles),
    activeMesocycleId: source.activeMesocycleId,
    activeSessionId: source.activeSessionId,
    onboardingComplete: source.onboardingComplete
  }
}
