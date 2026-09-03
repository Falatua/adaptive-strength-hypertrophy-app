import { addDays, differenceInCalendarDays } from 'date-fns'
import { comparableAngleHistory, supportsBenchAngle } from './bench-angle-engine'
import { buildMesocyclePreview, draftFromPlan } from './mesocycle-engine'
import { loadIncrementFor } from './equipment-engine'
import { makeSets, recommendProgression } from './training-engine'
import { recommendNextTargetRir } from './effort-progression-engine'
import type {
  CompletedSetRecord,
  CycleReviewDecision,
  CycleReviewEvidence,
  EquipmentProfile,
  Exercise,
  ContinuityState,
  MesocyclePlan,
  SurveyRecord,
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

export function buildCycleReview(plan: MesocyclePlan, sessions: TrainingSession[], history: CompletedSetRecord[], now = new Date(), surveys: SurveyRecord[] = []): CycleReviewSummary {
  const microcycleNumber = currentMicrocycleNumber(plan, sessions)
  const roundSessions = sessionsForMicrocycle(plan, sessions, microcycleNumber)
  const startedAt = roundSessions.length
    ? new Date(Math.min(...roundSessions.map((session) => new Date(session.plannedDate).getTime())))
    : new Date(plan.effectiveAt)
  const targetDate = addDays(startedAt, 7)
  const maximumDate = addDays(startedAt, 14)
  const sessionIds = new Set(roundSessions.map((session) => session.id))
  const sourceSets = history.filter((workSet) => sessionIds.has(workSet.sessionId))
  const qualitySets = sourceSets.filter((workSet) => workSet.qualityConfirmed === true)
  const roundPostSurveys = surveys.filter((survey) => survey.type === 'post' && sessionIds.has(survey.sessionId))
  const surveyValues = (id: string) => roundPostSurveys.flatMap((survey) => {
    const answer = survey.answers.find((candidate) => candidate.id === id && candidate.status === 'answered')
    return typeof answer?.value === 'number' ? [answer.value] : []
  })
  const painValues = surveyValues('pain')
  const techniqueValues = surveyValues('technique')
  const sessionRpes = roundSessions.flatMap((session) => typeof session.sessionRpe === 'number' ? [session.sessionRpe] : [])
  const evidence: CycleReviewEvidence = {
    requiredSessions: roundSessions.length,
    qualifiedSessions: roundSessions.filter(qualified).length,
    unresolvedSessions: roundSessions.filter(unresolved).length,
    totalQualifiedExposures: sessions.filter((session) => session.mesocycleId === plan.id && qualified(session)).length,
    completedSets: sourceSets.length,
    volumeLoad: sourceSets.reduce((sum, workSet) => sum + workSet.reps * workSet.load, 0),
    averageSessionRpe: sessionRpes.length ? sessionRpes.reduce((sum, value) => sum + value, 0) / sessionRpes.length : null,
    maximumPain: painValues.length ? Math.max(...painValues) : qualitySets.length ? Math.max(...qualitySets.map((workSet) => workSet.pain)) : null,
    qualityConfirmedSets: qualitySets.length,
    qualityCoverage: sourceSets.length ? qualitySets.length / sourceSets.length : 0,
    averageTechnique: techniqueValues.length ? techniqueValues.reduce((sum, value) => sum + value, 0) / techniqueValues.length : qualitySets.length ? qualitySets.reduce((sum, workSet) => sum + workSet.technique, 0) / qualitySets.length : null,
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
    recommendationReasons.push('The target number of productive training rounds is complete and the training block is ready for an outcome decision.')
  } else if (evidence.averageSessionRpe !== null && evidence.maximumPain !== null && (evidence.averageTechnique ?? 0) >= 3.5 && (evidence.qualityCoverage ?? 0) >= 0.7 && evidence.averageSessionRpe <= 7.5 && evidence.maximumPain <= 2) {
    recommendation = 'continue-progress'
    recommendationReasons.push('The exposure round is complete with recoverable effort, confirmed repeatable technique, and no elevated pain signal.')
  } else {
    recommendation = 'continue-hold'
    if (evidence.averageSessionRpe === null || evidence.maximumPain === null || (evidence.averageTechnique ?? null) === null) {
      recommendationReasons.push('The round is complete, but effort, technique, or joint-response feedback remains unknown. Repeat targets or approve a different outcome without treating missing feedback as failure.')
    } else if ((evidence.averageTechnique ?? 0) < 3.5) {
      recommendationReasons.push('The round is complete, but confirmed technique supports owning the current targets before another increase.')
    } else {
      recommendationReasons.push('The round is complete, but current effort or recovery supports repeating targets before another increase.')
    }
  }

  return {
    microcycleNumber, startedAt, targetDate, maximumDate, targetPassed, maximumPassed, evidence, recommendation, recommendationReasons,
    eligible: {
      'continue-progress': complete && (evidence.maximumPain === null || evidence.maximumPain < 4),
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
  surveys?: SurveyRecord[]
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
      const exercise = input.exercises.find((candidate) => candidate.id === planned.exerciseId)
      const exactHistory = input.history.filter((workSet) => workSet.exerciseId === planned.exerciseId)
      const comparable = exercise && supportsBenchAngle(exercise) ? comparableAngleHistory(exactHistory, planned) : exactHistory
      const priorPlanned = input.sessions
        .filter((candidate) => candidate.mesocycleId === input.plan.id && (candidate.microcycleNumber ?? 1) === input.nextMicrocycleNumber - 1)
        .flatMap((candidate) => candidate.exercises)
        .find((candidate) => candidate.exerciseId === planned.exerciseId)
      const decision = recommendProgression({
        history: comparable,
        surveys: input.surveys,
        targetLoad: first.targetLoad,
        targetReps: first.targetReps,
        targetSets: planned.sets.length,
        repRange: [Math.max(1, first.targetReps - 2), first.targetReps + 2],
        increment: exercise ? loadIncrementFor(exercise, input.equipmentProfile).value : 5,
        continuity: 'stable' satisfies ContinuityState,
        readiness: 'normal'
      })
      const effort = recommendNextTargetRir({
        currentTargetRir: priorPlanned?.sets[0]?.targetRir ?? first.targetRir,
        nextMicrocycleNumber: input.nextMicrocycleNumber,
        priorPlanned,
        history: comparable,
        surveys: input.surveys ?? []
      })
      return {
        ...planned,
        sets: makeSets(decision.nextSets, decision.nextReps, decision.nextLoad, effort.targetRir)
          .map((workSet, index) => ({ ...workSet, id: `${planned.id}-review-set-${index + 1}` }))
      }
    })
  }))
}
