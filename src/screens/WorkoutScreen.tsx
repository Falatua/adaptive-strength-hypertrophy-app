import { useEffect, useMemo, useRef, useState } from 'react'
import { AlertTriangle, ArrowLeft, BookOpen, Check, CheckCircle2, ChevronDown, Clock3, Info, Layers, Plus, RefreshCcw, Search, SkipForward, Sparkles, TimerReset, TrendingUp, Trophy } from 'lucide-react'
import { estimatedOneRepMax, recommendProgression, volumeLoad } from '../domain/training-engine'
import { deriveAchievementEvents, deriveRecordOpportunities } from '../domain/history-engine'
import { rankExerciseSubstitutions } from '../domain/substitution-engine'
import type { CompletedSetRecord, EffectiveSurveyMode, PlannedExercise, SubstitutionReason } from '../domain/types'
import { useAppStore } from '../store/useAppStore'
import { Modal } from '../components/Modal'
import { NumberField } from '../components/NumberField'
import { PostSurveyModal } from '../components/PostSurveyModal'
import { SurveyModeChooser } from '../components/SurveyModeChooser'
import { exerciseEquipmentFit, loadIncrementFor, sessionEquipmentGaps } from '../domain/equipment-engine'
import { placementRouteLabels } from '../domain/placement-engine'
import { effortDisplayFor, routeSessionProfile, rpeToRir } from '../domain/route-session-engine'
import { canPairForSuperset, progressSetStructure, setStructureLabels, structureAllowedForRole, summarizeSetGroups } from '../domain/set-structure-engine'
import { muscleCreditsFor, muscleDefinitions } from '../domain/muscle-dose'
import { playForgeSound } from '../services/sound-engine'
import { MOVEMENT_NOTE_MAX_LENGTH, movementNotesForExercise } from '../domain/movement-note-engine'
import { sessionExtensionGate } from '../domain/session-extension-engine'

const roleLabel: Record<PlannedExercise['role'], string> = {
  primary: 'Primary movement',
  secondary: 'Secondary builder',
  accessory: 'Accessory',
  tertiary: 'Optional tertiary'
}

export function WorkoutScreen({ sessionId }: { sessionId: string }) {
  const { sessions, exercises, equipmentProfiles, history, movementNotes, settings, placementVerifications, updateSet, updateMovementNote, toggleSetComplete, setPlacementWarmup, swapExercise, skipExercise, addSetToExercise, addMovementToSession, applySetStructure, applySuperset, clearSetStructure, finishSession, leaveActiveSession } = useAppStore()
  const session = sessions.find((candidate) => candidate.id === sessionId)
  const [swapTarget, setSwapTarget] = useState<PlannedExercise | null>(null)
  const [swapReason, setSwapReason] = useState<SubstitutionReason>('none')
  const [swapBrowseMode, setSwapBrowseMode] = useState<'recommended' | 'library'>('recommended')
  const [swapSearch, setSwapSearch] = useState('')
  const [primaryOverrideConfirmed, setPrimaryOverrideConfirmed] = useState(false)
  const [swapError, setSwapError] = useState<string | null>(null)
  const [cancelledPlacementName, setCancelledPlacementName] = useState<string | null>(null)
  const [finishOpen, setFinishOpen] = useState(false)
  const [finishChooserOpen, setFinishChooserOpen] = useState(false)
  const [activePostMode, setActivePostMode] = useState<Exclude<EffectiveSurveyMode, 'off'>>('full')
  const [clockNow, setClockNow] = useState(() => Date.now())
  const [decisionInfo, setDecisionInfo] = useState<{ name: string; title: string; action: string; confidence: string; explanation: string } | null>(null)
  const [addMovementOpen, setAddMovementOpen] = useState(false)
  const [addSearch, setAddSearch] = useState('')
  const [extensionError, setExtensionError] = useState<string | null>(null)
  const [structureTarget, setStructureTarget] = useState<PlannedExercise | null>(null)
  const [structureError, setStructureError] = useState<string | null>(null)
  const activeSetRecords = useMemo<CompletedSetRecord[]>(() => session?.exercises.flatMap((plannedExercise) => {
    const exercise = exercises.find((candidate) => candidate.id === plannedExercise.exerciseId)
    if (!exercise) return []
    return plannedExercise.sets.flatMap((workSet, setIndex) => workSet.completed ? [{
      id: `active:${session.id}:${workSet.id}`, sessionId: session.id, exerciseId: exercise.id, exerciseName: exercise.name,
      family: exercise.family, primaryRegion: exercise.primaryRegion, completedAt: session.startedAt ?? new Date().toISOString(),
      reps: workSet.completedReps ?? workSet.targetReps, load: workSet.completedLoad ?? workSet.targetLoad,
      rir: workSet.actualRir ?? workSet.targetRir, technique: 4, pain: 0, setIndex
    }] : [])
  }) ?? [], [exercises, session])
  const activeAchievementPreview = useMemo(() => {
    if (!activeSetRecords.length) return []
    const activeIds = new Set(activeSetRecords.map((workSet) => workSet.id))
    return deriveAchievementEvents([...history, ...activeSetRecords]).filter((event) => event.sourceSetIds.some((id) => activeIds.has(id)))
  }, [activeSetRecords, history])
  const priorAchievementCount = useRef(activeAchievementPreview.length)

  // Only muscles that actually received direct work are asked about, most-trained first.
  const trainedMuscles = useMemo(() => {
    const totals = new Map<string, number>()
    for (const planned of session?.exercises ?? []) {
      const credits = muscleCreditsFor(planned.exerciseId, exercises) ?? {}
      const completed = planned.sets.filter((workSet) => workSet.completed).length
      if (!completed) continue
      for (const [muscle, credit] of Object.entries(credits)) {
        if (credit !== 1) continue
        totals.set(muscle, (totals.get(muscle) ?? 0) + completed)
      }
    }
    return [...totals.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([id]) => ({ id, label: muscleDefinitions.find((definition) => definition.id === id)?.label ?? id }))
  }, [exercises, session])


  useEffect(() => {
    if (activeAchievementPreview.length > priorAchievementCount.current && settings.sessionAchievements && settings.celebrationLevel !== 'off') {
      playForgeSound('achievement', settings)
    }
    priorAchievementCount.current = activeAchievementPreview.length
  }, [activeAchievementPreview.length, settings])

  // The session clock reads from the moment the workout started, which is the same stamp
  // the finished session records its real duration from. Nothing to start, nothing to forget.
  useEffect(() => {
    const interval = window.setInterval(() => setClockNow(Date.now()), 1000)
    return () => window.clearInterval(interval)
  }, [])

  if (!session) return null

  const placementVerification = placementVerifications.find((event) => event.sessionId === session.id && event.status === 'active')

  // Powerlifting-style routes read effort as RPE, hypertrophy and calibration routes as RIR.
  // Only RIR is stored, so this changes the dial the athlete reads, never the recorded evidence.
  const effortMetric = routeSessionProfile(session.generation?.route ?? placementVerifications.find((event) => event.sessionId === session.id)?.placementRoute ?? 'hypertrophy').effortMetric
  const activeEquipmentProfile = equipmentProfiles.find((profile) => profile.id === settings.activeEquipmentProfileId) ?? equipmentProfiles[0]
  const equipmentGaps = sessionEquipmentGaps(session, exercises, activeEquipmentProfile)

  const completedSets = session.exercises.flatMap((exercise) => exercise.sets).filter((workSet) => workSet.completed).length
  const totalSets = session.exercises.flatMap((exercise) => exercise.sets).length
  const currentVolume = session.exercises.reduce((sum, planned) => sum + planned.sets.filter((workSet) => workSet.completed).reduce((setSum, workSet) => setSum + (workSet.completedLoad ?? workSet.targetLoad) * (workSet.completedReps ?? workSet.targetReps), 0), 0)
  const progress = totalSets ? Math.round((completedSets / totalSets) * 100) : 0

  // Movement-specific placement questions stay out of the way until the work they ask about is done.
  // A lane-scoped check waits for its own exact movement; a session-level check waits for every set.
  const placementCheckMovement = placementVerification?.movementPlacement
    ? session.exercises.find((planned) => planned.exerciseId === placementVerification.movementPlacement!.exerciseId)
    : undefined
  // Adding work re-hides an unanswered prompt, which is honest: the movement is no longer finished.
  // An answer already given stays on screen, so added work cannot retract a captured response.
  const placementCheckUnlocked = placementVerification?.warmupResponse !== 'not-answered' || (placementCheckMovement
    ? placementCheckMovement.sets.length > 0 && placementCheckMovement.sets.every((workSet) => workSet.completed)
    : totalSets > 0 && completedSets === totalSets)
  const sessionStart = session.startedAt ? new Date(session.startedAt).getTime() : clockNow
  const elapsed = Math.max(0, Math.floor((clockNow - sessionStart) / 1000))
  const minutes = String(Math.floor(elapsed / 60)).padStart(2, '0')
  const seconds = String(elapsed % 60).padStart(2, '0')

  const swapOriginal = swapTarget ? exercises.find((exercise) => exercise.id === swapTarget.exerciseId) : undefined
  const rankedSwaps = swapTarget && swapOriginal ? rankExerciseSubstitutions({
    planned: swapTarget,
    original: swapOriginal,
    exercises,
    history,
    athlete: useAppStore.getState().athlete,
    readiness: session.readiness ?? 'confirm',
    reason: swapReason,
    equipmentProfile: activeEquipmentProfile
  }) : []
  const normalizedSwapSearch = swapSearch.trim().toLowerCase()
  const librarySwaps = normalizedSwapSearch ? rankedSwaps.filter(({ candidate }) => [
    candidate.name, candidate.family, candidate.pattern, candidate.primaryRegion,
    ...candidate.aliases, ...candidate.regions, ...candidate.equipment, ...candidate.roleTags
  ].some((value) => value.toLowerCase().includes(normalizedSwapSearch))) : rankedSwaps
  const visibleSwaps = swapBrowseMode === 'recommended' ? rankedSwaps.slice(0, 6) : librarySwaps

  const openSwap = (planned: PlannedExercise) => {
    setSwapTarget(planned)
    const exercise = exercises.find((candidate) => candidate.id === planned.exerciseId)
    setSwapReason(exercise && !exerciseEquipmentFit(exercise, activeEquipmentProfile).available ? 'equipment' : 'none')
    setSwapBrowseMode('recommended')
    setSwapSearch('')
    setPrimaryOverrideConfirmed(false)
    setSwapError(null)
  }

  const chooseSwap = (exerciseId: string) => {
    if (!swapTarget) return
    const originalName = exercises.find((exercise) => exercise.id === swapTarget.exerciseId)?.name ?? 'the original movement'
    const result = swapExercise(session.id, swapTarget.id, exerciseId, swapReason, primaryOverrideConfirmed)
    if (!result.ok) return setSwapError(result.error ?? 'That movement could not be selected.')
    if (result.placementVerificationCancelled) setCancelledPlacementName(originalName)
    setSwapTarget(null)
  }

  const finishWithoutSurvey = (mode: EffectiveSurveyMode = 'off') => {
    playForgeSound('workout-complete', settings)
    finishSession(session.id, { answers: [], skipped: true, mode })
    setFinishOpen(false)
    setFinishChooserOpen(false)
  }

  const finishWithDeferredFeedback = () => {
    playForgeSound('workout-complete', settings)
    finishSession(session.id, { answers: [], skipped: false, mode: activePostMode, deferred: true })
    setFinishOpen(false)
    setFinishChooserOpen(false)
  }

  const openFinishFlow = () => {
    if (settings.postSurveyMode === 'off') return finishWithoutSurvey('off')
    if (settings.postSurveyMode === 'ask') return setFinishChooserOpen(true)
    setActivePostMode(settings.postSurveyMode)
    setFinishOpen(true)
  }

  const logSet = (plannedExerciseId: string, setId: string, currentlyComplete: boolean) => {
    toggleSetComplete(session.id, plannedExerciseId, setId)
    if (!currentlyComplete) playForgeSound('set-complete', settings)
    if (!currentlyComplete && settings.haptics && !settings.quietMode && settings.celebrationLevel !== 'off' && 'vibrate' in navigator) navigator.vibrate(18)
  }

  const extensionGate = sessionExtensionGate({
    sessionStatus: session.status,
    readiness: session.readiness,
    painReported: placementVerification?.warmupResponse === 'painful'
  })

  const addSet = (plannedExerciseId: string) => {
    const result = addSetToExercise(session.id, plannedExerciseId)
    setExtensionError(result.ok ? null : result.error ?? 'That set could not be added.')
    if (result.ok) playForgeSound('set-complete', settings)
  }

  const addMovement = (exerciseId: string) => {
    const result = addMovementToSession(session.id, exerciseId)
    if (!result.ok) return setExtensionError(result.error ?? 'That movement could not be added.')
    setExtensionError(null)
    setAddMovementOpen(false)
    setAddSearch('')
  }

  const applyStructure = (plannedExerciseId: string, setId: string, kind: 'drop-set' | 'myo-reps') => {
    const result = applySetStructure(session.id, plannedExerciseId, setId, kind)
    setStructureError(result.ok ? null : result.error ?? 'That technique could not be applied.')
    if (result.ok) setStructureTarget(null)
  }

  const pairSuperset = (partnerId: string) => {
    if (!structureTarget) return
    const result = applySuperset(session.id, structureTarget.id, partnerId)
    if (!result.ok) return setStructureError(result.error ?? 'Those movements could not be paired.')
    setStructureError(null)
    setStructureTarget(null)
  }

  const supersetPartners = structureTarget ? session.exercises.flatMap((candidate) => {
    if (candidate.id === structureTarget.id) return []
    if (!structureAllowedForRole(candidate.role, 'superset').allowed) return []
    const a = exercises.find((item) => item.id === structureTarget.exerciseId)
    const b = exercises.find((item) => item.id === candidate.exerciseId)
    if (!a || !b) return []
    const pairing = canPairForSuperset(a, b)
    return [{ planned: candidate, exercise: b, pairing, blocked: candidate.sets.some((workSet) => workSet.grouping) }]
  }) : []

  const normalizedAddSearch = addSearch.trim().toLowerCase()
  const sessionExerciseIds = new Set(session.exercises.map((planned) => planned.exerciseId))
  const addableExercises = exercises
    .filter((candidate) => !sessionExerciseIds.has(candidate.id))
    .filter((candidate) => exerciseEquipmentFit(candidate, activeEquipmentProfile).available)
    .filter((candidate) => !normalizedAddSearch || [
      candidate.name, candidate.family, candidate.pattern, candidate.primaryRegion,
      ...candidate.aliases, ...candidate.regions, ...candidate.equipment, ...candidate.roleTags
    ].some((value) => value.toLowerCase().includes(normalizedAddSearch)))
    .sort((a, b) => Number(b.favorite) - Number(a.favorite) || a.name.localeCompare(b.name))

  const bestEstimatedStrength = Math.max(0, ...session.exercises.flatMap((exercise) => exercise.sets
    .filter((set) => set.completed)
    .map((set) => estimatedOneRepMax(set.completedLoad ?? set.targetLoad, set.completedReps ?? set.targetReps))))

  return (
    <div className={`workout-screen ${settings.focusedMode ? 'workout-screen--focused' : ''}`}>
      <header className="workout-header">
        <div className="workout-header__left">
          <button className="icon-button" onClick={leaveActiveSession} aria-label="Leave workout open"><ArrowLeft size={20} /></button>
          <div><p className="eyebrow">Active workout · Local save</p><h1>{session.title}</h1></div>
        </div>
        <div className="workout-header__stats">
          <div><small>Sets</small><strong>{completedSets}/{totalSets}</strong></div>
          <div><small>Volume</small><strong>{currentVolume.toLocaleString()}</strong></div>
          <div className="workout-clock" role="timer" aria-label="Time elapsed in this workout"><Clock3 size={16} /><span><small>Elapsed</small><strong>{minutes}:{seconds}</strong></span></div>
        </div>
        <div className="workout-progress"><span style={{ transform: `scaleX(${progress / 100})` }} /></div>
      </header>

      <main className="workout-main">
        {cancelledPlacementName && (
          <section className="warmup-check placement-session-check is-captured" role="status" aria-live="polite">
            <div><AlertTriangle size={20} /><span><strong>Exact movement check cancelled</strong><small>This session no longer verifies the {cancelledPlacementName} placement lane. The replacement still earns its own training history.</small></span></div>
          </section>
        )}
        {placementVerification && placementCheckUnlocked && (
          <section className={`warmup-check placement-session-check ${placementVerification.warmupResponse !== 'not-answered' ? 'is-captured' : ''}`} aria-label="Placement verification check">
            <div><Sparkles size={20} /><span><strong>{placementVerification.movementPlacement ? `${placementVerification.movementPlacement.exerciseName} check` : 'Placement check'} {placementVerification.sequence} of 3</strong><small>{placementCheckMovement ? `Every ${placementVerification.movementPlacement!.exerciseName} set is logged.` : 'Every planned set is logged.'} {placementRouteLabels[placementVerification.placementRoute]} is our best guess so far. How did the work feel? Answer only if it helps.</small></span></div>
            {placementVerification.warmupResponse === 'not-answered' ? <div>
              <button onClick={() => { setPlacementWarmup(session.id, 'better') }}>Better</button>
              <button onClick={() => { setPlacementWarmup(session.id, 'as-expected') }}>As expected</button>
              <button onClick={() => { setPlacementWarmup(session.id, 'harder') }}>Harder</button>
              <button className="pain" onClick={() => { playForgeSound('warning', settings); setPlacementWarmup(session.id, 'painful') }}>Painful</button>
              <button className="text-button" onClick={() => { setPlacementWarmup(session.id, 'skipped') }}>Skip</button>
            </div> : <div className="placement-session-check__saved"><Check size={17} /><span><strong>Answer saved</strong><small>{placementVerification.warmupResponse.replace('-', ' ')}</small></span></div>}
          </section>
        )}

        <div className="workout-objective"><span className="status-chip status-chip--lime">{session.readiness ?? 'baseline plan'}</span><span className="status-chip">{session.readinessConfidence ?? 'low'} survey confidence</span><span className={`status-chip ${equipmentGaps.length ? 'status-chip--warning' : ''}`}>{activeEquipmentProfile.name} · {equipmentGaps.length ? `${equipmentGaps.length} to resolve` : 'equipment ready'}</span><p>{session.objective}</p><span><Clock3 size={15} /> {session.durationMinutes} minute version</span></div>

        <div className="exercise-stack">
          {session.exercises.map((planned, exerciseIndex) => {
            const exercise = exercises.find((candidate) => candidate.id === planned.exerciseId)
            if (!exercise) return null
            const equipmentFit = exerciseEquipmentFit(exercise, activeEquipmentProfile)
            const exactHistory = history.filter((set) => set.exerciseId === exercise.id)
            const recent = exactHistory.slice(-planned.sets.length)
            const lastVolume = volumeLoad(recent)
            const recommendation = recommendProgression({
              history: exactHistory,
              targetLoad: planned.sets[0]?.targetLoad ?? 0,
              targetReps: planned.sets[0]?.targetReps ?? 0,
              targetSets: planned.sets.length,
              repRange: planned.role === 'primary' ? [4, 6] : [8, 12],
              increment: loadIncrementFor(exercise, activeEquipmentProfile).value,
              continuity: useAppStore.getState().athlete.continuity,
              readiness: session.readiness ?? 'confirm'
            })
            const opportunities = deriveRecordOpportunities({ history, planned, exercise, readiness: session.readiness ?? 'confirm' })
            const exerciseAchievements = activeAchievementPreview.filter((event) => event.exerciseId === exercise.id)
            const currentMovementNote = movementNotes.find((note) => note.sessionId === session.id && note.plannedExerciseId === planned.id && note.exerciseId === exercise.id)
            const priorMovementNote = movementNotesForExercise(movementNotes, exercise.id).find((note) => note.id !== currentMovementNote?.id)
            return (
              <article className={`exercise-card exercise-card--${planned.role} ${equipmentFit.available ? '' : 'exercise-card--equipment-blocked'}`} key={planned.id}>
                <div className="exercise-card__header">
                  <div className="exercise-index">{String(exerciseIndex + 1).padStart(2, '0')}</div>
                  <div className="exercise-title"><span>{roleLabel[planned.role]}</span><h2>{exercise.name}</h2><p>{planned.purpose}</p></div>
                  <div className="exercise-actions">
                    <button onClick={() => openSwap(planned)}><RefreshCcw size={16} /> Change</button>
                    {planned.role !== 'primary' && <button onClick={() => skipExercise(session.id, planned.id)}><SkipForward size={16} /> Skip</button>}
                    {structureAllowedForRole(planned.role, 'drop-set').allowed && !planned.sets.some((workSet) => workSet.grouping) && !planned.sets.every((workSet) => workSet.completed) && <button onClick={() => { setStructureTarget(planned); setStructureError(null) }}><Layers size={16} /> Technique</button>}
                    {planned.sets.some((workSet) => workSet.grouping) && <button onClick={() => { const groupId = planned.sets.find((workSet) => workSet.grouping)?.grouping?.groupId; if (groupId) { const result = clearSetStructure(session.id, groupId); setStructureError(result.ok ? null : result.error ?? null) } }}><RefreshCcw size={16} /> Clear technique</button>}
                  </div>
                </div>
                {!equipmentFit.available && <div className="equipment-block"><AlertTriangle size={18} /><span><strong>Unavailable at {activeEquipmentProfile.name}</strong><small>Missing {equipmentFit.missing.join(', ')}. Change this movement before logging a set. ForgePath will show only alternatives available in the active profile.</small></span><button onClick={() => openSwap(planned)}>Resolve</button></div>}
                <div className="exercise-context">
                  <div><small>Last exact exposure</small><strong>{recent.length ? `${recent[0].load} × ${recent[0].reps}` : 'No exact history'}</strong><span>{lastVolume.toLocaleString()} volume load</span></div>
                  <div><small>Engine decision</small><strong>{recommendation.title}</strong><span>{recommendation.confidence} confidence · {recommendation.action}</span></div>
                  <div><small>Joint response</small><strong className={`joint joint--${exercise.jointFeeling}`}>{exercise.jointFeeling}</strong><span>{exercise.favorite ? 'Preferred movement' : 'Neutral preference'}</span></div>
                  <button className="info-button" onClick={() => setDecisionInfo({ name: exercise.name, title: recommendation.title, action: recommendation.action, confidence: recommendation.confidence, explanation: recommendation.explanation })} aria-label={`More information about ${exercise.name}`} aria-haspopup="dialog"><Info size={17} /></button>
                </div>
                {planned.prescriptionNote && <div className="substitution-prescription"><RefreshCcw size={16} /><span><strong>{planned.prescriptionMethod === 'exact-history' ? 'Exact-history replacement' : 'Baseline calibration'}</strong>{planned.prescriptionNote}</span></div>}
                <section className="movement-note-editor" aria-label={`${exercise.name} movement notebook`}>
                  <div className="movement-note-editor__heading"><BookOpen size={18} /><span><strong>Movement note</strong><small>Saved to this exact movement and workout</small></span></div>
                  {priorMovementNote && <div className="movement-note-recall"><span><b>Last note</b><small>{new Date(priorMovementNote.sessionDate).toLocaleDateString()}{priorMovementNote.microcycleNumber ? ` · Week ${priorMovementNote.microcycleNumber}` : ''} · {priorMovementNote.sessionTitle}</small></span><p>{priorMovementNote.body}</p></div>}
                  <label>
                    <span className="sr-only">{exercise.name} workout note</span>
                    <textarea aria-label={`${exercise.name} workout note`} maxLength={MOVEMENT_NOTE_MAX_LENGTH} value={currentMovementNote?.body ?? ''} onChange={(event) => updateMovementNote(session.id, planned.id, event.target.value)} placeholder="Angle, tempo, setup, cue, joint feel, or what changed today..." />
                  </label>
                  <div className="movement-note-editor__meta"><small>Autosaved as you type. Notes provide context and never change progression by themselves.</small><small>{currentMovementNote?.body.length ?? 0}/{MOVEMENT_NOTE_MAX_LENGTH}</small></div>
                </section>
                {(() => {
                  const structureProgress = progressSetStructure({
                    groups: summarizeSetGroups(exactHistory, exercise.id),
                    increment: loadIncrementFor(exercise, activeEquipmentProfile).value
                  })
                  return structureProgress && structureProgress.prior ? (
                    <p className="structure-progress"><TrendingUp size={15} /> <span><strong>{structureProgress.axis === 'load' ? 'Add load next time.' : structureProgress.axis === 'reps' ? 'Chase reps across the block.' : structureProgress.axis === 'sets' ? 'Add one more to the block.' : 'Repeat this block.'}</strong> {structureProgress.reasons[0]}</span></p>
                  ) : null
                })()}
                {planned.sets.find((workSet) => workSet.grouping) && (
                  <p className="structure-note"><Layers size={15} /> {setStructureLabels[planned.sets.find((workSet) => workSet.grouping)!.grouping!.groupKind]}. {planned.sets.find((workSet) => workSet.grouping)!.grouping!.groupKind === 'drop-set' ? 'Strip the load and keep going with no rest. The top set is what sets your next target.' : planned.sets.find((workSet) => workSet.grouping)!.grouping!.groupKind === 'myo-reps' ? 'Take the first set close to failure, then rest three to five deep breaths between the short sets. The first set is what sets your next target.' : 'Alternate with its pair, resting only between rounds.'}</p>
                )}
                {!exactHistory.length && (
                  <p className="load-unknown-note"><Info size={15} /> No logged {exercise.name} yet, so there is no honest load to hand you. Work to the {effortDisplayFor(0, effortMetric).label} target and enter what you actually lifted. Once it is logged, the next session starts from your real number.</p>
                )}
                <div className="set-table" role="table" aria-label={`${exercise.name} sets`}>
                  <div className="set-table__head" role="row"><span>Set</span><span>Load</span><span>Reps</span><span title={effortDisplayFor(0, effortMetric).hint}>{effortDisplayFor(0, effortMetric).label}</span><span>Status</span></div>
                  {planned.sets.map((workSet, index) => {
                    const effort = effortDisplayFor(workSet.actualRir ?? workSet.targetRir, effortMetric)
                    // Until this exact movement has logged history there is nothing to base a load on,
                    // so the target stays blank and the effort dial carries the prescription instead.
                    const loadUnknown = !exactHistory.length && workSet.completedLoad === undefined
                    return (
                    <div className={`set-row ${workSet.completed ? 'completed' : ''}`} role="row" key={workSet.id}>
                      <span className="set-number">{index + 1}{workSet.athleteAdded && <em title="Added by you today">+</em>}{workSet.grouping && <b className={`set-group set-group--${workSet.grouping.groupRole}`} title={`${setStructureLabels[workSet.grouping.groupKind]}: ${workSet.grouping.groupRole}`}>{workSet.grouping.groupRole === 'drop' ? '↓' : workSet.grouping.groupRole === 'mini' ? '·' : workSet.grouping.groupRole === 'paired' ? '⇄' : '★'}</b>}</span>
                      <label><span className="sr-only">Set {index + 1} load</span><NumberField disabled={!equipmentFit.available} inputMode="decimal" step={loadIncrementFor(exercise, activeEquipmentProfile).value} placeholder={loadUnknown ? 'Your call' : undefined} value={loadUnknown ? null : workSet.completedLoad ?? workSet.targetLoad} onCommit={(load) => updateSet(session.id, planned.id, workSet.id, { load })} /><small>{settings.units}</small></label>
                      <label><span className="sr-only">Set {index + 1} repetitions</span><NumberField disabled={!equipmentFit.available} inputMode="numeric" value={workSet.completedReps ?? workSet.targetReps} onCommit={(reps) => updateSet(session.id, planned.id, workSet.id, { reps })} /></label>
                      <label><span className="sr-only">Set {index + 1} {effort.label === 'RPE' ? 'rate of perceived exertion' : 'repetitions in reserve'}</span><select disabled={!equipmentFit.available} value={effort.value} onChange={(event) => updateSet(session.id, planned.id, workSet.id, { rir: effort.metric === 'rpe' ? rpeToRir(Number(event.target.value)) : Number(event.target.value) })}>{effort.options.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>
                      <button className="complete-set" disabled={!equipmentFit.available && !workSet.completed} onClick={() => logSet(planned.id, workSet.id, workSet.completed)} aria-pressed={workSet.completed}>{workSet.completed ? <><Check size={18} /> Done</> : equipmentFit.available ? 'Log set' : 'Blocked'}</button>
                    </div>
                    )
                  })}
                  {extensionGate.allowed && equipmentFit.available && (
                    <button type="button" className="add-set-button" onClick={() => addSet(planned.id)}>
                      <Plus size={16} /> Add a set to {exercise.name}
                    </button>
                  )}
                </div>
                {settings.opportunityPrompts && !settings.quietMode && !planned.athleteAdded && exactHistory.length > 0 && (
                  <div className={`pr-opportunity ${opportunities.length && !opportunities[0].eligible ? 'pr-opportunity--paused' : ''}`}>
                    <Trophy size={17} />
                    <span>{opportunities.length
                      ? <><strong>{opportunities[0].eligible ? opportunities[0].title : 'Record prompt paused'}:</strong> {opportunities[0].eligible ? opportunities[0].explanation : opportunities[0].gateReason} <small>{opportunities[0].eligible ? 'This is already prescribed. Do not add work to chase it.' : 'Training continues without a gamification target.'}</small></>
                      : <><strong>Productive hold:</strong> Today's prescribed target does not cross an all-time exact-movement record. A useful session does not need a PR.</>}
                    </span>
                  </div>
                )}
                {settings.sessionAchievements && !settings.quietMode && settings.celebrationLevel !== 'off' && exerciseAchievements.length > 0 && (
                  <div className={`achievement-preview achievement-preview--${settings.celebrationLevel} ${settings.confetti && !settings.reducedMotion ? 'achievement-preview--confetti' : ''}`} role="status" aria-live="polite"><Sparkles size={18} /><span><strong>{exerciseAchievements[0].title}</strong>{exerciseAchievements[0].explanation}<small>Provisional until the workout is finished and saved.</small></span></div>
                )}
              </article>
            )
          })}
        </div>

        <section className="extra-work" aria-label="Add extra work">
          <div className="extra-work__heading">
            <Plus size={19} />
            <span>
              <strong>Feeling good today?</strong>
              <small>Add sets to any movement above, or add another movement. Extra work is recorded as yours, separately from what was prescribed, so today's plan stays an honest record of what the engine asked for.</small>
            </span>
          </div>
          {extensionGate.caution && <p className="extra-work__caution"><AlertTriangle size={16} /> {extensionGate.caution}</p>}
          {!extensionGate.allowed && <p className="extra-work__blocked"><AlertTriangle size={16} /> {extensionGate.reason}</p>}
          {extensionError && <p className="form-error" role="alert">{extensionError}</p>}
          {extensionGate.allowed && (
            <button type="button" className="button button--secondary" onClick={() => { setAddMovementOpen(true); setExtensionError(null) }}>
              <Plus size={17} /> Add a movement
            </button>
          )}
        </section>
      </main>

      <footer className="workout-footer">
        <div><TimerReset size={18} /><span><strong>{completedSets} of {totalSets} sets complete.</strong><small>Only completed work enters volume and progression.</small></span></div>
        <button className={`button ${completedSets === totalSets && totalSets > 0 ? 'button--primary' : 'button--secondary'}`} onClick={openFinishFlow}>Finish workout <CheckCircle2 size={18} /></button>
      </footer>

      <Modal open={Boolean(structureTarget)} onClose={() => { setStructureTarget(null); setStructureError(null) }} title={structureTarget ? `Change how you perform ${exercises.find((item) => item.id === structureTarget.exerciseId)?.name ?? 'this movement'}` : 'Choose a technique'} description="Same work, less clock. These accumulate volume efficiently, so they belong on accessory and tertiary work rather than the lift your progression is measured on." wide>
        {structureError && <p className="form-error" role="alert">{structureError}</p>}
        <div className="structure-options">
          <button type="button" onClick={() => { const first = structureTarget?.sets.find((workSet) => !workSet.completed); if (structureTarget && first) applyStructure(structureTarget.id, first.id, 'drop-set') }}>
            <span><strong>Drop set</strong><small>Take the set, strip roughly a fifth of the load, and keep going with no rest. Two drops are added. Equal growth to straight sets in a fraction of the time.</small></span>
          </button>
          <button type="button" onClick={() => { const first = structureTarget?.sets.find((workSet) => !workSet.completed); if (structureTarget && first) applyStructure(structureTarget.id, first.id, 'myo-reps') }}>
            <span><strong>Myo-reps</strong><small>One activation set close to failure, then three short sets of three after three to five deep breaths. Most of the growth stimulus lives in those last hard reps.</small></span>
          </button>
        </div>
        <div className="structure-pairing">
          <p className="field-label">Or superset it with</p>
          {supersetPartners.length === 0 && <p className="modal-note">No other movement in this session can pair with it yet.</p>}
          {supersetPartners.map(({ planned: partner, exercise: partnerExercise, pairing, blocked }) => (
            <button type="button" key={partner.id} disabled={!pairing.allowed || blocked} onClick={() => pairSuperset(partner.id)} className={pairing.allowed && !blocked ? '' : 'is-refused'}>
              <span><strong>{partnerExercise.name}</strong><small>{blocked ? 'Already uses a technique. Clear it first.' : pairing.reason}</small></span>
            </button>
          ))}
        </div>
      </Modal>

      <Modal open={addMovementOpen} onClose={() => { setAddMovementOpen(false); setAddSearch('') }} title="Add a movement to today" description="Extra work you choose because you feel good. It is added as optional accessory work, never as the session's primary movement, so it cannot become the evidence a route decision rests on." wide>
        <label className="add-movement-search">
          <span className="field-label">Search every movement available at {activeEquipmentProfile.name}</span>
          <input className="swap-library-search" type="search" value={addSearch} onChange={(event) => setAddSearch(event.target.value)} placeholder="Name, muscle, pattern, or equipment" aria-label="Search movements to add" />
        </label>
        {extensionError && <p className="form-error" role="alert">{extensionError}</p>}
        <p className="modal-note">Showing {addableExercises.length} available {addableExercises.length === 1 ? 'movement' : 'movements'}. Movements already in today's workout are not listed. Add a set to those instead.</p>
        <div className="add-movement-list">
          {addableExercises.slice(0, 40).map((candidate) => {
            const exactCount = history.filter((workSet) => workSet.exerciseId === candidate.id).length
            return (
              <button type="button" key={candidate.id} className="add-movement-option" onClick={() => addMovement(candidate.id)}>
                <span>
                  <strong>{candidate.name}</strong>
                  <small>{candidate.family} · {candidate.primaryRegion} · {candidate.equipment.join(', ')}</small>
                </span>
                <b>{exactCount ? `${exactCount} exact sets` : 'No exact history'}</b>
              </button>
            )
          })}
          {!addableExercises.length && <p className="modal-note">No movement matches that search at this location.</p>}
        </div>
      </Modal>

      <Modal open={Boolean(swapTarget)} onClose={() => { setSwapTarget(null); setSwapSearch(''); setSwapBrowseMode('recommended') }} title="Choose an educated replacement" description="Start with the strongest matches or search every compatible movement available at this location. The replacement keeps its own history and load progression." wide>
        <div className="swap-controls">
          <label><span className="field-label">Why are you changing this movement? <small>Optional</small></span><select aria-label="Substitution reason" value={swapReason} onChange={(event) => { setSwapReason(event.target.value as SubstitutionReason); setSwapError(null) }}>
            <option value="none">No reason</option><option value="pain">Pain or joint irritation</option><option value="equipment">Equipment unavailable</option><option value="time">Short on time</option><option value="fatigue">Fatigue is high</option><option value="target-feel">Not feeling the target</option><option value="variety">Want variety</option><option value="preference">Prefer something else</option><option value="harder">Need a harder option</option><option value="easier">Need an easier option</option><option value="other">Other</option>
          </select></label>
          {swapTarget?.role === 'primary' && <label className="primary-override"><input type="checkbox" checked={primaryOverrideConfirmed} onChange={(event) => { setPrimaryOverrideConfirmed(event.target.checked); setSwapError(null) }} /><span><strong>Confirm main-lift change</strong><small>The replacement may preserve purpose, but it owns a separate progression clock and changes movement specificity.</small></span></label>}
        </div>
        {swapError && <p className="form-error" role="alert">{swapError}</p>}
        <div className="swap-library-nav">
          <div className="swap-library-tabs" role="group" aria-label="Replacement browsing mode">
            <button className={swapBrowseMode === 'recommended' ? 'selected' : ''} aria-pressed={swapBrowseMode === 'recommended'} onClick={() => { setSwapBrowseMode('recommended'); setSwapSearch('') }}>Best matches <span>{Math.min(6, rankedSwaps.length)}</span></button>
            <button className={swapBrowseMode === 'library' ? 'selected' : ''} aria-pressed={swapBrowseMode === 'library'} onClick={() => setSwapBrowseMode('library')}>Browse full library <span>{rankedSwaps.length}</span></button>
          </div>
          {swapBrowseMode === 'library' && <label className="search-box swap-library-search"><Search size={18} /><span className="sr-only">Search replacement library</span><input aria-label="Search replacement library" autoFocus value={swapSearch} onChange={(event) => setSwapSearch(event.target.value)} placeholder="Search leg press, machine, quads, aliases..." /></label>}
          <small>{swapBrowseMode === 'recommended' ? 'Ranked by purpose, target, equipment, joint response, preference, and exact history.' : `${librarySwaps.length} compatible movement${librarySwaps.length === 1 ? '' : 's'} shown. Search names, aliases, body parts, roles, or equipment.`}</small>
        </div>
        <div className="swap-list">
          {visibleSwaps.map(({ candidate, snapshot, prescription, prescriptionMethod, prescriptionNote }) => (
            <button key={candidate.id} className="swap-option" onClick={() => chooseSwap(candidate.id)}>
              <span className="swap-rank">{snapshot.rank}</span>
              <div><span className="eyebrow">{snapshot.tier.replace('-', ' ')}</span><strong>{candidate.name}</strong><small><b>Why:</b> {snapshot.reasons.join(' · ') || 'safe active alternative'}</small><small><b>Preserves:</b> {snapshot.preserves}</small><small><b>Changes:</b> {snapshot.changes}</small><small><b>History:</b> {snapshot.lastExposureAt ? `${snapshot.priorSetCount} exact sets · last ${new Date(snapshot.lastExposureAt).toLocaleDateString()}` : 'No exact exposure yet'}</small><small className="swap-prescription"><b>{prescriptionMethod === 'exact-history' ? 'History-based' : 'Calibration'}:</b> {prescription.length} set{prescription.length === 1 ? '' : 's'} · {prescription[0]?.targetLoad || 'choose load'} × {prescription[0]?.targetReps ?? 0} · {prescription[0]?.targetRir ?? 0} RIR</small><small>{prescriptionNote}</small></div>
              <span className="swap-score">{snapshot.score} pts<ChevronDown size={15} /></span>
            </button>
          ))}
          {visibleSwaps.length === 0 && <div className="compact-empty"><AlertTriangle size={24} /><strong>{normalizedSwapSearch ? 'No compatible movement matches that search' : `No available replacement at ${activeEquipmentProfile.name}`}</strong><p>{normalizedSwapSearch ? 'Try a common name, alias, body part, movement type, or equipment name. ForgePath will not silently relax the active equipment or joint constraints.' : 'Edit the location profile if equipment is missing from it, or skip this non-primary movement. ForgePath will not relax equipment constraints silently.'}</p></div>}
        </div>
        <p className="modal-note">Candidates satisfy every equipment item in {activeEquipmentProfile.name}. The selected movement receives a prescription from its own exact history or a conservative calibration, using the profile's executable load increment. The original exact-movement progression clock remains frozen.</p>
      </Modal>

      <Modal open={Boolean(decisionInfo)} onClose={() => setDecisionInfo(null)} title={decisionInfo ? `${decisionInfo.name} progression decision` : 'Progression decision'} description="The recommendation follows fixed rules and uses this exact movement's completed history.">
        {decisionInfo && <div className="decision-info">
          <div><small>Decision</small><strong>{decisionInfo.title}</strong></div>
          <div><small>Progression action</small><strong>{decisionInfo.action}</strong></div>
          <div><small>Evidence confidence</small><strong>{decisionInfo.confidence}</strong></div>
          <p>{decisionInfo.explanation}</p>
          <p className="modal-note">This explains the current prescription. It does not add work, borrow another movement's history, or override pain and readiness gates.</p>
        </div>}
      </Modal>

      {finishOpen && <PostSurveyModal
        open
        mode={activePostMode}
        completedSets={completedSets}
        totalSets={totalSets}
        volume={currentVolume}
        estimatedStrength={bestEstimatedStrength}
        trainedMuscles={trainedMuscles}
        onClose={() => setFinishOpen(false)}
        onSkip={() => finishWithoutSurvey(activePostMode)}
        onDefer={finishWithDeferredFeedback}
        onSubmit={(answers, feedbackNote) => {
          playForgeSound('workout-complete', settings)
          finishSession(session.id, { answers, note: feedbackNote, skipped: false, mode: activePostMode })
          setFinishOpen(false)
        }}
      />}
      <SurveyModeChooser open={finishChooserOpen} cadence="post" onClose={() => setFinishChooserOpen(false)} onChoose={(mode) => { setActivePostMode(mode); setFinishChooserOpen(false); setFinishOpen(true) }} onSkip={() => finishWithoutSurvey('off')} />
    </div>
  )
}
