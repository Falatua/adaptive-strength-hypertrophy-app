import type { DeferredFeedbackRequest, EffectiveSurveyMode, EvidenceConfidence, SurveyAnswer } from './types'

export type SurveyCadence = 'pre' | 'post'

export interface SurveyQuestionDefinition {
  id: string
  label: string
  type: 'number' | 'scale'
  min: number
  max: number
  defaultValue: number
  // Scale endpoints are described, not graded. Difficulty, expected comparison, end fatigue, and pump
  // are magnitude scales where a high answer is evidence rather than a bad result, so labelling them
  // good or bad would bias the answer the engine reads.
  lowLabel?: string
  highLabel?: string
}

export const preSurveyQuestions: SurveyQuestionDefinition[] = [
  { id: 'sleepHours', label: 'How many hours did you sleep?', type: 'number', min: 0, max: 14, defaultValue: 7 },
  { id: 'sleepQuality', label: 'How well did you sleep?', type: 'scale', min: 1, max: 5, defaultValue: 3, lowLabel: 'Slept poorly', highLabel: 'Slept very well' },
  { id: 'nutrition', label: 'How well fueled are you?', type: 'scale', min: 1, max: 5, defaultValue: 3, lowLabel: 'Underfueled', highLabel: 'Well fueled' },
  { id: 'hydration', label: 'How hydrated do you feel?', type: 'scale', min: 1, max: 5, defaultValue: 3, lowLabel: 'Dehydrated', highLabel: 'Well hydrated' },
  { id: 'energy', label: 'How much physical energy do you have?', type: 'scale', min: 1, max: 5, defaultValue: 3, lowLabel: 'Drained', highLabel: 'Full of energy' },
  { id: 'stress', label: 'How high is life stress today?', type: 'scale', min: 1, max: 5, defaultValue: 2, lowLabel: 'Calm', highLabel: 'Very stressed' },
  { id: 'motivation', label: 'How motivated are you to train?', type: 'scale', min: 1, max: 5, defaultValue: 4, lowLabel: 'Not motivated', highLabel: 'Highly motivated' },
  { id: 'fatigue', label: 'How physically fatigued do you feel?', type: 'scale', min: 1, max: 5, defaultValue: 2, lowLabel: 'Fresh', highLabel: 'Very fatigued' },
  { id: 'pain', label: 'Any soreness, aches, or pain affecting movement?', type: 'scale', min: 0, max: 5, defaultValue: 0, lowLabel: 'No pain', highLabel: 'Severe pain' },
  { id: 'time', label: 'How many minutes do you actually have?', type: 'number', min: 10, max: 180, defaultValue: 60 }
]

export const postSurveyQuestions: SurveyQuestionDefinition[] = [
  { id: 'difficulty', label: 'How difficult was the session overall?', type: 'scale', min: 1, max: 10, defaultValue: 7, lowLabel: 'Very easy', highLabel: 'Maximal effort' },
  { id: 'expectedComparison', label: 'Compared with the plan, how hard was it?', type: 'scale', min: 1, max: 5, defaultValue: 3, lowLabel: 'Much easier than planned', highLabel: 'Much harder than planned' },
  { id: 'targetStimulus', label: 'How well did the target muscles or skill get trained?', type: 'scale', min: 1, max: 5, defaultValue: 4, lowLabel: 'Barely trained', highLabel: 'Trained as intended' },
  { id: 'pump', label: 'How strong was the target-muscle pump?', type: 'scale', min: 0, max: 5, defaultValue: 3, lowLabel: 'None', highLabel: 'Very strong' },
  { id: 'technique', label: 'How consistent was your technique?', type: 'scale', min: 1, max: 5, defaultValue: 4, lowLabel: 'Broke down', highLabel: 'Consistent throughout' },
  { id: 'pain', label: 'Did any movement create joint pain or irritation?', type: 'scale', min: 0, max: 5, defaultValue: 0, lowLabel: 'No pain', highLabel: 'Severe pain' },
  { id: 'endFatigue', label: 'How fatigued were you at the end?', type: 'scale', min: 1, max: 5, defaultValue: 3, lowLabel: 'Still fresh', highLabel: 'Completely spent' },
  { id: 'timeFit', label: 'How well did the session fit the time you had?', type: 'scale', min: 1, max: 5, defaultValue: 4, lowLabel: 'Ran far over', highLabel: 'Fit the time well' },
  { id: 'productive', label: 'How productive did the session feel?', type: 'scale', min: 1, max: 5, defaultValue: 4, lowLabel: 'Unproductive', highLabel: 'Highly productive' },
  { id: 'enjoyment', label: 'How much did you enjoy today’s training?', type: 'scale', min: 1, max: 5, defaultValue: 4, lowLabel: 'Did not enjoy it', highLabel: 'Really enjoyed it' },
  { id: 'actualMinutes', label: 'How many minutes did this actually take?', type: 'number', min: 5, max: 240, defaultValue: 60 }
]

const idsByMode: Record<SurveyCadence, Record<EffectiveSurveyMode, string[]>> = {
  pre: {
    full: preSurveyQuestions.map((question) => question.id),
    quick: ['sleepHours', 'energy', 'fatigue', 'pain', 'time'],
    minimal: ['energy', 'pain', 'time'],
    off: []
  },
  post: {
    full: postSurveyQuestions.map((question) => question.id),
    quick: ['difficulty', 'targetStimulus', 'technique', 'pain', 'timeFit', 'actualMinutes'],
    minimal: ['difficulty', 'technique', 'pain'],
    off: []
  }
}

export function questionsForSurvey(cadence: SurveyCadence, mode: EffectiveSurveyMode) {
  const source = cadence === 'pre' ? preSurveyQuestions : postSurveyQuestions
  const ids = new Set(idsByMode[cadence][mode])
  return source.filter((question) => ids.has(question.id))
}

/** Answer ids for per-muscle feedback. Kept parseable so a stored answer stays readable on its own. */
export const muscleQuestionId = (base: 'pump' | 'targetStimulus', muscle: string) => `${base}:${muscle}`
export const parseMuscleQuestionId = (id: string): { base: string; muscle: string } | null => {
  const [base, muscle] = id.split(':')
  return base && muscle ? { base, muscle } : null
}

/**
 * Volume is judged per muscle, so the questions that drive it are asked per muscle rather than once for
 * the whole session. Only muscles that received direct work are asked about, and the list is capped so
 * a long session does not turn into a questionnaire. Anything beyond the cap keeps the session-level
 * question as its fallback, which is the previous behaviour rather than a gap.
 */
export const MAXIMUM_MUSCLE_QUESTIONS = 4

export function muscleFeedbackQuestions(muscles: { id: string; label: string }[], mode: EffectiveSurveyMode): SurveyQuestionDefinition[] {
  if (mode === 'off' || mode === 'minimal' || !muscles.length) return []
  const asked = muscles.slice(0, MAXIMUM_MUSCLE_QUESTIONS)
  const bases: { base: 'pump' | 'targetStimulus'; label: (name: string) => string; min: number; max: number; defaultValue: number; low: string; high: string }[] = [
    { base: 'pump', label: (name) => `How strong was the pump in your ${name.toLowerCase()}?`, min: 0, max: 5, defaultValue: 3, low: 'None', high: 'Very strong' },
    { base: 'targetStimulus', label: (name) => `How well did your ${name.toLowerCase()} actually get trained?`, min: 1, max: 5, defaultValue: 4, low: 'Barely trained', high: 'Trained as intended' }
  ]
  // Quick mode asks only about stimulus, which is the stronger of the two signals for volume.
  const usable = mode === 'quick' ? bases.filter((entry) => entry.base === 'targetStimulus') : bases
  return asked.flatMap((muscle) => usable.map((entry) => ({
    id: muscleQuestionId(entry.base, muscle.id),
    label: entry.label(muscle.label),
    type: 'scale' as const,
    min: entry.min,
    max: entry.max,
    defaultValue: entry.defaultValue,
    lowLabel: entry.low,
    highLabel: entry.high
  })))
}

export function summarizeSurveyEvidence(answers: SurveyAnswer[], skipped: boolean): {
  answeredCount: number
  unknownCount: number
  confidence: EvidenceConfidence
} {
  const answeredCount = answers.filter((answer) => answer.status === 'answered').length
  const unknownCount = answers.length - answeredCount
  const confidence: EvidenceConfidence = skipped || answeredCount < 3 ? 'low' : answeredCount >= 8 ? 'high' : 'medium'
  return { answeredCount, unknownCount, confidence }
}

export const surveyModeLabel: Record<EffectiveSurveyMode, string> = {
  full: 'Full', quick: 'Quick', minimal: 'Minimal', off: 'Off'
}

export const DEFERRED_FEEDBACK_TTL_MS = 24 * 60 * 60 * 1000

export function buildDeferredFeedbackRequest(input: {
  id: string
  sessionId: string
  mode: Exclude<EffectiveSurveyMode, 'off'>
  now?: Date
}): DeferredFeedbackRequest {
  const now = input.now ?? new Date()
  return {
    id: input.id,
    sessionId: input.sessionId,
    mode: input.mode,
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + DEFERRED_FEEDBACK_TTL_MS).toISOString(),
    status: 'pending'
  }
}

export function expireDeferredFeedbackRequests(requests: DeferredFeedbackRequest[], now = new Date()) {
  const timestamp = now.getTime()
  return requests.map((request) => request.status === 'pending' && new Date(request.expiresAt).getTime() <= timestamp
    ? { ...request, status: 'expired' as const, resolvedAt: now.toISOString() }
    : request)
}

export function pendingDeferredFeedback(requests: DeferredFeedbackRequest[], now = new Date()) {
  const timestamp = now.getTime()
  return requests
    .filter((request) => request.status === 'pending' && new Date(request.expiresAt).getTime() > timestamp)
    .sort((a, b) => new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime())
}
