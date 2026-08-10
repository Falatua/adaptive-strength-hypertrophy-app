import { useState } from 'react'
import { ArrowRight, BatteryCharging, CalendarClock, CheckCircle2, ChevronRight, Clock3, CloudOff, Dumbbell, Footprints, HelpCircle, RotateCcw, ShieldCheck, Sparkles, Trophy } from 'lucide-react'
import { recommendProgression, volumeLoad } from '../domain/training-engine'
import type { MissedSessionReason, SurveyAnswer } from '../domain/types'
import { useAppStore } from '../store/useAppStore'
import { Modal } from '../components/Modal'
import { PixelAvatar } from '../components/PixelAvatar'
import { StatCard } from '../components/StatCard'
import { SurveyModal } from '../components/SurveyModal'

const timeOptions = [15, 30, 45, 60, 75]

export function TodayScreen() {
  const { athlete, settings, updateSettings, sessions, exercises, history, startSession, setReadiness, markMissed, records, setNav } = useAppStore()
  const [surveyOpen, setSurveyOpen] = useState(false)
  const [whyOpen, setWhyOpen] = useState(false)
  const [missedOpen, setMissedOpen] = useState(false)
  const [missReason, setMissReason] = useState<MissedSessionReason>({ reason: 'family', nextMinutes: 45, continuing: true })
  const nextSession = sessions.find((session) => ['planned', 'deferred'].includes(session.status)) ?? sessions[0]
  const primaryPlan = nextSession?.exercises.find((exercise) => exercise.role === 'primary')
  const primaryExercise = exercises.find((exercise) => exercise.id === primaryPlan?.exerciseId)
  const primaryHistory = history.filter((set) => set.exerciseId === primaryExercise?.id)
  const recentPrimary = primaryHistory.slice(-Math.max(1, primaryPlan?.sets.length ?? 1))
  const lastVolume = volumeLoad(recentPrimary)
  const today = new Date()

  const progression = recommendProgression({
    history: primaryHistory,
    targetLoad: primaryPlan?.sets[0]?.targetLoad ?? 0,
    targetReps: primaryPlan?.sets[0]?.targetReps ?? 0,
    targetSets: primaryPlan?.sets.length ?? 0,
    repRange: [4, 6],
    increment: 5,
    continuity: athlete.continuity,
    readiness: nextSession?.readiness ?? 'confirm'
  })

  const begin = (answers?: SurveyAnswer[], skipped = false) => {
    if (!nextSession) return
    setReadiness(nextSession.id, answers ?? [], skipped)
    startSession(nextSession.id, settings.availableMinutes)
    setSurveyOpen(false)
  }

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

      <section className="hero-workout">
        <div className="hero-workout__content">
          <div className="hero-workout__meta">
            <span className="status-chip status-chip--lime"><BatteryCharging size={14} /> {athlete.continuity}</span>
            <span className="status-chip"><Clock3 size={14} /> {settings.availableMinutes} min</span>
            <span className="status-chip"><Dumbbell size={14} /> {settings.equipmentLocation}</span>
          </div>
          <p className="eyebrow">Next best session · Exposure queue 01</p>
          <h2>{nextSession?.title}</h2>
          <p className="hero-workout__objective">{nextSession?.objective}</p>
          <div className="anchor-prescription">
            <div className="anchor-prescription__icon"><Dumbbell size={24} /></div>
            <div><span>Primary anchor</span><strong>{primaryExercise?.name}</strong><small>{primaryPlan?.sets.length} sets × {primaryPlan?.sets[0]?.targetReps} reps · {primaryPlan?.sets[0]?.targetLoad} {settings.units} · {primaryPlan?.sets[0]?.targetRir} RIR</small></div>
            <div className="anchor-prescription__decision"><span>{progression.action}</span><strong>{progression.title}</strong></div>
          </div>
          <div className="hero-workout__actions">
            <button className="button button--primary button--large" onClick={() => setSurveyOpen(true)}>Check in & start <ArrowRight size={18} /></button>
            <button className="button button--secondary" onClick={() => begin([], true)}>Start without check-in</button>
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
        <StatCard label="Last anchor exposure" value={`${lastVolume.toLocaleString()} lb`} detail={`${recentPrimary.length} completed sets · exact movement`} icon={<Dumbbell size={18} />} />
        <StatCard label="Current continuity" value={athlete.continuity} detail="Calendar pressure reduced · exposure clocks preserved" icon={<CalendarClock size={18} />} tone="orange" />
        <StatCard label="Recent record" value={records[0]?.value ? `${records[0].value} lb` : 'No record'} detail={records[0]?.label ?? 'Complete work to create a record'} icon={<Trophy size={18} />} tone="purple" />
        <StatCard label="Confidence" value="Medium" detail="Warm-up will confirm today's readiness hypothesis" icon={<ShieldCheck size={18} />} tone="blue" />
      </section>

      <div className="today-grid">
        <section className="panel">
          <div className="panel__header"><div><p className="eyebrow">Session map</p><h3>What today builds</h3></div><span>{nextSession?.exercises.length} movements</span></div>
          <ol className="session-map">
            {nextSession?.exercises.map((planned, index) => {
              const exercise = exercises.find((candidate) => candidate.id === planned.exerciseId)
              return <li key={planned.id}><span className={`role-dot role-dot--${planned.role}`}>{index + 1}</span><div><strong>{exercise?.name}</strong><small>{planned.role} · {planned.purpose}</small></div><span>{planned.sets.length} × {planned.sets[0]?.targetReps}</span></li>
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

      <SurveyModal open={surveyOpen} onClose={() => setSurveyOpen(false)} onSubmit={(answers) => begin(answers, false)} onSkip={() => begin([], true)} />

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
