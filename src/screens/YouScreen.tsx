import { useMemo, useRef, useState, type ChangeEvent } from 'react'
import { AlertTriangle, Bell, BrainCircuit, Database, Download, Dumbbell, Eye, FileCheck2, HardDrive, MapPin, Moon, Pencil, Plus, RotateCcw, ShieldCheck, Sparkles, Undo2, Upload, UserRound, Volume2, Wrench } from 'lucide-react'
import { nanoid } from 'nanoid'
import { useAppStore } from '../store/useAppStore'
import type { CelebrationLevel, EquipmentProfile, EquipmentProfileKind, MovementPlacementExitAssessment, PlacementExitDecision, SurveyMode } from '../domain/types'
import { Modal } from '../components/Modal'
import { athleteLevel } from '../domain/athlete-level-engine'
import { LocationArt } from '../components/LocationArt'
import { PixelAvatar } from '../components/PixelAvatar'
import { CollapsiblePanel } from '../components/CollapsiblePanel'
import { LevelProgress } from '../components/LevelProgress'
import { createBackup, parseBackup, type BackupPreview } from '../domain/backup'
import { placementRouteLabels } from '../domain/placement-engine'
import { placementVerificationVerdictLabels, summarizePlacementVerification } from '../domain/placement-verification-engine'
import { buildMovementPlacementExitAssessment, buildPlacementExitAssessment } from '../domain/placement-exit-engine'
import { playForgeSound } from '../services/sound-engine'
import { CloudSyncPanel } from '../components/CloudSyncPanel'
import { cloudConfiguration, cloudAuthoritativeBuild } from '../services/cloud-config'

const surveyModeLabels: Record<SurveyMode, string> = { full: 'Full', quick: 'Quick', minimal: 'Minimal', off: 'Off', ask: 'Ask each time' }
const placementExitLabels = {
  'collect-evidence': 'Collect more evidence',
  'hold-current': 'Hold current route',
  'confirm-current': 'Confirm current route',
  'review-advance': 'Review a more advanced route',
  'review-conservative': 'Review a more conservative route',
  'reassessment-required': 'Reassessment required'
} as const

const placementExitChoices: { id: PlacementExitDecision; title: string; detail: string }[] = [
  { id: 'continue-current', title: 'Keep the current starting plan', detail: 'Record that the completed workouts and your experience support continuing this plan.' },
  { id: 'reassess-now', title: 'Update my starting profile', detail: 'Answer the starting questions again. Completing them creates a new version without rewriting past training.' },
  { id: 'defer', title: 'Decide later', detail: 'Keep the current starting plan unchanged and record why you want more time or completed workouts.' }
]

export function YouScreen() {
  const {
    athlete, settings, updateSettings, equipmentProfiles, setActiveEquipmentProfile, saveEquipmentProfile, history, movementNotes, exercises, sessions, surveys, deferredFeedback, records, mesocycles, historyMutations, cycleReviews, substitutionEvents, placementVerifications, placementExitReviews, movementPlacementExitReviews, missedOpportunityEvents, recordPlacementExitReview, recordMovementPlacementExitReview,
    activeMesocycleId, activeSessionId, onboardingComplete, recoverySnapshot, restoreBackup, undoLastRestore,
    restartOnboarding, resetForTesting, setNotice
  } = useAppStore()
  const athleteProgress = athleteLevel({ history, records, sessions })
  const [resetOpen, setResetOpen] = useState(false)
  const [importPreview, setImportPreview] = useState<BackupPreview | null>(null)
  const [importError, setImportError] = useState<string | null>(null)
  const [equipmentOpen, setEquipmentOpen] = useState(false)
  const [equipmentError, setEquipmentError] = useState<string | null>(null)
  const [placementExitOpen, setPlacementExitOpen] = useState(false)
  const [placementExitDecision, setPlacementExitDecision] = useState<PlacementExitDecision>('defer')
  const [placementExitReason, setPlacementExitReason] = useState('')
  const [placementExitError, setPlacementExitError] = useState<string | null>(null)
  const [placementExitAssessedAt] = useState(() => new Date().toISOString())
  const [movementExitOpen, setMovementExitOpen] = useState<string | null>(null)
  const [movementExitDecision, setMovementExitDecision] = useState<PlacementExitDecision>('defer')
  const [movementExitReason, setMovementExitReason] = useState('')
  const [movementExitError, setMovementExitError] = useState<string | null>(null)
  const [movementExitAssessedAt] = useState(() => new Date().toISOString())
  const [equipmentValues, setEquipmentValues] = useState({ id: '', name: '', kind: 'custom' as EquipmentProfileKind, equipment: '', constraints: '', barbell: '5', dumbbell: '5', cable: '5', machine: '10', other: '5' })
  const fileInput = useRef<HTMLInputElement>(null)
  const activeEquipmentProfile = equipmentProfiles.find((profile) => profile.id === settings.activeEquipmentProfileId) ?? equipmentProfiles[0]
  const knownEquipment = useMemo(() => [...new Set(exercises.flatMap((exercise) => exercise.equipment))].sort(), [exercises])
  const placementVerification = summarizePlacementVerification(placementVerifications, athlete.placement.createdAt)
  const placementLaneCount = new Set(placementVerification.events.map((event) => event.movementPlacement?.exerciseId ?? 'plan')).size
  const placementExit = useMemo(() => buildPlacementExitAssessment({ placement: athlete.placement, verificationEvents: placementVerifications, assessedAt: placementExitAssessedAt }), [athlete.placement, placementVerifications, placementExitAssessedAt])
  const placementExitEvidenceKey = placementExit.sourceVerificationEvents.filter((event) => event.placementRoute === placementExit.currentRoute).map((event) => event.id).join('|')
  const currentPlacementExitReviews = placementExitReviews.filter((review) => review.placementCreatedAt === athlete.placement.createdAt)
  const placementExitReviewed = currentPlacementExitReviews.some((review) => review.assessment.sourceVerificationEvents.filter((event) => event.placementRoute === review.assessment.currentRoute).map((event) => event.id).join('|') === placementExitEvidenceKey)
  const movementExitAssessments = useMemo(() => (athlete.placement.movementPlacements ?? []).map((movementPlacement) => buildMovementPlacementExitAssessment({ placement: athlete.placement, movementPlacement, verificationEvents: placementVerifications, assessedAt: movementExitAssessedAt })), [athlete.placement, placementVerifications, movementExitAssessedAt])
  const selectedMovementExit = movementExitAssessments.find((assessment) => assessment.exerciseId === movementExitOpen) ?? null
  const movementEvidenceKey = (assessment: MovementPlacementExitAssessment) => assessment.sourceVerificationEvents.filter((event) => event.movementPlacement?.exerciseId === assessment.exerciseId).map((event) => event.id).join('|')
  const movementExitReviewed = (assessment: MovementPlacementExitAssessment) => movementPlacementExitReviews.some((review) => review.placementCreatedAt === assessment.placementCreatedAt && review.exerciseId === assessment.exerciseId && review.assessment.sourceVerificationEvents.filter((event) => event.movementPlacement?.exerciseId === assessment.exerciseId).map((event) => event.id).join('|') === movementEvidenceKey(assessment))

  const openPlacementExitReview = () => {
    const decision: PlacementExitDecision = ['review-advance', 'review-conservative', 'reassessment-required'].includes(placementExit.recommendation) ? 'reassess-now' : placementExit.recommendation === 'collect-evidence' ? 'defer' : 'continue-current'
    setPlacementExitDecision(decision)
    setPlacementExitReason('')
    setPlacementExitError(null)
    setPlacementExitOpen(true)
  }

  const submitPlacementExitReview = () => {
    const result = recordPlacementExitReview(placementExitDecision, placementExitReason)
    if (!result.ok) return setPlacementExitError(result.error ?? 'The starting-plan review could not be saved.')
    setPlacementExitOpen(false)
  }

  const openMovementExitReview = (exerciseId: string) => {
    const assessment = movementExitAssessments.find((candidate) => candidate.exerciseId === exerciseId)
    if (!assessment) return
    setMovementExitDecision(['review-advance', 'review-conservative', 'reassessment-required'].includes(assessment.recommendation) ? 'reassess-now' : assessment.recommendation === 'collect-evidence' ? 'defer' : 'continue-current')
    setMovementExitReason('')
    setMovementExitError(null)
    setMovementExitOpen(exerciseId)
  }

  const submitMovementExitReview = () => {
    if (!selectedMovementExit) return
    const result = recordMovementPlacementExitReview(selectedMovementExit.exerciseId, movementExitDecision, movementExitReason)
    if (!result.ok) return setMovementExitError(result.error ?? 'The movement checkpoint could not be saved.')
    setMovementExitOpen(null)
  }

  const exportData = () => {
    const payload = createBackup({ athlete, settings, equipmentProfiles, history, movementNotes, exercises, sessions, surveys, deferredFeedback, records, mesocycles, historyMutations, cycleReviews, substitutionEvents, placementVerifications, placementExitReviews, movementPlacementExitReviews, missedOpportunityEvents, activeMesocycleId, activeSessionId, onboardingComplete })
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `forgepath-backup-v25-${new Date().toISOString().slice(0, 10)}.json`
    anchor.click()
    URL.revokeObjectURL(url)
    setNotice('Verified version 25 backup created as open JSON, including exercise notes, completed priority-region work, schedule and readiness evidence, missed-work decisions, starting-plan reviews, completed workout checks, records, plans, substitutions, and surveys.')
  }

  const openEquipmentEditor = (profile?: EquipmentProfile) => {
    setEquipmentError(null)
    setEquipmentValues(profile ? {
      id: profile.id, name: profile.name, kind: profile.kind, equipment: profile.equipment.join(', '), constraints: profile.constraints.join('\n'),
      barbell: String(profile.increments.barbell), dumbbell: String(profile.increments.dumbbell), cable: String(profile.increments.cable), machine: String(profile.increments.machine), other: String(profile.increments.other)
    } : { id: '', name: '', kind: 'custom', equipment: '', constraints: '', barbell: '5', dumbbell: '5', cable: '5', machine: '10', other: '5' })
    setEquipmentOpen(true)
  }

  const submitEquipmentProfile = () => {
    const result = saveEquipmentProfile({
      id: equipmentValues.id || `equipment-${nanoid(8)}`, name: equipmentValues.name, kind: equipmentValues.kind,
      equipment: equipmentValues.equipment.split(','), constraints: equipmentValues.constraints.split('\n'),
      increments: { barbell: Number(equipmentValues.barbell), dumbbell: Number(equipmentValues.dumbbell), cable: Number(equipmentValues.cable), machine: Number(equipmentValues.machine), other: Number(equipmentValues.other) },
      incrementUnit: settings.units, source: 'athlete', updatedAt: new Date().toISOString()
    })
    if (!result.ok) return setEquipmentError(result.error ?? 'That equipment profile could not be saved.')
    setEquipmentOpen(false)
  }

  const readImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setImportError(null)
    if (file.size > 25 * 1024 * 1024) {
      setImportError('That backup is larger than the 25 MB private-alpha restore limit.')
      return
    }
    try {
      setImportPreview(parseBackup(await file.text()))
    } catch (error) {
      setImportError(error instanceof Error ? error.message : 'The backup could not be read.')
    }
  }

  const surveyModes: SurveyMode[] = ['full', 'quick', 'minimal', 'off', 'ask']

  return (
    <div className="screen">
      <header className="screen-header"><div><p className="eyebrow">Your profile</p><h1>The app learns. You stay in charge.</h1><p>Fix anything it assumed, choose how many questions you answer, and export your own history whenever you want.</p></div></header>
      <section className="profile-hero">
        <PixelAvatar size="large" mood="ready" form={athleteProgress.form} level={athleteProgress.level} />
        <div className="profile-hero__copy"><span className="status-chip status-chip--lime">{athlete.entryRoute}</span><LevelProgress progress={athleteProgress} /><h2>{athlete.name}'s current path</h2><p>{athlete.goal}</p><div><span><Dumbbell size={15} /> {athlete.trainingAge} years training</span><span><MapPin size={15} /> {settings.equipmentLocation}</span><span><Sparkles size={15} /> {athlete.continuity} continuity</span></div></div>
      </section>

      <section className="panel athlete-level" aria-label="Athlete level and form">
        <div className="panel__header">
          <div><p className="eyebrow">Your level</p><h3>Level {athleteProgress.level} · {athleteProgress.formName}</h3></div>
          <span className="status-chip status-chip--lime">{athleteProgress.points.toLocaleString()} pts</span>
        </div>
        <p className="athlete-level__blurb">{athleteProgress.formBlurb}</p>
        <div className="athlete-level__track" aria-hidden="true"><i style={{ width: `${Math.round(athleteProgress.progressToNextLevel * 100)}%` }} /></div>
        <small>{athleteProgress.pointsIntoLevel} of {athleteProgress.pointsForNextLevel} toward level {athleteProgress.level + 1}{athleteProgress.nextForm ? ` · ${athleteProgress.nextForm.name} form unlocks at level ${athleteProgress.nextForm.minimumLevel}` : ' · final form reached'}</small>
        {athleteProgress.sources.length > 0 && (
          <ul className="athlete-level__sources">
            {athleteProgress.sources.map((source) => <li key={source.label}><span><strong>{source.label}</strong><small>{source.detail}</small></span><b>+{source.points.toLocaleString()}</b></li>)}
          </ul>
        )}
        <p className="modal-note">Levels come only from work that actually happened, so they never fall and cannot be bought. Every point above traces to completed sessions, confirmed records, volume moved, or movements you have trained enough to have a real history with.</p>
      </section>

      <div className="settings-layout">
        <div className="settings-main">
          <CollapsiblePanel className="panel" label="your starting profile" header={<div className="panel__header"><div><p className="eyebrow">How your plan started</p><h3>Current training profile</h3></div><UserRound size={19} /></div>}>
            <div className="level-list">{Object.entries(athlete.level).map(([key, value]) => <div key={key}><span>{key.replace(/([A-Z])/g, ' $1')}</span><div>{Array.from({ length: 5 }, (_, index) => <i key={index} className={index < value ? 'filled' : ''} />)}</div><strong>{value}/5</strong></div>)}</div>
            <p className="chart-note">Experience and current preparedness stay separate. An interrupted schedule does not turn an experienced athlete into a beginner.</p>
            <div className="placement-profile-evidence"><span><Sparkles size={17} /><span><strong>{athlete.entryRoute}</strong><small>{athlete.placement.confidence} confidence · {athlete.placement.decision}</small>{athlete.placement.selectedRoute !== athlete.placement.recommendedRoute && <small>We suggested: {placementRouteLabels[athlete.placement.recommendedRoute]}</small>}</span></span><details><summary>Why and how this will be verified</summary><p>{athlete.placement.reasons.join(' ')}</p>{athlete.placement.uncertainInputs.length > 0 && <p><strong>Still uncertain:</strong> {athlete.placement.uncertainInputs.join(', ')}.</p>}<ul>{athlete.placement.verificationPlan.map((item) => <li key={item}>{item}</li>)}</ul><p><strong>Exit criteria:</strong> {athlete.placement.exitCriteria.join('; ')}.</p></details>
              {athlete.placement.movementPlacements && athlete.placement.movementPlacements.length > 0 && <div className="profile-movement-lanes"><p className="eyebrow">Starting plans for each main lift</p>{athlete.placement.movementPlacements.map((movement) => {
                const assessment = movementExitAssessments.find((candidate) => candidate.exerciseId === movement.exerciseId)
                const reviewed = assessment ? movementExitReviewed(assessment) : false
                const latestReview = movementPlacementExitReviews.filter((review) => review.placementCreatedAt === athlete.placement.createdAt && review.exerciseId === movement.exerciseId).at(-1)
                return <details key={movement.exerciseId} className="movement-lane-card"><summary><span><strong>{movement.exerciseName}</strong><small>{movement.family} · {movement.confidence} confidence</small></span><b>{placementRouteLabels[movement.selectedRoute]}</b></summary><p>{movement.reasons.join(' ')}</p><small>Skill {movement.movementSkill}/5 · heavy-work readiness {movement.strengthTolerance}/5 · usable history {movement.dataConfidence}/5</small>{movement.historyReview && <small><BrainCircuit size={13} /> History reviewed {new Date(movement.historyReview.reviewedAt).toLocaleDateString()} · {movement.historyReview.evidence.recentSetCount} recent sets of this lift · used for {movement.historyReview.acceptedFields.map((field) => field === 'dataConfidence' ? 'history' : 'readiness').join(' + ')}</small>}{movement.uncertainInputs.length > 0 && <small>Still unknown: {movement.uncertainInputs.join(', ')}</small>}{assessment && <div className={`movement-exit-summary movement-exit-summary--${assessment.recommendation}`}><span><FileCheck2 size={15} /><strong>{placementExitLabels[assessment.recommendation]}</strong></span><b>{assessment.resolved}/3 completed checks</b><p>{assessment.reasons[0]}</p>{assessment.suggestedRoute && <small>{assessment.suggestedRoute === assessment.currentRoute ? `Supported starting plan: ${placementRouteLabels[assessment.currentRoute]}` : `${placementRouteLabels[assessment.currentRoute]} → ${placementRouteLabels[assessment.suggestedRoute]}`}</small>}{latestReview && <small>Your decision: {latestReview.decision.replaceAll('-', ' ')} · {latestReview.reason}</small>}<button type="button" className="button button--small button--secondary" disabled={Boolean(activeSessionId) || assessment.collected === 0 || reviewed} onClick={(event) => { event.preventDefault(); openMovementExitReview(movement.exerciseId) }}>{reviewed ? 'Starting-plan evidence reviewed' : 'Review this lift\'s starting plan'}</button>{activeSessionId ? <small className="control-reason">Finish or leave your open workout to review this.</small> : assessment.collected === 0 && !reviewed ? <small className="control-reason">Nothing to review until this lift has completed workout evidence.</small> : null}</div>}</details>
              })}</div>}
              <div className={`placement-verification-summary placement-verification-summary--${placementVerification.state}`}>
                <ShieldCheck size={18} /><span><strong>{placementVerification.state.replaceAll('-', ' ')}</strong><small>{placementVerification.resolved} completed · {placementVerification.collected} checks across {placementLaneCount} main lift{placementLaneCount === 1 ? '' : 's'} · {placementVerification.supports} matched · {placementVerification.reviews} need review</small></span>
              </div>
              {placementVerification.events.length > 0 && <div className="placement-verification-list">{placementVerification.events.map((event) => <details key={event.id}><summary><span>{event.movementPlacement?.exerciseName ?? 'Plan route'} · Check {event.sequence}</span><strong>{placementVerificationVerdictLabels[event.verdict]}</strong></summary><p>{sessions.find((session) => session.id === event.sessionId)?.title ?? event.sessionId}</p><small>Warm-up: {event.warmupResponse.replace('-', ' ')} · Recovery: {event.recoveryResponse.replace('-', ' ')}</small>{event.firstSet && <small>First set: {event.firstSet.exerciseName} · {event.firstSet.actualLoad} × {event.firstSet.actualReps} · {event.firstSet.actualRir} RIR</small>}<ul>{event.reasons.map((reason) => <li key={reason}>{reason}</li>)}</ul></details>)}</div>}
              <section className={`placement-exit-panel placement-exit-panel--${placementExit.recommendation}`} aria-label="Starting-plan review">
                <div className="placement-exit-panel__headline"><span><FileCheck2 size={18} /><strong>Starting-plan review</strong></span><b>{placementExitLabels[placementExit.recommendation]}</b></div>
                <p>{placementExit.reasons[0]}</p>
                {placementExit.suggestedRoute && <div className="placement-exit-route"><span>{placementExit.suggestedRoute === placementExit.currentRoute ? 'Supported current route' : 'Route for athlete review'}</span><strong>{placementExit.suggestedRoute === placementExit.currentRoute ? placementRouteLabels[placementExit.currentRoute] : `${placementRouteLabels[placementExit.currentRoute]} → ${placementRouteLabels[placementExit.suggestedRoute]}`}</strong></div>}
                <div className="placement-exit-criteria">{placementExit.criteria.map((item) => <article key={item.id} className={`placement-exit-criterion placement-exit-criterion--${item.state}`}><span>{item.state === 'met' ? '✓' : item.state === 'not-met' ? '!' : '?'}</span><div><strong>{item.label}</strong><small>{item.detail}</small></div></article>)}</div>
                <details><summary>What this review did and did not use</summary><p><strong>Used:</strong> {placementExit.resolved} completed checks from this starting plan, including {placementExit.supports} that matched expectations and {placementExit.reviews} that suggested review.</p>{placementExit.excludedDifferentRouteChecks > 0 && <p><strong>Not used:</strong> {placementExit.excludedDifferentRouteChecks} lift check{placementExit.excludedDifferentRouteChecks === 1 ? '' : 's'} from a different starting plan.</p>}<ul>{placementExit.declaredExitCriteria.map((item) => <li key={item}>{item}</li>)}</ul>{placementExit.limitations.map((item) => <p key={item}>{item}</p>)}</details>
                {currentPlacementExitReviews.length > 0 && <div className="placement-exit-history"><span>Saved athlete review</span><strong>{currentPlacementExitReviews.at(-1)?.decision.replaceAll('-', ' ')}</strong><small>{currentPlacementExitReviews.at(-1)?.reason}</small></div>}
                <button className="button button--small button--primary" disabled={Boolean(activeSessionId) || placementExit.collected === 0 || placementExitReviewed} onClick={openPlacementExitReview}>{placementExitReviewed ? 'Checkpoint reviewed' : 'Review this checkpoint'}</button>
                {activeSessionId ? <small className="control-reason">Finish or leave your open workout to review this.</small> : placementExit.collected === 0 && !placementExitReviewed ? <small className="control-reason">There is nothing to review until a checkpoint collects evidence.</small> : null}
              </section>
              <button className="button button--small button--secondary" disabled={Boolean(activeSessionId)} onClick={() => restartOnboarding()}>Update my starting profile</button>{activeSessionId && <small className="control-reason">Finish or leave your open workout first.</small>}</div>
          </CollapsiblePanel>

          <CollapsiblePanel className="panel equipment-profile-panel" label="your training locations" header={<div className="panel__header"><div><p className="eyebrow">Where you train</p><h3>Training locations</h3></div><button className="button button--small button--secondary" onClick={() => openEquipmentEditor()}><Plus size={15} /> Add</button></div>}>
            <p className="callout-copy">The active location controls movement availability and executable load jumps. A location name alone never implies equipment.</p>
            <div className="equipment-profile-list">{equipmentProfiles.map((profile) => {
              const active = profile.id === activeEquipmentProfile?.id
              return <article key={profile.id} className={active ? 'active' : ''}>
                <button className="equipment-profile-select" onClick={() => setActiveEquipmentProfile(profile.id)} aria-pressed={active}>
                  <LocationArt kind={profile.kind} />
                  <span><strong>{profile.name}</strong><small>{profile.kind.replace('-', ' ')} · {profile.equipment.length} items · {profile.incrementUnit}</small></span>
                  <b>{active ? 'Active' : 'Use here'}</b>
                </button>
                <button className="icon-button" onClick={() => openEquipmentEditor(profile)} aria-label={`Edit ${profile.name}`}><Pencil size={16} /></button>
              </article>
            })}</div>
            {activeEquipmentProfile && <div className="equipment-profile-summary"><Wrench size={18} /><span><strong>{activeEquipmentProfile.equipment.join(' · ')}</strong><small>Load jumps: barbell {activeEquipmentProfile.increments.barbell}, dumbbell {activeEquipmentProfile.increments.dumbbell}, cable {activeEquipmentProfile.increments.cable}, machine {activeEquipmentProfile.increments.machine} {activeEquipmentProfile.incrementUnit}</small>{activeEquipmentProfile.constraints.length > 0 && <small>Constraints: {activeEquipmentProfile.constraints.join(' · ')}</small>}</span></div>}
          </CollapsiblePanel>

          <CollapsiblePanel className="panel" label="survey preferences" header={<div className="panel__header"><div><p className="eyebrow">How much we ask you</p><h3>Survey preferences</h3></div><BrainCircuit size={19} /></div>}>
            <label className="setting-row"><span><strong>Pre-session check-in</strong><small>Full 10, quick 5, minimal 3, off, or choose each workout.</small></span><select aria-label="Pre-session check-in mode" value={settings.preSurveyMode} onChange={(event) => updateSettings({ preSurveyMode: event.target.value as SurveyMode })}>{surveyModes.map((mode) => <option key={mode} value={mode}>{surveyModeLabels[mode]}</option>)}</select></label>
            <label className="setting-row"><span><strong>Post-session feedback</strong><small>Full 10, quick 5, minimal 3, off, or choose each workout.</small></span><select aria-label="Post-session feedback mode" value={settings.postSurveyMode} onChange={(event) => updateSettings({ postSurveyMode: event.target.value as SurveyMode })}>{surveyModes.map((mode) => <option key={mode} value={mode}>{surveyModeLabels[mode]}</option>)}</select></label>
            <p className="chart-note">Every question and whole survey remains skippable. Missing means unknown and never lowers adherence or readiness.</p>
          </CollapsiblePanel>

          <CollapsiblePanel className="panel" label="experience controls" header={<div className="panel__header"><div><p className="eyebrow">Visual and workout focus</p><h3>Experience controls</h3></div><Eye size={19} /></div>}>
            <label className="toggle-row"><span><strong>Focused training mode</strong><small>Reduce pixel-world decoration during active sets.</small></span><input type="checkbox" checked={settings.focusedMode} onChange={(event) => updateSettings({ focusedMode: event.target.checked })} /></label>
            <label className="toggle-row"><span><strong>Reduced motion</strong><small>Keep characters and charts visually still.</small></span><input type="checkbox" checked={settings.reducedMotion} onChange={(event) => updateSettings({ reducedMotion: event.target.checked })} /></label>
          </CollapsiblePanel>

          <CollapsiblePanel className="panel" label="achievement controls" header={<div className="panel__header"><div><p className="eyebrow">Extras</p><h3>Achievement controls</h3></div><Sparkles size={19} /></div>}>
            <label className="setting-row"><span><strong>Celebration level</strong><small>Off, restrained, standard, or high-energy visual feedback.</small></span><select value={settings.celebrationLevel} onChange={(event) => updateSettings({ celebrationLevel: event.target.value as CelebrationLevel })}>{(['off', 'subtle', 'normal', 'high-energy'] as const).map((level) => <option key={level} value={level}>{level}</option>)}</select></label>
            <label className="toggle-row"><span><strong>Quiet mode</strong><small>Hide live prompts and celebrations without changing training or records.</small></span><input type="checkbox" checked={settings.quietMode} onChange={(event) => updateSettings({ quietMode: event.target.checked })} /></label>
            <label className="toggle-row"><span><strong>Planned opportunities</strong><small>Show only records already available inside the prescribed work.</small></span><input type="checkbox" checked={settings.opportunityPrompts} onChange={(event) => updateSettings({ opportunityPrompts: event.target.checked })} /></label>
            <label className="toggle-row"><span><strong>In-workout achievements</strong><small>Show provisional wins after completed sets, then validate at session save.</small></span><input type="checkbox" checked={settings.sessionAchievements} onChange={(event) => updateSettings({ sessionAchievements: event.target.checked })} /></label>
            <label className="toggle-row"><span><strong>Pixel confetti</strong><small>Use a brief visual flourish only for earned achievements.</small></span><input type="checkbox" checked={settings.confetti} onChange={(event) => updateSettings({ confetti: event.target.checked })} /></label>
            <label className="toggle-row"><span><strong>Pocket-console sounds</strong><small>Original set, achievement, workout, and warning cues. Quiet mode always wins.</small></span><input aria-label="Pocket-console sounds" type="checkbox" checked={settings.sounds} onChange={(event) => { const sounds = event.target.checked; updateSettings({ sounds }); if (sounds) playForgeSound('menu-confirm', { sounds: true, quietMode: settings.quietMode }) }} /></label>
            <div className="sound-preview-row"><span><strong>Field Guide sound pack</strong><small>Hear the original workout-start cue before you opt in.</small></span><button type="button" className="button button--small button--secondary" disabled={settings.quietMode} onClick={() => playForgeSound('workout-start', { sounds: true, quietMode: settings.quietMode })}><Volume2 size={15} /> Preview sounds</button></div>
            <label className="toggle-row"><span><strong>Haptics</strong><small>Subtle set-completion feedback on supported devices.</small></span><input type="checkbox" checked={settings.haptics} onChange={(event) => updateSettings({ haptics: event.target.checked })} /></label>
            <p className="chart-note">Quiet mode and celebration settings never change what gets logged, how you progress, or your records.</p>
          </CollapsiblePanel>
        </div>

        <aside className="settings-aside">
          <CloudSyncPanel />
          <CollapsiblePanel className="panel" label="backup and recovery" header={<div className="panel__header"><div><p className="eyebrow">Your data</p><h3>Backup and recovery</h3></div><ShieldCheck size={19} /></div>}>
            <div className="privacy-status"><HardDrive size={28} /><strong>{cloudAuthoritativeBuild ? 'Stored in your private cloud account' : 'Stored on this test device'}</strong><p>{cloudAuthoritativeBuild ? 'Supabase is the source of truth. Export remains available as a personal, portable copy.' : 'This local build keeps the deterministic development and browser test path available.'}</p></div>
            <div className="data-actions">
              <button className="full-row-button" onClick={exportData}><Download size={17} /> Export verified backup</button>
              <button className="full-row-button" onClick={() => fileInput.current?.click()}><Upload size={17} /> Preview and restore</button>
              <input ref={fileInput} className="sr-only" type="file" accept="application/json,.json" onChange={readImport} aria-label="Choose ForgePath backup to restore" />
            </div>
            {importError && <div className="import-error" role="alert"><AlertTriangle size={17} /><span><strong>Restore blocked</strong>{importError}</span></div>}
            {recoverySnapshot && <div className="recovery-callout"><Undo2 size={17} /><span><strong>Automatic restore point available</strong><small>Your pre-restore state can be recovered until another restore or reset.</small></span><button onClick={undoLastRestore}>Undo last restore</button></div>}
          </CollapsiblePanel>
          <section className="panel"><div className="panel__header"><div><p className="eyebrow">System versions</p><h3>Diagnostics</h3></div><Database size={19} /></div><ul className="diagnostic-list"><li><span>App</span><strong>0.54.0 private alpha</strong></li><li><span>Rules</span><strong>0.54.0 cloud account controls</strong></li><li className="diagnostic-list__wide"><span>Calculations</span><details><summary>Rule versions behind the numbers</summary><p>Placement v3 · Movement placement v2 · Placement history v1 · Placement verification v1 · Placement exit v1 · Movement placement exit v1 · Route session v3 · Effort metric v1 · Set structure v1 · Volume progression v1 · Deload v1 · Athlete level v1 · Training split v1 · Structure progression v1 · Missed opportunity v5 · Schedule eligibility v1 · Schedule readiness v1 · Schedule priority dose v1 · Calendar exposure v1 · Volume v2 · PR v2 · Plan dose v1 · Muscle dose v1 · Movement notes v1 · Session extension v1 · Equipment v1 · Load increment v1 · Catalog merge v1 · Sound pack field-guide-synth-v1</p></details></li><li><span>Backup schema</span><strong>Version 25</strong></li><li><span>Persistence</span><strong>{cloudAuthoritativeBuild ? 'Supabase snapshot v1 · no browser training copy' : 'Local test state v25'}</strong></li><li><span>Cloud</span><strong>{cloudConfiguration.status === 'ready' ? 'Authenticated and account-scoped' : 'Private release gate closed'}</strong></li><li><span>AI provider</span><strong>Not required</strong></li></ul></section>
          <section className="panel"><div className="panel__header"><div><p className="eyebrow">Notifications</p><h3>Quiet by default</h3></div><Bell size={19} /></div><p className="callout-copy">PRs and reminders never interrupt an active set, punish a missed day, or push unsafe work.</p></section>
          {!cloudAuthoritativeBuild && <button className="button button--danger button--full" onClick={() => setResetOpen(true)}><RotateCcw size={17} /> Clear local test data</button>}
        </aside>
      </div>
      <footer className="screen-footer"><Moon size={16} /> ForgePath Private Alpha · {cloudAuthoritativeBuild ? 'Your training is saved to your private cloud account' : 'Local test mode'}</footer>

      <Modal open={placementExitOpen} onClose={() => setPlacementExitOpen(false)} title="Review your starting plan" description="ForgePath compared your completed workouts with the plan's starting expectations. It will not change future training until you choose what happens next." wide>
        <div className="placement-exit-review">
          <div className="placement-exit-review__summary"><FileCheck2 size={22} /><span><small>What the rules suggest</small><strong>{placementExitLabels[placementExit.recommendation]}</strong><p>{placementExit.reasons.join(' ')}</p></span></div>
          <fieldset className="placement-exit-choice-list"><legend>Choose the athlete-reviewed outcome</legend>{placementExitChoices.map((choice) => {
            const blocked = choice.id === 'continue-current' && placementExit.reassessmentRequired
            return <button type="button" key={choice.id} aria-pressed={placementExitDecision === choice.id} className={placementExitDecision === choice.id ? 'selected' : ''} disabled={blocked} onClick={() => setPlacementExitDecision(choice.id)}><span>{placementExitDecision === choice.id ? '✓' : '○'}</span><span><strong>{choice.title}</strong><small>{choice.detail}</small>{blocked && <em>Unavailable because a productive check recorded pain that changed training.</em>}</span></button>
          })}</fieldset>
          <label><span className="field-label">Why is this the right decision now?</span><textarea value={placementExitReason} onChange={(event) => setPlacementExitReason(event.target.value)} placeholder="Example: Both sessions matched the expected effort, technique stayed stable, and recovery was normal." /></label>
          {placementExitError && <div className="import-error" role="alert"><AlertTriangle size={17} /><span><strong>Checkpoint not saved</strong>{placementExitError}</span></div>}
          <p className="modal-note">A reassessment creates a new placement and plan version. This review and its source evidence remain in history. The checkpoint is not medical clearance.</p>
        </div>
        <div className="modal__actions"><button className="button button--ghost" onClick={() => setPlacementExitOpen(false)}>Cancel</button><button className="button button--primary" disabled={!placementExitReason.trim()} onClick={submitPlacementExitReview}>Save checkpoint decision</button></div>
      </Modal>

      <Modal open={Boolean(selectedMovementExit)} onClose={() => setMovementExitOpen(null)} title={selectedMovementExit ? `Review ${selectedMovementExit.exerciseName}'s starting plan` : 'Review this lift\'s starting plan'} description="This review uses only completed work from this exact lift. Similar exercises and other main lifts do not count as proof for it." wide>
        {selectedMovementExit && <div className="placement-exit-review movement-exit-review">
          <div className="placement-exit-review__summary"><Dumbbell size={22} /><span><small>Recommendation</small><strong>{placementExitLabels[selectedMovementExit.recommendation]}</strong><p>{selectedMovementExit.reasons.join(' ')}</p></span></div>
          {selectedMovementExit.suggestedRoute && <div className="placement-exit-route"><span>{selectedMovementExit.suggestedRoute === selectedMovementExit.currentRoute ? 'Supported current lane' : 'Lane for athlete review'}</span><strong>{selectedMovementExit.suggestedRoute === selectedMovementExit.currentRoute ? placementRouteLabels[selectedMovementExit.currentRoute] : `${placementRouteLabels[selectedMovementExit.currentRoute]} → ${placementRouteLabels[selectedMovementExit.suggestedRoute]}`}</strong></div>}
          <div className="placement-exit-criteria">{selectedMovementExit.criteria.map((item) => <article key={item.id} className={`placement-exit-criterion placement-exit-criterion--${item.state}`}><span>{item.state === 'met' ? '✓' : item.state === 'not-met' ? '!' : '?'}</span><div><strong>{item.label}</strong><small>{item.detail}</small></div></article>)}</div>
          <fieldset className="placement-exit-choice-list"><legend>Choose what happens to this lift's starting plan</legend>{placementExitChoices.map((choice) => {
            const blocked = choice.id === 'continue-current' && selectedMovementExit.reassessmentRequired
            return <button type="button" key={choice.id} aria-pressed={movementExitDecision === choice.id} className={movementExitDecision === choice.id ? 'selected' : ''} disabled={blocked} onClick={() => setMovementExitDecision(choice.id)}><span>{movementExitDecision === choice.id ? '✓' : '○'}</span><span><strong>{choice.title}</strong><small>{choice.detail}</small>{blocked && <em>Unavailable because this lift recorded pain that changed training.</em>}</span></button>
          })}</fieldset>
          <label><span className="field-label">Why is this the right decision for {selectedMovementExit.exerciseName}?</span><textarea value={movementExitReason} onChange={(event) => setMovementExitReason(event.target.value)} placeholder="Example: Both squat sessions matched the target effort and recovery, so I want to review the next lane." /></label>
          {movementExitError && <div className="import-error" role="alert"><AlertTriangle size={17} /><span><strong>Starting-plan review not saved</strong>{movementExitError}</span></div>}
          <details className="movement-exit-boundaries"><summary>What this review did and did not use</summary>{selectedMovementExit.limitations.map((item) => <p key={item}>{item}</p>)}</details>
          <p className="modal-note">Reassess opens the current placement flow. Nothing changes until you complete a new placement and future plan version.</p>
        </div>}
        <div className="modal__actions"><button className="button button--ghost" onClick={() => setMovementExitOpen(null)}>Cancel</button><button className="button button--primary" disabled={!movementExitReason.trim()} onClick={submitMovementExitReview}>Save movement decision</button></div>
      </Modal>

      <Modal open={equipmentOpen} onClose={() => setEquipmentOpen(false)} title={equipmentValues.id ? 'Edit training location' : 'Add training location'} description="List only equipment you can actually use here. ForgePath will treat every omitted requirement as unavailable." wide>
        <div className="form-grid equipment-profile-form">
          <label><span className="field-label">Location name</span><input aria-label="Equipment profile name" value={equipmentValues.name} onChange={(event) => setEquipmentValues({ ...equipmentValues, name: event.target.value })} placeholder="Example: Garage Gym" /></label>
          <label><span className="field-label">Location type</span><select aria-label="Equipment profile type" value={equipmentValues.kind} onChange={(event) => setEquipmentValues({ ...equipmentValues, kind: event.target.value as EquipmentProfileKind })}>{(['commercial-gym', 'home-gym', 'travel', 'hotel', 'bodyweight', 'custom'] as const).map((kind) => <option key={kind} value={kind}>{kind.replace('-', ' ')}</option>)}</select></label>
          <label className="catalog-edit-grid__wide"><span className="field-label">Available equipment, separated by commas</span><textarea aria-label="Available equipment" rows={4} value={equipmentValues.equipment} onChange={(event) => setEquipmentValues({ ...equipmentValues, equipment: event.target.value })} placeholder="barbell, plates, rack, bench, dumbbells" /><small className="field-help">Known catalog terms: {knownEquipment.join(', ')}</small></label>
          <label className="catalog-edit-grid__wide"><span className="field-label">Constraints, one per line</span><textarea aria-label="Equipment constraints" rows={3} value={equipmentValues.constraints} onChange={(event) => setEquipmentValues({ ...equipmentValues, constraints: event.target.value })} placeholder="No dropping weights&#10;Dumbbells stop at 75 lb" /></label>
        </div>
        <fieldset className="increment-editor"><legend>Smallest executable load jump · {settings.units}</legend><div>{(['barbell', 'dumbbell', 'cable', 'machine', 'other'] as const).map((kind) => <label key={kind}><span>{kind}</span><input aria-label={`${kind} load increment`} type="number" min="0.1" max="100" step="0.1" value={equipmentValues[kind]} onChange={(event) => setEquipmentValues({ ...equipmentValues, [kind]: event.target.value })} /></label>)}</div></fieldset>
        <p className="catalog-trust-note"><ShieldCheck size={16} /> Equipment matching is exact and conservative. You can always edit this profile, but the app will not silently assume missing machines or attachments.</p>
        {equipmentError && <p className="form-error" role="alert">{equipmentError}</p>}
        <div className="modal__actions"><button className="button button--ghost" onClick={() => setEquipmentOpen(false)}>Cancel</button><button className="button button--primary" onClick={submitEquipmentProfile}><ShieldCheck size={17} /> Save location</button></div>
      </Modal>

      <Modal open={!cloudAuthoritativeBuild && resetOpen} onClose={() => setResetOpen(false)} title="Clear all local test data" description="This removes this browser's development data, then restarts onboarding. The exercise catalog and equipment templates remain available so ForgePath can build a new plan.">
        <div className="modal__actions"><button className="button button--ghost" onClick={() => setResetOpen(false)}>Keep my data</button><button className="button button--danger" onClick={() => { resetForTesting(); setResetOpen(false) }}>Clear and restart</button></div>
      </Modal>

      <Modal open={Boolean(importPreview)} onClose={() => setImportPreview(null)} title="Preview backup before restore" description="The file has passed format, integrity, identity, reference, date, and numeric-data checks. Nothing changes until you confirm.">
        {importPreview && <>
          <div className="backup-identity"><FileCheck2 size={28} /><div><span>Schema {importPreview.backup.schemaVersion} · App {importPreview.backup.appVersion}</span><strong>{importPreview.summary.athleteName}'s training data</strong><small>Exported {new Date(importPreview.summary.exportedAt).toLocaleString()}</small></div></div>
          <div className="backup-summary">
            <div><small>Completed sets</small><strong>{importPreview.summary.completedSets.toLocaleString()}</strong></div>
            <div><small>Exercises</small><strong>{importPreview.summary.exercises}</strong></div>
            <div><small>Training locations</small><strong>{importPreview.summary.equipmentProfiles}</strong></div>
            <div><small>Starting route</small><strong>{importPreview.summary.placementRoute}</strong></div>
            <div><small>Placement confidence</small><strong>{importPreview.summary.placementConfidence}</strong></div>
            <div><small>Placement checks</small><strong>{importPreview.summary.placementChecks}</strong></div>
            <div><small>Starting-plan reviews</small><strong>{importPreview.summary.placementExitReviews}</strong></div>
            <div><small>Movement lane reviews</small><strong>{importPreview.summary.movementPlacementExitReviews}</strong></div>
            <div><small>Schedule adaptations</small><strong>{importPreview.summary.missedOpportunityEvents}</strong></div>
            <div><small>Movement lanes</small><strong>{importPreview.summary.movementPlacedAnchors}</strong></div>
            <div><small>History-reviewed lanes</small><strong>{importPreview.summary.historyReviewedAnchors}</strong></div>
            <div><small>Route-generated sessions</small><strong>{importPreview.summary.routeGeneratedSessions}</strong></div>
            <div><small>Equipment-aware sessions</small><strong>{importPreview.summary.equipmentGeneratedSessions}</strong></div>
            <div><small>Sessions</small><strong>{importPreview.summary.sessions}</strong></div>
            <div><small>Surveys</small><strong>{importPreview.summary.surveys}</strong></div>
            <div><small>Feedback follow-ups</small><strong>{importPreview.summary.deferredFeedback}</strong></div>
            <div><small>Records</small><strong>{importPreview.summary.records}</strong></div>
            <div><small>Plan versions</small><strong>{importPreview.summary.planVersions}</strong></div>
            <div><small>Cycle reviews</small><strong>{importPreview.summary.cycleReviews}</strong></div>
            <div><small>Substitutions</small><strong>{importPreview.summary.substitutions}</strong></div>
          </div>
          {importPreview.warnings.map((warning) => <div className="warning-box" key={warning}><AlertTriangle size={17} />{warning}</div>)}
          <p className="modal-note">ForgePath will keep one automatic copy of your current local state so this restore can be undone. Exporting the current state first remains the safest long-term backup.</p>
          <div className="modal__actions"><button className="button button--ghost" onClick={() => setImportPreview(null)}>Cancel</button><button className="button button--ghost" onClick={exportData}>Export current first</button><button className="button button--primary" onClick={() => { restoreBackup(importPreview.backup.data); setImportPreview(null) }}>Restore validated backup</button></div>
        </>}
      </Modal>
    </div>
  )
}
