import type { CompletedSetRecord, MuscleId, PersonalRecord, TrainingSession } from './types'
import { muscleCreditsFor } from './muscle-dose'
import type { Exercise } from './types'

export const BADGE_RULE = 'badge-v1'

export type BadgeId =
  | 'first-light' | 'iron-habit' | 'unbroken' | 'century'
  | 'anvil' | 'proving-ground' | 'record-keeper' | 'archivist'
  | 'foundation' | 'summit' | 'full-spectrum' | 'returner'

export type BadgeTier = 'bronze' | 'silver' | 'gold'

export interface BadgeDefinition {
  id: BadgeId
  name: string
  tier: BadgeTier
  /** What the athlete has to actually do. Written as a promise the app can keep. */
  requirement: string
  /** Said in the athlete's language once it is earned. */
  earnedBlurb: string
}

/**
 * Badges mark things worth being proud of that are not personal records: showing up, coming back,
 * covering the whole body, keeping honest data. Every one is checkable from stored evidence, so a
 * badge is never awarded for a thing the app cannot point at.
 */
export const badgeDefinitions: BadgeDefinition[] = [
  { id: 'first-light', name: 'First Light', tier: 'bronze', requirement: 'Finish your first session.', earnedBlurb: 'The hardest session is the one you start.' },
  { id: 'iron-habit', name: 'Iron Habit', tier: 'bronze', requirement: 'Finish 10 sessions.', earnedBlurb: 'Ten finished sessions is a habit, not an accident.' },
  { id: 'unbroken', name: 'Unbroken', tier: 'silver', requirement: 'Finish 50 sessions.', earnedBlurb: 'Fifty sessions of showing up.' },
  { id: 'century', name: 'Century', tier: 'gold', requirement: 'Finish 100 sessions.', earnedBlurb: 'A hundred sessions. Most people never see this.' },
  { id: 'anvil', name: 'Anvil', tier: 'bronze', requirement: 'Log 250 completed sets.', earnedBlurb: 'Two hundred and fifty sets of real work.' },
  { id: 'proving-ground', name: 'Proving Ground', tier: 'silver', requirement: 'Move 250,000 of total volume.', earnedBlurb: 'A quarter of a million moved, one set at a time.' },
  { id: 'record-keeper', name: 'Record Keeper', tier: 'bronze', requirement: 'Set 5 personal records.', earnedBlurb: 'Five records on the board.' },
  { id: 'archivist', name: 'Archivist', tier: 'silver', requirement: 'Set 10 records with confirmed technique and pain.', earnedBlurb: 'Ten records you can actually trust.' },
  { id: 'foundation', name: 'Foundation', tier: 'bronze', requirement: 'Train 6 different muscles directly.', earnedBlurb: 'Six muscles trained directly. Nothing skipped yet.' },
  { id: 'full-spectrum', name: 'Full Spectrum', tier: 'gold', requirement: 'Train 12 different muscles directly.', earnedBlurb: 'Twelve muscles trained directly. Nothing hiding.' },
  { id: 'summit', name: 'Summit', tier: 'silver', requirement: 'Master 5 movements with 9 or more logged sets each.', earnedBlurb: 'Five movements you have a real history with.' },
  { id: 'returner', name: 'Returner', tier: 'silver', requirement: 'Come back and finish a session after 14 or more days away.', earnedBlurb: 'Coming back is worth more than never stopping.' }
]

export interface EarnedBadge {
  ruleVersion: typeof BADGE_RULE
  definition: BadgeDefinition
  earned: boolean
  /** Progress toward the badge, 0 to 1, so a locked badge still shows how close it is. */
  progress: number
  progressLabel: string
}

const ratio = (value: number, target: number) => Math.max(0, Math.min(1, target === 0 ? 1 : value / target))

/**
 * Evaluates every badge against stored evidence. Locked badges report how close they are rather than
 * staying blank, because a badge you can see yourself approaching is the part that pulls.
 */
export function evaluateBadges(input: {
  history: CompletedSetRecord[]
  records: PersonalRecord[]
  sessions: TrainingSession[]
  exercises: Exercise[]
}): EarnedBadge[] {
  const finished = input.sessions.filter((session) => session.status === 'completed' || session.status === 'partial-primary')
  const sessionCount = finished.length
  const setCount = input.history.length
  const volume = input.history.reduce((total, workSet) => total + workSet.load * workSet.reps, 0)
  const recordCount = input.records.length
  const validatedRecords = input.records.filter((record) => record.validation === 'validated').length

  const directMuscles = new Set<MuscleId>()
  const exposures = new Map<string, number>()
  for (const workSet of input.history) {
    exposures.set(workSet.exerciseId, (exposures.get(workSet.exerciseId) ?? 0) + 1)
    const credits = muscleCreditsFor(workSet.exerciseId, input.exercises) ?? {}
    for (const [muscle, credit] of Object.entries(credits)) {
      if (credit === 1) directMuscles.add(muscle as MuscleId)
    }
  }
  const masteredMovements = [...exposures.values()].filter((count) => count >= 9).length

  // A return is a finished session that follows a gap of two weeks or more.
  const dates = [...new Set(input.history.map((workSet) => workSet.completedAt))].sort()
  let returned = false
  for (let index = 1; index < dates.length; index += 1) {
    const gap = (new Date(dates[index]).getTime() - new Date(dates[index - 1]).getTime()) / 86_400_000
    if (gap >= 14) returned = true
  }

  const measures: Record<BadgeId, { value: number; target: number; unit: string }> = {
    'first-light': { value: sessionCount, target: 1, unit: 'session' },
    'iron-habit': { value: sessionCount, target: 10, unit: 'sessions' },
    unbroken: { value: sessionCount, target: 50, unit: 'sessions' },
    century: { value: sessionCount, target: 100, unit: 'sessions' },
    anvil: { value: setCount, target: 250, unit: 'sets' },
    'proving-ground': { value: volume, target: 250_000, unit: 'volume' },
    'record-keeper': { value: recordCount, target: 5, unit: 'records' },
    archivist: { value: validatedRecords, target: 10, unit: 'confirmed records' },
    foundation: { value: directMuscles.size, target: 6, unit: 'muscles' },
    'full-spectrum': { value: directMuscles.size, target: 12, unit: 'muscles' },
    summit: { value: masteredMovements, target: 5, unit: 'movements' },
    returner: { value: returned ? 1 : 0, target: 1, unit: 'return' }
  }

  return badgeDefinitions.map((definition) => {
    const measure = measures[definition.id]
    const earned = measure.value >= measure.target
    return {
      ruleVersion: BADGE_RULE,
      definition,
      earned,
      progress: ratio(measure.value, measure.target),
      progressLabel: earned
        ? definition.earnedBlurb
        : `${Math.round(measure.value).toLocaleString()} of ${measure.target.toLocaleString()} ${measure.unit}`
    }
  })
}

export function earnedBadgeCount(badges: EarnedBadge[]): number {
  return badges.filter((badge) => badge.earned).length
}
