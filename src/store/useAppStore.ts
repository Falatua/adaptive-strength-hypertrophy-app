import { nanoid } from 'nanoid'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { athlete as seedAthlete, exercises as seedExercises, history as seedHistory, mesocycles as seedMesocycles, sessions as seedSessions } from '../domain/seed'
import { compressSession, readinessFromSurvey, replanAfterMiss, sessionCompletionStatus } from '../domain/training-engine'
import { backupStateFrom, type RestorableAppState } from '../domain/backup'
import { buildMesocyclePreview, createMesocyclePlan, replaceFuturePlan } from '../domain/mesocycle-engine'
import { derivePersonalRecords, historyVolume, projectExerciseMerge } from '../domain/history-engine'
import { buildCycleReview, buildNextMicrocycle } from '../domain/cycle-review-engine'
import { rankExerciseSubstitutions } from '../domain/substitution-engine'
import type {
  AppSettings,
  AthleteProfile,
  CompletedSetRecord,
  CycleReviewDecision,
  CycleReviewEvent,
  Exercise,
  ExerciseSubstitutionEvent,
  HistoryMutationEvent,
  MesocycleDraft,
  MesocyclePlan,
  MissedSessionReason,
  NavKey,
  PersonalRecord,
  SurveyAnswer,
  SurveyRecord,
  SubstitutionReason,
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
  cycleReviews: CycleReviewEvent[]
  substitutionEvents: ExerciseSubstitutionEvent[]
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
  swapExercise: (sessionId: string, plannedExerciseId: string, exerciseId: string, reason: SubstitutionReason, primaryOverrideConfirmed: boolean) => { ok: boolean; error?: string }
  finishSession: (sessionId: string, feedback: { answers: SurveyAnswer[]; note?: string; skipped: boolean }) => void
  skipExercise: (sessionId: string, plannedExerciseId: string) => void
  markMissed: (sessionId: string, context: MissedSessionReason) => void
  toggleFavorite: (exerciseId: string) => void
  setJointFeeling: (exerciseId: string, jointFeeling: Exercise['jointFeeling']) => void
  addCustomExercise: (exercise: Exercise) => void
  correctHistorySet: (setId: string, data: Pick<CompletedSetRecord, 'reps' | 'load' | 'rir' | 'technique' | 'pain' | 'qualityConfirmed' | 'completedAt'>, reason: string) => { ok: boolean; error?: string }
  deleteHistorySet: (setId: string, reason: string) => { ok: boolean; error?: string }
  mergeExercises: (sourceIds: string[], targetId: string, reason: string) => { ok: boolean; error?: string }
  undoLatestHistoryMutation: () => { ok: boolean; error?: string }
  applyMesocycleRevision: (draft: MesocycleDraft) => { ok: boolean; error?: string }
  applyCycleReview: (decision: CycleReviewDecision, reason: string) => { ok: boolean; error?: string }
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
  celebrationLevel: 'subtle',
  opportunityPrompts: true,
  sessionAchievements: true,
  confetti: false,
  quietMode: false,
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
  cycleReviews: [] as CycleReviewEvent[],
  substitutionEvents: [] as ExerciseSubstitutionEvent[],
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
      swapExercise: (sessionId, plannedExerciseId, exerciseId, reason, primaryOverrideConfirmed) => {
        const state = get()
        const session = state.sessions.find((candidate) => candidate.id === sessionId)
        const planned = session?.exercises.find((candidate) => candidate.id === plannedExerciseId)
        const original = state.exercises.find((candidate) => candidate.id === planned?.exerciseId)
        const selected = state.exercises.find((candidate) => candidate.id === exerciseId && !candidate.retired)
        if (!session || !planned || !original || !selected) return { ok: false, error: 'That substitution is no longer available.' }
        if (planned.role === 'primary' && !primaryOverrideConfirmed) return { ok: false, error: 'Confirm the protected-primary tradeoff before changing this anchor.' }
        const ranked = rankExerciseSubstitutions({
          planned, original, exercises: state.exercises, history: state.history, athlete: state.athlete,
          readiness: session.readiness ?? 'confirm', reason
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
          availableMinutes: session.durationMinutes, equipmentLocation: state.settings.equipmentLocation,
          primaryOverrideConfirmed: planned.role === 'primary' ? primaryOverrideConfirmed : false,
          candidates: ranked.slice(0, 6).map((item) => item.snapshot), originalPrescription: structuredClone(planned.sets),
          replacementPrescription: structuredClone(choice.prescription), prescriptionMethod: choice.prescriptionMethod,
          prescriptionNote: choice.prescriptionNote, sourceSetIds: [], outcome: 'pending'
        }
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
          notice: `${selected.name} now owns a ${choice.prescriptionMethod === 'exact-history' ? 'history-based' : 'baseline-calibration'} prescription. ${original.name}'s progression clock remains frozen.`
        })
        return { ok: true }
      },
      finishSession: (sessionId, feedback) => {
        const state = get()
        const session = state.sessions.find((candidate) => candidate.id === sessionId)
        if (!session) return
        const completedAt = new Date().toISOString()
        const techniqueAnswer = feedback.answers.find((answer) => answer.id === 'technique' && answer.status === 'answered')
        const painAnswer = feedback.answers.find((answer) => answer.id === 'pain' && answer.status === 'answered')
        const qualityConfirmed = typeof techniqueAnswer?.value === 'number' && typeof painAnswer?.value === 'number'
        const technique = qualityConfirmed ? Number(techniqueAnswer.value) : 0
        const pain = qualityConfirmed ? Number(painAnswer.value) : 0
        const newHistory: CompletedSetRecord[] = session.exercises.flatMap((plannedExercise) => {
          const exercise = state.exercises.find((candidate) => candidate.id === plannedExercise.exerciseId)
          const original = plannedExercise.substitutedFrom ? state.exercises.find((candidate) => candidate.id === plannedExercise.substitutedFrom) : undefined
          if (!exercise) return []
          return plannedExercise.sets.flatMap((workSet, setIndex) => workSet.completed ? [{
            id: nanoid(), sessionId, exerciseId: exercise.id, exerciseName: exercise.name, family: exercise.family,
            primaryRegion: exercise.primaryRegion, completedAt, reps: workSet.completedReps ?? workSet.targetReps,
            load: workSet.completedLoad ?? workSet.targetLoad, rir: workSet.actualRir ?? workSet.targetRir,
            technique, pain, qualityConfirmed, setIndex, plannedExerciseId: plannedExercise.id,
            originalExerciseId: original?.id, originalExerciseName: original?.name, originalFamily: original?.family,
            originalPrimaryRegion: original?.primaryRegion
          }] : [])
        })
        const status = sessionCompletionStatus(session)
        const difficulty = feedback.answers.find((answer) => answer.id === 'difficulty' && answer.status === 'answered')
        const sessionRpe = typeof difficulty?.value === 'number' ? difficulty.value : undefined
        const feedbackValue = (id: string) => {
          const answer = feedback.answers.find((candidate) => candidate.id === id && candidate.status === 'answered')
          return typeof answer?.value === 'number' ? answer.value : null
        }
        set((current) => {
          const history = [...current.history, ...newHistory]
          return {
          history,
          records: derivePersonalRecords(history),
          surveys: [...current.surveys, { id: nanoid(), sessionId, type: 'post', completedAt, answers: feedback.answers, skipped: feedback.skipped }],
          sessions: current.sessions.map((candidate) => candidate.id === sessionId ? { ...candidate, status, completedAt, sessionRpe, note: feedback.note } : candidate),
          substitutionEvents: current.substitutionEvents.map((event) => {
            if (event.sessionId !== sessionId || event.outcome !== 'pending') return event
            const sourceSetIds = newHistory.filter((workSet) => workSet.plannedExerciseId === event.plannedExerciseId && workSet.exerciseId === event.selectedExerciseId).map((workSet) => workSet.id)
            const expectedSets = event.replacementPrescription.length
            return {
              ...event, sourceSetIds, completedAt,
              outcome: sourceSetIds.length === 0 ? 'not-completed' as const : sourceSetIds.length >= expectedSets ? 'completed' as const : 'partial' as const,
              postFeedback: {
                difficulty: feedbackValue('difficulty'), targetStimulus: feedbackValue('targetStimulus'),
                technique: feedbackValue('technique'), pain: feedbackValue('pain'), enjoyment: feedbackValue('enjoyment'), skipped: feedback.skipped
              }
            }
          }),
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
          const affectedSetIds = state.history.filter((workSet) => sourceIds.includes(workSet.exerciseId)).map((workSet) => workSet.id)
          const event: HistoryMutationEvent = {
            id: nanoid(), type: 'exercise-merged', createdAt: new Date().toISOString(), reason: reason.trim(),
            description: `${projection.sources.map((exercise) => exercise.name).join(', ')} merged into ${projection.target.name}.`, affectedSetIds,
            before: { history: state.history, exercises: state.exercises, sessions: state.sessions, athlete: state.athlete, substitutionEvents: state.substitutionEvents },
            after: { history: projection.history, exercises: projection.exercises, sessions: projection.sessions, athlete: projection.athlete, substitutionEvents: state.substitutionEvents },
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
          substitutionEvents: event.before.substitutionEvents ? structuredClone(event.before.substitutionEvents) : state.substitutionEvents,
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
      applyCycleReview: (decision, reason) => {
        const state = get()
        if (state.activeSessionId) return { ok: false, error: 'Finish or leave the active workout before reviewing the exposure round.' }
        if (!reason.trim()) return { ok: false, error: 'Add a short reason so the cycle decision remains explainable.' }
        const plan = state.mesocycles.find((candidate) => candidate.id === state.activeMesocycleId && candidate.status === 'active')
        if (!plan) return { ok: false, error: 'There is no active mesocycle to review.' }
        const reviewedAt = new Date()
        const summary = buildCycleReview(plan, state.sessions, state.history, reviewedAt)
        if (!summary.eligible[decision]) return { ok: false, error: decision === 'extend' ? 'Extension becomes available after the target date and before the maximum span.' : 'Complete the protected exposure round before choosing that decision.' }
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
            decision: decision as 'continue-progress' | 'continue-hold' | 'recover',
            nextMicrocycleNumber: summary.microcycleNumber + 1,
            startsAt: new Date(reviewedAt.getTime() + 86_400_000),
            key: nanoid(6)
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
            ? 'Mesocycle completed from exposure evidence. Prior versions and completed work remain intact.'
            : generated.length
              ? `Exposure round ${summary.microcycleNumber + 1} is queued from the recorded review decision.`
              : decision === 'extend'
                ? 'The unresolved exposure round was extended without adding catch-up volume.'
                : 'The current exposure round remains active at the same targets.'
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
      version: 6,
      partialize: (state) => ({
        athlete: state.athlete,
        settings: state.settings,
        exercises: state.exercises,
        sessions: state.sessions,
        history: state.history,
        surveys: state.surveys,
        records: state.records,
        historyMutations: state.historyMutations,
        cycleReviews: state.cycleReviews,
        substitutionEvents: state.substitutionEvents,
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
          settings: { ...structuredClone(initialSettings), ...(persisted.settings ?? {}) },
          mesocycles: persisted.mesocycles?.length ? persisted.mesocycles : structuredClone(seedMesocycles),
          activeMesocycleId: persisted.activeMesocycleId ?? seedMesocycles[0]?.id ?? null,
          historyMutations: (persisted.historyMutations ?? []).map((event) => ({
            ...event,
            recordsBefore: derivePersonalRecords(event.before.history),
            recordsAfter: derivePersonalRecords(event.after.history)
          })),
          cycleReviews: persisted.cycleReviews ?? [],
          substitutionEvents: persisted.substitutionEvents ?? [],
          records: derivePersonalRecords(persisted.history ?? [])
        }
      }
    }
  )
)
