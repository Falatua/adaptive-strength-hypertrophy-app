import { useMemo, useState } from 'react'
import { AlertTriangle, ArrowRight, BrainCircuit, CalendarClock, Check, Gauge, ShieldCheck, Sparkles } from 'lucide-react'
import { applyPlacementDecision, buildPlacementAssessment, placementRouteLabels } from '../domain/placement-engine'
import { routeSessionProfile } from '../domain/route-session-engine'
import type { PlacementDecision, PlacementGoal, PlacementInputs, PlacementPainState } from '../domain/types'
import { useAppStore } from '../store/useAppStore'
import { PixelAvatar } from './PixelAvatar'

const goals: Array<{ id: PlacementGoal; label: string }> = [
  { id: 'powerbuilding', label: 'Powerbuilding' }, { id: 'strength', label: 'Strength' },
  { id: 'hypertrophy', label: 'Hypertrophy' }, { id: 'power', label: 'Power' },
  { id: 'event-specific', label: 'Event-specific' }, { id: 'return-to-training', label: 'Return to training' }
]
const times = [30, 45, 60, 75]

function DimensionPicker({ label, value, onChange, low, high }: { label: string; value: number | null; onChange: (value: number | null) => void; low: string; high: string }) {
  return <fieldset className="placement-picker"><legend>{label}</legend><div>{[1, 2, 3, 4, 5].map((item) => <button type="button" key={item} className={value === item ? 'selected' : ''} aria-label={`${label}: ${item}`} onClick={() => onChange(item)}>{item}</button>)}<button type="button" className={value === null ? 'selected unknown' : 'unknown'} onClick={() => onChange(null)}>Not sure</button></div><small><span>{low}</span><span>{high}</span></small></fieldset>
}

export function Onboarding() {
  const { completeOnboarding, equipmentProfiles, setActiveEquipmentProfile, setNav, setNotice } = useAppStore()
  const [createdAt] = useState(() => new Date().toISOString())
  const [step, setStep] = useState(0)
  const [goal, setGoal] = useState<PlacementGoal | null>('powerbuilding')
  const [fixedEvent, setFixedEvent] = useState('')
  const [minutes, setMinutes] = useState(60)
  const [opportunities, setOpportunities] = useState(3)
  const [experience, setExperience] = useState<number | null>(8)
  const [continuity, setContinuity] = useState<PlacementInputs['continuity']>('interrupted')
  const [movementSkill, setMovementSkill] = useState<number | null>(4)
  const [strengthTolerance, setStrengthTolerance] = useState<number | null>(4)
  const [volumeTolerance, setVolumeTolerance] = useState<number | null>(4)
  const [scheduleStability, setScheduleStability] = useState<number | null>(3)
  const [dataConfidence, setDataConfidence] = useState<number | null>(3)
  const [painState, setPainState] = useState<PlacementPainState>('none')
  const [equipmentProfileId, setEquipmentProfileId] = useState('equipment-commercial-gym')
  const [skippedFields, setSkippedFields] = useState<string[]>([])
  const [decision, setDecision] = useState<PlacementDecision>('confirmed')

  const inputs = useMemo<PlacementInputs>(() => ({
    goal, fixedEvent: fixedEvent.trim() || null, trainingAge: experience, continuity, movementSkill,
    strengthTolerance, volumeTolerance, scheduleStability, dataConfidence, painState,
    weeklyOpportunities: opportunities, defaultMinutes: minutes, equipmentProfileId, skippedFields
  }), [continuity, dataConfidence, equipmentProfileId, experience, fixedEvent, goal, minutes, movementSkill, opportunities, painState, scheduleStability, skippedFields, strengthTolerance, volumeTolerance])
  const assessment = useMemo(() => buildPlacementAssessment(inputs, createdAt), [createdAt, inputs])
  const selectedAssessment = useMemo(() => applyPlacementDecision(assessment, decision), [assessment, decision])
  const selectedRouteProfile = useMemo(() => routeSessionProfile(selectedAssessment.selectedRoute), [selectedAssessment.selectedRoute])

  const persistPlacement = (placementDecision: PlacementDecision = decision, destination: 'today' | 'library' = 'today', quick = false) => {
    const profile = equipmentProfiles.find((candidate) => candidate.id === equipmentProfileId) ?? equipmentProfiles[0]
    const sourceAssessment = quick ? buildPlacementAssessment({ ...inputs, equipmentProfileId: profile.id, skippedFields: [...new Set([...inputs.skippedFields, 'complete starting-profile confirmation'])] }, createdAt) : assessment
    const placement = applyPlacementDecision(sourceAssessment, quick ? 'quick-start' : placementDecision)
    setActiveEquipmentProfile(profile.id)
    completeOnboarding({
      trainingAge: experience ?? 0,
      weeklyOpportunities: opportunities,
      defaultMinutes: minutes,
      equipmentProfile: profile.name,
      goal: `${goal ? goals.find((item) => item.id === goal)?.label : 'Goal calibration'}: protect useful training while the first sessions verify current capacity`,
      continuity: continuity ?? 'interrupted',
      entryRoute: placementRouteLabels[placement.selectedRoute],
      placement,
      level: placement.dimensions
    })
    if (placement.selectedRoute === 'pain-aware-modified') {
      setNav('you')
      setNotice('Pain-aware placement saved. Workout start is paused until you reassess the restriction state. This is not medical clearance.')
    } else if (destination === 'library') {
      setNav('library')
      setNotice('Starting profile saved. Open Import history to add prior completed training before calibration.')
    }
  }

  const skipStep = () => {
    if (step === 0) {
      setGoal(null); setFixedEvent(''); setExperience(null); setSkippedFields((current) => [...new Set([...current, 'goal', 'structured training history'])])
    } else if (step === 1) {
      setMovementSkill(null); setStrengthTolerance(null); setVolumeTolerance(null); setDataConfidence(null); setSkippedFields((current) => [...new Set([...current, 'movement skill', 'intensity tolerance', 'volume tolerance', 'current performance evidence'])])
    } else if (step === 2) {
      setContinuity(null); setScheduleStability(null); setPainState('unknown'); setSkippedFields((current) => [...new Set([...current, 'recent continuity', 'schedule stability', 'pain or restriction state'])])
    }
    setDecision('confirmed')
    setStep((current) => Math.min(3, current + 1))
  }

  return (
    <div className="onboarding">
      <div className="onboarding__art">
        <div className="pixel-sun" /><div className="pixel-mountain pixel-mountain--one" /><div className="pixel-mountain pixel-mountain--two" />
        <PixelAvatar size="large" mood={step === 3 ? 'celebrate' : 'strong'} />
        <div className="onboarding__art-copy"><span className="eyebrow">Private Alpha · Local first</span><h1>Build the athlete.<br />Adapt the path.</h1><p>Experience, current readiness, and real-life capacity stay separate. The app starts with a hypothesis, then learns from completed work.</p></div>
      </div>
      <div className="onboarding__panel">
        <div className="onboarding__brand"><span className="brand__mark">F</span><strong>ForgePath</strong></div>
        <div className="onboarding__steps" aria-label="Onboarding progress">{[0, 1, 2, 3].map((item) => <span key={item} className={step >= item ? 'active' : ''} />)}</div>

        {step === 0 && <section>
          <p className="eyebrow">01 · Direction and training history</p><h2>Build my starting profile</h2>
          <p className="muted">Answer what you know. Every question can be skipped, and missing evidence lowers confidence instead of becoming a fake answer.</p>
          <div className="onboarding-fast-routes"><button onClick={() => persistPlacement('quick-start', 'today', true)}><Sparkles size={18} /><span><strong>Quick Start</strong><small>Enter now with a low-confidence calibration route.</small></span></button><button onClick={() => persistPlacement('quick-start', 'library', true)}><BrainCircuit size={18} /><span><strong>Import History</strong><small>Set up locally, then map prior completed sets.</small></span></button></div>
          <label className="field-label">Primary goal</label><div className="choice-grid placement-goals">{goals.map((item) => <button key={item.id} className={goal === item.id ? 'selected' : ''} onClick={() => setGoal(item.id)}>{goal === item.id && <Check size={16} />}{item.label}</button>)}<button className={goal === null ? 'selected' : ''} onClick={() => setGoal(null)}>Not sure yet</button></div>
          {goal === 'event-specific' && <label><span className="field-label">Event and date, if known</span><input value={fixedEvent} onChange={(event) => setFixedEvent(event.target.value)} placeholder="Example: powerlifting meet · 2026-12-12" /></label>}
          <label><span className="field-label">Years of structured training</span><input aria-label="Years of structured training" type="number" min="0" max="60" value={experience ?? ''} onChange={(event) => setExperience(event.target.value === '' ? null : Number(event.target.value))} placeholder="Skip if uncertain" /></label>
        </section>}

        {step === 1 && <section>
          <p className="eyebrow">02 · Current training capacity</p><h2>Past experience is not current tolerance.</h2><p className="muted">Score the work you can perform now, not your all-time best.</p>
          <div className="placement-picker-stack">
            <DimensionPicker label="Movement skill" value={movementSkill} onChange={setMovementSkill} low="New or inconsistent" high="Highly repeatable" />
            <DimensionPicker label="Intensity tolerance" value={strengthTolerance} onChange={setStrengthTolerance} low="Needs calibration" high="Heavy work is familiar" />
            <DimensionPicker label="Volume tolerance" value={volumeTolerance} onChange={setVolumeTolerance} low="Low current capacity" high="High recoverable capacity" />
            <DimensionPicker label="Current evidence quality" value={dataConfidence} onChange={setDataConfidence} low="Mostly uncertain" high="Recent reliable logs" />
          </div>
        </section>}

        {step === 2 && <section>
          <p className="eyebrow">03 · Real-life capacity and constraints</p><h2>What can training support now?</h2><p className="muted">The plan uses realistic opportunities, available equipment, and known restrictions.</p>
          <label className="field-label">Training opportunities each week</label><div className="choice-row">{[2, 3, 4, 5].map((item) => <button key={item} className={opportunities === item ? 'selected' : ''} onClick={() => setOpportunities(item)}>{item}×</button>)}</div>
          <label className="field-label">Usual time per session</label><div className="choice-row">{times.map((item) => <button key={item} className={minutes === item ? 'selected' : ''} onClick={() => setMinutes(item)}>{item}m</button>)}</div>
          <label className="field-label">Usual training location</label><div className="choice-row onboarding-equipment">{equipmentProfiles.map((profile) => <button key={profile.id} className={equipmentProfileId === profile.id ? 'selected' : ''} onClick={() => setEquipmentProfileId(profile.id)}>{profile.name}<small>{profile.equipment.length} items</small></button>)}</div>
          <label className="field-label">Recent training continuity</label><div className="stacked-choices">{([
            ['stable', 'Stable', 'Consistent useful training during the last month.'], ['interrupted', 'Interrupted', 'Some recent work, but life disrupted the pattern.'],
            ['returning', 'Returning', 'A meaningful gap makes current tolerance uncertain.']
          ] as const).map(([id, title, detail]) => <button key={id} className={continuity === id ? 'selected' : ''} onClick={() => setContinuity(id)}><span>{title}<small>{detail}</small></span>{continuity === id && <Check size={18} />}</button>)}<button className={continuity === null ? 'selected' : ''} onClick={() => setContinuity(null)}><span>Not sure<small>Keep recent continuity unknown.</small></span></button></div>
          <DimensionPicker label="Schedule stability" value={scheduleStability} onChange={setScheduleStability} low="Changes often" high="Highly predictable" />
          <label className="field-label">Pain or restriction state</label><div className="stacked-choices compact">{([
            ['none', 'No current restriction', 'No known issue changes exercise choice.'], ['manageable', 'Manageable known issue', 'Monitor it, but useful training is still possible.'],
            ['modifying', 'Changes what I can train', 'Movement choice needs a pain-aware review.'], ['unknown', 'Prefer not to answer', 'Keep this safety input unknown.']
          ] as const).map(([id, title, detail]) => <button key={id} className={painState === id ? 'selected' : ''} onClick={() => setPainState(id)}><span>{title}<small>{detail}</small></span>{painState === id && <Check size={18} />}</button>)}</div>
        </section>}

        {step === 3 && <section className="placement-result">
          <p className="eyebrow">04 · Explainable starting placement</p><h2>{placementRouteLabels[selectedAssessment.selectedRoute]}</h2>
          <div className={`placement-confidence placement-confidence--${selectedAssessment.confidence}`}><Gauge size={19} /><span><strong>{selectedAssessment.confidence} confidence</strong><small>Placement is a hypothesis, not a permanent level.</small></span></div>
          {selectedAssessment.selectedRoute !== selectedAssessment.recommendedRoute && <p className="placement-decision-note"><ShieldCheck size={15} /> Engine recommendation: {placementRouteLabels[selectedAssessment.recommendedRoute]}. Your conservative choice is stored separately.</p>}
          {selectedAssessment.selectedRoute === 'pain-aware-modified' && <div className="placement-safety"><AlertTriangle size={19} /><span><strong>Plan review required</strong><small>This is not medical clearance. Review movement restrictions before training and seek qualified care for new, severe, or unexplained pain.</small></span></div>}
          <div className="placement-dimensions">{Object.entries(selectedAssessment.dimensions).map(([key, value]) => <div key={key}><span>{key.replace(/([A-Z])/g, ' $1')}</span><div>{Array.from({ length: 5 }, (_, index) => <i key={index} className={index < value ? 'filled' : ''} />)}</div><strong>{value}/5</strong></div>)}</div>
          <div className="placement-explanation"><h3>Why the engine recommended {placementRouteLabels[selectedAssessment.recommendedRoute]}</h3><ul>{selectedAssessment.reasons.map((reason) => <li key={reason}><Check size={15} />{reason}</li>)}</ul></div>
          {selectedAssessment.uncertainInputs.length > 0 && <details><summary>Uncertain inputs · {selectedAssessment.uncertainInputs.length}</summary><p>{selectedAssessment.uncertainInputs.join(', ')}. These stay unknown and reduce confidence.</p></details>}
          <details><summary>Why not lower or higher?</summary><p><strong>Lower:</strong> {selectedAssessment.whyNotLower}</p><p><strong>Higher:</strong> {selectedAssessment.whyNotHigher}</p></details>
          <details open><summary>First-session verification plan</summary><ul>{selectedAssessment.verificationPlan.map((item) => <li key={item}>{item}</li>)}</ul></details>
          <div className="route-session-preview">
            <div><Sparkles size={18} /><span><strong>Your starting sessions will actually change</strong><small>{selectedRouteProfile.ruleVersion} · {selectedRouteProfile.label}</small></span></div>
            {selectedAssessment.selectedRoute === 'pain-aware-modified' ? <p>Automatic session generation stays paused until you reassess movement restrictions. Existing completed work remains untouched.</p> : <><p>{selectedRouteProfile.strategy}</p><div className="route-session-preview__grid"><span><small>Primary</small><strong>{selectedRouteProfile.primary.sets} × {selectedRouteProfile.primary.reps}</strong><em>{selectedRouteProfile.primary.rir} RIR · {selectedRouteProfile.primary.restSeconds}s rest</em></span><span><small>Secondary</small><strong>{selectedRouteProfile.secondary.sets} × {selectedRouteProfile.secondary.reps}</strong><em>{selectedRouteProfile.secondary.rir} RIR · {selectedRouteProfile.secondary.restSeconds}s rest</em></span><span><small>Accessories</small><strong>{selectedRouteProfile.accessory.sets} × {selectedRouteProfile.accessory.reps}</strong><em>up to {selectedRouteProfile.maximumAccessories} · {selectedRouteProfile.accessory.rir} RIR</em></span></div><small>{selectedRouteProfile.warmupGuidance}</small></>}
          </div>
          <div className="placement-controls"><button className={decision === 'conservative' ? 'selected' : ''} onClick={() => setDecision(decision === 'conservative' ? 'confirmed' : 'conservative')}><ShieldCheck size={17} /><span><strong>Start more conservatively</strong><small>Use {placementRouteLabels[applyPlacementDecision(assessment, 'conservative').selectedRoute]}.</small></span></button><button className={decision === 'aggressive-test' ? 'selected' : ''} onClick={() => setDecision(decision === 'aggressive-test' ? 'confirmed' : 'aggressive-test')}><Sparkles size={17} /><span><strong>I am ready for more</strong><small>Keep this route, but request faster productive verification.</small></span></button><button className="placement-controls__wide" onClick={() => persistPlacement(decision, 'library')}><BrainCircuit size={17} /><span><strong>Correct or import my training history</strong><small>Save this hypothesis, then improve its evidence in Library.</small></span></button></div>
          <ul className="check-list"><li><Check size={16} /> Surveys remain optional</li><li><Check size={16} /> Missed sessions create no volume debt</li><li><CalendarClock size={16} /> Exit depends on criteria, not an arbitrary date</li><li><ShieldCheck size={16} /> Data stays on this device for now</li></ul>
        </section>}

        <div className="onboarding__actions">{step > 0 && <button className="button button--ghost" onClick={() => { setDecision('confirmed'); setStep((current) => current - 1) }}>Back</button>}{step < 3 ? <button className="button button--primary" onClick={() => { setDecision('confirmed'); setStep((current) => current + 1) }}>Continue <ArrowRight size={17} /></button> : <button className="button button--primary" onClick={() => persistPlacement()}>This looks right · Enter ForgePath <ArrowRight size={17} /></button>}</div>
        {step < 3 ? <button className="onboarding__skip" onClick={skipStep}>Skip this section</button> : <button className="onboarding__skip" onClick={() => { setDecision('confirmed'); setStep(0) }}>Correct my answers or choose a different goal</button>}
      </div>
    </div>
  )
}
