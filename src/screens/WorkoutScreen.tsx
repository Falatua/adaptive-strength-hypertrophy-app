import { useEffect, useMemo, useRef, useState } from 'react'
import { AlertTriangle, ArrowLeft, Check, CheckCircle2, ChevronDown, Clock3, Info, Pause, Play, RefreshCcw, SkipForward, Sparkles, TimerReset, Trophy } from 'lucide-react'
import { estimatedOneRepMax, recommendProgression, volumeLoad } from '../domain/training-engine'
import { deriveAchievementEvents, deriveRecordOpportunities } from '../domain/history-engine'
import { rankExerciseSubstitutions } from '../domain/substitution-engine'
import type { CompletedSetRecord, EffectiveSurveyMode, PlannedExercise, SubstitutionReason } from '../domain/types'
import { useAppStore } from '../store/useAppStore'
import { Modal } from '../components/Modal'
import { PostSurveyModal } from '../components/PostSurveyModal'
import { SurveyModeChooser } from '../components/SurveyModeChooser'
import { exerciseEquipmentFit, loadIncrementFor, sessionEquipmentGaps } from '../domain/equipment-engine'
import { placementRouteLabels } from '../domain/placement-engine'
import { playForgeSound } from '../services/sound-engine'

const roleLabel: Record<PlannedExercise['role'], string> = {
  primary: 'Primary anchor',
  secondary: 'Secondary builder',
  priority: 'Priority accessory',
  maintenance: 'Maintenance',
  optional: 'Optional'
}

export function WorkoutScreen({ sessionId }: { sessionId: string }) {
  const { sessions, exercises, equipmentProfiles, history, settings, placementVerifications, updateSet, toggleSetComplete, setPlacementWarmup, swapExercise, skipExercise, finishSession, leaveActiveSession, setNotice } = useAppStore()
  const session = sessions.find((candidate) => candidate.id === sessionId)
  const [swapTarget, setSwapTarget] = useState<PlannedExercise | null>(null)
  const [swapReason, setSwapReason] = useState<SubstitutionReason>('none')
  const [primaryOverrideConfirmed, setPrimaryOverrideConfirmed] = useState(false)
  const [swapError, setSwapError] = useState<string | null>(null)
  const [cancelledPlacementName, setCancelledPlacementName] = useState<string | null>(null)
  const [finishOpen, setFinishOpen] = useState(false)
  const [finishChooserOpen, setFinishChooserOpen] = useState(false)
  const [activePostMode, setActivePostMode] = useState<Exclude<EffectiveSurveyMode, 'off'>>('full')
  const [warmupConfirmed, setWarmupConfirmed] = useState(false)
  const [timerRunning, setTimerRunning] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [decisionInfo, setDecisionInfo] = useState<{ name: string; title: string; action: string; confidence: string; explanation: string } | null>(null)
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

  useEffect(() => {
    if (activeAchievementPreview.length > priorAchievementCount.current && settings.sessionAchievements && settings.celebrationLevel !== 'off') {
      playForgeSound('achievement', settings)
    }
    priorAchievementCount.current = activeAchievementPreview.length
  }, [activeAchievementPreview.length, settings])

  useEffect(() => {
    if (!timerRunning) return
    const interval = window.setInterval(() => {
      setElapsed((current) => current + 1)
    }, 1000)
    return () => window.clearInterval(interval)
  }, [timerRunning])

  if (!session) return null

  const placementVerification = placementVerifications.find((event) => event.sessionId === session.id && event.status === 'active')

  const activeEquipmentProfile = equipmentProfiles.find((profile) => profile.id === settings.activeEquipmentProfileId) ?? equipmentProfiles[0]
  const equipmentGaps = sessionEquipmentGaps(session, exercises, activeEquipmentProfile)

  const completedSets = session.exercises.flatMap((exercise) => exercise.sets).filter((workSet) => workSet.completed).length
  const totalSets = session.exercises.flatMap((exercise) => exercise.sets).length
  const currentVolume = session.exercises.reduce((sum, planned) => sum + planned.sets.filter((workSet) => workSet.completed).reduce((setSum, workSet) => setSum + (workSet.completedLoad ?? workSet.targetLoad) * (workSet.completedReps ?? workSet.targetReps), 0), 0)
  const progress = totalSets ? Math.round((completedSets / totalSets) * 100) : 0
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
  }).slice(0, 6) : []

  const openSwap = (planned: PlannedExercise) => {
    setSwapTarget(planned)
    const exercise = exercises.find((candidate) => candidate.id === planned.exerciseId)
    setSwapReason(exercise && !exerciseEquipmentFit(exercise, activeEquipmentProfile).available ? 'equipment' : 'none')
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
          <div><small>Time</small><strong>{minutes}:{seconds}</strong></div>
          <button className={`timer-button ${timerRunning ? 'active' : ''}`} onClick={() => setTimerRunning((current) => !current)}>{timerRunning ? <Pause size={17} /> : <Play size={17} />}{timerRunning ? 'Pause' : 'Start timer'}</button>
        </div>
        <div className="workout-progress"><span style={{ transform: `scaleX(${progress / 100})` }} /></div>
      </header>

      <main className="workout-main">
        {cancelledPlacementName && (
          <section className="warmup-check placement-session-check is-captured" role="status" aria-live="polite">
            <div><AlertTriangle size={20} /><span><strong>Exact movement check cancelled</strong><small>This session no longer verifies the {cancelledPlacementName} placement lane. The replacement still earns its own training history.</small></span></div>
          </section>
        )}
        {placementVerification && (
          <section className={`warmup-check placement-session-check ${placementVerification.warmupResponse !== 'not-answered' ? 'is-captured' : ''}`} aria-label="Placement verification warm-up">
            <div><Sparkles size={20} /><span><strong>{placementVerification.movementPlacement ? `${placementVerification.movementPlacement.exerciseName} check` : 'Placement check'} {placementVerification.sequence} of 3</strong><small>{placementRouteLabels[placementVerification.placementRoute]} is a hypothesis. Use a submaximal warm-up and answer only if useful.</small></span></div>
            {placementVerification.warmupResponse === 'not-answered' ? <div>
              <button onClick={() => { setWarmupConfirmed(true); setPlacementWarmup(session.id, 'better') }}>Better</button>
              <button onClick={() => { setWarmupConfirmed(true); setPlacementWarmup(session.id, 'as-expected') }}>As expected</button>
              <button onClick={() => { setWarmupConfirmed(true); setPlacementWarmup(session.id, 'harder') }}>Harder</button>
              <button className="pain" onClick={() => { playForgeSound('warning', settings); setWarmupConfirmed(true); setPlacementWarmup(session.id, 'painful') }}>Painful</button>
              <button className="text-button" onClick={() => { setWarmupConfirmed(true); setPlacementWarmup(session.id, 'skipped') }}>Skip</button>
            </div> : <div className="placement-session-check__saved"><Check size={17} /><span><strong>Warm-up saved</strong><small>{placementVerification.warmupResponse.replace('-', ' ')}</small></span></div>}
          </section>
        )}

        {!placementVerification && !warmupConfirmed && session.readiness && session.readiness !== 'normal' && (
          <section className="warmup-check">
            <div><Sparkles size={20} /><span><strong>Warm-up confirmation</strong><small>Readiness is {session.readiness}. Let performance confirm the plan.</small></span></div>
            <div><button onClick={() => setWarmupConfirmed(true)}>Better</button><button onClick={() => setWarmupConfirmed(true)}>Normal</button><button onClick={() => { setWarmupConfirmed(true); setNotice('Keep the anchor conservative and monitor the first set.') }}>Harder</button><button className="pain" onClick={() => { playForgeSound('warning', settings); setWarmupConfirmed(true); setNotice('Pain-aware mode: change or stop the affected movement.') }}>Painful</button><button className="text-button" onClick={() => setWarmupConfirmed(true)}>Skip</button></div>
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
            return (
              <article className={`exercise-card exercise-card--${planned.role} ${equipmentFit.available ? '' : 'exercise-card--equipment-blocked'}`} key={planned.id}>
                <div className="exercise-card__header">
                  <div className="exercise-index">{String(exerciseIndex + 1).padStart(2, '0')}</div>
                  <div className="exercise-title"><span>{roleLabel[planned.role]}</span><h2>{exercise.name}</h2><p>{planned.purpose}</p></div>
                  <div className="exercise-actions">
                    <button onClick={() => openSwap(planned)}><RefreshCcw size={16} /> Change</button>
                    {planned.role !== 'primary' && <button onClick={() => skipExercise(session.id, planned.id)}><SkipForward size={16} /> Skip</button>}
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
                {planned.warmupGuidance && exerciseIndex === 0 && <div className="route-warmup-guidance"><Sparkles size={16} /><span><strong>Route-specific warm-up</strong>{planned.warmupGuidance}</span></div>}
                <div className="set-table" role="table" aria-label={`${exercise.name} sets`}>
                  <div className="set-table__head" role="row"><span>Set</span><span>Load</span><span>Reps</span><span>RIR</span><span>Status</span></div>
                  {planned.sets.map((workSet, index) => (
                    <div className={`set-row ${workSet.completed ? 'completed' : ''}`} role="row" key={workSet.id}>
                      <span className="set-number">{index + 1}</span>
                      <label><span className="sr-only">Set {index + 1} load</span><input disabled={!equipmentFit.available} type="number" inputMode="decimal" step={loadIncrementFor(exercise, activeEquipmentProfile).value} value={workSet.completedLoad ?? workSet.targetLoad} onChange={(event) => updateSet(session.id, planned.id, workSet.id, { load: Number(event.target.value) })} /><small>{settings.units}</small></label>
                      <label><span className="sr-only">Set {index + 1} repetitions</span><input disabled={!equipmentFit.available} type="number" inputMode="numeric" value={workSet.completedReps ?? workSet.targetReps} onChange={(event) => updateSet(session.id, planned.id, workSet.id, { reps: Number(event.target.value) })} /></label>
                      <label><span className="sr-only">Set {index + 1} repetitions in reserve</span><select disabled={!equipmentFit.available} value={workSet.actualRir ?? workSet.targetRir} onChange={(event) => updateSet(session.id, planned.id, workSet.id, { rir: Number(event.target.value) })}><option value="0">0</option><option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4+</option></select></label>
                      <button className="complete-set" disabled={!equipmentFit.available && !workSet.completed} onClick={() => logSet(planned.id, workSet.id, workSet.completed)} aria-pressed={workSet.completed}>{workSet.completed ? <><Check size={18} /> Done</> : equipmentFit.available ? 'Log set' : 'Blocked'}</button>
                    </div>
                  ))}
                </div>
                {settings.opportunityPrompts && !settings.quietMode && exactHistory.length > 0 && (
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
      </main>

      <footer className="workout-footer">
        <div><TimerReset size={18} /><span><strong>{completedSets} of {totalSets} sets complete.</strong><small>Only completed work enters volume and progression.</small></span></div>
        <button className={`button ${completedSets === totalSets && totalSets > 0 ? 'button--primary' : 'button--secondary'}`} onClick={openFinishFlow}>Finish workout <CheckCircle2 size={18} /></button>
      </footer>

      <Modal open={Boolean(swapTarget)} onClose={() => setSwapTarget(null)} title="Choose an educated replacement" description="Tell ForgePath why you are changing it. The ranking and prescription update without borrowing the original movement's load." wide>
        <div className="swap-controls">
          <label><span className="field-label">Why are you changing this movement? <small>Optional</small></span><select aria-label="Substitution reason" value={swapReason} onChange={(event) => { setSwapReason(event.target.value as SubstitutionReason); setSwapError(null) }}>
            <option value="none">No reason</option><option value="pain">Pain or joint irritation</option><option value="equipment">Equipment unavailable</option><option value="time">Short on time</option><option value="fatigue">Fatigue is high</option><option value="target-feel">Not feeling the target</option><option value="variety">Want variety</option><option value="preference">Prefer something else</option><option value="harder">Need a harder option</option><option value="easier">Need an easier option</option><option value="other">Other</option>
          </select></label>
          {swapTarget?.role === 'primary' && <label className="primary-override"><input type="checkbox" checked={primaryOverrideConfirmed} onChange={(event) => { setPrimaryOverrideConfirmed(event.target.checked); setSwapError(null) }} /><span><strong>Confirm primary-anchor change</strong><small>The replacement may preserve purpose, but it owns a separate progression clock and changes movement specificity.</small></span></label>}
        </div>
        {swapError && <p className="form-error" role="alert">{swapError}</p>}
        <div className="swap-list">
          {rankedSwaps.map(({ candidate, snapshot, prescription, prescriptionMethod, prescriptionNote }) => (
            <button key={candidate.id} className="swap-option" onClick={() => chooseSwap(candidate.id)}>
              <span className="swap-rank">{snapshot.rank}</span>
              <div><span className="eyebrow">{snapshot.tier.replace('-', ' ')}</span><strong>{candidate.name}</strong><small><b>Why:</b> {snapshot.reasons.join(' · ') || 'safe active alternative'}</small><small><b>Preserves:</b> {snapshot.preserves}</small><small><b>Changes:</b> {snapshot.changes}</small><small><b>History:</b> {snapshot.lastExposureAt ? `${snapshot.priorSetCount} exact sets · last ${new Date(snapshot.lastExposureAt).toLocaleDateString()}` : 'No exact exposure yet'}</small><small className="swap-prescription"><b>{prescriptionMethod === 'exact-history' ? 'History-based' : 'Calibration'}:</b> {prescription.length} set{prescription.length === 1 ? '' : 's'} · {prescription[0]?.targetLoad || 'choose load'} × {prescription[0]?.targetReps ?? 0} · {prescription[0]?.targetRir ?? 0} RIR</small><small>{prescriptionNote}</small></div>
              <span className="swap-score">{snapshot.score} pts<ChevronDown size={15} /></span>
            </button>
          ))}
          {rankedSwaps.length === 0 && <div className="compact-empty"><AlertTriangle size={24} /><strong>No available replacement at {activeEquipmentProfile.name}</strong><p>Edit the location profile if equipment is missing from it, or skip this non-primary movement. ForgePath will not relax equipment constraints silently.</p></div>}
        </div>
        <p className="modal-note">Candidates satisfy every equipment item in {activeEquipmentProfile.name}. The selected movement receives a prescription from its own exact history or a conservative calibration, using the profile's executable load increment. The original exact-movement progression clock remains frozen.</p>
      </Modal>

      <Modal open={Boolean(decisionInfo)} onClose={() => setDecisionInfo(null)} title={decisionInfo ? `${decisionInfo.name} progression decision` : 'Progression decision'} description="The recommendation is deterministic and uses this exact movement's completed history.">
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
