import type {
  AthletePlacementAssessment,
  MovementPlacementAssessment,
  PlacementRecoveryResponse,
  PlacementVerificationEvent,
  PlacementVerificationFirstSet,
  PlacementVerificationSessionEvidence,
  PlacementWarmupResponse
} from './types'
import { movementPlacementEvidenceError } from './placement-engine'
import { sameJsonValue } from './stable-json'

export const placementVerificationRuleVersion = 'placement-verification-v1' as const

export const placementVerificationVerdictLabels = {
  collecting: 'Collecting your workouts',
  'pending-recovery': 'Waiting on your day-after check',
  'supports-route': 'Starting plan looks right',
  'needs-more-evidence': 'Needs a few more workouts',
  'review-suggested': 'Worth reviewing your starting plan',
  'reassessment-required': 'Answer the starting questions again'
} as const

export function cancelPlacementVerificationForPrimarySubstitution(input: {
  events: PlacementVerificationEvent[]
  placementCreatedAt: string
  sessionId: string
}) {
  let cancelled = false
  const events = input.events.filter((event) => {
    const matches = event.placementCreatedAt === input.placementCreatedAt
      && event.sessionId === input.sessionId
      && event.status === 'active'
    if (matches) cancelled = true
    return !matches
  })
  return { events, cancelled }
}

export function beginPlacementVerification(input: {
  id: string
  placement: AthletePlacementAssessment
  sessionId: string
  sequence: number
  startedAt: string
  movementPlacement?: MovementPlacementAssessment
}): PlacementVerificationEvent {
  return {
    id: input.id,
    ruleVersion: placementVerificationRuleVersion,
    placementCreatedAt: input.placement.createdAt,
    placementRoute: input.movementPlacement?.selectedRoute ?? input.placement.selectedRoute,
    ...(input.movementPlacement ? { movementPlacement: structuredClone(input.movementPlacement) } : {}),
    sessionId: input.sessionId,
    sequence: input.sequence,
    startedAt: input.startedAt,
    status: 'active',
    warmupResponse: 'not-answered',
    warmupCapturedAt: null,
    firstSet: null,
    sessionEvidence: null,
    recoveryResponse: 'pending',
    recoveryCapturedAt: null,
    verdict: 'collecting',
    reasons: ['This is a productive training session, not a maximal placement test.'],
    completedAt: null
  }
}

export function recordPlacementWarmup(
  event: PlacementVerificationEvent,
  response: Exclude<PlacementWarmupResponse, 'not-answered'>,
  capturedAt: string
): PlacementVerificationEvent {
  if (event.status !== 'active') return event
  return { ...event, warmupResponse: response, warmupCapturedAt: capturedAt }
}

function sessionWarnings(event: PlacementVerificationEvent, evidence: PlacementVerificationSessionEvidence, firstSet: PlacementVerificationFirstSet | null) {
  const warnings: string[] = []
  if (event.warmupResponse === 'harder') warnings.push('Warm-ups felt harder than the placement hypothesis expected.')
  if (firstSet && firstSet.actualRir <= firstSet.targetRir - 2) warnings.push('The first work set was at least two RIR harder than prescribed.')
  if (evidence.technique !== null && evidence.technique <= 2) warnings.push('Reported technique was below the repeatable-quality threshold.')
  if (evidence.pain === 3) warnings.push('Joint irritation reached the conservative placement-review threshold.')
  if (evidence.timeFit !== null && evidence.timeFit <= 2) warnings.push('The session did not fit the available time well.')
  if (evidence.difficulty !== null && evidence.difficulty >= 9) warnings.push('Overall session difficulty reached the conservative review threshold.')
  if (evidence.completionRate < 0.5) warnings.push('Less than half of the planned work was completed.')
  return warnings
}

const hardPain = (event: PlacementVerificationEvent, evidence: PlacementVerificationSessionEvidence) =>
  event.warmupResponse === 'painful' || (evidence.pain !== null && evidence.pain >= 4)

export function completePlacementVerification(event: PlacementVerificationEvent, input: {
  firstSet: PlacementVerificationFirstSet | null
  sessionEvidence: PlacementVerificationSessionEvidence
  completedAt: string
}): PlacementVerificationEvent {
  if (event.status !== 'active') return event
  const warnings = sessionWarnings(event, input.sessionEvidence, input.firstSet)
  const baseReasons = [
    input.firstSet
      ? `${input.firstSet.exerciseName} first work set completed at ${input.firstSet.actualLoad} × ${input.firstSet.actualReps} with ${input.firstSet.actualRir} RIR.`
      : 'No completed primary first work set was available for placement verification.',
    `${input.sessionEvidence.completedSets} of ${input.sessionEvidence.plannedSets} planned sets were completed.`,
    ...warnings
  ]
  if (hardPain(event, input.sessionEvidence)) return {
    ...event,
    status: 'resolved',
    firstSet: input.firstSet,
    sessionEvidence: input.sessionEvidence,
    verdict: 'reassessment-required',
    reasons: ['Pain evidence changed what can be trained. Review the starting profile before another automatic workout start.', ...baseReasons],
    completedAt: input.completedAt
  }
  if (!input.firstSet || input.sessionEvidence.completedSets === 0 || ['partial-no-primary', 'stopped'].includes(input.sessionEvidence.sessionStatus)) return {
    ...event,
    status: 'resolved',
    firstSet: input.firstSet,
    sessionEvidence: input.sessionEvidence,
    verdict: 'needs-more-evidence',
    reasons: ['The session remains valid training history, but it did not provide enough primary-set evidence to confirm placement.', ...baseReasons],
    completedAt: input.completedAt
  }
  return {
    ...event,
    status: 'awaiting-recovery',
    firstSet: input.firstSet,
    sessionEvidence: input.sessionEvidence,
    verdict: 'pending-recovery',
    reasons: ['The session produced usable placement evidence. Recovery will complete this check.', ...baseReasons],
    completedAt: input.completedAt
  }
}

export function resolvePlacementRecovery(
  event: PlacementVerificationEvent,
  response: Exclude<PlacementRecoveryResponse, 'pending'>,
  capturedAt: string
): PlacementVerificationEvent {
  if (event.status !== 'awaiting-recovery' || !event.sessionEvidence) return event
  const warnings = sessionWarnings(event, event.sessionEvidence, event.firstSet)
  const missingQuality = event.sessionEvidence.technique === null || event.sessionEvidence.pain === null || event.sessionEvidence.timeFit === null
  const criticalWarning = warnings.some((reason) => reason.includes('two RIR') || reason.includes('technique') || reason.includes('Joint irritation'))
  const verdict = response === 'not-recovered' || warnings.length >= 2 || criticalWarning
    ? 'review-suggested'
    : response === 'skipped' || missingQuality
      ? 'needs-more-evidence'
      : 'supports-route'
  const recoveryReason = response === 'recovered'
    ? 'Recovery was back to normal by the next check.'
    : response === 'acceptable'
      ? 'Recovery was acceptable enough for normal daily activity and the next planned exposure.'
      : response === 'not-recovered'
        ? 'Recovery remained meaningfully worse than expected at the next check.'
        : 'Recovery feedback was skipped and remains unknown.'
  return {
    ...event,
    status: 'resolved',
    recoveryResponse: response,
    recoveryCapturedAt: capturedAt,
    verdict,
    reasons: [recoveryReason, ...event.reasons]
  }
}

export function summarizePlacementVerification(events: PlacementVerificationEvent[], placementCreatedAt: string) {
  const current = events.filter((event) => event.placementCreatedAt === placementCreatedAt).sort((a, b) => a.startedAt.localeCompare(b.startedAt) || a.sequence - b.sequence)
  const resolved = current.filter((event) => event.status === 'resolved')
  const supports = resolved.filter((event) => event.verdict === 'supports-route').length
  const reviews = resolved.filter((event) => event.verdict === 'review-suggested').length
  const blocked = resolved.some((event) => event.verdict === 'reassessment-required')
  const pendingRecovery = current.some((event) => event.status === 'awaiting-recovery')
  const state = blocked
    ? 'reassessment-required'
    : pendingRecovery
      ? 'pending-recovery'
      : reviews >= 2
        ? 'review-suggested'
        : supports >= 2
          ? 'route-supported'
          : current.length >= 3
            ? 'needs-more-evidence'
            : 'gathering'
  return { events: current, collected: current.length, resolved: resolved.length, supports, reviews, blocked, pendingRecovery, state }
}

function replayPlacementVerification(event: PlacementVerificationEvent, sessionEvidence = event.sessionEvidence) {
  const placeholder = { createdAt: event.placementCreatedAt, selectedRoute: event.placementRoute } as AthletePlacementAssessment
  let replay = beginPlacementVerification({ id: event.id, placement: placeholder, sessionId: event.sessionId, sequence: event.sequence, startedAt: event.startedAt, movementPlacement: event.movementPlacement })
  if (event.warmupResponse !== 'not-answered' && event.warmupCapturedAt) replay = recordPlacementWarmup(replay, event.warmupResponse, event.warmupCapturedAt)
  if (sessionEvidence && event.completedAt) replay = completePlacementVerification(replay, { firstSet: event.firstSet, sessionEvidence, completedAt: event.completedAt })
  if (event.recoveryResponse !== 'pending' && event.recoveryCapturedAt) replay = resolvePlacementRecovery(replay, event.recoveryResponse, event.recoveryCapturedAt)
  return replay
}

export function revisePlacementSessionEvidence(event: PlacementVerificationEvent, sessionEvidence: PlacementVerificationSessionEvidence) {
  if (!event.completedAt || !event.sessionEvidence) return event
  return replayPlacementVerification(event, sessionEvidence)
}

const isDate = (value: unknown) => typeof value === 'string' && !Number.isNaN(new Date(value).getTime())
const finiteNonNegative = (value: unknown) => typeof value === 'number' && Number.isFinite(value) && value >= 0

export function placementVerificationError(value: unknown): string | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return 'Placement verification must be a structured record.'
  const event = value as Partial<PlacementVerificationEvent>
  if (event.ruleVersion !== placementVerificationRuleVersion || typeof event.id !== 'string' || typeof event.sessionId !== 'string') return 'Placement verification has invalid identity or rule provenance.'
  if (!isDate(event.placementCreatedAt) || !isDate(event.startedAt) || !Number.isInteger(event.sequence) || Number(event.sequence) < 1 || Number(event.sequence) > 3) return 'Placement verification has invalid placement, date, or sequence evidence.'
  if (!['introductory-skill', 'reacclimation', 'bridge-calibration', 'base-building', 'hypertrophy', 'powerbuilding', 'strength', 'power', 'event-specific', 'pain-aware-modified'].includes(String(event.placementRoute))) return 'Placement verification has an invalid route.'
  if (event.movementPlacement !== undefined) {
    const movementError = movementPlacementEvidenceError(event.movementPlacement)
    if (movementError) return `Placement verification movement evidence is invalid: ${movementError}`
    if (event.movementPlacement.selectedRoute !== event.placementRoute) return 'Placement verification route does not match its movement evidence.'
  }
  if (!['active', 'awaiting-recovery', 'resolved'].includes(String(event.status)) || !['better', 'as-expected', 'harder', 'painful', 'skipped', 'not-answered'].includes(String(event.warmupResponse)) || !['recovered', 'acceptable', 'not-recovered', 'skipped', 'pending'].includes(String(event.recoveryResponse))) return 'Placement verification has an invalid response state.'
  if (!['collecting', 'pending-recovery', 'supports-route', 'needs-more-evidence', 'review-suggested', 'reassessment-required'].includes(String(event.verdict)) || !Array.isArray(event.reasons) || event.reasons.some((reason) => typeof reason !== 'string')) return 'Placement verification has an invalid verdict or explanation.'
  if (!(event.warmupCapturedAt === null || isDate(event.warmupCapturedAt)) || !(event.recoveryCapturedAt === null || isDate(event.recoveryCapturedAt)) || !(event.completedAt === null || isDate(event.completedAt))) return 'Placement verification has an invalid evidence date.'
  if ((event.warmupResponse === 'not-answered') !== (event.warmupCapturedAt === null)) return 'Placement warm-up missingness does not reconcile.'
  if (event.firstSet !== null && event.firstSet !== undefined) {
    const first = event.firstSet
    if (typeof first.sourceSetId !== 'string' || typeof first.plannedExerciseId !== 'string' || typeof first.exerciseId !== 'string' || typeof first.exerciseName !== 'string' || [first.targetLoad, first.targetReps, first.targetRir, first.actualLoad, first.actualReps, first.actualRir].some((item) => !finiteNonNegative(item))) return 'Placement verification has an invalid first-set snapshot.'
  }
  if (event.sessionEvidence !== null && event.sessionEvidence !== undefined) {
    const evidence = event.sessionEvidence
    if (!['completed', 'partial-primary', 'partial-no-primary', 'stopped'].includes(String(evidence.sessionStatus)) || [evidence.completedSets, evidence.plannedSets, evidence.completionRate, evidence.plannedMinutes, evidence.actualMinutes].some((item) => !finiteNonNegative(item)) || evidence.completionRate > 1 || !(evidence.readiness === null || ['normal', 'confirm', 'protect', 'reacclimate', 'pain-aware'].includes(String(evidence.readiness))) || [evidence.difficulty, evidence.technique, evidence.pain, evidence.timeFit].some((item) => !(item === null || finiteNonNegative(item))) || typeof evidence.postSurveySkipped !== 'boolean') return 'Placement verification has invalid session evidence.'
  }
  const valid = event as PlacementVerificationEvent
  const replay = replayPlacementVerification(valid)
  if (!sameJsonValue(replay, event)) return 'Placement verification does not reconcile with its source evidence.'
  return null
}
