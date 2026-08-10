import { useEffect, useState } from 'react'
import { AlarmClock, AlertTriangle, ArrowRight, BatteryCharging, CalendarClock, CheckCircle2, ChevronRight, Clock3, CloudOff, Dumbbell, Footprints, HelpCircle, RotateCcw, ShieldCheck, Sparkles, Trophy } from 'lucide-react'
import { estimatedOneRepMax, recommendProgression, volumeLoad } from '../domain/training-engine'
import type { EffectiveSurveyMode, MissedSessionReason, SurveyAnswer } from '../domain/types'
import { useAppStore } from '../store/useAppStore'
import { Modal } from '../components/Modal'
import { PixelAvatar } from '../components/PixelAvatar'
import { StatCard } from '../components/StatCard'
import { SurveyModal } from '../components/SurveyModal'
import { SurveyModeChooser } from '../components/SurveyModeChooser'
import { PostSurveyModal } from '../components/PostSurveyModal'
import { pendingDeferredFeedback } from '../domain/survey-engine'
import { exerciseEquipmentFit, loadIncrementFor, sessionEquipmentGaps } from '../domain/equipment-engine'

const timeOptions = [15, 30, 45, 60, 75]

export function TodayScreen() {
  const { athlete, settings, updateSettings, equipmentProfiles, sessions, exercises, history, startSession, setReadiness, markMissed, records, setNav, deferredFeedback, submitDeferredFeedback, dismissDeferredFeedback, expireDeferredFeedback } = useAppStore()
  const [surveyOpen, setSurveyOpen] = useState(false)
  const [surveyChooserOpen, setSurveyChooserOpen] = useState(false)
  const [activeSurveyMode, setActiveSurveyMode] = useState<Exclude<EffectiveSurveyMode, 'off'>>('full')
  const [whyOpen, setWhyOpen] = useState(false)
  const [missedOpen, setMissedOpen] = useState(false)
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const [equipmentGateOpen, setEquipmentGateOpen] = useState(false)
  const [pendingStart, setPendingStart] = useState<{ answers: SurveyAnswer[]; skipped: boolean; mode: EffectiveSurveyMode; minutes: number } | null>(null)
  const [missReason, setMissReason] = useState<MissedSessionReason>({ reason: 'family', nextMinutes: 45, continuing: true })
  const nextSession = sessions.find((session) => ['planned', 'deferred'].includes(session.status)) ?? sessions[0]
  const primaryPlan = nextSession?.exercises.find((exercise) => exercise.role === 'primary')
  const primaryExercise = exercises.find((exercise) => exercise.id === primaryPlan?.exerciseId)
  const primaryHistory = history.filter((set) => set.exerciseId === primaryExercise?.id)
  const activeEquipmentProfile = equipmentProfiles.find((profile) => profile.id === settings.activeEquipmentProfileId) ?? equipmentProfiles[0]
  const equipmentGaps = nextSession ? sessionEquipmentGaps(nextSession, exercises, activeEquipmentProfile) : []
  const placementBlocked = athlete.placement.selectedRoute === 'pain-aware-modified'
  const recentPrimary = primaryHistory.slice(-Math.max(1, primaryPlan?.sets.length ?? 1))
  const lastVolume = volumeLoad(recentPrimary)
  const recentRecord = records[0]
  const recentRecordValue = recentRecord
    ? `${recentRecord.value.toLocaleString()}${recentRecord.unit === 'repetitions' ? ' reps' : ` ${settings.units}`}`
    : 'No record'
  const today = new Date()
  const feedbackRequest = pendingDeferredFeedback(deferredFeedback, today)[0]
  const feedbackSession = sessions.find((session) => session.id === feedbackRequest?.sessionId)
  const feedbackSets = history.filter((workSet) => workSet.sessionId === feedbackRequest?.sessionId)
  const feedbackVolume = volumeLoad(feedbackSets)
  const feedbackEstimatedStrength = Math.max(0, ...feedbackSets.map((workSet) => estimatedOneRepMax(workSet.load, workSet.reps)))
  const feedbackTotalSets = feedbackSession?.exercises.flatMap((exercise) => exercise.sets).length ?? feedbackSets.length

  useEffect(() => {
    expireDeferredFeedback()
  }, [expireDeferredFeedback])

  const progression = recommendProgression({
    history: primaryHistory,
    targetLoad: primaryPlan?.sets[0]?.targetLoad ?? 0,
    targetReps: primaryPlan?.sets[0]?.targetReps ?? 0,
    targetSets: primaryPlan?.sets.length ?? 0,
    repRange: [4, 6],
    increment: primaryExercise ? loadIncrementFor(primaryExercise, activeEquipmentProfile).value : 5,
    continuity: athlete.continuity,
    readiness: nextSession?.readiness ?? 'confirm'
  })

  const commitStart = (start: { answers: SurveyAnswer[]; skipped: boolean; mode: EffectiveSurveyMode; minutes: number }) => {
    if (!nextSession) return
    setReadiness(nextSession.id, start.answers, start.skipped, start.mode)
    startSession(nextSession.id, start.minutes)
    setSurveyOpen(false)
    setSurveyChooserOpen(false)
    setEquipmentGateOpen(false)
    setPendingStart(null)
  }

  const begin = (answers: SurveyAnswer[] = [], skipped = false, mode: EffectiveSurveyMode = 'off') => {
    const timeAnswer = answers.find((answer) => answer.id === 'time' && answer.status === 'answered')
    const start = { answers, skipped, mode, minutes: typeof timeAnswer?.value === 'number' ? timeAnswer.value : settings.availableMinutes }
    if (equipmentGaps.length) {
      setPendingStart(start)
      setSurveyOpen(false)
      setSurveyChooserOpen(false)
      setEquipmentGateOpen(true)
      return
    }
    commitStart(start)
  }

  const openPreferredCheckIn = () => {
    if (placementBlocked) return
    if (settings.preSurveyMode === 'off') return begin([], true, 'off')
    if (settings.preSurveyMode === 'ask') return setSurveyChooserOpen(true)
    setActiveSurveyMode(settings.preSurveyMode)
    setSurveyOpen(true)
  }

  const checkInLabel = settings.preSurveyMode === 'off'
    ? 'Start workout now'
    : settings.preSurveyMode === 'ask'
      ? 'Choose check-in & start'
      : `${settings.preSurveyMode[0].toUpperCase()}${settings.preSurveyMode.slice(1)} check-in & start`

  return (
    <div className="screen screen--today">
      <header className="screen-header">
        <div>
          <p className="eyebrow">{today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
          <h1>Your next useful win.</h1>
          <p>Built from completed exposures, not an untouched calendar.</p>
        </div>
        <div className="local-pill"><CloudOff size={16} /><span>Local first<strong>Saved on this device</strong></span></div>
      </header>

      {feedbackRequest && feedbackSession && <section className="feedback-followup" aria-label="Optional session feedback">
        <span className="feedback-followup__icon"><AlarmClock size={20} /></span>
        <div><p className="eyebrow">Optional follow-up · never blocks training</p><strong>{feedbackSession.title}</strong><small>{feedbackRequest.mode} feedback expires {new Date(feedbackRequest.expiresAt).toLocaleString()}</small></div>
        <div className="feedback-followup__actions"><button className="button button--small button--primary" onClick={() => setFeedbackOpen(true)}>Add feedback</button><button className="button button--small button--ghost" onClick={() => dismissDeferredFeedback(feedbackRequest.id)}>Dismiss</button></div>
      </section>}

      <section className="hero-workout">
        <div className="hero-workout__content">
          <div className="hero-workout__meta">
            <span className="status-chip status-chip--lime"><BatteryCharging size={14} /> {athlete.continuity}</span>
            <span className="status-chip"><Clock3 size={14} /> {settings.availableMinutes} min</span>
            <span className={`status-chip ${equipmentGaps.length ? 'status-chip--warning' : ''}`}><Dumbbell size={14} /> {activeEquipmentProfile.name}</span>
          </div>
          <p className="eyebrow">Next best session · Exposure queue 01</p>
          <h2>{nextSession?.title}</h2>
          <p className="hero-workout__objective">{nextSession?.objective}</p>
          {placementBlocked && <button className="placement-training-gate" onClick={() => setNav('you')}><AlertTriangle size={19} /><span><strong>Workout start paused for placement review</strong><small>Your starting profile says pain or restriction changes what can be trained. Reassess the profile before starting. This is not medical clearance.</small></span><ChevronRight size={18} /></button>}
          {equipmentGaps.length > 0 && <button className="equipment-gate-callout" onClick={() => { setPendingStart(null); setEquipmentGateOpen(true) }}><AlertTriangle size={19} /><span><strong>{equipmentGaps.length} movement{equipmentGaps.length === 1 ? '' : 's'} need equipment review</strong><small>{activeEquipmentProfile.name} is missing required items. Unavailable sets cannot be logged until each movement is changed or the profile is corrected.</small></span><ChevronRight size={18} /></button>}
          <div className="anchor-prescription">
            <div className="anchor-prescription__icon"><Dumbbell size={24} /></div>
            <div><span>Primary anchor</span><strong>{primaryExercise?.name}</strong><small>{primaryPlan?.sets.length} sets × {primaryPlan?.sets[0]?.targetReps} reps · {primaryPlan?.sets[0]?.targetLoad} {settings.units} · {primaryPlan?.sets[0]?.targetRir} RIR</small></div>
            <div className="anchor-prescription__decision"><span>{progression.action}</span><strong>{progression.title}</strong></div>
          </div>
          <div className="hero-workout__actions">
            <button className="button button--primary button--large" disabled={placementBlocked} onClick={openPreferredCheckIn}>{placementBlocked ? 'Reassess before training' : checkInLabel} <ArrowRight size={18} /></button>
            {settings.preSurveyMode !== 'off' && <button className="button button--secondary" disabled={placementBlocked} onClick={() => begin([], true, 'off')}>Start without check-in</button>}
            <button className="button button--ghost" onClick={() => setWhyOpen(true)}><HelpCircle size={17} /> Why this session?</button>
          </div>
          <div className="time-budget" aria-label="Available workout time">
            <span>I have</span>
            {timeOptions.map((minutes) => <button key={minutes} className={settings.availableMinutes === minutes ? 'selected' : ''} onClick={() => updateSettings({ availableMinutes: minutes })}>{minutes}m</button>)}
          </div>
        </div>
        <div className="hero-workout__world" aria-hidden="true">
          <div className="world-grid" />
          <div className="pixel-platform" />
          <PixelAvatar mood="strong" size="large" />
          <div className="quest-bubble"><Sparkles size={15} /> Load first. Earn the jump.</div>
        </div>
      </section>

      <section className="stats-grid" aria-label="Current training snapshot">
        <StatCard label="Last anchor exposure" value={`${lastVolume.toLocaleString()} ${settings.units}`} detail={`${recentPrimary.length} completed sets · exact movement`} icon={<Dumbbell size={18} />} />
        <StatCard label="Current continuity" value={athlete.continuity} detail="Calendar pressure reduced · exposure clocks preserved" icon={<CalendarClock size={18} />} tone="orange" />
        <StatCard label="Recent record" value={recentRecordValue} detail={recentRecord?.label ?? 'Complete work to create a record'} icon={<Trophy size={18} />} tone="purple" />
        <StatCard label="Confidence" value="Medium" detail="Warm-up will confirm today's readiness hypothesis" icon={<ShieldCheck size={18} />} tone="blue" />
      </section>

      <div className="today-grid">
        <section className="panel">
          <div className="panel__header"><div><p className="eyebrow">Session map</p><h3>What today builds</h3></div><span>{nextSession?.exercises.length} movements</span></div>
          <ol className="session-map">
            {nextSession?.exercises.map((planned, index) => {
              const exercise = exercises.find((candidate) => candidate.id === planned.exerciseId)
              const fit = exercise ? exerciseEquipmentFit(exercise, activeEquipmentProfile) : null
              return <li key={planned.id} className={fit && !fit.available ? 'equipment-unavailable' : ''}><span className={`role-dot role-dot--${planned.role}`}>{index + 1}</span><div><strong>{exercise?.name}</strong><small>{planned.role} · {planned.purpose}{fit && !fit.available ? ` · missing ${fit.missing.join(', ')}` : ''}</small></div><span>{fit?.available ? 'ready' : `${planned.sets.length} × ${planned.sets[0]?.targetReps}`}</span></li>
            })}
          </ol>
        </section>
        <section className="panel">
          <div className="panel__header"><div><p className="eyebrow">Life-aware plan</p><h3>Schedule changed?</h3></div><RotateCcw size={19} /></div>
          <div className="life-card">
            <Footprints size={28} />
            <div><strong>No volume debt.</strong><p>If children, sleep, work, or life moved the week, the next plan will protect important work without cramming missed accessories into today.</p></div>
          </div>
          <button className="full-row-button" onClick={() => setMissedOpen(true)}>I missed this opportunity <ChevronRight size={18} /></button>
          <button className="full-row-button" onClick={() => setNav('plan')}>Review the full plan <ChevronRight size={18} /></button>
        </section>
      </div>

      <SurveyModeChooser open={surveyChooserOpen} cadence="pre" onClose={() => setSurveyChooserOpen(false)} onChoose={(mode) => { setActiveSurveyMode(mode); setSurveyChooserOpen(false); setSurveyOpen(true) }} onSkip={() => begin([], true, 'off')} />
      {surveyOpen && <SurveyModal open mode={activeSurveyMode} onClose={() => setSurveyOpen(false)} onSubmit={(answers) => begin(answers, false, activeSurveyMode)} onSkip={() => begin([], true, activeSurveyMode)} />}

      <Modal open={equipmentGateOpen} onClose={() => { setEquipmentGateOpen(false); setPendingStart(null) }} title="Resolve equipment before logging" description={`${activeEquipmentProfile.name} does not currently satisfy every explicit movement requirement. ForgePath will not pretend those movements are available.`} wide>
        <div className="equipment-gap-list">{equipmentGaps.map((gap) => {
          const original = exercises.find((exercise) => exercise.id === gap.exerciseId)
          const availableAlternatives = original ? exercises.filter((exercise) => !exercise.retired && exercise.id !== original.id && exerciseEquipmentFit(exercise, activeEquipmentProfile).available && (exercise.pattern === original.pattern || exercise.regions.includes(original.primaryRegion))).length : 0
          return <div key={gap.plannedExerciseId}><AlertTriangle size={18} /><span><strong>{gap.exerciseName}</strong><small>{gap.role} · missing {gap.missing.join(', ')} · {availableAlternatives} plausible available alternative{availableAlternatives === 1 ? '' : 's'}</small></span></div>
        })}</div>
        <p className="modal-note">You can correct the location profile, or enter the workout and replace each unavailable movement. Protected primary changes still require explicit confirmation.</p>
        <div className="modal__actions"><button className="button button--ghost" onClick={() => { setEquipmentGateOpen(false); setPendingStart(null) }}>Cancel</button><button className="button button--secondary" onClick={() => { setEquipmentGateOpen(false); setPendingStart(null); setNav('you') }}>Edit location</button>{pendingStart && <button className="button button--primary" onClick={() => commitStart(pendingStart)}>Start and resolve movements</button>}</div>
      </Modal>

      {feedbackOpen && feedbackRequest && feedbackSession && <PostSurveyModal
        open
        followUp
        mode={feedbackRequest.mode}
        completedSets={feedbackSets.length}
        totalSets={feedbackTotalSets}
        volume={feedbackVolume}
        estimatedStrength={feedbackEstimatedStrength}
        onClose={() => setFeedbackOpen(false)}
        onSkip={() => { dismissDeferredFeedback(feedbackRequest.id); setFeedbackOpen(false) }}
        onSubmit={(answers, note) => {
          const result = submitDeferredFeedback(feedbackRequest.id, answers, note)
          if (result.ok) setFeedbackOpen(false)
        }}
      />}

      <Modal open={whyOpen} onClose={() => setWhyOpen(false)} title="Why this session is next" description="ForgePath shows the rule inputs instead of hiding them in an AI score.">
        <div className="reason-stack">
          <div><span>01</span><p><strong>Bench is the highest overdue protected anchor.</strong>Your last qualified bench exposure remains the progression reference.</p></div>
          <div><span>02</span><p><strong>Upper-body work fits the current recovery pattern.</strong>It avoids stacking another high-cost hinge immediately.</p></div>
          <div><span>03</span><p><strong>The session compresses cleanly.</strong>At {settings.availableMinutes} minutes, primary bench and the two-board builder remain protected.</p></div>
          <div><span>04</span><p><strong>{progression.title}.</strong>{progression.explanation}</p></div>
        </div>
        <div className="modal__actions"><button className="button button--primary" onClick={() => setWhyOpen(false)}>Understood</button></div>
      </Modal>

      <Modal open={missedOpen} onClose={() => setMissedOpen(false)} title="Rebuild from what happened" description="Missing work does not earn progression or create catch-up debt.">
        <label className="field-label" htmlFor="miss-reason">What got in the way?</label>
        <select id="miss-reason" value={missReason.reason} onChange={(event) => setMissReason((current) => ({ ...current, reason: event.target.value as MissedSessionReason['reason'] }))}>
          <option value="family">Children or family</option><option value="work">Work</option><option value="time">Time</option><option value="sleep">Sleep</option><option value="pain">Pain</option><option value="illness">Illness</option><option value="travel">Travel</option><option value="equipment">Equipment</option><option value="motivation">Motivation</option><option value="other">Other</option>
        </select>
        <label className="field-label" htmlFor="next-time">Next realistic session length</label>
        <select id="next-time" value={missReason.nextMinutes} onChange={(event) => setMissReason((current) => ({ ...current, nextMinutes: Number(event.target.value) }))}><option value="15">15 minutes</option><option value="30">30 minutes</option><option value="45">45 minutes</option><option value="60">60 minutes</option></select>
        <label className="toggle-row"><span><strong>Constraint is still active</strong><small>The next session should remain conservative about time.</small></span><input type="checkbox" checked={missReason.continuing} onChange={(event) => setMissReason((current) => ({ ...current, continuing: event.target.checked }))} /></label>
        <div className="modal__actions"><button className="button button--ghost" onClick={() => setMissedOpen(false)}>Cancel</button><button className="button button--primary" onClick={() => { if (nextSession) markMissed(nextSession.id, missReason); setMissedOpen(false) }}><CheckCircle2 size={17} /> Rebuild my plan</button></div>
      </Modal>
    </div>
  )
}
