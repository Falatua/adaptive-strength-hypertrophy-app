import type {
  CompletedSetRecord,
  ContinuityState,
  MissedOpportunityEvent,
  MissedOpportunityInput,
  ScheduleAdaptationChange,
  ScheduleAdaptationMode,
  SessionStatus,
  TrainingSession
} from './types'
import { compressSession } from './training-engine'

export const MISSED_OPPORTUNITY_RULE_VERSION = 'missed-opportunity-v1' as const

interface ReplanRequest {
  eventId: string
  sessions: TrainingSession[]
  history: CompletedSetRecord[]
  priorEvents: MissedOpportunityEvent[]
  missedSessionId: string
  input: MissedOpportunityInput
  continuity: ContinuityState
  weeklyOpportunities: number
  recordedAt?: string
}

export type MissedOpportunityReplanResult =
  | { ok: true; sessions: TrainingSession[]; event: MissedOpportunityEvent; continuity: ContinuityState }
  | { ok: false; error: string }

const OPEN_STATUSES: SessionStatus[] = ['planned', 'deferred']
const TERMINAL_STATUSES: SessionStatus[] = ['completed', 'partial-primary', 'partial-no-primary', 'expired', 'stopped']
const PHYSIOLOGICAL_REASONS = new Set(['illness', 'pain'])

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
  exercises: session.exercises.filter((exercise) => exercise.role !== 'optional')
})

const continuityAfterMiss = (before: ContinuityState, input: MissedOpportunityInput, consecutiveMisses: number): ContinuityState => {
  if (before === 'returning') return before
  if (PHYSIOLOGICAL_REASONS.has(input.reason) && input.constraintState !== 'ended') return 'returning'
  if (consecutiveMisses >= 3) return 'returning'
  if (input.constraintState !== 'ended' || consecutiveMisses >= 2) return 'interrupted'
  return before
}

const modeFor = (input: MissedOpportunityInput, consecutiveMisses: number): ScheduleAdaptationMode => {
  if ((PHYSIOLOGICAL_REASONS.has(input.reason) && input.constraintState !== 'ended') || consecutiveMisses >= 3) return 'reacclimation-review'
  if (consecutiveMisses >= 2) return 'rebuild-sequence'
  return 'defer-one'
}

export function buildMissedOpportunityReplan(request: ReplanRequest): MissedOpportunityReplanResult {
  const recordedAt = request.recordedAt ?? new Date().toISOString()
  const missed = request.sessions.find((session) => session.id === request.missedSessionId)
  if (!missed) return { ok: false, error: 'That planned opportunity no longer exists.' }
  if (!OPEN_STATUSES.includes(missed.status)) return { ok: false, error: 'Only an unstarted planned or deferred opportunity can be marked missed.' }
  if (!Number.isFinite(request.input.nextMinutes) || request.input.nextMinutes < 15 || request.input.nextMinutes > 90) return { ok: false, error: 'Choose a realistic next session length from 15 to 90 minutes.' }
  if (Number.isNaN(new Date(request.input.nextOpportunityAt).getTime())) return { ok: false, error: 'Choose a valid next opportunity date.' }
  if (localDayStart(request.input.nextOpportunityAt) < localDayStart(recordedAt)) return { ok: false, error: 'The next opportunity cannot be before this check-in.' }
  if (request.input.note.length > 500) return { ok: false, error: 'Keep the optional context under 500 characters.' }

  const queueBeforeSessions = request.sessions.filter((session) => OPEN_STATUSES.includes(session.status))
  if (!queueBeforeSessions.length) return { ok: false, error: 'There is no open exposure queue to rebuild.' }
  const lastCompletedAt = request.history.reduce<string | null>((latest, workSet) => !latest || new Date(workSet.completedAt) > new Date(latest) ? workSet.completedAt : latest, null)
  const relevantPriorMisses = request.priorEvents.filter((event) => (!lastCompletedAt || new Date(event.recordedAt) > new Date(lastCompletedAt)) && event.mesocycleId === (missed.mesocycleId ?? null))
  const consecutiveMisses = relevantPriorMisses.length + 1
  const mode = modeFor(request.input, consecutiveMisses)
  const continuity = continuityAfterMiss(request.continuity, request.input, consecutiveMisses)

  const ranked = queueBeforeSessions.map((session, originalIndex) => {
    const primaryExerciseId = session.exercises.find((exercise) => exercise.role === 'primary')?.exerciseId ?? null
    const lastExposureAt = primaryExerciseId ? latestExactExposure(request.history, primaryExerciseId) : null
    const daysSinceExposure = lastExposureAt ? calendarDaysBetween(lastExposureAt, recordedAt) : null
    return { session, originalIndex, primaryExerciseId, lastExposureAt, daysSinceExposure }
  }).sort((a, b) => {
    const aPriority = a.daysSinceExposure ?? 10_000
    const bPriority = b.daysSinceExposure ?? 10_000
    return bPriority - aPriority
      || new Date(a.session.plannedDate).getTime() - new Date(b.session.plannedDate).getTime()
      || a.originalIndex - b.originalIndex
  })

  const spacingDays = Math.max(1, Math.round(7 / Math.max(1, request.weeklyOpportunities)))
  const nextOpportunityAt = new Date(request.input.nextOpportunityAt).toISOString()
  const adaptedQueue = ranked.map((candidate, index) => {
    const isMissed = candidate.session.id === request.missedSessionId
    const plannedDate = withCalendarOffset(nextOpportunityAt, index * spacingDays)
    let adapted: TrainingSession = {
      ...candidate.session,
      plannedDate,
      status: isMissed ? 'planned' : candidate.session.status,
      dayLabel: index === 0 ? 'Next best session · rebuilt' : candidate.session.dayLabel
    }
    if (index === 0) adapted = compressSession(adapted, request.input.nextMinutes)
    if (index === 0 && (mode !== 'defer-one' || request.input.constraintState !== 'ended')) adapted = trimOptionalFatigue(adapted)
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
  const openSetCountBefore = queueBeforeSessions.reduce((total, session) => total + setCount(session), 0)
  const openSetCountAfter = adaptedQueue.reduce((total, session) => total + setCount(session), 0)
  const reasons = [
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
    input: { ...request.input, note: request.input.note.trim() },
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
    openSetCountAfter
  }

  return { ok: true, sessions, event, continuity }
}

export function missedOpportunityEventError(value: unknown, sessions: TrainingSession[]): string | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return 'Missed-opportunity evidence is not an object.'
  const event = value as Partial<MissedOpportunityEvent>
  const sessionIds = new Set(sessions.map((session) => session.id))
  if (event.ruleVersion !== MISSED_OPPORTUNITY_RULE_VERSION) return 'Missed-opportunity rule version is invalid.'
  if (typeof event.id !== 'string' || !event.id) return 'Missed-opportunity ID is missing.'
  if (typeof event.sessionId !== 'string' || !sessionIds.has(event.sessionId)) return 'Missed opportunity references an unknown session.'
  if (typeof event.nextSessionId !== 'string' || !sessionIds.has(event.nextSessionId)) return 'Missed opportunity references an unknown next session.'
  if (!event.input || !['family', 'work', 'time', 'travel', 'sleep', 'illness', 'pain', 'equipment', 'motivation', 'other'].includes(event.input.reason)) return 'Missed-opportunity reason is invalid.'
  if (!event.input || !['no-training', 'different-training-unlogged'].includes(event.input.trainingOutcome)) return 'Missed-opportunity training outcome is invalid.'
  if (!event.input || !['ended', 'continuing', 'uncertain'].includes(event.input.constraintState)) return 'Missed-opportunity constraint state is invalid.'
  if (!event.input || Number.isNaN(new Date(event.input.nextOpportunityAt).getTime()) || !Number.isFinite(event.input.nextMinutes) || event.input.nextMinutes < 15 || event.input.nextMinutes > 90 || typeof event.input.note !== 'string' || event.input.note.length > 500) return 'Missed-opportunity next-step input is invalid.'
  if (!event.recordedAt || Number.isNaN(new Date(event.recordedAt).getTime()) || !event.plannedAt || Number.isNaN(new Date(event.plannedAt).getTime())) return 'Missed-opportunity dates are invalid.'
  if (!['planned', 'deferred'].includes(String(event.priorStatus))) return 'Missed-opportunity prior status is invalid.'
  if (!['stable', 'interrupted', 'returning'].includes(String(event.continuityBefore)) || !['stable', 'interrupted', 'returning'].includes(String(event.continuityAfter))) return 'Missed-opportunity continuity evidence is invalid.'
  if (!['defer-one', 'rebuild-sequence', 'reacclimation-review'].includes(String(event.mode)) || !Number.isInteger(event.consecutiveMisses) || Number(event.consecutiveMisses) < 1) return 'Missed-opportunity decision mode is invalid.'
  if (![event.queueBefore, event.queueAfter, event.reasons, event.changes, event.preservedTerminalSessionIds].every(Array.isArray)) return 'Missed-opportunity replay evidence is incomplete.'
  if ([...(event.queueBefore ?? []), ...(event.queueAfter ?? []), ...(event.preservedTerminalSessionIds ?? [])].some((id) => typeof id !== 'string' || !sessionIds.has(id))) return 'Missed-opportunity queue references an unknown session.'
  if ((event.changes ?? []).some((change) => !change || typeof change !== 'object' || !sessionIds.has(change.sessionId) || Number.isNaN(new Date(change.fromPlannedAt).getTime()) || Number.isNaN(new Date(change.toPlannedAt).getTime()) || !Number.isFinite(change.fromSetCount) || !Number.isFinite(change.toSetCount))) return 'Missed-opportunity session changes are invalid.'
  if (event.completedSetCountBefore !== event.completedSetCountAfter) return 'Missed-opportunity evidence cannot create or remove completed sets.'
  if (!Number.isFinite(event.openSetCountBefore) || !Number.isFinite(event.openSetCountAfter) || Number(event.openSetCountAfter) > Number(event.openSetCountBefore)) return 'Missed-opportunity evidence contains catch-up volume.'
  return null
}
