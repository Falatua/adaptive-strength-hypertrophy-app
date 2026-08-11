import type {
  AppSettings,
  AthleteProfile,
  CompletedSetRecord,
  CycleReviewEvent,
  DeferredFeedbackRequest,
  EquipmentProfile,
  Exercise,
  ExerciseSubstitutionEvent,
  HistoryMutationEvent,
  MesocyclePlan,
  MissedOpportunityEvent,
  MovementNoteRecord,
  MovementPlacementExitReviewEvent,
  PersonalRecord,
  PlacementExitReviewEvent,
  PlacementVerificationEvent,
  SurveyRecord,
  TrainingSession
} from './types'
import { derivePersonalRecords } from './history-engine'
import { summarizeSurveyEvidence } from './survey-engine'
import { exerciseMuscleMappingError } from './muscle-dose'
import { equipmentGenerationEvidenceError, equipmentProfileError } from './equipment-engine'
import { equipmentProfiles as seedEquipmentProfiles } from './seed'
import { legacyPlacementForAthlete, movementPlacementEvidenceError, placementAssessmentError, placementRouteLabels } from './placement-engine'
import { placementVerificationError } from './placement-verification-engine'
import { movementPlacementExitReviewError, placementExitReviewError } from './placement-exit-engine'
import { routeSessionGenerationError } from './route-session-engine'
import { missedOpportunityEventError } from './schedule-adaptation-engine'
import { movementNoteError } from './movement-note-engine'

export const BACKUP_FORMAT = 'forgepath-backup'
export const BACKUP_SCHEMA_VERSION = 25
export const BACKUP_APP_VERSION = '0.40.0'

const settingsDefaults: Pick<AppSettings, 'celebrationLevel' | 'opportunityPrompts' | 'sessionAchievements' | 'confetti' | 'quietMode' | 'activeEquipmentProfileId'> = {
  celebrationLevel: 'subtle',
  opportunityPrompts: true,
  sessionAchievements: true,
  confetti: false,
  quietMode: false,
  activeEquipmentProfileId: 'equipment-commercial-gym'
}

export interface RestorableAppState {
  athlete: AthleteProfile
  settings: AppSettings
  equipmentProfiles: EquipmentProfile[]
  exercises: Exercise[]
  sessions: TrainingSession[]
  history: CompletedSetRecord[]
  movementNotes: MovementNoteRecord[]
  surveys: SurveyRecord[]
  deferredFeedback: DeferredFeedbackRequest[]
  records: PersonalRecord[]
  historyMutations: HistoryMutationEvent[]
  cycleReviews: CycleReviewEvent[]
  substitutionEvents: ExerciseSubstitutionEvent[]
  placementVerifications: PlacementVerificationEvent[]
  placementExitReviews: PlacementExitReviewEvent[]
  movementPlacementExitReviews: MovementPlacementExitReviewEvent[]
  missedOpportunityEvents: MissedOpportunityEvent[]
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
    movementNotes: number
    surveys: number
    deferredFeedback: number
    records: number
    planVersions: number
    historyChanges: number
    cycleReviews: number
    substitutions: number
    placementChecks: number
    placementExitReviews: number
    movementPlacementExitReviews: number
    missedOpportunityEvents: number
    movementPlacedAnchors: number
    historyReviewedAnchors: number
    routeGeneratedSessions: number
    equipmentGeneratedSessions: number
    equipmentProfiles: number
    athleteName: string
    placementRoute: string
    placementConfidence: string
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

function addLegacyEquipmentProfiles(candidate: Record<string, unknown>) {
  if (Array.isArray(candidate.equipmentProfiles) && candidate.equipmentProfiles.length > 0) return
  const profiles = structuredClone(seedEquipmentProfiles)
  const legacySettings = normalizeSettings(candidate.settings)
  const active = profiles.find((profile) => profile.name === legacySettings.equipmentLocation) ?? profiles[0]
  candidate.equipmentProfiles = profiles
  candidate.settings = { ...legacySettings, activeEquipmentProfileId: active.id, equipmentLocation: active.name }
  if (isRecord(candidate.athlete)) candidate.athlete = { ...candidate.athlete, equipmentProfile: active.name }
}

function addLegacyPlacement(candidate: Record<string, unknown>) {
  if (!isRecord(candidate.athlete) || candidate.athlete.placement !== undefined) return
  const placement = legacyPlacementForAthlete(candidate.athlete as Partial<AthleteProfile>)
  candidate.athlete = {
    ...candidate.athlete,
    placement,
    entryRoute: placementRouteLabels[placement.selectedRoute],
    level: placement.dimensions
  }
}

function addLegacyPlacementVerifications(candidate: Record<string, unknown>) {
  if (!Array.isArray(candidate.placementVerifications)) candidate.placementVerifications = []
}

function addLegacyPlacementExitReviews(candidate: Record<string, unknown>) {
  if (!Array.isArray(candidate.placementExitReviews)) candidate.placementExitReviews = []
}

function addLegacyMovementPlacementExitReviews(candidate: Record<string, unknown>) {
  if (!Array.isArray(candidate.movementPlacementExitReviews)) candidate.movementPlacementExitReviews = []
}

function addLegacyMissedOpportunityEvents(candidate: Record<string, unknown>) {
  if (!Array.isArray(candidate.missedOpportunityEvents)) candidate.missedOpportunityEvents = []
}

function addLegacyMovementNotes(candidate: Record<string, unknown>) {
  if (!Array.isArray(candidate.movementNotes)) candidate.movementNotes = []
}

function validateState(candidate: unknown, migrateLegacyState = false): asserts candidate is RestorableAppState {
  if (!isRecord(candidate)) throw new Error('Backup data is missing or invalid.')
  if (migrateLegacyState) {
    addLegacyEquipmentProfiles(candidate)
    addLegacyPlacement(candidate)
    addLegacyPlacementVerifications(candidate)
    addLegacyPlacementExitReviews(candidate)
    addLegacyMovementPlacementExitReviews(candidate)
    addLegacyMissedOpportunityEvents(candidate)
    addLegacyMovementNotes(candidate)
  }
  const errors: string[] = []
  const arrays = ['equipmentProfiles', 'exercises', 'sessions', 'history', 'movementNotes', 'surveys', 'deferredFeedback', 'records', 'mesocycles', 'historyMutations', 'cycleReviews', 'substitutionEvents', 'placementVerifications', 'placementExitReviews', 'movementPlacementExitReviews', 'missedOpportunityEvents'] as const
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

  const athlete = candidate.athlete as Record<string, unknown>
  const athleteLevel = isRecord(athlete.level) ? athlete.level : null
  const placement = isRecord(athlete.placement) ? athlete.placement : null
  const placementDimensions = placement && isRecord(placement.dimensions) ? placement.dimensions : null
  const placementError = placementAssessmentError(athlete.placement)
  if (placementError) errors.push(`Athlete placement is invalid: ${placementError}`)
  if (!athleteLevel) errors.push('Athlete placement dimensions are missing.')
  else if (['experience', 'recentContinuity', 'movementSkill', 'strengthTolerance', 'volumeTolerance', 'scheduleStability', 'dataConfidence'].some((key) => !Number.isInteger(athleteLevel[key]) || Number(athleteLevel[key]) < 1 || Number(athleteLevel[key]) > 5)) errors.push('Athlete placement dimensions must all be integers from one to five.')
  if (placementDimensions && athleteLevel && stableStringify(placementDimensions) !== stableStringify(athleteLevel)) errors.push('Athlete placement dimensions do not match the stored assessment.')
  if (placement && typeof placement.selectedRoute === 'string' && athlete.entryRoute !== placementRouteLabels[placement.selectedRoute as keyof typeof placementRouteLabels]) errors.push('Athlete entry route does not match the stored placement decision.')

  const exercises = candidate.exercises as unknown[]
  const equipmentProfiles = candidate.equipmentProfiles as unknown[]
  const sessions = candidate.sessions as unknown[]
  const history = candidate.history as unknown[]
  const movementNotes = candidate.movementNotes as unknown[]
  const surveys = candidate.surveys as unknown[]
  const deferredFeedback = candidate.deferredFeedback as unknown[]
  const records = candidate.records as unknown[]
  const mesocycles = candidate.mesocycles as unknown[]
  const historyMutations = candidate.historyMutations as unknown[]
  const cycleReviews = candidate.cycleReviews as unknown[]
  const substitutionEvents = candidate.substitutionEvents as unknown[]
  const placementVerifications = candidate.placementVerifications as unknown[]
  const placementExitReviews = candidate.placementExitReviews as unknown[]
  const movementPlacementExitReviews = candidate.movementPlacementExitReviews as unknown[]
  const missedOpportunityEvents = candidate.missedOpportunityEvents as unknown[]
  requireUniqueIds(exercises, 'Exercises', errors)
  requireUniqueIds(equipmentProfiles, 'Equipment profiles', errors)
  requireUniqueIds(sessions, 'Sessions', errors)
  requireUniqueIds(history, 'Completed sets', errors)
  requireUniqueIds(movementNotes, 'Movement notes', errors)
  requireUniqueIds(surveys, 'Surveys', errors)
  requireUniqueIds(deferredFeedback, 'Deferred feedback requests', errors)
  requireUniqueIds(records, 'Records', errors)
  requireUniqueIds(mesocycles, 'Mesocycles', errors)
  requireUniqueIds(historyMutations, 'History changes', errors)
  requireUniqueIds(cycleReviews, 'Cycle reviews', errors)
  requireUniqueIds(substitutionEvents, 'Substitution events', errors)
  requireUniqueIds(placementVerifications, 'Placement verification events', errors)
  requireUniqueIds(placementExitReviews, 'Placement exit reviews', errors)
  requireUniqueIds(movementPlacementExitReviews, 'Movement placement exit reviews', errors)
  requireUniqueIds(missedOpportunityEvents, 'Missed opportunity events', errors)

  const exerciseIds = new Set(exercises.flatMap((exercise) => isRecord(exercise) && typeof exercise.id === 'string' ? [exercise.id] : []))
  const equipmentProfileIds = new Set(equipmentProfiles.flatMap((profile) => isRecord(profile) && typeof profile.id === 'string' ? [profile.id] : []))
  const sessionIds = new Set(sessions.flatMap((session) => isRecord(session) && typeof session.id === 'string' ? [session.id] : []))
  const mesocycleIds = new Set(mesocycles.flatMap((plan) => isRecord(plan) && typeof plan.id === 'string' ? [plan.id] : []))
  const completedSetIds = new Set(history.flatMap((workSet) => isRecord(workSet) && typeof workSet.id === 'string' ? [workSet.id] : []))
  const completedSetRegions = new Map(history.flatMap((workSet) => isRecord(workSet) && typeof workSet.id === 'string' && typeof workSet.primaryRegion === 'string' ? [[workSet.id, workSet.primaryRegion]] : []))
  const completedSetsById = new Map(history.flatMap((workSet) => isRecord(workSet) && typeof workSet.id === 'string' ? [[workSet.id, workSet]] : []))
  const surveyIds = new Set(surveys.flatMap((survey) => isRecord(survey) && typeof survey.id === 'string' ? [survey.id] : []))
  const substitutionEventIds = new Set(substitutionEvents.flatMap((event) => isRecord(event) && typeof event.id === 'string' ? [event.id] : []))
  const placementVerificationIds = new Set(placementVerifications.flatMap((event) => isRecord(event) && typeof event.id === 'string' ? [event.id] : []))
  const historicalSetExerciseIds = new Map<string, Set<string>>()
  const rememberHistoricalSet = (workSet: unknown) => {
    if (!isRecord(workSet) || typeof workSet.id !== 'string' || typeof workSet.exerciseId !== 'string') return
    const exerciseIds = historicalSetExerciseIds.get(workSet.id) ?? new Set<string>()
    exerciseIds.add(workSet.exerciseId)
    historicalSetExerciseIds.set(workSet.id, exerciseIds)
  }
  history.forEach(rememberHistoricalSet)
  historyMutations.forEach((mutation) => {
    if (!isRecord(mutation)) return
    for (const snapshotName of ['before', 'after']) {
      const snapshot = mutation[snapshotName]
      if (!isRecord(snapshot) || !Array.isArray(snapshot.history)) continue
      snapshot.history.forEach(rememberHistoricalSet)
    }
  })
  const validateHistoryReviewSources = (movement: unknown, label: string) => {
    if (!isRecord(movement) || !isRecord(movement.historyReview) || !isRecord(movement.historyReview.evidence) || !Array.isArray(movement.historyReview.evidence.sourceSetIds)) return
    const evidence = movement.historyReview.evidence
    const sourceSetIds = evidence.sourceSetIds as unknown[]
    if (sourceSetIds.some((id) => typeof id !== 'string' || !historicalSetExerciseIds.has(id))) errors.push(`${label} history review references an unknown completed source set.`)
    if (typeof evidence.exerciseId === 'string' && sourceSetIds.some((id) => typeof id === 'string' && historicalSetExerciseIds.has(id) && !historicalSetExerciseIds.get(id)?.has(evidence.exerciseId as string))) errors.push(`${label} history review references a completed source set from a different exercise identity.`)
  }

  const movementNoteKeys = new Set<string>()
  movementNotes.forEach((note) => {
    const noteError = movementNoteError(note)
    if (noteError) errors.push(`A movement note is invalid: ${noteError}`)
    if (!isRecord(note)) return
    if (typeof note.sessionId !== 'string' || !sessionIds.has(note.sessionId)) errors.push('A movement note references an unknown session.')
    const noteSession = sessions.find((session) => isRecord(session) && session.id === note.sessionId)
    if (isRecord(noteSession) && Array.isArray(noteSession.exercises) && !noteSession.exercises.some((planned) => isRecord(planned) && planned.id === note.plannedExerciseId)) errors.push('A movement note references an unknown planned exercise slot.')
    if (typeof note.exerciseId !== 'string' || !exerciseIds.has(note.exerciseId)) errors.push('A movement note references an unknown exercise.')
    if (note.originalExerciseId !== undefined && (typeof note.originalExerciseId !== 'string' || !exerciseIds.has(note.originalExerciseId))) errors.push('A movement note references an unknown original exercise.')
    if (note.mesocycleId !== null && (typeof note.mesocycleId !== 'string' || !mesocycleIds.has(note.mesocycleId))) errors.push('A movement note references an unknown mesocycle.')
    if (typeof note.sessionId === 'string' && typeof note.plannedExerciseId === 'string' && typeof note.exerciseId === 'string') {
      const key = `${note.sessionId}:${note.plannedExerciseId}:${note.exerciseId}`
      if (movementNoteKeys.has(key)) errors.push('Movement notes contain more than one note for the same workout movement.')
      movementNoteKeys.add(key)
    }
  })

  if (placement && Array.isArray(placement.movementPlacements)) placement.movementPlacements.forEach((movement) => {
    if (!isRecord(movement)) return
    const exercise = exercises.find((candidate) => isRecord(candidate) && candidate.id === movement.exerciseId)
    if (!isRecord(exercise)) errors.push('Athlete movement placement references an unknown exercise identity.')
    validateHistoryReviewSources(movement, 'Athlete movement placement')
  })

  placementVerifications.forEach((event) => {
    const eventError = placementVerificationError(event)
    if (eventError) errors.push(`A placement verification is invalid: ${eventError}`)
    if (!isRecord(event)) return
    validateHistoryReviewSources(event.movementPlacement, 'Placement verification')
    if (typeof event.sessionId !== 'string' || !sessionIds.has(event.sessionId)) errors.push('A placement verification references an unknown session.')
    if (isRecord(event.firstSet)) {
      const firstSet = event.firstSet
      const governedByHistoryMutation = typeof firstSet.sourceSetId === 'string' && historyMutations.some((mutation) => isRecord(mutation) && Array.isArray(mutation.affectedSetIds) && mutation.affectedSetIds.includes(firstSet.sourceSetId))
      if (typeof firstSet.sourceSetId !== 'string' || (!completedSetIds.has(firstSet.sourceSetId) && !governedByHistoryMutation)) errors.push('A placement verification references an unknown completed source set.')
      const sourceSet = history.find((workSet) => isRecord(workSet) && workSet.id === firstSet.sourceSetId)
      const sourceMatches = isRecord(sourceSet) && sourceSet.sessionId === event.sessionId && sourceSet.exerciseId === firstSet.exerciseId && sourceSet.plannedExerciseId === firstSet.plannedExerciseId && sourceSet.load === firstSet.actualLoad && sourceSet.reps === firstSet.actualReps && sourceSet.rir === firstSet.actualRir
      if (!sourceMatches && !governedByHistoryMutation) errors.push('A placement verification first-set snapshot does not match its completed source set or a governed history change.')
    }
  })
  placementExitReviews.forEach((review) => {
    const reviewError = placementExitReviewError(review)
    if (reviewError) errors.push(`A placement exit review is invalid: ${reviewError}`)
    if (!isRecord(review) || !isRecord(review.assessment)) return
    const assessment = review.assessment
    if (isRecord(assessment.sourcePlacement) && Array.isArray(assessment.sourcePlacement.movementPlacements)) assessment.sourcePlacement.movementPlacements.forEach((movement) => validateHistoryReviewSources(movement, 'Placement exit source placement'))
    if (!Array.isArray(assessment.sourceVerificationEvents)) return
    assessment.sourceVerificationEvents.forEach((sourceEvent) => {
      if (!isRecord(sourceEvent) || typeof sourceEvent.id !== 'string' || !placementVerificationIds.has(sourceEvent.id)) errors.push('A placement exit review references an unknown placement verification event.')
      if (!isRecord(sourceEvent)) return
      validateHistoryReviewSources(sourceEvent.movementPlacement, 'Placement exit source verification')
      if (isRecord(sourceEvent.firstSet)) {
        const firstSet = sourceEvent.firstSet
        if (typeof firstSet.sourceSetId !== 'string' || !historicalSetExerciseIds.has(firstSet.sourceSetId)) errors.push('A placement exit review references an unknown completed source set.')
        else if (typeof firstSet.exerciseId !== 'string' || !historicalSetExerciseIds.get(firstSet.sourceSetId)?.has(firstSet.exerciseId)) errors.push('A placement exit review references a completed source set from a different exercise identity.')
      }
    })
  })
  movementPlacementExitReviews.forEach((review) => {
    const reviewError = movementPlacementExitReviewError(review)
    if (reviewError) errors.push(`A movement placement exit review is invalid: ${reviewError}`)
    if (!isRecord(review) || !isRecord(review.assessment)) return
    const assessment = review.assessment
    if (isRecord(assessment.sourcePlacement) && Array.isArray(assessment.sourcePlacement.movementPlacements)) assessment.sourcePlacement.movementPlacements.forEach((movement) => validateHistoryReviewSources(movement, 'Movement exit source placement'))
    validateHistoryReviewSources(assessment.sourceMovementPlacement, 'Movement exit source movement')
    if (!Array.isArray(assessment.sourceVerificationEvents)) return
    assessment.sourceVerificationEvents.forEach((sourceEvent) => {
      if (!isRecord(sourceEvent) || typeof sourceEvent.id !== 'string' || !placementVerificationIds.has(sourceEvent.id)) errors.push('A movement placement exit review references an unknown placement verification event.')
      if (!isRecord(sourceEvent)) return
      validateHistoryReviewSources(sourceEvent.movementPlacement, 'Movement exit source verification')
      if (isRecord(sourceEvent.firstSet)) {
        const firstSet = sourceEvent.firstSet
        if (typeof firstSet.sourceSetId !== 'string' || !historicalSetExerciseIds.has(firstSet.sourceSetId)) errors.push('A movement placement exit review references an unknown completed source set.')
        else if (typeof firstSet.exerciseId !== 'string' || !historicalSetExerciseIds.get(firstSet.sourceSetId)?.has(firstSet.exerciseId)) errors.push('A movement placement exit review references a completed source set from a different exercise identity.')
      }
    })
  })
  const placementSequenceKeys = placementVerifications.flatMap((event) => isRecord(event) ? [`${String(event.placementCreatedAt)}:${isRecord(event.movementPlacement) ? String(event.movementPlacement.exerciseId) : 'plan'}:${String(event.sequence)}`] : [])
  if (new Set(placementSequenceKeys).size !== placementSequenceKeys.length) errors.push('Placement verification sequence numbers must be unique within one placement movement lane.')

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

  equipmentProfiles.forEach((profile) => {
    const profileError = equipmentProfileError(profile)
    if (profileError) errors.push(`An equipment profile is invalid: ${profileError}`)
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
    if (session.generation !== undefined) {
      const generationError = routeSessionGenerationError(session.generation)
      if (generationError) errors.push(`A route-generated session is invalid: ${generationError}`)
      if (isRecord(session.generation)) {
        const plan = mesocycles.find((candidate) => isRecord(candidate) && candidate.id === session.mesocycleId)
        const routeMatches = session.generation.ruleVersion === 'route-session-v3'
          ? isRecord(plan) && plan.entryRoute === session.generation.planRoute
          : isRecord(plan) && plan.entryRoute === session.generation.route
        if (!routeMatches || !isRecord(plan) || plan.generationRuleVersion !== session.generation.ruleVersion || plan.placementCreatedAt !== session.generation.placementCreatedAt) errors.push('A route-generated session does not match its mesocycle placement provenance.')
        if (session.generation.ruleVersion === 'route-session-v2' && (session.microcycleNumber ?? 1) === 1 && (!isRecord(plan) || stableStringify(plan.generationEquipment) !== stableStringify(session.generation.equipment))) errors.push('An equipment-aware starting session does not match its mesocycle equipment snapshot.')
        if (session.generation.ruleVersion === 'route-session-v3') {
          const plannedPrimary = Array.isArray(session.exercises) ? session.exercises.find((planned) => isRecord(planned) && planned.role === 'primary') : null
          const movementEvidence = session.generation.movementPlacement
          const planMovement = isRecord(plan) && Array.isArray(plan.movementPlacements) && isRecord(movementEvidence)
            ? plan.movementPlacements.find((movement) => isRecord(movement) && movement.exerciseId === movementEvidence.exerciseId)
            : undefined
          const placementExercise = isRecord(movementEvidence) ? exercises.find((exercise) => isRecord(exercise) && exercise.id === movementEvidence.exerciseId) : undefined
          const governedMergeMatches = isRecord(placementExercise) && isRecord(plannedPrimary) && placementExercise.retired === true && placementExercise.mergedIntoId === plannedPrimary.exerciseId
          const primaryMatchesPlacement = isRecord(plannedPrimary) && isRecord(movementEvidence) && (plannedPrimary.exerciseId === movementEvidence.exerciseId || plannedPrimary.substitutedFrom === movementEvidence.exerciseId || governedMergeMatches)
          if (!primaryMatchesPlacement) errors.push('A movement-placed session does not match its protected primary identity or governed substitution.')
          if (!isRecord(planMovement) || stableStringify(planMovement) !== stableStringify(movementEvidence)) errors.push('A movement-placed session does not match its mesocycle movement snapshot.')
          validateHistoryReviewSources(movementEvidence, 'Movement-placed session')
          if ((session.microcycleNumber ?? 1) === 1 && (!isRecord(plan) || stableStringify(plan.generationEquipment) !== stableStringify(session.generation.equipment))) errors.push('A movement-placed starting session does not match its mesocycle equipment snapshot.')
        }
      }
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
  if (typeof settings.activeEquipmentProfileId !== 'string' || !equipmentProfileIds.has(settings.activeEquipmentProfileId)) errors.push('The active equipment profile is missing or invalid.')
  const activeEquipmentProfile = equipmentProfiles.find((profile) => isRecord(profile) && profile.id === settings.activeEquipmentProfileId)
  if (isRecord(activeEquipmentProfile) && settings.equipmentLocation !== activeEquipmentProfile.name) errors.push('The equipment location label does not match the active equipment profile.')
  if (isRecord(activeEquipmentProfile) && isRecord(candidate.athlete) && candidate.athlete.equipmentProfile !== activeEquipmentProfile.name) errors.push('The athlete equipment label does not match the active equipment profile.')

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

  missedOpportunityEvents.forEach((event) => {
    const eventError = missedOpportunityEventError(event, sessions as TrainingSession[])
    if (eventError) errors.push(`A missed opportunity event is invalid: ${eventError}`)
    if (isRecord(event) && isRecord(event.eligibility) && (typeof event.eligibility.equipmentProfileId !== 'string' || !equipmentProfileIds.has(event.eligibility.equipmentProfileId))) errors.push('A missed opportunity event references an unknown equipment profile.')
    if (isRecord(event) && isRecord(event.readiness) && event.readiness.sourceSurveyId !== null && (typeof event.readiness.sourceSurveyId !== 'string' || !surveyIds.has(event.readiness.sourceSurveyId))) errors.push('A missed opportunity event references an unknown readiness survey.')
    if (isRecord(event) && isRecord(event.priorityDose) && Array.isArray(event.priorityDose.regions)) {
      const priorityDose = event.priorityDose
      const priorityDoseRegions = priorityDose.regions as unknown[]
      const citedSourceIds: string[] = []
      priorityDoseRegions.forEach((point) => {
        if (!isRecord(point) || typeof point.region !== 'string' || !Array.isArray(point.sourceSetIds)) return
        const sourceDates: string[] = []
        point.sourceSetIds.forEach((sourceId) => {
          if (typeof sourceId !== 'string' || !completedSetIds.has(sourceId)) errors.push('A missed opportunity priority-dose point references an unknown completed source set.')
          else if (completedSetRegions.get(sourceId) !== point.region) errors.push('A missed opportunity priority-dose point references a completed source set from a different primary region.')
          if (typeof sourceId === 'string') {
            citedSourceIds.push(sourceId)
            const sourceSet = completedSetsById.get(sourceId)
            if (isRecord(sourceSet) && typeof sourceSet.completedAt === 'string') {
              sourceDates.push(sourceSet.completedAt)
              const completedAt = new Date(sourceSet.completedAt).getTime()
              if (completedAt < new Date(String(priorityDose.windowStartAt)).getTime() || completedAt > new Date(String(priorityDose.windowEndAt)).getTime()) errors.push('A missed opportunity priority-dose source set falls outside its recorded window.')
            }
          }
        })
        const expectedLastCompletedAt = sourceDates.reduce<string | null>((latest, completedAt) => !latest || new Date(completedAt) > new Date(latest) ? completedAt : latest, null)
        if (point.lastCompletedAt !== expectedLastCompletedAt) errors.push('A missed opportunity priority-dose point has an invalid latest completion date.')
      })
      if (new Set(citedSourceIds).size !== citedSourceIds.length) errors.push('A missed opportunity priority-dose source set is cited more than once.')
    }
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
    const hasRouteGeneration = plan.entryRoute !== undefined || plan.generationRuleVersion !== undefined || plan.placementCreatedAt !== undefined || plan.generationEquipment !== undefined || plan.movementPlacements !== undefined
    if (hasRouteGeneration && (!['introductory-skill', 'reacclimation', 'bridge-calibration', 'base-building', 'hypertrophy', 'powerbuilding', 'strength', 'power', 'event-specific', 'pain-aware-modified'].includes(String(plan.entryRoute)) || !['route-session-v1', 'route-session-v2', 'route-session-v3'].includes(String(plan.generationRuleVersion)) || !isValidDate(plan.placementCreatedAt))) errors.push('A mesocycle has incomplete route-generation provenance.')
    if (plan.generationRuleVersion === 'route-session-v2' || plan.generationRuleVersion === 'route-session-v3') {
      const equipmentError = equipmentGenerationEvidenceError(plan.generationEquipment)
      if (equipmentError) errors.push(`A mesocycle equipment snapshot is invalid: ${equipmentError}`)
    }
    if (plan.generationRuleVersion === 'route-session-v3') {
      if (!Array.isArray(plan.movementPlacements) || plan.movementPlacements.length !== plan.strengthAnchors.length) errors.push('A movement-placed mesocycle must store one placement for every protected anchor.')
      else {
        if (new Set(plan.movementPlacements.flatMap((movement) => isRecord(movement) && typeof movement.exerciseId === 'string' ? [movement.exerciseId] : [])).size !== plan.movementPlacements.length) errors.push('A movement-placed mesocycle has duplicate movement identities.')
        plan.movementPlacements.forEach((movement) => {
          const movementError = movementPlacementEvidenceError(movement)
          if (movementError) errors.push(`A mesocycle movement placement is invalid: ${movementError}`)
          if (isRecord(movement) && !(plan.strengthAnchors as unknown[]).includes(movement.exerciseId)) errors.push('A mesocycle movement placement is not a protected anchor.')
          validateHistoryReviewSources(movement, 'Mesocycle movement placement')
        })
      }
    } else if (plan.movementPlacements !== undefined) errors.push('A legacy mesocycle cannot invent per-movement placement evidence.')
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
  validateState(data, true)
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
  validateState(data, true)
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
  validateState(data, true)
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
  validateState(data, true)
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
  validateState(data, true)
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
  validateState(data, true)
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
  validateState(data, true)
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
  validateState(data, true)
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
  validateState(data, true)
  return {
    data,
    exportedAt: typeof candidate.exportedAt === 'string' && isValidDate(candidate.exportedAt) ? candidate.exportedAt : new Date().toISOString(),
    warning: 'Version 9 backup migrated safely. Existing training and deferred-feedback evidence is intact; auditable catalog edits begin with future changes.'
  }
}

function migrateV10(candidate: Record<string, unknown>): { data: RestorableAppState; exportedAt: string; warning: string } {
  if (!isRecord(candidate.data)) throw new Error('Backup data is missing or invalid.')
  if (!isRecord(candidate.integrity) || candidate.integrity.algorithm !== 'fnv1a32' || typeof candidate.integrity.value !== 'string') throw new Error('Backup integrity information is missing.')
  if (candidate.integrity.value !== fnv1a32(stableStringify(candidate.data))) throw new Error('Backup integrity check failed. The file may be incomplete or edited.')
  const data = { ...candidate.data, settings: normalizeSettings(candidate.data.settings) }
  validateState(data, true)
  return {
    data,
    exportedAt: typeof candidate.exportedAt === 'string' && isValidDate(candidate.exportedAt) ? candidate.exportedAt : new Date().toISOString(),
    warning: 'Version 10 backup migrated safely. Existing training truth is intact; equipment availability begins with the matching seeded location profile.'
  }
}

function migrateV11(candidate: Record<string, unknown>): { data: RestorableAppState; exportedAt: string; warning: string } {
  if (!isRecord(candidate.data)) throw new Error('Backup data is missing or invalid.')
  if (!isRecord(candidate.integrity) || candidate.integrity.algorithm !== 'fnv1a32' || typeof candidate.integrity.value !== 'string') throw new Error('Backup integrity information is missing.')
  if (candidate.integrity.value !== fnv1a32(stableStringify(candidate.data))) throw new Error('Backup integrity check failed. The file may be incomplete or edited.')
  const data = { ...candidate.data, settings: normalizeSettings(candidate.data.settings) }
  validateState(data, true)
  return {
    data,
    exportedAt: typeof candidate.exportedAt === 'string' && isValidDate(candidate.exportedAt) ? candidate.exportedAt : new Date().toISOString(),
    warning: 'Version 11 backup migrated safely. Existing training truth is intact; placement begins as a transparent legacy-derived hypothesis.'
  }
}

function migrateV12(candidate: Record<string, unknown>): { data: RestorableAppState; exportedAt: string; warning: string } {
  if (!isRecord(candidate.data)) throw new Error('Backup data is missing or invalid.')
  if (!isRecord(candidate.integrity) || candidate.integrity.algorithm !== 'fnv1a32' || typeof candidate.integrity.value !== 'string') throw new Error('Backup integrity information is missing.')
  if (candidate.integrity.value !== fnv1a32(stableStringify(candidate.data))) throw new Error('Backup integrity check failed. The file may be incomplete or edited.')
  const data = { ...candidate.data, settings: normalizeSettings(candidate.data.settings), placementVerifications: [] }
  validateState(data, true)
  return {
    data,
    exportedAt: typeof candidate.exportedAt === 'string' && isValidDate(candidate.exportedAt) ? candidate.exportedAt : new Date().toISOString(),
    warning: 'Version 12 backup migrated safely. Existing placement remains intact; productive placement-verification evidence begins with future sessions.'
  }
}

function migrateV13(candidate: Record<string, unknown>): { data: RestorableAppState; exportedAt: string; warning: string } {
  if (!isRecord(candidate.data)) throw new Error('Backup data is missing or invalid.')
  if (!isRecord(candidate.integrity) || candidate.integrity.algorithm !== 'fnv1a32' || typeof candidate.integrity.value !== 'string') throw new Error('Backup integrity information is missing.')
  if (candidate.integrity.value !== fnv1a32(stableStringify(candidate.data))) throw new Error('Backup integrity check failed. The file may be incomplete or edited.')
  const data = { ...candidate.data, settings: normalizeSettings(candidate.data.settings) }
  validateState(data, true)
  return {
    data,
    exportedAt: typeof candidate.exportedAt === 'string' && isValidDate(candidate.exportedAt) ? candidate.exportedAt : new Date().toISOString(),
    warning: 'Version 13 backup migrated safely. Existing sessions remain unchanged; route-specific generation provenance begins with a future placement or reassessment.'
  }
}

function migrateV14(candidate: Record<string, unknown>): { data: RestorableAppState; exportedAt: string; warning: string } {
  if (!isRecord(candidate.data)) throw new Error('Backup data is missing or invalid.')
  if (!isRecord(candidate.integrity) || candidate.integrity.algorithm !== 'fnv1a32' || typeof candidate.integrity.value !== 'string') throw new Error('Backup integrity information is missing.')
  if (candidate.integrity.value !== fnv1a32(stableStringify(candidate.data))) throw new Error('Backup integrity check failed. The file may be incomplete or edited.')
  const data = { ...candidate.data, settings: normalizeSettings(candidate.data.settings) }
  validateState(data, true)
  return {
    data,
    exportedAt: typeof candidate.exportedAt === 'string' && isValidDate(candidate.exportedAt) ? candidate.exportedAt : new Date().toISOString(),
    warning: 'Version 14 backup migrated safely. Existing route-session-v1 history remains valid; equipment-aware route-session-v2 evidence begins with future generation.'
  }
}

function migrateV15(candidate: Record<string, unknown>): { data: RestorableAppState; exportedAt: string; warning: string } {
  if (!isRecord(candidate.data)) throw new Error('Backup data is missing or invalid.')
  if (!isRecord(candidate.integrity) || candidate.integrity.algorithm !== 'fnv1a32' || typeof candidate.integrity.value !== 'string') throw new Error('Backup integrity information is missing.')
  if (candidate.integrity.value !== fnv1a32(stableStringify(candidate.data))) throw new Error('Backup integrity check failed. The file may be incomplete or edited.')
  const data = { ...candidate.data, settings: normalizeSettings(candidate.data.settings) }
  validateState(data, true)
  return {
    data,
    exportedAt: typeof candidate.exportedAt === 'string' && isValidDate(candidate.exportedAt) ? candidate.exportedAt : new Date().toISOString(),
    warning: 'Version 15 backup migrated safely. Existing placement-v1 and route-session-v2 evidence remains valid; per-movement placement begins with a future reassessment.'
  }
}

function migrateV16(candidate: Record<string, unknown>): { data: RestorableAppState; exportedAt: string; warning: string } {
  if (!isRecord(candidate.data)) throw new Error('Backup data is missing or invalid.')
  if (!isRecord(candidate.integrity) || candidate.integrity.algorithm !== 'fnv1a32' || typeof candidate.integrity.value !== 'string') throw new Error('Backup integrity information is missing.')
  if (candidate.integrity.value !== fnv1a32(stableStringify(candidate.data))) throw new Error('Backup integrity check failed. The file may be incomplete or edited.')
  const data = { ...candidate.data, settings: normalizeSettings(candidate.data.settings) }
  validateState(data, true)
  return {
    data,
    exportedAt: typeof candidate.exportedAt === 'string' && isValidDate(candidate.exportedAt) ? candidate.exportedAt : new Date().toISOString(),
    warning: 'Version 16 backup migrated safely. Existing placement-v2 and movement-placement-v1 evidence remains valid; exact-history review begins with a future reassessment.'
  }
}

function migrateV17(candidate: Record<string, unknown>): { data: RestorableAppState; exportedAt: string; warning: string } {
  if (!isRecord(candidate.data)) throw new Error('Backup data is missing or invalid.')
  if (!isRecord(candidate.integrity) || candidate.integrity.algorithm !== 'fnv1a32' || typeof candidate.integrity.value !== 'string') throw new Error('Backup integrity information is missing.')
  if (candidate.integrity.value !== fnv1a32(stableStringify(candidate.data))) throw new Error('Backup integrity check failed. The file may be incomplete or edited.')
  const data = { ...candidate.data, settings: normalizeSettings(candidate.data.settings), placementExitReviews: [] }
  validateState(data, true)
  return {
    data,
    exportedAt: typeof candidate.exportedAt === 'string' && isValidDate(candidate.exportedAt) ? candidate.exportedAt : new Date().toISOString(),
    warning: 'Version 17 backup migrated safely. Existing placement history and verification evidence remains valid; criterion-exit reviews begin with future athlete decisions.'
  }
}

function migrateV18(candidate: Record<string, unknown>): { data: RestorableAppState; exportedAt: string; warning: string } {
  if (!isRecord(candidate.data)) throw new Error('Backup data is missing or invalid.')
  if (!isRecord(candidate.integrity) || candidate.integrity.algorithm !== 'fnv1a32' || typeof candidate.integrity.value !== 'string') throw new Error('Backup integrity information is missing.')
  if (candidate.integrity.value !== fnv1a32(stableStringify(candidate.data))) throw new Error('Backup integrity check failed. The file may be incomplete or edited.')
  const data = { ...candidate.data, settings: normalizeSettings(candidate.data.settings), movementPlacementExitReviews: [] }
  validateState(data, true)
  return {
    data,
    exportedAt: typeof candidate.exportedAt === 'string' && isValidDate(candidate.exportedAt) ? candidate.exportedAt : new Date().toISOString(),
    warning: 'Version 18 backup migrated safely. Existing plan-route checkpoint evidence remains valid; exact movement-lane exit reviews begin with future athlete decisions.'
  }
}

function migrateV19(candidate: Record<string, unknown>): { data: RestorableAppState; exportedAt: string; warning: string } {
  if (!isRecord(candidate.data)) throw new Error('Backup data is missing or invalid.')
  if (!isRecord(candidate.integrity) || candidate.integrity.algorithm !== 'fnv1a32' || typeof candidate.integrity.value !== 'string') throw new Error('Backup integrity information is missing.')
  if (candidate.integrity.value !== fnv1a32(stableStringify(candidate.data))) throw new Error('Backup integrity check failed. The file may be incomplete or edited.')
  const data = { ...candidate.data, settings: normalizeSettings(candidate.data.settings), missedOpportunityEvents: [] }
  validateState(data, true)
  return {
    data,
    exportedAt: typeof candidate.exportedAt === 'string' && isValidDate(candidate.exportedAt) ? candidate.exportedAt : new Date().toISOString(),
    warning: 'Version 19 backup migrated safely. Existing calendar and exact-exposure history remains intact; missed-opportunity evidence begins with future athlete check-ins.'
  }
}

function migrateV20(candidate: Record<string, unknown>): { data: RestorableAppState; exportedAt: string; warning: string } {
  if (!isRecord(candidate.data)) throw new Error('Backup data is missing or invalid.')
  if (!isRecord(candidate.integrity) || candidate.integrity.algorithm !== 'fnv1a32' || typeof candidate.integrity.value !== 'string') throw new Error('Backup integrity information is missing.')
  if (candidate.integrity.value !== fnv1a32(stableStringify(candidate.data))) throw new Error('Backup integrity check failed. The file may be incomplete or edited.')
  validateState(candidate.data, true)
  return {
    data: candidate.data,
    exportedAt: typeof candidate.exportedAt === 'string' && isValidDate(candidate.exportedAt) ? candidate.exportedAt : new Date().toISOString(),
    warning: 'Version 20 backup migrated safely. Existing missed-opportunity-v1 decisions remain replayable; athlete next-session pins begin with version 2 check-ins.'
  }
}

function migrateV21(candidate: Record<string, unknown>): { data: RestorableAppState; exportedAt: string; warning: string } {
  if (!isRecord(candidate.data)) throw new Error('Backup data is missing or invalid.')
  if (!isRecord(candidate.integrity) || candidate.integrity.algorithm !== 'fnv1a32' || typeof candidate.integrity.value !== 'string') throw new Error('Backup integrity information is missing.')
  if (candidate.integrity.value !== fnv1a32(stableStringify(candidate.data))) throw new Error('Backup integrity check failed. The file may be incomplete or edited.')
  validateState(candidate.data, true)
  return {
    data: candidate.data,
    exportedAt: typeof candidate.exportedAt === 'string' && isValidDate(candidate.exportedAt) ? candidate.exportedAt : new Date().toISOString(),
    warning: 'Version 21 backup migrated safely. Existing athlete priority decisions remain replayable; equipment and safety eligibility evidence begins with version 3 check-ins.'
  }
}

function migrateV22(candidate: Record<string, unknown>): { data: RestorableAppState; exportedAt: string; warning: string } {
  if (!isRecord(candidate.data)) throw new Error('Backup data is missing or invalid.')
  if (!isRecord(candidate.integrity) || candidate.integrity.algorithm !== 'fnv1a32' || typeof candidate.integrity.value !== 'string') throw new Error('Backup integrity information is missing.')
  if (candidate.integrity.value !== fnv1a32(stableStringify(candidate.data))) throw new Error('Backup integrity check failed. The file may be incomplete or edited.')
  validateState(candidate.data, true)
  return {
    data: candidate.data,
    exportedAt: typeof candidate.exportedAt === 'string' && isValidDate(candidate.exportedAt) ? candidate.exportedAt : new Date().toISOString(),
    warning: 'Version 22 backup migrated safely. Existing equipment eligibility decisions remain replayable; fresh readiness evidence begins with version 4 check-ins.'
  }
}

function migrateV23(candidate: Record<string, unknown>): { data: RestorableAppState; exportedAt: string; warning: string } {
  if (!isRecord(candidate.data)) throw new Error('Backup data is missing or invalid.')
  if (!isRecord(candidate.integrity) || candidate.integrity.algorithm !== 'fnv1a32' || typeof candidate.integrity.value !== 'string') throw new Error('Backup integrity information is missing.')
  if (candidate.integrity.value !== fnv1a32(stableStringify(candidate.data))) throw new Error('Backup integrity check failed. The file may be incomplete or edited.')
  validateState(candidate.data, true)
  return {
    data: candidate.data,
    exportedAt: typeof candidate.exportedAt === 'string' && isValidDate(candidate.exportedAt) ? candidate.exportedAt : new Date().toISOString(),
    warning: 'Version 23 backup migrated safely. Existing readiness-aware schedule decisions remain replayable; relative priority-region dose evidence begins with version 5 check-ins.'
  }
}

function migrateV24(candidate: Record<string, unknown>): { data: RestorableAppState; exportedAt: string; warning: string } {
  if (!isRecord(candidate.data)) throw new Error('Backup data is missing or invalid.')
  if (!isRecord(candidate.integrity) || candidate.integrity.algorithm !== 'fnv1a32' || typeof candidate.integrity.value !== 'string') throw new Error('Backup integrity information is missing.')
  if (candidate.integrity.value !== fnv1a32(stableStringify(candidate.data))) throw new Error('Backup integrity check failed. The file may be incomplete or edited.')
  const data = { ...candidate.data, movementNotes: [] }
  validateState(data, true)
  return {
    data,
    exportedAt: typeof candidate.exportedAt === 'string' && isValidDate(candidate.exportedAt) ? candidate.exportedAt : new Date().toISOString(),
    warning: 'Version 24 backup migrated safely. Existing workouts and cloud-foundation metadata remain intact; exact-movement notes begin with future workout entries.'
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
  } else if (candidate.format === BACKUP_FORMAT && candidate.schemaVersion === 10) {
    const migrated = migrateV10(candidate)
    warnings.push(migrated.warning)
    backup = createBackup(migrated.data, migrated.exportedAt)
  } else if (candidate.format === BACKUP_FORMAT && candidate.schemaVersion === 11) {
    const migrated = migrateV11(candidate)
    warnings.push(migrated.warning)
    backup = createBackup(migrated.data, migrated.exportedAt)
  } else if (candidate.format === BACKUP_FORMAT && candidate.schemaVersion === 12) {
    const migrated = migrateV12(candidate)
    warnings.push(migrated.warning)
    backup = createBackup(migrated.data, migrated.exportedAt)
  } else if (candidate.format === BACKUP_FORMAT && candidate.schemaVersion === 13) {
    const migrated = migrateV13(candidate)
    warnings.push(migrated.warning)
    backup = createBackup(migrated.data, migrated.exportedAt)
  } else if (candidate.format === BACKUP_FORMAT && candidate.schemaVersion === 14) {
    const migrated = migrateV14(candidate)
    warnings.push(migrated.warning)
    backup = createBackup(migrated.data, migrated.exportedAt)
  } else if (candidate.format === BACKUP_FORMAT && candidate.schemaVersion === 15) {
    const migrated = migrateV15(candidate)
    warnings.push(migrated.warning)
    backup = createBackup(migrated.data, migrated.exportedAt)
  } else if (candidate.format === BACKUP_FORMAT && candidate.schemaVersion === 16) {
    const migrated = migrateV16(candidate)
    warnings.push(migrated.warning)
    backup = createBackup(migrated.data, migrated.exportedAt)
  } else if (candidate.format === BACKUP_FORMAT && candidate.schemaVersion === 17) {
    const migrated = migrateV17(candidate)
    warnings.push(migrated.warning)
    backup = createBackup(migrated.data, migrated.exportedAt)
  } else if (candidate.format === BACKUP_FORMAT && candidate.schemaVersion === 18) {
    const migrated = migrateV18(candidate)
    warnings.push(migrated.warning)
    backup = createBackup(migrated.data, migrated.exportedAt)
  } else if (candidate.format === BACKUP_FORMAT && candidate.schemaVersion === 19) {
    const migrated = migrateV19(candidate)
    warnings.push(migrated.warning)
    backup = createBackup(migrated.data, migrated.exportedAt)
  } else if (candidate.format === BACKUP_FORMAT && candidate.schemaVersion === 20) {
    const migrated = migrateV20(candidate)
    warnings.push(migrated.warning)
    backup = createBackup(migrated.data, migrated.exportedAt)
  } else if (candidate.format === BACKUP_FORMAT && candidate.schemaVersion === 21) {
    const migrated = migrateV21(candidate)
    warnings.push(migrated.warning)
    backup = createBackup(migrated.data, migrated.exportedAt)
  } else if (candidate.format === BACKUP_FORMAT && candidate.schemaVersion === 22) {
    const migrated = migrateV22(candidate)
    warnings.push(migrated.warning)
    backup = createBackup(migrated.data, migrated.exportedAt)
  } else if (candidate.format === BACKUP_FORMAT && candidate.schemaVersion === 23) {
    const migrated = migrateV23(candidate)
    warnings.push(migrated.warning)
    backup = createBackup(migrated.data, migrated.exportedAt)
  } else if (candidate.format === BACKUP_FORMAT && candidate.schemaVersion === 24) {
    const migrated = migrateV24(candidate)
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
      movementNotes: backup.data.movementNotes.length,
      surveys: backup.data.surveys.length,
      deferredFeedback: backup.data.deferredFeedback.length,
      records: backup.data.records.length,
      planVersions: backup.data.mesocycles.length,
      historyChanges: backup.data.historyMutations.length,
      cycleReviews: backup.data.cycleReviews.length,
      substitutions: backup.data.substitutionEvents.length,
      placementChecks: backup.data.placementVerifications.length,
      placementExitReviews: backup.data.placementExitReviews.length,
      movementPlacementExitReviews: backup.data.movementPlacementExitReviews.length,
      missedOpportunityEvents: backup.data.missedOpportunityEvents.length,
      movementPlacedAnchors: backup.data.athlete.placement.movementPlacements?.length ?? 0,
      historyReviewedAnchors: backup.data.athlete.placement.movementPlacements?.filter((movement) => Boolean(movement.historyReview)).length ?? 0,
      routeGeneratedSessions: backup.data.sessions.filter((session) => Boolean(session.generation)).length,
      equipmentGeneratedSessions: backup.data.sessions.filter((session) => session.generation?.ruleVersion === 'route-session-v2' || session.generation?.ruleVersion === 'route-session-v3').length,
      equipmentProfiles: backup.data.equipmentProfiles.length,
      athleteName: backup.data.athlete.name,
      placementRoute: placementRouteLabels[backup.data.athlete.placement.selectedRoute],
      placementConfidence: backup.data.athlete.placement.confidence,
      exportedAt: backup.exportedAt
    }
  }
}

export function backupStateFrom(source: RestorableAppState): RestorableAppState {
  return {
    athlete: structuredClone(source.athlete),
    settings: structuredClone(source.settings),
    equipmentProfiles: structuredClone(source.equipmentProfiles),
    exercises: structuredClone(source.exercises),
    sessions: structuredClone(source.sessions),
    history: structuredClone(source.history),
    movementNotes: structuredClone(source.movementNotes),
    surveys: structuredClone(source.surveys),
    deferredFeedback: structuredClone(source.deferredFeedback),
    records: structuredClone(source.records),
    historyMutations: structuredClone(source.historyMutations),
    cycleReviews: structuredClone(source.cycleReviews),
    substitutionEvents: structuredClone(source.substitutionEvents),
    placementVerifications: structuredClone(source.placementVerifications),
    placementExitReviews: structuredClone(source.placementExitReviews),
    movementPlacementExitReviews: structuredClone(source.movementPlacementExitReviews),
    missedOpportunityEvents: structuredClone(source.missedOpportunityEvents),
    mesocycles: structuredClone(source.mesocycles),
    activeMesocycleId: source.activeMesocycleId,
    activeSessionId: source.activeSessionId,
    onboardingComplete: source.onboardingComplete
  }
}
