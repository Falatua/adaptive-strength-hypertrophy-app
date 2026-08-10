import type { BodyRegion, CompletedSetRecord } from './types'

export type ProgressRange = 'today' | '7d' | '28d' | 'month' | 'year' | 'all'
export type BodyLens = 'region' | 'area'

export const progressRanges: { id: ProgressRange; label: string; shortLabel: string }[] = [
  { id: 'today', label: 'Today', shortLabel: 'Day' },
  { id: '7d', label: 'Last 7 days', shortLabel: 'Week' },
  { id: '28d', label: 'Rolling 28 days', shortLabel: '28 days' },
  { id: 'month', label: 'Calendar month', shortLabel: 'Month' },
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
  if (range === 'year') {
    for (let month = 0; month <= end.getMonth(); month += 1) {
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
    const key = range === 'all' ? String(date.getFullYear()) : range === 'year' ? monthKey(date) : dayKey(date)
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
