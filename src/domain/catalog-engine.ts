import type { BodyRegion, EquipmentProfile, Exercise, ExerciseMuscleMapping, MovementPattern } from './types'
import { findExerciseDuplicatePairs, type ExerciseDuplicatePair } from './history-engine'
import { exerciseMuscleMappingError } from './muscle-dose'

export interface ExerciseCatalogInput {
  name: string
  family: string
  aliases: string[]
  pattern: MovementPattern
  primaryRegion: BodyRegion
  equipment: string[]
  description: string
  muscleMapping?: ExerciseMuscleMapping | null
}

export interface ExerciseCatalogProjection {
  exercise: Exercise
  probableDuplicates: ExerciseDuplicatePair[]
}

export interface ExerciseDuplicateGroup {
  exercises: Exercise[]
  pairs: ExerciseDuplicatePair[]
  maxScore: number
}

const cleanText = (value: string) => value.trim().replace(/\s+/g, ' ')
const identityKey = (value: string) => cleanText(value).toLocaleLowerCase()

export function normalizeCatalogList(values: string[], excluded: string[] = []) {
  const excludedKeys = new Set(excluded.map(identityKey))
  const seen = new Set<string>()
  return values.flatMap((value) => {
    const cleaned = cleanText(value)
    const key = identityKey(cleaned)
    if (!cleaned || excludedKeys.has(key) || seen.has(key)) return []
    seen.add(key)
    return [cleaned]
  })
}

export function mergeSystemExerciseCatalog(current: Exercise[] | undefined, systemCatalog: Exercise[]) {
  if (!current?.length) return structuredClone(systemCatalog)
  const systemById = new Map(systemCatalog.map((exercise) => [exercise.id, exercise]))
  const currentIds = new Set(current.map((exercise) => exercise.id))
  const preserved = current.map((exercise) => {
    const system = systemById.get(exercise.id)
    if (!system || exercise.custom) return exercise
    return {
      ...structuredClone(system),
      aliases: normalizeCatalogList([...system.aliases, ...exercise.aliases], [system.name]),
      favorite: exercise.favorite,
      disliked: exercise.disliked,
      jointFeeling: exercise.jointFeeling,
      retired: exercise.retired,
      mergedIntoId: exercise.mergedIntoId
    }
  })
  return [...preserved, ...systemCatalog.filter((exercise) => !currentIds.has(exercise.id)).map((exercise) => structuredClone(exercise))]
}

export function mergeSystemEquipmentProfiles(current: EquipmentProfile[] | undefined, systemProfiles: EquipmentProfile[]) {
  if (!current?.length) return structuredClone(systemProfiles)
  const systemById = new Map(systemProfiles.map((profile) => [profile.id, profile]))
  const currentIds = new Set(current.map((profile) => profile.id))
  const preserved = current.map((profile) => {
    const system = systemById.get(profile.id)
    if (!system || profile.source !== 'seed') return profile
    return {
      ...profile,
      equipment: normalizeCatalogList([...system.equipment, ...profile.equipment]),
      updatedAt: system.updatedAt
    }
  })
  return [...preserved, ...systemProfiles.filter((profile) => !currentIds.has(profile.id)).map((profile) => structuredClone(profile))]
}

export function projectExerciseCatalogEdit(exercises: Exercise[], exerciseId: string, input: ExerciseCatalogInput): ExerciseCatalogProjection {
  const current = exercises.find((exercise) => exercise.id === exerciseId && !exercise.retired)
  if (!current) throw new Error('That active movement could not be found.')

  const requestedName = cleanText(input.name)
  const requestedFamily = cleanText(input.family)
  const requestedDescription = cleanText(input.description)
  const name = current.custom ? requestedName : current.name
  const family = current.custom ? requestedFamily : current.family
  const aliases = normalizeCatalogList(input.aliases, [name])
  const equipment = current.custom ? normalizeCatalogList(input.equipment) : current.equipment

  if (!name) throw new Error('Add a movement name.')
  if (!family) throw new Error('Add an exercise family.')
  if (name.length > 100 || family.length > 100 || aliases.some((alias) => alias.length > 100)) throw new Error('Keep names and aliases under 100 characters.')
  if (aliases.length > 20) throw new Error('Use no more than 20 aliases for one movement.')
  if (current.custom && equipment.length === 0) throw new Error('Add at least one available equipment option.')
  if (requestedDescription.length > 500) throw new Error('Keep the movement note under 500 characters.')
  const muscleMapping = input.muscleMapping === undefined ? current.muscleMapping : input.muscleMapping ?? undefined
  if (current.custom && muscleMapping) {
    const mappingError = exerciseMuscleMappingError(muscleMapping)
    if (mappingError) throw new Error(mappingError)
  }

  const exercise: Exercise = current.custom ? {
    ...current,
    name,
    family,
    aliases,
    pattern: input.pattern,
    regions: [input.primaryRegion],
    primaryRegion: input.primaryRegion,
    equipment,
    description: requestedDescription || current.description,
    muscleMapping
  } : { ...current, aliases }

  const projected = exercises.map((candidate) => candidate.id === exerciseId ? exercise : candidate)
  const probableDuplicates = findExerciseDuplicatePairs(projected).filter((pair) => pair.first.id === exerciseId || pair.second.id === exerciseId)
  const exactDuplicate = probableDuplicates.find((pair) => pair.score === 1)
  if (exactDuplicate) {
    const other = exactDuplicate.first.id === exerciseId ? exactDuplicate.second : exactDuplicate.first
    throw new Error(`That name or alias already belongs to ${other.name}. Review the existing movement instead of splitting its history.`)
  }

  return { exercise, probableDuplicates }
}

export function findExerciseDuplicateGroups(exercises: Exercise[]): ExerciseDuplicateGroup[] {
  // Curated system variations can intentionally share family words such as
  // curl, press, squat, or pullover. The cleanup queue is for athlete-created
  // identity fragmentation, not for treating legitimate system variations as
  // probable duplicates.
  const customPairs = findExerciseDuplicatePairs(exercises).filter((pair) => pair.first.custom && pair.second.custom)
  const customSystemPairs = findExerciseDuplicatePairs(exercises).filter((pair) => pair.first.custom !== pair.second.custom)
  const bestSystemScoreByCustomId = new Map<string, number>()
  customSystemPairs.forEach((pair) => {
    const customId = pair.first.custom ? pair.first.id : pair.second.id
    bestSystemScoreByCustomId.set(customId, Math.max(bestSystemScoreByCustomId.get(customId) ?? 0, pair.score))
  })
  const pairs = [
    ...customPairs,
    ...customSystemPairs.filter((pair) => {
      const customId = pair.first.custom ? pair.first.id : pair.second.id
      return pair.score === bestSystemScoreByCustomId.get(customId)
    })
  ]
  const neighbors = new Map<string, Set<string>>()
  pairs.forEach((pair) => {
    neighbors.set(pair.first.id, new Set([...(neighbors.get(pair.first.id) ?? []), pair.second.id]))
    neighbors.set(pair.second.id, new Set([...(neighbors.get(pair.second.id) ?? []), pair.first.id]))
  })
  const byId = new Map(exercises.filter((exercise) => !exercise.retired).map((exercise) => [exercise.id, exercise]))
  const visited = new Set<string>()
  const groups: ExerciseDuplicateGroup[] = []

  ;[...neighbors.keys()].sort().forEach((startId) => {
    if (visited.has(startId)) return
    const pending = [startId]
    const ids = new Set<string>()
    while (pending.length) {
      const id = pending.pop()!
      if (visited.has(id)) continue
      visited.add(id)
      ids.add(id)
      ;[...(neighbors.get(id) ?? [])].forEach((neighbor) => { if (!visited.has(neighbor)) pending.push(neighbor) })
    }
    const groupExercises = [...ids].flatMap((id) => byId.get(id) ?? []).sort((a, b) => a.name.localeCompare(b.name))
    if (groupExercises.length < 2) return
    const groupPairs = pairs.filter((pair) => ids.has(pair.first.id) && ids.has(pair.second.id))
    groups.push({ exercises: groupExercises, pairs: groupPairs, maxScore: Math.max(...groupPairs.map((pair) => pair.score)) })
  })

  return groups.sort((a, b) => b.maxScore - a.maxScore || b.exercises.length - a.exercises.length || a.exercises[0].name.localeCompare(b.exercises[0].name))
}
