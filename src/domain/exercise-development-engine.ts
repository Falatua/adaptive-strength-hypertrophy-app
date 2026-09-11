import { estimatedOneRepMax } from './training-engine'
import { isComparableExposure } from './set-structure-engine'
import { loadModeForSet } from './load-mode'
import type { CompletedSetRecord, Exercise, SurveyRecord } from './types'

export const EXERCISE_DEVELOPMENT_RULE = 'exercise-development-v1' as const

export type ExerciseDevelopmentAction = 'keep' | 'keep-learning' | 'review' | 'change'

export interface ExerciseDevelopmentAssessment {
  ruleVersion: typeof EXERCISE_DEVELOPMENT_RULE
  exerciseId: string
  action: ExerciseDevelopmentAction
  label: string
  tone: 'keep' | 'neutral' | 'review' | 'warning'
  reason: string
  evidence: {
    exactSessions: number
    observedDays: number
    maximumPain: number | null
    averageTechnique: number | null
    averageStimulus: number | null
    averageRecovery: number | null
    performance: 'improved' | 'held' | 'declined' | 'unknown'
  }
}

const mean = (values: number[]) => values.length ? values.reduce((total, value) => total + value, 0) / values.length : null

const movementValues = (surveys: SurveyRecord[], exerciseId: string, answerId: string, sessionIds?: Set<string>) => surveys
  .filter((survey) => survey.type === 'movement' && survey.exerciseId === exerciseId && (!sessionIds || sessionIds.has(survey.sessionId)))
  .flatMap((survey) => {
    const answer = survey.answers.find((candidate) => candidate.id === answerId && candidate.status === 'answered')
    return typeof answer?.value === 'number' ? [answer.value] : []
  })

const performanceTrend = (exercise: Exercise, sets: CompletedSetRecord[]): ExerciseDevelopmentAssessment['evidence']['performance'] => {
  const latest = [...sets].sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())[0]
  if (!latest) return 'unknown'
  const mode = loadModeForSet(latest, exercise)
  const comparable = sets.filter((workSet) => loadModeForSet(workSet, exercise) === mode)
  const sessions = [...new Set(comparable.map((workSet) => workSet.sessionId))]
    .map((sessionId) => {
      const sessionSets = comparable.filter((workSet) => workSet.sessionId === sessionId)
      const completedAt = sessionSets[0]?.completedAt ?? ''
      const capacity = mode === 'bodyweight'
        ? Math.max(...sessionSets.map((workSet) => workSet.reps))
        : Math.max(...sessionSets.map((workSet) => estimatedOneRepMax(workSet.load, workSet.reps + (workSet.rirKnown === false ? 0 : workSet.rir))))
      return { completedAt, capacity }
    })
    .sort((a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime())
  if (sessions.length < 2) return 'unknown'
  const first = sessions[0].capacity
  const last = sessions.at(-1)!.capacity
  if (last > first * 1.02) return 'improved'
  if (last < first * 0.95) return 'declined'
  return 'held'
}

/**
 * Reviews an exercise only from its own completed evidence. The purpose is to keep productive
 * movements stable for several weeks, learn which movements fit this athlete, and defer novelty
 * until a training-block boundary. It never changes a plan by itself.
 */
export function assessExerciseDevelopment(input: {
  exercise: Exercise
  history: CompletedSetRecord[]
  surveys: SurveyRecord[]
  sessionIds?: Set<string>
}): ExerciseDevelopmentAssessment {
  const exactSets = input.history
    .filter((workSet) => workSet.exerciseId === input.exercise.id && workSet.numbersEntered !== false && !workSet.athleteAdded && isComparableExposure(workSet.grouping))
    .filter((workSet) => !input.sessionIds || input.sessionIds.has(workSet.sessionId))
  const exactSessionIds = [...new Set(exactSets.map((workSet) => workSet.sessionId))]
  const dates = exactSets.map((workSet) => new Date(workSet.completedAt).getTime()).filter(Number.isFinite).sort((a, b) => a - b)
  const observedDays = dates.length > 1 ? Math.max(0, Math.round((dates.at(-1)! - dates[0]) / 86_400_000)) : 0
  const qualitySets = exactSets.filter((workSet) => workSet.qualityConfirmed === true)
  const setPain = qualitySets.map((workSet) => workSet.pain)
  const movementPain = movementValues(input.surveys, input.exercise.id, 'movementPain', input.sessionIds)
  const movementTechnique = movementValues(input.surveys, input.exercise.id, 'movementTechnique', input.sessionIds)
  const stimulus = movementValues(input.surveys, input.exercise.id, 'targetStimulus', input.sessionIds)
  const recovery = movementValues(input.surveys, input.exercise.id, 'recovery', input.sessionIds)
  const maximumPain = [...setPain, ...movementPain].length ? Math.max(...setPain, ...movementPain) : null
  const averageTechnique = mean([...qualitySets.map((workSet) => workSet.technique), ...movementTechnique])
  const averageStimulus = mean(stimulus)
  const averageRecovery = mean(recovery)
  const performance = performanceTrend(input.exercise, exactSets)
  const evidence = {
    exactSessions: exactSessionIds.length,
    observedDays,
    maximumPain,
    averageTechnique,
    averageStimulus,
    averageRecovery,
    performance
  }
  const result = (action: ExerciseDevelopmentAction, label: string, tone: ExerciseDevelopmentAssessment['tone'], reason: string): ExerciseDevelopmentAssessment => ({
    ruleVersion: EXERCISE_DEVELOPMENT_RULE,
    exerciseId: input.exercise.id,
    action,
    label,
    tone,
    reason,
    evidence
  })

  if (input.exercise.disliked || input.exercise.jointFeeling === 'avoid' || (maximumPain !== null && maximumPain >= 4)) {
    return result('change', 'Change suggested', 'warning', input.exercise.disliked || input.exercise.jointFeeling === 'avoid'
      ? 'Your saved preference says not to build the next block around this movement.'
      : `Exact movement feedback reached ${maximumPain}/5 pain. Review the setup or choose another movement before the next block.`)
  }
  if (input.exercise.jointFeeling === 'irritating' || (maximumPain !== null && maximumPain >= 3) || (averageTechnique !== null && averageTechnique < 3)) {
    return result('review', 'Review suggested', 'review', 'Joint response or repeatable technique needs attention before this movement is carried into another block.')
  }
  if (averageStimulus !== null && averageStimulus < 2 && performance !== 'improved' && exactSessionIds.length >= 3) {
    return result('review', 'Review suggested', 'review', 'Several exact exposures produced low target stimulus without a clear performance improvement. Compare another suitable movement at the next block boundary.')
  }
  if (exactSessionIds.length < 3 || observedDays < 21) {
    return result('keep-learning', 'Keep learning', 'neutral', `${exactSessionIds.length} exact session${exactSessionIds.length === 1 ? '' : 's'} across ${observedDays} day${observedDays === 1 ? '' : 's'} is too little evidence for exercise churn. Keep it stable unless pain or preference changes.`)
  }
  if (performance === 'declined' && averageRecovery !== null && averageRecovery <= 2) {
    return result('review', 'Review suggested', 'review', 'Performance declined while recovery was only just complete or worse. Review dose, placement, and exercise choice at the block boundary.')
  }
  return result('keep', 'Keep suggested', 'keep', `${exactSessionIds.length} exact sessions across ${observedDays} days provide a stable movement trial${performance === 'improved' ? ' with improving performance' : performance === 'held' ? ' with preserved performance' : ''}.`)
}

export function exerciseDevelopmentScore(assessment: ExerciseDevelopmentAssessment) {
  if (assessment.action === 'change') return -100
  if (assessment.action === 'review') return -8
  if (assessment.action === 'keep') return 2
  return 0
}
