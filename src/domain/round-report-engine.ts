import { buildCycleReview, currentMicrocycleNumber } from './cycle-review-engine'
import { deriveAchievementEvents } from './history-engine'
import type { CompletedSetRecord, MesocyclePlan, SurveyRecord, TrainingRoundReport, TrainingSession } from './types'

export function buildTrainingRoundReport(plan: MesocyclePlan, sessions: TrainingSession[], history: CompletedSetRecord[], surveys: SurveyRecord[] = [], now = new Date()): TrainingRoundReport {
  const review = buildCycleReview(plan, sessions, history, now, surveys)
  const round = currentMicrocycleNumber(plan, sessions)
  const sourceSessions = sessions.filter((session) => session.mesocycleId === plan.id && session.microcycleNumber === round)
  const ids = new Set(sourceSessions.map((session) => session.id))
  const sourceSets = history.filter((workSet) => ids.has(workSet.sessionId))
  const wins = deriveAchievementEvents(sourceSets).length
  return {
    ruleVersion: 'training-round-report-v1', mesocycleId: plan.id, round,
    title: `Training round ${round} field report`,
    summary: `${review.evidence.qualifiedSessions} of ${review.evidence.requiredSessions} priority workouts qualified, with ${review.evidence.completedSets} completed sets and ${wins} measured progress event${wins === 1 ? '' : 's'}.`,
    qualifiedSessions: review.evidence.qualifiedSessions, requiredSessions: review.evidence.requiredSessions,
    completedSets: review.evidence.completedSets, wins, nextDecision: review.recommendation,
    reasons: review.recommendationReasons, sourceSessionIds: sourceSessions.map((session) => session.id), sourceSetIds: sourceSets.map((workSet) => workSet.id)
  }
}
