import type { EffectiveSurveyMode, PlannedExercise, SurveyAnswer, SurveyRecord } from './types'

export const MOVEMENT_FEEDBACK_RULE = 'movement-feedback-v1' as const

export type MovementFeedbackQuestionId = 'movementPain' | 'movementTechnique' | 'targetStimulus' | 'loadFit' | 'volumeFit' | 'recovery'

export interface MovementFeedbackOption {
  value: number
  label: string
  detail?: string
  tone?: 'neutral' | 'positive' | 'warning'
}

export interface MovementFeedbackQuestion {
  id: MovementFeedbackQuestionId
  label: string
  help: string
  options: MovementFeedbackOption[]
}

const questions: Record<MovementFeedbackQuestionId, MovementFeedbackQuestion> = {
  movementPain: {
    id: 'movementPain',
    label: 'Joint response',
    help: 'Did discomfort or irritation change this movement today?',
    options: [
      { value: 0, label: 'No irritation', tone: 'positive' },
      { value: 2, label: 'Noticeable, no change' },
      { value: 4, label: 'Changed how I trained', tone: 'warning' },
      { value: 5, label: 'I stopped', tone: 'warning' }
    ]
  },
  movementTechnique: {
    id: 'movementTechnique',
    label: 'Technique',
    help: 'How consistent was your setup and execution across the work sets?',
    options: [
      { value: 2, label: 'Broke down', tone: 'warning' },
      { value: 4, label: 'Mostly consistent' },
      { value: 5, label: 'Solid throughout', tone: 'positive' }
    ]
  },
  targetStimulus: {
    id: 'targetStimulus',
    label: 'Target stimulus',
    help: 'How well did the intended muscles or skill receive the work?',
    options: [
      { value: 1, label: 'Barely felt it' },
      { value: 3, label: 'Moderate' },
      { value: 5, label: 'Strong', tone: 'positive' }
    ]
  },
  loadFit: {
    id: 'loadFit',
    label: 'Load and repetitions',
    help: 'Did the planned load and repetition target match today?',
    options: [
      { value: 1, label: 'Too light' },
      { value: 3, label: 'On target', tone: 'positive' },
      { value: 5, label: 'Too heavy', tone: 'warning' }
    ]
  },
  volumeFit: {
    id: 'volumeFit',
    label: 'Hard-set volume',
    help: 'How did the number of work sets fit this movement today?',
    options: [
      { value: 1, label: 'Could do more' },
      { value: 2, label: 'Just right', tone: 'positive' },
      { value: 3, label: 'At my limit' },
      { value: 4, label: 'Too much', tone: 'warning' }
    ]
  },
  recovery: {
    id: 'recovery',
    label: 'Recovery from last time',
    help: 'Before today, how had you recovered from the last exact exposure?',
    options: [
      { value: 5, label: 'Never got sore' },
      { value: 4, label: 'Recovered early', tone: 'positive' },
      { value: 2, label: 'Just recovered' },
      { value: 1, label: 'Still sore', tone: 'warning' }
    ]
  }
}

export function movementFeedbackQuestions(mode: EffectiveSurveyMode, hasPriorExactExposure: boolean): MovementFeedbackQuestion[] {
  if (mode === 'off') return []
  const ids: MovementFeedbackQuestionId[] = mode === 'minimal'
    ? ['movementPain', 'loadFit', 'volumeFit']
    : mode === 'quick'
      ? ['movementPain', 'movementTechnique', 'targetStimulus', 'loadFit', 'volumeFit']
      : ['movementPain', 'movementTechnique', 'targetStimulus', 'loadFit', 'volumeFit']
  if (hasPriorExactExposure) ids.push('recovery')
  return ids.map((id) => questions[id])
}

export function movementFeedbackMode(mode: EffectiveSurveyMode | 'ask'): EffectiveSurveyMode {
  return mode === 'ask' ? 'quick' : mode
}

export function latestMovementFeedback(
  surveys: SurveyRecord[],
  sessionId: string,
  plannedExerciseId: string
): SurveyRecord | undefined {
  return surveys
    .filter((survey) => survey.type === 'movement' && survey.sessionId === sessionId && survey.plannedExerciseId === plannedExerciseId)
    .sort((a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime())
    .at(-1)
}

export function movementFeedbackValue(survey: SurveyRecord | undefined, id: MovementFeedbackQuestionId): number | null {
  const answer = survey?.answers.find((candidate) => candidate.id === id && candidate.status === 'answered')
  return typeof answer?.value === 'number' ? answer.value : null
}

export function movementFeedbackMatchesCompletedSets(survey: SurveyRecord | undefined, planned: PlannedExercise): boolean {
  if (!survey?.sourceSetIds) return false
  const completed = planned.sets.filter((workSet) => workSet.completed).map((workSet) => workSet.id).sort()
  return completed.length > 0 && completed.join('|') === [...survey.sourceSetIds].sort().join('|')
}

export function movementFeedbackPreview(answers: SurveyAnswer[]): { title: string; detail: string; tone: 'neutral' | 'warning' } {
  const value = (id: MovementFeedbackQuestionId) => {
    const answer = answers.find((candidate) => candidate.id === id && candidate.status === 'answered')
    return typeof answer?.value === 'number' ? answer.value : null
  }
  const pain = value('movementPain')
  const technique = value('movementTechnique')
  const loadFit = value('loadFit')
  const volumeFit = value('volumeFit')
  if (pain !== null && pain >= 4) return { title: 'Review this movement before overload', detail: 'Pain that changed training blocks progression and can support a lighter load or replacement suggestion.', tone: 'warning' }
  if (volumeFit !== null && volumeFit >= 4) return { title: 'Fewer sets may fit next time', detail: 'Too much volume can support a one-set reduction. The athlete still approves any future change.', tone: 'warning' }
  if ((technique !== null && technique <= 2) || (loadFit !== null && loadFit >= 5)) return { title: 'Repeat or reduce before progressing', detail: 'Technique breakdown or a target that felt too heavy holds the next increase.', tone: 'warning' }
  if (volumeFit !== null && volumeFit >= 3) return { title: 'Keep the set count capped', detail: 'Reaching your useful limit prevents an automatic set increase.', tone: 'neutral' }
  if (volumeFit === 1) return { title: 'More work is only a possibility', detail: 'Could do more supports a future set only when comparable performance and later recovery agree.', tone: 'neutral' }
  return { title: 'Performance remains the main progression signal', detail: 'This feedback adds context. Completed repetitions, load, RIR, recovery, and safety gates still decide the proposal.', tone: 'neutral' }
}
