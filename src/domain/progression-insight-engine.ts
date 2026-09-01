import { comparableAngleHistory } from './bench-angle-engine'
import { loadIncrementFor } from './equipment-engine'
import { compactLoadLabel, loadModeForSet } from './load-mode'
import { latestMovementFeedback } from './movement-feedback-engine'
import { recommendProgression } from './training-engine'
import type { AthleteProfile, CompletedSetRecord, CycleReviewEvent, EquipmentProfile, Exercise, MovementProgressPath, PlannedExercise, SurveyRecord, TrainingSession } from './types'

const latestSessionSets = (sets: CompletedSetRecord[]) => {
  const latest = [...sets].sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())[0]
  return latest ? sets.filter((workSet) => workSet.sessionId === latest.sessionId).sort((a, b) => a.setIndex - b.setIndex) : []
}

const scheme = (sets: Array<{ reps: number }>) => sets.map((workSet) => workSet.reps).join(' / ')

export function buildMovementProgressPath(input: {
  athlete: AthleteProfile
  session: TrainingSession
  planned: PlannedExercise
  exercise: Exercise
  history: CompletedSetRecord[]
  surveys: SurveyRecord[]
  cycleReviews?: CycleReviewEvent[]
  equipmentProfile: EquipmentProfile
  units: 'lb' | 'kg'
}): MovementProgressPath {
  const { athlete, session, planned, exercise, history, surveys, equipmentProfile, units } = input
  const first = planned.sets[0]
  const mode = loadModeForSet(first ?? {}, exercise)
  const exact = comparableAngleHistory(history.filter((workSet) => workSet.exerciseId === exercise.id), planned)
    .filter((workSet) => (workSet.loadMode ?? (mode === 'bodyweight' ? 'bodyweight' : 'external')) === mode)
  const prior = latestSessionSets(exact)
  const targetLoad = first?.targetLoad ?? 0
  const targetReps = first?.targetReps ?? 0
  const targetSets = planned.sets.length
  const decision = recommendProgression({
    history: exact,
    surveys,
    targetLoad,
    targetReps,
    targetSets,
    repRange: planned.role === 'primary' ? [Math.max(1, targetReps - 2), targetReps + 2] : [Math.max(1, targetReps - 3), targetReps + 3],
    increment: loadIncrementFor(exercise, equipmentProfile).value,
    continuity: athlete.continuity,
    readiness: session.readiness ?? 'confirm'
  })
  const feedback = latestMovementFeedback(surveys, session.id, planned.id)
  const painAnswer = feedback?.answers.find((answer) => answer.id === 'pain' && answer.status === 'answered')
  const protection = session.painStatus === 'changed-training'
    || ['protect', 'pain-aware'].includes(session.readiness ?? '')
    || ['irritating', 'avoid'].includes(exercise.jointFeeling)
    || (typeof painAnswer?.value === 'number' && painAnswer.value >= 4)
  const latestRoundDecision = [...(input.cycleReviews ?? [])]
    .filter((review) => review.mesocycleId === session.mesocycleId && new Date(review.createdAt).getTime() <= new Date(session.startedAt ?? session.plannedDate).getTime())
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
  const roundHold = latestRoundDecision && ['continue-hold', 'extend', 'recover'].includes(latestRoundDecision.decision)
  const priorLoad = prior[0]?.load ?? 0
  const priorMode = prior[0]?.loadMode ?? mode
  const priorTotal = prior.reduce((sum, workSet) => sum + workSet.reps, 0)
  const todayTotal = planned.sets.reduce((sum, workSet) => sum + workSet.targetReps, 0)
  const last = prior.length
    ? `${prior.length} sets · ${scheme(prior)} reps · ${compactLoadLabel(priorMode, priorLoad, units)}`
    : 'No exact completed exposure'
  const today = `${targetSets} sets · ${scheme(planned.sets.map((workSet) => ({ reps: workSet.targetReps })))} reps · ${compactLoadLabel(mode, targetLoad, units)}`

  let status: MovementProgressPath['status'] = exact.length ? 'hold' : 'baseline'
  let title = exact.length ? 'Own today’s prescription' : 'Establish an exact baseline'
  let nextLoad = decision.nextLoad
  let nextReps = decision.nextReps
  let nextSets = decision.nextSets
  let next = today
  let toProgress = exact.length ? 'Complete the planned work with honest effort and clean execution.' : 'Log the load mode, repetitions, effort, and any setup details you track.'

  if (protection || decision.action === 'reduce') {
    status = 'protect'
    title = 'Protect the useful work'
    nextLoad = targetLoad
    nextReps = targetReps
    nextSets = targetSets
    next = 'Hold or reduce after athlete review'
    toProgress = 'Do not chase a record. Modify or stop if pain changes training.'
  } else if (roundHold) {
    status = 'hold'
    title = latestRoundDecision.decision === 'recover' ? 'Recovery decision holds progression' : 'The training-round decision holds today'
    nextLoad = targetLoad
    nextReps = targetReps
    nextSets = targetSets
    next = today
    toProgress = latestRoundDecision.reason || 'Complete the held prescription and review the next round from finished work.'
  } else if (decision.action === 'reacclimate') {
    status = 'hold'
    title = 'Rebuild the exact movement first'
    next = `${decision.nextSets} sets · ${decision.nextReps} reps · ${compactLoadLabel(mode, decision.nextLoad, units)}`
    toProgress = 'Complete one easier, pain-free exact exposure before pursuing the prior progression path.'
  } else if (mode === 'bodyweight') {
    nextLoad = 0
    if (decision.action === 'sets') {
      status = 'push-sets'
      title = 'One set is the last progression lever'
      next = `${Math.max(targetSets, decision.nextSets)} bodyweight sets`
      toProgress = `First own ${todayTotal} total reps. Add a set only when reps and execution have no better path.`
    } else if (exact.length) {
      status = 'push-reps'
      title = 'Build the bodyweight rep path'
      nextReps = Math.max(targetReps, decision.nextReps, Math.max(...prior.map((workSet) => workSet.reps)) + 1)
      next = `${nextReps} reps in the lead set or ${Math.max(todayTotal, priorTotal + 1)} total reps`
      toProgress = `Add one clean repetition inside the planned sets before adding another set.`
    }
  } else if (mode === 'assisted-bodyweight') {
    const leastAssistance = exact.filter((workSet) => workSet.loadMode === mode).reduce((minimum, workSet) => Math.min(minimum, workSet.load), Number.POSITIVE_INFINITY)
    const increment = loadIncrementFor(exercise, equipmentProfile).value
    nextLoad = Number.isFinite(leastAssistance) ? Math.max(0, leastAssistance - increment) : targetLoad
    status = exact.length ? 'reduce-assistance' : 'baseline'
    title = exact.length ? 'Earn less assistance' : 'Establish an assisted baseline'
    next = `${compactLoadLabel(mode, nextLoad, units)} for ${targetReps} reps`
    toProgress = `Keep repetitions and execution stable, then reduce assistance by ${increment} ${units}.`
  } else if (decision.action === 'load') {
    status = 'push-load'
    title = mode === 'weighted-bodyweight' ? 'Earn more added load' : 'Load progression is available'
    next = `${compactLoadLabel(mode, decision.nextLoad, units)} for ${targetReps} reps`
    toProgress = 'Complete the top of the prescribed rep path without worse effort or pain.'
  } else if (decision.action === 'reps') {
    status = 'push-reps'
    title = 'A repetition is the next useful win'
    next = `${decision.nextReps} reps at ${compactLoadLabel(mode, targetLoad, units)}`
    toProgress = 'Add repetitions before load while keeping the same number of sets.'
  } else if (decision.action === 'sets') {
    status = 'push-sets'
    title = 'A set is the last progression lever'
    next = `${decision.nextSets} sets at ${compactLoadLabel(mode, targetLoad, units)}`
    toProgress = 'Add a set only after load and repetition progression are not appropriate.'
  }

  return {
    ruleVersion: 'movement-progress-path-v1', exerciseId: exercise.id, plannedExerciseId: planned.id, loadMode: mode,
    status, title, last, today, next, toProgress,
    explanation: protection ? 'Safety and the athlete’s current signal outrank progression.' : decision.explanation,
    confidence: decision.confidence, sourceSetIds: decision.evidence.sourceSetIds,
    unknownInputs: decision.evidence.unknownInputs,
    proposed: { load: nextLoad, reps: nextReps, sets: nextSets, loadMode: mode },
    canApply: status !== 'protect' && exact.length > 0 && nextSets === targetSets && (nextLoad !== targetLoad || nextReps !== targetReps)
  }
}
