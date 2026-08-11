import type {
  CompletedSetRecord,
  ContinuityState,
  Exercise,
  PlannedExercise,
  ProgressionDecision,
  ReadinessOutcome,
  RegionVolumePoint,
  SetPrescription,
  SurveyAnswer,
  SessionStatus,
  TrainingSession,
  WeeklyVolumePoint
} from './types'

export const volumeLoad = (sets: Pick<CompletedSetRecord, 'reps' | 'load'>[]) =>
  sets.reduce((total, set) => total + set.reps * set.load, 0)

export const estimatedOneRepMax = (load: number, reps: number) =>
  reps <= 1 ? load : Math.round(load * (1 + reps / 30))

export function sessionCompletionStatus(session: TrainingSession): SessionStatus {
  const primary = session.exercises.find((exercise) => exercise.role === 'primary')
  const primaryStarted = primary?.sets.some((workSet) => workSet.completed) ?? false
  const allComplete = session.exercises.length > 0 && session.exercises.every((exercise) => exercise.sets.every((workSet) => workSet.completed))
  if (allComplete) return 'completed'
  if (primaryStarted) return 'partial-primary'
  return 'partial-no-primary'
}

export function readinessFromSurvey(answers: SurveyAnswer[], continuity: ContinuityState): ReadinessOutcome {
  const byId = Object.fromEntries(answers.filter((answer) => answer.status === 'answered').map((answer) => [answer.id, Number(answer.value)]))
  const pain = byId.pain ?? 0
  if (pain >= 4) return 'pain-aware'
  if (continuity === 'returning') return 'reacclimate'
  const poorSleep = (byId.sleepHours ?? 8) < 5.5 || (byId.sleepQuality ?? 3) <= 1
  const highFatigue = (byId.fatigue ?? 1) >= 4
  const lowEnergy = (byId.energy ?? 3) <= 1
  const highStress = (byId.stress ?? 1) >= 4
  if ([poorSleep, highFatigue, lowEnergy, highStress].filter(Boolean).length >= 2) return 'protect'
  if (poorSleep || highFatigue || lowEnergy || highStress || continuity === 'interrupted') return 'confirm'
  return 'normal'
}

interface ProgressionInput {
  history: CompletedSetRecord[]
  targetLoad: number
  targetReps: number
  targetSets: number
  repRange: [number, number]
  increment: number
  continuity: ContinuityState
  readiness: ReadinessOutcome
}

export function recommendProgression(input: ProgressionInput): ProgressionDecision {
  const { history, targetLoad, targetReps, targetSets, repRange, increment, continuity, readiness } = input
  const reasons: string[] = []
  if (history.length === 0) {
    return {
      action: 'hold',
      title: 'Establish today’s baseline',
      explanation: 'No completed comparable exposure is available yet. Complete the planned work before progressing.',
      nextLoad: targetLoad,
      nextReps: targetReps,
      nextSets: targetSets,
      confidence: 'low',
      reasons: ['No completed comparable exposure']
    }
  }

  const recent = history.slice(-targetSets)
  const avgRir = recent.reduce((sum, set) => sum + set.rir, 0) / recent.length
  const avgTechnique = recent.reduce((sum, set) => sum + set.technique, 0) / recent.length
  const maxPain = Math.max(...recent.map((set) => set.pain))
  const completedReps = recent.reduce((sum, set) => sum + set.reps, 0)
  const expectedReps = targetReps * targetSets

  if (readiness === 'pain-aware' || maxPain >= 4) {
    return {
      action: 'reduce',
      title: 'Protect the affected movement',
      explanation: 'Pain evidence blocks overload. Reduce or substitute this movement and reassess during warm-up.',
      nextLoad: Math.max(0, targetLoad - increment),
      nextReps: targetReps,
      nextSets: Math.max(1, targetSets - 1),
      confidence: 'high',
      reasons: ['Pain blocks progression', 'Safety outranks overload']
    }
  }

  if (continuity === 'returning' || readiness === 'reacclimate') {
    return {
      action: 'reacclimate',
      title: 'Rebuild the exposure',
      explanation: 'The recent gap makes prior capacity less certain. Use a submaximal exposure before resuming progression.',
      nextLoad: Math.max(increment, Math.round((targetLoad * 0.9) / increment) * increment),
      nextReps: Math.max(repRange[0], targetReps - 1),
      nextSets: Math.max(2, targetSets - 1),
      confidence: 'high',
      reasons: ['Returning continuity state', 'Old capacity needs confirmation']
    }
  }

  if (avgTechnique < 3.5 || avgRir < 0.5 || completedReps < expectedReps - 2) {
    return {
      action: 'hold',
      title: 'Own the current target',
      explanation: 'Technique, effort, or completed repetitions do not support overload yet. Repeat the target and improve execution.',
      nextLoad: targetLoad,
      nextReps: targetReps,
      nextSets: targetSets,
      confidence: 'high',
      reasons: ['Progression gate not fully passed', 'Hold before adding dose']
    }
  }

  if (targetReps >= repRange[1] && avgRir >= 1.5 && readiness !== 'protect') {
    reasons.push('Top of rep range reached', 'Target effort was owned', 'Load is the first progression priority')
    return {
      action: 'load',
      title: `Add ${increment} next exposure`,
      explanation: 'You owned the top of the rep range with acceptable effort and technique. The smallest available load increase is earned.',
      nextLoad: targetLoad + increment,
      nextReps: repRange[0],
      nextSets: targetSets,
      confidence: 'high',
      reasons
    }
  }

  if (targetReps < repRange[1] && completedReps >= expectedReps && avgRir >= 1) {
    return {
      action: 'reps',
      title: 'Add one repetition',
      explanation: 'The next load jump is not yet earned, so the next smallest useful win is one more repetition across the work sets.',
      nextLoad: targetLoad,
      nextReps: targetReps + 1,
      nextSets: targetSets,
      confidence: 'high',
      reasons: ['Current load is productive', 'Repetition progression remains in range']
    }
  }

  if (history.length >= targetSets * 3 && avgRir >= 2 && readiness === 'normal' && continuity === 'stable') {
    return {
      action: 'sets',
      title: 'One recovered set is available',
      explanation: 'Load and repetitions have remained stable across multiple exposures while recovery is good. One additional set can increase the current block dose.',
      nextLoad: targetLoad,
      nextReps: targetReps,
      nextSets: targetSets + 1,
      confidence: 'medium',
      reasons: ['Multiple comparable exposures', 'Recovery supports more dose', 'Set increase remains goal-relevant']
    }
  }

  return {
    action: 'hold',
    title: 'Confirm this target once more',
    explanation: 'A bigger number is not clearly earned yet. Repeat the current work and use the result to improve confidence.',
    nextLoad: targetLoad,
    nextReps: targetReps,
    nextSets: targetSets,
    confidence: 'medium',
    reasons: ['Insufficient evidence for a safe increase']
  }
}

const rolePriority: Record<PlannedExercise['role'], number> = {
  primary: 0,
  secondary: 1,
  priority: 2,
  maintenance: 3,
  optional: 4
}

export function compressSession(session: TrainingSession, availableMinutes: number): TrainingSession {
  if (availableMinutes >= session.durationMinutes) return { ...session, durationMinutes: availableMinutes }
  let remaining = availableMinutes
  const exercises = [...session.exercises]
    .sort((a, b) => rolePriority[a.role] - rolePriority[b.role])
    .flatMap((exercise) => {
      if (remaining <= 0) return []
      const minimumSets = exercise.role === 'primary' ? Math.min(2, exercise.sets.length) : 1
      const secondsPerSet = Math.max(120, Math.round((exercise.estimatedMinutes * 60) / exercise.sets.length))
      const possibleSets = Math.floor((remaining * 60) / secondsPerSet)
      const setCount = Math.min(exercise.sets.length, Math.max(exercise.role === 'primary' ? minimumSets : 0, possibleSets))
      if (setCount === 0) return []
      const estimatedMinutes = Math.ceil((setCount * secondsPerSet) / 60)
      remaining -= estimatedMinutes
      return [{ ...exercise, sets: exercise.sets.slice(0, setCount), estimatedMinutes }]
    })
  return { ...session, durationMinutes: availableMinutes, exercises }
}

export function duplicateCandidates(name: string, exercises: Exercise[]) {
  const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, '')
  const needle = normalize(name)
  return exercises
    .map((exercise) => {
      const names = [exercise.name, ...exercise.aliases].map(normalize)
      const exact = names.includes(needle)
      const related = names.some((candidate) => candidate.includes(needle) || needle.includes(candidate))
      return { exercise, score: exact ? 1 : related ? 0.75 : exercise.family.toLowerCase().includes(name.toLowerCase()) ? 0.55 : 0 }
    })
    .filter((candidate) => candidate.score > 0)
    .sort((a, b) => b.score - a.score)
}

export function weeklyVolume(history: CompletedSetRecord[]): WeeklyVolumePoint[] {
  const buckets = new Map<string, WeeklyVolumePoint>()
  history.forEach((set) => {
    const date = new Date(set.completedAt)
    const weekStart = new Date(date)
    weekStart.setDate(date.getDate() - date.getDay())
    const key = weekStart.toISOString().slice(0, 10)
    const current = buckets.get(key) ?? { label: weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), volume: 0, sets: 0 }
    current.volume += set.reps * set.load
    current.sets += 1
    buckets.set(key, current)
  })
  return [...buckets.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([, value]) => value).slice(-8)
}

export function regionVolume(history: CompletedSetRecord[]): RegionVolumePoint[] {
  const buckets = new Map<string, RegionVolumePoint>()
  history.forEach((set) => {
    const current = buckets.get(set.primaryRegion) ?? { region: set.primaryRegion, volume: 0, sets: 0 }
    current.volume += set.reps * set.load
    current.sets += 1
    buckets.set(set.primaryRegion, current)
  })
  return [...buckets.values()].sort((a, b) => b.volume - a.volume)
}

export const makeSets = (count: number, reps: number, load: number, rir = 2): SetPrescription[] =>
  Array.from({ length: count }, (_, index) => ({
    id: `set-${index + 1}`,
    targetReps: reps,
    targetLoad: load,
    targetRir: rir,
    completed: false
  }))
