import { nanoid } from 'nanoid'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { athlete as seedAthlete, exercises as seedExercises, history as seedHistory, mesocycles as seedMesocycles, sessions as seedSessions } from '../domain/seed'
import { compressSession, readinessFromSurvey, replanAfterMiss, sessionCompletionStatus } from '../domain/training-engine'
import { backupStateFrom, type RestorableAppState } from '../domain/backup'
import { buildMesocyclePreview, createMesocyclePlan, replaceFuturePlan } from '../domain/mesocycle-engine'
import { derivePersonalRecords, historyVolume, projectExerciseMerge } from '../domain/history-engine'
import type {
  AppSettings,
  AthleteProfile,
  CompletedSetRecord,
  Exercise,
  HistoryMutationEvent,
  MesocycleDraft,
  MesocyclePlan,
  MissedSessionReason,
  NavKey,
  PersonalRecord,
  SurveyAnswer,
  SurveyRecord,
  TrainingSession
} from '../domain/types'

interface AppState {
  nav: NavKey
  athlete: AthleteProfile
  settings: AppSettings
  exercises: Exercise[]
  sessions: TrainingSession[]
  history: CompletedSetRecord[]
  surveys: SurveyRecord[]
  records: PersonalRecord[]
  mesocycles: MesocyclePlan[]
  historyMutations: HistoryMutationEvent[]
  activeMesocycleId: string | null
  activeSessionId: string | null
  onboardingComplete: boolean
  recoverySnapshot: RestorableAppState | null
  notice: string | null
  setNav: (nav: NavKey) => void
  setNotice: (notice: string | null) => void
  completeOnboarding: (profile: Partial<AthleteProfile>) => void
  updateAthlete: (profile: Partial<AthleteProfile>) => void
  updateSettings: (settings: Partial<AppSettings>) => void
  startSession: (sessionId: string, availableMinutes?: number) => void
  setReadiness: (sessionId: string, answers: SurveyAnswer[], skipped: boolean) => void
  updateSet: (sessionId: string, plannedExerciseId: string, setId: string, data: { reps?: number; load?: number; rir?: number }) => void
  toggleSetComplete: (sessionId: string, plannedExerciseId: string, setId: string) => void
  swapExercise: (sessionId: string, plannedExerciseId: string, exerciseId: string) => void
  finishSession: (sessionId: string, feedback: { answers: SurveyAnswer[]; note?: string; skipped: boolean }) => void
  skipExercise: (sessionId: string, plannedExerciseId: string) => void
  markMissed: (sessionId: string, context: MissedSessionReason) => void
  toggleFavorite: (exerciseId: string) => void
  setJointFeeling: (exerciseId: string, jointFeeling: Exercise['jointFeeling']) => void
  addCustomExercise: (exercise: Exercise) => void
  correctHistorySet: (setId: string, data: Pick<CompletedSetRecord, 'reps' | 'load' | 'rir' | 'technique' | 'pain' | 'completedAt'>, reason: string) => { ok: boolean; error?: string }
  deleteHistorySet: (setId: string, reason: string) => { ok: boolean; error?: string }
  mergeExercises: (sourceIds: string[], targetId: string, reason: string) => { ok: boolean; error?: string }
  undoLatestHistoryMutation: () => { ok: boolean; error?: string }
  applyMesocycleRevision: (draft: MesocycleDraft) => { ok: boolean; error?: string }
  restoreBackup: (data: RestorableAppState) => void
  undoLastRestore: () => void
  resetDemo: () => void
}

const initialSettings: AppSettings = {
  units: 'lb',
  preSurveyMode: 'ask',
  postSurveyMode: 'ask',
  focusedMode: false,
  reducedMotion: false,
  sounds: false,
  haptics: true,
  availableMinutes: 60,
  equipmentLocation: 'Commercial Gym'
}

const fresh = () => ({
  athlete: structuredClone(seedAthlete),
  settings: structuredClone(initialSettings),
  exercises: structuredClone(seedExercises),
  sessions: structuredClone(seedSessions),
  history: structuredClone(seedHistory),
  surveys: [] as SurveyRecord[],
  records: derivePersonalRecords(seedHistory),
  mesocycles: structuredClone(seedMesocycles),
  historyMutations: [] as HistoryMutationEvent[],
  activeMesocycleId: seedMesocycles[0]?.id ?? null,
  activeSessionId: null,
  onboardingComplete: false,
  recoverySnapshot: null as RestorableAppState | null
})

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      nav: 'today',
      notice: null,
      ...fresh(),
      setNav: (nav) => set({ nav }),
      setNotice: (notice) => set({ notice }),
      completeOnboarding: (profile) => set((state) => ({ athlete: { ...state.athlete, ...profile }, onboardingComplete: true })),
      updateAthlete: (profile) => set((state) => ({ athlete: { ...state.athlete, ...profile } })),
      updateSettings: (settings) => set((state) => ({ settings: { ...state.settings, ...settings } })),
      startSession: (sessionId, availableMinutes) => set((state) => {
        const minutes = availableMinutes ?? state.settings.availableMinutes
        return {
          activeSessionId: sessionId,
          sessions: state.sessions.map((session) => session.id === sessionId
            ? { ...compressSession(session, minutes), status: 'active', startedAt: new Date().toISOString() }
            : session),
          notice: 'Workout saved locally. You can train offline.'
        }
      }),
      setReadiness: (sessionId, answers, skipped) => set((state) => {
        const readiness = skipped ? undefined : readinessFromSurvey(answers, state.athlete.continuity)
        return {
          surveys: [...state.surveys, { id: nanoid(), sessionId, type: 'pre', completedAt: new Date().toISOString(), answers, skipped }],
          sessions: state.sessions.map((session) => session.id === sessionId ? { ...session, readiness } : session)
        }
      }),
      updateSet: (sessionId, plannedExerciseId, setId, data) => set((state) => ({
        sessions: state.sessions.map((session) => session.id !== sessionId ? session : {
          ...session,
          exercises: session.exercises.map((exercise) => exercise.id !== plannedExerciseId ? exercise : {
            ...exercise,
            sets: exercise.sets.map((workSet) => workSet.id === setId ? {
              ...workSet,
              completedReps: data.reps ?? workSet.completedReps,
              completedLoad: data.load ?? workSet.completedLoad,
              actualRir: data.rir ?? workSet.actualRir
            } : workSet)
          })
        })
      })),
      toggleSetComplete: (sessionId, plannedExerciseId, setId) => set((state) => ({
        sessions: state.sessions.map((session) => session.id !== sessionId ? session : {
          ...session,
          exercises: session.exercises.map((exercise) => exercise.id !== plannedExerciseId ? exercise : {
            ...exercise,
            sets: exercise.sets.map((workSet) => workSet.id === setId ? {
              ...workSet,
              completed: !workSet.completed,
              completedReps: workSet.completedReps ?? workSet.targetReps,
              completedLoad: workSet.completedLoad ?? workSet.targetLoad,
              actualRir: workSet.actualRir ?? workSet.targetRir
            } : workSet)
          })
        })
      })),
      swapExercise: (sessionId, plannedExerciseId, exerciseId) => set((state) => ({
        sessions: state.sessions.map((session) => session.id !== sessionId ? session : {
          ...session,
          exercises: session.exercises.map((exercise) => exercise.id !== plannedExerciseId ? exercise : {
            ...exercise,
            substitutedFrom: exercise.exerciseId,
            exerciseId,
            sets: exercise.sets.map((workSet) => ({ ...workSet, completed: false, completedLoad: undefined, completedReps: undefined, actualRir: undefined }))
          })
        }),
        notice: 'Movement changed. The original progression clock remains frozen.'
      })),
      finishSession: (sessionId, feedback) => {
        const state = get()
        const session = state.sessions.find((candidate) => candidate.id === sessionId)
        if (!session) return
        const completedAt = new Date().toISOString()
        const newHistory: CompletedSetRecord[] = session.exercises.flatMap((plannedExercise) => {
          const exercise = state.exercises.find((candidate) => candidate.id === plannedExercise.exerciseId)
          if (!exercise) return []
          return plannedExercise.sets.flatMap((workSet, setIndex) => workSet.completed ? [{
            id: nanoid(), sessionId, exerciseId: exercise.id, exerciseName: exercise.name, family: exercise.family,
            primaryRegion: exercise.primaryRegion, completedAt, reps: workSet.completedReps ?? workSet.targetReps,
            load: workSet.completedLoad ?? workSet.targetLoad, rir: workSet.actualRir ?? workSet.targetRir,
            technique: 4, pain: 0, setIndex
          }] : [])
        })
        const status = sessionCompletionStatus(session)
        const difficulty = feedback.answers.find((answer) => answer.id === 'difficulty' && answer.status === 'answered')
        const sessionRpe = typeof difficulty?.value === 'number' ? difficulty.value : undefined
        set((current) => {
          const history = [...current.history, ...newHistory]
          return {
          history,
          records: derivePersonalRecords(history),
          surveys: [...current.surveys, { id: nanoid(), sessionId, type: 'post', completedAt, answers: feedback.answers, skipped: feedback.skipped }],
          sessions: current.sessions.map((candidate) => candidate.id === sessionId ? { ...candidate, status, completedAt, sessionRpe, note: feedback.note } : candidate),
          activeSessionId: null,
          nav: 'progress',
          notice: `${newHistory.length} working sets saved. Progress clocks updated from completed work only.`
        }})
      },
      skipExercise: (sessionId, plannedExerciseId) => set((state) => ({
        sessions: state.sessions.map((session) => session.id !== sessionId ? session : {
          ...session,
          exercises: session.exercises.filter((exercise) => exercise.id !== plannedExerciseId)
        })
      })),
      markMissed: (sessionId, context) => set((state) => ({
        sessions: replanAfterMiss(state.sessions, sessionId, context),
        athlete: { ...state.athlete, continuity: context.continuing ? 'interrupted' : state.athlete.continuity },
        notice: 'Plan rebuilt from completed exposures. No catch-up volume was added.'
      })),
      toggleFavorite: (exerciseId) => set((state) => ({ exercises: state.exercises.map((exercise) => exercise.id === exerciseId ? { ...exercise, favorite: !exercise.favorite } : exercise) })),
      setJointFeeling: (exerciseId, jointFeeling) => set((state) => ({ exercises: state.exercises.map((exercise) => exercise.id === exerciseId ? { ...exercise, jointFeeling } : exercise) })),
      addCustomExercise: (exercise) => set((state) => ({ exercises: [...state.exercises, exercise] })),
      correctHistorySet: (setId, data, reason) => {
        const state = get()
        const workSet = state.history.find((candidate) => candidate.id === setId)
        if (!workSet) return { ok: false, error: 'That completed set could not be found.' }
        if (!reason.trim()) return { ok: false, error: 'Add a short reason so the correction remains auditable.' }
        if ([data.reps, data.load, data.rir, data.technique, data.pain].some((value) => !Number.isFinite(value) || value < 0)) return { ok: false, error: 'Use valid zero-or-greater numbers.' }
        if (Number.isNaN(new Date(data.completedAt).getTime())) return { ok: false, error: 'Use a valid completion date.' }
        const history = state.history.map((candidate) => candidate.id === setId ? { ...candidate, ...data } : candidate)
        const records = derivePersonalRecords(history)
        const event: HistoryMutationEvent = {
          id: nanoid(), type: 'set-corrected', createdAt: new Date().toISOString(), reason: reason.trim(),
          description: `${workSet.exerciseName}: ${workSet.load} × ${workSet.reps} corrected to ${data.load} × ${data.reps}.`,
          affectedSetIds: [setId], before: { history: state.history, exercises: state.exercises, sessions: state.sessions },
          after: { history, exercises: state.exercises, sessions: state.sessions }, recordsBefore: state.records, recordsAfter: records,
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
        const event: HistoryMutationEvent = {
          id: nanoid(), type: 'set-deleted', createdAt: new Date().toISOString(), reason: reason.trim(),
          description: `${workSet.exerciseName}: ${workSet.load} × ${workSet.reps} removed from completed history.`,
          affectedSetIds: [setId], before: { history: state.history, exercises: state.exercises, sessions: state.sessions },
          after: { history, exercises: state.exercises, sessions: state.sessions }, recordsBefore: state.records, recordsAfter: records,
          volumeBefore: historyVolume(state.history), volumeAfter: historyVolume(history)
        }
        set({ history, records, historyMutations: [...state.historyMutations, event], notice: 'Set removed. Volume, charts, exposure history, and records were replayed.' })
        return { ok: true }
      },
      mergeExercises: (sourceIds, targetId, reason) => {
        const state = get()
        if (state.activeSessionId) return { ok: false, error: 'Finish or leave the active workout before merging movements.' }
        if (!reason.trim()) return { ok: false, error: 'Add a short reason so the merge remains auditable.' }
        try {
          const projection = projectExerciseMerge({ exercises: state.exercises, history: state.history, sessions: state.sessions, athlete: state.athlete, sourceIds, targetId })
          const records = derivePersonalRecords(projection.history)
          const affectedSetIds = state.history.filter((workSet) => sourceIds.includes(workSet.exerciseId)).map((workSet) => workSet.id)
          const event: HistoryMutationEvent = {
            id: nanoid(), type: 'exercise-merged', createdAt: new Date().toISOString(), reason: reason.trim(),
            description: `${projection.sources.map((exercise) => exercise.name).join(', ')} merged into ${projection.target.name}.`, affectedSetIds,
            before: { history: state.history, exercises: state.exercises, sessions: state.sessions, athlete: state.athlete },
            after: { history: projection.history, exercises: projection.exercises, sessions: projection.sessions, athlete: projection.athlete },
            recordsBefore: state.records, recordsAfter: records, volumeBefore: historyVolume(state.history), volumeAfter: historyVolume(projection.history)
          }
          set({ exercises: projection.exercises, history: projection.history, sessions: projection.sessions, athlete: projection.athlete, records, historyMutations: [...state.historyMutations, event], notice: `${affectedSetIds.length} source sets now share ${projection.target.name}. Original names and an undo snapshot were preserved.` })
          return { ok: true }
        } catch (error) {
          return { ok: false, error: error instanceof Error ? error.message : 'The movements could not be merged.' }
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
          records: structuredClone(event.recordsBefore), historyMutations,
          notice: `Undid: ${event.description} Charts and records now reflect the restored source data.`
        })
        return { ok: true }
      },
      applyMesocycleRevision: (draft) => {
        const state = get()
        if (state.activeSessionId) return { ok: false, error: 'Finish or leave the active workout before revising the mesocycle.' }
        if (!draft.revisionReason.trim()) return { ok: false, error: 'Add a short reason so this plan change stays explainable.' }
        if (draft.strengthAnchors.length === 0) return { ok: false, error: 'Choose at least one protected strength anchor.' }
        const activePlan = state.mesocycles.find((plan) => plan.id === state.activeMesocycleId)
        const nextVersion = Math.max(0, ...state.mesocycles.map((plan) => plan.version)) + 1
        const planId = `mesocycle-${nanoid()}`
        const effectiveAt = new Date().toISOString()
        const preview = buildMesocyclePreview(draft, {
          exercises: state.exercises,
          currentSessions: state.sessions,
          history: state.history,
          planId,
          planVersion: nextVersion,
          startsAt: new Date(effectiveAt)
        })
        const nextPlan = createMesocyclePlan(draft, planId, nextVersion, effectiveAt, activePlan?.id ?? null, preview.sessions.map((session) => session.id))
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
          notice: `Mesocycle version ${nextVersion} is active. Completed work and prior plan versions were preserved.`
        })
        return { ok: true }
      },
      restoreBackup: (data) => set((state) => ({
        ...backupStateFrom(data),
        recoverySnapshot: backupStateFrom(state),
        nav: data.activeSessionId ? state.nav : 'today',
        notice: `Backup restored: ${data.history.length} completed sets and ${data.exercises.length} exercises are active.`
      })),
      undoLastRestore: () => set((state) => state.recoverySnapshot ? ({
        ...backupStateFrom(state.recoverySnapshot),
        recoverySnapshot: null,
        nav: 'you',
        notice: 'The previous local state has been restored.'
      }) : ({ notice: 'No restore point is available.' })),
      resetDemo: () => set({ nav: 'today', notice: 'Local demo data restored.', ...fresh() })
    }),
    {
      name: 'forgepath-private-alpha-v1',
      version: 3,
      partialize: (state) => ({
        athlete: state.athlete,
        settings: state.settings,
        exercises: state.exercises,
        sessions: state.sessions,
        history: state.history,
        surveys: state.surveys,
        records: state.records,
        historyMutations: state.historyMutations,
        mesocycles: state.mesocycles,
        activeMesocycleId: state.activeMesocycleId,
        activeSessionId: state.activeSessionId,
        onboardingComplete: state.onboardingComplete,
        recoverySnapshot: state.recoverySnapshot
      }),
      migrate: (persistedState) => {
        const persisted = persistedState as AppState
        return {
          ...persisted,
          mesocycles: persisted.mesocycles?.length ? persisted.mesocycles : structuredClone(seedMesocycles),
          activeMesocycleId: persisted.activeMesocycleId ?? seedMesocycles[0]?.id ?? null,
          historyMutations: persisted.historyMutations ?? [],
          records: derivePersonalRecords(persisted.history ?? [])
        }
      }
    }
  )
)
