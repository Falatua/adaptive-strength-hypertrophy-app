import { nanoid } from 'nanoid'
import { create } from 'zustand'
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware'
import { athlete as seedAthlete, equipmentProfiles as seedEquipmentProfiles, exercises as seedExercises, mesocycles as seedMesocycles } from '../domain/seed'
import { compressSession, normalizeExerciseRole, readinessFromSurvey, sessionCompletionStatus } from '../domain/training-engine'
import { backupStateFrom, type RestorableAppState } from '../domain/backup'
import { buildMesocyclePreview, createMesocyclePlan, draftFromPlan, replaceFuturePlan } from '../domain/mesocycle-engine'
import { derivePersonalRecords, historyVolume, projectExerciseMerge } from '../domain/history-engine'
import { buildCycleReview, buildNextMicrocycle } from '../domain/cycle-review-engine'
import { rankExerciseSubstitutions } from '../domain/substitution-engine'
import { buildDeferredFeedbackRequest, expireDeferredFeedbackRequests, summarizeSurveyEvidence } from '../domain/survey-engine'
import { mergeSystemEquipmentProfiles, mergeSystemExerciseCatalog, projectExerciseCatalogEdit, type ExerciseCatalogInput } from '../domain/catalog-engine'
import { sessionTrainedMinutes, startSessionClock, stopSessionClock } from '../domain/session-clock'
import { equipmentGenerationEvidence, equipmentProfileError, exerciseEquipmentFit, loadIncrementFor, nearestExecutableLoad, normalizedEquipmentProfile } from '../domain/equipment-engine'
import { legacyPlacementForAthlete, placementRouteLabels, replacementMovementPlacementFor } from '../domain/placement-engine'
import { beginPlacementVerification, cancelPlacementVerificationForPrimarySubstitution, completePlacementVerification, recordPlacementWarmup, resolvePlacementRecovery, revisePlacementSessionEvidence, summarizePlacementVerification } from '../domain/placement-verification-engine'
import { buildMovementPlacementExitAssessment, buildPlacementExitAssessment, movementPlacementExitReviewRuleVersion, placementExitReviewRuleVersion } from '../domain/placement-exit-engine'
import { EQUIPMENT_ROUTE_SESSION_RULE_VERSION, ROUTE_SESSION_RULE_VERSION, routeSessionProfile } from '../domain/route-session-engine'
import { buildMissedOpportunityReplan } from '../domain/schedule-adaptation-engine'
import { projectMovementNoteMerge, upsertMovementNote } from '../domain/movement-note-engine'
import { buildAddedMovement, buildAddedSet, sessionExtensionGate } from '../domain/session-extension-engine'
import { buildDropSet, buildMyoReps, canPairForSuperset, structureAllowedForRole } from '../domain/set-structure-engine'
import { sameJsonValue } from '../domain/stable-json'
import { buildHistoricalPerformance, type HistoricalPerformanceInput } from '../domain/history-entry-engine'
import { applyWorkoutSetEntry, hasEnteredLoadAndReps, hasEnteredRir } from '../domain/set-entry-autofill'
import { latestMovementFeedback, movementFeedbackMode, movementFeedbackPreview, movementFeedbackValue } from '../domain/movement-feedback-engine'
import { loadModeForSet } from '../domain/load-mode'
import { hasUnstartedSessionTrainingState, resetUnstartedSessionTrainingState } from '../domain/planned-session-state'
import type {
  AppSettings,
  AthleteProfile,
  CompletedSetRecord,
  CycleReviewDecision,
  CycleReviewEvent,
  DeferredFeedbackRequest,
  EquipmentProfile,
  Exercise,
  ExerciseSubstitutionEvent,
  EffectiveSurveyMode,
  HistoryMutationEvent,
  LoadMode,
  MesocycleDraft,
  MesocyclePlan,
  MissedOpportunityEvent,
  MissedOpportunityInput,
  MovementNoteRecord,
  NavKey,
  PersonalRecord,
  PlacementRecoveryResponse,
  PlacementExitDecision,
  PlacementExitReviewEvent,
  MovementPlacementExitReviewEvent,
  PlacementVerificationEvent,
  PlacementWarmupResponse,
  SurveyAnswer,
  SurveyRecord,
  SubstitutionReason,
  TrainingSession
} from '../domain/types'

const withOptionalBenchAngle = <T extends { benchAngleDeg?: number }>(value: T, angle: number | undefined): T => {
  const withoutAngle = { ...value }
  delete withoutAngle.benchAngleDeg
  return (angle === undefined ? withoutAngle : { ...withoutAngle, benchAngleDeg: angle }) as T
}
import { cloudAuthoritativeBuild, LEGACY_APP_STORAGE_KEY } from '../services/cloud-config'

interface AppState {
  nav: NavKey
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
  mesocycles: MesocyclePlan[]
  historyMutations: HistoryMutationEvent[]
  cycleReviews: CycleReviewEvent[]
  substitutionEvents: ExerciseSubstitutionEvent[]
  placementVerifications: PlacementVerificationEvent[]
  placementExitReviews: PlacementExitReviewEvent[]
  movementPlacementExitReviews: MovementPlacementExitReviewEvent[]
  missedOpportunityEvents: MissedOpportunityEvent[]
  activeMesocycleId: string | null
  activeSessionId: string | null
  workoutVisible: boolean
  onboardingComplete: boolean
  onboardingStartStep: 0 | 1
  recoverySnapshot: RestorableAppState | null
  notice: string | null
  setNav: (nav: NavKey) => void
  setNotice: (notice: string | null) => void
  completeOnboarding: (profile: Partial<AthleteProfile>) => void
  restartOnboarding: (startStep?: 0 | 1) => void
  updateAthlete: (profile: Partial<AthleteProfile>) => void
  updateSettings: (settings: Partial<AppSettings>) => void
  setActiveEquipmentProfile: (profileId: string) => { ok: boolean; error?: string }
  saveEquipmentProfile: (profile: EquipmentProfile) => { ok: boolean; error?: string }
  deleteEquipmentProfile: (profileId: string) => { ok: boolean; error?: string }
  startSession: (sessionId: string, availableMinutes?: number) => void
  resumeActiveSession: () => void
  leaveActiveSession: () => void
  pinSession: (sessionId: string) => { ok: boolean; error?: string }
  setReadiness: (sessionId: string, answers: SurveyAnswer[], skipped: boolean, mode: EffectiveSurveyMode) => void
  updateSet: (sessionId: string, plannedExerciseId: string, setId: string, data: { reps?: number; load?: number; rir?: number; benchAngleDeg?: number | null }) => void
  setExerciseLoadMode: (sessionId: string, plannedExerciseId: string, loadMode: LoadMode) => void
  updateBenchAnglePlan: (sessionId: string, plannedExerciseId: string, angles: Array<number | undefined>) => void
  updateMovementNote: (sessionId: string, plannedExerciseId: string, body: string) => void
  toggleSetComplete: (sessionId: string, plannedExerciseId: string, setId: string) => void
  skipSet: (sessionId: string, plannedExerciseId: string, setId: string, skipped: boolean) => void
  setSessionClockRunning: (sessionId: string, running: boolean) => void
  setSessionPainStatus: (sessionId: string, status: TrainingSession['painStatus']) => void
  setPlacementWarmup: (sessionId: string, response: Exclude<PlacementWarmupResponse, 'not-answered'>) => void
  resolvePlacementRecovery: (eventId: string, response: Exclude<PlacementRecoveryResponse, 'pending'>) => void
  recordPlacementExitReview: (decision: PlacementExitDecision, reason: string) => { ok: boolean; error?: string }
  recordMovementPlacementExitReview: (exerciseId: string, decision: PlacementExitDecision, reason: string) => { ok: boolean; error?: string }
  swapExercise: (sessionId: string, plannedExerciseId: string, exerciseId: string, reason: SubstitutionReason, primaryOverrideConfirmed: boolean) => { ok: boolean; error?: string; placementVerificationCancelled?: boolean }
  swapExerciseForBlock: (sessionId: string, plannedExerciseId: string, exerciseId: string, reason: SubstitutionReason, primaryOverrideConfirmed: boolean) => { ok: boolean; error?: string; placementVerificationCancelled?: boolean }
  recordMovementFeedback: (sessionId: string, plannedExerciseId: string, answers: SurveyAnswer[], note: string, skipped: boolean) => { ok: boolean; error?: string }
  finishSession: (sessionId: string, feedback: { answers: SurveyAnswer[]; note?: string; skipped: boolean; mode: EffectiveSurveyMode; deferred?: boolean }) => void
  submitDeferredFeedback: (requestId: string, answers: SurveyAnswer[], note?: string) => { ok: boolean; error?: string }
  dismissDeferredFeedback: (requestId: string) => { ok: boolean; error?: string }
  expireDeferredFeedback: () => void
  skipExercise: (sessionId: string, plannedExerciseId: string) => void
  addSetToExercise: (sessionId: string, plannedExerciseId: string) => { ok: boolean; error?: string }
  addMovementToSession: (sessionId: string, exerciseId: string) => { ok: boolean; error?: string }
  applySetStructure: (sessionId: string, plannedExerciseId: string, setId: string, kind: 'drop-set' | 'myo-reps') => { ok: boolean; error?: string }
  applySuperset: (sessionId: string, plannedExerciseId: string, partnerPlannedExerciseId: string) => { ok: boolean; error?: string }
  clearSetStructure: (sessionId: string, groupId: string) => { ok: boolean; error?: string }
  markMissed: (sessionId: string, context: MissedOpportunityInput) => { ok: boolean; error?: string; event?: MissedOpportunityEvent }
  toggleFavorite: (exerciseId: string) => void
  setExercisePreference: (exerciseId: string, preference: 'preferred' | 'neutral' | 'avoid') => void
  setJointFeeling: (exerciseId: string, jointFeeling: Exercise['jointFeeling']) => void
  addCustomExercise: (exercise: Exercise) => void
  updateExerciseCatalog: (exerciseId: string, input: ExerciseCatalogInput, reason: string) => { ok: boolean; error?: string; exercise?: Exercise }
  correctHistorySet: (setId: string, data: Pick<CompletedSetRecord, 'reps' | 'load' | 'rir' | 'technique' | 'pain' | 'qualityConfirmed' | 'completedAt'> & { benchAngleDeg?: number | null }, reason: string) => { ok: boolean; error?: string }
  deleteHistorySet: (setId: string, reason: string) => { ok: boolean; error?: string }
  mergeExercises: (sourceIds: string[], targetId: string, reason: string) => { ok: boolean; error?: string }
  importCompletedHistory: (records: CompletedSetRecord[], sourceName: string, skippedDuplicates: number) => { ok: boolean; error?: string }
  addHistoricalPerformance: (input: HistoricalPerformanceInput) => { ok: boolean; error?: string; records?: CompletedSetRecord[] }
  undoLatestHistoryMutation: () => { ok: boolean; error?: string }
  applyMesocycleRevision: (draft: MesocycleDraft) => { ok: boolean; error?: string }
  applyCycleReview: (decision: CycleReviewDecision, reason: string) => { ok: boolean; error?: string }
  restoreBackup: (data: RestorableAppState) => void
  undoLastRestore: () => void
  resetForTesting: () => void
}

const browserStateStorage: StateStorage = {
  getItem: (name) => typeof window === 'undefined' ? null : window.localStorage.getItem(name),
  setItem: (name, value) => {
    if (typeof window !== 'undefined' && !cloudAuthoritativeBuild) window.localStorage.setItem(name, value)
  },
  removeItem: (name) => {
    if (typeof window !== 'undefined') window.localStorage.removeItem(name)
  }
}

const initialSettings: AppSettings = {
  units: 'lb',
  preSurveyMode: 'ask',
  postSurveyMode: 'ask',
  focusedMode: false,
  reducedMotion: false,
  sounds: false,
  haptics: true,
  celebrationLevel: 'subtle',
  opportunityPrompts: true,
  sessionAchievements: true,
  confetti: false,
  quietMode: false,
  availableMinutes: 60,
  equipmentLocation: 'Home Gym',
  activeEquipmentProfileId: 'equipment-home-gym'
}

const cleanTestingStart = () => ({
  athlete: {
    ...structuredClone(seedAthlete),
    equipmentProfile: 'Home Gym',
    placement: {
      ...structuredClone(seedAthlete.placement),
      inputs: { ...structuredClone(seedAthlete.placement.inputs), equipmentProfileId: 'equipment-home-gym' }
    }
  },
  settings: structuredClone(initialSettings),
  equipmentProfiles: structuredClone(seedEquipmentProfiles),
  exercises: structuredClone(seedExercises).map((exercise) => ({
    ...exercise,
    favorite: false,
    disliked: false,
    jointFeeling: 'neutral' as const
  })),
  sessions: [] as TrainingSession[],
  history: [] as CompletedSetRecord[],
  movementNotes: [] as MovementNoteRecord[],
  surveys: [] as SurveyRecord[],
  deferredFeedback: [] as DeferredFeedbackRequest[],
  records: [] as PersonalRecord[],
  mesocycles: [] as MesocyclePlan[],
  historyMutations: [] as HistoryMutationEvent[],
  cycleReviews: [] as CycleReviewEvent[],
  substitutionEvents: [] as ExerciseSubstitutionEvent[],
  placementVerifications: [] as PlacementVerificationEvent[],
  placementExitReviews: [] as PlacementExitReviewEvent[],
  movementPlacementExitReviews: [] as MovementPlacementExitReviewEvent[],
  missedOpportunityEvents: [] as MissedOpportunityEvent[],
  activeMesocycleId: null,
  activeSessionId: null,
  workoutVisible: false,
  onboardingComplete: false,
  onboardingStartStep: 0 as 0 | 1,
  recoverySnapshot: null as RestorableAppState | null
})

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      nav: 'today',
      notice: null,
      ...cleanTestingStart(),
      setNav: (nav) => set({ nav }),
      setNotice: (notice) => set({ notice }),
      completeOnboarding: (profile) => set((state) => {
        const athlete = { ...state.athlete, ...profile }
        const route = athlete.placement.selectedRoute
        const routeProfile = routeSessionProfile(route)
        const generationProfile = state.equipmentProfiles.find((candidate) => candidate.id === athlete.placement.inputs.equipmentProfileId)
          ?? state.equipmentProfiles.find((candidate) => candidate.id === state.settings.activeEquipmentProfileId)
          ?? state.equipmentProfiles[0]
        const dominantAdaptation = route === 'hypertrophy' ? 'hypertrophy' as const
          : ['strength', 'power', 'event-specific'].includes(route) ? 'strength' as const
            : route === 'powerbuilding' ? 'powerbuilding' as const
              : 'reacclimation' as const
        const activePlan = state.mesocycles.find((plan) => plan.id === state.activeMesocycleId)
        const basePlan = activePlan ?? seedMesocycles[0]
        const isReassessment = Boolean(activePlan?.placementCreatedAt || activePlan?.revisionReason.includes(`${athlete.placement.ruleVersion} onboarding placement`) || activePlan?.revisionReason.includes(`${athlete.placement.ruleVersion} reassessment`))
        const now = new Date().toISOString()
        const planVersion = isReassessment || !activePlan ? Math.max(0, ...state.mesocycles.map((plan) => plan.version)) + 1 : activePlan.version
        const replacementPlanId = isReassessment || !activePlan ? `mesocycle-${nanoid()}` : activePlan.id
        const queuedAnchorOrder = state.sessions
          .filter((session) => ['planned', 'deferred'].includes(session.status))
          .flatMap((session) => session.exercises.find((planned) => planned.role === 'primary')?.exerciseId ?? [])
        const orderedAnchors = [...new Set([...queuedAnchorOrder, ...basePlan.strengthAnchors])]
        const planFields = {
          title: `${placementRouteLabels[route]} · Starting Cycle`,
          objective: athlete.goal,
          dominantAdaptation,
          entryCriteria: athlete.placement.reasons.join(' '),
          progressionModel: routeProfile.progressionPolicy,
          successCriteria: athlete.placement.exitCriteria.join('; '),
          exitPlan: `Verify placement across the first one to three productive sessions. ${athlete.placement.verificationPlan[0]}`,
          revisionReason: `${athlete.placement.ruleVersion} ${isReassessment ? 'reassessment' : 'onboarding placement'} · ${athlete.placement.decision}`,
          weeklyOpportunities: athlete.weeklyOpportunities,
          defaultMinutes: athlete.defaultMinutes,
          strengthAnchors: orderedAnchors,
          entryRoute: route,
          generationRuleVersion: ROUTE_SESSION_RULE_VERSION,
          placementCreatedAt: athlete.placement.createdAt,
          generationEquipment: equipmentGenerationEvidence(generationProfile),
          movementPlacements: structuredClone(athlete.placement.movementPlacements ?? [])
        }
        const routePlan = {
          ...basePlan,
          ...planFields,
          id: replacementPlanId,
          version: planVersion,
          status: 'active' as const,
          createdAt: isReassessment || !activePlan ? now : basePlan.createdAt,
          effectiveAt: now,
          supersedesId: isReassessment && activePlan ? activePlan.id : basePlan.supersedesId,
          sessionIds: [] as string[]
        }
        const generatedSessions = route === 'pain-aware-modified' ? [] : buildMesocyclePreview(draftFromPlan(routePlan), {
          exercises: state.exercises,
          currentSessions: state.sessions,
          history: state.history,
          planId: replacementPlanId,
          planVersion,
          startsAt: new Date(now),
          sessionKeyPrefix: `${replacementPlanId}-${route}`,
          placementCreatedAt: athlete.placement.createdAt,
          equipmentProfile: generationProfile
        }).sessions
        routePlan.sessionIds = generatedSessions.map((session) => session.id)
        const mesocycles = activePlan
          ? isReassessment
            ? [...state.mesocycles.map((plan) => plan.id === activePlan.id ? { ...plan, status: 'superseded' as const } : plan), routePlan]
            : state.mesocycles.map((plan) => plan.id === activePlan.id ? routePlan : plan)
          : [...state.mesocycles, routePlan]
        const preservedSessions = state.sessions.filter((session) => !['planned', 'deferred'].includes(session.status))
        return {
          athlete,
          settings: { ...state.settings, availableMinutes: athlete.defaultMinutes, activeEquipmentProfileId: generationProfile.id, equipmentLocation: generationProfile.name },
          mesocycles,
          sessions: [...preservedSessions, ...generatedSessions],
          activeMesocycleId: replacementPlanId,
          onboardingComplete: true,
          onboardingStartStep: 0,
          notice: route === 'pain-aware-modified'
            ? 'Pain-aware placement saved. Automatic session generation is paused until movement restrictions are reassessed.'
            : `${placementRouteLabels[route]} saved as a ${athlete.placement.confidence}-confidence starting point. ${generatedSessions.length} sessions are queued for it.`
        }
      }),
      restartOnboarding: (startStep = 0) => set({ onboardingComplete: false, onboardingStartStep: startStep, activeSessionId: null, nav: 'today', notice: null }),
      updateAthlete: (profile) => set((state) => ({ athlete: { ...state.athlete, ...profile } })),
      updateSettings: (settings) => set((state) => ({ settings: { ...state.settings, ...settings } })),
      setActiveEquipmentProfile: (profileId) => {
        const state = get()
        const profile = state.equipmentProfiles.find((candidate) => candidate.id === profileId)
        if (!profile) return { ok: false, error: 'Choose an equipment profile that still exists.' }
        set({
          settings: { ...state.settings, activeEquipmentProfileId: profile.id, equipmentLocation: profile.name },
          athlete: { ...state.athlete, equipmentProfile: profile.name },
          notice: `${profile.name} is active. Exercise availability and load increments now use this profile.`
        })
        return { ok: true }
      },
      saveEquipmentProfile: (profile) => {
        const state = get()
        const normalized = normalizedEquipmentProfile({ ...profile, source: 'athlete', updatedAt: new Date().toISOString() })
        const error = equipmentProfileError(normalized)
        if (error) return { ok: false, error }
        if (state.equipmentProfiles.some((candidate) => candidate.id !== normalized.id && candidate.name.toLowerCase() === normalized.name.toLowerCase())) return { ok: false, error: 'Use a distinct equipment-profile name.' }
        const exists = state.equipmentProfiles.some((candidate) => candidate.id === normalized.id)
        const isActive = state.settings.activeEquipmentProfileId === normalized.id
        set({
          equipmentProfiles: exists ? state.equipmentProfiles.map((candidate) => candidate.id === normalized.id ? normalized : candidate) : [...state.equipmentProfiles, normalized],
          settings: isActive ? { ...state.settings, equipmentLocation: normalized.name } : state.settings,
          athlete: isActive ? { ...state.athlete, equipmentProfile: normalized.name } : state.athlete,
          notice: `${normalized.name} saved with ${normalized.equipment.length} available equipment item${normalized.equipment.length === 1 ? '' : 's'}.`
        })
        return { ok: true }
      },
      deleteEquipmentProfile: (profileId) => {
        const state = get()
        const profile = state.equipmentProfiles.find((candidate) => candidate.id === profileId)
        if (!profile) return { ok: false, error: 'That equipment profile no longer exists.' }
        if (seedEquipmentProfiles.some((seedProfile) => seedProfile.id === profileId)) return { ok: false, error: 'Seed profiles can be customized but not deleted.' }
        if (state.settings.activeEquipmentProfileId === profileId) return { ok: false, error: 'Activate another location before deleting this profile.' }
        set({ equipmentProfiles: state.equipmentProfiles.filter((candidate) => candidate.id !== profileId), notice: `${profile.name} removed. Training history was unchanged.` })
        return { ok: true }
      },
      startSession: (sessionId, availableMinutes) => set((state) => {
        const minutes = availableMinutes ?? state.settings.availableMinutes
        const equipmentProfile = state.equipmentProfiles.find((candidate) => candidate.id === state.settings.activeEquipmentProfileId) ?? state.equipmentProfiles[0]
        const startedAt = new Date().toISOString()
        const sourceSession = state.sessions.find((session) => session.id === sessionId)
        const repairedUnstartedState = sourceSession ? hasUnstartedSessionTrainingState(sourceSession) : false
        const movementPlacement = sourceSession?.generation?.movementPlacement
        const laneKey = movementPlacement?.exerciseId ?? 'plan'
        const placementEvents = state.placementVerifications.filter((event) => event.placementCreatedAt === state.athlete.placement.createdAt && (event.movementPlacement?.exerciseId ?? 'plan') === laneKey)
        const shouldVerify = state.athlete.placement.selectedRoute !== 'pain-aware-modified'
          && placementEvents.length < 3
          && !placementEvents.some((event) => event.sessionId === sessionId)
        const verification = shouldVerify ? beginPlacementVerification({
          id: nanoid(), placement: state.athlete.placement, sessionId,
          sequence: placementEvents.length + 1, startedAt,
          movementPlacement
        }) : null
        return {
          activeSessionId: sessionId,
          workoutVisible: true,
          placementVerifications: verification ? [...state.placementVerifications, verification] : state.placementVerifications,
          sessions: state.sessions.map((session) => {
            if (session.id !== sessionId) return session
            const compressed = compressSession(resetUnstartedSessionTrainingState(session), minutes)
            return {
              ...compressed,
              status: 'active' as const,
              startedAt,
              exercises: compressed.exercises.map((planned) => {
                const exercise = state.exercises.find((candidate) => candidate.id === planned.exerciseId)
                if (!exercise || !equipmentProfile) return planned
                const increment = loadIncrementFor(exercise, equipmentProfile).value
                return {
                  ...planned,
                  sets: planned.sets.map((workSet) => ({
                    ...workSet,
                    targetLoad: nearestExecutableLoad(workSet.targetLoad, increment)
                  }))
                }
              })
            }
          }),
          notice: equipmentProfile
            ? `${repairedUnstartedState ? 'Unstarted set status was cleared. ' : ''}Workout saved locally. Loads now follow ${equipmentProfile.name}'s executable increments.`
            : 'Workout saved locally. You can train offline.'
        }
      }),
      resumeActiveSession: () => set((state) => state.activeSessionId
        ? { workoutVisible: true, notice: 'Active workout reopened with every logged set intact.' }
        : { notice: 'There is no active workout to resume.' }),
      leaveActiveSession: () => set((state) => state.activeSessionId
        ? { workoutVisible: false, nav: 'today', notice: 'Workout left open. Logged sets and training data remain saved locally.' }
        : { workoutVisible: false, notice: 'There is no active workout to leave open.' }),
      pinSession: (sessionId) => {
        const state = get()
        const target = state.sessions.find((session) => session.id === sessionId)
        if (!target || !['planned', 'deferred'].includes(target.status)) return { ok: false, error: 'Only an open planned session can be pinned.' }
        const unresolved = state.sessions.filter((session) => ['planned', 'deferred'].includes(session.status))
        const reordered = [target, ...unresolved.filter((session) => session.id !== sessionId)]
        let openIndex = 0
        set({
          sessions: state.sessions.map((session) => ['planned', 'deferred'].includes(session.status) ? reordered[openIndex++] : session),
          notice: `${target.title} is now the next protected training priority.`
        })
        return { ok: true }
      },
      setReadiness: (sessionId, answers, skipped, mode) => set((state) => {
        const evidence = summarizeSurveyEvidence(answers, skipped)
        const readiness = skipped || evidence.answeredCount === 0 ? undefined : readinessFromSurvey(answers, state.athlete.continuity)
        return {
          surveys: [...state.surveys, { id: nanoid(), sessionId, type: 'pre', completedAt: new Date().toISOString(), answers, skipped, mode, ...evidence }],
          sessions: state.sessions.map((session) => session.id === sessionId ? {
            ...session, readiness, readinessSurveyMode: mode, readinessAnsweredCount: evidence.answeredCount,
            readinessUnknownCount: evidence.unknownCount, readinessConfidence: evidence.confidence
          } : session)
        }
      }),
      updateSet: (sessionId, plannedExerciseId, setId, data) => set((state) => ({
        sessions: state.sessions.map((session) => session.id !== sessionId ? session : {
          ...session,
          exercises: session.exercises.map((exercise) => exercise.id !== plannedExerciseId ? exercise : {
            ...exercise,
            sets: applyWorkoutSetEntry(exercise.sets, setId, data).map((workSet) => workSet.id === setId
              ? withOptionalBenchAngle(workSet, data.benchAngleDeg === null ? undefined : data.benchAngleDeg ?? workSet.benchAngleDeg)
              : workSet)
          })
        })
      })),
      setExerciseLoadMode: (sessionId, plannedExerciseId, loadMode) => set((state) => ({
        sessions: state.sessions.map((session) => session.id !== sessionId ? session : {
          ...session,
          exercises: session.exercises.map((exercise) => exercise.id !== plannedExerciseId ? exercise : {
            ...exercise,
            sets: exercise.sets.map((workSet) => {
              if (workSet.completed) return workSet
              if (loadMode === 'bodyweight') {
                const entryOrigins = { ...workSet.entryOrigins }
                delete entryOrigins.load
                return { ...workSet, loadMode, completedLoad: undefined, entryOrigins }
              }
              return { ...workSet, loadMode }
            })
          })
        })
      })),
      updateBenchAnglePlan: (sessionId, plannedExerciseId, angles) => set((state) => ({
        sessions: state.sessions.map((session) => session.id !== sessionId ? session : {
          ...session,
          exercises: session.exercises.map((exercise) => exercise.id !== plannedExerciseId ? exercise : {
            ...exercise,
            sets: exercise.sets.map((workSet, index) => withOptionalBenchAngle(workSet, angles[index]))
          })
        })
      })),
      updateMovementNote: (sessionId, plannedExerciseId, body) => set((state) => {
        const session = state.sessions.find((candidate) => candidate.id === sessionId)
        const plannedExercise = session?.exercises.find((candidate) => candidate.id === plannedExerciseId)
        const exercise = state.exercises.find((candidate) => candidate.id === plannedExercise?.exerciseId)
        if (!session || !plannedExercise || !exercise) return { notice: 'That workout movement is no longer available for notes.' }
        return { movementNotes: upsertMovementNote({ notes: state.movementNotes, session, plannedExercise, exercise, body }) }
      }),
      // Stopping the clock is a real training fact, so it is stored on the session rather than held in
      // screen state. It survives navigation, reload, and process death like every other session event.
      setSessionClockRunning: (sessionId, running) => set((state) => {
        const now = new Date().toISOString()
        return {
          sessions: state.sessions.map((session) => session.id === sessionId
            ? (running ? startSessionClock(session, now) : stopSessionClock(session, now))
            : session)
        }
      }),
      setSessionPainStatus: (sessionId, status) => set((state) => ({
        sessions: state.sessions.map((session) => session.id === sessionId ? { ...session, painStatus: status } : session),
        notice: status === 'changed-training'
          ? 'Pain that changed training is recorded. Added volume is paused. Modify or stop the affected movement and seek qualified care for new, severe, or unexplained pain.'
          : 'No pain-related training change is recorded for this workout.'
      })),
      toggleSetComplete: (sessionId, plannedExerciseId, setId) => set((state) => {
        const session = state.sessions.find((candidate) => candidate.id === sessionId)
        const planned = session?.exercises.find((candidate) => candidate.id === plannedExerciseId)
        const workSet = planned?.sets.find((candidate) => candidate.id === setId)
        const exercise = state.exercises.find((candidate) => candidate.id === planned?.exerciseId)
        const profile = state.equipmentProfiles.find((candidate) => candidate.id === state.settings.activeEquipmentProfileId)
        if (workSet && !workSet.completed && exercise && profile && !exerciseEquipmentFit(exercise, profile).available) return { notice: `${exercise.name} cannot be logged at ${profile.name} until its equipment profile or movement is changed.` }
        return { sessions: state.sessions.map((candidateSession) => candidateSession.id !== sessionId ? candidateSession : {
          ...candidateSession,
          exercises: candidateSession.exercises.map((plannedMovement) => plannedMovement.id !== plannedExerciseId ? plannedMovement : {
            ...plannedMovement,
            sets: plannedMovement.sets.map((candidateSet) => candidateSet.id === setId ? {
              ...candidateSet,
              completed: !candidateSet.completed,
              skipped: candidateSet.completed ? candidateSet.skipped : false,
              completedReps: candidateSet.completedReps ?? candidateSet.targetReps,
              completedLoad: loadModeForSet(candidateSet, exercise!) === 'bodyweight' ? 0 : candidateSet.completedLoad ?? candidateSet.targetLoad,
              actualRir: candidateSet.actualRir ?? candidateSet.targetRir
            } : candidateSet)
          })
        }) }
      }),
      // Deliberately skipping a set is an athlete decision worth keeping. Simply leaving a set
      // unfinished is not a skip and records nothing.
      skipSet: (sessionId, plannedExerciseId, setId, skipped) => set((state) => ({
        sessions: state.sessions.map((session) => session.id !== sessionId ? session : {
          ...session,
          exercises: session.exercises.map((exercise) => exercise.id !== plannedExerciseId ? exercise : {
            ...exercise,
            sets: exercise.sets.map((workSet) => workSet.id !== setId ? workSet : { ...workSet, skipped, completed: skipped ? false : workSet.completed })
          })
        })
      })),
      setPlacementWarmup: (sessionId, response) => set((state) => ({
        placementVerifications: state.placementVerifications.map((event) => event.sessionId === sessionId && event.placementCreatedAt === state.athlete.placement.createdAt
          ? recordPlacementWarmup(event, response, new Date().toISOString())
          : event),
        notice: response === 'painful'
          ? 'Pain noted. Modify or stop the affected movement. This starting-plan check will require your review before another automatic start.'
          : response === 'harder'
            ? 'Harder warm-up saved. Keep the first work set submaximal so the route can be checked honestly.'
            : 'Warm-up response saved as placement evidence.'
      })),
      resolvePlacementRecovery: (eventId, response) => set((state) => {
        const target = state.placementVerifications.find((event) => event.id === eventId)
        if (!target || target.status !== 'awaiting-recovery') return { notice: 'That recovery check is no longer pending.' }
        const resolved = resolvePlacementRecovery(target, response, new Date().toISOString())
        return {
          placementVerifications: state.placementVerifications.map((event) => event.id === eventId ? resolved : event),
          notice: resolved.verdict === 'supports-route'
            ? 'Recovery saved. This productive exposure supports the current starting route.'
            : resolved.verdict === 'review-suggested'
              ? 'Recovery saved. The evidence suggests reviewing placement before progressing aggressively.'
              : 'Recovery remains unknown. Training history is preserved and placement confidence did not increase.'
        }
      }),
      recordPlacementExitReview: (decision, reason) => {
        const state = get()
        if (state.activeSessionId) return { ok: false, error: 'Finish or leave the active workout before reviewing placement criteria.' }
        if (!reason.trim()) return { ok: false, error: 'Add a short reason so the placement decision remains explainable.' }
        const createdAt = new Date().toISOString()
        const assessment = buildPlacementExitAssessment({ placement: state.athlete.placement, verificationEvents: state.placementVerifications, assessedAt: createdAt })
        if (assessment.collected === 0) return { ok: false, error: 'Finish at least one check on your current route before reviewing this checkpoint.' }
        if (assessment.reassessmentRequired && decision === 'continue-current') return { ok: false, error: 'Pain-changing evidence requires reassessment before automatic training can continue.' }
        const sourceIds = assessment.sourceVerificationEvents.filter((event) => event.placementRoute === assessment.currentRoute).map((event) => event.id).sort().join('|')
        const duplicate = state.placementExitReviews.some((review) => review.placementCreatedAt === assessment.placementCreatedAt && review.assessment.sourceVerificationEvents.filter((event) => event.placementRoute === review.assessment.currentRoute).map((event) => event.id).sort().join('|') === sourceIds)
        if (duplicate) return { ok: false, error: 'This exact placement evidence already has an athlete review.' }
        const event: PlacementExitReviewEvent = {
          id: nanoid(), ruleVersion: placementExitReviewRuleVersion, placementCreatedAt: assessment.placementCreatedAt,
          createdAt, decision, reason: reason.trim(), assessment
        }
        set({
          placementExitReviews: [...state.placementExitReviews, event],
          ...(decision === 'reassess-now' ? { onboardingComplete: false, onboardingStartStep: 1 as const, activeSessionId: null, nav: 'today' as const } : {}),
          notice: decision === 'reassess-now'
            ? 'Checkpoint review saved. Look over your current lift profile before starting a new placement and plan version.'
            : decision === 'defer'
              ? 'Starting-plan review deferred with your reason. Training history and the current plan remain unchanged.'
              : 'You reviewed the checkpoint and kept your current placement. Normal progression is unaffected.'
        })
        return { ok: true }
      },
      recordMovementPlacementExitReview: (exerciseId, decision, reason) => {
        const state = get()
        if (state.activeSessionId) return { ok: false, error: 'Finish or leave the active workout before reviewing a main lift\'s starting plan.' }
        if (!reason.trim()) return { ok: false, error: 'Add a short reason so the movement decision remains explainable.' }
        const movementPlacement = state.athlete.placement.movementPlacements?.find((movement) => movement.exerciseId === exerciseId)
        if (!movementPlacement) return { ok: false, error: 'That main lift is not part of the current starting profile.' }
        const createdAt = new Date().toISOString()
        const assessment = buildMovementPlacementExitAssessment({ placement: state.athlete.placement, movementPlacement, verificationEvents: state.placementVerifications, assessedAt: createdAt })
        if (assessment.collected === 0) return { ok: false, error: 'Complete at least one productive check for this exact movement before recording a lane review.' }
        if (assessment.reassessmentRequired && decision === 'continue-current') return { ok: false, error: 'Pain-changing movement evidence requires reassessment before this lane can be confirmed.' }
        const sourceIds = assessment.sourceVerificationEvents.filter((event) => event.movementPlacement?.exerciseId === exerciseId).map((event) => event.id).sort().join('|')
        const duplicate = state.movementPlacementExitReviews.some((review) => review.placementCreatedAt === assessment.placementCreatedAt && review.exerciseId === exerciseId && review.assessment.sourceVerificationEvents.filter((event) => event.movementPlacement?.exerciseId === exerciseId).map((event) => event.id).sort().join('|') === sourceIds)
        if (duplicate) return { ok: false, error: 'This exact movement evidence already has an athlete review.' }
        const event: MovementPlacementExitReviewEvent = {
          id: nanoid(), ruleVersion: movementPlacementExitReviewRuleVersion, placementCreatedAt: assessment.placementCreatedAt,
          exerciseId, createdAt, decision, reason: reason.trim(), assessment
        }
        set({
          movementPlacementExitReviews: [...state.movementPlacementExitReviews, event],
          ...(decision === 'reassess-now' ? { onboardingComplete: false, onboardingStartStep: 1 as const, activeSessionId: null, nav: 'today' as const } : {}),
          notice: decision === 'reassess-now'
            ? `${movementPlacement.exerciseName} lane review saved. Reassess the exact movement before creating the next placement and plan version.`
            : decision === 'defer'
              ? `${movementPlacement.exerciseName} lane checkpoint deferred with your reason.`
              : `${movementPlacement.exerciseName} remains in its current athlete-reviewed lane.`
        })
        return { ok: true }
      },
      swapExercise: (sessionId, plannedExerciseId, exerciseId, reason, primaryOverrideConfirmed) => {
        const state = get()
        const session = state.sessions.find((candidate) => candidate.id === sessionId)
        const planned = session?.exercises.find((candidate) => candidate.id === plannedExerciseId)
        const original = state.exercises.find((candidate) => candidate.id === planned?.exerciseId)
        const selected = state.exercises.find((candidate) => candidate.id === exerciseId && !candidate.retired)
        if (!session || !planned || !original || !selected) return { ok: false, error: 'That substitution is no longer available.' }
        const equipmentProfile = state.equipmentProfiles.find((candidate) => candidate.id === state.settings.activeEquipmentProfileId)
        if (!equipmentProfile) return { ok: false, error: 'Choose an active equipment profile before changing this movement.' }
        const equipmentFit = exerciseEquipmentFit(selected, equipmentProfile)
        if (!equipmentFit.available) return { ok: false, error: `${selected.name} is unavailable at ${equipmentProfile.name}. Missing: ${equipmentFit.missing.join(', ')}.` }
        if (planned.role === 'primary' && !primaryOverrideConfirmed) return { ok: false, error: 'Confirm the protected-primary tradeoff before changing this anchor.' }
        const ranked = rankExerciseSubstitutions({
          planned, original, exercises: state.exercises, history: state.history, athlete: state.athlete,
          readiness: session.readiness ?? 'confirm', reason, equipmentProfile, surveys: state.surveys
        })
        const choice = ranked.find((item) => item.candidate.id === exerciseId)
        if (!choice) return { ok: false, error: 'Choose an eligible active movement.' }
        const eventId = nanoid()
        const replacement = {
          ...planned,
          substitutedFrom: planned.substitutedFrom ?? original.id,
          substitutionEventId: eventId,
          exerciseId: selected.id,
          sets: structuredClone(choice.prescription),
          prescriptionMethod: choice.prescriptionMethod,
          prescriptionNote: choice.prescriptionNote,
          estimatedMinutes: Math.max(4, Math.ceil(choice.prescription.length * (planned.restSeconds + 45) / 60))
        }
        const nextExercises = session.exercises.map((candidate) => candidate.id === plannedExerciseId ? replacement : candidate)
        const event: ExerciseSubstitutionEvent = {
          id: eventId, sessionId, plannedExerciseId, originalExerciseId: original.id, selectedExerciseId: selected.id,
          role: planned.role, purpose: planned.purpose, reason, createdAt: new Date().toISOString(), readiness: session.readiness ?? 'confirm',
          availableMinutes: session.durationMinutes, equipmentLocation: equipmentProfile.name,
          primaryOverrideConfirmed: planned.role === 'primary' ? primaryOverrideConfirmed : false,
          candidates: ranked.slice(0, 6).map((item) => item.snapshot), originalPrescription: structuredClone(planned.sets),
          replacementPrescription: structuredClone(choice.prescription), prescriptionMethod: choice.prescriptionMethod,
          prescriptionNote: choice.prescriptionNote, sourceSetIds: [], outcome: 'pending'
        }
        const placementCancellation = planned.role === 'primary'
          ? cancelPlacementVerificationForPrimarySubstitution({ events: state.placementVerifications, placementCreatedAt: state.athlete.placement.createdAt, sessionId })
          : { events: state.placementVerifications, cancelled: false }
        set({
          sessions: state.sessions.map((candidate) => candidate.id === sessionId ? {
            ...candidate, exercises: nextExercises, durationMinutes: nextExercises.reduce((sum, item) => sum + item.estimatedMinutes, 0)
          } : candidate),
          substitutionEvents: [
            ...state.substitutionEvents.map((prior) => prior.sessionId === sessionId && prior.plannedExerciseId === plannedExerciseId && prior.outcome === 'pending'
              ? { ...prior, outcome: 'not-completed' as const, completedAt: event.createdAt }
              : prior),
            event
          ],
          placementVerifications: placementCancellation.events,
          notice: `${selected.name} now owns a ${choice.prescriptionMethod === 'exact-history' ? 'history-based' : 'baseline-calibration'} prescription. ${original.name}'s progression clock remains frozen.${placementCancellation.cancelled ? ` This session no longer verifies the ${original.name} placement lane.` : ''}`
        })
        return { ok: true, placementVerificationCancelled: placementCancellation.cancelled }
      },
      swapExerciseForBlock: (sessionId, plannedExerciseId, exerciseId, reason, primaryOverrideConfirmed) => {
        const state = get()
        const session = state.sessions.find((candidate) => candidate.id === sessionId)
        const planned = session?.exercises.find((candidate) => candidate.id === plannedExerciseId)
        const original = state.exercises.find((candidate) => candidate.id === planned?.exerciseId)
        const selected = state.exercises.find((candidate) => candidate.id === exerciseId && !candidate.retired)
        const activePlan = state.mesocycles.find((plan) => plan.id === state.activeMesocycleId && plan.status === 'active')
        if (!session || !planned || !original || !selected || !activePlan) return { ok: false, error: 'The active workout or training block is no longer available.' }
        if (planned.role === 'primary' && !primaryOverrideConfirmed) return { ok: false, error: 'Confirm the main-lift tradeoff before changing it for the block.' }

        const currentRound = session.microcycleNumber ?? 1
        const roundSessions = state.sessions
          .filter((candidate) => candidate.mesocycleId === activePlan.id && (candidate.microcycleNumber ?? 1) === currentRound)
          .sort((a, b) => activePlan.sessionIds.indexOf(a.id) - activePlan.sessionIds.indexOf(b.id))
        const sessionIndex = roundSessions.findIndex((candidate) => candidate.id === session.id)
        const slotIndex = session.exercises.findIndex((candidate) => candidate.id === planned.id)
        if (sessionIndex < 0 || slotIndex < 0) return { ok: false, error: 'ForgePath could not match this workout slot to the current block blueprint.' }

        const nextVersion = Math.max(0, ...state.mesocycles.map((plan) => plan.version)) + 1
        const planId = `mesocycle-${nanoid()}`
        const effectiveAt = new Date().toISOString()
        const generationProfile = state.equipmentProfiles.find((candidate) => candidate.id === state.settings.activeEquipmentProfileId) ?? state.equipmentProfiles[0]
        const baseDraft = draftFromPlan(activePlan)
        const movementOverrides = (baseDraft.movementOverrides ?? []).filter((choice) => choice.sessionIndex !== sessionIndex || choice.slotIndex !== slotIndex)
        const strengthAnchors = planned.role === 'primary'
          ? baseDraft.strengthAnchors.map((anchorId) => anchorId === original.id ? selected.id : anchorId)
          : baseDraft.strengthAnchors
        const existingMovementPlacements = baseDraft.movementPlacements ?? state.athlete.placement.movementPlacements ?? []
        const movementPlacements = planned.role === 'primary'
          ? [...existingMovementPlacements.filter((placement) => placement.exerciseId !== original.id), replacementMovementPlacementFor(selected, state.athlete.placement)]
          : baseDraft.movementPlacements
        const hasCompleteMovementPlacement = strengthAnchors.every((anchorId) => movementPlacements?.some((placement) => placement.exerciseId === anchorId))
        const entryRoute = baseDraft.entryRoute ?? state.athlete.placement.selectedRoute
        const nextDraft: MesocycleDraft = {
          ...baseDraft,
          revisionReason: `${original.name} changed to ${selected.name} from the active workout for the remaining training block.`,
          strengthAnchors,
          movementOverrides: planned.role === 'primary' ? movementOverrides : [...movementOverrides, { sessionIndex, slotIndex, exerciseId: selected.id, source: 'athlete' }],
          ...(entryRoute ? {
            entryRoute,
            placementCreatedAt: baseDraft.placementCreatedAt ?? state.athlete.placement.createdAt,
            generationRuleVersion: hasCompleteMovementPlacement ? ROUTE_SESSION_RULE_VERSION : EQUIPMENT_ROUTE_SESSION_RULE_VERSION,
            generationEquipment: equipmentGenerationEvidence(generationProfile),
            movementPlacements: hasCompleteMovementPlacement ? structuredClone(movementPlacements) : undefined
          } : {})
        }
        let preview: ReturnType<typeof buildMesocyclePreview>
        try {
          preview = buildMesocyclePreview(nextDraft, {
            exercises: state.exercises,
            currentSessions: state.sessions,
            history: state.history,
            planId,
            planVersion: nextVersion,
            startsAt: new Date(effectiveAt),
            microcycleNumber: currentRound,
            equipmentProfile: generationProfile
          })
        } catch (error) {
          return { ok: false, error: error instanceof Error ? error.message : 'The revised training-block blueprint could not be generated.' }
        }

        const workoutResult = get().swapExercise(sessionId, plannedExerciseId, exerciseId, reason, primaryOverrideConfirmed)
        if (!workoutResult.ok) return workoutResult
        const updated = get()
        const activePreview = preview.sessions[sessionIndex]
        if (!activePreview) return { ok: false, error: 'ForgePath could not preserve this workout inside the revised training round.' }
        const generatedFutureSessions = preview.sessions.filter((_, index) => index !== sessionIndex)
        const revisedSessionIds = preview.sessions.map((candidate, index) => index === sessionIndex ? session.id : candidate.id)
        const nextPlan = createMesocyclePlan(nextDraft, planId, nextVersion, effectiveAt, activePlan.id, revisedSessionIds)
        const currentWorkoutInNextPlan = updated.sessions.map((candidate) => candidate.id === session.id ? {
          ...candidate,
          mesocycleId: planId,
          planVersion: nextVersion,
          microcycleNumber: currentRound,
          generation: activePreview.generation
        } : candidate)
        const revised = replaceFuturePlan(currentWorkoutInNextPlan, updated.mesocycles, nextPlan, generatedFutureSessions)
        set({
          sessions: revised.sessions,
          mesocycles: revised.plans,
          activeMesocycleId: nextPlan.id,
          athlete: { ...updated.athlete, strengthAnchors: [...strengthAnchors] },
          notice: `${selected.name} is active in this workout and training-block version ${nextVersion}. Its future progression and starting checks now use its own evidence. Completed workouts and ${original.name}'s history were preserved.`
        })
        return workoutResult
      },
      recordMovementFeedback: (sessionId, plannedExerciseId, answers, note, skipped) => {
        const state = get()
        const session = state.sessions.find((candidate) => candidate.id === sessionId)
        const planned = session?.exercises.find((candidate) => candidate.id === plannedExerciseId)
        const exercise = planned ? state.exercises.find((candidate) => candidate.id === planned.exerciseId) : undefined
        if (!session || !planned || !exercise) return { ok: false, error: 'That completed movement could not be found.' }
        const completedSets = planned.sets.filter((workSet) => workSet.completed)
        if (!completedSets.length || !planned.sets.every((workSet) => workSet.completed)) return { ok: false, error: 'Finish every set in this movement before saving its feedback.' }
        const recordedAt = new Date().toISOString()
        const recordedAnswers = answers
        const evidence = summarizeSurveyEvidence(recordedAnswers, skipped)
        const angles = [...new Set(completedSets.flatMap((workSet) => workSet.benchAngleDeg === undefined ? [] : [workSet.benchAngleDeg]))]
        const survey: SurveyRecord = {
          id: nanoid(), sessionId, type: 'movement', completedAt: recordedAt, answers: recordedAnswers, skipped,
          mode: movementFeedbackMode(state.settings.postSurveyMode), ...evidence,
          ruleVersion: 'movement-feedback-v1', plannedExerciseId, exerciseId: exercise.id, exerciseName: exercise.name,
          sourceSetIds: completedSets.map((workSet) => workSet.id), benchAngleDeg: angles.length === 1 && completedSets.every((workSet) => workSet.benchAngleDeg === angles[0]) ? angles[0] : null,
          ...(note.trim() ? { note: note.trim() } : {})
        }
        const pain = movementFeedbackValue(survey, 'movementPain')
        const preview = movementFeedbackPreview(recordedAnswers)
        set({
          surveys: [...state.surveys, survey],
          sessions: pain !== null && pain >= 4
            ? state.sessions.map((candidate) => candidate.id === sessionId ? { ...candidate, painStatus: 'changed-training' as const } : candidate)
            : state.sessions,
          notice: skipped
            ? `${exercise.name} feedback skipped. Those signals remain unknown and do not count against progression.`
            : `${exercise.name} feedback saved. ${preview.title}. Any future change still requires your approval.`
        })
        return { ok: true }
      },
      finishSession: (sessionId, feedback) => {
        const state = get()
        const session = state.sessions.find((candidate) => candidate.id === sessionId)
        if (!session) return
        const completedAt = new Date().toISOString()
        const postTechniqueAnswer = feedback.answers.find((answer) => answer.id === 'technique' && answer.status === 'answered')
        const postPainAnswer = feedback.answers.find((answer) => answer.id === 'pain' && answer.status === 'answered')
        const sessionHasMovementFeedback = state.surveys.some((survey) => survey.sessionId === sessionId && survey.type === 'movement')
        const newHistory: CompletedSetRecord[] = session.exercises.flatMap((plannedExercise) => {
          const exercise = state.exercises.find((candidate) => candidate.id === plannedExercise.exerciseId)
          const original = plannedExercise.substitutedFrom ? state.exercises.find((candidate) => candidate.id === plannedExercise.substitutedFrom) : undefined
          if (!exercise) return []
          const movementFeedback = latestMovementFeedback(state.surveys, sessionId, plannedExercise.id)
          const movementTechnique = movementFeedbackValue(movementFeedback, 'movementTechnique')
          const movementPain = movementFeedbackValue(movementFeedback, 'movementPain')
          // Once any exact-movement feedback is used, missing or skipped movement answers remain unknown.
          // The older broad post-session quality answer remains a fallback only for sessions that never
          // entered the movement-feedback flow at all.
          const qualityConfirmed = movementFeedback
            ? !movementFeedback.skipped && movementTechnique !== null && movementPain !== null
            : !sessionHasMovementFeedback && !feedback.deferred && typeof postTechniqueAnswer?.value === 'number' && typeof postPainAnswer?.value === 'number'
          const technique = qualityConfirmed ? Number(movementTechnique ?? postTechniqueAnswer?.value ?? 0) : 0
          const pain = qualityConfirmed ? Number(movementPain ?? postPainAnswer?.value ?? 0) : 0
          return plannedExercise.sets.flatMap((workSet, setIndex) => {
            if (!workSet.completed) return []
            const loadMode = loadModeForSet(workSet, exercise)
            const rirKnown = hasEnteredRir(workSet)
            return [{
              id: nanoid(), sessionId, exerciseId: exercise.id, exerciseName: exercise.name, family: exercise.family,
              primaryRegion: exercise.primaryRegion, completedAt, reps: workSet.completedReps ?? workSet.targetReps,
              load: loadMode === 'bodyweight' ? 0 : workSet.completedLoad ?? workSet.targetLoad,
              loadMode, rir: rirKnown ? workSet.actualRir! : 0, rirKnown,
              technique, pain, qualityConfirmed, setIndex, plannedExerciseId: plannedExercise.id, benchAngleDeg: workSet.benchAngleDeg,
              // Planned values remain useful session context, but only athlete-entered load and
              // repetitions become measured evidence for records and progression.
              numbersEntered: hasEnteredLoadAndReps(workSet, loadMode),
              athleteAdded: workSet.athleteAdded || plannedExercise.athleteAdded ? true : undefined,
              grouping: workSet.grouping,
              originalExerciseId: original?.id, originalExerciseName: original?.name, originalFamily: original?.family,
              originalPrimaryRegion: original?.primaryRegion
            }]
          })
        })
        const status = sessionCompletionStatus(session)
        const surveyEvidence = summarizeSurveyEvidence(feedback.answers, feedback.skipped)
        const difficulty = feedback.answers.find((answer) => answer.id === 'difficulty' && answer.status === 'answered')
        const sessionRpe = typeof difficulty?.value === 'number' ? difficulty.value : undefined
        const feedbackValue = (id: string) => {
          const answer = feedback.answers.find((candidate) => candidate.id === id && candidate.status === 'answered')
          return typeof answer?.value === 'number' ? answer.value : null
        }
        const surveyId = feedback.deferred ? null : nanoid()
        const deferredRequest = feedback.deferred && feedback.mode !== 'off'
          ? buildDeferredFeedbackRequest({ id: nanoid(), sessionId, mode: feedback.mode, now: new Date(completedAt) })
          : null
        const placementEvent = state.placementVerifications.find((event) => event.sessionId === sessionId && event.placementCreatedAt === state.athlete.placement.createdAt && event.status === 'active')
        const primary = session.exercises.find((plannedExercise) => plannedExercise.role === 'primary')
        const primaryExercise = primary ? state.exercises.find((exercise) => exercise.id === primary.exerciseId) : undefined
        // Placement verification rests on the prescribed anchor. An athlete-added set is not evidence
        // about whether the assigned route fits, so it can never become the first source set. Displayed
        // targets are also not observations: load, repetitions, and RIR all have to be athlete-entered.
        const firstPrimarySet = primary?.sets.find((workSet) => workSet.completed && !workSet.athleteAdded)
        const firstPrimarySetHasEnteredEvidence = Boolean(firstPrimarySet && primaryExercise
          && hasEnteredLoadAndReps(firstPrimarySet, loadModeForSet(firstPrimarySet, primaryExercise))
          && hasEnteredRir(firstPrimarySet))
        const firstPrimarySetIndex = primary && firstPrimarySet ? primary.sets.findIndex((workSet) => workSet.id === firstPrimarySet.id) : -1
        const firstSourceSet = primary && firstPrimarySetIndex >= 0
          ? newHistory.find((workSet) => workSet.plannedExerciseId === primary.id && workSet.setIndex === firstPrimarySetIndex)
          : undefined
        const prescribedSets = session.exercises.flatMap((plannedExercise) => plannedExercise.sets).filter((workSet) => !workSet.athleteAdded)
        const plannedSets = prescribedSets.length
        const completedPrescribedSets = prescribedSets.filter((workSet) => workSet.completed).length
        const actualMinutes = sessionTrainedMinutes(session, completedAt)
        const completedPlacementEvent = placementEvent ? completePlacementVerification(placementEvent, {
          firstSet: firstPrimarySetHasEnteredEvidence && firstPrimarySet && firstSourceSet && primary && primaryExercise ? {
            sourceSetId: firstSourceSet.id,
            plannedExerciseId: primary.id,
            exerciseId: primaryExercise.id,
            exerciseName: primaryExercise.name,
            targetLoad: firstPrimarySet.targetLoad,
            targetReps: firstPrimarySet.targetReps,
            targetRir: firstPrimarySet.targetRir,
            actualLoad: firstPrimarySet.completedLoad ?? firstPrimarySet.targetLoad,
            actualReps: firstPrimarySet.completedReps ?? firstPrimarySet.targetReps,
            actualRir: firstPrimarySet.actualRir ?? firstPrimarySet.targetRir
          } : null,
          sessionEvidence: {
            sessionStatus: status,
            completedSets: completedPrescribedSets,
            plannedSets,
            completionRate: plannedSets ? completedPrescribedSets / plannedSets : 0,
            plannedMinutes: session.durationMinutes,
            actualMinutes,
            readiness: session.readiness ?? null,
            difficulty: feedbackValue('difficulty'),
            technique: feedbackValue('technique'),
            pain: feedbackValue('pain'),
            timeFit: feedbackValue('timeFit'),
            postSurveySkipped: feedback.skipped || feedback.deferred === true
          },
          completedAt
        }) : null
        set((current) => {
          const history = [...current.history, ...newHistory]
          return {
          history,
          records: derivePersonalRecords(history),
          surveys: surveyId ? [...current.surveys, { id: surveyId, sessionId, type: 'post', completedAt, answers: feedback.answers, skipped: feedback.skipped, mode: feedback.mode, ...surveyEvidence }] : current.surveys,
          deferredFeedback: deferredRequest
            ? [...expireDeferredFeedbackRequests(current.deferredFeedback, new Date(completedAt)), deferredRequest]
            : current.deferredFeedback,
          sessions: current.sessions.map((candidate) => candidate.id === sessionId ? { ...candidate, status, completedAt, sessionRpe, note: feedback.note } : candidate),
          substitutionEvents: current.substitutionEvents.map((event) => {
            if (event.sessionId !== sessionId || event.outcome !== 'pending') return event
            const sourceSetIds = newHistory.filter((workSet) => workSet.plannedExerciseId === event.plannedExerciseId && workSet.exerciseId === event.selectedExerciseId).map((workSet) => workSet.id)
            const expectedSets = event.replacementPrescription.length
            return {
              ...event, sourceSetIds, completedAt,
              outcome: sourceSetIds.length === 0 ? 'not-completed' as const : sourceSetIds.length >= expectedSets ? 'completed' as const : 'partial' as const,
              ...(!feedback.deferred ? { postFeedback: {
                difficulty: feedbackValue('difficulty'), targetStimulus: feedbackValue('targetStimulus'),
                technique: feedbackValue('technique'), pain: feedbackValue('pain'), enjoyment: feedbackValue('enjoyment'), skipped: feedback.skipped
              } } : {})
            }
          }),
          placementVerifications: completedPlacementEvent
            ? current.placementVerifications.map((event) => event.id === completedPlacementEvent.id ? completedPlacementEvent : event)
            : current.placementVerifications,
          activeSessionId: null,
          workoutVisible: false,
          nav: 'progress',
          notice: deferredRequest
            ? `${newHistory.length} working sets saved. Optional feedback is available for 24 hours and will not block your next workout.`
            : completedPlacementEvent?.status === 'awaiting-recovery'
              ? `${newHistory.length} working sets saved. Placement evidence is waiting for an optional recovery check.`
              : completedPlacementEvent?.verdict === 'reassessment-required'
                ? `${newHistory.length} working sets saved. Pain evidence requires placement review before another automatic start.`
                : `${newHistory.length} working sets saved. Progress clocks updated from completed work only.`
        }})
      },
      submitDeferredFeedback: (requestId, answers, note) => {
        const state = get()
        const now = new Date()
        const request = state.deferredFeedback.find((candidate) => candidate.id === requestId)
        if (!request || request.status !== 'pending') return { ok: false, error: 'That feedback request is no longer available.' }
        if (new Date(request.expiresAt).getTime() <= now.getTime()) {
          set({ deferredFeedback: expireDeferredFeedbackRequests(state.deferredFeedback, now), notice: 'That optional feedback window expired. Nothing about your workout or progress changed.' })
          return { ok: false, error: 'That optional feedback window has expired.' }
        }
        const session = state.sessions.find((candidate) => candidate.id === request.sessionId)
        if (!session || !session.completedAt) return { ok: false, error: 'The completed workout could not be found.' }
        const techniqueAnswer = answers.find((answer) => answer.id === 'technique' && answer.status === 'answered')
        const painAnswer = answers.find((answer) => answer.id === 'pain' && answer.status === 'answered')
        const qualityConfirmed = typeof techniqueAnswer?.value === 'number' && typeof painAnswer?.value === 'number'
        const technique = qualityConfirmed ? Number(techniqueAnswer.value) : 0
        const pain = qualityConfirmed ? Number(painAnswer.value) : 0
        const movementFeedbackPlannedIds = new Set(state.surveys.flatMap((survey) => survey.sessionId === request.sessionId && survey.type === 'movement' && survey.plannedExerciseId ? [survey.plannedExerciseId] : []))
        const history = state.history.map((workSet) => workSet.sessionId === request.sessionId && !movementFeedbackPlannedIds.has(workSet.plannedExerciseId ?? '')
          ? { ...workSet, technique, pain, qualityConfirmed }
          : workSet)
        const surveyId = nanoid()
        const evidence = summarizeSurveyEvidence(answers, false)
        const difficulty = answers.find((answer) => answer.id === 'difficulty' && answer.status === 'answered')
        const sessionRpe = typeof difficulty?.value === 'number' ? difficulty.value : session.sessionRpe
        const feedbackValue = (id: string) => {
          const answer = answers.find((candidate) => candidate.id === id && candidate.status === 'answered')
          return typeof answer?.value === 'number' ? answer.value : null
        }
        const placementVerifications = state.placementVerifications.map((event) => event.sessionId === request.sessionId && event.sessionEvidence
          ? revisePlacementSessionEvidence(event, {
            ...event.sessionEvidence,
            difficulty: feedbackValue('difficulty'),
            technique: feedbackValue('technique'),
            pain: feedbackValue('pain'),
            timeFit: feedbackValue('timeFit'),
            postSurveySkipped: false
          })
          : event)
        set({
          history,
          records: derivePersonalRecords(history),
          surveys: [...state.surveys, { id: surveyId, sessionId: request.sessionId, type: 'post', completedAt: now.toISOString(), answers, skipped: false, mode: request.mode, ...evidence }],
          sessions: state.sessions.map((candidate) => candidate.id === request.sessionId ? { ...candidate, sessionRpe, note: note?.trim() || candidate.note } : candidate),
          substitutionEvents: state.substitutionEvents.map((event) => event.sessionId === request.sessionId ? {
            ...event,
            postFeedback: {
              difficulty: feedbackValue('difficulty'), targetStimulus: feedbackValue('targetStimulus'),
              technique: feedbackValue('technique'), pain: feedbackValue('pain'), enjoyment: feedbackValue('enjoyment'), skipped: false
            }
          } : event),
          placementVerifications,
          deferredFeedback: state.deferredFeedback.map((candidate) => candidate.id === requestId
            ? { ...candidate, status: 'completed' as const, resolvedAt: now.toISOString(), surveyId }
            : candidate),
          notice: qualityConfirmed
            ? 'Feedback added. Quality-dependent records were replayed from the original completed sets.'
            : 'Feedback added. Missing technique or pain remains unknown, so numeric bests stay unverified.'
        })
        return { ok: true }
      },
      dismissDeferredFeedback: (requestId) => {
        const state = get()
        const request = state.deferredFeedback.find((candidate) => candidate.id === requestId)
        if (!request || request.status !== 'pending') return { ok: false, error: 'That feedback request is no longer available.' }
        const now = new Date()
        if (new Date(request.expiresAt).getTime() <= now.getTime()) {
          set({ deferredFeedback: expireDeferredFeedbackRequests(state.deferredFeedback, now), notice: 'That optional feedback window expired. Nothing about your workout or progress changed.' })
          return { ok: true }
        }
        const surveyId = nanoid()
        const evidence = summarizeSurveyEvidence([], true)
        set({
          surveys: [...state.surveys, { id: surveyId, sessionId: request.sessionId, type: 'post', completedAt: now.toISOString(), answers: [], skipped: true, mode: request.mode, ...evidence }],
          deferredFeedback: state.deferredFeedback.map((candidate) => candidate.id === requestId
            ? { ...candidate, status: 'dismissed' as const, resolvedAt: now.toISOString(), surveyId }
            : candidate),
          notice: 'Optional feedback dismissed. Your workout, progress, and future access are unchanged.'
        })
        return { ok: true }
      },
      expireDeferredFeedback: () => set((state) => ({ deferredFeedback: expireDeferredFeedbackRequests(state.deferredFeedback) })),
      skipExercise: (sessionId, plannedExerciseId) => set((state) => ({
        sessions: state.sessions.map((session) => session.id !== sessionId ? session : {
          ...session,
          exercises: session.exercises.filter((exercise) => exercise.id !== plannedExerciseId)
        })
      })),
      addSetToExercise: (sessionId, plannedExerciseId) => {
        const state = get()
        const session = state.sessions.find((candidate) => candidate.id === sessionId)
        if (!session) return { ok: false, error: 'That workout is no longer open.' }
        const planned = session.exercises.find((exercise) => exercise.id === plannedExerciseId)
        if (!planned) return { ok: false, error: 'That movement is no longer part of this workout.' }
        const gate = sessionExtensionGate({
          sessionStatus: session.status,
          readiness: session.readiness,
          painReported: state.placementVerifications.some((event) => event.sessionId === sessionId && event.status === 'active' && event.warmupResponse === 'painful')
        })
        if (!gate.allowed) return { ok: false, error: gate.reason }
        const exercise = state.exercises.find((candidate) => candidate.id === planned.exerciseId)
        const activeEquipmentProfile = state.equipmentProfiles.find((profile) => profile.id === state.settings.activeEquipmentProfileId) ?? state.equipmentProfiles[0]
        if (exercise && activeEquipmentProfile && !exerciseEquipmentFit(exercise, activeEquipmentProfile).available) {
          return { ok: false, error: `${exercise.name} is unavailable at ${activeEquipmentProfile.name}. Change the movement before adding a set.` }
        }
        const addedSet = buildAddedSet({ sets: planned.sets, id: `set-added-${nanoid(8)}` })
        set({
          sessions: state.sessions.map((candidate) => candidate.id !== sessionId ? candidate : {
            ...candidate,
            exercises: candidate.exercises.map((item) => item.id !== plannedExerciseId ? item : { ...item, sets: [...item.sets, addedSet] })
          })
        })
        return { ok: true }
      },
      applySetStructure: (sessionId, plannedExerciseId, setId, kind) => {
        const state = get()
        const session = state.sessions.find((candidate) => candidate.id === sessionId)
        if (!session) return { ok: false, error: 'That workout is no longer open.' }
        const planned = session.exercises.find((exercise) => exercise.id === plannedExerciseId)
        if (!planned) return { ok: false, error: 'That movement is no longer part of this workout.' }
        const gate = structureAllowedForRole(planned.role, kind)
        if (!gate.allowed) return { ok: false, error: gate.reason }
        const target = planned.sets.find((workSet) => workSet.id === setId)
        if (!target) return { ok: false, error: 'That set is no longer part of this movement.' }
        if (target.completed) return { ok: false, error: 'That set is already logged. Apply the technique before you log the work.' }
        if (target.grouping) return { ok: false, error: 'That set already uses a technique. Clear it first.' }
        const exercise = state.exercises.find((candidate) => candidate.id === planned.exerciseId)
        const activeEquipmentProfile = state.equipmentProfiles.find((profile) => profile.id === state.settings.activeEquipmentProfileId) ?? state.equipmentProfiles[0]
        const groupId = `group-${nanoid(8)}`
        const built = kind === 'drop-set'
          ? buildDropSet({ topSet: target, groupId, increment: exercise && activeEquipmentProfile ? loadIncrementFor(exercise, activeEquipmentProfile).value : 5 })
          : buildMyoReps({ activationSet: target, groupId })
        set({
          sessions: state.sessions.map((candidate) => candidate.id !== sessionId ? candidate : {
            ...candidate,
            exercises: candidate.exercises.map((item) => item.id !== plannedExerciseId ? item : {
              ...item,
              sets: item.sets.flatMap((workSet) => workSet.id === setId ? built : [workSet])
            })
          })
        })
        return { ok: true }
      },
      applySuperset: (sessionId, plannedExerciseId, partnerPlannedExerciseId) => {
        const state = get()
        const session = state.sessions.find((candidate) => candidate.id === sessionId)
        if (!session) return { ok: false, error: 'That workout is no longer open.' }
        const planned = session.exercises.find((exercise) => exercise.id === plannedExerciseId)
        const partner = session.exercises.find((exercise) => exercise.id === partnerPlannedExerciseId)
        if (!planned || !partner) return { ok: false, error: 'Both movements must still be part of this workout.' }
        for (const item of [planned, partner]) {
          const gate = structureAllowedForRole(item.role, 'superset')
          if (!gate.allowed) return { ok: false, error: gate.reason }
        }
        const exercise = state.exercises.find((candidate) => candidate.id === planned.exerciseId)
        const partnerExercise = state.exercises.find((candidate) => candidate.id === partner.exerciseId)
        if (!exercise || !partnerExercise) return { ok: false, error: 'One of those movements is no longer in the catalog.' }
        const pairing = canPairForSuperset(exercise, partnerExercise)
        if (!pairing.allowed) return { ok: false, error: pairing.reason }
        if (planned.sets.some((workSet) => workSet.grouping) || partner.sets.some((workSet) => workSet.grouping)) {
          return { ok: false, error: 'One of those movements already uses a technique. Clear it first.' }
        }
        const groupId = `group-${nanoid(8)}`
        const pair = (item: typeof planned) => ({
          ...item,
          sets: item.sets.map((workSet, index) => ({ ...workSet, grouping: { groupId, groupKind: 'superset' as const, groupRole: 'paired' as const, groupPosition: index + 1 } }))
        })
        set({
          sessions: state.sessions.map((candidate) => candidate.id !== sessionId ? candidate : {
            ...candidate,
            exercises: candidate.exercises.map((item) => item.id === plannedExerciseId ? pair(planned) : item.id === partnerPlannedExerciseId ? pair(partner) : item)
          })
        })
        return { ok: true }
      },
      clearSetStructure: (sessionId, groupId) => {
        const state = get()
        const session = state.sessions.find((candidate) => candidate.id === sessionId)
        if (!session) return { ok: false, error: 'That workout is no longer open.' }
        const grouped = session.exercises.flatMap((item) => item.sets.filter((workSet) => workSet.grouping?.groupId === groupId))
        if (grouped.some((workSet) => workSet.completed)) {
          return { ok: false, error: 'Some of that work is already logged. Completed sets keep the structure they were performed in.' }
        }
        set({
          sessions: state.sessions.map((candidate) => candidate.id !== sessionId ? candidate : {
            ...candidate,
            exercises: candidate.exercises.map((item) => ({
              ...item,
              // Added drops and mini sets disappear; the set that carried the prescription stays.
              sets: item.sets.filter((workSet) => workSet.grouping?.groupId !== groupId || ['top', 'activation', 'paired'].includes(workSet.grouping.groupRole))
                .map((workSet) => workSet.grouping?.groupId === groupId ? { ...workSet, grouping: undefined } : workSet)
            }))
          })
        })
        return { ok: true }
      },
      addMovementToSession: (sessionId, exerciseId) => {
        const state = get()
        const session = state.sessions.find((candidate) => candidate.id === sessionId)
        if (!session) return { ok: false, error: 'That workout is no longer open.' }
        const gate = sessionExtensionGate({
          sessionStatus: session.status,
          readiness: session.readiness,
          painReported: state.placementVerifications.some((event) => event.sessionId === sessionId && event.status === 'active' && event.warmupResponse === 'painful')
        })
        if (!gate.allowed) return { ok: false, error: gate.reason }
        const exercise = state.exercises.find((candidate) => candidate.id === exerciseId)
        if (!exercise) return { ok: false, error: 'That movement is not in the catalog.' }
        if (session.exercises.some((item) => item.exerciseId === exerciseId)) {
          return { ok: false, error: `${exercise.name} is already in this workout. Add a set to it instead.` }
        }
        const activeEquipmentProfile = state.equipmentProfiles.find((profile) => profile.id === state.settings.activeEquipmentProfileId) ?? state.equipmentProfiles[0]
        if (activeEquipmentProfile && !exerciseEquipmentFit(exercise, activeEquipmentProfile).available) {
          return { ok: false, error: `${exercise.name} is unavailable at ${activeEquipmentProfile.name}.` }
        }
        const planned = buildAddedMovement({
          id: `planned-added-${nanoid(8)}`,
          setIdPrefix: `set-added-${nanoid(8)}`,
          exercise,
          history: state.history
        })
        set({
          sessions: state.sessions.map((candidate) => candidate.id !== sessionId ? candidate : {
            ...candidate,
            exercises: [...candidate.exercises, planned]
          })
        })
        return { ok: true }
      },
      markMissed: (sessionId, context) => {
        const state = get()
        const activeEquipmentProfile = state.equipmentProfiles.find((profile) => profile.id === state.settings.activeEquipmentProfileId) ?? state.equipmentProfiles[0]
        const verification = summarizePlacementVerification(state.placementVerifications, state.athlete.placement.createdAt)
        const safetyGateActive = state.athlete.placement.selectedRoute === 'pain-aware-modified' || state.athlete.placement.inputs.painState === 'modifying' || verification.blocked
        const result = buildMissedOpportunityReplan({
          eventId: nanoid(),
          sessions: state.sessions,
          history: state.history,
          priorEvents: state.missedOpportunityEvents,
          missedSessionId: sessionId,
          input: context,
          continuity: state.athlete.continuity,
          weeklyOpportunities: state.athlete.weeklyOpportunities,
          priorityRegions: state.athlete.priorityRegions,
          exercises: state.exercises,
          equipmentProfile: activeEquipmentProfile,
          surveys: state.surveys,
          safetyGateActive,
          safetyGateReason: safetyGateActive ? 'Automatic schedule rebuilding is paused because the current pain or restriction evidence changes what can be trained. Reassess the profile before rebuilding. This is not medical clearance.' : undefined
        })
        if (!result.ok) return result
        const removedSets = result.event.openSetCountBefore - result.event.openSetCountAfter
        set({
          sessions: result.sessions,
          missedOpportunityEvents: [...state.missedOpportunityEvents, result.event],
          athlete: { ...state.athlete, continuity: result.continuity },
          settings: { ...state.settings, availableMinutes: context.nextMinutes },
          notice: `Queue rebuilt from completed exposures. ${removedSets} optional or time-limited set${removedSets === 1 ? '' : 's'} removed; no catch-up work added.`
        })
        return { ok: true, event: result.event }
      },
      toggleFavorite: (exerciseId) => set((state) => ({ exercises: state.exercises.map((exercise) => exercise.id === exerciseId ? { ...exercise, favorite: !exercise.favorite, disliked: false } : exercise) })),
      setExercisePreference: (exerciseId, preference) => set((state) => ({
        exercises: state.exercises.map((exercise) => exercise.id === exerciseId
          ? { ...exercise, favorite: preference === 'preferred', disliked: preference === 'avoid' }
          : exercise)
      })),
      setJointFeeling: (exerciseId, jointFeeling) => set((state) => ({ exercises: state.exercises.map((exercise) => exercise.id === exerciseId ? { ...exercise, jointFeeling } : exercise) })),
      addCustomExercise: (exercise) => set((state) => ({ exercises: [...state.exercises, exercise] })),
      updateExerciseCatalog: (exerciseId, input, reason) => {
        const state = get()
        if (!reason.trim()) return { ok: false, error: 'Add a short reason so the catalog change remains auditable.' }
        try {
          const projection = projectExerciseCatalogEdit(state.exercises, exerciseId, input)
          const exercises = state.exercises.map((exercise) => exercise.id === exerciseId ? projection.exercise : exercise)
          const affectedSetIds = state.history.filter((workSet) => workSet.exerciseId === exerciseId).map((workSet) => workSet.id)
          const priorExercise = state.exercises.find((exercise) => exercise.id === exerciseId)
          const mappingChanged = !sameJsonValue(priorExercise?.muscleMapping ?? null, projection.exercise.muscleMapping ?? null)
          const event: HistoryMutationEvent = {
            id: nanoid(), type: 'exercise-edited', createdAt: new Date().toISOString(), reason: reason.trim(),
            description: mappingChanged
              ? `${priorExercise?.name ?? 'Movement'} muscle-dose mapping ${projection.exercise.muscleMapping ? 'reviewed and updated' : 'removed'} with its catalog identity preserved.`
              : `${priorExercise?.name ?? 'Movement'} catalog identity updated to ${projection.exercise.name}.`,
            affectedSetIds,
            before: { history: state.history, exercises: state.exercises, sessions: state.sessions, athlete: state.athlete, substitutionEvents: state.substitutionEvents },
            after: { history: state.history, exercises, sessions: state.sessions, athlete: state.athlete, substitutionEvents: state.substitutionEvents },
            recordsBefore: state.records, recordsAfter: state.records,
            volumeBefore: historyVolume(state.history), volumeAfter: historyVolume(state.history)
          }
          set({
            exercises,
            historyMutations: [...state.historyMutations, event],
            notice: `${projection.exercise.name} saved with its stable history ID.${mappingChanged ? ' Completed and planned muscle dose replayed from the reviewed mapping.' : ' Prior completed-set names remain unchanged.'}${projection.probableDuplicates.length ? ' A possible related variation remains in Data quality.' : ''}`
          })
          return { ok: true, exercise: projection.exercise }
        } catch (error) {
          return { ok: false, error: error instanceof Error ? error.message : 'The movement catalog could not be updated.' }
        }
      },
      correctHistorySet: (setId, data, reason) => {
        const state = get()
        const workSet = state.history.find((candidate) => candidate.id === setId)
        if (!workSet) return { ok: false, error: 'That completed set could not be found.' }
        if (!reason.trim()) return { ok: false, error: 'Add a short reason so the correction remains auditable.' }
        if ([data.reps, data.load, data.rir, data.technique, data.pain].some((value) => !Number.isFinite(value) || value < 0)) return { ok: false, error: 'Use valid zero-or-greater numbers.' }
        if (Number.isNaN(new Date(data.completedAt).getTime())) return { ok: false, error: 'Use a valid completion date.' }
        const correctedData = { ...data, benchAngleDeg: data.benchAngleDeg === null ? undefined : data.benchAngleDeg }
        const history = state.history.map((candidate) => candidate.id === setId ? {
          ...candidate,
          ...correctedData,
          rirKnown: true,
          ...(candidate.historyEntryId ? {
            historyEntryUnits: state.settings.units,
            historyEntryEffortScale: 'rir' as const,
            historyEntryEffortValue: data.rir
          } : {})
        } : candidate)
        const records = derivePersonalRecords(history)
        const event: HistoryMutationEvent = {
          id: nanoid(), type: 'set-corrected', createdAt: new Date().toISOString(), reason: reason.trim(),
          description: `${workSet.exerciseName}: ${workSet.load} × ${workSet.reps} corrected to ${data.load} × ${data.reps}.`,
          affectedSetIds: [setId], before: { history: state.history, exercises: state.exercises, sessions: state.sessions, substitutionEvents: state.substitutionEvents },
          after: { history, exercises: state.exercises, sessions: state.sessions, substitutionEvents: state.substitutionEvents }, recordsBefore: state.records, recordsAfter: records,
          volumeBefore: historyVolume(state.history), volumeAfter: historyVolume(history)
        }
        set({ history, records, historyMutations: [...state.historyMutations, event], notice: `Set corrected. Volume changed by ${(event.volumeAfter - event.volumeBefore).toLocaleString()} and every record was replayed.` })
        return { ok: true }
      },
      deleteHistorySet: (setId, reason) => {
        const state = get()
        const workSet = state.history.find((candidate) => candidate.id === setId)
        if (!workSet) return { ok: false, error: 'That completed set could not be found.' }
        if (!reason.trim()) return { ok: false, error: 'Add a short reason so the deletion remains auditable.' }
        const history = state.history.filter((candidate) => candidate.id !== setId)
        const records = derivePersonalRecords(history)
        const substitutionEvents = state.substitutionEvents.map((event) => {
          if (!event.sourceSetIds.includes(setId)) return event
          const sourceSetIds = event.sourceSetIds.filter((sourceId) => sourceId !== setId)
          return { ...event, sourceSetIds, outcome: sourceSetIds.length === 0 ? 'not-completed' as const : sourceSetIds.length >= event.replacementPrescription.length ? 'completed' as const : 'partial' as const }
        })
        const event: HistoryMutationEvent = {
          id: nanoid(), type: 'set-deleted', createdAt: new Date().toISOString(), reason: reason.trim(),
          description: `${workSet.exerciseName}: ${workSet.load} × ${workSet.reps} removed from completed history.`,
          affectedSetIds: [setId], before: { history: state.history, exercises: state.exercises, sessions: state.sessions, substitutionEvents: state.substitutionEvents },
          after: { history, exercises: state.exercises, sessions: state.sessions, substitutionEvents }, recordsBefore: state.records, recordsAfter: records,
          volumeBefore: historyVolume(state.history), volumeAfter: historyVolume(history)
        }
        set({ history, records, substitutionEvents, historyMutations: [...state.historyMutations, event], notice: 'Set removed. Volume, charts, exposure history, substitution outcomes, and records were replayed.' })
        return { ok: true }
      },
      mergeExercises: (sourceIds, targetId, reason) => {
        const state = get()
        if (state.activeSessionId) return { ok: false, error: 'Finish or leave the active workout before merging movements.' }
        if (!reason.trim()) return { ok: false, error: 'Add a short reason so the merge remains auditable.' }
        try {
          const projection = projectExerciseMerge({ exercises: state.exercises, history: state.history, sessions: state.sessions, athlete: state.athlete, sourceIds, targetId })
          const records = derivePersonalRecords(projection.history)
          const movementNotes = projectMovementNoteMerge(state.movementNotes, sourceIds, projection.target)
          const affectedSetIds = state.history.filter((workSet) => sourceIds.includes(workSet.exerciseId)).map((workSet) => workSet.id)
          const event: HistoryMutationEvent = {
            id: nanoid(), type: 'exercise-merged', createdAt: new Date().toISOString(), reason: reason.trim(),
            description: `${projection.sources.map((exercise) => exercise.name).join(', ')} merged into ${projection.target.name}.`, affectedSetIds,
            before: { history: state.history, exercises: state.exercises, sessions: state.sessions, athlete: state.athlete, substitutionEvents: state.substitutionEvents, movementNotes: state.movementNotes },
            after: { history: projection.history, exercises: projection.exercises, sessions: projection.sessions, athlete: projection.athlete, substitutionEvents: state.substitutionEvents, movementNotes },
            recordsBefore: state.records, recordsAfter: records, volumeBefore: historyVolume(state.history), volumeAfter: historyVolume(projection.history)
          }
          set({ exercises: projection.exercises, history: projection.history, movementNotes, sessions: projection.sessions, athlete: projection.athlete, records, historyMutations: [...state.historyMutations, event], notice: `${affectedSetIds.length} source sets and ${movementNotes.filter((note) => note.originalExerciseId && sourceIds.includes(note.originalExerciseId)).length} movement notes now share ${projection.target.name}. Original names and an undo snapshot were preserved.` })
          return { ok: true }
        } catch (error) {
          return { ok: false, error: error instanceof Error ? error.message : 'The movements could not be merged.' }
        }
      },
      importCompletedHistory: (importedRecords, sourceName, skippedDuplicates) => {
        const state = get()
        if (state.activeSessionId) return { ok: false, error: 'Finish or leave the active workout before importing history.' }
        if (!sourceName.trim()) return { ok: false, error: 'The import source name is missing.' }
        if (importedRecords.length === 0) {
          set({ notice: skippedDuplicates ? `No sets added. All ${skippedDuplicates} rows already exist from an earlier import.` : 'No completed sets were available to import.' })
          return { ok: true }
        }
        const existingSetIds = new Set(state.history.map((workSet) => workSet.id))
        const activeExerciseIds = new Set(state.exercises.filter((exercise) => !exercise.retired).map((exercise) => exercise.id))
        if (importedRecords.some((workSet) => existingSetIds.has(workSet.id))) return { ok: false, error: 'This import would reuse an existing source-set ID.' }
        if (importedRecords.some((workSet) => !activeExerciseIds.has(workSet.exerciseId))) return { ok: false, error: 'Every imported row must map to an active canonical movement.' }
        if (importedRecords.some((workSet) => !workSet.importBatchId || !workSet.importFingerprint || !workSet.importSourceName || !Number.isInteger(workSet.importRow))) return { ok: false, error: 'Imported source provenance is incomplete.' }
        const history = [...state.history, ...importedRecords]
        const records = derivePersonalRecords(history)
        const event: HistoryMutationEvent = {
          id: nanoid(), type: 'history-imported', createdAt: new Date().toISOString(), reason: `Validated CSV import from ${sourceName.trim()}`,
          description: `${importedRecords.length} completed set${importedRecords.length === 1 ? '' : 's'} imported from ${sourceName.trim()}.`,
          affectedSetIds: importedRecords.map((workSet) => workSet.id),
          before: { history: state.history, exercises: state.exercises, sessions: state.sessions, athlete: state.athlete, substitutionEvents: state.substitutionEvents },
          after: { history, exercises: state.exercises, sessions: state.sessions, athlete: state.athlete, substitutionEvents: state.substitutionEvents },
          recordsBefore: state.records, recordsAfter: records,
          volumeBefore: historyVolume(state.history), volumeAfter: historyVolume(history)
        }
        set({
          history,
          records,
          historyMutations: [...state.historyMutations, event],
          notice: `${importedRecords.length} source set${importedRecords.length === 1 ? '' : 's'} imported and replayed.${skippedDuplicates ? ` ${skippedDuplicates} existing duplicate row${skippedDuplicates === 1 ? ' was' : 's were'} skipped.` : ''}`
        })
        return { ok: true }
      },
      addHistoricalPerformance: (input) => {
        const state = get()
        if (state.activeSessionId) return { ok: false, error: 'Finish or leave the active workout before adding past performance.' }
        const exercise = state.exercises.find((candidate) => candidate.id === input.exerciseId)
        try {
          if (!exercise) throw new Error('That movement is no longer in the Library.')
          const projection = buildHistoricalPerformance({
            entryId: nanoid(10),
            form: input,
            exercise,
            appUnits: state.settings.units
          })
          const existingSetIds = new Set(state.history.map((workSet) => workSet.id))
          if (projection.records.some((workSet) => existingSetIds.has(workSet.id))) return { ok: false, error: 'This past performance would reuse an existing source-set ID.' }
          const history = [...state.history, ...projection.records]
          const records = derivePersonalRecords(history)
          const event: HistoryMutationEvent = {
            id: nanoid(), type: 'history-entered', createdAt: new Date().toISOString(), reason: 'Athlete-entered exact movement history',
            description: `${projection.records.length} past ${exercise.name} set${projection.records.length === 1 ? '' : 's'} added from the Library.`,
            affectedSetIds: projection.records.map((workSet) => workSet.id),
            before: { history: state.history, exercises: state.exercises, sessions: state.sessions, athlete: state.athlete, substitutionEvents: state.substitutionEvents },
            after: { history, exercises: state.exercises, sessions: state.sessions, athlete: state.athlete, substitutionEvents: state.substitutionEvents },
            recordsBefore: state.records, recordsAfter: records,
            volumeBefore: historyVolume(state.history), volumeAfter: historyVolume(history)
          }
          set({
            history,
            records,
            historyMutations: [...state.historyMutations, event],
            notice: `${projection.records.length} past set${projection.records.length === 1 ? '' : 's'} added to ${exercise.name}. Future programming can now use this exact movement, load, setup, date, and effort evidence.`
          })
          return { ok: true, records: projection.records }
        } catch (error) {
          return { ok: false, error: error instanceof Error ? error.message : 'That past performance could not be added.' }
        }
      },
      undoLatestHistoryMutation: () => {
        const state = get()
        const event = [...state.historyMutations].reverse().find((candidate) => !candidate.undoneAt)
        if (!event) return { ok: false, error: 'There is no history change to undo.' }
        const historyMutations = state.historyMutations.map((candidate) => candidate.id === event.id ? { ...candidate, undoneAt: new Date().toISOString() } : candidate)
        set({
          history: structuredClone(event.before.history), exercises: structuredClone(event.before.exercises), sessions: structuredClone(event.before.sessions),
          athlete: event.before.athlete ? structuredClone(event.before.athlete) : state.athlete,
          substitutionEvents: event.before.substitutionEvents ? structuredClone(event.before.substitutionEvents) : state.substitutionEvents,
          movementNotes: event.before.movementNotes ? structuredClone(event.before.movementNotes) : state.movementNotes,
          records: structuredClone(event.recordsBefore), historyMutations,
          notice: `Undid: ${event.description} Charts and records now reflect the restored source data.`
        })
        return { ok: true }
      },
      applyMesocycleRevision: (draft) => {
        const state = get()
        if (state.activeSessionId) return { ok: false, error: 'Finish or leave the active workout before revising the training block.' }
        if (!draft.revisionReason.trim()) return { ok: false, error: 'Add a short reason so this plan change stays explainable.' }
        if (draft.strengthAnchors.length === 0) return { ok: false, error: 'Choose at least one protected strength anchor.' }
        const activePlan = state.mesocycles.find((plan) => plan.id === state.activeMesocycleId)
          ?? [...state.mesocycles].sort((a, b) => b.version - a.version)[0]
        const nextVersion = Math.max(0, ...state.mesocycles.map((plan) => plan.version)) + 1
        const planId = `mesocycle-${nanoid()}`
        const effectiveAt = new Date().toISOString()
        const currentRound = activePlan
          ? Math.max(1, ...state.sessions.filter((session) => session.mesocycleId === activePlan.id).map((session) => session.microcycleNumber ?? 1))
          : 1
        const generationProfile = state.equipmentProfiles.find((candidate) => candidate.id === state.settings.activeEquipmentProfileId) ?? state.equipmentProfiles[0]
        const hasCompleteMovementPlacement = draft.strengthAnchors.every((exerciseId) => draft.movementPlacements?.some((placement) => placement.exerciseId === exerciseId))
        const nextDraft = draft.entryRoute
          ? {
              ...draft,
              generationRuleVersion: hasCompleteMovementPlacement ? ROUTE_SESSION_RULE_VERSION : EQUIPMENT_ROUTE_SESSION_RULE_VERSION,
              generationEquipment: equipmentGenerationEvidence(generationProfile),
              movementPlacements: hasCompleteMovementPlacement ? structuredClone(draft.movementPlacements) : undefined
            }
          : { ...draft, movementPlacements: undefined, generationEquipment: undefined }
        let preview: ReturnType<typeof buildMesocyclePreview>
        try {
          preview = buildMesocyclePreview(nextDraft, {
            exercises: state.exercises,
            currentSessions: state.sessions,
            history: state.history,
            planId,
            planVersion: nextVersion,
            startsAt: new Date(effectiveAt),
            microcycleNumber: currentRound,
            equipmentProfile: generationProfile
          })
        } catch (error) {
          return { ok: false, error: error instanceof Error ? error.message : 'The training-block blueprint could not be generated.' }
        }
        const generatedSlots = new Set(preview.sessions.flatMap((session, sessionIndex) => session.exercises.map((_, slotIndex) => `${sessionIndex}:${slotIndex}`)))
        const appliedDraft = {
          ...nextDraft,
          movementOverrides: nextDraft.movementOverrides?.filter((choice) => generatedSlots.has(`${choice.sessionIndex}:${choice.slotIndex}`))
        }
        const nextPlan = createMesocyclePlan(appliedDraft, planId, nextVersion, effectiveAt, activePlan?.id ?? null, preview.sessions.map((session) => session.id))
        const revised = replaceFuturePlan(state.sessions, state.mesocycles, nextPlan, preview.sessions)
        set({
          sessions: revised.sessions,
          mesocycles: revised.plans,
          activeMesocycleId: nextPlan.id,
          athlete: {
            ...state.athlete,
            goal: draft.objective,
            weeklyOpportunities: draft.weeklyOpportunities,
            defaultMinutes: draft.defaultMinutes,
            strengthAnchors: [...draft.strengthAnchors],
            priorityRegions: [...draft.priorityRegions]
          },
          settings: { ...state.settings, availableMinutes: draft.defaultMinutes },
          notice: `Training-block version ${nextVersion} is active. Completed work and prior plan versions were preserved.`
        })
        return { ok: true }
      },
      applyCycleReview: (decision, reason) => {
        const state = get()
        if (state.activeSessionId) return { ok: false, error: 'Finish or leave the active workout before reviewing the training round.' }
        if (!reason.trim()) return { ok: false, error: 'Add a short reason so the cycle decision remains explainable.' }
        const plan = state.mesocycles.find((candidate) => candidate.id === state.activeMesocycleId && candidate.status === 'active')
        if (!plan) return { ok: false, error: 'There is no active training block to review.' }
        const reviewedAt = new Date()
        const summary = buildCycleReview(plan, state.sessions, state.history, reviewedAt, state.surveys)
        if (!summary.eligible[decision]) return { ok: false, error: decision === 'extend' ? 'Extension becomes available after the target date and before the maximum span.' : 'Complete the important workouts in this training round before choosing that decision.' }
        const currentRoundSessions = state.sessions.filter((session) => session.mesocycleId === plan.id && (session.microcycleNumber ?? 1) === summary.microcycleNumber)
        const unresolvedIds = currentRoundSessions.filter((session) => ['planned', 'active', 'deferred'].includes(session.status)).map((session) => session.id)
        let sessions = state.sessions
        let generated: TrainingSession[] = []
        let expiredSessionIds: string[] = []
        let mesocycles = state.mesocycles
        let activeMesocycleId: string | null = state.activeMesocycleId

        if (decision === 'extend') {
          sessions = sessions.map((session) => unresolvedIds.includes(session.id) ? { ...session, plannedDate: new Date(new Date(session.plannedDate).getTime() + 7 * 86_400_000).toISOString(), status: 'planned' as const, dayLabel: 'Extended protected exposure' } : session)
        } else if (decision === 'recover' || (['continue-progress', 'continue-hold'].includes(decision) && summary.evidence.unresolvedSessions === 0)) {
          if (decision === 'recover') {
            expiredSessionIds = unresolvedIds
            sessions = sessions.map((session) => unresolvedIds.includes(session.id) ? { ...session, status: 'expired' as const } : session)
          }
          generated = buildNextMicrocycle({
            plan, sessions, history: state.history, exercises: state.exercises,
            surveys: state.surveys,
            decision: decision as 'continue-progress' | 'continue-hold' | 'recover',
            nextMicrocycleNumber: summary.microcycleNumber + 1,
            startsAt: new Date(reviewedAt.getTime() + 86_400_000),
            key: nanoid(6),
            equipmentProfile: state.equipmentProfiles.find((candidate) => candidate.id === state.settings.activeEquipmentProfileId) ?? state.equipmentProfiles[0]
          })
          sessions = [...sessions, ...generated]
          mesocycles = mesocycles.map((candidate) => candidate.id === plan.id ? { ...candidate, sessionIds: [...candidate.sessionIds, ...generated.map((session) => session.id)] } : candidate)
        } else if (decision === 'complete') {
          expiredSessionIds = state.sessions.filter((session) => session.mesocycleId === plan.id && ['planned', 'active', 'deferred'].includes(session.status)).map((session) => session.id)
          sessions = state.sessions.map((session) => expiredSessionIds.includes(session.id) ? { ...session, status: 'expired' as const } : session)
          mesocycles = state.mesocycles.map((candidate) => candidate.id === plan.id ? { ...candidate, status: 'completed' as const } : candidate)
          activeMesocycleId = null
        }

        const event: CycleReviewEvent = {
          id: nanoid(), mesocycleId: plan.id, planVersion: plan.version, microcycleNumber: summary.microcycleNumber,
          decision, createdAt: reviewedAt.toISOString(), reason: reason.trim(), recommendation: summary.recommendation,
          recommendationReasons: summary.recommendationReasons, evidence: summary.evidence,
          generatedSessionIds: generated.map((session) => session.id), expiredSessionIds
        }
        set({
          sessions, mesocycles, activeMesocycleId, cycleReviews: [...state.cycleReviews, event],
          notice: decision === 'complete'
            ? 'Training block completed from workout evidence. Prior versions and completed work remain intact.'
            : generated.length
              ? `Training round ${summary.microcycleNumber + 1} is queued from the recorded review decision.`
              : decision === 'extend'
                ? 'The unfinished training round was extended without adding catch-up work.'
                : 'The current training round remains active at the same targets.'
        })
        return { ok: true }
      },
      restoreBackup: (data) => set((state) => {
        const equipmentProfiles = mergeSystemEquipmentProfiles(data.equipmentProfiles, seedEquipmentProfiles)
        const requestedProfile = equipmentProfiles.find((profile) => profile.id === data.settings.activeEquipmentProfileId)
          ?? equipmentProfiles.find((profile) => profile.name === data.settings.equipmentLocation)
          ?? equipmentProfiles.find((profile) => profile.id === initialSettings.activeEquipmentProfileId)
          ?? equipmentProfiles[0]
        const restored = backupStateFrom({
          ...data,
          exercises: mergeSystemExerciseCatalog(data.exercises, seedExercises),
          equipmentProfiles,
          settings: { ...data.settings, activeEquipmentProfileId: requestedProfile.id, equipmentLocation: requestedProfile.name },
          athlete: { ...data.athlete, equipmentProfile: requestedProfile.name }
        })
        return {
          ...restored,
          recoverySnapshot: backupStateFrom(state),
          nav: data.activeSessionId ? state.nav : 'today',
          notice: `Backup restored: ${data.history.length} completed sets and ${restored.exercises.length} exercises are active.`
        }
      }),
      undoLastRestore: () => set((state) => state.recoverySnapshot ? ({
        ...backupStateFrom(state.recoverySnapshot),
        recoverySnapshot: null,
        nav: 'you',
        notice: 'The previous local state has been restored.'
      }) : ({ notice: 'No restore point is available.' })),
      resetForTesting: () => set({ nav: 'today', notice: null, ...cleanTestingStart() })
    }),
    {
      name: LEGACY_APP_STORAGE_KEY,
      version: 33,
      storage: createJSONStorage(() => browserStateStorage),
      partialize: (state) => ({
        athlete: state.athlete,
        settings: state.settings,
        equipmentProfiles: state.equipmentProfiles,
        exercises: state.exercises,
        sessions: state.sessions,
        history: state.history,
        movementNotes: state.movementNotes,
        surveys: state.surveys,
        deferredFeedback: state.deferredFeedback,
        records: state.records,
        historyMutations: state.historyMutations,
        cycleReviews: state.cycleReviews,
        substitutionEvents: state.substitutionEvents,
        placementVerifications: state.placementVerifications,
        placementExitReviews: state.placementExitReviews,
        movementPlacementExitReviews: state.movementPlacementExitReviews,
        missedOpportunityEvents: state.missedOpportunityEvents,
        mesocycles: state.mesocycles,
        activeMesocycleId: state.activeMesocycleId,
        activeSessionId: state.activeSessionId,
        workoutVisible: state.workoutVisible,
        onboardingComplete: state.onboardingComplete,
        recoverySnapshot: state.recoverySnapshot
      }),
      migrate: (persistedState) => {
        const persisted = persistedState as AppState
        const equipmentProfiles = mergeSystemEquipmentProfiles(persisted.equipmentProfiles, seedEquipmentProfiles)
        const requestedProfileId = persisted.settings?.activeEquipmentProfileId
        const legacyProfile = equipmentProfiles.find((profile) => profile.id === requestedProfileId)
          ?? equipmentProfiles.find((profile) => profile.name === persisted.settings?.equipmentLocation)
          ?? equipmentProfiles[0]
        return {
          ...persisted,
          // Sessions stored before 0.42.0 carry the retired five-role vocabulary. They are mapped
          // forward rather than dropped, so an in-progress workout survives the upgrade intact.
          sessions: (persisted.sessions ?? []).map((session) => resetUnstartedSessionTrainingState({
            ...session,
            exercises: (session.exercises ?? []).map((exercise) => ({ ...exercise, role: normalizeExerciseRole(String(exercise.role)) }))
          })),
          exercises: mergeSystemExerciseCatalog(persisted.exercises, seedExercises),
          settings: { ...structuredClone(initialSettings), ...(persisted.settings ?? {}), activeEquipmentProfileId: legacyProfile.id, equipmentLocation: legacyProfile.name },
          equipmentProfiles,
          movementNotes: persisted.movementNotes ?? [],
          athlete: {
            ...persisted.athlete,
            equipmentProfile: legacyProfile.name,
            placement: persisted.athlete?.placement ?? legacyPlacementForAthlete(persisted.athlete ?? seedAthlete),
            level: {
              ...seedAthlete.level,
              ...(persisted.athlete?.level ?? {}),
              movementSkill: persisted.athlete?.level?.movementSkill ?? persisted.athlete?.level?.strengthTolerance ?? seedAthlete.level.movementSkill
            }
          },
          mesocycles: persisted.mesocycles ?? [],
          activeMesocycleId: persisted.activeMesocycleId ?? null,
          historyMutations: (persisted.historyMutations ?? []).map((event) => ({
            ...event,
            recordsBefore: derivePersonalRecords(event.before.history),
            recordsAfter: derivePersonalRecords(event.after.history)
          })),
          cycleReviews: persisted.cycleReviews ?? [],
          substitutionEvents: persisted.substitutionEvents ?? [],
          placementVerifications: persisted.placementVerifications ?? [],
          placementExitReviews: persisted.placementExitReviews ?? [],
          movementPlacementExitReviews: persisted.movementPlacementExitReviews ?? [],
          missedOpportunityEvents: persisted.missedOpportunityEvents ?? [],
          deferredFeedback: persisted.deferredFeedback ?? [],
          records: derivePersonalRecords(persisted.history ?? [])
        }
      }
    }
  )
)
