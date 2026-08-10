import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Check, CheckCircle2, ChevronDown, Clock3, Info, Pause, Play, RefreshCcw, SkipForward, Sparkles, TimerReset, Trophy } from 'lucide-react'
import { estimatedOneRepMax, recommendProgression, volumeLoad } from '../domain/training-engine'
import { deriveAchievementEvents, deriveRecordOpportunities } from '../domain/history-engine'
import type { CompletedSetRecord } from '../domain/types'
import type { PlannedExercise } from '../domain/types'
import { useAppStore } from '../store/useAppStore'
import { Modal } from '../components/Modal'
import { PostSurveyModal } from '../components/PostSurveyModal'

const roleLabel: Record<PlannedExercise['role'], string> = {
  primary: 'Primary anchor',
  secondary: 'Secondary builder',
  priority: 'Priority accessory',
  maintenance: 'Maintenance',
  optional: 'Optional'
}

export function WorkoutScreen({ sessionId }: { sessionId: string }) {
  const { sessions, exercises, history, settings, updateSet, toggleSetComplete, swapExercise, skipExercise, finishSession, setNotice } = useAppStore()
  const session = sessions.find((candidate) => candidate.id === sessionId)
  const [swapTarget, setSwapTarget] = useState<PlannedExercise | null>(null)
  const [finishOpen, setFinishOpen] = useState(false)
  const [warmupConfirmed, setWarmupConfirmed] = useState(false)
  const [timerRunning, setTimerRunning] = useState(false)
  const [elapsed, setElapsed] = useState(0)
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
  useEffect(() => {
    if (!timerRunning) return
    const interval = window.setInterval(() => {
      setElapsed((current) => current + 1)
    }, 1000)
    return () => window.clearInterval(interval)
  }, [timerRunning])

  if (!session) return null

  const completedSets = session.exercises.flatMap((exercise) => exercise.sets).filter((workSet) => workSet.completed).length
  const totalSets = session.exercises.flatMap((exercise) => exercise.sets).length
  const currentVolume = session.exercises.reduce((sum, planned) => sum + planned.sets.filter((workSet) => workSet.completed).reduce((setSum, workSet) => setSum + (workSet.completedLoad ?? workSet.targetLoad) * (workSet.completedReps ?? workSet.targetReps), 0), 0)
  const progress = totalSets ? Math.round((completedSets / totalSets) * 100) : 0
  const minutes = String(Math.floor(elapsed / 60)).padStart(2, '0')
  const seconds = String(elapsed % 60).padStart(2, '0')

  const rankedSwaps = swapTarget ? exercises
    .filter((candidate) => candidate.id !== swapTarget.exerciseId)
    .map((candidate) => {
      const current = exercises.find((exercise) => exercise.id === swapTarget.exerciseId)
      const purposeMatch = current?.pattern === candidate.pattern ? 4 : 0
      const regionMatch = current?.primaryRegion === candidate.primaryRegion ? 3 : candidate.regions.includes(current?.primaryRegion ?? 'chest') ? 2 : 0
      const jointScore = candidate.jointFeeling === 'great' ? 2 : candidate.jointFeeling === 'good' ? 1 : candidate.jointFeeling === 'avoid' ? -5 : 0
      const favorite = candidate.favorite ? 1 : 0
      return { candidate, score: purposeMatch + regionMatch + jointScore + favorite }
    })
    .filter((item) => item.score >= 3)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6) : []

  const finishWithoutSurvey = () => {
    finishSession(session.id, { answers: [], skipped: true })
    setFinishOpen(false)
  }

  const logSet = (plannedExerciseId: string, setId: string, currentlyComplete: boolean) => {
    toggleSetComplete(session.id, plannedExerciseId, setId)
    if (!currentlyComplete && settings.haptics && !settings.quietMode && settings.celebrationLevel !== 'off' && 'vibrate' in navigator) navigator.vibrate(18)
  }

  const bestEstimatedStrength = Math.max(0, ...session.exercises.flatMap((exercise) => exercise.sets
    .filter((set) => set.completed)
    .map((set) => estimatedOneRepMax(set.completedLoad ?? set.targetLoad, set.completedReps ?? set.targetReps))))

  return (
    <div className={`workout-screen ${settings.focusedMode ? 'workout-screen--focused' : ''}`}>
      <header className="workout-header">
        <div className="workout-header__left">
          <button className="icon-button" onClick={() => setNotice('Workout remains active and saved locally.')} aria-label="Leave workout open"><ArrowLeft size={20} /></button>
          <div><p className="eyebrow">Active workout · Local save</p><h1>{session.title}</h1></div>
        </div>
        <div className="workout-header__stats">
          <div><small>Sets</small><strong>{completedSets}/{totalSets}</strong></div>
          <div><small>Volume</small><strong>{currentVolume.toLocaleString()}</strong></div>
          <div><small>Time</small><strong>{minutes}:{seconds}</strong></div>
          <button className={`timer-button ${timerRunning ? 'active' : ''}`} onClick={() => setTimerRunning((current) => !current)}>{timerRunning ? <Pause size={17} /> : <Play size={17} />}{timerRunning ? 'Pause' : 'Start timer'}</button>
        </div>
        <div className="workout-progress"><span style={{ width: `${progress}%` }} /></div>
      </header>

      <main className="workout-main">
        {!warmupConfirmed && session.readiness && session.readiness !== 'normal' && (
          <section className="warmup-check">
            <div><Sparkles size={20} /><span><strong>Warm-up confirmation</strong><small>Readiness is {session.readiness}. Let performance confirm the plan.</small></span></div>
            <div><button onClick={() => setWarmupConfirmed(true)}>Better</button><button onClick={() => setWarmupConfirmed(true)}>Normal</button><button onClick={() => { setWarmupConfirmed(true); setNotice('Keep the anchor conservative and monitor the first set.') }}>Harder</button><button className="pain" onClick={() => { setWarmupConfirmed(true); setNotice('Pain-aware mode: change or stop the affected movement.') }}>Painful</button><button className="text-button" onClick={() => setWarmupConfirmed(true)}>Skip</button></div>
          </section>
        )}

        <div className="workout-objective"><span className="status-chip status-chip--lime">{session.readiness ?? 'survey skipped'}</span><p>{session.objective}</p><span><Clock3 size={15} /> {session.durationMinutes} minute version</span></div>

        <div className="exercise-stack">
          {session.exercises.map((planned, exerciseIndex) => {
            const exercise = exercises.find((candidate) => candidate.id === planned.exerciseId)
            if (!exercise) return null
            const exactHistory = history.filter((set) => set.exerciseId === exercise.id)
            const recent = exactHistory.slice(-planned.sets.length)
            const lastVolume = volumeLoad(recent)
            const recommendation = recommendProgression({
              history: exactHistory,
              targetLoad: planned.sets[0]?.targetLoad ?? 0,
              targetReps: planned.sets[0]?.targetReps ?? 0,
              targetSets: planned.sets.length,
              repRange: planned.role === 'primary' ? [4, 6] : [8, 12],
              increment: planned.sets[0]?.targetLoad && planned.sets[0].targetLoad < 100 ? 2.5 : 5,
              continuity: useAppStore.getState().athlete.continuity,
              readiness: session.readiness ?? 'confirm'
            })
            const opportunities = deriveRecordOpportunities({ history, planned, exercise, readiness: session.readiness ?? 'confirm' })
            const exerciseAchievements = activeAchievementPreview.filter((event) => event.exerciseId === exercise.id)
            return (
              <article className={`exercise-card exercise-card--${planned.role}`} key={planned.id}>
                <div className="exercise-card__header">
                  <div className="exercise-index">{String(exerciseIndex + 1).padStart(2, '0')}</div>
                  <div className="exercise-title"><span>{roleLabel[planned.role]}</span><h2>{exercise.name}</h2><p>{planned.purpose}</p></div>
                  <div className="exercise-actions">
                    <button onClick={() => setSwapTarget(planned)}><RefreshCcw size={16} /> Change</button>
                    {planned.role !== 'primary' && <button onClick={() => skipExercise(session.id, planned.id)}><SkipForward size={16} /> Skip</button>}
                  </div>
                </div>
                <div className="exercise-context">
                  <div><small>Last exact exposure</small><strong>{recent.length ? `${recent[0].load} × ${recent[0].reps}` : 'No exact history'}</strong><span>{lastVolume.toLocaleString()} volume load</span></div>
                  <div><small>Engine decision</small><strong>{recommendation.title}</strong><span>{recommendation.confidence} confidence · {recommendation.action}</span></div>
                  <div><small>Joint response</small><strong className={`joint joint--${exercise.jointFeeling}`}>{exercise.jointFeeling}</strong><span>{exercise.favorite ? 'Preferred movement' : 'Neutral preference'}</span></div>
                  <button className="info-button" aria-label={`More information about ${exercise.name}`} title={recommendation.explanation}><Info size={17} /></button>
                </div>
                <div className="set-table" role="table" aria-label={`${exercise.name} sets`}>
                  <div className="set-table__head" role="row"><span>Set</span><span>Load</span><span>Reps</span><span>RIR</span><span>Status</span></div>
                  {planned.sets.map((workSet, index) => (
                    <div className={`set-row ${workSet.completed ? 'completed' : ''}`} role="row" key={workSet.id}>
                      <span className="set-number">{index + 1}</span>
                      <label><span className="sr-only">Set {index + 1} load</span><input type="number" inputMode="decimal" value={workSet.completedLoad ?? workSet.targetLoad} onChange={(event) => updateSet(session.id, planned.id, workSet.id, { load: Number(event.target.value) })} /><small>{settings.units}</small></label>
                      <label><span className="sr-only">Set {index + 1} repetitions</span><input type="number" inputMode="numeric" value={workSet.completedReps ?? workSet.targetReps} onChange={(event) => updateSet(session.id, planned.id, workSet.id, { reps: Number(event.target.value) })} /></label>
                      <label><span className="sr-only">Set {index + 1} repetitions in reserve</span><select value={workSet.actualRir ?? workSet.targetRir} onChange={(event) => updateSet(session.id, planned.id, workSet.id, { rir: Number(event.target.value) })}><option value="0">0</option><option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4+</option></select></label>
                      <button className="complete-set" onClick={() => logSet(planned.id, workSet.id, workSet.completed)} aria-pressed={workSet.completed}>{workSet.completed ? <><Check size={18} /> Done</> : 'Log set'}</button>
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
        <div><TimerReset size={18} /><span><strong>Every set is already saved.</strong><small>Only completed work enters volume and progression.</small></span></div>
        <button className="button button--primary" onClick={() => setFinishOpen(true)}>Finish workout <CheckCircle2 size={18} /></button>
      </footer>

      <Modal open={Boolean(swapTarget)} onClose={() => setSwapTarget(null)} title="Choose an educated replacement" description="Ranked by purpose, movement pattern, joint response, preference, and available equipment." wide>
        <div className="swap-list">
          {rankedSwaps.map(({ candidate, score }, index) => (
            <button key={candidate.id} className="swap-option" onClick={() => { if (swapTarget) swapExercise(session.id, swapTarget.id, candidate.id); setSwapTarget(null) }}>
              <span className="swap-rank">{index + 1}</span>
              <div><span className="eyebrow">{index < 2 ? 'Best match' : index < 4 ? 'Good alternative' : 'Changes focus'}</span><strong>{candidate.name}</strong><small>Preserves {candidate.pattern} · {candidate.primaryRegion} · joint response {candidate.jointFeeling}</small></div>
              <span className="swap-score">{score}/10<ChevronDown size={15} /></span>
            </button>
          ))}
        </div>
        <p className="modal-note">The selected movement receives its own prescription context. The original exact-movement progression clock remains frozen.</p>
      </Modal>

      <PostSurveyModal
        open={finishOpen}
        completedSets={completedSets}
        totalSets={totalSets}
        volume={currentVolume}
        estimatedStrength={bestEstimatedStrength}
        onClose={() => setFinishOpen(false)}
        onSkip={finishWithoutSurvey}
        onSubmit={(answers, feedbackNote) => {
          finishSession(session.id, { answers, note: feedbackNote, skipped: false })
          setFinishOpen(false)
        }}
      />
    </div>
  )
}
