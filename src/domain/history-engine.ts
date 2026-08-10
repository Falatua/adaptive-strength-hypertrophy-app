import type {
  AthleteProfile,
  CompletedSetRecord,
  Exercise,
  PersonalRecord,
  TrainingSession
} from './types'

export const historyVolume = (history: CompletedSetRecord[]) =>
  history.reduce((total, workSet) => total + workSet.reps * workSet.load, 0)

const latest = (sets: CompletedSetRecord[]) =>
  [...sets].sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())[0]

const best = (sets: CompletedSetRecord[], value: (workSet: CompletedSetRecord) => number) =>
  [...sets].sort((a, b) => value(b) - value(a) || new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())[0]

export function derivePersonalRecords(history: CompletedSetRecord[]): PersonalRecord[] {
  const byExercise = new Map<string, CompletedSetRecord[]>()
  history.forEach((workSet) => byExercise.set(workSet.exerciseId, [...(byExercise.get(workSet.exerciseId) ?? []), workSet]))
  const records: PersonalRecord[] = []

  byExercise.forEach((sets, exerciseId) => {
    const loadSet = best(sets, (workSet) => workSet.load)
    const repSet = best(sets, (workSet) => workSet.reps)
    const strengthSet = best(sets, (workSet) => workSet.load * (1 + workSet.reps / 30))
    const sessions = new Map<string, CompletedSetRecord[]>()
    sets.forEach((workSet) => sessions.set(workSet.sessionId, [...(sessions.get(workSet.sessionId) ?? []), workSet]))
    const volumeSets = [...sessions.values()].sort((a, b) => historyVolume(b) - historyVolume(a) || new Date(latest(b).completedAt).getTime() - new Date(latest(a).completedAt).getTime())[0]
    const exerciseName = loadSet.exerciseName

    records.push(
      {
        id: `record:${exerciseId}:load`, exerciseId, exerciseName, type: 'load', value: loadSet.load,
        label: `${loadSet.load} lb heaviest completed set`, achievedAt: loadSet.completedAt, sourceSetIds: [loadSet.id]
      },
      {
        id: `record:${exerciseId}:reps`, exerciseId, exerciseName, type: 'reps', value: repSet.reps,
        label: `${repSet.reps} reps in one completed set`, achievedAt: repSet.completedAt, sourceSetIds: [repSet.id]
      },
      {
        id: `record:${exerciseId}:volume`, exerciseId, exerciseName, type: 'volume', value: historyVolume(volumeSets),
        label: `${historyVolume(volumeSets)} session volume`, achievedAt: latest(volumeSets).completedAt,
        sourceSetIds: volumeSets.map((workSet) => workSet.id)
      },
      {
        id: `record:${exerciseId}:estimated-strength`, exerciseId, exerciseName, type: 'estimated-strength',
        value: Math.round(strengthSet.load * (1 + strengthSet.reps / 30)),
        label: `${Math.round(strengthSet.load * (1 + strengthSet.reps / 30))} lb estimated strength`,
        achievedAt: strengthSet.completedAt, sourceSetIds: [strengthSet.id]
      }
    )
  })

  return records.sort((a, b) => new Date(b.achievedAt).getTime() - new Date(a.achievedAt).getTime() || a.id.localeCompare(b.id))
}

const normalized = (value: string) => value.toLowerCase().replace(/\b(barbell|dumbbell|machine|cable)\b/g, '').replace(/[^a-z0-9]/g, '')
const identityModifiers = ['paused', 'pause', 'deficit', 'incline', 'decline', 'board', 'competition', 'safety', 'close-grip', 'close grip', 'wide-grip', 'wide grip']
const modifiersFor = (exercise: Exercise) => new Set(identityModifiers.filter((modifier) => [exercise.name, ...exercise.aliases].some((name) => name.toLowerCase().includes(modifier))))
const equalSets = (first: Set<string>, second: Set<string>) => first.size === second.size && [...first].every((item) => second.has(item))

export interface ExerciseDuplicatePair {
  first: Exercise
  second: Exercise
  score: number
  reason: string
}

export function findExerciseDuplicatePairs(exercises: Exercise[]): ExerciseDuplicatePair[] {
  const active = exercises.filter((exercise) => !exercise.retired)
  const pairs: ExerciseDuplicatePair[] = []
  active.forEach((first, index) => {
    active.slice(index + 1).forEach((second) => {
      const firstNames = [first.name, ...first.aliases].map(normalized)
      const secondNames = [second.name, ...second.aliases].map(normalized)
      const exact = firstNames.some((name) => secondNames.includes(name))
      const related = equalSets(modifiersFor(first), modifiersFor(second)) && firstNames.some((name) => secondNames.some((candidate) => name.length >= 5 && (name.includes(candidate) || candidate.includes(name))))
      const sameFamily = normalized(first.family) === normalized(second.family)
      const samePattern = first.pattern === second.pattern
      const score = exact ? 1 : related && samePattern ? 0.86 : sameFamily && samePattern ? 0.62 : 0
      if (score >= 0.7) pairs.push({ first, second, score, reason: exact ? 'Matching name or alias' : related ? 'Overlapping name and movement type' : 'Same exercise family and movement type' })
    })
  })
  return pairs.sort((a, b) => b.score - a.score || a.first.name.localeCompare(b.first.name))
}

export interface MergeProjectionInput {
  exercises: Exercise[]
  history: CompletedSetRecord[]
  sessions: TrainingSession[]
  athlete: AthleteProfile
  sourceIds: string[]
  targetId: string
}

export function projectExerciseMerge(input: MergeProjectionInput) {
  const sourceIds = [...new Set(input.sourceIds)].filter((id) => id !== input.targetId)
  const sourceSet = new Set(sourceIds)
  const target = input.exercises.find((exercise) => exercise.id === input.targetId)
  if (!target) throw new Error('Choose a valid movement to keep.')
  const sources = input.exercises.filter((exercise) => sourceSet.has(exercise.id) && !exercise.retired)
  if (!sources.length) throw new Error('Choose at least one active duplicate to merge.')
  const aliases = [...new Set([...target.aliases, ...sources.flatMap((exercise) => [exercise.name, ...exercise.aliases])])].filter((name) => name !== target.name)
  const exercises = input.exercises.map((exercise) => exercise.id === target.id
    ? { ...exercise, aliases }
    : sourceSet.has(exercise.id)
      ? { ...exercise, retired: true, mergedIntoId: target.id }
      : exercise)
  const history = input.history.map((workSet) => sourceSet.has(workSet.exerciseId) ? {
    ...workSet,
    originalExerciseId: workSet.originalExerciseId ?? workSet.exerciseId,
    originalExerciseName: workSet.originalExerciseName ?? workSet.exerciseName,
    originalFamily: workSet.originalFamily ?? workSet.family,
    originalPrimaryRegion: workSet.originalPrimaryRegion ?? workSet.primaryRegion,
    exerciseId: target.id,
    exerciseName: target.name,
    family: target.family,
    primaryRegion: target.primaryRegion
  } : workSet)
  const sessions = input.sessions.map((session) => ['planned', 'deferred'].includes(session.status) ? {
    ...session,
    exercises: session.exercises.map((planned) => sourceSet.has(planned.exerciseId) ? { ...planned, exerciseId: target.id } : planned)
  } : session)
  const strengthAnchors = [...new Set(input.athlete.strengthAnchors.map((id) => sourceSet.has(id) ? target.id : id))]
  return { exercises, history, sessions, athlete: { ...input.athlete, strengthAnchors }, sources, target }
}
