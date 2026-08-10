import type {
  AthletePlacementAssessment,
  PlacementExitAssessment,
  PlacementExitCriterion,
  PlacementExitReviewEvent,
  PlacementGoal,
  PlacementRoute,
  PlacementVerificationEvent
} from './types'
import { placementAssessmentError } from './placement-engine'
import { placementVerificationError } from './placement-verification-engine'

export const placementExitRuleVersion = 'placement-exit-v1' as const
export const placementExitReviewRuleVersion = 'placement-exit-review-v1' as const

const transitionalRoutes = new Set<PlacementRoute>(['introductory-skill', 'reacclimation', 'bridge-calibration', 'base-building'])

const goalRoute = (goal: PlacementGoal | null): PlacementRoute | null => {
  if (goal === 'strength') return 'strength'
  if (goal === 'hypertrophy') return 'hypertrophy'
  if (goal === 'powerbuilding') return 'powerbuilding'
  if (goal === 'power') return 'power'
  if (goal === 'event-specific') return 'event-specific'
  return null
}

const advancementRoute = (placement: AthletePlacementAssessment): PlacementRoute | null => {
  if (placement.selectedRoute === 'introductory-skill') return 'bridge-calibration'
  if (placement.selectedRoute === 'reacclimation' || placement.selectedRoute === 'bridge-calibration') return 'base-building'
  if (placement.selectedRoute === 'base-building') return goalRoute(placement.inputs.goal)
  return placement.selectedRoute
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
    const nextRoute = advancementRoute(input.placement)
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
  if (JSON.stringify(replay) !== JSON.stringify(assessment)) return 'Placement exit assessment does not reconcile with its source evidence.'
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
