import type { ExerciseRole, PlacementRoute, RouteSessionGenerationEvidence } from './types'
import { equipmentGenerationEvidenceError } from './equipment-engine'
import { movementPlacementEvidenceError, placementRouteLabels } from './placement-engine'

export const ROUTE_SESSION_RULE_VERSION = 'route-session-v3' as const
export const EQUIPMENT_ROUTE_SESSION_RULE_VERSION = 'route-session-v2' as const
export const LEGACY_ROUTE_SESSION_RULE_VERSION = 'route-session-v1' as const

export interface RouteRolePrescription {
  sets: number
  reps: number
  rir: number
  intensity: number
  restSeconds: number
}

export type EffortMetric = 'rpe' | 'rir'

export interface RouteSessionProfile {
  ruleVersion: typeof ROUTE_SESSION_RULE_VERSION
  route: PlacementRoute
  label: string
  strategy: string
  primary: RouteRolePrescription
  secondary: RouteRolePrescription
  accessory: RouteRolePrescription
  maximumAccessories: number
  // RPE and RIR carry the same information: RPE = 10 - RIR. Only one value is ever stored, so this
  // selects the dial the athlete reads and edits. Strength-expression routes speak RPE the way a
  // powerlifter does; hypertrophy and calibration routes speak RIR.
  effortMetric: EffortMetric
  progressionPolicy: string
  reasons: string[]
}

const sharedProgression = 'Progress load first when comparable performance and recovery support it, then repetitions, then a recoverable set. Hold or reduce when evidence does not support overload.'

const profiles: Record<PlacementRoute, RouteSessionProfile> = {
  'introductory-skill': {
    ruleVersion: ROUTE_SESSION_RULE_VERSION, route: 'introductory-skill', label: 'Skill Building',
    strategy: 'Technique-first practice with repeatable submaximal work and a small exercise menu.',
    primary: { sets: 2, reps: 8, rir: 4, intensity: 0.60, restSeconds: 150 },
    secondary: { sets: 2, reps: 10, rir: 4, intensity: 0.56, restSeconds: 105 },
    accessory: { sets: 2, reps: 12, rir: 4, intensity: 0.52, restSeconds: 60 }, effortMetric: 'rir', maximumAccessories: 1,
    progressionPolicy: sharedProgression,
    reasons: ['Skill practice takes priority over load expression.', 'Low set count leaves room to learn without manufacturing fatigue.']
  },
  reacclimation: {
    ruleVersion: ROUTE_SESSION_RULE_VERSION, route: 'reacclimation', label: 'Rebuild',
    strategy: 'Restore tolerance through familiar movements, conservative loading, and no catch-up volume.',
    primary: { sets: 2, reps: 6, rir: 4, intensity: 0.65, restSeconds: 165 },
    secondary: { sets: 2, reps: 8, rir: 3, intensity: 0.60, restSeconds: 120 },
    accessory: { sets: 2, reps: 12, rir: 3, intensity: 0.55, restSeconds: 60 }, effortMetric: 'rir', maximumAccessories: 2,
    progressionPolicy: sharedProgression,
    reasons: ['Past skill is preserved while current tolerance is re-established.', 'Volume is intentionally below a normal development route.']
  },
  'bridge-calibration': {
    ruleVersion: ROUTE_SESSION_RULE_VERSION, route: 'bridge-calibration', label: 'Calibration',
    strategy: 'Collect representative non-maximal performance while every exact movement establishes its own baseline.',
    primary: { sets: 3, reps: 6, rir: 3, intensity: 0.70, restSeconds: 180 },
    secondary: { sets: 2, reps: 8, rir: 3, intensity: 0.62, restSeconds: 120 },
    accessory: { sets: 2, reps: 10, rir: 3, intensity: 0.58, restSeconds: 75 }, effortMetric: 'rir', maximumAccessories: 2,
    progressionPolicy: sharedProgression,
    reasons: ['The session produces useful work and placement evidence at the same time.', 'Unknown exact movements keep zero-load calibration instead of borrowing another variation.']
  },
  'base-building': {
    ruleVersion: ROUTE_SESSION_RULE_VERSION, route: 'base-building', label: 'Base Building',
    strategy: 'Build repeatable work capacity through moderate repetitions, controlled effort, and stable exercise exposure.',
    primary: { sets: 3, reps: 8, rir: 3, intensity: 0.67, restSeconds: 165 },
    secondary: { sets: 3, reps: 10, rir: 3, intensity: 0.60, restSeconds: 105 },
    accessory: { sets: 2, reps: 12, rir: 3, intensity: 0.55, restSeconds: 60 }, effortMetric: 'rir', maximumAccessories: 2,
    progressionPolicy: sharedProgression,
    reasons: ['Moderate work builds tolerance before more specific loading.', 'The queue protects your main lifts while keeping fatigue recoverable.']
  },
  hypertrophy: {
    ruleVersion: ROUTE_SESSION_RULE_VERSION, route: 'hypertrophy', label: 'Muscle Growth',
    strategy: 'Keep your main lifts practiced while allocating more recoverable sets to priority regions.',
    primary: { sets: 3, reps: 8, rir: 3, intensity: 0.67, restSeconds: 150 },
    secondary: { sets: 3, reps: 10, rir: 2, intensity: 0.62, restSeconds: 105 },
    accessory: { sets: 3, reps: 12, rir: 2, intensity: 0.57, restSeconds: 75 }, effortMetric: 'rir', maximumAccessories: 3,
    progressionPolicy: sharedProgression,
    reasons: ['Priority accessories receive the largest route-specific dose.', 'Anchor work stays present without consuming the whole fatigue budget.']
  },
  powerbuilding: {
    ruleVersion: ROUTE_SESSION_RULE_VERSION, route: 'powerbuilding', label: 'Strength and Size',
    strategy: 'Protect specific strength practice first, then use secondary and accessory work to build the main lift and priority muscles.',
    primary: { sets: 4, reps: 5, rir: 2, intensity: 0.77, restSeconds: 180 },
    secondary: { sets: 3, reps: 8, rir: 2, intensity: 0.67, restSeconds: 135 },
    accessory: { sets: 3, reps: 12, rir: 2, intensity: 0.57, restSeconds: 75 }, effortMetric: 'rpe', maximumAccessories: 3,
    progressionPolicy: sharedProgression,
    reasons: ['Primary work protects strength specificity.', 'Secondary builders and priority accessories retain meaningful hypertrophy dose.']
  },
  strength: {
    ruleVersion: ROUTE_SESSION_RULE_VERSION, route: 'strength', label: 'Strength',
    strategy: 'Emphasize high-quality lower-repetition work on the main lift while limiting nonessential fatigue.',
    primary: { sets: 4, reps: 4, rir: 2, intensity: 0.82, restSeconds: 210 },
    secondary: { sets: 3, reps: 6, rir: 3, intensity: 0.72, restSeconds: 150 },
    accessory: { sets: 2, reps: 10, rir: 3, intensity: 0.58, restSeconds: 75 }, effortMetric: 'rpe', maximumAccessories: 2,
    progressionPolicy: sharedProgression,
    reasons: ['Lower-repetition work on the main lift receives the largest time and recovery budget.', 'Accessory work remains sufficient to support the main lift without obscuring performance.']
  },
  power: {
    ruleVersion: ROUTE_SESSION_RULE_VERSION, route: 'power', label: 'Power',
    strategy: 'Practice fast, technically repeatable repetitions with conservative fatigue and full intent.',
    primary: { sets: 5, reps: 3, rir: 4, intensity: 0.60, restSeconds: 180 },
    secondary: { sets: 3, reps: 5, rir: 3, intensity: 0.65, restSeconds: 135 },
    accessory: { sets: 2, reps: 8, rir: 3, intensity: 0.58, restSeconds: 75 }, effortMetric: 'rpe', maximumAccessories: 2,
    progressionPolicy: 'Progress execution quality and then load only when repetitions remain fast and repeatable. Repetitions or sets do not increase merely to create fatigue.',
    reasons: ['Submaximal loading preserves movement speed and intent.', 'Longer rest and lower accessory dose protect power quality.']
  },
  'event-specific': {
    ruleVersion: ROUTE_SESSION_RULE_VERSION, route: 'event-specific', label: 'Meet Prep',
    strategy: 'Prioritize your declared main lifts and event-relevant execution while retaining only useful support work.',
    primary: { sets: 4, reps: 3, rir: 2, intensity: 0.82, restSeconds: 210 },
    secondary: { sets: 3, reps: 5, rir: 3, intensity: 0.72, restSeconds: 150 },
    accessory: { sets: 2, reps: 8, rir: 3, intensity: 0.60, restSeconds: 75 }, effortMetric: 'rpe', maximumAccessories: 2,
    progressionPolicy: sharedProgression,
    reasons: ['Specific practice on the main lift receives priority.', 'The route does not claim a complete peak without a validated event and taper plan.']
  },
  'pain-aware-modified': {
    ruleVersion: ROUTE_SESSION_RULE_VERSION, route: 'pain-aware-modified', label: 'Pain-Aware',
    strategy: 'Pause automatic generation until restrictions and movement choices are reviewed.',
    primary: { sets: 0, reps: 0, rir: 4, intensity: 0, restSeconds: 0 },
    secondary: { sets: 0, reps: 0, rir: 4, intensity: 0, restSeconds: 0 },
    accessory: { sets: 0, reps: 0, rir: 4, intensity: 0, restSeconds: 0 }, effortMetric: 'rir', maximumAccessories: 0,
    progressionPolicy: 'No overload decision is generated while the placement restriction gate is active.',
    reasons: ['Pain or restriction changes what can be trained.', 'The app cannot diagnose, treat, or clear an injury.']
  }
}

/**
 * RIR is the single stored value. RPE is the same evidence read from the other end of the scale, so
 * this converts for display and input only. Nothing in history, progression, or comparability changes
 * with the athlete's chosen dial, which is what keeps a strength block and a hypertrophy block
 * comparable on the same movement.
 */
export const rirToRpe = (rir: number) => Math.max(1, Math.min(10, 10 - rir))
export const rpeToRir = (rpe: number) => Math.max(0, Math.min(9, 10 - rpe))

export interface EffortDisplay {
  metric: EffortMetric
  label: string
  value: number
  /** Selectable values in display units, ordered as the athlete reads them. */
  options: number[]
  hint: string
}

export function effortDisplayFor(rir: number, metric: EffortMetric): EffortDisplay {
  if (metric === 'rpe') {
    return {
      metric,
      label: 'RPE',
      value: rirToRpe(rir),
      options: [6, 7, 8, 9, 10],
      hint: 'Rate of perceived exertion. 10 means nothing left, 8 means about two solid reps in the tank.'
    }
  }
  return {
    metric,
    label: 'RIR',
    value: Math.max(0, Math.min(9, rir)),
    options: [0, 1, 2, 3, 4],
    hint: 'Reps in reserve. 0 means you could not do another rep, 3 means three good reps were left.'
  }
}

export function routeSessionProfile(route: PlacementRoute) {
  return profiles[route]
}

export function prescriptionForRole(profile: RouteSessionProfile, role: ExerciseRole) {
  if (role === 'primary') return profile.primary
  if (role === 'secondary') return profile.secondary
  return profile.accessory
}

export function routeSessionGenerationError(value: unknown) {
  if (!value || typeof value !== 'object') return 'Route session generation evidence is missing.'
  const evidence = value as Partial<RouteSessionGenerationEvidence>
  if ((evidence.ruleVersion !== LEGACY_ROUTE_SESSION_RULE_VERSION && evidence.ruleVersion !== EQUIPMENT_ROUTE_SESSION_RULE_VERSION && evidence.ruleVersion !== ROUTE_SESSION_RULE_VERSION) || !evidence.route || !(evidence.route in profiles)) return 'Route session generation has an unsupported identity.'
  if (typeof evidence.placementCreatedAt !== 'string' || Number.isNaN(new Date(evidence.placementCreatedAt).getTime())) return 'Route session generation has an invalid placement date.'
  const canonical = profiles[evidence.route]
  if (evidence.strategy !== canonical.strategy) return 'Route session generation strategy does not match its route.'
  if (!Array.isArray(evidence.reasons) || evidence.reasons.length !== canonical.reasons.length || evidence.reasons.some((reason, index) => reason !== canonical.reasons[index])) return 'Route session generation reasons do not match its route.'
  if (evidence.ruleVersion === EQUIPMENT_ROUTE_SESSION_RULE_VERSION || evidence.ruleVersion === ROUTE_SESSION_RULE_VERSION) {
    const equipmentError = equipmentGenerationEvidenceError(evidence.equipment)
    if (equipmentError) return `Route session generation equipment is invalid: ${equipmentError}`
  }
  if (evidence.ruleVersion === ROUTE_SESSION_RULE_VERSION) {
    if (!evidence.planRoute || !(evidence.planRoute in placementRouteLabels)) return 'Route session generation is missing its plan route.'
    const movementError = movementPlacementEvidenceError(evidence.movementPlacement)
    if (movementError) return `Route session generation movement placement is invalid: ${movementError}`
    if (evidence.movementPlacement?.selectedRoute !== evidence.route) return 'Route session generation route does not match its movement placement.'
  } else if (evidence.planRoute !== undefined || evidence.movementPlacement !== undefined) return 'Legacy route generation cannot invent per-movement placement evidence.'
  return null
}

export const routeSessionProfiles = Object.values(profiles)
