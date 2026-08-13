import type {
  BodyRegion,
  CompletedSetRecord,
  ContinuityState,
  EquipmentProfile,
  Exercise,
  MissedOpportunityEvent,
  MissedOpportunityInput,
  ReadinessOutcome,
  ScheduleAdaptationChange,
  ScheduleAdaptationMode,
  ScheduleReadinessAction,
  ScheduleReadinessEvidence,
  SchedulePriorityDoseCandidate,
  SchedulePriorityRegionDosePoint,
  SessionStatus,
  SurveyRecord,
  TrainingSession
} from './types'
import { exerciseEquipmentFit } from './equipment-engine'
import { compressSession, readinessFromSurvey } from './training-engine'

export const MISSED_OPPORTUNITY_RULE_VERSION = 'missed-opportunity-v5' as const
export const SCHEDULE_ELIGIBILITY_RULE_VERSION = 'schedule-eligibility-v1' as const
export const SCHEDULE_READINESS_RULE_VERSION = 'schedule-readiness-v1' as const
export const SCHEDULE_PRIORITY_DOSE_RULE_VERSION = 'schedule-priority-dose-v1' as const
export const SCHEDULE_READINESS_FRESH_HOURS = 24
export const SCHEDULE_PRIORITY_DOSE_WINDOW_DAYS = 28
const SUPPORTED_MISSED_OPPORTUNITY_RULE_VERSIONS = ['missed-opportunity-v1', 'missed-opportunity-v2', 'missed-opportunity-v3', 'missed-opportunity-v4', MISSED_OPPORTUNITY_RULE_VERSION] as const

interface ReplanRequest {
  eventId: string
  sessions: TrainingSession[]
  history: CompletedSetRecord[]
  priorEvents: MissedOpportunityEvent[]
  missedSessionId: string
  input: MissedOpportunityInput
  continuity: ContinuityState
  weeklyOpportunities: number
  priorityRegions: BodyRegion[]
  exercises: Exercise[]
  equipmentProfile: EquipmentProfile
  safetyGateActive: boolean
  safetyGateReason?: string
  surveys?: SurveyRecord[]
  recordedAt?: string
}

export type MissedOpportunityReplanResult =
  | { ok: true; sessions: TrainingSession[]; event: MissedOpportunityEvent; continuity: ContinuityState }
  | { ok: false; error: string }

const OPEN_STATUSES: SessionStatus[] = ['planned', 'deferred']
const TERMINAL_STATUSES: SessionStatus[] = ['completed', 'partial-primary', 'partial-no-primary', 'expired', 'stopped']
const PHYSIOLOGICAL_REASONS = new Set(['illness', 'pain'])
const BODY_REGIONS: BodyRegion[] = ['chest', 'back', 'shoulders', 'quadriceps', 'hamstrings', 'glutes', 'biceps', 'triceps', 'forearms', 'calves', 'trunk']

const setCount = (session: TrainingSession) => session.exercises.reduce((total, exercise) => total + exercise.sets.length, 0)

const localDayStart = (value: string) => {
  const date = new Date(value)
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
}

const calendarDaysBetween = (earlier: string, later: string) => Math.max(0, Math.round((localDayStart(later) - localDayStart(earlier)) / 86_400_000))

const withCalendarOffset = (source: string, dayOffset: number) => {
  const date = new Date(source)
  date.setDate(date.getDate() + dayOffset)
  return date.toISOString()
}

const latestExactExposure = (history: CompletedSetRecord[], exerciseId: string) => history
  .filter((workSet) => workSet.exerciseId === exerciseId)
  .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())[0]?.completedAt ?? null

const trimOptionalFatigue = (session: TrainingSession) => ({
  ...session,
  exercises: session.exercises.filter((exercise) => exercise.role !== 'tertiary')
})

const readinessAction = (outcome: ReadinessOutcome): ScheduleReadinessAction => {
  if (outcome === 'pain-aware') return 'blocked'
  if (outcome === 'reacclimate') return 'reacclimation-review'
  if (outcome === 'protect') return 'trim-optional'
  if (outcome === 'confirm') return 'confirm-at-warmup'
  return 'proceed'
}

export function scheduleReadinessEvidence(input: {
  sessionId: string
  surveys: SurveyRecord[]
  continuity: ContinuityState
  recordedAt: string
}): ScheduleReadinessEvidence {
  const latest = input.surveys
    .filter((survey) => survey.sessionId === input.sessionId && survey.type === 'pre')
    .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())[0]
  if (!latest || latest.skipped || (latest.answeredCount ?? latest.answers.filter((answer) => answer.status === 'answered').length) === 0) {
    return {
      ruleVersion: SCHEDULE_READINESS_RULE_VERSION,
      sourceSurveyId: latest?.id ?? null,
      capturedAt: latest?.completedAt ?? null,
      ageHours: latest ? Math.round(((new Date(input.recordedAt).getTime() - new Date(latest.completedAt).getTime()) / 3_600_000) * 10) / 10 : null,
      freshness: 'missing',
      sourceOutcome: null,
      effectiveOutcome: 'unknown',
      action: 'unknown',
      reason: latest ? 'The pre-session check-in was skipped or contained no answered readiness evidence, so readiness remains unknown.' : 'No pre-session readiness check-in was recorded for the missed session, so readiness remains unknown.'
    }
  }
  const ageHours = Math.round(((new Date(input.recordedAt).getTime() - new Date(latest.completedAt).getTime()) / 3_600_000) * 10) / 10
  const sourceOutcome = readinessFromSurvey(latest.answers, input.continuity)
  if (ageHours < 0 || ageHours > SCHEDULE_READINESS_FRESH_HOURS) {
    return {
      ruleVersion: SCHEDULE_READINESS_RULE_VERSION,
      sourceSurveyId: latest.id,
      capturedAt: latest.completedAt,
      ageHours,
      freshness: 'stale',
      sourceOutcome,
      effectiveOutcome: 'unknown',
      action: 'unknown',
      reason: `The latest readiness check-in is outside the ${SCHEDULE_READINESS_FRESH_HOURS}-hour decision window and cannot change the rebuilt plan.`
    }
  }
  const action = readinessAction(sourceOutcome)
  const actionReason: Record<ScheduleReadinessAction, string> = {
    proceed: 'Fresh readiness evidence supports the planned session with normal warm-up confirmation.',
    'confirm-at-warmup': 'Fresh readiness evidence is mixed, so the rebuilt session must be confirmed by the warm-up before progression.',
    'trim-optional': 'Fresh readiness evidence is protective, so optional fatigue is removed without adding work elsewhere.',
    'reacclimation-review': 'Fresh readiness evidence supports a reacclimation review instead of automatic overload.',
    blocked: 'Fresh pain evidence changes what can be trained, so automatic schedule rebuilding is paused for movement review.',
    unknown: 'Readiness remains unknown.'
  }
  return {
    ruleVersion: SCHEDULE_READINESS_RULE_VERSION,
    sourceSurveyId: latest.id,
    capturedAt: latest.completedAt,
    ageHours,
    freshness: 'current',
    sourceOutcome,
    effectiveOutcome: sourceOutcome,
    action,
    reason: actionReason[action]
  }
}

const continuityAfterMiss = (before: ContinuityState, input: MissedOpportunityInput, consecutiveMisses: number, readinessAction?: ScheduleReadinessAction): ContinuityState => {
  if (before === 'returning') return before
  if (readinessAction === 'reacclimation-review') return 'returning'
  if (PHYSIOLOGICAL_REASONS.has(input.reason) && input.constraintState !== 'ended') return 'returning'
  if (consecutiveMisses >= 3) return 'returning'
  if (input.constraintState !== 'ended' || consecutiveMisses >= 2) return 'interrupted'
  return before
}

const modeFor = (input: MissedOpportunityInput, consecutiveMisses: number, readinessAction?: ScheduleReadinessAction): ScheduleAdaptationMode => {
  if (readinessAction === 'reacclimation-review') return 'reacclimation-review'
  if ((PHYSIOLOGICAL_REASONS.has(input.reason) && input.constraintState !== 'ended') || consecutiveMisses >= 3) return 'reacclimation-review'
  if (consecutiveMisses >= 2) return 'rebuild-sequence'
  return 'defer-one'
}

export function scheduleSessionEligibility(session: TrainingSession, exercises: Exercise[], equipmentProfile: EquipmentProfile) {
  const primaryPlan = session.exercises.find((planned) => planned.role === 'primary')
  const primary = primaryPlan ? exercises.find((exercise) => exercise.id === primaryPlan.exerciseId) : undefined
  const primaryFit = primary ? exerciseEquipmentFit(primary, equipmentProfile) : null
  const primaryJointResponse = primary?.jointFeeling ?? null
  const primaryJointBlocked = primaryJointResponse === 'avoid' || primaryJointResponse === 'irritating'
  const removableSupport = session.exercises.flatMap((planned) => {
    if (planned.role === 'primary') return []
    const exercise = exercises.find((candidate) => candidate.id === planned.exerciseId)
    if (!exercise) return [{ plannedExerciseId: planned.id, exerciseName: planned.exerciseId, reason: 'unknown exercise identity' }]
    const fit = exerciseEquipmentFit(exercise, equipmentProfile)
    if (!fit.available) return [{ plannedExerciseId: planned.id, exerciseName: exercise.name, reason: `missing ${fit.missing.join(', ')}` }]
    if (exercise.jointFeeling === 'avoid' || exercise.jointFeeling === 'irritating') return [{ plannedExerciseId: planned.id, exerciseName: exercise.name, reason: `${exercise.jointFeeling} joint response` }]
    if (exercise.disliked) return [{ plannedExerciseId: planned.id, exerciseName: exercise.name, reason: 'athlete marked this movement avoid' }]
    return []
  })
  const eligibleToLead = Boolean(primary && primaryFit?.available && !primaryJointBlocked)
  const reasons = [
    ...(!primary ? ['The protected primary has no known exercise identity.'] : []),
    ...(primaryFit && !primaryFit.available ? [`The protected primary is missing ${primaryFit.missing.join(', ')} at ${equipmentProfile.name}.`] : []),
    ...(primaryJointBlocked ? [`The protected primary is marked ${primaryJointResponse} for joint response and requires movement review.`] : []),
    ...(primary?.disliked ? ['The protected primary is marked avoid. It stays protected until the athlete approves a training-block change.'] : []),
    ...(eligibleToLead && removableSupport.length === 0 ? [`Every planned movement is executable at ${equipmentProfile.name}.`] : []),
    ...(eligibleToLead && removableSupport.length > 0 ? [`The protected primary is executable at ${equipmentProfile.name}; ${removableSupport.length} support movement${removableSupport.length === 1 ? '' : 's'} must be removed or replaced.`] : [])
  ]
  return {
    sessionId: session.id,
    primaryExerciseId: primary?.id ?? null,
    primaryExerciseName: primary?.name ?? null,
    eligibleToLead,
    fullyExecutable: eligibleToLead && removableSupport.length === 0,
    primaryMissingEquipment: primaryFit?.missing ?? [],
    primaryJointResponse,
    supportReviewCount: removableSupport.length,
    reasons,
    removableSupport
  }
}

export function schedulePriorityDoseContext(input: {
  sessions: TrainingSession[]
  history: CompletedSetRecord[]
  exercises: Exercise[]
  equipmentProfile: EquipmentProfile
  priorityRegions: BodyRegion[]
  recordedAt: string
}): {
  windowStartAt: string
  windowEndAt: string
  declaredPriorityRegions: BodyRegion[]
  referenceCompletedSetCount: number
  regions: SchedulePriorityRegionDosePoint[]
  candidates: SchedulePriorityDoseCandidate[]
} {
  const windowEnd = new Date(input.recordedAt)
  const windowStart = new Date(windowEnd.getTime() - SCHEDULE_PRIORITY_DOSE_WINDOW_DAYS * 86_400_000)
  const declaredPriorityRegions = [...new Set(input.priorityRegions)]
  const windowHistory = input.history.filter((workSet) => {
    const completedAt = new Date(workSet.completedAt).getTime()
    return completedAt >= windowStart.getTime() && completedAt <= windowEnd.getTime()
  })
  const sourceByRegion = new Map(declaredPriorityRegions.map((region) => [region, windowHistory.filter((workSet) => workSet.primaryRegion === region)]))
  const referenceCompletedSetCount = Math.max(0, ...[...sourceByRegion.values()].map((sets) => sets.length))
  const regions: SchedulePriorityRegionDosePoint[] = declaredPriorityRegions.map((region) => {
    const sourceSets = sourceByRegion.get(region) ?? []
    const lastCompletedAt = sourceSets.reduce<string | null>((latest, workSet) => !latest || new Date(workSet.completedAt) > new Date(latest) ? workSet.completedAt : latest, null)
    return {
      region,
      completedSetCount: sourceSets.length,
      relativeGapSets: referenceCompletedSetCount - sourceSets.length,
      lastCompletedAt,
      sourceSetIds: sourceSets.map((workSet) => workSet.id)
    }
  })
  const regionById = new Map(regions.map((point) => [point.region, point]))
  const candidates = input.sessions.map((session) => {
    const eligibility = scheduleSessionEligibility(session, input.exercises, input.equipmentProfile)
    const removed = new Set(eligibility.removableSupport.map((item) => item.plannedExerciseId))
    const executablePriorityWork = session.exercises.flatMap((planned) => {
      if (removed.has(planned.id)) return []
      const exercise = input.exercises.find((candidate) => candidate.id === planned.exerciseId)
      return exercise && declaredPriorityRegions.includes(exercise.primaryRegion) ? [{ region: exercise.primaryRegion, sets: planned.sets.length }] : []
    })
    const coveredPriorityRegions = [...new Set(executablePriorityWork.map((item) => item.region))]
    const relativeGapScore = Math.max(0, ...coveredPriorityRegions.map((region) => regionById.get(region)?.relativeGapSets ?? 0))
    return {
      sessionId: session.id,
      coveredPriorityRegions,
      largestGapRegions: relativeGapScore > 0 ? coveredPriorityRegions.filter((region) => regionById.get(region)?.relativeGapSets === relativeGapScore) : [],
      relativeGapScore,
      executablePlannedSetCount: executablePriorityWork.reduce((total, item) => total + item.sets, 0)
    }
  })
  return {
    windowStartAt: windowStart.toISOString(),
    windowEndAt: windowEnd.toISOString(),
    declaredPriorityRegions,
    referenceCompletedSetCount,
    regions,
    candidates
  }
}

export function buildMissedOpportunityReplan(request: ReplanRequest): MissedOpportunityReplanResult {
  const recordedAt = request.recordedAt ?? new Date().toISOString()
  if (request.safetyGateActive) return { ok: false, error: request.safetyGateReason ?? 'Automatic schedule rebuilding is paused until the active pain or restriction review is resolved.' }
  const readiness = scheduleReadinessEvidence({ sessionId: request.missedSessionId, surveys: request.surveys ?? [], continuity: request.continuity, recordedAt })
  if (readiness.action === 'blocked') return { ok: false, error: `${readiness.reason} Reassess before rebuilding. This is not medical clearance.` }
  const missed = request.sessions.find((session) => session.id === request.missedSessionId)
  if (!missed) return { ok: false, error: 'That planned opportunity no longer exists.' }
  if (!OPEN_STATUSES.includes(missed.status)) return { ok: false, error: 'Only an unstarted planned or deferred opportunity can be marked missed.' }
  if (!Number.isFinite(request.input.nextMinutes) || request.input.nextMinutes < 15 || request.input.nextMinutes > 90) return { ok: false, error: 'Choose a realistic next session length from 15 to 90 minutes.' }
  if (Number.isNaN(new Date(request.input.nextOpportunityAt).getTime())) return { ok: false, error: 'Choose a valid next opportunity date.' }
  if (localDayStart(request.input.nextOpportunityAt) < localDayStart(recordedAt)) return { ok: false, error: 'The next opportunity cannot be before this check-in.' }
  if (request.input.note.length > 500) return { ok: false, error: 'Keep the optional context under 500 characters.' }

  const queueBeforeSessions = request.sessions.filter((session) => OPEN_STATUSES.includes(session.status))
  if (!queueBeforeSessions.length) return { ok: false, error: 'There is no open exposure queue to rebuild.' }
  if (request.input.preferredNextSessionId && !queueBeforeSessions.some((session) => session.id === request.input.preferredNextSessionId)) return { ok: false, error: 'The preferred next session is no longer in the open queue.' }
  const eligibilityBySession = new Map(queueBeforeSessions.map((session) => [session.id, scheduleSessionEligibility(session, request.exercises, request.equipmentProfile)]))
  const priorityDoseContext = schedulePriorityDoseContext({ sessions: queueBeforeSessions, history: request.history, exercises: request.exercises, equipmentProfile: request.equipmentProfile, priorityRegions: request.priorityRegions, recordedAt })
  const priorityDoseBySession = new Map(priorityDoseContext.candidates.map((candidate) => [candidate.sessionId, candidate]))
  const preferredEligibility = request.input.preferredNextSessionId ? eligibilityBySession.get(request.input.preferredNextSessionId) : null
  if (preferredEligibility && !preferredEligibility.eligibleToLead) return { ok: false, error: `${preferredEligibility.primaryExerciseName ?? 'That session'} cannot lead at ${request.equipmentProfile.name}. ${preferredEligibility.reasons.join(' ')}` }
  if (![...eligibilityBySession.values()].some((eligibility) => eligibility.eligibleToLead)) return { ok: false, error: `No open session has an executable protected primary at ${request.equipmentProfile.name}. Change the location or review substitutions before rebuilding.` }
  const lastCompletedAt = request.history.reduce<string | null>((latest, workSet) => !latest || new Date(workSet.completedAt) > new Date(latest) ? workSet.completedAt : latest, null)
  const relevantPriorMisses = request.priorEvents.filter((event) => (!lastCompletedAt || new Date(event.recordedAt) > new Date(lastCompletedAt)) && event.mesocycleId === (missed.mesocycleId ?? null))
  const consecutiveMisses = relevantPriorMisses.length + 1
  const mode = modeFor(request.input, consecutiveMisses, readiness.action)
  const continuity = continuityAfterMiss(request.continuity, request.input, consecutiveMisses, readiness.action)

  const ranked = queueBeforeSessions.map((session, originalIndex) => {
    const primaryExerciseId = session.exercises.find((exercise) => exercise.role === 'primary')?.exerciseId ?? null
    const lastExposureAt = primaryExerciseId ? latestExactExposure(request.history, primaryExerciseId) : null
    const daysSinceExposure = lastExposureAt ? calendarDaysBetween(lastExposureAt, recordedAt) : null
    return { session, originalIndex, primaryExerciseId, lastExposureAt, daysSinceExposure, eligibility: eligibilityBySession.get(session.id)!, priorityDose: priorityDoseBySession.get(session.id)! }
  }).sort((a, b) => {
    const aPinned = a.session.id === request.input.preferredNextSessionId ? 1 : 0
    const bPinned = b.session.id === request.input.preferredNextSessionId ? 1 : 0
    const aPriority = a.daysSinceExposure ?? 10_000
    const bPriority = b.daysSinceExposure ?? 10_000
    return bPinned - aPinned
      || Number(b.eligibility.eligibleToLead) - Number(a.eligibility.eligibleToLead)
      || Number(b.eligibility.fullyExecutable) - Number(a.eligibility.fullyExecutable)
      || bPriority - aPriority
      || b.priorityDose.relativeGapScore - a.priorityDose.relativeGapScore
      || new Date(a.session.plannedDate).getTime() - new Date(b.session.plannedDate).getTime()
      || a.originalIndex - b.originalIndex
  })

  const baselineNext = [...ranked].sort((a, b) => {
    const aPinned = a.session.id === request.input.preferredNextSessionId ? 1 : 0
    const bPinned = b.session.id === request.input.preferredNextSessionId ? 1 : 0
    const aPriority = a.daysSinceExposure ?? 10_000
    const bPriority = b.daysSinceExposure ?? 10_000
    return bPinned - aPinned
      || Number(b.eligibility.eligibleToLead) - Number(a.eligibility.eligibleToLead)
      || Number(b.eligibility.fullyExecutable) - Number(a.eligibility.fullyExecutable)
      || bPriority - aPriority
      || new Date(a.session.plannedDate).getTime() - new Date(b.session.plannedDate).getTime()
      || a.originalIndex - b.originalIndex
  })[0]

  const spacingDays = Math.max(1, Math.round(7 / Math.max(1, request.weeklyOpportunities)))
  const nextOpportunityAt = new Date(request.input.nextOpportunityAt).toISOString()
  const selectedEligibility = ranked[0].eligibility
  const adaptedQueue = ranked.map((candidate, index) => {
    const isMissed = candidate.session.id === request.missedSessionId
    const plannedDate = withCalendarOffset(nextOpportunityAt, index * spacingDays)
    let adapted: TrainingSession = {
      ...candidate.session,
      plannedDate,
      status: isMissed ? 'planned' : candidate.session.status,
      dayLabel: index === 0 ? 'Next best session · rebuilt' : candidate.session.dayLabel
    }
    if (index === 0 && selectedEligibility.removableSupport.length) {
      const removed = new Set(selectedEligibility.removableSupport.map((item) => item.plannedExerciseId))
      adapted = { ...adapted, exercises: adapted.exercises.filter((exercise) => !removed.has(exercise.id)) }
    }
    if (index === 0) adapted = compressSession(adapted, request.input.nextMinutes)
    if (index === 0 && (mode !== 'defer-one' || request.input.constraintState !== 'ended' || readiness.action === 'trim-optional' || readiness.action === 'reacclimation-review')) adapted = trimOptionalFatigue(adapted)
    return adapted
  })

  const adaptedById = new Map(adaptedQueue.map((session) => [session.id, session]))
  const adaptedIterator = adaptedQueue[Symbol.iterator]()
  const sessions = request.sessions.map((session) => OPEN_STATUSES.includes(session.status) ? adaptedIterator.next().value ?? session : session)
  const changes: ScheduleAdaptationChange[] = queueBeforeSessions.map((before) => {
    const after = adaptedById.get(before.id)!
    return {
      sessionId: before.id,
      fromPlannedAt: before.plannedDate,
      toPlannedAt: after.plannedDate,
      fromStatus: before.status,
      toStatus: after.status,
      fromDurationMinutes: before.durationMinutes,
      toDurationMinutes: after.durationMinutes,
      fromSetCount: setCount(before),
      toSetCount: setCount(after)
    }
  })
  const next = ranked[0]
  const selectedPriorityDose = next.priorityDose
  const doseAppliedAsTieBreak = !request.input.preferredNextSessionId && baselineNext.session.id !== next.session.id
  const doseReason = priorityDoseContext.declaredPriorityRegions.length === 0
    ? 'No priority regions are declared, so region dose did not affect this schedule decision.'
    : priorityDoseContext.referenceCompletedSetCount === 0
      ? `No completed priority-region sets exist inside the rolling ${SCHEDULE_PRIORITY_DOSE_WINDOW_DAYS}-day window, so no relative dose gap was inferred.`
      : doseAppliedAsTieBreak
        ? `${selectedPriorityDose.largestGapRegions.join(', ')} had ${selectedPriorityDose.relativeGapScore} fewer completed set${selectedPriorityDose.relativeGapScore === 1 ? '' : 's'} than the most represented declared priority region inside the rolling ${SCHEDULE_PRIORITY_DOSE_WINDOW_DAYS}-day window, resolving an otherwise equal queue choice.`
        : `Rolling ${SCHEDULE_PRIORITY_DOSE_WINDOW_DAYS}-day priority-region dose was reviewed but did not override equipment eligibility, athlete control, or exact-primary exposure priority.`
  const openSetCountBefore = queueBeforeSessions.reduce((total, session) => total + setCount(session), 0)
  const openSetCountAfter = adaptedQueue.reduce((total, session) => total + setCount(session), 0)
  const reasons = [
    ...(request.input.preferredNextSessionId ? [`The athlete pinned ${next.session.title} as the next session; exact-exposure recency still orders the remaining queue.`] : []),
    `${next.session.title} has an executable protected primary at ${request.equipmentProfile.name}.`,
    ...(selectedEligibility.removableSupport.length ? [`${selectedEligibility.removableSupport.length} unavailable or joint-flagged support movement${selectedEligibility.removableSupport.length === 1 ? ' was' : 's were'} removed from the first session instead of creating impossible work.`] : []),
    readiness.reason,
    doseReason,
    next.daysSinceExposure === null
      ? 'The next protected primary has no completed exact exposure, so its baseline remains unresolved.'
      : `The next protected primary has waited ${next.daysSinceExposure} calendar day${next.daysSinceExposure === 1 ? '' : 's'} since its latest completed exact exposure.`,
    `The first rebuilt session fits the declared ${request.input.nextMinutes}-minute opportunity.`,
    mode === 'defer-one'
      ? 'One missed opportunity was deferred without increasing any target.'
      : mode === 'rebuild-sequence'
        ? 'Repeated missed opportunities rebuilt the open sequence and removed optional fatigue from the next session.'
        : 'The interruption or health-related constraint makes prior capacity less certain, so continuity now requires a reacclimation review.',
    request.input.trainingOutcome === 'different-training-unlogged'
      ? 'Reported training without completed set records earns no progression until it is logged or imported.'
      : 'No completed work was reported, so no exposure or progression credit was awarded.'
  ]

  const event: MissedOpportunityEvent = {
    id: request.eventId,
    ruleVersion: MISSED_OPPORTUNITY_RULE_VERSION,
    sessionId: missed.id,
    mesocycleId: missed.mesocycleId ?? null,
    planVersion: missed.planVersion ?? null,
    recordedAt,
    plannedAt: missed.plannedDate,
    priorStatus: missed.status,
    input: { ...request.input, preferredNextSessionId: request.input.preferredNextSessionId ?? null, note: request.input.note.trim() },
    continuityBefore: request.continuity,
    continuityAfter: continuity,
    consecutiveMisses,
    mode,
    queueBefore: queueBeforeSessions.map((session) => session.id),
    queueAfter: adaptedQueue.map((session) => session.id),
    nextSessionId: next.session.id,
    nextPrimaryExerciseId: next.primaryExerciseId,
    nextPrimaryLastExposureAt: next.lastExposureAt,
    nextPrimaryDaysSinceExposure: next.daysSinceExposure,
    reasons,
    changes,
    preservedTerminalSessionIds: request.sessions.filter((session) => TERMINAL_STATUSES.includes(session.status)).map((session) => session.id),
    completedSetCountBefore: request.history.length,
    completedSetCountAfter: request.history.length,
    openSetCountBefore,
    openSetCountAfter,
    eligibility: {
      ruleVersion: SCHEDULE_ELIGIBILITY_RULE_VERSION,
      equipmentProfileId: request.equipmentProfile.id,
      equipmentProfileName: request.equipmentProfile.name,
      equipmentProfileUpdatedAt: request.equipmentProfile.updatedAt,
      safetyGateState: 'clear',
      candidates: queueBeforeSessions.map((session) => {
        const eligibility = eligibilityBySession.get(session.id)!
        return {
          sessionId: eligibility.sessionId,
          primaryExerciseId: eligibility.primaryExerciseId,
          primaryExerciseName: eligibility.primaryExerciseName,
          eligibleToLead: eligibility.eligibleToLead,
          fullyExecutable: eligibility.fullyExecutable,
          primaryMissingEquipment: eligibility.primaryMissingEquipment,
          primaryJointResponse: eligibility.primaryJointResponse,
          supportReviewCount: eligibility.supportReviewCount,
          reasons: eligibility.reasons
        }
      }),
      removedPlannedExerciseIds: selectedEligibility.removableSupport.map((item) => item.plannedExerciseId),
      removedExerciseNames: selectedEligibility.removableSupport.map((item) => item.exerciseName)
    },
    readiness,
    priorityDose: {
      ruleVersion: SCHEDULE_PRIORITY_DOSE_RULE_VERSION,
      windowDays: SCHEDULE_PRIORITY_DOSE_WINDOW_DAYS,
      ...priorityDoseContext,
      selectedSessionId: next.session.id,
      selectedGapScore: selectedPriorityDose.relativeGapScore,
      selectedGapRegions: selectedPriorityDose.largestGapRegions,
      appliedAsTieBreak: doseAppliedAsTieBreak,
      reason: doseReason
    }
  }

  return { ok: true, sessions, event, continuity }
}

export function missedOpportunityEventError(value: unknown, sessions: TrainingSession[]): string | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return 'Missed-opportunity evidence is not an object.'
  const event = value as Partial<MissedOpportunityEvent>
  const sessionIds = new Set(sessions.map((session) => session.id))
  if (!SUPPORTED_MISSED_OPPORTUNITY_RULE_VERSIONS.includes(event.ruleVersion as typeof SUPPORTED_MISSED_OPPORTUNITY_RULE_VERSIONS[number])) return 'Missed-opportunity rule version is invalid.'
  if (typeof event.id !== 'string' || !event.id) return 'Missed-opportunity ID is missing.'
  if (typeof event.sessionId !== 'string' || !sessionIds.has(event.sessionId)) return 'Missed opportunity references an unknown session.'
  if (typeof event.nextSessionId !== 'string' || !sessionIds.has(event.nextSessionId)) return 'Missed opportunity references an unknown next session.'
  if (!event.input || !['family', 'work', 'time', 'travel', 'sleep', 'illness', 'pain', 'equipment', 'motivation', 'other'].includes(event.input.reason)) return 'Missed-opportunity reason is invalid.'
  if (!event.input || !['no-training', 'different-training-unlogged'].includes(event.input.trainingOutcome)) return 'Missed-opportunity training outcome is invalid.'
  if (!event.input || !['ended', 'continuing', 'uncertain'].includes(event.input.constraintState)) return 'Missed-opportunity constraint state is invalid.'
  if (['missed-opportunity-v2', 'missed-opportunity-v3', 'missed-opportunity-v4', MISSED_OPPORTUNITY_RULE_VERSION].includes(String(event.ruleVersion)) && event.input?.preferredNextSessionId === undefined) return 'Missed-opportunity preference evidence is missing.'
  if (event.input?.preferredNextSessionId !== undefined && event.input.preferredNextSessionId !== null && (typeof event.input.preferredNextSessionId !== 'string' || !sessionIds.has(event.input.preferredNextSessionId))) return 'Missed-opportunity preferred session is invalid.'
  if (!event.input || Number.isNaN(new Date(event.input.nextOpportunityAt).getTime()) || !Number.isFinite(event.input.nextMinutes) || event.input.nextMinutes < 15 || event.input.nextMinutes > 90 || typeof event.input.note !== 'string' || event.input.note.length > 500) return 'Missed-opportunity next-step input is invalid.'
  if (!event.recordedAt || Number.isNaN(new Date(event.recordedAt).getTime()) || !event.plannedAt || Number.isNaN(new Date(event.plannedAt).getTime())) return 'Missed-opportunity dates are invalid.'
  if (!['planned', 'deferred'].includes(String(event.priorStatus))) return 'Missed-opportunity prior status is invalid.'
  if (!['stable', 'interrupted', 'returning'].includes(String(event.continuityBefore)) || !['stable', 'interrupted', 'returning'].includes(String(event.continuityAfter))) return 'Missed-opportunity continuity evidence is invalid.'
  if (!['defer-one', 'rebuild-sequence', 'reacclimation-review'].includes(String(event.mode)) || !Number.isInteger(event.consecutiveMisses) || Number(event.consecutiveMisses) < 1) return 'Missed-opportunity decision mode is invalid.'
  if (![event.queueBefore, event.queueAfter, event.reasons, event.changes, event.preservedTerminalSessionIds].every(Array.isArray)) return 'Missed-opportunity replay evidence is incomplete.'
  if ([...(event.queueBefore ?? []), ...(event.queueAfter ?? []), ...(event.preservedTerminalSessionIds ?? [])].some((id) => typeof id !== 'string' || !sessionIds.has(id))) return 'Missed-opportunity queue references an unknown session.'
  if (event.input?.preferredNextSessionId && (!(event.queueBefore ?? []).includes(event.input.preferredNextSessionId) || event.nextSessionId !== event.input.preferredNextSessionId)) return 'Missed-opportunity preferred session was not honored.'
  if (['missed-opportunity-v3', 'missed-opportunity-v4', MISSED_OPPORTUNITY_RULE_VERSION].includes(String(event.ruleVersion))) {
    const eligibility = event.eligibility
    if (!eligibility || eligibility.ruleVersion !== SCHEDULE_ELIGIBILITY_RULE_VERSION || typeof eligibility.equipmentProfileId !== 'string' || !eligibility.equipmentProfileId || typeof eligibility.equipmentProfileName !== 'string' || !eligibility.equipmentProfileName || Number.isNaN(new Date(eligibility.equipmentProfileUpdatedAt).getTime()) || eligibility.safetyGateState !== 'clear') return 'Missed-opportunity eligibility evidence is invalid.'
    if (!Array.isArray(eligibility.candidates) || !Array.isArray(eligibility.removedPlannedExerciseIds) || !Array.isArray(eligibility.removedExerciseNames)) return 'Missed-opportunity eligibility replay is incomplete.'
    const candidateIds = eligibility.candidates.map((candidate) => candidate.sessionId)
    if (eligibility.candidates.length !== event.queueBefore?.length || new Set(candidateIds).size !== eligibility.candidates.length || candidateIds.some((sessionId) => !(event.queueBefore ?? []).includes(sessionId)) || eligibility.candidates.some((candidate) => !sessionIds.has(candidate.sessionId) || typeof candidate.eligibleToLead !== 'boolean' || typeof candidate.fullyExecutable !== 'boolean' || (candidate.fullyExecutable && !candidate.eligibleToLead) || !Array.isArray(candidate.primaryMissingEquipment) || candidate.primaryMissingEquipment.some((item) => typeof item !== 'string') || !Array.isArray(candidate.reasons) || candidate.reasons.some((reason) => typeof reason !== 'string') || !['great', 'good', 'neutral', 'irritating', 'avoid', null].includes(candidate.primaryJointResponse) || !Number.isInteger(candidate.supportReviewCount) || candidate.supportReviewCount < 0)) return 'Missed-opportunity candidate eligibility is invalid.'
    if (!eligibility.candidates.find((candidate) => candidate.sessionId === event.nextSessionId)?.eligibleToLead) return 'Missed-opportunity next session was not eligible to lead.'
    if (eligibility.removedPlannedExerciseIds.length !== eligibility.removedExerciseNames.length || eligibility.removedPlannedExerciseIds.some((id) => typeof id !== 'string') || eligibility.removedExerciseNames.some((name) => typeof name !== 'string')) return 'Missed-opportunity removed-movement evidence is invalid.'
  }
  if (['missed-opportunity-v4', MISSED_OPPORTUNITY_RULE_VERSION].includes(String(event.ruleVersion))) {
    const readiness = event.readiness
    if (!readiness || readiness.ruleVersion !== SCHEDULE_READINESS_RULE_VERSION || !['current', 'stale', 'missing'].includes(String(readiness.freshness)) || !['normal', 'confirm', 'protect', 'reacclimate', 'pain-aware', 'unknown'].includes(String(readiness.effectiveOutcome)) || !(readiness.sourceOutcome === null || ['normal', 'confirm', 'protect', 'reacclimate', 'pain-aware'].includes(String(readiness.sourceOutcome))) || !['proceed', 'confirm-at-warmup', 'trim-optional', 'reacclimation-review', 'blocked', 'unknown'].includes(String(readiness.action)) || typeof readiness.reason !== 'string' || !readiness.reason || !(readiness.sourceSurveyId === null || typeof readiness.sourceSurveyId === 'string') || !(readiness.capturedAt === null || !Number.isNaN(new Date(readiness.capturedAt).getTime())) || !(readiness.ageHours === null || Number.isFinite(readiness.ageHours))) return 'Missed-opportunity readiness evidence is invalid.'
    if (readiness.action === 'blocked' || (readiness.freshness === 'current' && readiness.effectiveOutcome === 'unknown') || (readiness.freshness !== 'current' && (readiness.effectiveOutcome !== 'unknown' || readiness.action !== 'unknown'))) return 'Missed-opportunity readiness decision is invalid.'
    if (readiness.freshness === 'current' && (!readiness.sourceSurveyId || !readiness.capturedAt || readiness.ageHours === null || readiness.ageHours < 0 || readiness.ageHours > SCHEDULE_READINESS_FRESH_HOURS)) return 'Missed-opportunity current readiness freshness is invalid.'
    if (readiness.freshness === 'stale' && (!readiness.sourceSurveyId || !readiness.capturedAt || readiness.ageHours === null || (readiness.ageHours >= 0 && readiness.ageHours <= SCHEDULE_READINESS_FRESH_HOURS))) return 'Missed-opportunity stale readiness freshness is invalid.'
    if (readiness.freshness === 'missing' && readiness.sourceOutcome !== null) return 'Missed-opportunity missing readiness cannot contain an outcome.'
    const expectedAction = readiness.sourceOutcome ? readinessAction(readiness.sourceOutcome) : 'unknown'
    if (readiness.freshness === 'current' && (readiness.effectiveOutcome !== readiness.sourceOutcome || readiness.action !== expectedAction)) return 'Missed-opportunity readiness action does not match its source evidence.'
  }
  if (event.ruleVersion === MISSED_OPPORTUNITY_RULE_VERSION) {
    const dose = event.priorityDose
    if (!dose || dose.ruleVersion !== SCHEDULE_PRIORITY_DOSE_RULE_VERSION || dose.windowDays !== SCHEDULE_PRIORITY_DOSE_WINDOW_DAYS || Number.isNaN(new Date(dose.windowStartAt).getTime()) || Number.isNaN(new Date(dose.windowEndAt).getTime()) || new Date(dose.windowStartAt).getTime() >= new Date(dose.windowEndAt).getTime() || dose.windowEndAt !== event.recordedAt || new Date(dose.windowEndAt).getTime() - new Date(dose.windowStartAt).getTime() !== SCHEDULE_PRIORITY_DOSE_WINDOW_DAYS * 86_400_000 || !Array.isArray(dose.declaredPriorityRegions) || new Set(dose.declaredPriorityRegions).size !== dose.declaredPriorityRegions.length || dose.declaredPriorityRegions.some((region) => !BODY_REGIONS.includes(region)) || !Number.isInteger(dose.referenceCompletedSetCount) || dose.referenceCompletedSetCount < 0 || !Array.isArray(dose.regions) || !Array.isArray(dose.candidates) || typeof dose.appliedAsTieBreak !== 'boolean' || typeof dose.reason !== 'string' || !dose.reason) return 'Missed-opportunity priority-dose evidence is invalid.'
    if (dose.regions.length !== dose.declaredPriorityRegions.length || new Set(dose.regions.map((point) => point.region)).size !== dose.regions.length || dose.regions.some((point) => !dose.declaredPriorityRegions.includes(point.region) || !Number.isInteger(point.completedSetCount) || point.completedSetCount < 0 || !Number.isInteger(point.relativeGapSets) || point.relativeGapSets < 0 || point.relativeGapSets !== dose.referenceCompletedSetCount - point.completedSetCount || !(point.lastCompletedAt === null || !Number.isNaN(new Date(point.lastCompletedAt).getTime())) || !Array.isArray(point.sourceSetIds) || point.sourceSetIds.length !== point.completedSetCount || new Set(point.sourceSetIds).size !== point.sourceSetIds.length || point.sourceSetIds.some((id) => typeof id !== 'string'))) return 'Missed-opportunity priority-region dose is invalid.'
    if (dose.referenceCompletedSetCount !== Math.max(0, ...dose.regions.map((point) => point.completedSetCount))) return 'Missed-opportunity priority-dose reference is invalid.'
    const regionGap = new Map(dose.regions.map((point) => [point.region, point.relativeGapSets]))
    if (dose.candidates.length !== event.queueBefore?.length || new Set(dose.candidates.map((candidate) => candidate.sessionId)).size !== dose.candidates.length || dose.candidates.some((candidate) => !sessionIds.has(candidate.sessionId) || !(event.queueBefore ?? []).includes(candidate.sessionId) || !Array.isArray(candidate.coveredPriorityRegions) || new Set(candidate.coveredPriorityRegions).size !== candidate.coveredPriorityRegions.length || candidate.coveredPriorityRegions.some((region) => !dose.declaredPriorityRegions.includes(region)) || !Array.isArray(candidate.largestGapRegions) || new Set(candidate.largestGapRegions).size !== candidate.largestGapRegions.length || candidate.largestGapRegions.some((region) => !candidate.coveredPriorityRegions.includes(region)) || !Number.isInteger(candidate.relativeGapScore) || candidate.relativeGapScore < 0 || !Number.isInteger(candidate.executablePlannedSetCount) || candidate.executablePlannedSetCount < 0 || candidate.relativeGapScore !== Math.max(0, ...candidate.coveredPriorityRegions.map((region) => regionGap.get(region) ?? 0)) || candidate.largestGapRegions.some((region) => regionGap.get(region) !== candidate.relativeGapScore) || (candidate.relativeGapScore === 0 && candidate.largestGapRegions.length > 0))) return 'Missed-opportunity priority-dose candidate is invalid.'
    if (dose.candidates.some((candidate) => candidate.largestGapRegions.join('|') !== (candidate.relativeGapScore > 0 ? candidate.coveredPriorityRegions.filter((region) => regionGap.get(region) === candidate.relativeGapScore) : []).join('|'))) return 'Missed-opportunity priority-dose candidate gaps are incomplete.'
    const selected = dose.candidates.find((candidate) => candidate.sessionId === event.nextSessionId)
    if (!selected || dose.selectedSessionId !== event.nextSessionId || dose.selectedGapScore !== selected.relativeGapScore || !Array.isArray(dose.selectedGapRegions) || dose.selectedGapRegions.length !== selected.largestGapRegions.length || dose.selectedGapRegions.some((region, index) => region !== selected.largestGapRegions[index]) || (event.input?.preferredNextSessionId && dose.appliedAsTieBreak)) return 'Missed-opportunity selected priority-dose evidence is invalid.'
  }
  if ((event.changes ?? []).some((change) => !change || typeof change !== 'object' || !sessionIds.has(change.sessionId) || Number.isNaN(new Date(change.fromPlannedAt).getTime()) || Number.isNaN(new Date(change.toPlannedAt).getTime()) || !Number.isFinite(change.fromSetCount) || !Number.isFinite(change.toSetCount))) return 'Missed-opportunity session changes are invalid.'
  if (event.completedSetCountBefore !== event.completedSetCountAfter) return 'Missed-opportunity evidence cannot create or remove completed sets.'
  if (!Number.isFinite(event.openSetCountBefore) || !Number.isFinite(event.openSetCountAfter) || Number(event.openSetCountAfter) > Number(event.openSetCountBefore)) return 'Missed-opportunity evidence contains catch-up volume.'
  return null
}
