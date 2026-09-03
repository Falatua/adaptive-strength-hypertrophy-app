import { movementFeedbackValue } from './movement-feedback-engine'
import type { CompletedSetRecord, PlannedExercise, SurveyRecord } from './types'

export const EFFORT_PROGRESSION_RULE = 'rir-progression-v1' as const

export interface EffortProgressionDecision {
  ruleVersion: typeof EFFORT_PROGRESSION_RULE
  targetRir: number
  action: 'hold' | 'reduce-one'
  reasons: string[]
}

/**
 * RIR is progressed from the prior prescription, never copied from the athlete's actual RIR.
 * ForgePath deliberately holds round two, then permits at most one RIR of added effort when two
 * exact exposures plus movement feedback support it. A 1 RIR target is reserved for round five or
 * later so a short block cannot jump from introductory work to near-failure work.
 */
export function recommendNextTargetRir(input: {
  currentTargetRir: number
  nextMicrocycleNumber: number
  priorPlanned: PlannedExercise | undefined
  history: CompletedSetRecord[]
  surveys: SurveyRecord[]
}): EffortProgressionDecision {
  const hold = (...reasons: string[]): EffortProgressionDecision => ({
    ruleVersion: EFFORT_PROGRESSION_RULE,
    targetRir: input.currentTargetRir,
    action: 'hold',
    reasons
  })
  if (input.currentTargetRir <= 1) return hold('The current prescription is already at the conservative effort floor.')
  if (input.nextMicrocycleNumber <= 2) return hold('Round two repeats the effort target so the first week is confirmed before training moves closer to failure.')

  const exact = input.history
    .filter((workSet) => workSet.exerciseId === input.priorPlanned?.exerciseId && workSet.plannedExerciseId)
    .sort((left, right) => new Date(left.completedAt).getTime() - new Date(right.completedAt).getTime() || left.setIndex - right.setIndex)
  const sessionIds = [...new Set(exact.map((workSet) => workSet.sessionId))]
  if (sessionIds.length < 2) return hold('Two completed exact exposures are required before RIR becomes more demanding.')

  const latestSessionId = sessionIds.at(-1)!
  const latest = exact.filter((workSet) => workSet.sessionId === latestSessionId)
  const plannedExerciseId = latest[0]?.plannedExerciseId
  const feedback = [...input.surveys]
    .filter((survey) => survey.type === 'movement' && survey.sessionId === latestSessionId && survey.plannedExerciseId === plannedExerciseId)
    .sort((left, right) => new Date(left.completedAt).getTime() - new Date(right.completedAt).getTime())
    .at(-1)
  if (!feedback || feedback.skipped) return hold('Exact-movement feedback is still unknown, so the effort target holds.')

  const movementPain = movementFeedbackValue(feedback, 'movementPain')
  const movementTechnique = movementFeedbackValue(feedback, 'movementTechnique')
  const loadFit = movementFeedbackValue(feedback, 'loadFit')
  const volumeFit = movementFeedbackValue(feedback, 'volumeFit')
  const recovery = movementFeedbackValue(feedback, 'recovery')
  if ([movementPain, movementTechnique, loadFit, volumeFit, recovery].some((value) => value === null)) return hold('Pain, technique, load fit, set fit, and recovery must all be known before RIR drops.')
  if ((movementPain ?? 5) > 2 || (movementTechnique ?? 0) < 4 || (loadFit ?? 5) > 3 || (volumeFit ?? 4) > 2 || (recovery ?? 0) < 2) {
    return hold('The latest movement feedback supports repeating the current effort target.')
  }
  if (latest.some((workSet) => workSet.rirKnown === false || workSet.qualityConfirmed !== true || workSet.pain > 2)) return hold('The latest exact sets do not have complete pain-free quality and RIR evidence.')
  const averageActualRir = latest.reduce((sum, workSet) => sum + workSet.rir, 0) / Math.max(1, latest.length)
  if (averageActualRir < input.currentTargetRir - 0.5) return hold('The athlete already trained materially harder than prescribed, so the next target does not get harder again.')

  const floor = input.nextMicrocycleNumber >= 5 ? 1 : 2
  const next = input.currentTargetRir - 1
  if (next < floor) return hold(`Round ${input.nextMicrocycleNumber} keeps at least ${floor} RIR under the gradual effort rule.`)
  return {
    ruleVersion: EFFORT_PROGRESSION_RULE,
    targetRir: next,
    action: 'reduce-one',
    reasons: ['Two exact exposures were completed.', 'Movement feedback supports a one-RIR increase in effort.', 'The change is limited to one RIR.']
  }
}
