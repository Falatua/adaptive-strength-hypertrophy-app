import { useMemo, useState } from 'react'
import { AlertTriangle, ArrowRight, BrainCircuit, CalendarClock, Check, Dumbbell, Gauge, ShieldCheck, Sparkles } from 'lucide-react'
import { applyPlacementDecision, buildPlacementAssessment, placementRouteLabels } from '../domain/placement-engine'
import { routeSessionProfile } from '../domain/route-session-engine'
import { exerciseEquipmentFit } from '../domain/equipment-engine'
import { buildPlacementHistoryEvidence } from '../domain/placement-history-engine'
import type { MovementPlacementInput, PlacementDecision, PlacementGoal, PlacementHistoryAcceptedField, PlacementInputs, PlacementPainState } from '../domain/types'
import { useAppStore } from '../store/useAppStore'
import { PixelAvatar } from './PixelAvatar'

const goals: Array<{ id: PlacementGoal; label: string }> = [
  { id: 'strength', label: 'Powerlifting' }, { id: 'hypertrophy', label: 'Hypertrophy' }
]
const times = [30, 45, 60, 75]

function DimensionPicker({ label, value, onChange, low, high }: { label: string; value: number | null; onChange: (value: number | null) => void; low: string; high: string }) {
  return <fieldset className="placement-picker"><legend>{label}</legend><div>{[1, 2, 3, 4, 5].map((item) => <button type="button" key={item} className={value === item ? 'selected' : ''} aria-label={`${label}: ${item}`} onClick={() => onChange(item)}>{item}</button>)}<button type="button" className={value === null ? 'selected unknown' : 'unknown'} onClick={() => onChange(null)}>Not sure</button></div><small><span>{low}</span><span>{high}</span></small></fieldset>
}

function MovementScorePicker({ exerciseName, label, value, onChange }: { exerciseName: string; label: string; value: number | null; onChange: (value: number | null) => void }) {
  return <fieldset className="movement-score-picker"><legend>{label}</legend><div>{[1, 2, 3, 4, 5].map((item) => <button type="button" key={item} className={value === item ? 'selected' : ''} aria-label={`${exerciseName} ${label}: ${item}`} onClick={() => onChange(item)}>{item}</button>)}<button type="button" className={value === null ? 'selected unknown' : 'unknown'} aria-label={`${exerciseName} ${label}: Not sure`} onClick={() => onChange(null)}>?</button></div></fieldset>
}

export function Onboarding() {
  const { completeOnboarding, equipmentProfiles, exercises, history, athlete, settings, onboardingStartStep, setActiveEquipmentProfile, setNav, setNotice } = useAppStore()
  const priorInputs = athlete.placement.inputs
  const isHistoryReview = onboardingStartStep === 1
  const [createdAt] = useState(() => new Date().toISOString())
  const [step, setStep] = useState<number>(onboardingStartStep)
  const [goal, setGoal] = useState<PlacementGoal | null>(isHistoryReview ? priorInputs.goal : null)
  const fixedEvent = isHistoryReview ? priorInputs.fixedEvent ?? '' : ''
  const [minutes, setMinutes] = useState(isHistoryReview ? priorInputs.defaultMinutes : 60)
  const [opportunities, setOpportunities] = useState(isHistoryReview ? priorInputs.weeklyOpportunities : 3)
  const [experience, setExperience] = useState<number | null>(isHistoryReview ? priorInputs.trainingAge : 8)
  const [continuity, setContinuity] = useState<PlacementInputs['continuity']>(isHistoryReview ? priorInputs.continuity : 'interrupted')
  const [movementSkill, setMovementSkill] = useState<number | null>(isHistoryReview ? priorInputs.movementSkill : 4)
  const [strengthTolerance, setStrengthTolerance] = useState<number | null>(isHistoryReview ? priorInputs.strengthTolerance : 4)
  const [volumeTolerance, setVolumeTolerance] = useState<number | null>(isHistoryReview ? priorInputs.volumeTolerance : 4)
  const [scheduleStability, setScheduleStability] = useState<number | null>(isHistoryReview ? priorInputs.scheduleStability : 3)
  const [dataConfidence, setDataConfidence] = useState<number | null>(isHistoryReview ? priorInputs.dataConfidence : 3)
  const [painState, setPainState] = useState<PlacementPainState>(isHistoryReview ? priorInputs.painState : 'none')
  const [equipmentProfileId, setEquipmentProfileId] = useState(isHistoryReview ? priorInputs.equipmentProfileId : settings.activeEquipmentProfileId)
  const [movementProfiles, setMovementProfiles] = useState<MovementPlacementInput[]>(() => athlete.strengthAnchors.flatMap((exerciseId) => {
    const exercise = exercises.find((candidate) => candidate.id === exerciseId)
    if (!exercise) return []
    const existing = athlete.placement.inputs.movementProfiles?.find((profile) => profile.exerciseId === exerciseId)
    return [{
      exerciseId,
      exerciseName: exercise.name,
      family: exercise.family,
      movementSkill: existing?.movementSkill ?? 4,
      strengthTolerance: existing?.strengthTolerance ?? 4,
      dataConfidence: existing?.dataConfidence ?? 3,
      ...(existing?.historyReview ? { historyReview: structuredClone(existing.historyReview) } : {})
    }]
  }))
  const [skippedFields, setSkippedFields] = useState<string[]>(isHistoryReview ? priorInputs.skippedFields : [])
  const [decision, setDecision] = useState<PlacementDecision>('confirmed')

  const inputs = useMemo<PlacementInputs>(() => ({
    goal, fixedEvent: fixedEvent.trim() || null, trainingAge: experience, continuity, movementSkill,
    strengthTolerance, volumeTolerance, scheduleStability, dataConfidence, painState,
    weeklyOpportunities: opportunities, defaultMinutes: minutes, equipmentProfileId, skippedFields, movementProfiles
  }), [continuity, dataConfidence, equipmentProfileId, experience, fixedEvent, goal, minutes, movementProfiles, movementSkill, opportunities, painState, scheduleStability, skippedFields, strengthTolerance, volumeTolerance])
  const assessment = useMemo(() => buildPlacementAssessment(inputs, createdAt), [createdAt, inputs])
  const selectedAssessment = useMemo(() => applyPlacementDecision(assessment, decision), [assessment, decision])
  const selectedRouteProfile = useMemo(() => routeSessionProfile(selectedAssessment.selectedRoute), [selectedAssessment.selectedRoute])
  const selectedEquipmentProfile = equipmentProfiles.find((profile) => profile.id === equipmentProfileId) ?? equipmentProfiles[0]
  const protectedAnchorConflicts = athlete.strengthAnchors.flatMap((exerciseId) => {
    const exercise = exercises.find((candidate) => candidate.id === exerciseId)
    if (!exercise) return []
    const fit = exerciseEquipmentFit(exercise, selectedEquipmentProfile)
    return fit.available ? [] : [{ exercise, missing: fit.missing }]
  })
  const historyEvidence = useMemo(() => new Map(athlete.strengthAnchors.flatMap((exerciseId) => {
    const exercise = exercises.find((candidate) => candidate.id === exerciseId)
    return exercise ? [[exerciseId, buildPlacementHistoryEvidence({ exercise, history, assessedAt: createdAt })] as const] : []
  })), [athlete.strengthAnchors, createdAt, exercises, history])
  const updateMovementProfile = (exerciseId: string, field: 'movementSkill' | 'strengthTolerance' | 'dataConfidence', value: number | null) => setMovementProfiles((current) => current.map((profile) => {
    if (profile.exerciseId !== exerciseId) return profile
    if (!profile.historyReview || field === 'movementSkill') return { ...profile, [field]: value }
    const acceptedFields = profile.historyReview.acceptedFields.filter((accepted) => accepted !== field)
    return { ...profile, [field]: value, ...(acceptedFields.length ? { historyReview: { ...profile.historyReview, acceptedFields } } : { historyReview: undefined }) }
  }))
  const acceptHistorySuggestion = (exerciseId: string, field: PlacementHistoryAcceptedField) => setMovementProfiles((current) => current.map((profile) => {
    if (profile.exerciseId !== exerciseId) return profile
    const evidence = historyEvidence.get(exerciseId)
    if (!evidence || evidence.totalSetCount === 0 || (field === 'strengthTolerance' && evidence.suggestedStrengthTolerance === null)) return profile
    const priorAccepted = (profile.historyReview?.acceptedFields ?? []).filter((accepted) => accepted !== 'strengthTolerance' || evidence.suggestedStrengthTolerance !== null)
    const acceptedFields = [...new Set([...priorAccepted, field])]
    return {
      ...profile,
      ...(acceptedFields.includes('dataConfidence') ? { dataConfidence: evidence.suggestedDataConfidence } : {}),
      ...(acceptedFields.includes('strengthTolerance') ? { strengthTolerance: evidence.suggestedStrengthTolerance! } : {}),
      historyReview: { evidence: structuredClone(evidence), acceptedFields, reviewedAt: createdAt }
    }
  }))

  const persistPlacement = (placementDecision: PlacementDecision = decision, destination: 'today' | 'library' = 'today', quick = false) => {
    const profile = equipmentProfiles.find((candidate) => candidate.id === equipmentProfileId) ?? equipmentProfiles[0]
    const sourceAssessment = quick ? buildPlacementAssessment({ ...inputs, equipmentProfileId: profile.id, skippedFields: [...new Set([...inputs.skippedFields, 'complete starting-profile confirmation'])] }, createdAt) : assessment
    const placement = applyPlacementDecision(sourceAssessment, quick ? 'quick-start' : placementDecision)
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
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
      setGoal(null); setExperience(null); setSkippedFields((current) => [...new Set([...current, 'goal', 'structured training history'])])
    } else if (step === 1) {
      setMovementSkill(null); setStrengthTolerance(null); setVolumeTolerance(null); setDataConfidence(null); setSkippedFields((current) => [...new Set([...current, 'movement skill', 'intensity tolerance', 'volume tolerance', 'current performance evidence'])])
      setMovementProfiles((current) => current.map((profile) => ({ ...profile, movementSkill: null, strengthTolerance: null, dataConfidence: null })))
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
      <main id="main-content" className="onboarding__panel" tabIndex={-1}>
        <div className="onboarding__brand"><span className="brand__mark">F</span><strong>ForgePath</strong></div>
        <div className="onboarding__steps" role="progressbar" aria-label="Onboarding progress" aria-valuemin={1} aria-valuemax={4} aria-valuenow={step + 1} aria-valuetext={`Step ${step + 1} of 4`}>{[0, 1, 2, 3].map((item) => <span key={item} className={step >= item ? 'active' : ''} aria-hidden="true" />)}</div>

        {step === 0 && <section>
          <p className="eyebrow">01 · Direction and training history</p><h2>Build my starting profile</h2>
          <p className="muted">Answer what you know. Every question can be skipped, and missing evidence lowers confidence instead of becoming a fake answer.</p>
          <div className="onboarding-fast-routes"><button onClick={() => persistPlacement('quick-start', 'today', true)}><Sparkles size={18} /><span><strong>Quick Start</strong><small>Enter now with a low-confidence calibration route.</small></span></button></div>
          <label className="field-label">Primary goal</label><div className="choice-grid placement-goals">{goals.map((item) => <button key={item.id} className={goal === item.id ? 'selected' : ''} onClick={() => setGoal(item.id)}>{goal === item.id && <Check size={16} />}{item.label}</button>)}<button className={goal === null ? 'selected' : ''} onClick={() => setGoal(null)}>Not sure yet</button></div>
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
          <div className="movement-placement-inputs"><div><p className="eyebrow">Protected anchors</p><h3>Place each movement separately</h3><p className="muted">A familiar bench can enter strength work while a new squat begins with skill practice. Family context never merges exact movement history.</p></div>{movementProfiles.map((profile) => {
            const evidence = historyEvidence.get(profile.exerciseId)
            const usingConfidence = profile.historyReview?.acceptedFields.includes('dataConfidence') ?? false
            const usingTolerance = profile.historyReview?.acceptedFields.includes('strengthTolerance') ?? false
            return <article key={profile.exerciseId}><header><strong>{profile.exerciseName}</strong><small>{profile.family} family</small></header><MovementScorePicker exerciseName={profile.exerciseName} label="Skill" value={profile.movementSkill} onChange={(value) => updateMovementProfile(profile.exerciseId, 'movementSkill', value)} /><MovementScorePicker exerciseName={profile.exerciseName} label="Heavy-work tolerance" value={profile.strengthTolerance} onChange={(value) => updateMovementProfile(profile.exerciseId, 'strengthTolerance', value)} /><MovementScorePicker exerciseName={profile.exerciseName} label="Recent evidence" value={profile.dataConfidence} onChange={(value) => updateMovementProfile(profile.exerciseId, 'dataConfidence', value)} />{evidence && <div className={`placement-history-review ${evidence.totalSetCount ? 'has-evidence' : ''}`}><span><BrainCircuit size={16} /><strong>Exact-history review</strong></span>{evidence.totalSetCount ? <><p>{evidence.recentSetCount} recent set{evidence.recentSetCount === 1 ? '' : 's'} across {evidence.recentExposureDateCount} date{evidence.recentExposureDateCount === 1 ? '' : 's'} · latest {new Date(evidence.latestCompletedAt!).toLocaleDateString()}</p><div><button type="button" className={usingConfidence ? 'accepted' : ''} onClick={() => acceptHistorySuggestion(profile.exerciseId, 'dataConfidence')}>{usingConfidence && <Check size={14} />} {usingConfidence ? 'Using' : 'Use'} evidence {evidence.suggestedDataConfidence}/5</button>{evidence.suggestedStrengthTolerance !== null && <button type="button" className={usingTolerance ? 'accepted' : ''} onClick={() => acceptHistorySuggestion(profile.exerciseId, 'strengthTolerance')}>{usingTolerance && <Check size={14} />} {usingTolerance ? 'Using' : 'Use'} tolerance {evidence.suggestedStrengthTolerance}/5</button>}</div><small>{evidence.limitations[0]}</small></> : <p>No exact history available. No family evidence was borrowed.</p>}</div>}</article>
          })}</div>
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
          {selectedAssessment.movementPlacements && selectedAssessment.movementPlacements.length > 0 && <div className="movement-placement-preview"><div><p className="eyebrow">Movement-placement-v2</p><h3>One cycle, individual starting lanes</h3></div>{selectedAssessment.movementPlacements.map((movement) => <article key={movement.exerciseId}><span><strong>{movement.exerciseName}</strong><small>{movement.family} family · {movement.confidence} confidence</small></span><b>{placementRouteLabels[movement.selectedRoute]}</b><small>Skill {movement.movementSkill}/5 · tolerance {movement.strengthTolerance}/5 · evidence {movement.dataConfidence}/5</small>{movement.historyReview && <small className="history-used"><BrainCircuit size={13} /> Exact history accepted for {movement.historyReview.acceptedFields.map((field) => field === 'dataConfidence' ? 'evidence' : 'tolerance').join(' + ')}</small>}<p>{movement.reasons[0]}</p></article>)}</div>}
          <div className="placement-explanation"><h3>Why the engine recommended {placementRouteLabels[selectedAssessment.recommendedRoute]}</h3><ul>{selectedAssessment.reasons.map((reason) => <li key={reason}><Check size={15} />{reason}</li>)}</ul></div>
          {selectedAssessment.uncertainInputs.length > 0 && <details><summary>Uncertain inputs · {selectedAssessment.uncertainInputs.length}</summary><p>{selectedAssessment.uncertainInputs.join(', ')}. These stay unknown and reduce confidence.</p></details>}
          <details><summary>Why not lower or higher?</summary><p><strong>Lower:</strong> {selectedAssessment.whyNotLower}</p><p><strong>Higher:</strong> {selectedAssessment.whyNotHigher}</p></details>
          <details open><summary>First-session verification plan</summary><ul>{selectedAssessment.verificationPlan.map((item) => <li key={item}>{item}</li>)}</ul></details>
          <div className="route-session-preview">
            <div><Sparkles size={18} /><span><strong>Your starting sessions will actually change</strong><small>{selectedRouteProfile.ruleVersion} · {selectedRouteProfile.label}</small></span></div>
            {selectedAssessment.selectedRoute === 'pain-aware-modified' ? <p>Automatic session generation stays paused until you reassess movement restrictions. Existing completed work remains untouched.</p> : <><p>{selectedRouteProfile.strategy}</p><div className="route-session-preview__grid"><span><small>Primary</small><strong>{selectedRouteProfile.primary.sets} × {selectedRouteProfile.primary.reps}</strong><em>{selectedRouteProfile.primary.rir} RIR · {selectedRouteProfile.primary.restSeconds}s rest</em></span><span><small>Secondary</small><strong>{selectedRouteProfile.secondary.sets} × {selectedRouteProfile.secondary.reps}</strong><em>{selectedRouteProfile.secondary.rir} RIR · {selectedRouteProfile.secondary.restSeconds}s rest</em></span><span><small>Accessories</small><strong>{selectedRouteProfile.accessory.sets} × {selectedRouteProfile.accessory.reps}</strong><em>up to {selectedRouteProfile.maximumAccessories} · {selectedRouteProfile.accessory.rir} RIR</em></span></div><small>{selectedRouteProfile.warmupGuidance}</small></>}
            {selectedAssessment.selectedRoute !== 'pain-aware-modified' && <div className={`route-equipment-preview ${protectedAnchorConflicts.length ? 'route-equipment-preview--warning' : ''}`}><Dumbbell size={17} /><span><strong>Generated for {selectedEquipmentProfile.name}</strong><small>Support work must match {selectedEquipmentProfile.equipment.length} available items. Loads use its {selectedEquipmentProfile.incrementUnit} increments.</small>{protectedAnchorConflicts.length > 0 && <em>{protectedAnchorConflicts.map(({ exercise, missing }) => `${exercise.name}: ${missing.join(', ')}`).join(' · ')}. Protected anchors stay visible and require your review.</em>}</span></div>}
          </div>
          <div className="placement-controls"><button className={decision === 'conservative' ? 'selected' : ''} onClick={() => setDecision(decision === 'conservative' ? 'confirmed' : 'conservative')}><ShieldCheck size={17} /><span><strong>Start more conservatively</strong><small>Use {placementRouteLabels[applyPlacementDecision(assessment, 'conservative').selectedRoute]}.</small></span></button><button className={decision === 'aggressive-test' ? 'selected' : ''} onClick={() => setDecision(decision === 'aggressive-test' ? 'confirmed' : 'aggressive-test')}><Sparkles size={17} /><span><strong>I am ready for more</strong><small>Keep this route, but request faster productive verification.</small></span></button><button className="placement-controls__wide" onClick={() => persistPlacement(decision, 'library')}><BrainCircuit size={17} /><span><strong>Correct or import my training history</strong><small>Save this hypothesis, then improve its evidence in Library.</small></span></button></div>
          <ul className="check-list"><li><Check size={16} /> Surveys remain optional</li><li><Check size={16} /> Missed sessions create no volume debt</li><li><CalendarClock size={16} /> Exit depends on criteria, not an arbitrary date</li><li><ShieldCheck size={16} /> Data stays on this device for now</li></ul>
        </section>}

        <div className="onboarding__actions">{step > 0 && <button className="button button--ghost" onClick={() => { setDecision('confirmed'); setStep((current) => current - 1) }}>Back</button>}{step < 3 ? <button className="button button--primary" onClick={() => { setDecision('confirmed'); setStep((current) => current + 1) }}>Continue <ArrowRight size={17} /></button> : <button className="button button--primary" onClick={() => persistPlacement()}>This looks right · Enter ForgePath <ArrowRight size={17} /></button>}</div>
        {step < 3 ? <button className="onboarding__skip" onClick={skipStep}>Skip this section</button> : <button className="onboarding__skip" onClick={() => { setDecision('confirmed'); setStep(0) }}>Correct my answers or choose a different goal</button>}
      </main>
    </div>
  )
}
