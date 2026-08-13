import type { BodyRegion, CompletedSetRecord, MesocyclePlan, MissedOpportunityEvent, TrainingSession } from './types'

export const LIFE_AWARE_REVIEW_RULE_VERSION = 'life-aware-review-v1' as const
export const LIFE_AWARE_WINDOW_DAYS = 28

export type LifeAwareTodayAction = 'proceed' | 'confirm' | 'rebuild' | 'reacclimate' | 'review-safety'
export type LifeAwareRoundAction = 'continue' | 'extend' | 'hold' | 'rebuild' | 'recover'
export type LifeAwareBlockAction = 'keep-plan' | 'review-frequency' | 'review-duration' | 'review-volume' | 'review-recovery'

export interface LifeAwareAssessment {
  ruleVersion: typeof LIFE_AWARE_REVIEW_RULE_VERSION
  assessedAt: string
  windowDays: number
  state: 'on-course' | 'flexing' | 'interrupted' | 'returning'
  today: { action: LifeAwareTodayAction; title: string; reason: string }
  round: { action: LifeAwareRoundAction; title: string; reason: string }
  block: { action: LifeAwareBlockAction; title: string; reason: string; approvalRequired: true }
  metrics: {
    plannedOpportunities: number
    productiveOpportunities: number
    missedOpportunities: number
    opportunityCompletionRate: number | null
    plannedSets: number
    completedLinkedSets: number
    completedUnlinkedSets: number
    protectedPriorities: number
    protectedPrioritiesCovered: number
    notCarriedForwardSets: number
  }
  latestConstraint: { kind: 'external' | 'readiness' | 'health-safety' | 'none'; label: string; continuing: boolean }
  priorityRegions: BodyRegion[]
  reasons: string[]
  guardrails: string[]
}

const DAY_MS = 86_400_000
const PRODUCTIVE_STATUSES = new Set(['completed', 'partial-primary'])
const RESOLVED_STATUSES = new Set(['completed', 'partial-primary', 'partial-no-primary', 'expired', 'stopped'])
const READINESS_REASONS = new Set(['sleep'])
const HEALTH_REASONS = new Set(['illness', 'pain'])

const setCount = (session: TrainingSession) => session.exercises.reduce((total, exercise) => total + exercise.sets.filter((workSet) => !workSet.athleteAdded).length, 0)

export function buildLifeAwareAssessment(input: {
  sessions: TrainingSession[]
  history: CompletedSetRecord[]
  missedOpportunityEvents: MissedOpportunityEvent[]
  activePlan?: MesocyclePlan | null
  priorityRegions: BodyRegion[]
  assessedAt?: string
}): LifeAwareAssessment {
  const assessedAt = input.assessedAt ?? new Date().toISOString()
  const assessedMs = new Date(assessedAt).getTime()
  const windowStart = assessedMs - LIFE_AWARE_WINDOW_DAYS * DAY_MS
  const inWindow = (value: string) => {
    const timestamp = new Date(value).getTime()
    return timestamp >= windowStart && timestamp <= assessedMs
  }
  const relevantSessions = input.sessions.filter((session) => inWindow(session.plannedDate))
  const resolvedSessions = relevantSessions.filter((session) => RESOLVED_STATUSES.has(session.status))
  const productiveSessions = relevantSessions.filter((session) => PRODUCTIVE_STATUSES.has(session.status))
  const misses = input.missedOpportunityEvents.filter((event) => inWindow(event.recordedAt))
  const latestMiss = [...misses].sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime())[0] ?? null
  const recentHistory = input.history.filter((workSet) => inWindow(workSet.completedAt))
  const relevantSessionIds = new Set(relevantSessions.map((session) => session.id))
  const completedLinkedSets = recentHistory.filter((workSet) => relevantSessionIds.has(workSet.sessionId)).length
  const completedUnlinkedSets = recentHistory.length - completedLinkedSets
  const plannedSets = relevantSessions.reduce((total, session) => total + setCount(session), 0)
  const protectedIds = input.activePlan?.strengthAnchors ?? []
  const coveredProtectedIds = new Set(recentHistory.filter((workSet) => protectedIds.includes(workSet.exerciseId)).map((workSet) => workSet.exerciseId))
  const notCarriedForwardSets = latestMiss?.changes.reduce((total, change) => total + Math.max(0, change.fromSetCount - change.toSetCount), 0) ?? 0
  const opportunityCompletionRate = resolvedSessions.length ? productiveSessions.length / resolvedSessions.length : null

  const latestConstraint = !latestMiss
    ? { kind: 'none' as const, label: 'No recent schedule change recorded', continuing: false }
    : HEALTH_REASONS.has(latestMiss.input.reason)
      ? { kind: 'health-safety' as const, label: latestMiss.input.reason, continuing: latestMiss.input.constraintState !== 'ended' }
      : READINESS_REASONS.has(latestMiss.input.reason)
        ? { kind: 'readiness' as const, label: latestMiss.input.reason, continuing: latestMiss.input.constraintState !== 'ended' }
        : { kind: 'external' as const, label: latestMiss.input.reason, continuing: latestMiss.input.constraintState !== 'ended' }

  const today = latestConstraint.kind === 'health-safety'
    ? { action: latestMiss?.input.reason === 'pain' ? 'review-safety' as const : 'reacclimate' as const, title: latestMiss?.input.reason === 'pain' ? 'Review what can be trained' : 'Confirm a return exposure', reason: 'Pain and illness are not treated as ordinary schedule problems or assigned a universal percentage reduction.' }
    : latestConstraint.kind === 'readiness'
      ? { action: 'confirm' as const, title: 'Confirm with current performance', reason: 'Sleep evidence can increase caution, but a survey alone does not prove that today’s capacity is lower.' }
      : latestMiss && (latestMiss.consecutiveMisses >= 2 || latestConstraint.continuing)
        ? { action: 'rebuild' as const, title: 'Use the next executable priority', reason: 'The open queue should fit the next real opportunity without borrowing missed volume.' }
        : { action: 'proceed' as const, title: 'Follow the next useful session', reason: 'No current evidence requires an automatic reduction. Warm-up and completed work remain the confirmation.' }

  const round = latestConstraint.kind === 'health-safety'
    ? { action: 'recover' as const, title: 'Offer a recovery or return round', reason: 'Prior work stays earned while current tolerance is re-established.' }
    : misses.length >= 2
      ? { action: 'rebuild' as const, title: 'Rebuild the open sequence', reason: `${misses.length} recent missed opportunities make the untouched calendar sequence less useful.` }
      : misses.length === 1
        ? { action: 'extend' as const, title: 'Let the training round stretch', reason: 'One missed opportunity can move without progressing untouched targets or ending the round.' }
        : { action: 'continue' as const, title: 'Continue the current training round', reason: 'Completed exposure order, not the weekday label, remains the progression clock.' }

  let block: LifeAwareAssessment['block'] = { action: 'keep-plan', title: 'Keep the current base plan', reason: 'No repeated mismatch yet justifies changing the block structure.', approvalRequired: true }
  if (latestConstraint.kind === 'health-safety' && latestConstraint.continuing) block = { action: 'review-recovery', title: 'Review the block around recovery', reason: 'A continuing health or pain constraint changes what is executable and needs athlete review.', approvalRequired: true }
  else if (misses.length >= 2 && misses.filter((event) => event.input.reason === 'time').length >= Math.ceil(misses.length / 2)) block = { action: 'review-duration', title: 'Consider shorter base sessions', reason: 'Time repeatedly changed what was executable. Shorter required sessions with optional extra work may fit better.', approvalRequired: true }
  else if (resolvedSessions.length >= 3 && (opportunityCompletionRate ?? 1) < 0.67) block = { action: 'review-frequency', title: 'Consider fewer required opportunities', reason: 'The recent plan repeatedly exceeded the number of productive opportunities life supported.', approvalRequired: true }
  else if (notCarriedForwardSets > 0 && misses.length >= 2) block = { action: 'review-volume', title: 'Review the recoverable base dose', reason: 'Optional work was repeatedly removed to keep priority training executable. It is evidence for the next block, not debt.', approvalRequired: true }

  const state: LifeAwareAssessment['state'] = latestConstraint.kind === 'health-safety'
    ? 'returning'
    : misses.length >= 2 || latestConstraint.continuing
      ? 'interrupted'
      : misses.length === 1
        ? 'flexing'
        : 'on-course'
  const reasons = [today.reason, round.reason, block.reason]

  return {
    ruleVersion: LIFE_AWARE_REVIEW_RULE_VERSION,
    assessedAt,
    windowDays: LIFE_AWARE_WINDOW_DAYS,
    state,
    today,
    round,
    block,
    metrics: {
      plannedOpportunities: relevantSessions.length,
      productiveOpportunities: productiveSessions.length,
      missedOpportunities: misses.length,
      opportunityCompletionRate,
      plannedSets,
      completedLinkedSets,
      completedUnlinkedSets,
      protectedPriorities: protectedIds.length,
      protectedPrioritiesCovered: coveredProtectedIds.size,
      notCarriedForwardSets
    },
    latestConstraint,
    priorityRegions: input.priorityRegions,
    reasons,
    guardrails: [
      'No missed set becomes work owed later.',
      'Only unfinished future sessions may change.',
      'One disruption does not erase earned progress.',
      'Every block-level change requires athlete approval.'
    ]
  }
}
