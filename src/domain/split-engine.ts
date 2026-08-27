import type { BodyRegion } from './types'

export const SPLIT_RULE = 'training-split-v1'

export type SplitShape = 'full-body' | 'upper-lower' | 'push-pull-legs' | 'body-part-focus'

export interface SplitDay {
  /** Position in the week, starting at one. */
  day: number
  label: string
  /** Regions this day emphasises. An empty list means the day trains everything. */
  emphasis: BodyRegion[]
}

export interface TrainingSplit {
  ruleVersion: typeof SPLIT_RULE
  shape: SplitShape
  label: string
  weeklySessions: number
  /** How many times each trained muscle is hit across the week. */
  frequencyPerMuscle: number
  days: SplitDay[]
  reasons: string[]
}

const UPPER: BodyRegion[] = ['chest', 'back', 'traps', 'shoulders', 'biceps', 'triceps']
const LOWER: BodyRegion[] = ['quadriceps', 'hamstrings', 'glutes', 'calves']
const PUSH: BodyRegion[] = ['chest', 'shoulders', 'triceps']
const PULL: BodyRegion[] = ['back', 'traps', 'biceps', 'forearms']

/**
 * How narrow each training day should be follows directly from how often the athlete trains.
 *
 * The constant worth protecting is frequency per muscle, not the name of the split. Renaissance
 * Periodization puts the productive range at roughly two to four sessions per muscle per week, so a
 * two-day week has to train everything each time to reach it, while a six-day week would badly
 * overshoot if every day were full body. Splitting is what keeps per-muscle frequency in range as
 * total sessions rise, which is the opposite of splitting because more days feels more serious.
 */
export function trainingSplitFor(weeklySessions: number): TrainingSplit {
  const sessions = Math.max(1, Math.min(7, Math.round(weeklySessions)))
  const build = (shape: SplitShape, label: string, days: SplitDay[], frequencyPerMuscle: number, reasons: string[]): TrainingSplit =>
    ({ ruleVersion: SPLIT_RULE, shape, label, weeklySessions: sessions, frequencyPerMuscle, days, reasons })

  const everything = (day: number, label = 'Whole body'): SplitDay => ({ day, label, emphasis: [] })

  if (sessions <= 3) {
    return build('full-body', 'Whole body', Array.from({ length: sessions }, (_, index) => everything(index + 1)),
      sessions,
      [
        `Training ${sessions} ${sessions === 1 ? 'day' : 'days'} a week means every session has to cover everything to reach a useful weekly frequency.`,
        'Splitting this week into body parts would leave most muscles trained once, which is below what reliably grows them.'
      ])
  }

  if (sessions === 4) {
    return build('upper-lower', 'Upper and lower', [
      { day: 1, label: 'Upper', emphasis: UPPER },
      { day: 2, label: 'Lower', emphasis: LOWER },
      { day: 3, label: 'Upper', emphasis: UPPER },
      { day: 4, label: 'Lower', emphasis: LOWER }
    ], 2, [
      'Four days splits cleanly into upper and lower, which hits every muscle twice a week.',
      'Each day covers half the body, so there is room for real volume per muscle without a three-hour session.'
    ])
  }

  if (sessions === 5) {
    return build('upper-lower', 'Upper, lower, and a focus day', [
      { day: 1, label: 'Upper', emphasis: UPPER },
      { day: 2, label: 'Lower', emphasis: LOWER },
      { day: 3, label: 'Upper', emphasis: UPPER },
      { day: 4, label: 'Lower', emphasis: LOWER },
      { day: 5, label: 'Weak point focus', emphasis: [] }
    ], 2, [
      'Five days keeps the upper and lower rotation and spends the extra day on whatever needs the most work.',
      'The focus day is where a lagging muscle gets a third exposure without disturbing the rest of the week.'
    ])
  }

  return build('push-pull-legs', 'Push, pull, and legs', [
    { day: 1, label: 'Push', emphasis: PUSH },
    { day: 2, label: 'Pull', emphasis: PULL },
    { day: 3, label: 'Legs', emphasis: LOWER },
    { day: 4, label: 'Push', emphasis: PUSH },
    { day: 5, label: 'Pull', emphasis: PULL },
    { day: 6, label: 'Legs', emphasis: LOWER },
    ...(sessions === 7 ? [{ day: 7, label: 'Weak point focus', emphasis: [] as BodyRegion[] }] : [])
  ].slice(0, sessions), 2, [
    `Training ${sessions} days a week is enough to give each pattern its own day and still hit every muscle twice.`,
    'Narrowing each day is what keeps per-muscle frequency in the productive range instead of overshooting it.'
  ])
}

/** Plain sentence describing why this shape follows from the athlete's schedule. */
export function splitRationale(split: TrainingSplit): string {
  return `${split.weeklySessions} ${split.weeklySessions === 1 ? 'day' : 'days'} a week works best as ${split.label.toLowerCase()}, which trains each muscle about ${split.frequencyPerMuscle} ${split.frequencyPerMuscle === 1 ? 'time' : 'times'} a week.`
}
