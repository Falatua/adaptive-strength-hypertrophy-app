import { isComparableExposure } from './set-structure-engine'
import type {
  CompletedSetRecord,
  Exercise,
  MissedOpportunityEvent,
  PlacementVerificationEvent,
  SurveyRecord,
  TrainingSession
} from './types'

export const ONGOING_CONFIDENCE_RULE_VERSION = 'ongoing-confidence-v1' as const
export const CONFIDENCE_RECENT_DAYS = 42

export type CalibrationState = 'uncalibrated' | 'early-evidence' | 'developing' | 'well-calibrated' | 'stale'
export type ConfidenceLaneId = 'main-lift-prescriptions' | 'schedule-fit' | 'recovery-response' | 'volume-tolerance'

export interface MovementCalibrationEvidence {
  exerciseId: string
  exerciseName: string
  state: CalibrationState
  evidenceStrength: number
  exactSetCount: number
  exposureDateCount: number
  recentSetCount: number
  latestCompletedAt: string | null
  daysSinceLatest: number | null
  rirCoverage: number | null
  qualityCoverage: number | null
  comparableExposureDateCount: number
  recordedAngleContexts: string[]
  sourceSetIds: string[]
  explanation: string
  nextLearningNeed: string
}

export interface ConfidenceLane {
  id: ConfidenceLaneId
  label: string
  state: CalibrationState
  evidenceStrength: number
  evidenceCount: number
  explanation: string
  nextLearningNeed: string
}

export interface OngoingConfidenceModel {
  ruleVersion: typeof ONGOING_CONFIDENCE_RULE_VERSION
  assessedAt: string
  headline: string
  summary: string
  movements: MovementCalibrationEvidence[]
  lanes: ConfidenceLane[]
  principles: string[]
}

const DAY_MS = 86_400_000
const dateKey = (value: string) => value.slice(0, 10)
const clampEvidence = (value: number) => Math.max(0, Math.min(5, Math.round(value)))

const stateFrom = (evidenceStrength: number, daysSinceLatest: number | null): CalibrationState => {
  if (daysSinceLatest !== null && daysSinceLatest > CONFIDENCE_RECENT_DAYS) return 'stale'
  if (evidenceStrength === 0) return 'uncalibrated'
  if (evidenceStrength <= 2) return 'early-evidence'
  if (evidenceStrength <= 4) return 'developing'
  return 'well-calibrated'
}

const weakestState = (states: CalibrationState[]): CalibrationState => {
  if (!states.length || states.every((state) => state === 'uncalibrated')) return 'uncalibrated'
  if (states.some((state) => state === 'stale')) return 'stale'
  if (states.some((state) => state === 'uncalibrated' || state === 'early-evidence')) return 'early-evidence'
  if (states.some((state) => state === 'developing')) return 'developing'
  return 'well-calibrated'
}

export function buildMovementCalibrationEvidence(input: {
  exercise: Pick<Exercise, 'id' | 'name'>
  history: CompletedSetRecord[]
  assessedAt: string
}): MovementCalibrationEvidence {
  const assessedMs = new Date(input.assessedAt).getTime()
  const exact = input.history
    .filter((workSet) => workSet.exerciseId === input.exercise.id && new Date(workSet.completedAt).getTime() <= assessedMs)
    .sort((a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime())
  const latest = exact.at(-1)?.completedAt ?? null
  const daysSinceLatest = latest ? Math.floor((assessedMs - new Date(latest).getTime()) / DAY_MS) : null
  const recent = exact.filter((workSet) => assessedMs - new Date(workSet.completedAt).getTime() <= CONFIDENCE_RECENT_DAYS * DAY_MS)
  const exposureDateCount = new Set(exact.map((workSet) => dateKey(workSet.completedAt))).size
  const comparableExposureDateCount = new Set(exact.filter((workSet) => isComparableExposure(workSet.grouping)).map((workSet) => dateKey(workSet.completedAt))).size
  const rirKnownCount = exact.filter((workSet) => workSet.rirKnown !== false && Number.isFinite(workSet.rir)).length
  const qualityKnownCount = exact.filter((workSet) => workSet.qualityConfirmed === true).length
  const rirCoverage = exact.length ? rirKnownCount / exact.length : null
  const qualityCoverage = exact.length ? qualityKnownCount / exact.length : null
  const recordedAngleContexts = [...new Set(exact.map((workSet) => workSet.benchAngleDeg === undefined ? 'angle untracked' : `${workSet.benchAngleDeg}°`))]
  const evidenceStrength = clampEvidence(
    Number(exact.length > 0)
    + Number(exposureDateCount >= 2)
    + Number(exposureDateCount >= 4)
    + Number((rirCoverage ?? 0) >= 0.7 && (qualityCoverage ?? 0) >= 0.7)
    + Number(daysSinceLatest !== null && daysSinceLatest <= CONFIDENCE_RECENT_DAYS)
  )
  const state = stateFrom(evidenceStrength, daysSinceLatest)
  const explanation = state === 'uncalibrated'
    ? 'No exact completed set exists for this movement, so ForgePath has no personal working baseline yet.'
    : state === 'stale'
      ? `The last exact exposure was ${daysSinceLatest} days ago. History stays visible, but it is no longer treated as current capacity.`
      : `${exact.length} exact sets across ${exposureDateCount} training date${exposureDateCount === 1 ? '' : 's'} support this movement-specific estimate.`
  const nextLearningNeed = state === 'uncalibrated'
    ? 'Complete one non-maximal working exposure.'
    : exposureDateCount < 2
      ? 'Repeat one comparable exposure on another training date.'
      : (rirCoverage ?? 0) < 0.7
        ? 'Record effort on the next comparable working sets.'
        : (qualityCoverage ?? 0) < 0.7
          ? 'Confirm technique and joint response after the next session.'
          : state === 'stale'
            ? 'Use a current working exposure to refresh the old baseline.'
            : comparableExposureDateCount < 3
              ? 'Add another like-for-like exposure before narrowing the target.'
              : 'Keep confirming the estimate as load, setup, and goals change.'

  return {
    exerciseId: input.exercise.id,
    exerciseName: input.exercise.name,
    state,
    evidenceStrength,
    exactSetCount: exact.length,
    exposureDateCount,
    recentSetCount: recent.length,
    latestCompletedAt: latest,
    daysSinceLatest,
    rirCoverage,
    qualityCoverage,
    comparableExposureDateCount,
    recordedAngleContexts,
    sourceSetIds: exact.map((workSet) => workSet.id),
    explanation,
    nextLearningNeed
  }
}

const laneState = (strength: number, hasStaleEvidence = false): CalibrationState => hasStaleEvidence ? 'stale' : stateFrom(clampEvidence(strength), strength ? 0 : null)

export function buildOngoingConfidenceModel(input: {
  strengthAnchorIds: string[]
  exercises: Exercise[]
  history: CompletedSetRecord[]
  sessions: TrainingSession[]
  surveys: SurveyRecord[]
  placementVerifications: PlacementVerificationEvent[]
  missedOpportunityEvents: MissedOpportunityEvent[]
  assessedAt?: string
}): OngoingConfidenceModel {
  const assessedAt = input.assessedAt ?? new Date().toISOString()
  const assessedMs = new Date(assessedAt).getTime()
  const recentStart = assessedMs - CONFIDENCE_RECENT_DAYS * DAY_MS
  const movements = input.strengthAnchorIds.flatMap((exerciseId) => {
    const exercise = input.exercises.find((candidate) => candidate.id === exerciseId)
    return exercise ? [buildMovementCalibrationEvidence({ exercise, history: input.history, assessedAt })] : []
  })
  const mainLiftStrength = movements.length ? Math.round(movements.reduce((total, movement) => total + movement.evidenceStrength, 0) / movements.length) : 0
  const movementState = weakestState(movements.map((movement) => movement.state))

  const recentSessions = input.sessions.filter((session) => {
    const timestamp = new Date(session.plannedDate).getTime()
    return timestamp >= recentStart && timestamp <= assessedMs
  })
  const resolvedSessions = recentSessions.filter((session) => ['completed', 'partial-primary', 'partial-no-primary', 'expired', 'stopped'].includes(session.status))
  const recentMisses = input.missedOpportunityEvents.filter((event) => new Date(event.recordedAt).getTime() >= recentStart && new Date(event.recordedAt).getTime() <= assessedMs)
  const scheduleEvidenceCount = resolvedSessions.length + recentMisses.length
  const scheduleStrength = clampEvidence(
    Number(scheduleEvidenceCount > 0)
    + Number(scheduleEvidenceCount >= 3)
    + Number(scheduleEvidenceCount >= 6)
    + Number(recentMisses.some((event) => event.input.nextMinutes > 0) || resolvedSessions.length >= 6)
    + Number(resolvedSessions.some((session) => Boolean(session.startedAt && session.completedAt)))
  )

  const postSurveys = input.surveys.filter((survey) => survey.type === 'post' && !survey.skipped && new Date(survey.completedAt).getTime() >= recentStart && new Date(survey.completedAt).getTime() <= assessedMs)
  const resolvedRecoveryChecks = input.placementVerifications.filter((event) => event.recoveryResponse !== 'pending' && event.recoveryResponse !== 'skipped')
  const recoverySurveyAnswers = postSurveys.flatMap((survey) => survey.answers.filter((answer) => answer.status === 'answered' && answer.id.toLowerCase().includes('recovery')))
  const recoverySurveyCount = postSurveys.filter((survey) => survey.answers.some((answer) => answer.status === 'answered' && answer.id.toLowerCase().includes('recovery'))).length
  const recoveryEvidenceCount = recoverySurveyCount + resolvedRecoveryChecks.length
  const recoveryStrength = clampEvidence(
    Number(recoveryEvidenceCount > 0)
    + Number(recoveryEvidenceCount >= 2)
    + Number(recoveryEvidenceCount >= 4)
    + Number(recoverySurveyAnswers.length >= 2 || resolvedRecoveryChecks.length >= 1)
    + Number(recoverySurveyAnswers.length >= 4 || resolvedRecoveryChecks.length >= 2)
  )

  const volumeFeedbackSurveys = postSurveys.filter((survey) => survey.answers.some((answer) => answer.status === 'answered' && ['pump', 'targetStimulus', 'endFatigue', 'difficulty', 'recovery'].some((token) => answer.id.includes(token))))
  const recentExposureDates = new Set(input.history.filter((workSet) => new Date(workSet.completedAt).getTime() >= recentStart && new Date(workSet.completedAt).getTime() <= assessedMs).map((workSet) => dateKey(workSet.completedAt))).size
  const volumeEvidenceCount = volumeFeedbackSurveys.length + recentExposureDates
  const volumeStrength = clampEvidence(Number(recentExposureDates > 0) + Number(recentExposureDates >= 3) + Number(recentExposureDates >= 6) + Number(volumeFeedbackSurveys.length >= 2) + Number(volumeFeedbackSurveys.length >= 4))

  const lanes: ConfidenceLane[] = [
    {
      id: 'main-lift-prescriptions', label: 'Main-lift targets', state: movementState, evidenceStrength: mainLiftStrength,
      evidenceCount: movements.reduce((total, movement) => total + movement.exactSetCount, 0),
      explanation: movements.length ? 'Built only from exact completed movement history. One lift cannot lend confidence to another.' : 'No protected main lifts are available to calibrate.',
      nextLearningNeed: movements.sort((a, b) => a.evidenceStrength - b.evidenceStrength)[0]?.nextLearningNeed ?? 'Choose a protected main lift.'
    },
    {
      id: 'schedule-fit', label: 'Schedule fit', state: laneState(scheduleStrength), evidenceStrength: scheduleStrength, evidenceCount: scheduleEvidenceCount,
      explanation: `${resolvedSessions.length} resolved opportunities and ${recentMisses.length} recorded schedule changes inside the recent ${CONFIDENCE_RECENT_DAYS}-day window inform realistic frequency and duration.`,
      nextLearningNeed: scheduleEvidenceCount < 3 ? 'Record what happened at the next few planned opportunities.' : 'Keep recording time constraints when the plan changes.'
    },
    {
      id: 'recovery-response', label: 'Recovery response', state: laneState(recoveryStrength), evidenceStrength: recoveryStrength, evidenceCount: recoveryEvidenceCount,
      explanation: `${recoverySurveyCount} post-session recovery answer${recoverySurveyCount === 1 ? '' : 's'} and ${resolvedRecoveryChecks.length} resolved follow-up check${resolvedRecoveryChecks.length === 1 ? '' : 's'} inform this lane. Check-ins without a recovery answer and skips remain unknown.`,
      nextLearningNeed: recoveryEvidenceCount < 2 ? 'Answer one short post-session or next-day recovery check when convenient.' : 'Confirm whether the next progression recovered as expected.'
    },
    {
      id: 'volume-tolerance', label: 'Volume tolerance', state: laneState(volumeStrength), evidenceStrength: volumeStrength, evidenceCount: volumeEvidenceCount,
      explanation: `${recentExposureDates} completed training date${recentExposureDates === 1 ? '' : 's'} plus ${volumeFeedbackSurveys.length} relevant feedback check${volumeFeedbackSurveys.length === 1 ? '' : 's'} inform recoverable dose. This is a hypothesis, not a fixed personal limit.`,
      nextLearningNeed: volumeFeedbackSurveys.length < 2 ? 'Pair completed volume with brief stimulus and fatigue feedback.' : 'Watch whether the next dose change preserves performance and recovery.'
    }
  ]
  const overall = weakestState(lanes.map((lane) => lane.state))
  const headline = overall === 'well-calibrated' ? 'ForgePath has strong current evidence.' : overall === 'developing' ? 'ForgePath is learning from repeatable patterns.' : overall === 'stale' ? 'Some useful evidence needs a current refresh.' : overall === 'early-evidence' ? 'The model has a starting point, not a verdict.' : 'Calibration begins with the next completed work.'
  const summary = `Confidence is kept separate across ${lanes.length} decisions. Missing answers lower certainty only; they never count as poor readiness, poor recovery, or failed adherence.`

  return {
    ruleVersion: ONGOING_CONFIDENCE_RULE_VERSION,
    assessedAt,
    headline,
    summary,
    movements,
    lanes,
    principles: [
      'Confidence describes ForgePath knowledge, not athlete ability.',
      'Exact exercise and recorded setup outrank neighboring movement history.',
      'Recent completed performance can confirm or contradict a survey.',
      'Context changes create a focused refresh, never a full reset.'
    ]
  }
}
