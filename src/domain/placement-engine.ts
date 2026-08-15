import type {
  AthletePlacementAssessment,
  AthleteProfile,
  MovementPlacementAssessment,
  MovementPlacementInput,
  PlacementDecision,
  PlacementGoal,
  PlacementInputs,
  PlacementRoute
} from './types'
import { placementHistoryEvidenceError } from './placement-history-engine'
import { sameJsonValue } from './stable-json'

export const placementRuleVersion = 'placement-v3' as const
export const previousPlacementRuleVersion = 'placement-v2' as const
export const legacyPlacementRuleVersion = 'placement-v1' as const
export const movementPlacementRuleVersion = 'movement-placement-v2' as const
export const previousMovementPlacementRuleVersion = 'movement-placement-v1' as const

export const placementRouteLabels: Record<PlacementRoute, string> = {
  'introductory-skill': 'Skill-Building Cycle',
  reacclimation: 'Easing Back In',
  'bridge-calibration': 'Finding Your Working Weights',
  'base-building': 'Building a Base',
  hypertrophy: 'Muscle Growth',
  powerbuilding: 'Strength and Size',
  strength: 'Strength',
  power: 'Power and Speed',
  'event-specific': 'Meet Preparation',
  'pain-aware-modified': 'Working Around Pain'
}

// Route copy was renamed on 2026-08-12 without a rule-version bump, so placement evidence saved
// before that rename replays against this earlier vocabulary instead of the current labels.
export const legacyPlacementRouteLabels: Record<PlacementRoute, string> = {
  'introductory-skill': 'Introductory Skill Cycle',
  reacclimation: 'Reacclimation and Productive Work',
  'bridge-calibration': 'Bridge and Calibration Cycle',
  'base-building': 'Base-Building Cycle',
  hypertrophy: 'Direct Hypertrophy Development',
  powerbuilding: 'Direct Powerbuilding Development',
  strength: 'Direct Strength Development',
  power: 'Direct Power Development',
  'event-specific': 'Event-Specific Development',
  'pain-aware-modified': 'Pain-Aware Modified Entry'
}

const clampDimension = (value: number | null, fallback = 3) => Math.max(1, Math.min(5, value ?? fallback))

const continuityScore = (continuity: PlacementInputs['continuity']) => continuity === 'stable' ? 5 : continuity === 'interrupted' ? 3 : continuity === 'returning' ? 1 : 3

const experienceScore = (trainingAge: number | null) => trainingAge === null ? 3 : trainingAge < 1 ? 1 : trainingAge < 2 ? 2 : trainingAge < 4 ? 3 : trainingAge < 7 ? 4 : 5

const goalRoute = (goal: PlacementGoal | null): PlacementRoute => {
  if (goal === 'strength') return 'strength'
  if (goal === 'hypertrophy') return 'hypertrophy'
  if (goal === 'power') return 'power'
  if (goal === 'event-specific') return 'event-specific'
  if (goal === 'return-to-training') return 'reacclimation'
  return 'powerbuilding'
}

const conservativeRoute = (route: PlacementRoute): PlacementRoute => {
  if (route === 'pain-aware-modified' || route === 'introductory-skill' || route === 'reacclimation') return route
  if (route === 'bridge-calibration') return 'reacclimation'
  if (route === 'base-building') return 'bridge-calibration'
  return 'base-building'
}

function selectedRouteFor(inputs: PlacementInputs, dimensions: AthletePlacementAssessment['dimensions']): PlacementRoute {
  if (inputs.painState === 'modifying') return 'pain-aware-modified'
  if (inputs.goal === 'return-to-training' || inputs.continuity === 'returning') return 'reacclimation'
  if (dimensions.experience <= 1 || dimensions.movementSkill <= 1) return 'introductory-skill'
  if (dimensions.dataConfidence <= 2 || inputs.continuity === null || inputs.goal === null) return 'bridge-calibration'
  if (dimensions.scheduleStability <= 2 || dimensions.volumeTolerance <= 2 || dimensions.strengthTolerance <= 2) return 'base-building'

  const desired = goalRoute(inputs.goal)
  if (desired === 'power' && !(dimensions.experience >= 4 && dimensions.movementSkill >= 4 && dimensions.strengthTolerance >= 4 && inputs.continuity === 'stable')) return 'base-building'
  if (desired === 'strength' && !(dimensions.experience >= 3 && dimensions.movementSkill >= 3 && dimensions.strengthTolerance >= 3)) return 'bridge-calibration'
  if (desired === 'event-specific' && (!inputs.fixedEvent || dimensions.movementSkill < 3 || dimensions.strengthTolerance < 3)) return 'bridge-calibration'
  return desired
}

function reasonsFor(inputs: PlacementInputs, route: PlacementRoute, dimensions: AthletePlacementAssessment['dimensions']) {
  const reasons: string[] = []
  if (route === 'pain-aware-modified') reasons.push('Current pain or restriction changes what can be trained safely and productively.')
  if (route === 'reacclimation') reasons.push('Past skill is preserved, but recent tolerance needs productive confirmation after a meaningful interruption.')
  if (route === 'introductory-skill') reasons.push('Current structured experience or movement skill supports technique-first progression before heavier loading.')
  if (route === 'bridge-calibration') reasons.push('Current evidence is not strong enough to justify a more specific direct-entry cycle yet.')
  if (route === 'base-building') reasons.push('Current schedule, intensity tolerance, or volume tolerance favors rebuilding repeatable training capacity first.')
  if (['strength', 'power', 'hypertrophy', 'powerbuilding', 'event-specific'].includes(route)) reasons.push('Current experience, skill, tolerance, continuity, and evidence support direct goal-specific work.')
  if (dimensions.experience >= 4) reasons.push('Long-term experience remains an asset and is not erased by recent schedule disruption.')
  if (inputs.weeklyOpportunities <= 3) reasons.push(`The route must remain productive within ${inputs.weeklyOpportunities} realistic weekly opportunities.`)
  if (inputs.painState === 'manageable') reasons.push('A manageable known joint concern should be monitored without automatically discarding productive training.')
  return reasons.slice(0, 4)
}

function uncertaintyFor(inputs: PlacementInputs) {
  const labels: Array<[keyof PlacementInputs, string]> = [
    ['goal', 'current goal'], ['trainingAge', 'structured training history'], ['continuity', 'recent continuity'],
    ['movementSkill', 'movement skill'], ['strengthTolerance', 'intensity tolerance'], ['volumeTolerance', 'volume tolerance'],
    ['scheduleStability', 'schedule stability'], ['dataConfidence', 'current performance evidence']
  ]
  const uncertain = labels.filter(([key]) => inputs[key] === null).map(([, label]) => label)
  if (inputs.painState === 'unknown') uncertain.push('pain or restriction state')
  return [...new Set([...uncertain, ...inputs.skippedFields])]
}

function confidenceFor(uncertain: string[]): AthletePlacementAssessment['confidence'] {
  if (uncertain.length <= 1) return 'high'
  if (uncertain.length <= 4) return 'medium'
  return 'low'
}

function verificationFor(route: PlacementRoute) {
  const shared = ['Use submaximal warm-ups and first work sets to compare actual RIR, technique, pain, and time fit with the estimate.', 'Review completion and next-day recovery across the first one to three productive sessions.']
  if (route === 'introductory-skill') return ['Establish repeatable setup and range before load progression.', ...shared]
  if (route === 'reacclimation') return ['Use familiar movements at conservative effort to confirm retained skill and current tolerance.', ...shared]
  if (route === 'bridge-calibration') return ['Collect one to three representative, non-maximal performance exposures before a more specific cycle.', ...shared]
  if (route === 'pain-aware-modified') return ['Do not use the placement as medical clearance. Review restrictions and movement choices before starting.', 'Stop or modify work when symptoms meaningfully worsen, and seek qualified care for new, severe, or unexplained pain.', ...shared]
  return ['Confirm that goal-specific work remains technically repeatable and recoverable before escalating dose.', ...shared]
}

function exitCriteriaFor(route: PlacementRoute) {
  if (route === 'introductory-skill') return ['Repeatable technique across two productive exposures', 'No meaningful symptom escalation', 'Targets fit the available session time']
  if (route === 'reacclimation') return ['Two to three recoverable exposures on familiar movements', 'Stable technique and effort estimates', 'No forced catch-up work']
  if (route === 'bridge-calibration') return ['Representative performance evidence for primary movement families', 'Usable RIR and recovery feedback', 'Enough confidence to select a specific development route']
  if (route === 'pain-aware-modified') return ['Restrictions and movement choices reviewed', 'Symptoms stable or improving within an appropriate plan', 'Qualified guidance obtained when indicated']
  return ['Goal-specific work remains repeatable and recoverable', 'Primary movement quality stays stable', 'Cycle success criteria are met without rising pain or schedule failure']
}

function movementRouteFor(input: MovementPlacementInput, planRoute: PlacementRoute, placementInputs: PlacementInputs): PlacementRoute {
  if (planRoute === 'pain-aware-modified') return 'pain-aware-modified'
  if (planRoute === 'reacclimation' || placementInputs.continuity === 'returning') return 'reacclimation'
  if (input.movementSkill !== null && input.movementSkill <= 1) return 'introductory-skill'
  if (input.movementSkill === null || input.strengthTolerance === null || input.dataConfidence === null) return 'bridge-calibration'
  if (input.movementSkill <= 2 || input.strengthTolerance <= 2 || input.dataConfidence <= 2) return 'bridge-calibration'
  return planRoute
}

function movementPlacementFor(input: MovementPlacementInput, planRoute: PlacementRoute, placementInputs: PlacementInputs, ruleVersion: MovementPlacementAssessment['ruleVersion'], routeLabels: Record<PlacementRoute, string>): MovementPlacementAssessment {
  const uncertainInputs = [
    ...(input.movementSkill === null ? ['movement skill'] : []),
    ...(input.strengthTolerance === null ? ['current intensity tolerance'] : []),
    ...(input.dataConfidence === null ? ['recent exact-movement evidence'] : [])
  ]
  const recommendedRoute = movementRouteFor(input, planRoute, placementInputs)
  const reasons: string[] = []
  if (recommendedRoute === 'introductory-skill') reasons.push(`${input.exerciseName} is new or not yet repeatable enough for direct goal-specific loading.`)
  else if (recommendedRoute === 'bridge-calibration') reasons.push(`${input.exerciseName} needs exact-movement calibration before it shares the cycle's more specific loading.`)
  else if (recommendedRoute === 'reacclimation') reasons.push(`${input.exerciseName} preserves past skill while recent tolerance is re-established.`)
  else if (recommendedRoute === 'pain-aware-modified') reasons.push(`${input.exerciseName} remains behind the current restriction review gate.`)
  else reasons.push(`${input.exerciseName} has enough current skill, tolerance, and evidence to use the cycle's ${routeLabels[planRoute]}.`)
  if (ruleVersion === movementPlacementRuleVersion && input.historyReview?.acceptedFields.length) reasons.push(`Athlete-reviewed exact history informed ${input.historyReview.acceptedFields.map((field) => field === 'dataConfidence' ? 'evidence confidence' : 'heavy-work tolerance').join(' and ')} without inferring movement skill or pain.`)
  reasons.push(`${input.family} is the movement-family context, while ${input.exerciseName} keeps its own history and starting route.`)
  return {
    ruleVersion,
    exerciseId: input.exerciseId,
    exerciseName: input.exerciseName.trim(),
    family: input.family.trim(),
    movementSkill: clampDimension(input.movementSkill),
    strengthTolerance: clampDimension(input.strengthTolerance),
    dataConfidence: clampDimension(input.dataConfidence),
    recommendedRoute,
    selectedRoute: recommendedRoute,
    confidence: confidenceFor(uncertainInputs),
    reasons,
    uncertainInputs,
    ...(ruleVersion === movementPlacementRuleVersion && input.historyReview ? { historyReview: structuredClone(input.historyReview) } : {})
  }
}

function buildPlacementAssessmentVersion(inputs: PlacementInputs, createdAt: string, ruleVersion: AthletePlacementAssessment['ruleVersion'], routeLabels: Record<PlacementRoute, string> = placementRouteLabels): AthletePlacementAssessment {
  const dimensions = {
    experience: experienceScore(inputs.trainingAge),
    recentContinuity: continuityScore(inputs.continuity),
    movementSkill: clampDimension(inputs.movementSkill),
    strengthTolerance: clampDimension(inputs.strengthTolerance),
    volumeTolerance: clampDimension(inputs.volumeTolerance),
    scheduleStability: clampDimension(inputs.scheduleStability),
    dataConfidence: clampDimension(inputs.dataConfidence)
  }
  const recommendedRoute = selectedRouteFor(inputs, dimensions)
  const hasMovementPlacement = ruleVersion === placementRuleVersion || ruleVersion === previousPlacementRuleVersion
  const movementUncertainty = hasMovementPlacement
    ? (inputs.movementProfiles ?? []).flatMap((profile) => [
        ...(profile.movementSkill === null ? [`${profile.exerciseName} movement skill`] : []),
        ...(profile.strengthTolerance === null ? [`${profile.exerciseName} intensity tolerance`] : []),
        ...(profile.dataConfidence === null ? [`${profile.exerciseName} current evidence`] : [])
      ])
    : []
  const uncertainInputs = [...new Set([...uncertaintyFor(inputs), ...movementUncertainty])]
  const movementPlacements = hasMovementPlacement
    ? (inputs.movementProfiles ?? []).map((input) => movementPlacementFor(input, recommendedRoute, inputs, ruleVersion === placementRuleVersion ? movementPlacementRuleVersion : previousMovementPlacementRuleVersion, routeLabels))
    : undefined
  return {
    ruleVersion,
    createdAt,
    inputs: structuredClone(inputs),
    dimensions,
    recommendedRoute,
    selectedRoute: recommendedRoute,
    confidence: confidenceFor(uncertainInputs),
    decision: 'confirmed',
    reasons: reasonsFor(inputs, recommendedRoute, dimensions),
    uncertainInputs,
    verificationPlan: verificationFor(recommendedRoute),
    whyNotLower: dimensions.experience >= 3 && dimensions.movementSkill >= 3 ? 'Current experience and skill do not support resetting you to a generic beginner route.' : 'No lower route is needed unless early technique, pain, or recovery evidence contradicts this estimate.',
    whyNotHigher: recommendedRoute === goalRoute(inputs.goal) ? 'A higher route would not better match the stated goal.' : 'A more specific route needs stronger current evidence, stability, skill, or tolerance first.',
    exitCriteria: exitCriteriaFor(recommendedRoute),
    ...(movementPlacements ? { movementPlacements } : {})
  }
}

export function buildPlacementAssessment(inputs: PlacementInputs, createdAt = new Date().toISOString()): AthletePlacementAssessment {
  return buildPlacementAssessmentVersion(inputs, createdAt, placementRuleVersion)
}

export function applyPlacementDecision(assessment: AthletePlacementAssessment, decision: PlacementDecision): AthletePlacementAssessment {
  if (decision === 'conservative') {
    const selectedRoute = conservativeRoute(assessment.recommendedRoute)
    return {
      ...assessment,
      selectedRoute,
      decision,
      verificationPlan: verificationFor(selectedRoute),
      exitCriteria: exitCriteriaFor(selectedRoute),
      ...(assessment.movementPlacements ? { movementPlacements: assessment.movementPlacements.map((movement) => ({ ...movement, selectedRoute: conservativeRoute(movement.recommendedRoute) })) } : {})
    }
  }
  if (decision === 'quick-start') return {
    ...assessment,
    decision,
    confidence: 'low',
    uncertainInputs: [...new Set([...assessment.uncertainInputs, 'unconfirmed Quick Start defaults'])],
    ...(assessment.movementPlacements ? { movementPlacements: assessment.movementPlacements.map((movement) => ({ ...movement, confidence: 'low' as const, uncertainInputs: [...new Set([...movement.uncertainInputs, 'unconfirmed Quick Start defaults'])] })) } : {})
  }
  if (decision === 'aggressive-test') return {
    ...assessment,
    decision,
    verificationPlan: ['Use the earliest productive session as a faster submaximal route-confirmation test. Do not require a maximal attempt or bypass pain constraints.', ...assessment.verificationPlan]
  }
  return {
    ...assessment,
    selectedRoute: assessment.recommendedRoute,
    decision,
    ...(assessment.movementPlacements ? { movementPlacements: assessment.movementPlacements.map((movement) => ({ ...movement, selectedRoute: movement.recommendedRoute })) } : {})
  }
}

export function legacyPlacementForAthlete(athlete: Partial<AthleteProfile>, createdAt = '2026-08-10T00:00:00.000Z') {
  return buildPlacementAssessmentVersion({
    goal: athlete.goal?.toLowerCase().includes('return') ? 'return-to-training' : athlete.goal?.toLowerCase().includes('strength') ? 'strength' : 'powerbuilding',
    fixedEvent: null,
    trainingAge: typeof athlete.trainingAge === 'number' ? athlete.trainingAge : null,
    continuity: athlete.continuity ?? null,
    movementSkill: athlete.level?.movementSkill ?? athlete.level?.strengthTolerance ?? null,
    strengthTolerance: athlete.level?.strengthTolerance ?? null,
    volumeTolerance: athlete.level?.volumeTolerance ?? null,
    scheduleStability: athlete.level?.scheduleStability ?? null,
    dataConfidence: athlete.level?.dataConfidence ?? null,
    painState: 'unknown',
    weeklyOpportunities: athlete.weeklyOpportunities ?? 3,
    defaultMinutes: athlete.defaultMinutes ?? 60,
    equipmentProfileId: 'equipment-commercial-gym',
    skippedFields: ['legacy placement evidence']
  }, createdAt, legacyPlacementRuleVersion)
}

export function movementPlacementEvidenceError(value: unknown): string | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return 'Movement placement must be a structured record.'
  const movement = value as Partial<MovementPlacementAssessment>
  const routes = Object.keys(placementRouteLabels)
  if (movement.ruleVersion !== movementPlacementRuleVersion && movement.ruleVersion !== previousMovementPlacementRuleVersion) return 'Movement placement has an unsupported rule version.'
  if (typeof movement.exerciseId !== 'string' || !movement.exerciseId.trim() || typeof movement.exerciseName !== 'string' || !movement.exerciseName.trim() || typeof movement.family !== 'string' || !movement.family.trim()) return 'Movement placement has incomplete identity evidence.'
  if (![movement.movementSkill, movement.strengthTolerance, movement.dataConfidence].every((score) => Number.isInteger(score) && Number(score) >= 1 && Number(score) <= 5)) return 'Movement placement scores must be integers from one to five.'
  if (!routes.includes(String(movement.recommendedRoute)) || !routes.includes(String(movement.selectedRoute))) return 'Movement placement has an unsupported route.'
  if (!['low', 'medium', 'high'].includes(String(movement.confidence))) return 'Movement placement has an invalid confidence state.'
  if (!Array.isArray(movement.reasons) || movement.reasons.some((reason) => typeof reason !== 'string') || !Array.isArray(movement.uncertainInputs) || movement.uncertainInputs.some((item) => typeof item !== 'string')) return 'Movement placement evidence lists are invalid.'
  if (movement.ruleVersion === previousMovementPlacementRuleVersion && movement.historyReview !== undefined) return 'Movement-placement-v1 cannot invent history-review evidence.'
  if (movement.ruleVersion === movementPlacementRuleVersion && movement.historyReview !== undefined) {
    const review = movement.historyReview
    const evidenceError = placementHistoryEvidenceError(review.evidence)
    if (evidenceError) return `Movement placement history review is invalid: ${evidenceError}`
    if (!Array.isArray(review.acceptedFields) || review.acceptedFields.length === 0 || review.acceptedFields.some((field) => !['dataConfidence', 'strengthTolerance'].includes(field)) || new Set(review.acceptedFields).size !== review.acceptedFields.length) return 'Movement placement history review has invalid accepted fields.'
    if (typeof review.reviewedAt !== 'string' || Number.isNaN(new Date(review.reviewedAt).getTime())) return 'Movement placement history review has an invalid review date.'
    if (review.evidence.exerciseId !== movement.exerciseId) return 'Movement placement history review belongs to a different exercise.'
    if (review.acceptedFields.includes('dataConfidence') && review.evidence.suggestedDataConfidence !== movement.dataConfidence) return 'Movement placement evidence confidence does not match the accepted history suggestion.'
    if (review.acceptedFields.includes('strengthTolerance') && review.evidence.suggestedStrengthTolerance !== movement.strengthTolerance) return 'Movement placement tolerance does not match the accepted history suggestion.'
  }
  return null
}

export function placementAssessmentError(value: unknown): string | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return 'Placement assessment must be a structured record.'
  const assessment = value as Partial<AthletePlacementAssessment>
  const routes = Object.keys(placementRouteLabels)
  if (assessment.ruleVersion !== legacyPlacementRuleVersion && assessment.ruleVersion !== previousPlacementRuleVersion && assessment.ruleVersion !== placementRuleVersion) return 'Placement assessment has an unsupported rule version.'
  if (typeof assessment.createdAt !== 'string' || Number.isNaN(new Date(assessment.createdAt).getTime())) return 'Placement assessment needs a valid creation date.'
  if (!assessment.inputs || typeof assessment.inputs !== 'object') return 'Placement assessment is missing its input evidence.'
  const inputs = assessment.inputs as Partial<PlacementInputs>
  if (!(inputs.goal === null || ['powerbuilding', 'strength', 'hypertrophy', 'power', 'event-specific', 'return-to-training'].includes(String(inputs.goal)))) return 'Placement assessment has an invalid goal input.'
  if (!(inputs.fixedEvent === null || typeof inputs.fixedEvent === 'string')) return 'Placement assessment has an invalid event input.'
  if (!(inputs.trainingAge === null || (typeof inputs.trainingAge === 'number' && Number.isFinite(inputs.trainingAge) && inputs.trainingAge >= 0 && inputs.trainingAge <= 60))) return 'Placement assessment has an invalid training-history input.'
  if (!(inputs.continuity === null || ['stable', 'interrupted', 'returning'].includes(String(inputs.continuity)))) return 'Placement assessment has an invalid continuity input.'
  if (['movementSkill', 'strengthTolerance', 'volumeTolerance', 'scheduleStability', 'dataConfidence'].some((key) => !((inputs[key as keyof PlacementInputs] === null) || (Number.isInteger(inputs[key as keyof PlacementInputs]) && Number(inputs[key as keyof PlacementInputs]) >= 1 && Number(inputs[key as keyof PlacementInputs]) <= 5)))) return 'Placement assessment has an invalid one-to-five input.'
  if (!['none', 'manageable', 'modifying', 'unknown'].includes(String(inputs.painState))) return 'Placement assessment has an invalid pain-state input.'
  if (!Number.isInteger(inputs.weeklyOpportunities) || Number(inputs.weeklyOpportunities) < 1 || Number(inputs.weeklyOpportunities) > 7 || !Number.isFinite(inputs.defaultMinutes) || Number(inputs.defaultMinutes) < 5 || Number(inputs.defaultMinutes) > 300) return 'Placement assessment has invalid schedule capacity.'
  if (typeof inputs.equipmentProfileId !== 'string' || !inputs.equipmentProfileId || !Array.isArray(inputs.skippedFields) || inputs.skippedFields.some((item) => typeof item !== 'string')) return 'Placement assessment has invalid equipment or skipped-input evidence.'
  if (inputs.movementProfiles !== undefined) {
    if (!Array.isArray(inputs.movementProfiles) || inputs.movementProfiles.some((profile) => typeof profile !== 'object' || profile === null)) return 'Placement assessment has invalid movement-profile input evidence.'
    const profiles = inputs.movementProfiles as MovementPlacementInput[]
    if (new Set(profiles.map((profile) => profile.exerciseId)).size !== profiles.length) return 'Placement assessment has duplicate movement-profile identities.'
    if (profiles.some((profile) => typeof profile.exerciseId !== 'string' || !profile.exerciseId.trim() || typeof profile.exerciseName !== 'string' || !profile.exerciseName.trim() || typeof profile.family !== 'string' || !profile.family.trim())) return 'Placement assessment has incomplete movement-profile identity evidence.'
    if (profiles.some((profile) => ['movementSkill', 'strengthTolerance', 'dataConfidence'].some((key) => !((profile[key as keyof MovementPlacementInput] === null) || (Number.isInteger(profile[key as keyof MovementPlacementInput]) && Number(profile[key as keyof MovementPlacementInput]) >= 1 && Number(profile[key as keyof MovementPlacementInput]) <= 5))))) return 'Placement assessment has an invalid per-movement one-to-five input.'
    if (assessment.ruleVersion !== placementRuleVersion && profiles.some((profile) => profile.historyReview !== undefined)) return 'Earlier placement versions cannot invent history-review evidence.'
    if (assessment.ruleVersion === placementRuleVersion) {
      for (const profile of profiles) {
        if (!profile.historyReview) continue
        const evidenceError = placementHistoryEvidenceError(profile.historyReview.evidence)
        if (evidenceError) return `Placement movement input history review is invalid: ${evidenceError}`
        if (!Array.isArray(profile.historyReview.acceptedFields) || profile.historyReview.acceptedFields.length === 0 || profile.historyReview.acceptedFields.some((field) => !['dataConfidence', 'strengthTolerance'].includes(field)) || new Set(profile.historyReview.acceptedFields).size !== profile.historyReview.acceptedFields.length) return 'Placement movement input history review has invalid accepted fields.'
        if (profile.historyReview.evidence.exerciseId !== profile.exerciseId) return 'Placement movement input history review belongs to a different exercise.'
        if (profile.historyReview.acceptedFields.includes('dataConfidence') && profile.dataConfidence !== profile.historyReview.evidence.suggestedDataConfidence) return 'Placement movement input evidence confidence does not match its accepted history suggestion.'
        if (profile.historyReview.acceptedFields.includes('strengthTolerance') && profile.strengthTolerance !== profile.historyReview.evidence.suggestedStrengthTolerance) return 'Placement movement input tolerance does not match its accepted history suggestion.'
      }
    }
  }
  if (!assessment.dimensions || Object.values(assessment.dimensions).length !== 7 || Object.values(assessment.dimensions).some((item) => !Number.isInteger(item) || item < 1 || item > 5)) return 'Placement dimensions must all be integers from one to five.'
  if (!routes.includes(String(assessment.recommendedRoute)) || !routes.includes(String(assessment.selectedRoute))) return 'Placement assessment has an unsupported route.'
  if (!['low', 'medium', 'high'].includes(String(assessment.confidence))) return 'Placement assessment has an invalid confidence state.'
  if (!['confirmed', 'conservative', 'aggressive-test', 'quick-start'].includes(String(assessment.decision))) return 'Placement assessment has an invalid athlete decision.'
  if (![assessment.reasons, assessment.uncertainInputs, assessment.verificationPlan, assessment.exitCriteria].every((list) => Array.isArray(list) && list.every((item) => typeof item === 'string'))) return 'Placement assessment evidence lists are invalid.'
  if (typeof assessment.whyNotLower !== 'string' || typeof assessment.whyNotHigher !== 'string') return 'Placement assessment is missing route comparisons.'
  if (assessment.ruleVersion === placementRuleVersion || assessment.ruleVersion === previousPlacementRuleVersion) {
    if (!Array.isArray(assessment.movementPlacements)) return `${assessment.ruleVersion} assessment is missing per-movement placement evidence.`
    if (assessment.movementPlacements.length !== (inputs.movementProfiles?.length ?? 0)) return 'Per-movement placement evidence does not match its inputs.'
    if (assessment.movementPlacements.some((movement) => movementPlacementEvidenceError(movement))) return 'Per-movement placement evidence is invalid.'
    const expectedMovementRule = assessment.ruleVersion === placementRuleVersion ? movementPlacementRuleVersion : previousMovementPlacementRuleVersion
    if (assessment.movementPlacements.some((movement) => movement.ruleVersion !== expectedMovementRule)) return 'Per-movement placement evidence uses the wrong rule version.'
  } else if (assessment.movementPlacements !== undefined || inputs.movementProfiles !== undefined) return 'Legacy placement cannot invent per-movement evidence.'
  const reconcilesWith = (routeLabels: Record<PlacementRoute, string>) => {
    const replay = applyPlacementDecision(buildPlacementAssessmentVersion(inputs as PlacementInputs, assessment.createdAt as string, assessment.ruleVersion as AthletePlacementAssessment['ruleVersion'], routeLabels), assessment.decision as PlacementDecision)
    return sameJsonValue(assessment.dimensions, replay.dimensions) && assessment.recommendedRoute === replay.recommendedRoute && assessment.selectedRoute === replay.selectedRoute && assessment.confidence === replay.confidence && sameJsonValue(assessment.reasons, replay.reasons) && sameJsonValue(assessment.uncertainInputs, replay.uncertainInputs) && sameJsonValue(assessment.verificationPlan, replay.verificationPlan) && assessment.whyNotLower === replay.whyNotLower && assessment.whyNotHigher === replay.whyNotHigher && sameJsonValue(assessment.exitCriteria, replay.exitCriteria) && sameJsonValue(assessment.movementPlacements, replay.movementPlacements)
  }
  if (!reconcilesWith(placementRouteLabels) && !reconcilesWith(legacyPlacementRouteLabels)) return `Placement assessment does not reconcile with ${assessment.ruleVersion} input evidence.`
  return null
}
