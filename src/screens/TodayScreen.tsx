import { useEffect, useMemo, useState } from 'react'
import { AlarmClock, AlertTriangle, ArrowRight, BatteryCharging, CalendarClock, CheckCircle2, ChevronRight, Clock3, CloudOff, Dumbbell, FileCheck2, Footprints, HelpCircle, RotateCcw, ShieldCheck, Sparkles, Trophy } from 'lucide-react'
import { estimatedOneRepMax, recommendProgression, volumeLoad } from '../domain/training-engine'
import type { EffectiveSurveyMode, MissedOpportunityInput, SurveyAnswer } from '../domain/types'
import { useAppStore } from '../store/useAppStore'
import { Modal } from '../components/Modal'
import { PixelAvatar } from '../components/PixelAvatar'
import { StatCard } from '../components/StatCard'
import { SurveyModal } from '../components/SurveyModal'
import { SurveyModeChooser } from '../components/SurveyModeChooser'
import { PostSurveyModal } from '../components/PostSurveyModal'
import { pendingDeferredFeedback } from '../domain/survey-engine'
import { exerciseEquipmentFit, loadIncrementFor, sessionEquipmentGaps } from '../domain/equipment-engine'
import { summarizePlacementVerification } from '../domain/placement-verification-engine'
import { buildMovementPlacementExitAssessment, buildPlacementExitAssessment } from '../domain/placement-exit-engine'
import { scheduleSessionEligibility } from '../domain/schedule-adaptation-engine'

const timeOptions = [15, 30, 45, 60, 75]
const dateInputFor = (offsetDays: number) => {
  const date = new Date()
  date.setDate(date.getDate() + offsetDays)
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-')
}

export function TodayScreen() {
  const { athlete, settings, updateSettings, equipmentProfiles, sessions, exercises, history, startSession, setReadiness, markMissed, records, setNav, deferredFeedback, placementVerifications, placementExitReviews, movementPlacementExitReviews, missedOpportunityEvents, resolvePlacementRecovery, submitDeferredFeedback, dismissDeferredFeedback, expireDeferredFeedback } = useAppStore()
  const [surveyOpen, setSurveyOpen] = useState(false)
  const [surveyChooserOpen, setSurveyChooserOpen] = useState(false)
  const [activeSurveyMode, setActiveSurveyMode] = useState<Exclude<EffectiveSurveyMode, 'off'>>('full')
  const [whyOpen, setWhyOpen] = useState(false)
  const [missedOpen, setMissedOpen] = useState(false)
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const [equipmentGateOpen, setEquipmentGateOpen] = useState(false)
  const [pendingStart, setPendingStart] = useState<{ answers: SurveyAnswer[]; skipped: boolean; mode: EffectiveSurveyMode; minutes: number } | null>(null)
  const [placementExitAssessedAt] = useState(() => new Date().toISOString())
  const [missReason, setMissReason] = useState<MissedOpportunityInput>({ reason: 'family', trainingOutcome: 'no-training', nextOpportunityAt: dateInputFor(1), nextMinutes: 45, constraintState: 'continuing', note: '', preferredNextSessionId: null })
  const [missError, setMissError] = useState<string | null>(null)
  const nextSession = sessions.find((session) => ['planned', 'deferred'].includes(session.status)) ?? sessions[0]
  const primaryPlan = nextSession?.exercises.find((exercise) => exercise.role === 'primary')
  const primaryExercise = exercises.find((exercise) => exercise.id === primaryPlan?.exerciseId)
  const primaryHistory = history.filter((set) => set.exerciseId === primaryExercise?.id)
  const activeEquipmentProfile = equipmentProfiles.find((profile) => profile.id === settings.activeEquipmentProfileId) ?? equipmentProfiles[0]
  const equipmentGaps = nextSession ? sessionEquipmentGaps(nextSession, exercises, activeEquipmentProfile) : []
  const openScheduleEligibility = useMemo(() => sessions.filter((session) => ['planned', 'deferred'].includes(session.status)).map((session) => ({ session, evidence: scheduleSessionEligibility(session, exercises, activeEquipmentProfile) })), [sessions, exercises, activeEquipmentProfile])
  const latestScheduleChange = missedOpportunityEvents.at(-1)
  const latestRebuiltSession = latestScheduleChange ? sessions.find((session) => session.id === latestScheduleChange.nextSessionId) : null
  const latestRebuiltPrimary = latestScheduleChange?.nextPrimaryExerciseId ? exercises.find((exercise) => exercise.id === latestScheduleChange.nextPrimaryExerciseId) : null
  const placementVerification = summarizePlacementVerification(placementVerifications, athlete.placement.createdAt)
  const placementExit = useMemo(() => buildPlacementExitAssessment({ placement: athlete.placement, verificationEvents: placementVerifications, assessedAt: placementExitAssessedAt }), [athlete.placement, placementVerifications, placementExitAssessedAt])
  const placementExitEvidenceKey = placementExit.sourceVerificationEvents.filter((event) => event.placementRoute === placementExit.currentRoute).map((event) => event.id).join('|')
  const placementExitReviewed = placementExitReviews.some((review) => review.placementCreatedAt === athlete.placement.createdAt && review.assessment.sourceVerificationEvents.filter((event) => event.placementRoute === review.assessment.currentRoute).map((event) => event.id).join('|') === placementExitEvidenceKey)
  const placementExitActionable = placementExit.collected > 0 && placementExit.recommendation !== 'collect-evidence' && !placementExitReviewed
  const nextMovementPlacement = nextSession?.generation?.movementPlacement
  const movementExits = useMemo(() => (athlete.placement.movementPlacements ?? []).map((movementPlacement) => buildMovementPlacementExitAssessment({ placement: athlete.placement, movementPlacement, verificationEvents: placementVerifications, assessedAt: placementExitAssessedAt })), [athlete.placement, placementVerifications, placementExitAssessedAt])
  const movementExitReviewed = (assessment: (typeof movementExits)[number]) => {
    const evidenceKey = assessment.sourceVerificationEvents.filter((event) => event.movementPlacement?.exerciseId === assessment.exerciseId).map((event) => event.id).join('|')
    return movementPlacementExitReviews.some((review) => review.placementCreatedAt === assessment.placementCreatedAt && review.exerciseId === assessment.exerciseId && review.assessment.sourceVerificationEvents.filter((event) => event.movementPlacement?.exerciseId === assessment.exerciseId).map((event) => event.id).join('|') === evidenceKey)
  }
  const actionableMovementExits = movementExits.filter((assessment) => assessment.collected > 0 && assessment.recommendation !== 'collect-evidence' && !movementExitReviewed(assessment))
  const movementExit = actionableMovementExits.find((assessment) => assessment.exerciseId === nextMovementPlacement?.exerciseId) ?? actionableMovementExits[0] ?? null
  const pendingPlacementRecovery = placementVerification.events.find((event) => event.status === 'awaiting-recovery')
  const placementLaneCount = new Set(placementVerification.events.map((event) => event.movementPlacement?.exerciseId ?? 'plan')).size
  const placementBlocked = athlete.placement.selectedRoute === 'pain-aware-modified' || placementVerification.blocked
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
  const routeLabel = nextSession?.generation?.route.replaceAll('-', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
  const whyReasons = nextSession?.generation
    ? [
        { title: `${routeLabel} route`, detail: nextSession.generation.strategy },
        ...(nextSession.generation.movementPlacement ? [{ title: `${nextSession.generation.movementPlacement.exerciseName} has its own starting lane`, detail: `${nextSession.generation.movementPlacement.reasons[0]} Skill ${nextSession.generation.movementPlacement.movementSkill}/5, heavy-work tolerance ${nextSession.generation.movementPlacement.strengthTolerance}/5, evidence ${nextSession.generation.movementPlacement.dataConfidence}/5.${nextSession.generation.movementPlacement.historyReview ? ` You accepted exact-history support for ${nextSession.generation.movementPlacement.historyReview.acceptedFields.map((field) => field === 'dataConfidence' ? 'evidence' : 'tolerance').join(' and ')} from ${nextSession.generation.movementPlacement.historyReview.evidence.recentSetCount} recent source sets.` : ''}` }] : []),
        ...(nextSession.generation.equipment ? [{ title: `Generated for ${nextSession.generation.equipment.profileName}`, detail: `Secondary and accessory choices matched the stored equipment snapshot. Loads used its ${nextSession.generation.equipment.incrementUnit} increments.` }] : []),
        ...nextSession.generation.reasons.map((reason) => ({ title: 'Route evidence', detail: reason })),
        { title: progression.title, detail: progression.explanation }
      ]
    : [
        { title: `${primaryExercise?.name ?? 'The primary movement'} is the protected anchor.`, detail: 'Its latest qualified exact exposure remains the progression reference.' },
        { title: 'The session protects the next useful exposure.', detail: 'Missed calendar dates do not create catch-up debt or automatic progression.' },
        { title: 'The session fits the current time budget.', detail: `At ${settings.availableMinutes} minutes, primary work stays ahead of optional accessory dose.` },
        { title: progression.title, detail: progression.explanation }
      ]

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

      {pendingPlacementRecovery && <section className="placement-recovery-check" aria-label="Optional placement recovery check">
        <span className="placement-recovery-check__icon"><ShieldCheck size={20} /></span>
        <div><p className="eyebrow">{pendingPlacementRecovery.movementPlacement ? `${pendingPlacementRecovery.movementPlacement.exerciseName} check` : 'Placement check'} {pendingPlacementRecovery.sequence} of 3 · optional</p><strong>How did you recover from {sessions.find((session) => session.id === pendingPlacementRecovery.sessionId)?.title ?? 'the last session'}?</strong><small>This completes the exact-lane route check. Skipping leaves recovery unknown and never blocks training.</small></div>
        <div className="placement-recovery-check__actions">
          <button onClick={() => resolvePlacementRecovery(pendingPlacementRecovery.id, 'recovered')}>Recovered</button>
          <button onClick={() => resolvePlacementRecovery(pendingPlacementRecovery.id, 'acceptable')}>Acceptable</button>
          <button onClick={() => resolvePlacementRecovery(pendingPlacementRecovery.id, 'not-recovered')}>Not recovered</button>
          <button className="text-button" onClick={() => resolvePlacementRecovery(pendingPlacementRecovery.id, 'skipped')}>Skip</button>
        </div>
      </section>}

      {placementExitActionable && <button className={`placement-exit-callout placement-exit-callout--${placementExit.recommendation}`} onClick={() => setNav('you')}>
        <FileCheck2 size={20} /><span><small>{placementExit.ruleVersion} · athlete review required</small><strong>{placementExit.recommendation === 'confirm-current' ? 'Your current route has earned confirmation.' : placementExit.recommendation === 'hold-current' ? 'The current route should be reviewed and held.' : placementExit.recommendation === 'reassessment-required' ? 'Placement reassessment is required.' : 'Your placement route is ready for review.'}</strong><p>{placementExit.reasons[0]}</p></span><ChevronRight size={18} />
      </button>}

      {movementExit && <button className={`placement-exit-callout movement-exit-callout placement-exit-callout--${movementExit.recommendation}`} onClick={() => setNav('you')}>
        <Dumbbell size={20} /><span><small>{movementExit.ruleVersion} · exact movement review</small><strong>{movementExit.exerciseName} has an independent lane checkpoint.</strong><p>{movementExit.reasons[0]}</p></span><ChevronRight size={18} />
      </button>}

      {latestScheduleChange && latestRebuiltSession && <section className={`schedule-rebuild-proof schedule-rebuild-proof--${latestScheduleChange.mode}`} aria-label="Latest schedule adaptation">
        <div className="schedule-rebuild-proof__icon"><RotateCcw size={22} /></div>
        <div className="schedule-rebuild-proof__body">
          <p className="eyebrow">{latestScheduleChange.ruleVersion} · {latestScheduleChange.mode.replaceAll('-', ' ')}</p>
          <h2>Queue rebuilt from completed work.</h2>
          <p><strong>{latestRebuiltSession.title}</strong> is next on {new Date(latestRebuiltSession.plannedDate).toLocaleDateString()} for {latestRebuiltSession.durationMinutes} minutes. {latestRebuiltPrimary?.name ?? 'Its protected primary'} has {latestScheduleChange.nextPrimaryDaysSinceExposure === null ? 'no completed exact baseline yet' : `${latestScheduleChange.nextPrimaryDaysSinceExposure} calendar days since its latest exact exposure`}.</p>
          <div className="schedule-rebuild-proof__facts">
            <span><small>Completed source sets</small><strong>{latestScheduleChange.completedSetCountBefore} → {latestScheduleChange.completedSetCountAfter}</strong></span>
            <span><small>Open planned sets</small><strong>{latestScheduleChange.openSetCountBefore} → {latestScheduleChange.openSetCountAfter}</strong></span>
            <span><small>Continuity</small><strong>{latestScheduleChange.continuityBefore} → {latestScheduleChange.continuityAfter}</strong></span>
            <span><small>Miss sequence</small><strong>{latestScheduleChange.consecutiveMisses}</strong></span>
            {latestScheduleChange.eligibility && <span><small>Equipment eligibility</small><strong>{latestScheduleChange.eligibility.equipmentProfileName}</strong><em>{latestScheduleChange.eligibility.removedExerciseNames.length ? `${latestScheduleChange.eligibility.removedExerciseNames.length} support movement${latestScheduleChange.eligibility.removedExerciseNames.length === 1 ? '' : 's'} removed` : 'fully executable'}</em></span>}
            {latestScheduleChange.readiness && <span><small>Readiness evidence</small><strong>{latestScheduleChange.readiness.effectiveOutcome.replaceAll('-', ' ')}</strong><em>{latestScheduleChange.readiness.freshness === 'current' ? `${latestScheduleChange.readiness.action.replaceAll('-', ' ')} · ${latestScheduleChange.readiness.ageHours ?? 0}h old` : latestScheduleChange.readiness.freshness === 'stale' ? 'stale · not applied' : 'unknown · no penalty'}</em></span>}
            {latestScheduleChange.priorityDose && <span><small>Priority dose tie-break</small><strong>{latestScheduleChange.priorityDose.selectedGapRegions.length ? latestScheduleChange.priorityDose.selectedGapRegions.join(', ').replaceAll('-', ' ') : 'No relative gap'}</strong><em>{latestScheduleChange.priorityDose.appliedAsTieBreak ? `applied · ${latestScheduleChange.priorityDose.selectedGapScore} relative set${latestScheduleChange.priorityDose.selectedGapScore === 1 ? '' : 's'}` : 'reviewed · no override'}</em></span>}
          </div>
          <details><summary>Why this order?</summary>{latestScheduleChange.reasons.map((reason) => <p key={reason}><CheckCircle2 size={14} />{reason}</p>)}</details>
        </div>
        <button className="button button--small button--secondary" onClick={() => setNav('plan')}>Review plan</button>
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
          {placementBlocked && <button className="placement-training-gate" onClick={() => setNav('you')}><AlertTriangle size={19} /><span><strong>Workout start paused for placement review</strong><small>{placementVerification.blocked ? 'A placement verification recorded pain that changed what could be trained.' : 'Your starting profile says pain or restriction changes what can be trained.'} Reassess the profile before starting. This is not medical clearance.</small></span><ChevronRight size={18} /></button>}
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
        <StatCard label="Placement checks" value={`${placementVerification.resolved} resolved`} detail={`${placementLaneCount} exact lane${placementLaneCount === 1 ? '' : 's'} · ${placementVerification.state.replaceAll('-', ' ')}`} icon={<ShieldCheck size={18} />} tone="blue" />
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
          <button className="full-row-button" onClick={() => { setMissError(null); setMissedOpen(true) }}>I missed this opportunity <ChevronRight size={18} /></button>
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
          {whyReasons.map((reason, index) => <div key={`${reason.title}-${index}`}><span>{String(index + 1).padStart(2, '0')}</span><p><strong>{reason.title}.</strong> {reason.detail}</p></div>)}
        </div>
        <div className="modal__actions"><button className="button button--primary" onClick={() => setWhyOpen(false)}>Understood</button></div>
      </Modal>

      <Modal open={missedOpen} onClose={() => setMissedOpen(false)} title="Rebuild from what happened" description="Record the real interruption. ForgePath will move only open work and will never award missed exposure credit or create catch-up debt." wide>
        <div className="missed-checkin">
        <fieldset className="missed-checkin__choices"><legend>Did any training happen?</legend>
          <button type="button" aria-pressed={missReason.trainingOutcome === 'no-training'} onClick={() => setMissReason((current) => ({ ...current, trainingOutcome: 'no-training' }))}><span>{missReason.trainingOutcome === 'no-training' ? <CheckCircle2 size={16} /> : <Clock3 size={16} />}</span><strong>No training</strong><small>No exposure credit is created.</small></button>
          <button type="button" aria-pressed={missReason.trainingOutcome === 'different-training-unlogged'} onClick={() => setMissReason((current) => ({ ...current, trainingOutcome: 'different-training-unlogged' }))}><span>{missReason.trainingOutcome === 'different-training-unlogged' ? <CheckCircle2 size={16} /> : <Dumbbell size={16} />}</span><strong>Different training, not logged</strong><small>Record or import sets later before they count.</small></button>
        </fieldset>
        <div className="form-grid">
        <label><span className="field-label">What got in the way?</span>
        <select id="miss-reason" value={missReason.reason} onChange={(event) => setMissReason((current) => ({ ...current, reason: event.target.value as MissedOpportunityInput['reason'] }))}>
          <option value="family">Children or family</option><option value="work">Work</option><option value="time">Time</option><option value="sleep">Sleep</option><option value="pain">Pain</option><option value="illness">Illness</option><option value="travel">Travel</option><option value="equipment">Equipment</option><option value="motivation">Motivation</option><option value="other">Other</option>
        </select></label>
        <label><span className="field-label">Next realistic opportunity</span><input type="date" min={dateInputFor(0)} value={missReason.nextOpportunityAt} onChange={(event) => setMissReason((current) => ({ ...current, nextOpportunityAt: event.target.value }))} /></label>
        <label><span className="field-label">Minutes likely available</span><select id="next-time" value={missReason.nextMinutes} onChange={(event) => setMissReason((current) => ({ ...current, nextMinutes: Number(event.target.value) }))}>{[15, 30, 45, 60, 75, 90].map((minutes) => <option key={minutes} value={minutes}>{minutes} minutes</option>)}</select></label>
        <label><span className="field-label">Which session should lead?</span><select value={missReason.preferredNextSessionId ?? ''} onChange={(event) => setMissReason((current) => ({ ...current, preferredNextSessionId: event.target.value || null }))}><option value="">Recommend an executable session</option>{openScheduleEligibility.map(({ session, evidence }) => <option key={session.id} value={session.id} disabled={!evidence.eligibleToLead || placementBlocked}>Pin {session.title}{evidence.eligibleToLead ? evidence.fullyExecutable ? ' · ready here' : ` · ${evidence.supportReviewCount} support change${evidence.supportReviewCount === 1 ? '' : 's'}` : ` · unavailable: ${evidence.reasons[0]}`}</option>)}</select><small className="field-help">Checked against {activeEquipmentProfile.name} and current joint-response evidence. A valid pin controls only the first choice; exact exposure orders the remainder.</small></label>
        </div>
        <fieldset className="missed-checkin__state"><legend>What is the disruption doing now?</legend>{([
          ['ended', 'Ended', 'Return to the normal queue with the declared time.'],
          ['continuing', 'Continuing', 'Keep the next session conservative.'],
          ['uncertain', 'Uncertain', 'Protect flexibility until the schedule is clearer.']
        ] as const).map(([value, title, detail]) => <button type="button" key={value} aria-pressed={missReason.constraintState === value} onClick={() => setMissReason((current) => ({ ...current, constraintState: value }))}><strong>{title}</strong><small>{detail}</small></button>)}</fieldset>
        <label><span className="field-label">Optional context</span><textarea maxLength={500} value={missReason.note} onChange={(event) => setMissReason((current) => ({ ...current, note: event.target.value }))} placeholder="Example: Kids were up most of the night. Friday morning should be realistic, but I only have 30 minutes." /></label>
        <div className="missed-checkin__guardrail"><ShieldCheck size={18} /><span><strong>What the rebuild can do</strong><small>Move open sessions, rank executable exact primaries, use answered readiness evidence from the last 24 hours, and use rolling 28-day relative dose across your declared priority regions only when stronger queue factors are tied. It can reduce optional fatigue and fit the next time window, but it never prescribes catch-up volume. Skipped, missing, or stale readiness stays unknown. Completed sessions and source sets remain untouched.</small></span></div>
        {missError && <div className="import-error" role="alert"><AlertTriangle size={17} /><span><strong>Plan not rebuilt</strong>{missError}</span></div>}
        </div>
        <div className="modal__actions"><button className="button button--ghost" onClick={() => setMissedOpen(false)}>Cancel</button><button className="button button--primary" onClick={() => {
          if (placementBlocked) return setMissError('Automatic schedule rebuilding is paused because the current pain or restriction evidence changes what can be trained. Reassess the profile before rebuilding. This is not medical clearance.')
          if (!nextSession) return setMissError('There is no open session to rebuild.')
          const nextOpportunity = new Date(`${missReason.nextOpportunityAt}T12:00:00`)
          if (Number.isNaN(nextOpportunity.getTime())) return setMissError('Choose a valid next opportunity date.')
          const result = markMissed(nextSession.id, { ...missReason, nextOpportunityAt: nextOpportunity.toISOString() })
          if (!result.ok) return setMissError(result.error ?? 'The queue could not be rebuilt.')
          setMissedOpen(false)
        }}><CheckCircle2 size={17} /> Rebuild my plan</button></div>
      </Modal>
    </div>
  )
}
