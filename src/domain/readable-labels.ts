import type {
  ContinuityState,
  EvidenceConfidence,
  ProgressionAction,
  ReadinessOutcome,
  ScheduleAdaptationMode,
  ScheduleReadinessAction,
  ScheduleReadinessFreshness
} from './types'
import type { CalibrationState } from './ongoing-confidence-engine'

// The engines store short codes so saved evidence stays stable and replayable. An athlete reading a
// screen mid-set should never see those codes, or the internal words for them. Every athlete-facing
// phrase for a stored code lives here, and nothing here is written into saved evidence, so this
// wording can change freely without touching a single stored record.

export const noCheckInPlanLabel = 'Standard plan'

export const readinessPlanLabels: Record<ReadinessOutcome, string> = {
  normal: 'Full session',
  confirm: 'See how it feels',
  protect: 'Easier day',
  reacclimate: 'Easing back in',
  'pain-aware': 'Working around pain'
}

export const checkInDepthLabels: Record<EvidenceConfidence, string> = {
  low: 'Few check-in answers',
  medium: 'Some check-in answers',
  high: 'Full check-in answers'
}

export const evidenceStrengthLabels: Record<EvidenceConfidence, string> = {
  low: 'Little past evidence',
  medium: 'Some past evidence',
  high: 'Strong past evidence'
}

export const progressionActionLabels: Record<ProgressionAction, string> = {
  load: 'Adding weight',
  reps: 'Adding reps',
  sets: 'Adding a set',
  hold: 'Repeating last time',
  reduce: 'Backing off',
  reacclimate: 'Easing back in'
}

export const continuityLabels: Record<ContinuityState, string> = {
  stable: 'Training steadily',
  interrupted: 'Training on and off',
  returning: 'Coming back'
}

export const scheduleChangeLabels: Record<ScheduleAdaptationMode, string> = {
  'defer-one': 'Moved one workout',
  'rebuild-sequence': 'Reordered your week',
  'reacclimation-review': 'Eased the plan back'
}

export const checkInAgeLabels: Record<ScheduleReadinessFreshness, string> = {
  current: 'From today',
  stale: 'Too old to use',
  missing: 'Not answered'
}

export const scheduleReadinessActionLabels: Record<ScheduleReadinessAction, string> = {
  proceed: 'Train as planned',
  'confirm-at-warmup': 'Decide during warm-up',
  'trim-optional': 'Optional work trimmed',
  'reacclimation-review': 'Eased back',
  blocked: 'Paused for review',
  unknown: 'Not enough answers'
}

export const calibrationStateLabels: Record<CalibrationState, string> = {
  uncalibrated: 'Nothing recorded yet',
  'early-evidence': 'Just getting started',
  developing: 'Learning your pattern',
  'well-calibrated': 'Backed by your history',
  stale: 'Needs recent work'
}

/** The schedule engine can also report that no usable check-in exists. */
export const scheduleReadinessOutcomeLabels: Record<ReadinessOutcome | 'unknown', string> = {
  ...readinessPlanLabels,
  unknown: 'Not enough answers'
}
