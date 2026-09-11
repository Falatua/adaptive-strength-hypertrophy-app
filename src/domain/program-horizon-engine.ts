import type { AthleteProfile, CycleReviewEvent, MesocyclePlan, TrainingSession } from './types'

export const PROGRAM_HORIZON_RULE = 'program-horizon-v1' as const

export interface ProgramHorizon {
  ruleVersion: typeof PROGRAM_HORIZON_RULE
  currentRound: number
  targetRounds: number
  mesocycleStage: 'entry' | 'build' | 'final-accumulation' | 'review'
  stageLabel: string
  stageGuidance: string
  completedBlocksLastYear: number
  recoveryDecisionsLastYear: number
  yearlyEvidence: string
  horizons: Array<{
    id: 'mesocycle' | 'development-phase' | 'training-year'
    label: string
    duration: string
    title: string
    detail: string
  }>
}

export function recommendedTrainingRounds(athlete: Pick<AthleteProfile, 'trainingAge' | 'continuity'>) {
  if (athlete.continuity !== 'stable') return 3
  if (athlete.trainingAge < 2) return 6
  if (athlete.trainingAge < 7) return 5
  return 4
}

/**
 * A planning horizon, not a calendar generator. It connects the current ForgePath training block
 * to multi-block and annual decisions while leaving future phases unknown until the athlete supplies
 * a goal, endpoint, completed performance, and recovery evidence.
 */
export function buildProgramHorizon(input: {
  plan?: MesocyclePlan
  plans: MesocyclePlan[]
  sessions: TrainingSession[]
  cycleReviews: CycleReviewEvent[]
  now?: Date
}): ProgramHorizon {
  const now = input.now ?? new Date()
  const sessionsForPlan = (plan: MesocyclePlan) => input.sessions.filter((session) => session.mesocycleId === plan.id || plan.sessionIds.includes(session.id))
  const currentRound = input.plan
    ? Math.max(1, ...sessionsForPlan(input.plan).map((session) => session.microcycleNumber ?? 1))
    : 1
  const targetRounds = input.plan?.targetMicrocycles ?? 4
  const stage = !input.plan || input.plan.status === 'completed'
    ? 'review'
    : currentRound <= 1
      ? 'entry'
      : currentRound >= targetRounds
        ? 'final-accumulation'
        : 'build'
  const stageCopy = {
    entry: {
      label: 'Entry and baseline',
      guidance: 'Start with recoverable work, stable movements, and enough distance from failure to learn the real response.'
    },
    build: {
      label: 'Progressive accumulation',
      guidance: 'Use completed performance and recovery to make the smallest useful load, repetition, effort, or volume change.'
    },
    'final-accumulation': {
      label: 'Final accumulation round',
      guidance: 'Do not turn this round into a hidden deload. Hold or progress only from evidence, then open an explicit recovery and outcome review.'
    },
    review: {
      label: 'Outcome and recovery review',
      guidance: 'Review the goal, fatigue, joints, movement response, and schedule before continuing the focus, recovering, or changing direction.'
    }
  } as const
  const oneYearAgo = new Date(now.getTime() - 365 * 86_400_000).getTime()
  const completedBlocksLastYear = input.plans.filter((plan) => {
    if (plan.status !== 'completed') return false
    const linkedCompletionTimes = sessionsForPlan(plan)
      .filter((session) => session.status === 'completed' && session.completedAt)
      .map((session) => new Date(session.completedAt!).getTime())
      .filter(Number.isFinite)
    const evidenceAt = linkedCompletionTimes.length ? Math.max(...linkedCompletionTimes) : new Date(plan.effectiveAt).getTime()
    return Number.isFinite(evidenceAt) && evidenceAt >= oneYearAgo
  }).length
  const recoveryDecisionsLastYear = input.cycleReviews.filter((review) => review.decision === 'recover' && new Date(review.createdAt).getTime() >= oneYearAgo).length
  const yearlyEvidence = completedBlocksLastYear || recoveryDecisionsLastYear
    ? `${completedBlocksLastYear} completed training block${completedBlocksLastYear === 1 ? '' : 's'} and ${recoveryDecisionsLastYear} recovery decision${recoveryDecisionsLastYear === 1 ? '' : 's'} are recorded in the last 12 months.`
    : 'ForgePath does not yet have a full year of completed block and recovery decisions. The annual view stays a planning framework, not a fabricated schedule.'

  return {
    ruleVersion: PROGRAM_HORIZON_RULE,
    currentRound,
    targetRounds,
    mesocycleStage: stage,
    stageLabel: stageCopy[stage].label,
    stageGuidance: stageCopy[stage].guidance,
    completedBlocksLastYear,
    recoveryDecisionsLastYear,
    yearlyEvidence,
    horizons: [
      {
        id: 'mesocycle',
        label: 'Current mesocycle',
        duration: `${targetRounds} planned training rounds`,
        title: input.plan?.title ?? 'Choose the next focused block',
        detail: 'Keep the exercise set stable, accumulate progressively harder productive work, and finish with an explicit outcome and recovery decision.'
      },
      {
        id: 'development-phase',
        label: 'Multi-block development phase',
        duration: 'Several mesocycles',
        title: 'One larger purpose across blocks',
        detail: 'Continue a focus only while performance, stimulus, recovery, joints, and schedule support it. Add volume or frequency gradually, with lighter work carrying most added dose.'
      },
      {
        id: 'training-year',
        label: 'Training year',
        duration: 'Needs analysis first',
        title: 'Plan backward from the real endpoint',
        detail: 'Sequence development, strength expression, maintenance, fat-loss-compatible training, and recovery only after the athlete chooses the goal and timing. No fixed annual calendar is invented.'
      }
    ]
  }
}
