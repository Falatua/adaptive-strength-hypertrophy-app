import type { CompletedSetRecord, SessionStatus, TrainingSession } from './types'

export const CALENDAR_EXPOSURE_RULE_VERSION = 'calendar-exposure-v1' as const

const DAY_MS = 86_400_000

function startOfLocalDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function addDays(date: Date, amount: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + amount)
  return next
}

export function calendarDayKey(value: string | Date) {
  const date = typeof value === 'string' ? new Date(value) : value
  if (Number.isNaN(date.getTime())) return null
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function calendarDistance(from: string | Date, to: string | Date) {
  const fromDate = typeof from === 'string' ? new Date(from) : from
  const toDate = typeof to === 'string' ? new Date(to) : to
  if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) return null
  return Math.round((startOfLocalDay(toDate).getTime() - startOfLocalDay(fromDate).getTime()) / DAY_MS)
}

export interface CalendarPlanEntry {
  sessionId: string
  title: string
  plannedAt: string
  status: SessionStatus
  plannedExerciseIds: string[]
  actualDayKey: string | null
  driftDays: number | null
}

export interface CalendarCompletionEntry {
  id: string
  sessionId: string
  title: string
  completedAt: string
  plannedDayKey: string | null
  driftDays: number | null
  sourceSetIds: string[]
  exerciseIds: string[]
  exerciseNames: string[]
  completedSets: number
  repetitions: number
  volumeLoad: number
  linkedToStoredSession: boolean
  imported: boolean
}

export interface CalendarDayEntry {
  key: string
  date: string
  dayOfMonth: number
  inSelectedMonth: boolean
  isToday: boolean
  plans: CalendarPlanEntry[]
  completions: CalendarCompletionEntry[]
  completedSets: number
  volumeLoad: number
  missedOrMovedCount: number
}

export interface CalendarMonthView {
  ruleVersion: typeof CALENDAR_EXPOSURE_RULE_VERSION
  monthKey: string
  label: string
  days: CalendarDayEntry[]
  plannedOpportunityCount: number
  completedActivityCount: number
  completedSetCount: number
  volumeLoad: number
  missedOrMovedCount: number
}

function completionTimestampFor(session: TrainingSession | undefined, sets: CompletedSetRecord[]) {
  const candidate = session?.completedAt ?? sets.map((workSet) => workSet.completedAt).sort().at(-1)
  return candidate && !Number.isNaN(new Date(candidate).getTime()) ? candidate : null
}

export function buildCalendarMonth(input: {
  sessions: TrainingSession[]
  history: CompletedSetRecord[]
  month: Date
  now?: Date
}): CalendarMonthView {
  const now = input.now ?? new Date()
  const month = new Date(input.month.getFullYear(), input.month.getMonth(), 1)
  const gridStart = addDays(month, -month.getDay())
  const days: CalendarDayEntry[] = Array.from({ length: 42 }, (_, index) => {
    const date = addDays(gridStart, index)
    return {
      key: calendarDayKey(date)!,
      date: date.toISOString(),
      dayOfMonth: date.getDate(),
      inSelectedMonth: date.getMonth() === month.getMonth() && date.getFullYear() === month.getFullYear(),
      isToday: calendarDayKey(date) === calendarDayKey(now),
      plans: [],
      completions: [],
      completedSets: 0,
      volumeLoad: 0,
      missedOrMovedCount: 0
    }
  })
  const byKey = new Map(days.map((day) => [day.key, day]))
  const sessionById = new Map(input.sessions.map((session) => [session.id, session]))
  const setsBySession = new Map<string, CompletedSetRecord[]>()
  input.history.forEach((workSet) => setsBySession.set(workSet.sessionId, [...(setsBySession.get(workSet.sessionId) ?? []), workSet]))

  input.sessions.forEach((session) => {
    const key = calendarDayKey(session.plannedDate)
    const day = key ? byKey.get(key) : undefined
    if (!day) return
    const sets = setsBySession.get(session.id) ?? []
    const actualAt = completionTimestampFor(session, sets)
    day.plans.push({
      sessionId: session.id,
      title: session.title,
      plannedAt: session.plannedDate,
      status: session.status,
      plannedExerciseIds: session.exercises.map((exercise) => exercise.exerciseId),
      actualDayKey: actualAt ? calendarDayKey(actualAt) : null,
      driftDays: actualAt ? calendarDistance(session.plannedDate, actualAt) : null
    })
    if (['deferred', 'expired', 'stopped'].includes(session.status)) day.missedOrMovedCount += 1
  })

  setsBySession.forEach((sets, sessionId) => {
    const session = sessionById.get(sessionId)
    const setsByCompletionDay = new Map<string, CompletedSetRecord[]>()
    sets.forEach((workSet) => {
      const key = calendarDayKey(workSet.completedAt)
      if (key) setsByCompletionDay.set(key, [...(setsByCompletionDay.get(key) ?? []), workSet])
    })
    setsByCompletionDay.forEach((daySets, key) => {
      const day = byKey.get(key)
      if (!day) return
      const completedAt = daySets.map((workSet) => workSet.completedAt).sort().at(-1)!
      const volumeLoad = daySets.reduce((sum, workSet) => sum + workSet.load * workSet.reps, 0)
      const plannedDayKey = session ? calendarDayKey(session.plannedDate) : null
      const entry: CalendarCompletionEntry = {
        id: `${sessionId}:${key}`,
        sessionId,
        title: session?.title ?? (daySets.some((workSet) => workSet.importBatchId) ? 'Imported training' : 'Completed training'),
        completedAt,
        plannedDayKey,
        driftDays: session ? calendarDistance(session.plannedDate, completedAt) : null,
        sourceSetIds: daySets.map((workSet) => workSet.id),
        exerciseIds: [...new Set(daySets.map((workSet) => workSet.exerciseId))],
        exerciseNames: [...new Set(daySets.map((workSet) => workSet.exerciseName))],
        completedSets: daySets.length,
        repetitions: daySets.reduce((sum, workSet) => sum + workSet.reps, 0),
        volumeLoad,
        linkedToStoredSession: Boolean(session),
        imported: daySets.some((workSet) => Boolean(workSet.importBatchId))
      }
      day.completions.push(entry)
      day.completedSets += entry.completedSets
      day.volumeLoad += entry.volumeLoad
    })
  })

  days.forEach((day) => {
    day.plans.sort((a, b) => a.title.localeCompare(b.title))
    day.completions.sort((a, b) => a.completedAt.localeCompare(b.completedAt) || a.sessionId.localeCompare(b.sessionId))
  })
  const inMonth = days.filter((day) => day.inSelectedMonth)
  return {
    ruleVersion: CALENDAR_EXPOSURE_RULE_VERSION,
    monthKey: `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`,
    label: month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    days,
    plannedOpportunityCount: inMonth.reduce((sum, day) => sum + day.plans.length, 0),
    completedActivityCount: inMonth.reduce((sum, day) => sum + day.completions.length, 0),
    completedSetCount: inMonth.reduce((sum, day) => sum + day.completedSets, 0),
    volumeLoad: inMonth.reduce((sum, day) => sum + day.volumeLoad, 0),
    missedOrMovedCount: inMonth.reduce((sum, day) => sum + day.missedOrMovedCount, 0)
  }
}

export type ExposureChangeKind = 'baseline' | 'load' | 'repetitions' | 'sets' | 'volume' | 'hold-or-mixed'

export interface ExerciseExposurePoint {
  sequence: number
  sessionId: string
  completedAt: string
  exerciseId: string
  exerciseName: string
  sourceSetIds: string[]
  completedSets: number
  repetitions: number
  volumeLoad: number
  heaviestLoad: number
  maxRepsAtHeaviestLoad: number
  bestEstimatedStrength: number
  averageRir: number
  qualityConfirmedSets: number
  imported: boolean
  daysSincePrior: number | null
  changeKind: ExposureChangeKind
  changeLabel: string
}

function exposureChange(current: Omit<ExerciseExposurePoint, 'sequence' | 'daysSincePrior' | 'changeKind' | 'changeLabel'>, prior: ExerciseExposurePoint | null) {
  if (!prior) return { changeKind: 'baseline' as const, changeLabel: 'First exact exposure in this history' }
  if (current.heaviestLoad > prior.heaviestLoad) return { changeKind: 'load' as const, changeLabel: `+${current.heaviestLoad - prior.heaviestLoad} heaviest load` }
  if (current.heaviestLoad === prior.heaviestLoad && current.maxRepsAtHeaviestLoad > prior.maxRepsAtHeaviestLoad) return { changeKind: 'repetitions' as const, changeLabel: `+${current.maxRepsAtHeaviestLoad - prior.maxRepsAtHeaviestLoad} reps at top load` }
  if (current.completedSets > prior.completedSets) return { changeKind: 'sets' as const, changeLabel: `+${current.completedSets - prior.completedSets} completed set${current.completedSets - prior.completedSets === 1 ? '' : 's'}` }
  if (current.volumeLoad > prior.volumeLoad) return { changeKind: 'volume' as const, changeLabel: `+${Math.round(current.volumeLoad - prior.volumeLoad).toLocaleString()} volume load` }
  return { changeKind: 'hold-or-mixed' as const, changeLabel: 'Held or changed the exact exposure without a larger load, rep, set, or volume result' }
}

export function buildExerciseExposureSequence(history: CompletedSetRecord[], exerciseId: string): ExerciseExposurePoint[] {
  const grouped = new Map<string, CompletedSetRecord[]>()
  history.filter((workSet) => workSet.exerciseId === exerciseId).forEach((workSet) => {
    grouped.set(workSet.sessionId, [...(grouped.get(workSet.sessionId) ?? []), workSet])
  })
  const raw = [...grouped.entries()].map(([sessionId, sets]) => {
    const ordered = [...sets].sort((a, b) => a.setIndex - b.setIndex || a.id.localeCompare(b.id))
    const heaviestLoad = Math.max(...ordered.map((workSet) => workSet.load))
    const completedAt = ordered.map((workSet) => workSet.completedAt).sort().at(-1)!
    return {
      sessionId,
      completedAt,
      exerciseId,
      exerciseName: ordered.at(-1)!.exerciseName,
      sourceSetIds: ordered.map((workSet) => workSet.id),
      completedSets: ordered.length,
      repetitions: ordered.reduce((sum, workSet) => sum + workSet.reps, 0),
      volumeLoad: ordered.reduce((sum, workSet) => sum + workSet.load * workSet.reps, 0),
      heaviestLoad,
      maxRepsAtHeaviestLoad: Math.max(...ordered.filter((workSet) => workSet.load === heaviestLoad).map((workSet) => workSet.reps)),
      bestEstimatedStrength: Math.max(...ordered.map((workSet) => workSet.load * (1 + workSet.reps / 30))),
      averageRir: ordered.reduce((sum, workSet) => sum + workSet.rir, 0) / ordered.length,
      qualityConfirmedSets: ordered.filter((workSet) => workSet.qualityConfirmed).length,
      imported: ordered.some((workSet) => Boolean(workSet.importBatchId))
    }
  }).sort((a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime() || a.sessionId.localeCompare(b.sessionId))

  const result: ExerciseExposurePoint[] = []
  raw.forEach((current, index) => {
    const prior = result.at(-1) ?? null
    const change = exposureChange(current, prior)
    result.push({
      ...current,
      sequence: index + 1,
      daysSincePrior: prior ? calendarDistance(prior.completedAt, current.completedAt) : null,
      ...change
    })
  })
  return result
}

export interface FixedEventCountdown {
  state: 'none' | 'unparsed' | 'upcoming' | 'today' | 'past'
  label: string | null
  date: string | null
  daysRemaining: number | null
}

export function buildFixedEventCountdown(fixedEvent: string | null, now = new Date()): FixedEventCountdown {
  if (!fixedEvent?.trim()) return { state: 'none', label: null, date: null, daysRemaining: null }
  const match = fixedEvent.match(/\b(\d{4})-(\d{2})-(\d{2})\b/)
  if (!match) return { state: 'unparsed', label: fixedEvent.trim(), date: null, daysRemaining: null }
  const eventDate = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
  if (eventDate.getFullYear() !== Number(match[1]) || eventDate.getMonth() !== Number(match[2]) - 1 || eventDate.getDate() !== Number(match[3])) {
    return { state: 'unparsed', label: fixedEvent.trim(), date: null, daysRemaining: null }
  }
  const daysRemaining = calendarDistance(now, eventDate)!
  return {
    state: daysRemaining > 0 ? 'upcoming' : daysRemaining === 0 ? 'today' : 'past',
    label: fixedEvent.trim(),
    date: calendarDayKey(eventDate),
    daysRemaining
  }
}
