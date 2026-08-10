import type { BodyRegion, CompletedSetRecord, Exercise, TrainingSession } from './types'

export type ProgressRange = 'today' | '7d' | '28d' | 'month' | 'quarter' | 'year' | 'all'
export type BodyLens = 'region' | 'area'

export const progressRanges: { id: ProgressRange; label: string; shortLabel: string }[] = [
  { id: 'today', label: 'Today', shortLabel: 'Day' },
  { id: '7d', label: 'Last 7 days', shortLabel: 'Week' },
  { id: '28d', label: 'Rolling 28 days', shortLabel: '28 days' },
  { id: 'month', label: 'Calendar month', shortLabel: 'Month' },
  { id: 'quarter', label: 'Calendar quarter', shortLabel: 'Qtr' },
  { id: 'year', label: 'Calendar year', shortLabel: 'Year' },
  { id: 'all', label: 'All time', shortLabel: 'All time' }
]

export interface VolumeSeriesPoint {
  key: string
  label: string
  volume: number
  sets: number
}

export interface AnalyticsSummary {
  range: ProgressRange
  label: string
  start: Date | null
  end: Date
  history: CompletedSetRecord[]
  points: VolumeSeriesPoint[]
  totalVolume: number
  totalReps: number
  setCount: number
  sessionCount: number
  activeDays: number
  averageLoad: number
  comparisonPercent: number | null
}

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate())
const endOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999)
const addDays = (date: Date, amount: number) => {
  const next = new Date(date)
  next.setDate(next.getDate() + amount)
  return next
}

export function rangeWindow(range: ProgressRange, now = new Date()) {
  const end = endOfDay(now)
  if (range === 'all') return { start: null, end }
  if (range === 'today') return { start: startOfDay(now), end }
  if (range === '7d') return { start: addDays(startOfDay(now), -6), end }
  if (range === '28d') return { start: addDays(startOfDay(now), -27), end }
  if (range === 'month') return { start: new Date(now.getFullYear(), now.getMonth(), 1), end }
  if (range === 'quarter') return { start: new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1), end }
  return { start: new Date(now.getFullYear(), 0, 1), end }
}

export function historyInRange(history: CompletedSetRecord[], range: ProgressRange, now = new Date()) {
  const { start, end } = rangeWindow(range, now)
  return history.filter((workSet) => {
    const timestamp = new Date(workSet.completedAt).getTime()
    return !Number.isNaN(timestamp) && timestamp <= end.getTime() && (start === null || timestamp >= start.getTime())
  })
}

const dayKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
const monthKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

function emptySeries(range: ProgressRange, start: Date | null, end: Date, history: CompletedSetRecord[]) {
  const result: VolumeSeriesPoint[] = []
  if (range === 'all') {
    const years = history.length ? history.map((workSet) => new Date(workSet.completedAt).getFullYear()) : [end.getFullYear()]
    const first = Math.min(...years)
    for (let year = first; year <= end.getFullYear(); year += 1) result.push({ key: String(year), label: String(year), volume: 0, sets: 0 })
    return result
  }
  if (range === 'year' || range === 'quarter') {
    const firstMonth = range === 'quarter' ? Math.floor(end.getMonth() / 3) * 3 : 0
    for (let month = firstMonth; month <= end.getMonth(); month += 1) {
      const date = new Date(end.getFullYear(), month, 1)
      result.push({ key: monthKey(date), label: date.toLocaleDateString('en-US', { month: 'short' }), volume: 0, sets: 0 })
    }
    return result
  }
  let cursor = start ?? startOfDay(end)
  while (cursor.getTime() <= end.getTime()) {
    result.push({
      key: dayKey(cursor),
      label: range === 'today' ? 'Today' : cursor.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      volume: 0,
      sets: 0
    })
    cursor = addDays(cursor, 1)
  }
  return result
}

function totalVolume(history: CompletedSetRecord[]) {
  return history.reduce((sum, workSet) => sum + workSet.reps * workSet.load, 0)
}

function previousWindowTotal(history: CompletedSetRecord[], start: Date | null, end: Date) {
  if (!start) return null
  const duration = end.getTime() - start.getTime() + 1
  const previousEnd = new Date(start.getTime() - 1)
  const previousStart = new Date(previousEnd.getTime() - duration + 1)
  const previous = history.filter((workSet) => {
    const timestamp = new Date(workSet.completedAt).getTime()
    return timestamp >= previousStart.getTime() && timestamp <= previousEnd.getTime()
  })
  return totalVolume(previous)
}

export function buildAnalytics(history: CompletedSetRecord[], range: ProgressRange, now = new Date()): AnalyticsSummary {
  const window = rangeWindow(range, now)
  const filtered = historyInRange(history, range, now)
  const points = emptySeries(range, window.start, window.end, filtered)
  const pointMap = new Map(points.map((point) => [point.key, point]))
  filtered.forEach((workSet) => {
    const date = new Date(workSet.completedAt)
    const key = range === 'all' ? String(date.getFullYear()) : ['year', 'quarter'].includes(range) ? monthKey(date) : dayKey(date)
    const point = pointMap.get(key)
    if (!point) return
    point.volume += workSet.reps * workSet.load
    point.sets += 1
  })
  const volume = totalVolume(filtered)
  const previous = previousWindowTotal(history, window.start, window.end)
  const comparisonPercent = previous === null || previous === 0 ? null : ((volume - previous) / previous) * 100
  const label = progressRanges.find((item) => item.id === range)?.label ?? range
  return {
    range,
    label,
    start: window.start,
    end: window.end,
    history: filtered,
    points,
    totalVolume: volume,
    totalReps: filtered.reduce((sum, workSet) => sum + workSet.reps, 0),
    setCount: filtered.length,
    sessionCount: new Set(filtered.map((workSet) => workSet.sessionId)).size,
    activeDays: new Set(filtered.map((workSet) => dayKey(new Date(workSet.completedAt)))).size,
    averageLoad: filtered.length ? filtered.reduce((sum, workSet) => sum + workSet.load, 0) / filtered.length : 0,
    comparisonPercent
  }
}

export function regionVolumeFor(history: CompletedSetRecord[]) {
  const buckets = new Map<BodyRegion, { label: string; volume: number; sets: number }>()
  history.forEach((workSet) => {
    const current = buckets.get(workSet.primaryRegion) ?? { label: workSet.primaryRegion, volume: 0, sets: 0 }
    current.volume += workSet.reps * workSet.load
    current.sets += 1
    buckets.set(workSet.primaryRegion, current)
  })
  return [...buckets.values()].sort((a, b) => b.volume - a.volume)
}

const areaFor = (region: BodyRegion) => {
  if (['chest', 'back', 'shoulders'].includes(region)) return 'Upper body'
  if (['quadriceps', 'hamstrings', 'glutes', 'calves'].includes(region)) return 'Lower body'
  if (['biceps', 'triceps', 'forearms'].includes(region)) return 'Arms'
  return 'Trunk'
}

export function areaVolumeFor(history: CompletedSetRecord[]) {
  const buckets = new Map<string, { label: string; volume: number; sets: number }>()
  history.forEach((workSet) => {
    const label = areaFor(workSet.primaryRegion)
    const current = buckets.get(label) ?? { label, volume: 0, sets: 0 }
    current.volume += workSet.reps * workSet.load
    current.sets += 1
    buckets.set(label, current)
  })
  return [...buckets.values()].sort((a, b) => b.volume - a.volume)
}

export function exerciseVolumeFor(history: CompletedSetRecord[]) {
  const buckets = new Map<string, { exerciseId: string; name: string; volume: number; sets: number }>()
  history.forEach((workSet) => {
    const current = buckets.get(workSet.exerciseId) ?? { exerciseId: workSet.exerciseId, name: workSet.exerciseName, volume: 0, sets: 0 }
    current.volume += workSet.reps * workSet.load
    current.sets += 1
    buckets.set(workSet.exerciseId, current)
  })
  return [...buckets.values()].sort((a, b) => b.volume - a.volume)
}

export interface ExerciseMixPoint {
  exerciseId: string
  name: string
  volume: number
  sets: number
  repetitions: number
  sessions: number
  lastCompletedAt: string
  volumeShare: number
  setShare: number
}

export function exerciseMixFor(history: CompletedSetRecord[]): ExerciseMixPoint[] {
  const total = totalVolume(history)
  const buckets = new Map<string, Omit<ExerciseMixPoint, 'volumeShare' | 'setShare'> & { sessionIds: Set<string> }>()
  history.forEach((workSet) => {
    const current = buckets.get(workSet.exerciseId) ?? {
      exerciseId: workSet.exerciseId,
      name: workSet.exerciseName,
      volume: 0,
      sets: 0,
      repetitions: 0,
      sessions: 0,
      lastCompletedAt: workSet.completedAt,
      sessionIds: new Set<string>()
    }
    current.volume += workSet.reps * workSet.load
    current.sets += 1
    current.repetitions += workSet.reps
    current.sessionIds.add(workSet.sessionId)
    current.sessions = current.sessionIds.size
    if (new Date(workSet.completedAt).getTime() > new Date(current.lastCompletedAt).getTime()) current.lastCompletedAt = workSet.completedAt
    buckets.set(workSet.exerciseId, current)
  })
  return [...buckets.values()].map((point) => ({
    exerciseId: point.exerciseId,
    name: point.name,
    volume: point.volume,
    sets: point.sets,
    repetitions: point.repetitions,
    sessions: point.sessions,
    lastCompletedAt: point.lastCompletedAt,
    volumeShare: total ? point.volume / total : 0,
    setShare: history.length ? point.sets / history.length : 0
  })).sort((a, b) => b.volume - a.volume || b.sets - a.sets || a.name.localeCompare(b.name))
}

export interface PriorityAttentionPoint {
  region: BodyRegion
  selectedSets: number
  selectedVolume: number
  contributingExercises: string[]
  lastCompletedAt: string | null
  daysSinceLastExposure: number | null
  status: 'represented' | 'outside-window' | 'no-history'
}

export function priorityAttentionFor(input: {
  selectedHistory: CompletedSetRecord[]
  allHistory: CompletedSetRecord[]
  priorityRegions: BodyRegion[]
  now?: Date
}): PriorityAttentionPoint[] {
  const now = input.now ?? new Date()
  return input.priorityRegions.map((region) => {
    const selected = input.selectedHistory.filter((workSet) => workSet.primaryRegion === region)
    const all = input.allHistory.filter((workSet) => workSet.primaryRegion === region)
    const latest = all.reduce<CompletedSetRecord | null>((current, workSet) => !current || new Date(workSet.completedAt).getTime() > new Date(current.completedAt).getTime() ? workSet : current, null)
    const selectedVolume = totalVolume(selected)
    const lastCompletedAt = latest?.completedAt ?? null
    const daysSinceLastExposure = lastCompletedAt === null ? null : Math.max(0, Math.floor((endOfDay(now).getTime() - new Date(lastCompletedAt).getTime()) / 86_400_000))
    return {
      region,
      selectedSets: selected.length,
      selectedVolume,
      contributingExercises: [...new Set(selected.map((workSet) => workSet.exerciseName))],
      lastCompletedAt,
      daysSinceLastExposure,
      status: selected.length ? 'represented' as const : latest ? 'outside-window' as const : 'no-history' as const
    }
  })
}

export type DoseStatus = 'below-plan' | 'within-plan' | 'above-plan' | 'unplanned-completed' | 'no-dose'

export interface PlannedDoseRegionPoint {
  region: BodyRegion
  plannedSets: number
  plannedVolumeKnown: number
  unknownLoadSets: number
  completedSets: number
  completedVolume: number
  completionRate: number | null
  status: DoseStatus
}

export interface PlannedDoseSummary {
  ruleVersion: 'dose-v1'
  plannedSessionIds: string[]
  plannedSets: number
  plannedVolumeKnown: number
  unknownLoadSets: number
  linkedCompletedSets: number
  linkedCompletedVolume: number
  unlinkedCompletedSets: number
  unlinkedCompletedVolume: number
  regions: PlannedDoseRegionPoint[]
}

const doseStatusFor = (plannedSets: number, completedSets: number): DoseStatus => {
  if (plannedSets === 0) return completedSets > 0 ? 'unplanned-completed' : 'no-dose'
  const rate = completedSets / plannedSets
  if (rate < 0.85) return 'below-plan'
  if (rate > 1.15) return 'above-plan'
  return 'within-plan'
}

export function plannedVsCompletedDoseFor(input: {
  sessions: TrainingSession[]
  history: CompletedSetRecord[]
  exercises: Exercise[]
  range: ProgressRange
  now?: Date
  focusRegions?: BodyRegion[]
}): PlannedDoseSummary {
  const now = input.now ?? new Date()
  const window = rangeWindow(input.range, now)
  const plannedSessions = input.sessions.filter((session) => {
    const timestamp = new Date(session.plannedDate).getTime()
    return !Number.isNaN(timestamp) && timestamp <= window.end.getTime() && (window.start === null || timestamp >= window.start.getTime())
  })
  const plannedSessionIds = new Set(plannedSessions.map((session) => session.id))
  const selectedHistory = historyInRange(input.history, input.range, now)
  const linkedHistory = selectedHistory.filter((workSet) => plannedSessionIds.has(workSet.sessionId))
  const unlinkedHistory = selectedHistory.filter((workSet) => !plannedSessionIds.has(workSet.sessionId))
  const exerciseById = new Map(input.exercises.map((exercise) => [exercise.id, exercise]))
  const regions = new Map<BodyRegion, Omit<PlannedDoseRegionPoint, 'completionRate' | 'status'>>()
  const ensureRegion = (region: BodyRegion) => {
    const current = regions.get(region) ?? { region, plannedSets: 0, plannedVolumeKnown: 0, unknownLoadSets: 0, completedSets: 0, completedVolume: 0 }
    regions.set(region, current)
    return current
  }

  plannedSessions.forEach((session) => session.exercises.forEach((planned) => {
    const region = exerciseById.get(planned.exerciseId)?.primaryRegion
    if (!region) return
    const point = ensureRegion(region)
    planned.sets.forEach((workSet) => {
      point.plannedSets += 1
      if (workSet.targetLoad > 0) point.plannedVolumeKnown += workSet.targetLoad * workSet.targetReps
      else point.unknownLoadSets += 1
    })
  }))
  linkedHistory.forEach((workSet) => {
    const point = ensureRegion(workSet.primaryRegion)
    point.completedSets += 1
    point.completedVolume += workSet.load * workSet.reps
  })
  ;(input.focusRegions ?? []).forEach(ensureRegion)

  const regionPoints = [...regions.values()].map((point) => ({
    ...point,
    completionRate: point.plannedSets ? point.completedSets / point.plannedSets : null,
    status: doseStatusFor(point.plannedSets, point.completedSets)
  })).sort((a, b) => b.plannedSets - a.plannedSets || b.completedSets - a.completedSets || a.region.localeCompare(b.region))

  return {
    ruleVersion: 'dose-v1',
    plannedSessionIds: [...plannedSessionIds],
    plannedSets: regionPoints.reduce((sum, point) => sum + point.plannedSets, 0),
    plannedVolumeKnown: regionPoints.reduce((sum, point) => sum + point.plannedVolumeKnown, 0),
    unknownLoadSets: regionPoints.reduce((sum, point) => sum + point.unknownLoadSets, 0),
    linkedCompletedSets: linkedHistory.length,
    linkedCompletedVolume: totalVolume(linkedHistory),
    unlinkedCompletedSets: unlinkedHistory.length,
    unlinkedCompletedVolume: totalVolume(unlinkedHistory),
    regions: regionPoints
  }
}

export function analyticsReconciliation(summary: AnalyticsSummary) {
  const seriesVolume = summary.points.reduce((sum, point) => sum + point.volume, 0)
  const regionVolume = regionVolumeFor(summary.history).reduce((sum, point) => sum + point.volume, 0)
  return {
    sourceVolume: summary.totalVolume,
    seriesVolume,
    regionVolume,
    exact: summary.totalVolume === seriesVolume && summary.totalVolume === regionVolume
  }
}
