import { useMemo, useState } from 'react'
import { Activity, ArrowDownRight, ArrowUpRight, BarChart3, BrainCircuit, CalendarDays, CheckCircle2, Dumbbell, HeartPulse, Layers3, Sparkles, Target, Trophy } from 'lucide-react'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import {
  analyticsReconciliation,
  areaVolumeFor,
  buildAnalytics,
  exerciseVolumeFor,
  progressRanges,
  rangeWindow,
  regionVolumeFor,
  type BodyLens,
  type ProgressRange
} from '../domain/analytics'
import { useAppStore } from '../store/useAppStore'
import { PixelAvatar } from '../components/PixelAvatar'
import { StatCard } from '../components/StatCard'

export function ProgressScreen() {
  const { history, records, athlete, settings } = useAppStore()
  const [range, setRange] = useState<ProgressRange>('28d')
  const [bodyLens, setBodyLens] = useState<BodyLens>('region')
  const summary = useMemo(() => buildAnalytics(history, range), [history, range])
  const bodyData = useMemo(() => bodyLens === 'region' ? regionVolumeFor(summary.history) : areaVolumeFor(summary.history), [bodyLens, summary.history])
  const exercises = useMemo(() => exerciseVolumeFor(summary.history), [summary.history])
  const reconciliation = useMemo(() => analyticsReconciliation(summary), [summary])
  const topExercise = exercises[0]
  const latestTimestamp = summary.history.reduce((latest, workSet) => Math.max(latest, new Date(workSet.completedAt).getTime()), 0)
  const latestDate = latestTimestamp ? new Date(latestTimestamp) : null
  const currentWindow = rangeWindow(range)
  const visibleRecords = records.filter((record) => {
    const timestamp = new Date(record.achievedAt).getTime()
    return timestamp <= currentWindow.end.getTime() && (currentWindow.start === null || timestamp >= currentWindow.start.getTime())
  })
  const priorityCoverage = athlete.priorityRegions.map((region) => {
    const point = regionVolumeFor(summary.history).find((item) => item.label === region)
    return { region, sets: point?.sets ?? 0, volume: point?.volume ?? 0 }
  })
  const trend = summary.comparisonPercent
  const trendLabel = trend === null ? 'No matched prior window' : `${trend >= 0 ? '+' : ''}${trend.toFixed(1)}% vs prior matched window`
  const rangeDates = summary.start
    ? `${summary.start.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: summary.start.getFullYear() !== summary.end.getFullYear() ? 'numeric' : undefined })} to ${summary.end.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`
    : `Through ${summary.end.toLocaleDateString()}`
  const bannerTitle = summary.setCount === 0
    ? 'No completed work in this window.'
    : trend !== null && trend > 0
      ? 'Your completed workload moved forward.'
      : 'Every useful exposure remains visible.'

  return (
    <div className="screen">
      <header className="screen-header">
        <div><p className="eyebrow">Completed work only</p><h1>Your training, made legible.</h1><p>Daily, weekly, rolling, monthly, yearly, and all-time views reconcile to the exact completed source sets beneath them.</p></div>
        <div className="segmented-control progress-range" aria-label="Progress range">{progressRanges.map((item) => <button key={item.id} title={item.label} aria-pressed={range === item.id} className={range === item.id ? 'selected' : ''} onClick={() => setRange(item.id)}>{item.shortLabel}</button>)}</div>
      </header>

      <section className="progress-banner">
        <div className="progress-banner__avatar"><PixelAvatar mood={summary.setCount ? 'celebrate' : 'ready'} size="medium" /></div>
        <div className="progress-banner__copy"><p className="eyebrow">Micro-win ledger · {summary.label}</p><h2>{bannerTitle}</h2><p>{summary.setCount ? `${summary.setCount} completed source sets across ${summary.activeDays} active ${summary.activeDays === 1 ? 'day' : 'days'}. The app does not count planned or missed work.` : 'Choose another period or complete a workout. Zero is shown honestly rather than replaced by all-time history.'}</p></div>
        <div className="progress-banner__badge"><Sparkles size={18} /><strong>{summary.sessionCount} useful {summary.sessionCount === 1 ? 'session' : 'sessions'}</strong><span>{rangeDates}</span></div>
      </section>

      <section className="stats-grid">
        <StatCard label="Volume load" value={summary.totalVolume.toLocaleString()} detail={`${settings.units} · actual reps × actual load`} icon={<BarChart3 size={18} />} />
        <StatCard label="Completed sets" value={summary.setCount.toString()} detail={`Latest ${latestDate?.toLocaleDateString() ?? 'none in this period'}`} icon={<Dumbbell size={18} />} tone="orange" />
        <StatCard label="Most trained" value={topExercise?.name ?? 'No movement'} detail={topExercise ? `${topExercise.volume.toLocaleString()} exact volume load` : 'No completed source sets'} icon={<Target size={18} />} tone="blue" />
        <StatCard label="Validated records" value={visibleRecords.length.toString()} detail={`Records achieved inside ${summary.label.toLowerCase()}`} icon={<Trophy size={18} />} tone="purple" />
      </section>

      <section className="period-facts" aria-label={`${summary.label} training summary`}>
        <div><CalendarDays size={17} /><span><small>Active days</small><strong>{summary.activeDays}</strong></span></div>
        <div><Layers3 size={17} /><span><small>Sessions</small><strong>{summary.sessionCount}</strong></span></div>
        <div><Activity size={17} /><span><small>Total reps</small><strong>{summary.totalReps.toLocaleString()}</strong></span></div>
        <div><Dumbbell size={17} /><span><small>Average set load</small><strong>{Math.round(summary.averageLoad).toLocaleString()} {settings.units}</strong></span></div>
      </section>

      <div className="charts-grid">
        <section className="panel chart-panel chart-panel--wide">
          <div className="panel__header"><div><p className="eyebrow">Volume explorer · {summary.label}</p><h3>{range === 'today' ? 'Daily' : range === 'year' ? 'Monthly' : range === 'all' ? 'Yearly' : 'Daily'} volume load</h3></div><span className={trend !== null && trend < 0 ? 'trend-down' : 'trend-up'}>{trend !== null && trend < 0 ? <ArrowDownRight size={15} /> : <ArrowUpRight size={15} />}{trendLabel}</span></div>
          <div className="chart-wrap" aria-label={`${summary.label} volume load chart`}>
            <ResponsiveContainer width="100%" height="100%"><AreaChart data={summary.points} margin={{ top: 10, right: 8, left: -18, bottom: 0 }}><defs><linearGradient id="volumeFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#e7ff58" stopOpacity={0.42} /><stop offset="100%" stopColor="#e7ff58" stopOpacity={0} /></linearGradient></defs><CartesianGrid stroke="#2c3129" vertical={false} /><XAxis dataKey="label" stroke="#788171" tickLine={false} axisLine={false} fontSize={11} minTickGap={24} /><YAxis stroke="#788171" tickLine={false} axisLine={false} fontSize={11} tickFormatter={(value) => Number(value) >= 1000 ? `${Math.round(Number(value) / 1000)}k` : String(value)} /><Tooltip contentStyle={{ background: '#191d17', border: '1px solid #353b31', borderRadius: 10 }} formatter={(value) => [`${Number(value).toLocaleString()} ${settings.units}`, 'Volume load']} /><Area isAnimationActive={false} type="monotone" dataKey="volume" stroke="#e7ff58" strokeWidth={3} fill="url(#volumeFill)" /></AreaChart></ResponsiveContainer>
          </div>
          <p className="chart-note">Exercise-specific volume load is best for like-for-like trends. It is not a universal stimulus score across different movements.</p>
        </section>
        <section className="panel chart-panel">
          <div className="panel__header body-lens-header"><div><p className="eyebrow">Body-volume lens</p><h3>{bodyLens === 'region' ? 'Primary-region volume' : 'Upper, lower, arms, and trunk'}</h3></div><div className="mini-toggle" aria-label="Body volume grouping"><button aria-pressed={bodyLens === 'region'} className={bodyLens === 'region' ? 'selected' : ''} onClick={() => setBodyLens('region')}>Regions</button><button aria-pressed={bodyLens === 'area'} className={bodyLens === 'area' ? 'selected' : ''} onClick={() => setBodyLens('area')}>Areas</button></div></div>
          <div className="chart-wrap chart-wrap--small" aria-label={`Volume by ${bodyLens}`}>
            <ResponsiveContainer width="100%" height="100%"><BarChart data={bodyData.slice(0, 8)} layout="vertical" margin={{ top: 0, right: 8, left: 8, bottom: 0 }}><XAxis type="number" hide /><YAxis dataKey="label" type="category" stroke="#aeb6a7" tickLine={false} axisLine={false} width={78} fontSize={11} /><Tooltip contentStyle={{ background: '#191d17', border: '1px solid #353b31', borderRadius: 10 }} formatter={(value) => [`${Number(value).toLocaleString()} ${settings.units}`, 'Volume load']} /><Bar isAnimationActive={false} dataKey="volume" fill="#ff7a45" radius={[0, 4, 4, 0]} /></BarChart></ResponsiveContainer>
          </div>
          <p className="chart-note">Exclusive primary-region assignment keeps totals conserved. Fractional muscle-credit views remain a later, separately labeled calculation.</p>
        </section>
      </div>

      <div className="insight-grid">
        <section className="panel">
          <div className="panel__header"><div><p className="eyebrow">Priority coverage</p><h3>Goal-relative attention</h3></div><BrainCircuit size={19} /></div>
          <div className="priority-coverage">{priorityCoverage.map((item) => <div key={item.region}><span><strong>{item.region}</strong><small>Current priority</small></span><span><b>{item.sets} sets</b><small>{item.volume.toLocaleString()} volume load</small></span></div>)}</div>
          <p className="chart-note">A zero inside the selected period is a review signal, not a shame label. Programming still considers phase, recovery, and intended dose.</p>
        </section>
        <section className="panel">
          <div className="panel__header"><div><p className="eyebrow">Records and milestones</p><h3>Bests inside this window</h3></div><Trophy size={19} /></div>
          {visibleRecords.length ? <div className="record-list">{visibleRecords.map((record) => <div key={record.id}><span className="record-medal">◆</span><div><strong>{record.label}</strong><small>{record.exerciseName} · {new Date(record.achievedAt).toLocaleDateString()}</small></div><span>{record.type}</span></div>)}</div> : <div className="compact-empty"><Trophy size={24} /><strong>No validated record in this window</strong><p>Records outside the selected dates remain available in All time.</p></div>}
        </section>
      </div>

      <section className="panel reconciliation-panel">
        <div className="panel__header"><div><p className="eyebrow">Calculation audit</p><h3>Every view reconciles to source sets</h3></div>{reconciliation.exact ? <CheckCircle2 size={20} /> : <HeartPulse size={20} />}</div>
        <div className="reconciliation-grid">
          <div><small>Completed source sets</small><strong>{summary.setCount}</strong><span>{reconciliation.sourceVolume.toLocaleString()} {settings.units}</span></div>
          <div><small>Time-series total</small><strong>{reconciliation.seriesVolume.toLocaleString()}</strong><span>Derived from the visible chart</span></div>
          <div><small>Body-lens total</small><strong>{reconciliation.regionVolume.toLocaleString()}</strong><span>Each set counted exactly once</span></div>
          <div className={reconciliation.exact ? 'reconciliation-pass' : 'reconciliation-fail'}><small>Integrity result</small><strong>{reconciliation.exact ? 'Exact match' : 'Review required'}</strong><span>No hidden planned volume</span></div>
        </div>
      </section>

      <section className="panel long-horizon">
        <div><p className="eyebrow">Current direction</p><h3>{athlete.goal}</h3><p>Strength anchors remain independently tracked while flexible accessory dose follows current muscle priorities and completed evidence.</p></div>
        <div className="horizon-track"><span className="done">Baseline</span><i /><span className="active">Build</span><i /><span>Strength</span><i /><span>Review</span></div>
      </section>
    </div>
  )
}
