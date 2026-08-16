import type { EvidenceConfidence, ProgressionAction, ReadinessOutcome } from './types'

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
