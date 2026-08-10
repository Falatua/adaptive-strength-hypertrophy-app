import type { BodyRegion, Exercise, MovementPattern } from './types'
import { findExerciseDuplicatePairs, type ExerciseDuplicatePair } from './history-engine'

export interface ExerciseCatalogInput {
  name: string
  family: string
  aliases: string[]
  pattern: MovementPattern
  primaryRegion: BodyRegion
  equipment: string[]
  description: string
}

export interface ExerciseCatalogProjection {
  exercise: Exercise
  probableDuplicates: ExerciseDuplicatePair[]
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

  const exercise: Exercise = current.custom ? {
    ...current,
    name,
    family,
    aliases,
    pattern: input.pattern,
    regions: [input.primaryRegion],
    primaryRegion: input.primaryRegion,
    equipment,
    description: requestedDescription || current.description
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
