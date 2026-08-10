import type {
  AppSettings,
  AthleteProfile,
  CompletedSetRecord,
  CycleReviewEvent,
  DeferredFeedbackRequest,
  Exercise,
  ExerciseSubstitutionEvent,
  HistoryMutationEvent,
  MesocyclePlan,
  PersonalRecord,
  SurveyRecord,
  TrainingSession
} from './types'
import { derivePersonalRecords } from './history-engine'
import { summarizeSurveyEvidence } from './survey-engine'
import { exerciseMuscleMappingError } from './muscle-dose'

export const BACKUP_FORMAT = 'forgepath-backup'
export const BACKUP_SCHEMA_VERSION = 10
export const BACKUP_APP_VERSION = '0.16.0'

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
  deferredFeedback: DeferredFeedbackRequest[]
  records: PersonalRecord[]
  historyMutations: HistoryMutationEvent[]
  cycleReviews: CycleReviewEvent[]
  substitutionEvents: ExerciseSubstitutionEvent[]
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
    deferredFeedback: number
    records: number
    planVersions: number
    historyChanges: number
    cycleReviews: number
    substitutions: number
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
  const arrays = ['exercises', 'sessions', 'history', 'surveys', 'deferredFeedback', 'records', 'mesocycles', 'historyMutations', 'cycleReviews', 'substitutionEvents'] as const
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
  const deferredFeedback = candidate.deferredFeedback as unknown[]
  const records = candidate.records as unknown[]
  const mesocycles = candidate.mesocycles as unknown[]
  const historyMutations = candidate.historyMutations as unknown[]
  const cycleReviews = candidate.cycleReviews as unknown[]
  const substitutionEvents = candidate.substitutionEvents as unknown[]
  requireUniqueIds(exercises, 'Exercises', errors)
  requireUniqueIds(sessions, 'Sessions', errors)
  requireUniqueIds(history, 'Completed sets', errors)
  requireUniqueIds(surveys, 'Surveys', errors)
  requireUniqueIds(deferredFeedback, 'Deferred feedback requests', errors)
  requireUniqueIds(records, 'Records', errors)
  requireUniqueIds(mesocycles, 'Mesocycles', errors)
  requireUniqueIds(historyMutations, 'History changes', errors)
  requireUniqueIds(cycleReviews, 'Cycle reviews', errors)
  requireUniqueIds(substitutionEvents, 'Substitution events', errors)

  const exerciseIds = new Set(exercises.flatMap((exercise) => isRecord(exercise) && typeof exercise.id === 'string' ? [exercise.id] : []))
  const sessionIds = new Set(sessions.flatMap((session) => isRecord(session) && typeof session.id === 'string' ? [session.id] : []))
  const mesocycleIds = new Set(mesocycles.flatMap((plan) => isRecord(plan) && typeof plan.id === 'string' ? [plan.id] : []))
  const completedSetIds = new Set(history.flatMap((workSet) => isRecord(workSet) && typeof workSet.id === 'string' ? [workSet.id] : []))
  const surveyIds = new Set(surveys.flatMap((survey) => isRecord(survey) && typeof survey.id === 'string' ? [survey.id] : []))
  const substitutionEventIds = new Set(substitutionEvents.flatMap((event) => isRecord(event) && typeof event.id === 'string' ? [event.id] : []))

  exercises.forEach((exercise) => {
    if (!isRecord(exercise) || typeof exercise.name !== 'string' || !Array.isArray(exercise.aliases) || !Array.isArray(exercise.equipment)) {
      errors.push('An exercise is missing required identity fields.')
      return
    }
    if (exercise.muscleMapping !== undefined && exercise.custom !== true) errors.push('Only a custom exercise can store an athlete-reviewed muscle mapping.')
    if (exercise.muscleMapping !== undefined) {
      const mappingError = exerciseMuscleMappingError(exercise.muscleMapping)
      if (mappingError) errors.push(`An exercise has an invalid muscle mapping: ${mappingError}`)
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
    if (workSet.rirKnown !== undefined && typeof workSet.rirKnown !== 'boolean') errors.push('A completed set has an invalid RIR missingness state.')
    const hasImportMetadata = ['importBatchId', 'importRow', 'importSourceName', 'importFingerprint', 'importUnits'].some((key) => workSet[key] !== undefined)
    if (hasImportMetadata && (typeof workSet.importBatchId !== 'string' || !Number.isInteger(workSet.importRow) || Number(workSet.importRow) < 2 || typeof workSet.importSourceName !== 'string' || typeof workSet.importFingerprint !== 'string' || !['lb', 'kg'].includes(String(workSet.importUnits)))) errors.push('An imported completed set has incomplete source provenance.')
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
      if (planned.substitutionEventId !== undefined && (typeof planned.substitutionEventId !== 'string' || !substitutionEventIds.has(planned.substitutionEventId))) errors.push('A planned exercise references an unknown substitution event.')
      planned.sets.forEach((workSet) => {
        if (!isRecord(workSet) || !isFiniteNonNegative(workSet.targetLoad) || !isFiniteNonNegative(workSet.targetReps)) errors.push('A planned set has invalid targets.')
      })
    })
  })

  surveys.forEach((survey) => {
    if (!isRecord(survey) || typeof survey.sessionId !== 'string' || !sessionIds.has(survey.sessionId) || !['pre', 'post'].includes(String(survey.type)) || typeof survey.skipped !== 'boolean' || !Array.isArray(survey.answers) || !isValidDate(survey.completedAt)) errors.push('A survey record is invalid.')
    if (isRecord(survey) && Array.isArray(survey.answers) && survey.answers.some((answer) => !isRecord(answer) || typeof answer.id !== 'string' || !['answered', 'skipped', 'not-sure', 'prefer-not', 'not-answered'].includes(String(answer.status)) || (answer.status === 'answered' ? !(typeof answer.value === 'number' || typeof answer.value === 'string') : answer.value !== null))) errors.push('A survey answer has invalid missing-data semantics.')
    if (isRecord(survey) && survey.mode !== undefined && !['full', 'quick', 'minimal', 'off'].includes(String(survey.mode))) errors.push('A survey record has an invalid effective mode.')
    if (isRecord(survey) && survey.answeredCount !== undefined && !isFiniteNonNegative(survey.answeredCount)) errors.push('A survey record has an invalid answered count.')
    if (isRecord(survey) && survey.unknownCount !== undefined && !isFiniteNonNegative(survey.unknownCount)) errors.push('A survey record has an invalid unknown count.')
    if (isRecord(survey) && survey.confidence !== undefined && !['low', 'medium', 'high'].includes(String(survey.confidence))) errors.push('A survey record has an invalid confidence state.')
    if (isRecord(survey) && Array.isArray(survey.answers) && typeof survey.skipped === 'boolean' && survey.answeredCount !== undefined && survey.unknownCount !== undefined && survey.confidence !== undefined) {
      const evidence = summarizeSurveyEvidence(survey.answers as SurveyRecord['answers'], survey.skipped)
      if (survey.answeredCount !== evidence.answeredCount || survey.unknownCount !== evidence.unknownCount || survey.confidence !== evidence.confidence) errors.push('A survey record does not reconcile with its answer evidence.')
    }
  })

  deferredFeedback.forEach((request) => {
    if (!isRecord(request) || typeof request.sessionId !== 'string' || !sessionIds.has(request.sessionId) || !['full', 'quick', 'minimal'].includes(String(request.mode)) || !['pending', 'completed', 'dismissed', 'expired'].includes(String(request.status)) || !isValidDate(request.createdAt) || !isValidDate(request.expiresAt)) {
      errors.push('A deferred feedback request is invalid.')
      return
    }
    if (new Date(String(request.expiresAt)).getTime() <= new Date(String(request.createdAt)).getTime()) errors.push('A deferred feedback request has an invalid expiry window.')
    if (request.status === 'pending' && (request.resolvedAt !== undefined || request.surveyId !== undefined)) errors.push('A pending feedback request cannot already be resolved.')
    if (request.status !== 'pending' && !isValidDate(request.resolvedAt)) errors.push('A resolved feedback request is missing its resolution date.')
    if (['completed', 'dismissed'].includes(String(request.status)) && (typeof request.surveyId !== 'string' || !surveyIds.has(request.surveyId))) errors.push('A resolved feedback request does not reference its post-session survey.')
    if (request.status === 'expired' && request.surveyId !== undefined) errors.push('An expired feedback request cannot invent a survey response.')
    if (typeof request.surveyId === 'string') {
      const survey = surveys.find((candidateSurvey) => isRecord(candidateSurvey) && candidateSurvey.id === request.surveyId)
      if (!isRecord(survey) || survey.sessionId !== request.sessionId || survey.type !== 'post') errors.push('A deferred feedback request references the wrong survey.')
      if (request.status === 'dismissed' && isRecord(survey) && survey.skipped !== true) errors.push('Dismissed deferred feedback must remain an explicitly skipped survey.')
    }
  })

  const settings = candidate.settings as Record<string, unknown>
  if (!['off', 'subtle', 'normal', 'high-energy'].includes(String(settings.celebrationLevel)) || typeof settings.opportunityPrompts !== 'boolean' || typeof settings.sessionAchievements !== 'boolean' || typeof settings.confetti !== 'boolean' || typeof settings.quietMode !== 'boolean') errors.push('Gamification settings are invalid.')
  if (!['full', 'quick', 'minimal', 'off', 'ask'].includes(String(settings.preSurveyMode)) || !['full', 'quick', 'minimal', 'off', 'ask'].includes(String(settings.postSurveyMode))) errors.push('Survey preferences are invalid.')

  records.forEach((record) => {
    const exactExercise = isRecord(record) && typeof record.exerciseId === 'string' && exerciseIds.has(record.exerciseId)
    const wholeWorkout = isRecord(record) && record.exerciseId === null && record.type === 'workout-session-volume'
    if (!isRecord(record) || !(exactExercise || wholeWorkout) || typeof record.exerciseName !== 'string' || !['absolute-load', 'reps-at-load', 'load-for-reps', 'set-scheme', 'estimated-strength', 'exercise-session-volume', 'workout-session-volume'].includes(String(record.type)) || !['strength', 'repetition', 'scheme', 'workload'].includes(String(record.category)) || record.scope !== 'all-time' || !isFiniteNonNegative(record.value) || !isValidDate(record.achievedAt) || typeof record.sourceSessionId !== 'string' || !Array.isArray(record.sourceSetIds) || record.sourceSetIds.length === 0 || record.sourceSetIds.some((id) => typeof id !== 'string' || !completedSetIds.has(id)) || !isRecord(record.context) || !['validated', 'numeric-only'].includes(String(record.validation)) || record.ruleVersion !== 'pr-v2') errors.push('A personal record is invalid or lacks completed source sets.')
  })
  if (stableStringify(records) !== stableStringify(derivePersonalRecords(history as CompletedSetRecord[]))) errors.push('Personal records do not match the completed source sets.')

  historyMutations.forEach((event) => {
    if (!isRecord(event) || !['set-corrected', 'set-deleted', 'exercise-merged', 'exercise-edited', 'history-imported'].includes(String(event.type)) || !isValidDate(event.createdAt) || typeof event.reason !== 'string' || !Array.isArray(event.affectedSetIds) || !isRecord(event.before) || !isRecord(event.after) || !Array.isArray(event.recordsBefore) || !Array.isArray(event.recordsAfter) || !isFiniteNonNegative(event.volumeBefore) || !isFiniteNonNegative(event.volumeAfter)) errors.push('A history change is invalid.')
    if (isRecord(event) && event.undoneAt !== undefined && !isValidDate(event.undoneAt)) errors.push('A history change has an invalid undo date.')
    if (isRecord(event) && isRecord(event.before) && isRecord(event.after) && Array.isArray(event.before.history) && Array.isArray(event.after.history) && (stableStringify(event.recordsBefore) !== stableStringify(derivePersonalRecords(event.before.history as CompletedSetRecord[])) || stableStringify(event.recordsAfter) !== stableStringify(derivePersonalRecords(event.after.history as CompletedSetRecord[])))) errors.push('A history change record projection does not match its source snapshots.')
    if (isRecord(event) && isRecord(event.before) && isRecord(event.after)) {
      ;[event.before.exercises, event.after.exercises].forEach((snapshotExercises) => {
        if (!Array.isArray(snapshotExercises)) return
        snapshotExercises.forEach((exercise) => {
          if (!isRecord(exercise) || exercise.muscleMapping === undefined) return
          if (exercise.custom !== true || exerciseMuscleMappingError(exercise.muscleMapping)) errors.push('A history change contains an invalid exercise muscle mapping snapshot.')
        })
      })
    }
  })

  cycleReviews.forEach((review) => {
    if (!isRecord(review) || typeof review.mesocycleId !== 'string' || !mesocycleIds.has(review.mesocycleId) || !isFiniteNonNegative(review.planVersion) || !isFiniteNonNegative(review.microcycleNumber) || !['continue-progress', 'continue-hold', 'extend', 'recover', 'complete'].includes(String(review.decision)) || !['continue-progress', 'continue-hold', 'extend', 'recover', 'complete'].includes(String(review.recommendation)) || !isValidDate(review.createdAt) || typeof review.reason !== 'string' || !Array.isArray(review.recommendationReasons) || !isRecord(review.evidence) || !Array.isArray(review.generatedSessionIds) || !Array.isArray(review.expiredSessionIds) || [...(review.generatedSessionIds as unknown[]), ...(review.expiredSessionIds as unknown[])].some((id) => typeof id !== 'string' || !sessionIds.has(id))) errors.push('A cycle review is invalid.')
  })

  substitutionEvents.forEach((event) => {
    if (!isRecord(event) || typeof event.sessionId !== 'string' || !sessionIds.has(event.sessionId) || typeof event.plannedExerciseId !== 'string' || typeof event.originalExerciseId !== 'string' || !exerciseIds.has(event.originalExerciseId) || typeof event.selectedExerciseId !== 'string' || !exerciseIds.has(event.selectedExerciseId) || !['primary', 'secondary', 'priority', 'maintenance', 'optional'].includes(String(event.role)) || !['none', 'pain', 'equipment', 'time', 'fatigue', 'target-feel', 'variety', 'preference', 'harder', 'easier', 'other'].includes(String(event.reason)) || !isValidDate(event.createdAt) || !Array.isArray(event.candidates) || event.candidates.length === 0 || event.candidates.some((candidate) => !isRecord(candidate) || typeof candidate.exerciseId !== 'string' || !exerciseIds.has(candidate.exerciseId) || !isFiniteNonNegative(candidate.rank) || !isFiniteNonNegative(candidate.score)) || !Array.isArray(event.originalPrescription) || !Array.isArray(event.replacementPrescription) || !['exact-history', 'baseline-calibration'].includes(String(event.prescriptionMethod)) || typeof event.prescriptionNote !== 'string' || !Array.isArray(event.sourceSetIds) || event.sourceSetIds.some((id) => typeof id !== 'string' || !completedSetIds.has(id)) || !['pending', 'completed', 'partial', 'not-completed'].includes(String(event.outcome)) || typeof event.primaryOverrideConfirmed !== 'boolean') errors.push('An exercise substitution event is invalid.')
    if (isRecord(event) && event.completedAt !== undefined && !isValidDate(event.completedAt)) errors.push('An exercise substitution has an invalid completion date.')
    if (isRecord(event) && (typeof event.purpose !== 'string' || !['normal', 'confirm', 'protect', 'reacclimate', 'pain-aware'].includes(String(event.readiness)) || !isFiniteNonNegative(event.availableMinutes) || typeof event.equipmentLocation !== 'string')) errors.push('An exercise substitution has invalid decision context.')
    if (isRecord(event) && Array.isArray(event.candidates) && event.candidates.some((candidate) => !isRecord(candidate) || !['best-match', 'good-alternative', 'changes-focus'].includes(String(candidate.tier)) || !Array.isArray(candidate.reasons) || candidate.reasons.some((reason) => typeof reason !== 'string') || typeof candidate.preserves !== 'string' || typeof candidate.changes !== 'string' || !(candidate.lastExposureAt === null || isValidDate(candidate.lastExposureAt)) || !isFiniteNonNegative(candidate.priorSetCount))) errors.push('An exercise substitution candidate snapshot is invalid.')
    if (isRecord(event) && [...(Array.isArray(event.originalPrescription) ? event.originalPrescription : []), ...(Array.isArray(event.replacementPrescription) ? event.replacementPrescription : [])].some((workSet) => !isRecord(workSet) || typeof workSet.id !== 'string' || !isFiniteNonNegative(workSet.targetLoad) || !isFiniteNonNegative(workSet.targetReps) || !isFiniteNonNegative(workSet.targetRir) || typeof workSet.completed !== 'boolean')) errors.push('An exercise substitution prescription is invalid.')
    if (isRecord(event) && event.postFeedback !== undefined) {
      const feedback = event.postFeedback
      if (!isRecord(feedback) || typeof feedback.skipped !== 'boolean' || ['difficulty', 'targetStimulus', 'technique', 'pain', 'enjoyment'].some((key) => feedback[key] !== null && !isFiniteNonNegative(feedback[key]))) errors.push('An exercise substitution has invalid feedback evidence.')
    }
    if (isRecord(event) && event.role === 'primary' && event.primaryOverrideConfirmed !== true) errors.push('A protected primary substitution lacks explicit confirmation.')
    if (isRecord(event) && typeof event.sessionId === 'string' && typeof event.plannedExerciseId === 'string') {
      const sourceSession = sessions.find((session) => isRecord(session) && session.id === event.sessionId)
      if (!isRecord(sourceSession) || !Array.isArray(sourceSession.exercises) || !sourceSession.exercises.some((planned) => isRecord(planned) && planned.id === event.plannedExerciseId)) errors.push('An exercise substitution references an unknown planned exercise slot.')
    }
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
    deferredFeedback: [],
    records: derivePersonalRecords((candidate.history as CompletedSetRecord[]) ?? []),
    mesocycles: [],
    historyMutations: [],
    cycleReviews: [],
    substitutionEvents: [],
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
    substitutionEvents: [],
    deferredFeedback: [],
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
    substitutionEvents: [],
    deferredFeedback: [],
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
    substitutionEvents: [],
    deferredFeedback: [],
    records: derivePersonalRecords((candidate.data.history as CompletedSetRecord[]) ?? [])
  }
  validateState(data)
  return {
    data,
    exportedAt: typeof candidate.exportedAt === 'string' && isValidDate(candidate.exportedAt) ? candidate.exportedAt : new Date().toISOString(),
    warning: 'Version 4 backup migrated safely. Existing plan and correction history are intact; the cycle-review ledger starts empty.'
  }
}

function migrateV6(candidate: Record<string, unknown>): { data: RestorableAppState; exportedAt: string; warning: string } {
  if (!isRecord(candidate.data)) throw new Error('Backup data is missing or invalid.')
  if (!isRecord(candidate.integrity) || candidate.integrity.algorithm !== 'fnv1a32' || typeof candidate.integrity.value !== 'string') throw new Error('Backup integrity information is missing.')
  if (candidate.integrity.value !== fnv1a32(stableStringify(candidate.data))) throw new Error('Backup integrity check failed. The file may be incomplete or edited.')
  const data = { ...candidate.data, substitutionEvents: [], deferredFeedback: [] }
  validateState(data)
  return {
    data,
    exportedAt: typeof candidate.exportedAt === 'string' && isValidDate(candidate.exportedAt) ? candidate.exportedAt : new Date().toISOString(),
    warning: 'Version 6 backup migrated safely. Existing records, preferences, plans, corrections, and cycle reviews are intact; the substitution-learning ledger starts empty.'
  }
}

function migrateV7(candidate: Record<string, unknown>): { data: RestorableAppState; exportedAt: string; warning: string } {
  if (!isRecord(candidate.data)) throw new Error('Backup data is missing or invalid.')
  if (!isRecord(candidate.integrity) || candidate.integrity.algorithm !== 'fnv1a32' || typeof candidate.integrity.value !== 'string') throw new Error('Backup integrity information is missing.')
  if (candidate.integrity.value !== fnv1a32(stableStringify(candidate.data))) throw new Error('Backup integrity check failed. The file may be incomplete or edited.')
  const data = { ...candidate.data, settings: normalizeSettings(candidate.data.settings), deferredFeedback: [] }
  validateState(data)
  return {
    data,
    exportedAt: typeof candidate.exportedAt === 'string' && isValidDate(candidate.exportedAt) ? candidate.exportedAt : new Date().toISOString(),
    warning: 'Version 7 backup migrated safely. Existing survey answers remain unchanged; new question-budget and confidence provenance begins with future check-ins.'
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
    substitutionEvents: [],
    deferredFeedback: [],
    records: derivePersonalRecords((candidate.data.history as CompletedSetRecord[]) ?? [])
  }
  validateState(data)
  return {
    data,
    exportedAt: typeof candidate.exportedAt === 'string' && isValidDate(candidate.exportedAt) ? candidate.exportedAt : new Date().toISOString(),
    warning: 'Version 5 backup migrated safely. Completed source sets were replayed through expanded record definitions and celebration controls use quiet defaults.'
  }
}

function migrateV8(candidate: Record<string, unknown>): { data: RestorableAppState; exportedAt: string; warning: string } {
  if (!isRecord(candidate.data)) throw new Error('Backup data is missing or invalid.')
  if (!isRecord(candidate.integrity) || candidate.integrity.algorithm !== 'fnv1a32' || typeof candidate.integrity.value !== 'string') throw new Error('Backup integrity information is missing.')
  if (candidate.integrity.value !== fnv1a32(stableStringify(candidate.data))) throw new Error('Backup integrity check failed. The file may be incomplete or edited.')
  const data = { ...candidate.data, settings: normalizeSettings(candidate.data.settings), deferredFeedback: [] }
  validateState(data)
  return {
    data,
    exportedAt: typeof candidate.exportedAt === 'string' && isValidDate(candidate.exportedAt) ? candidate.exportedAt : new Date().toISOString(),
    warning: 'Version 8 backup migrated safely. Existing workout and survey evidence is intact; the optional deferred-feedback ledger starts empty.'
  }
}

function migrateV9(candidate: Record<string, unknown>): { data: RestorableAppState; exportedAt: string; warning: string } {
  if (!isRecord(candidate.data)) throw new Error('Backup data is missing or invalid.')
  if (!isRecord(candidate.integrity) || candidate.integrity.algorithm !== 'fnv1a32' || typeof candidate.integrity.value !== 'string') throw new Error('Backup integrity information is missing.')
  if (candidate.integrity.value !== fnv1a32(stableStringify(candidate.data))) throw new Error('Backup integrity check failed. The file may be incomplete or edited.')
  const data = { ...candidate.data, settings: normalizeSettings(candidate.data.settings) }
  validateState(data)
  return {
    data,
    exportedAt: typeof candidate.exportedAt === 'string' && isValidDate(candidate.exportedAt) ? candidate.exportedAt : new Date().toISOString(),
    warning: 'Version 9 backup migrated safely. Existing training and deferred-feedback evidence is intact; auditable catalog edits begin with future changes.'
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
  } else if (candidate.format === BACKUP_FORMAT && candidate.schemaVersion === 6) {
    const migrated = migrateV6(candidate)
    warnings.push(migrated.warning)
    backup = createBackup(migrated.data, migrated.exportedAt)
  } else if (candidate.format === BACKUP_FORMAT && candidate.schemaVersion === 7) {
    const migrated = migrateV7(candidate)
    warnings.push(migrated.warning)
    backup = createBackup(migrated.data, migrated.exportedAt)
  } else if (candidate.format === BACKUP_FORMAT && candidate.schemaVersion === 8) {
    const migrated = migrateV8(candidate)
    warnings.push(migrated.warning)
    backup = createBackup(migrated.data, migrated.exportedAt)
  } else if (candidate.format === BACKUP_FORMAT && candidate.schemaVersion === 9) {
    const migrated = migrateV9(candidate)
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
      deferredFeedback: backup.data.deferredFeedback.length,
      records: backup.data.records.length,
      planVersions: backup.data.mesocycles.length,
      historyChanges: backup.data.historyMutations.length,
      cycleReviews: backup.data.cycleReviews.length,
      substitutions: backup.data.substitutionEvents.length,
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
    deferredFeedback: structuredClone(source.deferredFeedback),
    records: structuredClone(source.records),
    historyMutations: structuredClone(source.historyMutations),
    cycleReviews: structuredClone(source.cycleReviews),
    substitutionEvents: structuredClone(source.substitutionEvents),
    mesocycles: structuredClone(source.mesocycles),
    activeMesocycleId: source.activeMesocycleId,
    activeSessionId: source.activeSessionId,
    onboardingComplete: source.onboardingComplete
  }
}
