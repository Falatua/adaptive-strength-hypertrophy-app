import type {
  AthletePlacementAssessment,
  MovementPlacementAssessment,
  MovementPlacementExitAssessment,
  MovementPlacementExitReviewEvent,
  PlacementExitAssessment,
  PlacementExitCriterion,
  PlacementExitReviewEvent,
  PlacementGoal,
  PlacementRoute,
  PlacementVerificationEvent
} from './types'
import { placementAssessmentError } from './placement-engine'
import { sameJsonValue } from './stable-json'
import { placementVerificationError } from './placement-verification-engine'

export const placementExitRuleVersion = 'placement-exit-v1' as const
export const placementExitReviewRuleVersion = 'placement-exit-review-v1' as const
export const movementPlacementExitRuleVersion = 'movement-placement-exit-v1' as const
export const movementPlacementExitReviewRuleVersion = 'movement-placement-exit-review-v1' as const

const transitionalRoutes = new Set<PlacementRoute>(['introductory-skill', 'reacclimation', 'bridge-calibration', 'base-building'])

const goalRoute = (goal: PlacementGoal | null): PlacementRoute | null => {
  if (goal === 'strength') return 'strength'
  if (goal === 'hypertrophy') return 'hypertrophy'
  if (goal === 'powerbuilding') return 'powerbuilding'
  if (goal === 'power') return 'power'
  if (goal === 'event-specific') return 'event-specific'
  return null
}

const advancementRouteFor = (route: PlacementRoute, goal: PlacementGoal | null): PlacementRoute | null => {
  if (route === 'introductory-skill') return 'bridge-calibration'
  if (route === 'reacclimation' || route === 'bridge-calibration') return 'base-building'
  if (route === 'base-building') return goalRoute(goal)
  return route
}

const conservativeRoute = (route: PlacementRoute): PlacementRoute => {
  if (['power', 'event-specific', 'strength', 'hypertrophy', 'powerbuilding'].includes(route)) return 'base-building'
  if (route === 'base-building' || route === 'bridge-calibration') return 'reacclimation'
  return route
}

const criterion = (id: PlacementExitCriterion['id'], label: string, state: PlacementExitCriterion['state'], detail: string): PlacementExitCriterion => ({ id, label, state, detail })

export function buildPlacementExitAssessment(input: {
  placement: AthletePlacementAssessment
  verificationEvents: PlacementVerificationEvent[]
  assessedAt?: string
}): PlacementExitAssessment {
  const assessedAt = input.assessedAt ?? new Date().toISOString()
  if (Number.isNaN(new Date(assessedAt).getTime())) throw new Error('Placement exit assessment needs a valid assessment date.')
  const placementEvents = input.verificationEvents
    .filter((event) => event.placementCreatedAt === input.placement.createdAt)
    .sort((left, right) => left.sequence - right.sequence)
  const events = placementEvents.filter((event) => event.placementRoute === input.placement.selectedRoute)
  const excludedDifferentRouteChecks = placementEvents.length - events.length
  const resolvedEvents = events.filter((event) => event.status === 'resolved')
  const supports = resolvedEvents.filter((event) => event.verdict === 'supports-route').length
  const reviews = resolvedEvents.filter((event) => event.verdict === 'review-suggested').length
  const needsMoreEvidence = resolvedEvents.filter((event) => event.verdict === 'needs-more-evidence').length
  const reassessmentRequired = resolvedEvents.some((event) => event.verdict === 'reassessment-required')
  const pendingRecovery = events.some((event) => event.status === 'awaiting-recovery')
  const recovered = resolvedEvents.filter((event) => ['recovered', 'acceptable'].includes(event.recoveryResponse)).length

  const criteria: PlacementExitCriterion[] = [
    criterion('resolved-checks', 'Two productive checks resolved', resolvedEvents.length >= 2 ? 'met' : 'unknown', resolvedEvents.length >= 2 ? `${resolvedEvents.length} checks have final source-linked verdicts.` : `${resolvedEvents.length} of 2 required checks have final verdicts.`),
    criterion('route-support', 'Current route supported repeatedly', supports >= 2 ? 'met' : reviews >= 2 || reassessmentRequired ? 'not-met' : 'unknown', supports >= 2 ? `${supports} checks support the current route.` : reviews >= 2 ? `${reviews} checks suggest placement review.` : 'Repeated route support has not been established.'),
    criterion('pain-boundary', 'No pain-changing verification event', reassessmentRequired ? 'not-met' : resolvedEvents.length ? 'met' : 'unknown', reassessmentRequired ? 'A productive check recorded pain that changed what could be trained.' : resolvedEvents.length ? 'No resolved check crossed the pain-changing boundary.' : 'No resolved pain evidence is available yet.'),
    criterion('recovery-evidence', 'Recovery evidence supports the hypothesis', recovered >= 2 ? 'met' : reviews >= 2 ? 'not-met' : 'unknown', recovered >= 2 ? `${recovered} checks resolved with recovered or acceptable recovery.` : pendingRecovery ? 'A recovery response is still pending.' : 'Two supportive recovery responses are not available yet.')
  ]

  let recommendation: PlacementExitAssessment['recommendation'] = 'collect-evidence'
  let suggestedRoute: PlacementRoute | null = null
  const reasons: string[] = []

  if (reassessmentRequired) {
    recommendation = 'reassessment-required'
    reasons.push('Pain-changing verification evidence requires athlete review before another automatic workout start.')
  } else if (reviews >= 2) {
    recommendation = 'review-conservative'
    suggestedRoute = conservativeRoute(input.placement.selectedRoute)
    reasons.push('Two resolved checks suggest the current placement is more demanding than the athlete response supports.')
  } else if (supports >= 2) {
    const nextRoute = advancementRouteFor(input.placement.selectedRoute, input.placement.inputs.goal)
    if (transitionalRoutes.has(input.placement.selectedRoute) && nextRoute && nextRoute !== input.placement.selectedRoute) {
      recommendation = 'review-advance'
      suggestedRoute = nextRoute
      reasons.push('Repeated productive checks support reviewing whether the current transitional route has served its purpose.')
    } else {
      recommendation = 'confirm-current'
      suggestedRoute = input.placement.selectedRoute
      reasons.push('Repeated productive checks support retaining the current route while normal progression remains separately governed.')
    }
  } else if (events.length >= 3 && resolvedEvents.length === events.length) {
    recommendation = 'hold-current'
    suggestedRoute = input.placement.selectedRoute
    reasons.push('Three checks finished without enough repeated support or repeated review evidence to justify a route change.')
  } else {
    reasons.push(pendingRecovery ? 'Complete or skip the pending recovery check before interpreting this placement checkpoint.' : `Collect ${Math.max(0, 2 - resolvedEvents.length)} more resolved productive check${2 - resolvedEvents.length === 1 ? '' : 's'} before reviewing route exit.`)
  }

  return {
    ruleVersion: placementExitRuleVersion,
    placementCreatedAt: input.placement.createdAt,
    assessedAt,
    currentRoute: input.placement.selectedRoute,
    recommendation,
    suggestedRoute,
    sourcePlacement: structuredClone(input.placement),
    sourceVerificationEvents: structuredClone(placementEvents),
    collected: events.length,
    resolved: resolvedEvents.length,
    supports,
    reviews,
    needsMoreEvidence,
    excludedDifferentRouteChecks,
    pendingRecovery,
    reassessmentRequired,
    criteria,
    declaredExitCriteria: [...input.placement.exitCriteria],
    reasons,
    limitations: [
      'This checkpoint interprets only the first one to three source-linked productive checks for this placement version.',
      ...(excludedDifferentRouteChecks ? [`${excludedDifferentRouteChecks} movement-lane check${excludedDifferentRouteChecks === 1 ? ' was' : 's were'} excluded because its effective route differed from the plan route.`] : []),
      'It does not infer medical clearance, diagnose pain, or automatically change the athlete profile, route, plan, or prescription.',
      'Declared route criteria remain athlete review prompts until each can be supported by a validated measurable signal.'
    ]
  }
}

export function buildMovementPlacementExitAssessment(input: {
  placement: AthletePlacementAssessment
  movementPlacement: MovementPlacementAssessment
  verificationEvents: PlacementVerificationEvent[]
  assessedAt?: string
}): MovementPlacementExitAssessment {
  const assessedAt = input.assessedAt ?? new Date().toISOString()
  if (Number.isNaN(new Date(assessedAt).getTime())) throw new Error('Movement placement exit assessment needs a valid assessment date.')
  const placementMovement = input.placement.movementPlacements?.find((movement) => movement.exerciseId === input.movementPlacement.exerciseId)
  if (!placementMovement || !sameJsonValue(placementMovement, input.movementPlacement)) throw new Error('Movement placement exit assessment needs the exact movement snapshot from its placement version.')
  const placementEvents = input.verificationEvents
    .filter((event) => event.placementCreatedAt === input.placement.createdAt)
    .sort((left, right) => left.startedAt.localeCompare(right.startedAt) || left.sequence - right.sequence)
  const events = placementEvents.filter((event) => event.movementPlacement?.exerciseId === input.movementPlacement.exerciseId)
  const excludedOtherMovementChecks = placementEvents.length - events.length
  const resolvedEvents = events.filter((event) => event.status === 'resolved')
  const supports = resolvedEvents.filter((event) => event.verdict === 'supports-route').length
  const reviews = resolvedEvents.filter((event) => event.verdict === 'review-suggested').length
  const needsMoreEvidence = resolvedEvents.filter((event) => event.verdict === 'needs-more-evidence').length
  const reassessmentRequired = resolvedEvents.some((event) => event.verdict === 'reassessment-required')
  const pendingRecovery = events.some((event) => event.status === 'awaiting-recovery')
  const recovered = resolvedEvents.filter((event) => ['recovered', 'acceptable'].includes(event.recoveryResponse)).length
  const criteria: PlacementExitCriterion[] = [
    criterion('resolved-checks', 'Two exact-movement checks resolved', resolvedEvents.length >= 2 ? 'met' : 'unknown', resolvedEvents.length >= 2 ? `${resolvedEvents.length} ${input.movementPlacement.exerciseName} checks have final source-linked verdicts.` : `${resolvedEvents.length} of 2 exact-movement checks have final verdicts.`),
    criterion('route-support', 'Movement lane supported repeatedly', supports >= 2 ? 'met' : reviews >= 2 || reassessmentRequired ? 'not-met' : 'unknown', supports >= 2 ? `${supports} checks support this movement lane.` : reviews >= 2 ? `${reviews} checks suggest reviewing this movement lane.` : 'Repeated exact-movement support has not been established.'),
    criterion('pain-boundary', 'No pain-changing movement check', reassessmentRequired ? 'not-met' : resolvedEvents.length ? 'met' : 'unknown', reassessmentRequired ? `A ${input.movementPlacement.exerciseName} check recorded pain that changed training.` : resolvedEvents.length ? 'No resolved exact-movement check crossed the pain-changing boundary.' : 'No resolved pain evidence is available for this movement.'),
    criterion('recovery-evidence', 'Movement recovery supports the lane', recovered >= 2 ? 'met' : reviews >= 2 ? 'not-met' : 'unknown', recovered >= 2 ? `${recovered} exact-movement checks resolved with recovered or acceptable recovery.` : pendingRecovery ? 'An exact-movement recovery response is still pending.' : 'Two supportive recovery responses are not available for this movement.')
  ]

  let recommendation: MovementPlacementExitAssessment['recommendation'] = 'collect-evidence'
  let suggestedRoute: PlacementRoute | null = null
  const reasons: string[] = []
  if (reassessmentRequired) {
    recommendation = 'reassessment-required'
    reasons.push(`Pain-changing ${input.movementPlacement.exerciseName} evidence requires athlete reassessment before this lane is confirmed.`)
  } else if (reviews >= 2) {
    recommendation = 'review-conservative'
    suggestedRoute = conservativeRoute(input.movementPlacement.selectedRoute)
    reasons.push(`Two resolved ${input.movementPlacement.exerciseName} checks suggest a more conservative movement lane.`)
  } else if (supports >= 2) {
    const nextRoute = advancementRouteFor(input.movementPlacement.selectedRoute, input.placement.inputs.goal)
    if (transitionalRoutes.has(input.movementPlacement.selectedRoute) && nextRoute && nextRoute !== input.movementPlacement.selectedRoute) {
      recommendation = 'review-advance'
      suggestedRoute = nextRoute
      reasons.push(`Repeated exact-movement checks support reviewing whether ${input.movementPlacement.exerciseName} has completed its current transitional lane.`)
    } else {
      recommendation = 'confirm-current'
      suggestedRoute = input.movementPlacement.selectedRoute
      reasons.push(`Repeated exact-movement checks support retaining the current ${input.movementPlacement.exerciseName} lane.`)
    }
  } else if (events.length >= 3 && resolvedEvents.length === events.length) {
    recommendation = 'hold-current'
    suggestedRoute = input.movementPlacement.selectedRoute
    reasons.push(`Three ${input.movementPlacement.exerciseName} checks finished without repeated evidence for a lane change.`)
  } else {
    reasons.push(pendingRecovery ? `Complete or skip the pending ${input.movementPlacement.exerciseName} recovery check before reviewing this lane.` : `Collect ${Math.max(0, 2 - resolvedEvents.length)} more resolved ${input.movementPlacement.exerciseName} check${2 - resolvedEvents.length === 1 ? '' : 's'} before reviewing this lane.`)
  }

  return {
    ruleVersion: movementPlacementExitRuleVersion,
    placementCreatedAt: input.placement.createdAt,
    assessedAt,
    exerciseId: input.movementPlacement.exerciseId,
    exerciseName: input.movementPlacement.exerciseName,
    currentRoute: input.movementPlacement.selectedRoute,
    recommendation,
    suggestedRoute,
    sourcePlacement: structuredClone(input.placement),
    sourceMovementPlacement: structuredClone(input.movementPlacement),
    sourceVerificationEvents: structuredClone(placementEvents),
    collected: events.length,
    resolved: resolvedEvents.length,
    supports,
    reviews,
    needsMoreEvidence,
    excludedOtherMovementChecks,
    pendingRecovery,
    reassessmentRequired,
    criteria,
    reasons,
    limitations: [
      `This checkpoint interprets only source-linked productive checks for the exact ${input.movementPlacement.exerciseName} identity inside this placement version.`,
      ...(excludedOtherMovementChecks ? [`${excludedOtherMovementChecks} other-movement check${excludedOtherMovementChecks === 1 ? ' was' : 's were'} excluded from this lane.`] : []),
      'Movement-family context, neighboring variations, and the overall plan route lend no confirmation evidence to this exact movement lane.',
      'The recommendation does not change load, progression, placement, or programming until the athlete completes an explicit reassessment.'
    ]
  }
}

const isDate = (value: unknown) => typeof value === 'string' && !Number.isNaN(new Date(value).getTime())

export function placementExitAssessmentError(value: unknown): string | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return 'Placement exit assessment must be a structured record.'
  const assessment = value as Partial<PlacementExitAssessment>
  if (assessment.ruleVersion !== placementExitRuleVersion || !isDate(assessment.placementCreatedAt) || !isDate(assessment.assessedAt)) return 'Placement exit assessment has invalid rule or date provenance.'
  const placementError = placementAssessmentError(assessment.sourcePlacement)
  if (placementError) return `Placement exit source placement is invalid: ${placementError}`
  if (!Array.isArray(assessment.sourceVerificationEvents) || assessment.sourceVerificationEvents.some((event) => placementVerificationError(event))) return 'Placement exit assessment has invalid source verification evidence.'
  const sourcePlacement = assessment.sourcePlacement as AthletePlacementAssessment
  if (assessment.placementCreatedAt !== sourcePlacement.createdAt || assessment.currentRoute !== sourcePlacement.selectedRoute) return 'Placement exit assessment does not match its source placement identity.'
  if (assessment.sourceVerificationEvents.some((event) => event.placementCreatedAt !== assessment.placementCreatedAt)) return 'Placement exit assessment includes evidence from another placement version.'
  const replay = buildPlacementExitAssessment({ placement: sourcePlacement, verificationEvents: assessment.sourceVerificationEvents, assessedAt: assessment.assessedAt })
  if (!sameJsonValue(replay, assessment)) return 'Placement exit assessment does not reconcile with its source evidence.'
  return null
}

export function placementExitReviewError(value: unknown): string | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return 'Placement exit review must be a structured record.'
  const review = value as Partial<PlacementExitReviewEvent>
  if (review.ruleVersion !== placementExitReviewRuleVersion || typeof review.id !== 'string' || !review.id || !isDate(review.placementCreatedAt) || !isDate(review.createdAt)) return 'Placement exit review has invalid identity or date provenance.'
  if (!['continue-current', 'reassess-now', 'defer'].includes(String(review.decision)) || typeof review.reason !== 'string' || !review.reason.trim()) return 'Placement exit review has an invalid athlete decision or reason.'
  const assessmentError = placementExitAssessmentError(review.assessment)
  if (assessmentError) return `Placement exit review assessment is invalid: ${assessmentError}`
  if (review.assessment?.placementCreatedAt !== review.placementCreatedAt) return 'Placement exit review does not match its assessed placement version.'
  if (review.assessment?.reassessmentRequired && review.decision === 'continue-current') return 'Pain-changing placement evidence cannot be confirmed as safe to continue.'
  return null
}

export function movementPlacementExitAssessmentError(value: unknown): string | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return 'Movement placement exit assessment must be a structured record.'
  const assessment = value as Partial<MovementPlacementExitAssessment>
  if (assessment.ruleVersion !== movementPlacementExitRuleVersion || !isDate(assessment.placementCreatedAt) || !isDate(assessment.assessedAt) || typeof assessment.exerciseId !== 'string' || typeof assessment.exerciseName !== 'string') return 'Movement placement exit assessment has invalid rule, identity, or date provenance.'
  const placementError = placementAssessmentError(assessment.sourcePlacement)
  if (placementError) return `Movement placement exit source placement is invalid: ${placementError}`
  if (!assessment.sourceMovementPlacement || !sameJsonValue((assessment.sourcePlacement as AthletePlacementAssessment).movementPlacements?.find((movement) => movement.exerciseId === assessment.exerciseId), assessment.sourceMovementPlacement)) return 'Movement placement exit assessment does not match its source movement placement.'
  if (!Array.isArray(assessment.sourceVerificationEvents) || assessment.sourceVerificationEvents.some((event) => placementVerificationError(event))) return 'Movement placement exit assessment has invalid source verification evidence.'
  const sourcePlacement = assessment.sourcePlacement as AthletePlacementAssessment
  if (assessment.placementCreatedAt !== sourcePlacement.createdAt || assessment.currentRoute !== assessment.sourceMovementPlacement.selectedRoute || assessment.exerciseName !== assessment.sourceMovementPlacement.exerciseName) return 'Movement placement exit assessment does not match its source identity.'
  if (assessment.sourceVerificationEvents.some((event) => event.placementCreatedAt !== assessment.placementCreatedAt)) return 'Movement placement exit assessment includes evidence from another placement version.'
  const replay = buildMovementPlacementExitAssessment({ placement: sourcePlacement, movementPlacement: assessment.sourceMovementPlacement, verificationEvents: assessment.sourceVerificationEvents, assessedAt: assessment.assessedAt })
  if (!sameJsonValue(replay, assessment)) return 'Movement placement exit assessment does not reconcile with its source evidence.'
  return null
}

export function movementPlacementExitReviewError(value: unknown): string | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return 'Movement placement exit review must be a structured record.'
  const review = value as Partial<MovementPlacementExitReviewEvent>
  if (review.ruleVersion !== movementPlacementExitReviewRuleVersion || typeof review.id !== 'string' || !review.id || typeof review.exerciseId !== 'string' || !isDate(review.placementCreatedAt) || !isDate(review.createdAt)) return 'Movement placement exit review has invalid identity or date provenance.'
  if (!['continue-current', 'reassess-now', 'defer'].includes(String(review.decision)) || typeof review.reason !== 'string' || !review.reason.trim()) return 'Movement placement exit review has an invalid athlete decision or reason.'
  const assessmentError = movementPlacementExitAssessmentError(review.assessment)
  if (assessmentError) return `Movement placement exit review assessment is invalid: ${assessmentError}`
  if (review.assessment?.placementCreatedAt !== review.placementCreatedAt || review.assessment?.exerciseId !== review.exerciseId) return 'Movement placement exit review does not match its assessed movement lane.'
  if (review.assessment?.reassessmentRequired && review.decision === 'continue-current') return 'Pain-changing movement evidence cannot be confirmed as safe to continue.'
  return null
}
