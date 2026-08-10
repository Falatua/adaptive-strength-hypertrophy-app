import type {
  AthletePlacementAssessment,
  AthleteProfile,
  PlacementDecision,
  PlacementGoal,
  PlacementInputs,
  PlacementRoute
} from './types'

export const placementRuleVersion = 'placement-v1' as const

export const placementRouteLabels: Record<PlacementRoute, string> = {
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

export function buildPlacementAssessment(inputs: PlacementInputs, createdAt = new Date().toISOString()): AthletePlacementAssessment {
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
  const uncertainInputs = uncertaintyFor(inputs)
  return {
    ruleVersion: placementRuleVersion,
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
    exitCriteria: exitCriteriaFor(recommendedRoute)
  }
}

export function applyPlacementDecision(assessment: AthletePlacementAssessment, decision: PlacementDecision): AthletePlacementAssessment {
  if (decision === 'conservative') {
    const selectedRoute = conservativeRoute(assessment.recommendedRoute)
    return { ...assessment, selectedRoute, decision, verificationPlan: verificationFor(selectedRoute), exitCriteria: exitCriteriaFor(selectedRoute) }
  }
  if (decision === 'quick-start') return {
    ...assessment,
    decision,
    confidence: 'low',
    uncertainInputs: [...new Set([...assessment.uncertainInputs, 'unconfirmed Quick Start defaults'])]
  }
  if (decision === 'aggressive-test') return {
    ...assessment,
    decision,
    verificationPlan: ['Use the earliest productive session as a faster submaximal route-confirmation test. Do not require a maximal attempt or bypass pain constraints.', ...assessment.verificationPlan]
  }
  return { ...assessment, selectedRoute: assessment.recommendedRoute, decision }
}

export function legacyPlacementForAthlete(athlete: Partial<AthleteProfile>, createdAt = '2026-08-10T00:00:00.000Z') {
  return buildPlacementAssessment({
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
  }, createdAt)
}

export function placementAssessmentError(value: unknown): string | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return 'Placement assessment must be a structured record.'
  const assessment = value as Partial<AthletePlacementAssessment>
  const routes = Object.keys(placementRouteLabels)
  if (assessment.ruleVersion !== placementRuleVersion) return 'Placement assessment has an unsupported rule version.'
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
  if (!assessment.dimensions || Object.values(assessment.dimensions).length !== 7 || Object.values(assessment.dimensions).some((item) => !Number.isInteger(item) || item < 1 || item > 5)) return 'Placement dimensions must all be integers from one to five.'
  if (!routes.includes(String(assessment.recommendedRoute)) || !routes.includes(String(assessment.selectedRoute))) return 'Placement assessment has an unsupported route.'
  if (!['low', 'medium', 'high'].includes(String(assessment.confidence))) return 'Placement assessment has an invalid confidence state.'
  if (!['confirmed', 'conservative', 'aggressive-test', 'quick-start'].includes(String(assessment.decision))) return 'Placement assessment has an invalid athlete decision.'
  if (![assessment.reasons, assessment.uncertainInputs, assessment.verificationPlan, assessment.exitCriteria].every((list) => Array.isArray(list) && list.every((item) => typeof item === 'string'))) return 'Placement assessment evidence lists are invalid.'
  if (typeof assessment.whyNotLower !== 'string' || typeof assessment.whyNotHigher !== 'string') return 'Placement assessment is missing route comparisons.'
  const replay = applyPlacementDecision(buildPlacementAssessment(inputs as PlacementInputs, assessment.createdAt), assessment.decision as PlacementDecision)
  const sameList = (left: unknown, right: unknown) => JSON.stringify(left) === JSON.stringify(right)
  if (!sameList(assessment.dimensions, replay.dimensions) || assessment.recommendedRoute !== replay.recommendedRoute || assessment.selectedRoute !== replay.selectedRoute || assessment.confidence !== replay.confidence || !sameList(assessment.reasons, replay.reasons) || !sameList(assessment.uncertainInputs, replay.uncertainInputs) || !sameList(assessment.verificationPlan, replay.verificationPlan) || assessment.whyNotLower !== replay.whyNotLower || assessment.whyNotHigher !== replay.whyNotHigher || !sameList(assessment.exitCriteria, replay.exitCriteria)) return 'Placement assessment does not reconcile with placement-v1 input evidence.'
  return null
}
