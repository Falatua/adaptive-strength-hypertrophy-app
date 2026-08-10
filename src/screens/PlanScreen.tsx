import { useMemo, useState } from 'react'
import {
  AlertCircle,
  CalendarDays,
  Check,
  ChevronRight,
  CircleDashed,
  Clock3,
  Dumbbell,
  Edit3,
  Flag,
  History,
  Layers3,
  MoveRight,
  Pin,
  RefreshCcw,
  Shield,
  Sparkles,
  Target
} from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import { Modal } from '../components/Modal'
import { buildMesocyclePreview, draftFromPlan } from '../domain/mesocycle-engine'
import { buildCycleReview } from '../domain/cycle-review-engine'
import { EQUIPMENT_ROUTE_SESSION_RULE_VERSION } from '../domain/route-session-engine'
import type { BodyRegion, CycleReviewDecision, MesocycleDraft } from '../domain/types'

const regions: BodyRegion[] = ['chest', 'back', 'shoulders', 'quadriceps', 'hamstrings', 'glutes', 'biceps', 'triceps', 'forearms', 'calves', 'trunk']

const readable = (value: string) => value.replaceAll('-', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())

const reviewChoices: { id: CycleReviewDecision; title: string; detail: string }[] = [
  { id: 'continue-progress', title: 'Continue and progress', detail: 'Queue the next exposure round and let exact completed history earn the smallest load-first progression.' },
  { id: 'continue-hold', title: 'Continue and hold', detail: 'Keep unresolved work or queue the next round at the same productive targets.' },
  { id: 'extend', title: 'Extend this round', detail: 'Move unresolved protected work forward seven days without adding catch-up volume.' },
  { id: 'recover', title: 'Recover next', detail: 'Expire unresolved work honestly and queue a conservative reacclimation round.' },
  { id: 'complete', title: 'Complete mesocycle', detail: 'Close this mesocycle from completed exposure evidence and preserve its full history.' }
]

export function PlanScreen() {
  const {
    sessions, exercises, athlete, history, mesocycles, cycleReviews, activeMesocycleId, activeSessionId, equipmentProfiles, settings,
    startSession, applyMesocycleRevision, applyCycleReview, setNotice
  } = useAppStore()
  const activePlan = mesocycles.find((plan) => plan.id === activeMesocycleId)
  const activeEquipmentProfile = equipmentProfiles.find((profile) => profile.id === settings.activeEquipmentProfileId) ?? equipmentProfiles[0]
  const nextVersion = Math.max(0, ...mesocycles.map((plan) => plan.version)) + 1
  const blankDraft = (): MesocycleDraft => ({
    title: 'Adaptive Powerbuilding Block',
    objective: athlete.goal,
    dominantAdaptation: athlete.continuity === 'returning' ? 'reacclimation' : 'powerbuilding',
    revisionReason: '',
    entryCriteria: 'Current athlete profile, available equipment, recent continuity, and usable training history reviewed.',
    progressionModel: 'Progress load first, then repetitions, then a working set only when recovery and continuity support more dose.',
    targetMicrocycles: 4,
    minimumProductiveExposures: Math.max(6, athlete.strengthAnchors.length * 3),
    successCriteria: 'Complete productive exposure rounds with stable technique, manageable pain, and recoverable fatigue.',
    exitPlan: 'Review performance and recovery, then continue, recover, pivot, or enter a more specific phase.',
    weeklyOpportunities: athlete.weeklyOpportunities,
    defaultMinutes: athlete.defaultMinutes,
    strengthAnchors: [...athlete.strengthAnchors],
    priorityRegions: [...athlete.priorityRegions],
    maintenanceRegions: ['hamstrings', 'shoulders', 'biceps']
  })
  const [editorOpen, setEditorOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [reviewOpen, setReviewOpen] = useState(false)
  const [reviewDecision, setReviewDecision] = useState<CycleReviewDecision>('continue-hold')
  const [reviewReason, setReviewReason] = useState('')
  const [reviewError, setReviewError] = useState<string | null>(null)
  const [draft, setDraft] = useState<MesocycleDraft>(() => activePlan ? draftFromPlan(activePlan) : blankDraft())
  const [editorError, setEditorError] = useState<string | null>(null)

  const openEditor = () => {
    setDraft(activePlan ? draftFromPlan(activePlan) : blankDraft())
    setEditorError(null)
    setEditorOpen(true)
  }

  const preview = useMemo(() => buildMesocyclePreview(draft, {
    exercises,
    currentSessions: sessions,
    history,
    planId: 'preview',
    planVersion: nextVersion,
    equipmentProfile: activeEquipmentProfile
  }), [draft, exercises, sessions, history, nextVersion, activeEquipmentProfile])

  const planSessions = activePlan
    ? sessions.filter((session) => session.mesocycleId === activePlan.id || activePlan.sessionIds.includes(session.id))
    : sessions
  const completed = planSessions.filter((session) => ['completed', 'partial-primary'].includes(session.status)).length
  const required = Math.max(1, activePlan?.sessionIds.length ?? planSessions.length)
  const activeAnchors = (activePlan?.strengthAnchors ?? athlete.strengthAnchors)
    .map((id) => exercises.find((exercise) => exercise.id === id)?.name)
    .filter(Boolean)
  const cycleReview = useMemo(() => activePlan ? buildCycleReview(activePlan, sessions, history) : null, [activePlan, sessions, history])
  const activeCycleReviews = activePlan ? cycleReviews.filter((review) => review.mesocycleId === activePlan.id) : []

  const openReview = () => {
    if (!cycleReview) return
    setReviewDecision(cycleReview.recommendation)
    setReviewReason('')
    setReviewError(null)
    setReviewOpen(true)
  }

  const submitReview = () => {
    const result = applyCycleReview(reviewDecision, reviewReason)
    if (!result.ok) return setReviewError(result.error ?? 'The exposure round could not be reviewed.')
    setReviewOpen(false)
  }

  const openPivot = () => {
    setReviewOpen(false)
    setDraft(activePlan ? { ...draftFromPlan(activePlan), revisionReason: '' } : blankDraft())
    setEditorError(null)
    setEditorOpen(true)
  }

  const updateAnchor = (slot: number, exerciseId: string) => setDraft((current) => {
    const anchors = [...current.strengthAnchors]
    anchors[slot] = exerciseId
    const strengthAnchors = [...new Set(anchors.filter(Boolean))]
    const movementPlacementsComplete = strengthAnchors.every((anchorId) => current.movementPlacements?.some((placement) => placement.exerciseId === anchorId))
    return {
      ...current,
      strengthAnchors,
      ...(current.entryRoute && !movementPlacementsComplete ? { generationRuleVersion: EQUIPMENT_ROUTE_SESSION_RULE_VERSION, movementPlacements: undefined } : {})
    }
  })

  const toggleRegion = (field: 'priorityRegions' | 'maintenanceRegions', region: BodyRegion) => setDraft((current) => {
    const selected = current[field]
    if (selected.includes(region)) return { ...current, [field]: selected.filter((item) => item !== region) }
    if (selected.length >= 3) return current
    const otherField = field === 'priorityRegions' ? 'maintenanceRegions' : 'priorityRegions'
    return { ...current, [field]: [...selected, region], [otherField]: current[otherField].filter((item) => item !== region) }
  })

  const saveRevision = () => {
    const result = applyMesocycleRevision(draft)
    if (!result.ok) {
      setEditorError(result.error ?? 'The plan could not be revised.')
      return
    }
    setEditorOpen(false)
  }

  const anchorGroups = [
    { label: 'Squat anchor', options: exercises.filter((exercise) => exercise.pattern === 'squat') },
    { label: 'Press anchor', options: exercises.filter((exercise) => exercise.pattern === 'horizontal-push' || exercise.pattern === 'vertical-push') },
    { label: 'Hinge anchor', options: exercises.filter((exercise) => exercise.pattern === 'hinge') }
  ]

  return (
    <div className="screen">
      <header className="screen-header">
        <div><p className="eyebrow">Exposure-based planning</p><h1>The plan bends. The goal stays visible.</h1><p>Required training roles complete the microcycle. Weekdays are planning tools, not progression authority.</p></div>
        <div className="header-actions">
          <button className="button button--secondary" onClick={() => setHistoryOpen(true)}><History size={17} /> Versions</button>
          <button className="button button--primary" onClick={openEditor}><Edit3 size={17} /> Edit mesocycle</button>
        </div>
      </header>

      <section className="cycle-hero">
        <div className="cycle-hero__copy">
          <span className="status-chip status-chip--orange">{cycleReview && cycleReview.evidence.unresolvedSessions === 0 ? 'Ready for review' : cycleReview?.targetPassed ? 'Review window open' : 'Exposure cycle active'}</span>
          <p className="eyebrow">{activePlan ? `${activePlan.entryRoute ? readable(activePlan.entryRoute) : readable(activePlan.dominantAdaptation)} · Plan v${activePlan.version}` : 'Legacy plan · Create first version'}</p>
          <h2>{activePlan?.title ?? 'Protect the next useful exposure.'}</h2>
          <p>{activePlan?.objective ?? athlete.goal}</p>
          <div className="cycle-progress"><span><b style={{ width: `${Math.max(8, ((cycleReview?.evidence.qualifiedSessions ?? 0) / Math.max(1, cycleReview?.evidence.requiredSessions ?? 1)) * 100)}%` }} /></span><small>{cycleReview?.evidence.qualifiedSessions ?? 0} of {cycleReview?.evidence.requiredSessions ?? required} protected sessions qualified in exposure round {cycleReview?.microcycleNumber ?? 1}</small></div>
        </div>
        <div className="cycle-map" aria-label="Training cycle map">
          <div className="cycle-node cycle-node--done"><Check size={18} /><span>Entry<small>Profile built</small></span></div>
          <MoveRight />
          <div className="cycle-node cycle-node--active"><CircleDashed size={18} /><span>Build<small>Active now</small></span></div>
          <MoveRight />
          <div className="cycle-node"><Layers3 size={18} /><span>Review<small>Criteria based</small></span></div>
          <MoveRight />
          <div className="cycle-node"><Flag size={18} /><span>Next<small>Continue or pivot</small></span></div>
        </div>
      </section>

      <div className="plan-layout">
        <section className="panel panel--flush">
          <div className="panel__header panel__header--padded"><div><p className="eyebrow">Rolling priority queue</p><h3>Next sessions</h3></div><span>{activePlan?.weeklyOpportunities ?? athlete.weeklyOpportunities} opportunities / week</span></div>
          <div className="queue-list">
            {planSessions.map((session, index) => {
              const primary = session.exercises.find((exercise) => exercise.role === 'primary')
              const exercise = exercises.find((candidate) => candidate.id === primary?.exerciseId)
              return (
                <article key={session.id} className={`queue-item queue-item--${session.status}`}>
                  <div className="queue-index">{String(index + 1).padStart(2, '0')}</div>
                  <div className="queue-content">
                    <div className="queue-content__top"><span className="eyebrow">{session.dayLabel}</span><span className={`status-chip status-chip--${session.status === 'completed' ? 'lime' : 'default'}`}>{session.status}</span></div>
                    <h3>{session.title}</h3>
                    <p>{session.objective}</p>
                    <div className="queue-meta"><span><Shield size={14} /> {exercise?.name}</span><span><Clock3 size={14} /> {session.durationMinutes} min</span><span><Layers3 size={14} /> {session.exercises.length} movements</span>{session.generation && <span><Sparkles size={14} /> {readable(session.generation.route)}</span>}{session.generation?.equipment && <span><Dumbbell size={14} /> {session.generation.equipment.profileName}</span>}</div>
                  </div>
                  <div className="queue-actions">
                    {(session.status === 'planned' || session.status === 'deferred') && <button className="button button--small button--secondary" onClick={() => startSession(session.id)}>Start</button>}
                    <button className="icon-button" onClick={() => setNotice(`${exercise?.name} pinned as a protected next priority.`)} aria-label={`Pin ${session.title}`}><Pin size={17} /></button>
                  </div>
                </article>
              )
            })}
          </div>
        </section>

        <aside className="plan-aside">
          <section className="panel">
            <div className="panel__header"><div><p className="eyebrow">Dual clocks</p><h3>Calendar vs. exposure</h3></div><CalendarDays size={19} /></div>
            <div className="clock-comparison">
              <div><span>Calendar estimate</span><strong>{activePlan?.targetMicrocycles ?? 4} rounds</strong><small>Planning and reporting</small></div>
              <div><span>Exposure clock</span><strong>{completed} / {required}</strong><small>Progression authority</small></div>
            </div>
            <p className="callout-copy">A passed Wednesday does not become a completed bench exposure. Only completed qualified work advances the second clock.</p>
          </section>
          {cycleReview && <section className="panel cycle-review-card">
            <div className="panel__header"><div><p className="eyebrow">Exposure round {cycleReview.microcycleNumber}</p><h3>Criterion review</h3></div><span className={`status-chip status-chip--${cycleReview.maximumPassed ? 'orange' : 'default'}`}>{cycleReview.maximumPassed ? 'maximum passed' : cycleReview.targetPassed ? 'target passed' : 'inside target'}</span></div>
            <div className="review-dates"><div><small>Started</small><strong>{cycleReview.startedAt.toLocaleDateString()}</strong></div><div><small>Target review</small><strong>{cycleReview.targetDate.toLocaleDateString()}</strong></div><div><small>Maximum span</small><strong>{cycleReview.maximumDate.toLocaleDateString()}</strong></div></div>
            <div className="review-recommendation"><Sparkles size={18} /><span><small>Current recommendation</small><strong>{readable(cycleReview.recommendation)}</strong><p>{cycleReview.recommendationReasons[0]}</p></span></div>
            <button className="button button--primary button--full" onClick={openReview}>Review exposure round</button>
          </section>}
          <section className="panel">
            <div className="panel__header"><div><p className="eyebrow">Protected qualities</p><h3>Current contract</h3></div><Target size={19} /></div>
            <ul className="priority-list">
              <li><span>Anchors</span><strong>{activeAnchors.join(', ') || 'Choose anchors'}</strong></li>
              <li><span>Entry route</span><strong>{activePlan?.entryRoute ? `${readable(activePlan.entryRoute)} · ${activePlan.generationRuleVersion}` : 'Manual adaptation rules'}</strong></li>
              <li><span>Movement lanes</span><strong>{activePlan?.movementPlacements?.length ? `${activePlan.movementPlacements.length} exact anchors placed independently${activePlan.movementPlacements.some((movement) => movement.historyReview) ? ` · ${activePlan.movementPlacements.filter((movement) => movement.historyReview).length} history reviewed` : ''}` : 'Global route applies to all anchors'}</strong></li>
              <li><span>Generated for</span><strong>{activePlan?.generationEquipment ? `${activePlan.generationEquipment.profileName} · ${activePlan.generationEquipment.incrementUnit}` : 'Legacy or manual equipment context'}</strong></li>
              <li><span>Develop</span><strong>{(activePlan?.priorityRegions ?? athlete.priorityRegions).map(readable).join(', ')}</strong></li>
              <li><span>Maintain</span><strong>{(activePlan?.maintenanceRegions ?? []).map(readable).join(', ') || 'Set in next plan version'}</strong></li>
              <li><span>Constraint</span><strong>{activePlan?.defaultMinutes ?? athlete.defaultMinutes} minutes, irregular schedule</strong></li>
            </ul>
          </section>
          <button className="full-row-button full-row-button--accent" onClick={openEditor}><RefreshCcw size={17} /> Rebuild from a revision <ChevronRight size={18} /></button>
        </aside>
      </div>

      <Modal open={reviewOpen} onClose={() => setReviewOpen(false)} title={`Review exposure round ${cycleReview?.microcycleNumber ?? ''}`} description="The app proposes a criterion-based decision from completed work, calendar bounds, effort, and pain. You make the final call and record why." wide>
        {cycleReview && <div className="cycle-review-modal">
          <section className="review-evidence">
            <div className="review-evidence__headline"><span><Sparkles size={19} /><small>Deterministic recommendation</small></span><strong>{readable(cycleReview.recommendation)}</strong>{cycleReview.recommendationReasons.map((reason) => <p key={reason}><Check size={14} />{reason}</p>)}</div>
            <div className="review-evidence__grid">
              <div><small>Qualified</small><strong>{cycleReview.evidence.qualifiedSessions} / {cycleReview.evidence.requiredSessions}</strong></div>
              <div><small>Completed sets</small><strong>{cycleReview.evidence.completedSets}</strong></div>
              <div><small>Round volume</small><strong>{cycleReview.evidence.volumeLoad.toLocaleString()}</strong></div>
              <div><small>Average session RPE</small><strong>{cycleReview.evidence.averageSessionRpe?.toFixed(1) ?? 'Unknown'}</strong></div>
              <div><small>Maximum pain</small><strong>{cycleReview.evidence.maximumPain ?? 'Unknown'}</strong></div>
              <div><small>Calendar days</small><strong>{cycleReview.evidence.calendarDays}</strong></div>
            </div>
          </section>
          <fieldset className="review-choice-list"><legend>Choose this round's outcome</legend>{reviewChoices.map((choice) => {
            const enabled = cycleReview.eligible[choice.id]
            return <button type="button" key={choice.id} aria-pressed={reviewDecision === choice.id} className={reviewDecision === choice.id ? 'selected' : ''} disabled={!enabled} onClick={() => setReviewDecision(choice.id)}><span>{reviewDecision === choice.id ? <Check size={16} /> : <CircleDashed size={16} />}</span><span><strong>{choice.title}</strong><small>{choice.detail}</small>{!enabled && <em>Not eligible from the current exposure evidence.</em>}</span></button>
          })}</fieldset>
          <button className="pivot-choice" onClick={openPivot}><RefreshCcw size={18} /><span><strong>Pivot or change the training contract</strong><small>Open a new mesocycle version with different objectives, anchors, dose, or adaptation.</small></span><ChevronRight size={17} /></button>
          <label><span className="field-label">Why is this the right decision now?</span><textarea value={reviewReason} onChange={(event) => setReviewReason(event.target.value)} placeholder="Example: The round is complete, effort stayed recoverable, and my schedule can support another exposure round." /></label>
          {reviewError && <div className="import-error" role="alert"><AlertCircle size={17} /><span><strong>Review not saved</strong>{reviewError}</span></div>}
          <p className="modal-note">Calendar time alone cannot complete the mesocycle. Planned work never enters completed volume, and this decision never rewrites prior sessions.</p>
        </div>}
        <div className="modal__actions"><button className="button button--ghost" onClick={() => setReviewOpen(false)}>Cancel</button><button className="button button--primary" disabled={!reviewReason.trim()} onClick={submitReview}>Save review decision</button></div>
      </Modal>

      <Modal open={editorOpen} onClose={() => setEditorOpen(false)} title={`Preview mesocycle version ${nextVersion}`} description="Adjust the training contract, inspect the generated exposure queue, then apply it. Completed work never changes." wide>
        <div className="plan-editor">
          <div className="plan-editor__form">
            {activeSessionId && <div className="plan-editor__warning"><AlertCircle size={18} /><span><strong>Revision paused</strong>Finish or leave the active workout before applying a new plan.</span></div>}
            <div className="form-grid">
              <label><span className="field-label">Plan title</span><input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} /></label>
              <label><span className="field-label">Dominant adaptation</span><select value={draft.dominantAdaptation} onChange={(event) => setDraft({ ...draft, dominantAdaptation: event.target.value as MesocycleDraft['dominantAdaptation'], entryRoute: undefined, generationRuleVersion: undefined, placementCreatedAt: undefined, generationEquipment: undefined, movementPlacements: undefined })}><option value="powerbuilding">Powerbuilding</option><option value="strength">Strength</option><option value="hypertrophy">Hypertrophy</option><option value="reacclimation">Reacclimation</option></select></label>
            </div>
            <label><span className="field-label">Objective</span><textarea value={draft.objective} onChange={(event) => setDraft({ ...draft, objective: event.target.value })} /></label>
            <div className="plan-editor__numbers">
              <label><span className="field-label">Opportunities / week</span><input type="number" min="2" max="5" value={draft.weeklyOpportunities} onChange={(event) => setDraft({ ...draft, weeklyOpportunities: Math.min(5, Math.max(2, Number(event.target.value))) })} /></label>
              <label><span className="field-label">Minutes / session</span><select value={draft.defaultMinutes} onChange={(event) => setDraft({ ...draft, defaultMinutes: Number(event.target.value) })}>{[30, 45, 60, 75, 90].map((minutes) => <option key={minutes} value={minutes}>{minutes} minutes</option>)}</select></label>
              <label><span className="field-label">Target exposure rounds</span><input type="number" min="3" max="8" value={draft.targetMicrocycles} onChange={(event) => setDraft({ ...draft, targetMicrocycles: Math.min(8, Math.max(3, Number(event.target.value))) })} /></label>
            </div>

            <fieldset className="plan-fieldset"><legend>Protected strength anchors</legend><div className="anchor-selects">{anchorGroups.map((group, index) => <label key={group.label}><span>{group.label}</span><select value={draft.strengthAnchors[index] ?? ''} onChange={(event) => updateAnchor(index, event.target.value)}>{group.options.map((exercise) => <option value={exercise.id} key={exercise.id}>{exercise.name}</option>)}</select></label>)}</div></fieldset>

            <fieldset className="plan-fieldset"><legend>Priority regions <small>Choose up to 3</small></legend><div className="region-chips">{regions.map((region) => <button type="button" key={region} aria-pressed={draft.priorityRegions.includes(region)} onClick={() => toggleRegion('priorityRegions', region)}>{readable(region)}</button>)}</div></fieldset>
            <fieldset className="plan-fieldset"><legend>Maintenance regions <small>Choose up to 3</small></legend><div className="region-chips region-chips--maintenance">{regions.map((region) => <button type="button" key={region} aria-pressed={draft.maintenanceRegions.includes(region)} onClick={() => toggleRegion('maintenanceRegions', region)}>{readable(region)}</button>)}</div></fieldset>

            <details className="criteria-details"><summary>Entry, success, and exit criteria</summary><label><span className="field-label">Entry criteria</span><textarea value={draft.entryCriteria} onChange={(event) => setDraft({ ...draft, entryCriteria: event.target.value })} /></label><label><span className="field-label">Success criteria</span><textarea value={draft.successCriteria} onChange={(event) => setDraft({ ...draft, successCriteria: event.target.value })} /></label><label><span className="field-label">Recovery or exit plan</span><textarea value={draft.exitPlan} onChange={(event) => setDraft({ ...draft, exitPlan: event.target.value })} /></label></details>
            <label><span className="field-label">Why are you changing the plan?</span><textarea value={draft.revisionReason} placeholder="Example: My schedule is stable again and I can protect three 60-minute sessions." onChange={(event) => setDraft({ ...draft, revisionReason: event.target.value })} /></label>
            {editorError && <div className="import-error" role="alert"><AlertCircle size={17} /><span><strong>Plan not changed</strong>{editorError}</span></div>}
          </div>

          <aside className="plan-preview">
            <div className="plan-preview__header"><div><p className="eyebrow">Deterministic preview</p><h3>Next exposure queue</h3></div><Sparkles size={19} /></div>
            <div className="plan-preview__stats"><div><span>Required sessions</span><strong>{preview.requiredExposureCount}</strong></div><div><span>Projected sets</span><strong>{preview.projectedSets}</strong></div><div><span>Total minutes</span><strong>{preview.projectedMinutes}</strong></div></div>
            <div className="preview-session-list">{preview.sessions.map((session, index) => <article key={session.id}><span>{String(index + 1).padStart(2, '0')}</span><div><strong>{session.title}</strong><small>{session.durationMinutes} min · {session.exercises.length} movements</small><ul>{session.exercises.map((planned) => <li key={planned.id}><b>{planned.role}</b>{exercises.find((exercise) => exercise.id === planned.exerciseId)?.name} · {planned.sets.length} sets</li>)}</ul></div></article>)}</div>
            <div className="preview-rationale"><strong>Why this queue</strong>{preview.explanations.map((explanation) => <p key={explanation}><Check size={14} />{explanation}</p>)}</div>
            <p className="modal-note">Projected sets are planning estimates, not completed volume. Progress dashboards remain sourced only from logged sets.</p>
          </aside>
        </div>
        <div className="modal__actions"><button className="button button--ghost" onClick={() => setEditorOpen(false)}>Cancel</button><button className="button button--primary" disabled={Boolean(activeSessionId) || !draft.revisionReason.trim()} onClick={saveRevision}>Apply version {nextVersion}</button></div>
      </Modal>

      <Modal open={historyOpen} onClose={() => setHistoryOpen(false)} title="Mesocycle revision history" description="Each version keeps its original objective, criteria, timing assumptions, and reason for change." wide>
        <div className="revision-list">
          {[...mesocycles].sort((a, b) => b.version - a.version).map((plan) => <article key={plan.id} className={plan.status === 'active' ? 'active' : ''}>
            <div className="revision-list__version"><span>v{plan.version}</span><small>{plan.status}</small></div>
            <div><div className="revision-list__title"><h3>{plan.title}</h3><span>{new Date(plan.effectiveAt).toLocaleDateString()}</span></div><p>{plan.objective}</p><div className="revision-list__meta"><span><Dumbbell size={14} /> {readable(plan.dominantAdaptation)}</span><span><CalendarDays size={14} /> {plan.targetMicrocycles} target rounds</span><span><Clock3 size={14} /> {plan.defaultMinutes} min</span></div><blockquote><strong>Why changed</strong>{plan.revisionReason}</blockquote></div>
          </article>)}
          {mesocycles.length === 0 && <div className="empty-plan-history"><History size={26} /><strong>No versioned mesocycle yet</strong><p>Your current sessions are intact. Create the first plan version to begin the revision history.</p></div>}
        </div>
        {cycleReviews.length > 0 && <section className="cycle-review-history"><div className="panel__header"><div><p className="eyebrow">Append-only decisions</p><h3>Exposure-round reviews</h3></div><span>{activeCycleReviews.length} for current plan</span></div>{[...cycleReviews].reverse().map((review) => <article key={review.id}><span>R{review.microcycleNumber}</span><div><strong>{readable(review.decision)}</strong><small>{new Date(review.createdAt).toLocaleString()} · plan v{review.planVersion}</small><p>{review.reason}</p></div><div><small>Qualified</small><strong>{review.evidence.qualifiedSessions}/{review.evidence.requiredSessions}</strong></div></article>)}</section>}
      </Modal>
    </div>
  )
}
