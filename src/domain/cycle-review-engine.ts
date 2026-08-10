import { addDays, differenceInCalendarDays } from 'date-fns'
import { buildMesocyclePreview, draftFromPlan } from './mesocycle-engine'
import { loadIncrementFor } from './equipment-engine'
import { makeSets, recommendProgression } from './training-engine'
import type {
  CompletedSetRecord,
  CycleReviewDecision,
  CycleReviewEvidence,
  EquipmentProfile,
  Exercise,
  ContinuityState,
  MesocyclePlan,
  TrainingSession
} from './types'

export interface CycleReviewSummary {
  microcycleNumber: number
  startedAt: Date
  targetDate: Date
  maximumDate: Date
  targetPassed: boolean
  maximumPassed: boolean
  evidence: CycleReviewEvidence
  recommendation: CycleReviewDecision
  recommendationReasons: string[]
  eligible: Record<CycleReviewDecision, boolean>
}

const qualified = (session: TrainingSession) => ['completed', 'partial-primary'].includes(session.status)
const unresolved = (session: TrainingSession) => ['planned', 'active', 'deferred'].includes(session.status)

export function currentMicrocycleNumber(plan: MesocyclePlan, sessions: TrainingSession[]) {
  return Math.max(1, ...sessions.filter((session) => session.mesocycleId === plan.id).map((session) => session.microcycleNumber ?? 1))
}

export function sessionsForMicrocycle(plan: MesocyclePlan, sessions: TrainingSession[], microcycleNumber = currentMicrocycleNumber(plan, sessions)) {
  return sessions.filter((session) => session.mesocycleId === plan.id && (session.microcycleNumber ?? 1) === microcycleNumber)
}

export function buildCycleReview(plan: MesocyclePlan, sessions: TrainingSession[], history: CompletedSetRecord[], now = new Date()): CycleReviewSummary {
  const microcycleNumber = currentMicrocycleNumber(plan, sessions)
  const roundSessions = sessionsForMicrocycle(plan, sessions, microcycleNumber)
  const startedAt = roundSessions.length
    ? new Date(Math.min(...roundSessions.map((session) => new Date(session.plannedDate).getTime())))
    : new Date(plan.effectiveAt)
  const targetDate = addDays(startedAt, 7)
  const maximumDate = addDays(startedAt, 14)
  const sessionIds = new Set(roundSessions.map((session) => session.id))
  const sourceSets = history.filter((workSet) => sessionIds.has(workSet.sessionId))
  const sessionRpes = roundSessions.flatMap((session) => typeof session.sessionRpe === 'number' ? [session.sessionRpe] : [])
  const evidence: CycleReviewEvidence = {
    requiredSessions: roundSessions.length,
    qualifiedSessions: roundSessions.filter(qualified).length,
    unresolvedSessions: roundSessions.filter(unresolved).length,
    totalQualifiedExposures: sessions.filter((session) => session.mesocycleId === plan.id && qualified(session)).length,
    completedSets: sourceSets.length,
    volumeLoad: sourceSets.reduce((sum, workSet) => sum + workSet.reps * workSet.load, 0),
    averageSessionRpe: sessionRpes.length ? sessionRpes.reduce((sum, value) => sum + value, 0) / sessionRpes.length : null,
    maximumPain: sourceSets.length ? Math.max(...sourceSets.map((workSet) => workSet.pain)) : null,
    calendarDays: Math.max(0, differenceInCalendarDays(now, startedAt) + 1)
  }
  const complete = evidence.requiredSessions > 0 && evidence.qualifiedSessions >= evidence.requiredSessions
  const targetPassed = now.getTime() > targetDate.getTime()
  const maximumPassed = now.getTime() > maximumDate.getTime()
  let recommendation: CycleReviewDecision
  const recommendationReasons: string[] = []

  if ((evidence.maximumPain ?? 0) >= 4) {
    recommendation = 'recover'
    recommendationReasons.push('Pain evidence reached the conservative recovery-review threshold.')
  } else if (!complete && maximumPassed) {
    recommendation = 'recover'
    recommendationReasons.push('The maximum 14-day span passed with unresolved protected exposures.')
  } else if (!complete && targetPassed) {
    recommendation = 'extend'
    recommendationReasons.push('The target date passed, but the round remains inside its maximum useful span.')
  } else if (!complete) {
    recommendation = 'continue-hold'
    recommendationReasons.push('Protected exposures remain unresolved and the target date has not forced an extension decision.')
  } else if (microcycleNumber >= plan.targetMicrocycles) {
    recommendation = 'complete'
    recommendationReasons.push('The target number of productive exposure rounds is complete and the mesocycle is ready for an outcome decision.')
  } else if ((evidence.averageSessionRpe ?? 8) <= 7.5 && (evidence.maximumPain ?? 0) <= 2) {
    recommendation = 'continue-progress'
    recommendationReasons.push('The exposure round is complete with recoverable effort and no elevated pain signal.')
  } else {
    recommendation = 'continue-hold'
    recommendationReasons.push('The round is complete, but current effort supports repeating targets before another increase.')
  }

  return {
    microcycleNumber, startedAt, targetDate, maximumDate, targetPassed, maximumPassed, evidence, recommendation, recommendationReasons,
    eligible: {
      'continue-progress': complete,
      'continue-hold': true,
      extend: !complete && targetPassed && !maximumPassed,
      recover: true,
      complete: complete && microcycleNumber >= plan.targetMicrocycles && evidence.totalQualifiedExposures >= plan.minimumProductiveExposures
    }
  }
}

interface NextRoundInput {
  plan: MesocyclePlan
  sessions: TrainingSession[]
  history: CompletedSetRecord[]
  exercises: Exercise[]
  decision: Extract<CycleReviewDecision, 'continue-progress' | 'continue-hold' | 'recover'>
  nextMicrocycleNumber: number
  startsAt: Date
  key: string
  equipmentProfile: EquipmentProfile
}

export function buildNextMicrocycle(input: NextRoundInput) {
  const draft = draftFromPlan(input.plan)
  if (input.decision === 'recover') {
    draft.dominantAdaptation = 'reacclimation'
    draft.entryRoute = undefined
    draft.generationRuleVersion = undefined
    draft.placementCreatedAt = undefined
    draft.generationEquipment = undefined
    draft.movementPlacements = undefined
  }
  const preview = buildMesocyclePreview(draft, {
    exercises: input.exercises,
    currentSessions: input.sessions,
    history: input.history,
    planId: input.plan.id,
    planVersion: input.plan.version,
    startsAt: input.startsAt,
    sessionKeyPrefix: `${input.plan.id}-round-${input.nextMicrocycleNumber}-${input.key}`,
    microcycleNumber: input.nextMicrocycleNumber,
    equipmentProfile: input.equipmentProfile
  })
  if (input.decision !== 'continue-progress') return preview.sessions
  return preview.sessions.map((session) => ({
    ...session,
    exercises: session.exercises.map((planned) => {
      const first = planned.sets[0]
      const comparable = input.history.filter((workSet) => workSet.exerciseId === planned.exerciseId)
      const exercise = input.exercises.find((candidate) => candidate.id === planned.exerciseId)
      const decision = recommendProgression({
        history: comparable,
        targetLoad: first.targetLoad,
        targetReps: first.targetReps,
        targetSets: planned.sets.length,
        repRange: [Math.max(1, first.targetReps - 2), first.targetReps + 2],
        increment: exercise ? loadIncrementFor(exercise, input.equipmentProfile).value : 5,
        continuity: 'stable' satisfies ContinuityState,
        readiness: 'normal'
      })
      return {
        ...planned,
        sets: makeSets(decision.nextSets, decision.nextReps, decision.nextLoad, first.targetRir)
          .map((workSet, index) => ({ ...workSet, id: `${planned.id}-review-set-${index + 1}` }))
      }
    })
  }))
}
