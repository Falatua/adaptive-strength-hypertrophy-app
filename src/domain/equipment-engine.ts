import type { EquipmentProfile, Exercise, LoadIncrementKind, TrainingSession } from './types'

export const equipmentProfileRuleVersion = 'equipment-profile-v1' as const
export const loadIncrementRuleVersion = 'load-increment-v1' as const

export const defaultLoadIncrements: EquipmentProfile['increments'] = {
  barbell: 5,
  dumbbell: 5,
  cable: 5,
  machine: 10,
  other: 5
}

export const normalizeEquipmentTag = (value: string) => value.trim().toLowerCase().replace(/\s+/g, ' ')

export const normalizeEquipmentList = (values: string[]) => [...new Set(values.map(normalizeEquipmentTag).filter(Boolean))].sort()

export function equipmentProfileError(profile: unknown): string | null {
  if (typeof profile !== 'object' || profile === null || Array.isArray(profile)) return 'Equipment profile must be a structured record.'
  const candidate = profile as Partial<EquipmentProfile>
  if (typeof candidate.id !== 'string' || !candidate.id.trim()) return 'Equipment profile needs a stable ID.'
  if (typeof candidate.name !== 'string' || candidate.name.trim().length < 2 || candidate.name.trim().length > 60) return 'Equipment profile name must be 2 to 60 characters.'
  if (!['commercial-gym', 'home-gym', 'travel', 'hotel', 'bodyweight', 'custom'].includes(String(candidate.kind))) return 'Equipment profile has an unsupported location type.'
  if (!Array.isArray(candidate.equipment) || candidate.equipment.length === 0 || candidate.equipment.some((item) => typeof item !== 'string' || !normalizeEquipmentTag(item))) return 'Equipment profile needs at least one valid equipment item.'
  if (new Set(candidate.equipment.map((item) => normalizeEquipmentTag(item))).size !== candidate.equipment.length) return 'Equipment profile cannot contain duplicate equipment items.'
  if (typeof candidate.increments !== 'object' || candidate.increments === null) return 'Equipment profile needs executable load increments.'
  if ((['barbell', 'dumbbell', 'cable', 'machine', 'other'] as const).some((key) => typeof candidate.increments?.[key] !== 'number' || !Number.isFinite(candidate.increments[key]) || candidate.increments[key] <= 0 || candidate.increments[key] > 100)) return 'Every load increment must be greater than zero and no more than 100.'
  if (!['lb', 'kg'].includes(String(candidate.incrementUnit))) return 'Equipment profile needs a valid increment unit.'
  if (!Array.isArray(candidate.constraints) || candidate.constraints.some((item) => typeof item !== 'string' || item.trim().length > 160)) return 'Equipment constraints must be short text entries.'
  if (!['seed', 'athlete'].includes(String(candidate.source))) return 'Equipment profile has an unsupported source.'
  if (typeof candidate.updatedAt !== 'string' || Number.isNaN(new Date(candidate.updatedAt).getTime())) return 'Equipment profile needs a valid update date.'
  return null
}

export function normalizedEquipmentProfile(profile: EquipmentProfile): EquipmentProfile {
  return {
    ...profile,
    name: profile.name.trim(),
    equipment: normalizeEquipmentList(profile.equipment),
    constraints: [...new Set(profile.constraints.map((item) => item.trim()).filter(Boolean))]
  }
}

export interface EquipmentFit {
  available: boolean
  required: string[]
  missing: string[]
}

export function exerciseEquipmentFit(exercise: Exercise, profile: EquipmentProfile): EquipmentFit {
  const available = new Set(profile.equipment.map(normalizeEquipmentTag))
  const required = normalizeEquipmentList(exercise.equipment)
  const missing = required.filter((item) => !available.has(item))
  return { available: missing.length === 0, required, missing }
}

export interface SessionEquipmentGap {
  plannedExerciseId: string
  exerciseId: string
  exerciseName: string
  role: TrainingSession['exercises'][number]['role']
  missing: string[]
}

export function sessionEquipmentGaps(session: TrainingSession, exercises: Exercise[], profile: EquipmentProfile): SessionEquipmentGap[] {
  return session.exercises.flatMap((planned) => {
    const exercise = exercises.find((candidate) => candidate.id === planned.exerciseId)
    if (!exercise) return [{ plannedExerciseId: planned.id, exerciseId: planned.exerciseId, exerciseName: planned.exerciseId, role: planned.role, missing: ['unknown exercise identity'] }]
    const fit = exerciseEquipmentFit(exercise, profile)
    return fit.available ? [] : [{ plannedExerciseId: planned.id, exerciseId: exercise.id, exerciseName: exercise.name, role: planned.role, missing: fit.missing }]
  })
}

export function loadIncrementKindFor(exercise: Exercise): LoadIncrementKind {
  const equipment = exercise.equipment.map(normalizeEquipmentTag)
  if (equipment.some((item) => item === 'barbell' || item.includes('bar'))) return 'barbell'
  if (equipment.some((item) => item.includes('dumbbell'))) return 'dumbbell'
  if (equipment.some((item) => item.includes('cable'))) return 'cable'
  if (equipment.some((item) => item.includes('machine') || item.includes('leg curl'))) return 'machine'
  return 'other'
}

export function loadIncrementFor(exercise: Exercise, profile: EquipmentProfile): { kind: LoadIncrementKind; value: number; unit: EquipmentProfile['incrementUnit'] } {
  const kind = loadIncrementKindFor(exercise)
  return { kind, value: profile.increments[kind], unit: profile.incrementUnit }
}

export function nearestExecutableLoad(load: number, increment: number) {
  if (!Number.isFinite(load) || load <= 0) return 0
  return Math.round(load / increment) * increment
}
