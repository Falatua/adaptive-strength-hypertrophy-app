import { useMemo, useState } from 'react'
import {
  AlertCircle,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronRight,
  CircleDashed,
  Clock3,
  Dumbbell,
  Edit3,
  Flag,
  History,
  Layers3,
  ListChecks,
  MoveRight,
  Pin,
  RefreshCcw,
  Shield,
  Sparkles,
  Target
} from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import { checkInAgeLabels, scheduleChangeLabels, scheduleReadinessOutcomeLabels } from '../domain/readable-labels'
import { Modal } from '../components/Modal'
import { CollapsiblePanel } from '../components/CollapsiblePanel'
import { buildMesocyclePreview, draftFromPlan } from '../domain/mesocycle-engine'
import { buildCycleReview } from '../domain/cycle-review-engine'
import { EQUIPMENT_ROUTE_SESSION_RULE_VERSION } from '../domain/route-session-engine'
import { buildMovementPlacementExitAssessment, buildPlacementExitAssessment } from '../domain/placement-exit-engine'
import { exerciseEquipmentFit } from '../domain/equipment-engine'
import { benchAngleLabel, normalizeBenchAngle, supportsBenchAngle } from '../domain/bench-angle-engine'
import type { BodyRegion, CycleReviewDecision, Exercise, ExerciseRole, MesocycleDraft, PlannedExercise } from '../domain/types'

const regions: BodyRegion[] = ['chest', 'back', 'traps', 'shoulders', 'quadriceps', 'hamstrings', 'glutes', 'biceps', 'triceps', 'forearms', 'calves', 'trunk']

const readable = (value: string) => value.replaceAll('-', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())

const roleLabels: Record<ExerciseRole, string> = {
  primary: 'Primary',
  secondary: 'Secondary',
  accessory: 'Accessory',
  tertiary: 'Tertiary'
}

interface NextBlockMovementRecommendation {
  exercise: Exercise
  recommendation: string
  tone: 'warning' | 'review' | 'keep' | 'neutral'
  reason: string
}

const prescriptionSummary = (planned: PlannedExercise) => {
  const first = planned.sets[0]
  if (!first) return 'No working sets'
  const samePrescription = planned.sets.every((workSet) => workSet.targetReps === first.targetReps && workSet.targetRir === first.targetRir)
  return samePrescription
    ? `${planned.sets.length} × ${first.targetReps} · ${first.targetRir} RIR`
    : `${planned.sets.length} working sets · set-specific targets`
}

const plannedAngleSummary = (planned: PlannedExercise) => {
  const angles = [...new Set(planned.sets.map((workSet) => workSet.benchAngleDeg).filter((angle): angle is number => angle !== undefined))]
  if (!angles.length) return 'Angle not tracked'
  if (angles.length === 1) return benchAngleLabel(angles[0])
  return `${angles.map((angle) => `${angle}°`).join(' / ')} ladder`
}

const reviewChoices: { id: CycleReviewDecision; title: string; detail: string }[] = [
  { id: 'continue-progress', title: 'Start the next training round and progress', detail: 'Build the next group of workouts. Completed results earn the smallest supported increase, with load considered before repetitions and sets.' },
  { id: 'continue-hold', title: 'Continue at the same targets', detail: 'Keep unfinished work available or build the next group of workouts without increasing the targets.' },
  { id: 'extend', title: 'Give this training round more time', detail: 'Move unfinished important workouts forward seven days without adding catch-up work.' },
  { id: 'recover', title: 'Use a recovery round next', detail: 'Close unfinished planned work without pretending it happened, then build a conservative return round.' },
  { id: 'complete', title: 'Complete this training block', detail: 'Close the multi-round training block from completed workout evidence and preserve its full history.' }
]

export function PlanScreen() {
  const {
    sessions, exercises, athlete, history, surveys, mesocycles, cycleReviews, missedOpportunityEvents, placementVerifications, activeMesocycleId, activeSessionId, equipmentProfiles, settings,
    startSession, pinSession, applyMesocycleRevision, applyCycleReview, setNotice
  } = useAppStore()
  const activePlan = mesocycles.find((plan) => plan.id === activeMesocycleId)
  const latestPlan = [...mesocycles].sort((a, b) => b.version - a.version)[0]
  const sourcePlan = activePlan ?? latestPlan
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
    successCriteria: 'Complete productive training rounds with steady technique, manageable pain, and recoverable fatigue.',
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
  const [openBlueprintDays, setOpenBlueprintDays] = useState<Record<string, boolean>>({})
  const [placementExitAssessedAt] = useState(() => new Date().toISOString())
  const [draft, setDraft] = useState<MesocycleDraft>(() => sourcePlan ? draftFromPlan(sourcePlan) : blankDraft())
  const [editorError, setEditorError] = useState<string | null>(null)

  const openEditor = () => {
    setDraft(sourcePlan ? draftFromPlan(sourcePlan) : blankDraft())
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

  const planSessions = sourcePlan
    ? sessions.filter((session) => session.mesocycleId === sourcePlan.id || sourcePlan.sessionIds.includes(session.id))
    : sessions
  const completed = planSessions.filter((session) => ['completed', 'partial-primary'].includes(session.status)).length
  const required = Math.max(1, activePlan?.sessionIds.length ?? planSessions.length)
  const activeAnchors = (sourcePlan?.strengthAnchors ?? athlete.strengthAnchors)
    .map((id) => exercises.find((exercise) => exercise.id === id)?.name)
    .filter(Boolean)
  const cycleReview = useMemo(() => activePlan ? buildCycleReview(activePlan, sessions, history, new Date(), surveys) : null, [activePlan, sessions, history, surveys])
  const placementExit = useMemo(() => buildPlacementExitAssessment({ placement: athlete.placement, verificationEvents: placementVerifications, assessedAt: placementExitAssessedAt }), [athlete.placement, placementVerifications, placementExitAssessedAt])
  const movementExits = useMemo(() => (athlete.placement.movementPlacements ?? []).map((movementPlacement) => buildMovementPlacementExitAssessment({ placement: athlete.placement, movementPlacement, verificationEvents: placementVerifications, assessedAt: placementExitAssessedAt })), [athlete.placement, placementVerifications, placementExitAssessedAt])
  const activeCycleReviews = activePlan ? cycleReviews.filter((review) => review.mesocycleId === activePlan.id) : []
  const activeScheduleChanges = activePlan ? missedOpportunityEvents.filter((event) => event.mesocycleId === activePlan.id) : missedOpportunityEvents
  const latestScheduleChange = activeScheduleChanges.at(-1)
  const blueprintRound = cycleReview?.microcycleNumber ?? Math.max(1, ...planSessions.map((session) => session.microcycleNumber ?? 1))
  const blueprintSessions = planSessions.filter((session) => (session.microcycleNumber ?? 1) === blueprintRound)
  const blueprintSetsPerRound = blueprintSessions.flatMap((session) => session.exercises).reduce((total, planned) => total + planned.sets.length, 0)
  const blueprintMinutesPerRound = blueprintSessions.reduce((total, session) => total + session.durationMinutes, 0)
  const nextBlockMovementRecommendations = useMemo<NextBlockMovementRecommendation[]>(() => {
    if (sourcePlan?.status !== 'completed') return []
    const sourceSessionIds = new Set(planSessions.map((session) => session.id))
    const seen = new Set<string>()
    return blueprintSessions.flatMap((session) => session.exercises).flatMap<NextBlockMovementRecommendation>((planned) => {
      if (seen.has(planned.exerciseId)) return []
      seen.add(planned.exerciseId)
      const exercise = exercises.find((candidate) => candidate.id === planned.exerciseId)
      if (!exercise) return []
      const feedback = history.filter((record) => sourceSessionIds.has(record.sessionId) && record.exerciseId === planned.exerciseId)
      const maximumPain = feedback.length ? Math.max(...feedback.map((record) => record.pain)) : null
      const averageTechnique = feedback.length ? feedback.reduce((total, record) => total + record.technique, 0) / feedback.length : null
      if (exercise.disliked || exercise.jointFeeling === 'avoid' || (maximumPain !== null && maximumPain >= 4)) {
        return [{ exercise, recommendation: 'Change suggested', tone: 'warning' as const, reason: exercise.disliked || exercise.jointFeeling === 'avoid' ? 'Your saved movement preference says to avoid this one.' : `Recorded pain reached ${maximumPain}/5. Choose a different setup or movement before the next block.` }]
      }
      if ((maximumPain !== null && maximumPain >= 2) || (averageTechnique !== null && averageTechnique < 3)) {
        return [{ exercise, recommendation: 'Review suggested', tone: 'review' as const, reason: 'Completed-set feedback was mixed. Keep it only if the setup still feels appropriate.' }]
      }
      if (feedback.length) {
        return [{ exercise, recommendation: 'Keep suggested', tone: 'keep' as const, reason: `${feedback.length} completed set${feedback.length === 1 ? '' : 's'} support reusing this exact movement.` }]
      }
      return [{ exercise, recommendation: 'Keep or change', tone: 'neutral' as const, reason: 'There is not enough completed feedback yet, so this remains your choice.' }]
    })
  }, [sourcePlan?.status, planSessions, blueprintSessions, exercises, history])

  const openReview = () => {
    if (!cycleReview) return
    setReviewDecision(cycleReview.recommendation)
    setReviewReason('')
    setReviewError(null)
    setReviewOpen(true)
  }

  const submitReview = () => {
    const result = applyCycleReview(reviewDecision, reviewReason)
    if (!result.ok) return setReviewError(result.error ?? 'That training round could not be reviewed.')
    setReviewOpen(false)
  }

  const openPivot = () => {
    setReviewOpen(false)
    setDraft(sourcePlan ? { ...draftFromPlan(sourcePlan), revisionReason: '' } : blankDraft())
    setEditorError(null)
    setEditorOpen(true)
  }

  const updateAnchor = (slot: number, exerciseId: string) => setDraft((current) => {
    const anchors = [...current.strengthAnchors]
    anchors[slot] = exerciseId
    const strengthAnchors = [...new Set(anchors.filter(Boolean))]
    const movementPlacementsComplete = strengthAnchors.every((anchorId) => current.movementPlacements?.some((placement) => placement.exerciseId === anchorId))
    const sessionCount = Math.max(strengthAnchors.length, current.weeklyOpportunities)
    const movementOverrides = (current.movementOverrides ?? [])
      .filter((choice) => choice.slotIndex !== 0 || choice.sessionIndex % Math.max(1, strengthAnchors.length) !== slot)
    for (let sessionIndex = slot; sessionIndex < sessionCount; sessionIndex += Math.max(1, strengthAnchors.length)) {
      movementOverrides.push({ sessionIndex, slotIndex: 0, exerciseId, source: 'athlete' })
    }
    return {
      ...current,
      strengthAnchors,
      movementOverrides,
      ...(current.entryRoute && !movementPlacementsComplete ? { generationRuleVersion: EQUIPMENT_ROUTE_SESSION_RULE_VERSION, movementPlacements: undefined } : {})
    }
  })

  const setMovementChoice = (sessionIndex: number, slotIndex: number, exerciseId: string) => setDraft((current) => {
    const previous = current.movementOverrides?.find((choice) => choice.sessionIndex === sessionIndex && choice.slotIndex === slotIndex)
    const movementOverrides = (current.movementOverrides ?? []).filter((choice) => choice.sessionIndex !== sessionIndex || choice.slotIndex !== slotIndex)
    return {
      ...current,
      movementOverrides: [...movementOverrides, {
        sessionIndex,
        slotIndex,
        exerciseId,
        source: 'athlete' as const,
        ...(previous?.exerciseId === exerciseId && previous.benchAngleDeg !== undefined ? { benchAngleDeg: previous.benchAngleDeg } : {})
      }]
    }
  })

  const setMovementAngle = (sessionIndex: number, slotIndex: number, exerciseId: string, raw: string) => setDraft((current) => {
    const movementOverrides = (current.movementOverrides ?? []).filter((choice) => choice.sessionIndex !== sessionIndex || choice.slotIndex !== slotIndex)
    const benchAngleDeg = raw === '' ? null : normalizeBenchAngle(Number(raw))
    return {
      ...current,
      movementOverrides: [...movementOverrides, { sessionIndex, slotIndex, exerciseId, benchAngleDeg, source: 'athlete' as const }]
    }
  })

  const resetMovementChoice = (sessionIndex: number, slotIndex: number) => setDraft((current) => ({
    ...current,
    movementOverrides: current.movementOverrides?.filter((choice) => choice.sessionIndex !== sessionIndex || choice.slotIndex !== slotIndex)
  }))

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
    { label: 'Main squat', options: exercises.filter((exercise) => exercise.pattern === 'squat') },
    { label: 'Main press', options: exercises.filter((exercise) => exercise.pattern === 'horizontal-push' || exercise.pattern === 'vertical-push') },
    { label: 'Main hinge', options: exercises.filter((exercise) => exercise.pattern === 'hinge') }
  ]

  return (
    <div className="screen">
      <header className="screen-header">
        <div><p className="eyebrow">Life-aware planning</p><h1>The plan bends. The goal stays visible.</h1><p>A training round is the current group of workouts. A training block is several rounds aimed at one larger goal. Dates help schedule them, but only completed training earns progress.</p></div>
        <div className="header-actions">
          <button className="button button--secondary" onClick={() => setHistoryOpen(true)}><History size={17} /> Versions</button>
          <button className="button button--primary" onClick={openEditor}><Edit3 size={17} /> Edit training block</button>
        </div>
      </header>

      <section className="cycle-hero">
        <div className="cycle-hero__copy">
          <span className="status-chip status-chip--orange">{cycleReview && cycleReview.evidence.unresolvedSessions === 0 ? 'Ready for review' : cycleReview?.targetPassed ? 'Review window open' : 'Cycle in progress'}</span>
          <p className="eyebrow">{activePlan ? `${activePlan.entryRoute ? readable(activePlan.entryRoute) : readable(activePlan.dominantAdaptation)} · Plan v${activePlan.version}` : 'Legacy plan · Create first version'}</p>
          <h2>{activePlan?.title ?? 'Protect the next useful workout.'}</h2>
          <p>{activePlan?.objective ?? athlete.goal}</p>
          <div className="cycle-progress"><span><b style={{ width: `${Math.max(8, ((cycleReview?.evidence.qualifiedSessions ?? 0) / Math.max(1, cycleReview?.evidence.requiredSessions ?? 1)) * 100)}%` }} /></span><small>{cycleReview?.evidence.qualifiedSessions ?? 0} of {cycleReview?.evidence.requiredSessions ?? required} important workouts completed well enough in training round {cycleReview?.microcycleNumber ?? 1}</small></div>
        </div>
        <div className="cycle-map" aria-label="Training cycle map">
          <div className="cycle-node cycle-node--done"><Check size={18} /><span>Entry<small>Profile built</small></span></div>
          <MoveRight />
          <div className="cycle-node cycle-node--active"><CircleDashed size={18} /><span>Build<small>Active now</small></span></div>
          <MoveRight />
          <div className="cycle-node"><Layers3 size={18} /><span>Review<small>When you hit your targets</small></span></div>
          <MoveRight />
          <div className="cycle-node"><Flag size={18} /><span>Next<small>Continue or pivot</small></span></div>
        </div>
      </section>

      <section className="block-blueprint" aria-labelledby="block-blueprint-title">
        <div className="block-blueprint__header">
          <div>
            <p className="eyebrow">Training-block blueprint</p>
            <h2 id="block-blueprint-title">See the whole route before you train it.</h2>
            <p>{sourcePlan ? 'These movements repeat as the stable weekly structure. Loads, repetitions, and recovery decisions can adapt after completed-work reviews, but ForgePath will not silently replace your chosen exercises.' : 'Build the first block to review every training day, movement role, and recovery checkpoint before committing.'}</p>
          </div>
          <button className="button button--primary" onClick={openEditor}><Edit3 size={17} /> {sourcePlan ? 'Review and edit blueprint' : 'Build first blueprint'}</button>
        </div>

        {sourcePlan ? <>
          <div className="block-route" aria-label={`${sourcePlan.targetMicrocycles} planned training rounds followed by a block review`}>
            {Array.from({ length: sourcePlan.targetMicrocycles }, (_, index) => {
              const round = index + 1
              const state = sourcePlan.status === 'completed' || round < blueprintRound ? 'complete' : round === blueprintRound && sourcePlan.status === 'active' ? 'current' : 'planned'
              return <div key={round} className={`block-route__round block-route__round--${state}`}><span>{state === 'complete' ? <Check size={15} /> : round}</span><strong>Round {round}</strong><small>{state === 'current' ? 'Current' : state === 'complete' ? 'Recorded' : 'Planned'}</small></div>
            })}
            <div className="block-route__review"><Flag size={16} /><strong>Block review</strong><small>Continue, recover, or change</small></div>
          </div>

          <div className="block-blueprint__facts">
            <div><span>Weekly layout</span><strong>{blueprintSessions.length} training days</strong><small>{blueprintMinutesPerRound} estimated minutes</small></div>
            <div><span>Block length</span><strong>{sourcePlan.targetMicrocycles} planned rounds</strong><small>Completion follows training, not dates alone</small></div>
            <div><span>Planned working sets</span><strong>About {blueprintSetsPerRound * sourcePlan.targetMicrocycles}</strong><small>{blueprintSetsPerRound} per round before adaptations</small></div>
            <div><span>Recovery checkpoint</span><strong>After every round</strong><small>Deload is proposed from evidence</small></div>
          </div>

          <div className="block-blueprint__sessions">
            {blueprintSessions.map((session, sessionIndex) => {
              const dayOpen = openBlueprintDays[session.id] ?? sessionIndex === 0
              const movementCount = session.exercises.length
              const setCount = session.exercises.reduce((total, planned) => total + planned.sets.length, 0)
              const movementListId = `blueprint-day-${session.id}`
              return <article key={session.id} className={`blueprint-day ${dayOpen ? 'is-open' : 'is-closed'}`}>
              <header>
                <button
                  type="button"
                  className="blueprint-day__toggle"
                  aria-expanded={dayOpen}
                  aria-controls={movementListId}
                  aria-label={`${dayOpen ? 'Collapse' : 'Expand'} day ${sessionIndex + 1}: ${session.title}`}
                  onClick={() => setOpenBlueprintDays((current) => ({ ...current, [session.id]: !dayOpen }))}
                >
                  <span className="blueprint-day__number">Day {sessionIndex + 1}</span>
                  <span className="blueprint-day__summary"><strong>{session.title}</strong><small>{session.objective}</small></span>
                  <span className="blueprint-day__meta"><small><Clock3 size={14} /> {session.durationMinutes} min</small><small>{movementCount} movement{movementCount === 1 ? '' : 's'} · {setCount} sets</small></span>
                  <span className="blueprint-day__action"><small>{dayOpen ? 'Hide workout' : 'Show workout'}</small><ChevronDown size={18} /></span>
                </button>
              </header>
              <div className="blueprint-day__movements" id={movementListId} hidden={!dayOpen}>
                {session.exercises.map((planned, slotIndex) => {
                  const exercise = exercises.find((candidate) => candidate.id === planned.exerciseId)
                  const athleteChosen = sourcePlan.movementOverrides?.some((choice) => choice.sessionIndex === sessionIndex && choice.slotIndex === slotIndex)
                  return <div key={planned.id} className={`blueprint-movement blueprint-movement--${planned.role}`}>
                    <span className="blueprint-movement__role">{roleLabels[planned.role]}</span>
                    <span><strong>{exercise?.name ?? planned.exerciseId}</strong><small>{planned.purpose}</small></span>
                    <span className="blueprint-movement__dose"><strong>{prescriptionSummary(planned)}</strong>{exercise && supportsBenchAngle(exercise) && <small>{plannedAngleSummary(planned)}</small>}</span>
                    <span className={`status-chip status-chip--${athleteChosen ? 'lime' : 'default'}`}>{athleteChosen ? 'Your choice' : 'Suggested'}</span>
                  </div>
                })}
              </div>
            </article>
            })}
          </div>

          <div className="block-blueprint__contract">
            <div><Shield size={18} /><span><strong>Stable across the block</strong><small>Movement choices, roles, setup angles, priorities, and the weekly route stay fixed until you approve a revision.</small></span></div>
            <div><RefreshCcw size={18} /><span><strong>Allowed to adapt</strong><small>Load, repetitions, recoverable dose, scheduling, and the deload recommendation respond to completed work and feedback.</small></span></div>
          </div>

          {sourcePlan.status === 'completed' && <section className="next-block-review" aria-labelledby="next-block-review-title">
            <div className="next-block-review__header"><div><p className="eyebrow">Next-block movement review</p><h3 id="next-block-review-title">Start from what worked. Change what needs attention.</h3><p>ForgePath carries this blueprint forward, then uses your saved preferences and completed-set feedback to flag movement choices. These are suggestions only. You approve the next block.</p></div><RefreshCcw size={20} /></div>
            <div className="next-block-review__list">{nextBlockMovementRecommendations.map(({ exercise, recommendation, tone, reason }) => <article key={exercise.id}>
              <span><strong>{exercise.name}</strong><small>{reason}</small></span>
              <span className={`status-chip next-block-review__status next-block-review__status--${tone}`}>{recommendation}</span>
            </article>)}</div>
          </section>}
        </> : <div className="block-blueprint__empty"><ListChecks size={28} /><div><strong>No training-block blueprint yet</strong><p>ForgePath can suggest the first weekly structure from your goal, main lifts, available equipment, preferred movements, and time. You approve every exercise before it becomes the plan.</p></div></div>}
      </section>

      <div className="plan-layout">
        <CollapsiblePanel className="panel panel--flush" label="the upcoming session queue" header={<div className="panel__header panel__header--padded"><div><p className="eyebrow">Rolling priority queue</p><h3>Next sessions</h3></div><span>{planSessions.filter((session) => ['planned', 'deferred'].includes(session.status)).length} open · {activePlan?.weeklyOpportunities ?? athlete.weeklyOpportunities} / week</span></div>}>
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
                    <button className="icon-button" disabled={!['planned', 'deferred'].includes(session.status)} onClick={() => { const result = pinSession(session.id); if (!result.ok) setNotice(result.error ?? 'That session could not be pinned.') }} aria-label={`Pin ${session.title} as next priority`}><Pin size={17} /></button>
                  </div>
                </article>
              )
            })}
          </div>
        </CollapsiblePanel>

        <aside className="plan-aside">
          <section className="panel">
            <div className="panel__header"><div><p className="eyebrow">Two ways to measure progress</p><h3>Dates versus completed training</h3></div><CalendarDays size={19} /></div>
            <div className="clock-comparison">
              <div><span>Planned length</span><strong>{activePlan?.targetMicrocycles ?? 4} rounds</strong><small>Expected schedule</small></div>
              <div><span>Completed important workouts</span><strong>{completed} / {required}</strong><small>What can earn progress</small></div>
            </div>
            <p className="callout-copy">If Wednesday passes without benching, ForgePath records a schedule change, not a completed bench workout. The calendar moves forward; your training progress does not pretend the work happened.</p>
          </section>
          <CollapsiblePanel className="panel life-aware-explainer" ariaLabel="How the life-aware plan works" label="how life-aware planning works" header={<div className="panel__header"><div><p className="eyebrow">Life-aware plan</p><h3>What happens when you miss a workout</h3></div><RefreshCcw size={19} /></div>}>
            <div className="life-aware-steps">
              <article><span>1</span><div><strong>Record what actually happened</strong><p>Completed sets remain completed. A partial workout keeps only the sets you finished. A missed workout receives no sets, repetitions, load, volume, or progress credit.</p></div></article>
              <article><span>2</span><div><strong>Rebuild only unfinished plans</strong><p>ForgePath moves or reorders open workouts around your next realistic date, available minutes, equipment, joint feedback, and current readiness. Past completed workouts never change.</p></div></article>
              <article><span>3</span><div><strong>Create no volume debt</strong><p>Missed sets are not work you owe. ForgePath does not stack Monday's missed accessories onto Wednesday, double next week's sets, or ask you to compensate for a disrupted life.</p></div></article>
              <article><span>4</span><div><strong>Let completed work shape the future</strong><p>The current training round may continue longer, hold the same targets, or move to recovery. The next round progresses only when enough important work was completed and recovery supports it.</p></div></article>
            </div>
            <div className="life-aware-horizons">
              <div><small>Current training round</small><strong>Finish, extend, hold, or recover</strong><p>A round is usually about a week of workouts, but it can stretch when life interrupts it. Passing days alone never completes it.</p></div>
              <div><small>Current training block</small><strong>Use the pattern, not one bad week</strong><p>A block contains several rounds. Repeated missed work can lower the realistic frequency, volume, or session length at the next athlete-approved review.</p></div>
              <div><small>Long-term development</small><strong>Learn your sustainable plan</strong><p>ForgePath compares what was planned with what you repeatedly complete and recover from, then proposes a plan that fits your real life more accurately.</p></div>
            </div>
            <p className="life-aware-definition"><strong>Volume debt means missed planned work is treated as something you must repay later.</strong> ForgePath does not use volume debt. Missed work still matters because it leaves less evidence for progression, but it never becomes punishment or catch-up volume.</p>
          </CollapsiblePanel>
          {latestScheduleChange && <section className="panel schedule-change-card" aria-label="Latest missed opportunity decision">
            <div className="panel__header"><div><p className="eyebrow">Rebuild {activeScheduleChanges.length}</p><h3>Latest queue rebuild</h3></div><RefreshCcw size={19} /></div>
            <div className="schedule-change-card__headline"><strong>{scheduleChangeLabels[latestScheduleChange.mode]}</strong><small>{latestScheduleChange.input.reason.replaceAll('-', ' ')} · {latestScheduleChange.input.constraintState} · next {new Date(latestScheduleChange.input.nextOpportunityAt).toLocaleDateString()}</small></div>
            <div className="clock-comparison"><div><span>Completed sets</span><strong>{latestScheduleChange.completedSetCountBefore} → {latestScheduleChange.completedSetCountAfter}</strong><small>Unchanged source truth</small></div><div><span>Open planned sets</span><strong>{latestScheduleChange.openSetCountBefore} → {latestScheduleChange.openSetCountAfter}</strong><small>No catch-up debt</small></div></div>
            <p className="callout-copy">{latestScheduleChange.reasons[0]}</p>
            {latestScheduleChange.eligibility && <p className="schedule-change-card__eligibility"><strong>{latestScheduleChange.eligibility.equipmentProfileName}</strong><span>{latestScheduleChange.eligibility.removedExerciseNames.length ? `${latestScheduleChange.eligibility.removedExerciseNames.join(', ')} removed from the first session because they were unavailable or joint-flagged.` : 'The first rebuilt session was fully executable at the recorded location.'}</span></p>}
            {latestScheduleChange.readiness && <p className="schedule-change-card__eligibility"><strong>{scheduleReadinessOutcomeLabels[latestScheduleChange.readiness.effectiveOutcome]} · {checkInAgeLabels[latestScheduleChange.readiness.freshness]}</strong><span>{latestScheduleChange.readiness.reason}</span></p>}
            {latestScheduleChange.priorityDose && <p className="schedule-change-card__eligibility"><strong>28-day priority dose · {latestScheduleChange.priorityDose.appliedAsTieBreak ? 'applied' : 'reviewed'}</strong><span>{latestScheduleChange.priorityDose.reason}</span></p>}
            <details className="schedule-change-card__details"><summary>{latestScheduleChange.changes.length} moved session{latestScheduleChange.changes.length === 1 ? '' : 's'} · full replay</summary>{latestScheduleChange.changes.map((change) => <p key={change.sessionId}><strong>{sessions.find((session) => session.id === change.sessionId)?.title ?? change.sessionId}</strong><span>{new Date(change.fromPlannedAt).toLocaleDateString()} → {new Date(change.toPlannedAt).toLocaleDateString()} · {change.fromSetCount} → {change.toSetCount} planned sets</span></p>)}</details>
          </section>}
          {cycleReview && <section className="panel cycle-review-card">
            <div className="panel__header"><div><p className="eyebrow">Training round {cycleReview.microcycleNumber}</p><h3>Completed-work review</h3></div><span className={`status-chip status-chip--${cycleReview.maximumPassed ? 'orange' : 'default'}`}>{cycleReview.maximumPassed ? 'maximum passed' : cycleReview.targetPassed ? 'target passed' : 'inside target'}</span></div>
            <div className="review-dates"><div><small>Started</small><strong>{cycleReview.startedAt.toLocaleDateString()}</strong></div><div><small>Target review</small><strong>{cycleReview.targetDate.toLocaleDateString()}</strong></div><div><small>Maximum span</small><strong>{cycleReview.maximumDate.toLocaleDateString()}</strong></div></div>
            <div className="review-recommendation"><Sparkles size={18} /><span><small>Current recommendation</small><strong>{readable(cycleReview.recommendation)}</strong><p>{cycleReview.recommendationReasons[0]}</p></span></div>
            <button className="button button--primary button--full" onClick={openReview}>Review this training round</button>
          </section>}
          <section className="panel">
            <div className="panel__header"><div><p className="eyebrow">Protected qualities</p><h3>Current contract</h3></div><Target size={19} /></div>
            <ul className="priority-list">
              <li><span>Main lifts</span><strong>{activeAnchors.join(', ') || 'Choose your main lifts'}</strong></li>
              <li><span>Starting plan</span><strong>{activePlan?.entryRoute ? `${readable(activePlan.entryRoute)} · ${activePlan.generationRuleVersion}` : 'Manual adaptation rules'}</strong></li>
              <li><span>Main-lift starting plans</span><strong>{activePlan?.movementPlacements?.length ? `${activePlan.movementPlacements.length} main lifts can start differently${activePlan.movementPlacements.some((movement) => movement.historyReview) ? ` · ${activePlan.movementPlacements.filter((movement) => movement.historyReview).length} used logged history` : ''}` : 'The same starting plan applies to every main lift'}</strong></li>
              <li><span>Overall starting-plan review</span><strong>{readable(placementExit.recommendation)} · {placementExit.resolved} completed checks</strong></li>
              <li><span>Main lifts ready for review</span><strong>{movementExits.filter((assessment) => assessment.recommendation !== 'collect-evidence').length} ready · {movementExits.reduce((total, assessment) => total + assessment.resolved, 0)} completed lift checks</strong></li>
              <li><span>Generated for</span><strong>{activePlan?.generationEquipment ? `${activePlan.generationEquipment.profileName} · ${activePlan.generationEquipment.incrementUnit}` : 'Legacy or manual equipment context'}</strong></li>
              <li><span>Develop</span><strong>{(activePlan?.priorityRegions ?? athlete.priorityRegions).map(readable).join(', ')}</strong></li>
              <li><span>Maintain</span><strong>{(activePlan?.maintenanceRegions ?? []).map(readable).join(', ') || 'Set in next plan version'}</strong></li>
              <li><span>Constraint</span><strong>{activePlan?.defaultMinutes ?? athlete.defaultMinutes} minutes, irregular schedule</strong></li>
            </ul>
          </section>
          <button className="full-row-button full-row-button--accent" onClick={openEditor}><RefreshCcw size={17} /> Rebuild from a revision <ChevronRight size={18} /></button>
        </aside>
      </div>

      <Modal open={reviewOpen} onClose={() => setReviewOpen(false)} title={`Review training round ${cycleReview?.microcycleNumber ?? ''}`} description="ForgePath suggests what should happen next from completed workouts, elapsed time, effort, and pain. You make the final call and record why." wide>
        {cycleReview && <div className="cycle-review-modal">
          <section className="review-evidence">
            <div className="review-evidence__headline"><span><Sparkles size={19} /><small>What the rules suggest</small></span><strong>{readable(cycleReview.recommendation)}</strong>{cycleReview.recommendationReasons.map((reason) => <p key={reason}><Check size={14} />{reason}</p>)}</div>
            <div className="review-evidence__grid">
              <div><small>Qualified</small><strong>{cycleReview.evidence.qualifiedSessions} / {cycleReview.evidence.requiredSessions}</strong></div>
              <div><small>Completed sets</small><strong>{cycleReview.evidence.completedSets}</strong></div>
              <div><small>Round volume</small><strong>{cycleReview.evidence.volumeLoad.toLocaleString()}</strong></div>
              <div><small>Average session RPE</small><strong>{cycleReview.evidence.averageSessionRpe?.toFixed(1) ?? 'Unknown'}</strong></div>
              <div><small>Maximum pain</small><strong>{cycleReview.evidence.maximumPain ?? 'Unknown'}</strong></div>
              <div><small>Quality confirmed</small><strong>{cycleReview.evidence.qualityConfirmedSets ?? 0} / {cycleReview.evidence.completedSets}</strong></div>
              <div><small>Average technique</small><strong>{cycleReview.evidence.averageTechnique?.toFixed(1) ?? 'Unknown'}</strong></div>
              <div><small>Calendar days</small><strong>{cycleReview.evidence.calendarDays}</strong></div>
            </div>
          </section>
          <fieldset className="review-choice-list"><legend>How did this round go?</legend>{reviewChoices.map((choice) => {
            const enabled = cycleReview.eligible[choice.id]
            return <button type="button" key={choice.id} aria-pressed={reviewDecision === choice.id} className={reviewDecision === choice.id ? 'selected' : ''} disabled={!enabled} onClick={() => setReviewDecision(choice.id)}><span>{reviewDecision === choice.id ? <Check size={16} /> : <CircleDashed size={16} />}</span><span><strong>{choice.title}</strong><small>{choice.detail}</small>{!enabled && <em>Not available from what you have completed so far.</em>}</span></button>
          })}</fieldset>
          <button className="pivot-choice" onClick={openPivot}><RefreshCcw size={18} /><span><strong>Pivot or change the training contract</strong><small>Start a new version of this plan with different goals, main lifts, or amount of work.</small></span><ChevronRight size={17} /></button>
          <label><span className="field-label">Why is this the right decision now?</span><textarea value={reviewReason} onChange={(event) => setReviewReason(event.target.value)} placeholder="Example: The round is complete, effort stayed recoverable, and my schedule can support another training round." /></label>
          {reviewError && <div className="import-error" role="alert"><AlertCircle size={17} /><span><strong>Review not saved</strong>{reviewError}</span></div>}
          <p className="modal-note">Calendar time alone cannot complete the training block. Planned work never enters completed volume, and this decision never rewrites prior workouts.</p>
        </div>}
        <div className="modal__actions"><button className="button button--ghost" onClick={() => setReviewOpen(false)}>Cancel</button><button className="button button--primary" disabled={!reviewReason.trim()} onClick={submitReview}>Save review decision</button></div>
      </Modal>

      <Modal open={editorOpen} onClose={() => setEditorOpen(false)} title={`Preview training-block version ${nextVersion}`} description="Adjust the plan, inspect the generated workout queue, then apply it. Completed work never changes." wide>
        <div className="plan-editor">
          <div className="plan-editor__form">
            {activeSessionId && <div className="plan-editor__warning"><AlertCircle size={18} /><span><strong>Revision paused</strong>Finish or leave the active workout before applying a new plan.</span></div>}
            <div className="form-grid">
              <label><span className="field-label">Plan title</span><input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} /></label>
              <label><span className="field-label">Main goal for this block</span><select value={draft.dominantAdaptation} onChange={(event) => setDraft({ ...draft, dominantAdaptation: event.target.value as MesocycleDraft['dominantAdaptation'], entryRoute: undefined, generationRuleVersion: undefined, placementCreatedAt: undefined, generationEquipment: undefined, movementPlacements: undefined })}><option value="powerbuilding">Powerbuilding</option><option value="strength">Strength</option><option value="hypertrophy">Hypertrophy</option><option value="reacclimation">Reacclimation</option></select></label>
            </div>
            <label><span className="field-label">Objective</span><textarea value={draft.objective} onChange={(event) => setDraft({ ...draft, objective: event.target.value })} /></label>
            <div className="plan-editor__numbers">
              <label><span className="field-label">Opportunities / week</span><input type="number" min="2" max="7" value={draft.weeklyOpportunities} onChange={(event) => setDraft({ ...draft, weeklyOpportunities: Math.min(7, Math.max(2, Number(event.target.value))) })} /></label>
              <label><span className="field-label">Minutes / session</span><select value={draft.defaultMinutes} onChange={(event) => setDraft({ ...draft, defaultMinutes: Number(event.target.value) })}>{[30, 45, 60, 75, 90].map((minutes) => <option key={minutes} value={minutes}>{minutes} minutes</option>)}</select></label>
              <label><span className="field-label">Number of training rounds</span><input type="number" min="3" max="8" value={draft.targetMicrocycles} onChange={(event) => setDraft({ ...draft, targetMicrocycles: Math.min(8, Math.max(3, Number(event.target.value))) })} /></label>
            </div>

            <fieldset className="plan-fieldset"><legend>Your main lifts</legend><div className="anchor-selects">{anchorGroups.map((group, index) => <label key={group.label}><span>{group.label}</span><select value={draft.strengthAnchors[index] ?? ''} onChange={(event) => updateAnchor(index, event.target.value)}>{group.options.map((exercise) => <option value={exercise.id} key={exercise.id}>{exercise.name}</option>)}</select></label>)}</div></fieldset>

            <fieldset className="plan-fieldset"><legend>Priority regions <small>Choose up to 3</small></legend><div className="region-chips">{regions.map((region) => <button type="button" key={region} aria-pressed={draft.priorityRegions.includes(region)} onClick={() => toggleRegion('priorityRegions', region)}>{readable(region)}</button>)}</div></fieldset>
            <fieldset className="plan-fieldset"><legend>Maintenance regions <small>Choose up to 3</small></legend><div className="region-chips region-chips--maintenance">{regions.map((region) => <button type="button" key={region} aria-pressed={draft.maintenanceRegions.includes(region)} onClick={() => toggleRegion('maintenanceRegions', region)}>{readable(region)}</button>)}</div></fieldset>

            <details className="criteria-details"><summary>What starts, finishes, and ends this plan</summary><label><span className="field-label">Entry criteria</span><textarea value={draft.entryCriteria} onChange={(event) => setDraft({ ...draft, entryCriteria: event.target.value })} /></label><label><span className="field-label">Success criteria</span><textarea value={draft.successCriteria} onChange={(event) => setDraft({ ...draft, successCriteria: event.target.value })} /></label><label><span className="field-label">Recovery or exit plan</span><textarea value={draft.exitPlan} onChange={(event) => setDraft({ ...draft, exitPlan: event.target.value })} /></label></details>
            <label><span className="field-label">{activePlan ? 'Why are you changing the plan?' : 'Why are you choosing this next block?'}</span><textarea value={draft.revisionReason} placeholder="Example: My schedule is stable again and I can protect three 60-minute sessions." onChange={(event) => setDraft({ ...draft, revisionReason: event.target.value })} /></label>
            {editorError && <div className="import-error" role="alert"><AlertCircle size={17} /><span><strong>Plan not changed</strong>{editorError}</span></div>}
          </div>

          <aside className="plan-preview">
            <div className="plan-preview__header"><div><p className="eyebrow">Editable weekly blueprint</p><h3>Choose once for the whole block</h3></div><Sparkles size={19} /></div>
            <p className="plan-preview__intro">ForgePath suggests a complete weekly structure. Change a main lift, builder, accessory, or incline setup here and that choice carries into each new training round until you revise the block.</p>
            <div className="plan-preview__stats"><div><span>Days / round</span><strong>{preview.requiredExposureCount}</strong></div><div><span>Sets / round</span><strong>{preview.projectedSets}</strong></div><div><span>Whole block</span><strong>~{Math.round(preview.projectedBlockMinutes / 60)} hr</strong><small>{preview.projectedBlockSets} planned sets</small></div></div>
            <div className="preview-block-route" aria-label={`${draft.targetMicrocycles} training rounds and a recovery review`}>{Array.from({ length: draft.targetMicrocycles }, (_, index) => <span key={index}>R{index + 1}</span>)}<strong>Review</strong></div>
            <div className="preview-session-list preview-session-list--editable">{preview.sessions.map((session, sessionIndex) => <article key={session.id}>
              <span>{String(sessionIndex + 1).padStart(2, '0')}</span>
              <div className="preview-session-editor">
                <div className="preview-session-editor__header"><strong>{session.title}</strong><small>{session.durationMinutes} min · {session.exercises.length} movements</small></div>
                {session.exercises.map((planned, slotIndex) => {
                  const currentExercise = exercises.find((exercise) => exercise.id === planned.exerciseId)
                  if (!currentExercise) return null
                  const override = draft.movementOverrides?.find((choice) => choice.sessionIndex === sessionIndex && choice.slotIndex === slotIndex)
                  const usedExerciseIds = new Set(session.exercises.map((item) => item.exerciseId))
                  const candidates = exercises
                    .filter((exercise) => !exercise.retired && !exercise.disliked && exercise.jointFeeling !== 'avoid')
                    .filter((exercise) => exerciseEquipmentFit(exercise, activeEquipmentProfile).available)
                    .filter((exercise) => exercise.id === currentExercise.id || !usedExerciseIds.has(exercise.id))
                    .filter((exercise) => planned.role === 'primary'
                      ? exercise.pattern === currentExercise.pattern
                      : exercise.pattern === currentExercise.pattern || exercise.primaryRegion === currentExercise.primaryRegion || exercise.family === currentExercise.family)
                    .sort((a, b) => {
                      const aPreferred = Number(a.favorite) + Number(a.jointFeeling === 'great')
                      const bPreferred = Number(b.favorite) + Number(b.jointFeeling === 'great')
                      return bPreferred - aPreferred || a.name.localeCompare(b.name)
                    })
                  const carriedAngles = [...new Set(planned.sets.map((workSet) => workSet.benchAngleDeg).filter((angle): angle is number => angle !== undefined))]
                  const angleValue = override?.benchAngleDeg === null ? '' : override?.benchAngleDeg ?? (carriedAngles.length === 1 ? carriedAngles[0] : '')
                  return <div key={planned.id} className="preview-movement-editor">
                    <div className="preview-movement-editor__heading"><span className={`role-label role-label--${planned.role}`}>{roleLabels[planned.role]}</span><small>{prescriptionSummary(planned)}</small></div>
                    <label><span className="sr-only">{roleLabels[planned.role]} exercise for day {sessionIndex + 1}</span><select value={planned.exerciseId} onChange={(event) => planned.role === 'primary' ? updateAnchor(sessionIndex % Math.max(1, draft.strengthAnchors.length), event.target.value) : setMovementChoice(sessionIndex, slotIndex, event.target.value)}>{candidates.map((exercise) => <option key={exercise.id} value={exercise.id}>{exercise.name}</option>)}</select></label>
                    {supportsBenchAngle(currentExercise) && <label className="preview-angle-input"><span>Back pad</span><span><input aria-label={`${currentExercise.name} back-pad angle`} type="number" min="0" max="90" step="1" inputMode="decimal" value={angleValue} placeholder="Untracked" onChange={(event) => setMovementAngle(sessionIndex, slotIndex, currentExercise.id, event.target.value)} /><b>°</b></span><small>Applies to all sets; refine set by set during training.</small></label>}
                    {override && <button type="button" className="text-button preview-reset-choice" onClick={() => resetMovementChoice(sessionIndex, slotIndex)}>Use ForgePath suggestion</button>}
                  </div>
                })}
              </div>
            </article>)}</div>
            <div className="preview-rationale"><strong>Why this queue</strong>{preview.explanations.map((explanation) => <p key={explanation}><Check size={14} />{explanation}</p>)}</div>
            <p className="modal-note">Block totals are estimates, not completed volume. ForgePath reviews recovery after each round and proposes a deload, extension, or next block only from completed work and feedback. You approve the decision.</p>
          </aside>
        </div>
        <div className="modal__actions"><button className="button button--ghost" onClick={() => setEditorOpen(false)}>Cancel</button><button className="button button--primary" disabled={Boolean(activeSessionId) || !draft.revisionReason.trim()} onClick={saveRevision}>Apply version {nextVersion}</button></div>
      </Modal>

      <Modal open={historyOpen} onClose={() => setHistoryOpen(false)} title="Training-block revision history" description="Each version keeps its original goal, targets, timing, and why it changed." wide>
        <div className="revision-list">
          {[...mesocycles].sort((a, b) => b.version - a.version).map((plan) => <article key={plan.id} className={plan.status === 'active' ? 'active' : ''}>
            <div className="revision-list__version"><span>v{plan.version}</span><small>{plan.status}</small></div>
            <div><div className="revision-list__title"><h3>{plan.title}</h3><span>{new Date(plan.effectiveAt).toLocaleDateString()}</span></div><p>{plan.objective}</p><div className="revision-list__meta"><span><Dumbbell size={14} /> {readable(plan.dominantAdaptation)}</span><span><CalendarDays size={14} /> {plan.targetMicrocycles} target rounds</span><span><Clock3 size={14} /> {plan.defaultMinutes} min</span></div><blockquote><strong>Why changed</strong>{plan.revisionReason}</blockquote></div>
          </article>)}
          {mesocycles.length === 0 && <div className="empty-plan-history"><History size={26} /><strong>No saved training-block version yet</strong><p>Your current sessions are intact. Create the first plan version to begin the revision history.</p></div>}
        </div>
        {cycleReviews.length > 0 && <section className="cycle-review-history"><div className="panel__header"><div><p className="eyebrow">Append-only decisions</p><h3>Training-round reviews</h3></div><span>{activeCycleReviews.length} for current plan</span></div>{[...cycleReviews].reverse().map((review) => <article key={review.id}><span>R{review.microcycleNumber}</span><div><strong>{readable(review.decision)}</strong><small>{new Date(review.createdAt).toLocaleString()} · plan v{review.planVersion}</small><p>{review.reason}</p></div><div><small>Qualified</small><strong>{review.evidence.qualifiedSessions}/{review.evidence.requiredSessions}</strong></div></article>)}</section>}
      </Modal>
    </div>
  )
}
