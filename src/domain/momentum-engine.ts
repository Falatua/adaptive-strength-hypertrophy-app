import type { CompletedSetRecord, MesocyclePlan, MissedOpportunityEvent, TrainingMomentum, TrainingSession } from './types'

export function buildTrainingMomentum(input: { sessions: TrainingSession[]; history: CompletedSetRecord[]; missedEvents: MissedOpportunityEvent[]; activePlan?: MesocyclePlan; now?: Date }): TrainingMomentum {
  const now = input.now ?? new Date()
  const planSessions = input.activePlan ? input.sessions.filter((session) => session.mesocycleId === input.activePlan?.id) : input.sessions
  const priority = planSessions.filter((session) => session.exercises.some((planned) => planned.role === 'primary'))
  const completed = priority.filter((session) => ['completed', 'partial-primary'].includes(session.status))
  const completedIds = new Set(completed.map((session) => session.id))
  const relevantSets = input.history.filter((workSet) => completedIds.has(workSet.sessionId))
  const latest = relevantSets.reduce<string | null>((stamp, workSet) => !stamp || workSet.completedAt > stamp ? workSet.completedAt : stamp, null)
  const daysSince = latest ? Math.floor((now.getTime() - new Date(latest).getTime()) / 86_400_000) : null
  const misses = input.missedEvents.filter((event) => !input.activePlan || event.mesocycleId === input.activePlan.id)
  const adapting = misses.some((event) => event.input.constraintState === 'continuing')
  const returning = daysSince !== null && daysSince >= 14
  const status: TrainingMomentum['status'] = returning ? 'returning' : adapting ? 'adapting' : completed.length ? 'on-path' : 'starting'
  const copy = {
    starting: ['Momentum starts with one useful workout', 'There is no streak to protect. Complete the next planned priority and ForgePath will build from it.'],
    'on-path': ['Your training path is moving', `${completed.length} priority workout${completed.length === 1 ? '' : 's'} completed in this training block. Calendar perfection is not required.`],
    adapting: ['Momentum is adapting, not broken', `${misses.length} schedule constraint${misses.length === 1 ? ' has' : 's have'} been recorded. The next useful priority still counts.`],
    returning: ['Returning is progress', `${daysSince} days since the latest completed priority. The next session is a re-entry point, not a debt payment.`]
  } as const
  return {
    ruleVersion: 'training-momentum-v1', status, title: copy[status][0], explanation: copy[status][1],
    completedPriorities: completed.length, plannedPriorities: priority.length, missedConstraints: misses.length,
    sourceSessionIds: completed.map((session) => session.id), sourceEventIds: misses.map((event) => event.id)
  }
}
