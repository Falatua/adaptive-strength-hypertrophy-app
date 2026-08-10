import { useMemo, useState } from 'react'
import { Activity, ArrowUpRight, BarChart3, BrainCircuit, Clock3, Dumbbell, HeartPulse, Sparkles, Target, Trophy } from 'lucide-react'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { regionVolume, volumeLoad, weeklyVolume } from '../domain/training-engine'
import { useAppStore } from '../store/useAppStore'
import { PixelAvatar } from '../components/PixelAvatar'
import { StatCard } from '../components/StatCard'

const ranges = ['7 days', '28 days', '3 months', 'Year', 'All time']

export function ProgressScreen() {
  const { history, records, exercises, athlete } = useAppStore()
  const [range, setRange] = useState('28 days')
  const weekly = useMemo(() => weeklyVolume(history), [history])
  const regions = useMemo(() => regionVolume(history).slice(0, 7), [history])
  const totalVolume = volumeLoad(history)
  const latestDate = history.length ? new Date(history[history.length - 1].completedAt) : null
  const topExercise = useMemo(() => {
    const totals = new Map<string, number>()
    history.forEach((set) => totals.set(set.exerciseId, (totals.get(set.exerciseId) ?? 0) + set.reps * set.load))
    const top = [...totals].sort((a, b) => b[1] - a[1])[0]
    return { name: exercises.find((exercise) => exercise.id === top?.[0])?.name ?? 'No movement', volume: top?.[1] ?? 0 }
  }, [exercises, history])

  return (
    <div className="screen">
      <header className="screen-header">
        <div><p className="eyebrow">Completed work only</p><h1>Your training, made legible.</h1><p>Volume, strength, consistency, joint response, and small wins stay connected to their source sets.</p></div>
        <div className="segmented-control" aria-label="Progress range">{ranges.map((item) => <button key={item} className={range === item ? 'selected' : ''} onClick={() => setRange(item)}>{item}</button>)}</div>
      </header>

      <section className="progress-banner">
        <div className="progress-banner__avatar"><PixelAvatar mood="celebrate" size="medium" /></div>
        <div><p className="eyebrow">Micro-win ledger · {range}</p><h2>Rhythm is returning.</h2><p>You have preserved your three strength anchors while rebuilding consistency. That is productive progress, even before an all-time PR.</p></div>
        <div className="progress-banner__badge"><Sparkles size={18} /><strong>Return streak</strong><span>3 useful exposures</span></div>
      </section>

      <section className="stats-grid">
        <StatCard label="Volume load" value={`${Math.round(totalVolume / 1000).toLocaleString()}k`} detail="Exact exercise tonnage · all seeded history" icon={<BarChart3 size={18} />} />
        <StatCard label="Completed sets" value={history.length.toString()} detail={`Latest ${latestDate?.toLocaleDateString() ?? 'none'}`} icon={<Dumbbell size={18} />} tone="orange" />
        <StatCard label="Most trained" value={topExercise.name} detail={`${topExercise.volume.toLocaleString()} exact volume load`} icon={<Target size={18} />} tone="blue" />
        <StatCard label="Validated records" value={records.length.toString()} detail="Load, volume, and set-scheme records" icon={<Trophy size={18} />} tone="purple" />
      </section>

      <div className="charts-grid">
        <section className="panel chart-panel chart-panel--wide">
          <div className="panel__header"><div><p className="eyebrow">Volume explorer · Exclusive whole-body load</p><h3>Weekly volume load</h3></div><span className="trend-up"><ArrowUpRight size={15} /> +4.8%</span></div>
          <div className="chart-wrap" aria-label="Weekly volume load chart">
            <ResponsiveContainer width="100%" height="100%"><AreaChart data={weekly} margin={{ top: 10, right: 8, left: -18, bottom: 0 }}><defs><linearGradient id="volumeFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#e7ff58" stopOpacity={0.42} /><stop offset="100%" stopColor="#e7ff58" stopOpacity={0} /></linearGradient></defs><CartesianGrid stroke="#2c3129" vertical={false} /><XAxis dataKey="label" stroke="#788171" tickLine={false} axisLine={false} fontSize={11} /><YAxis stroke="#788171" tickLine={false} axisLine={false} fontSize={11} tickFormatter={(value) => `${Math.round(Number(value) / 1000)}k`} /><Tooltip contentStyle={{ background: '#191d17', border: '1px solid #353b31', borderRadius: 10 }} formatter={(value) => [`${Number(value).toLocaleString()} lb`, 'Volume']} /><Area type="monotone" dataKey="volume" stroke="#e7ff58" strokeWidth={3} fill="url(#volumeFill)" /></AreaChart></ResponsiveContainer>
          </div>
          <p className="chart-note">Exercise-specific volume load is best for like-for-like trends. It is not a universal stimulus score across different movements.</p>
        </section>
        <section className="panel chart-panel">
          <div className="panel__header"><div><p className="eyebrow">Body-area lens</p><h3>Primary-region volume</h3></div><Activity size={19} /></div>
          <div className="chart-wrap chart-wrap--small" aria-label="Volume by body region chart">
            <ResponsiveContainer width="100%" height="100%"><BarChart data={regions} layout="vertical" margin={{ top: 0, right: 8, left: 8, bottom: 0 }}><XAxis type="number" hide /><YAxis dataKey="region" type="category" stroke="#aeb6a7" tickLine={false} axisLine={false} width={72} fontSize={11} /><Tooltip contentStyle={{ background: '#191d17', border: '1px solid #353b31', borderRadius: 10 }} /><Bar dataKey="volume" fill="#ff7a45" radius={[0, 4, 4, 0]} /></BarChart></ResponsiveContainer>
          </div>
          <p className="chart-note">Exclusive assignment means each set is counted once. Muscle-dose and involvement lenses arrive in the next data phase.</p>
        </section>
      </div>

      <div className="insight-grid">
        <section className="panel">
          <div className="panel__header"><div><p className="eyebrow">What ForgePath has learned</p><h3>Current athlete model</h3></div><BrainCircuit size={19} /></div>
          <div className="insight-list">
            <div><span className="insight-icon insight-icon--lime"><Clock3 size={17} /></span><p><strong>45 minutes is your reliable fallback.</strong>Short sessions preserve anchors better than waiting for a perfect hour.<small>Medium confidence · schedule pattern</small></p></div>
            <div><span className="insight-icon insight-icon--orange"><HeartPulse size={17} /></span><p><strong>Chest-supported rows carry low joint cost.</strong>They remain a strong back-volume option after heavy hinges.<small>Medium confidence · movement response</small></p></div>
            <div><span className="insight-icon insight-icon--blue"><Target size={17} /></span><p><strong>Your experience remains advanced.</strong>Recent continuity is the limited quality, so the app protects skill while rebuilding tolerance.<small>High confidence · placement profile</small></p></div>
          </div>
          <button className="text-link">Correct what the app believes</button>
        </section>
        <section className="panel">
          <div className="panel__header"><div><p className="eyebrow">Records and milestones</p><h3>Recent bests</h3></div><Trophy size={19} /></div>
          <div className="record-list">{records.map((record) => <div key={record.id}><span className="record-medal">◆</span><div><strong>{record.label}</strong><small>{record.exerciseName} · {new Date(record.achievedAt).toLocaleDateString()}</small></div><span>{record.type}</span></div>)}</div>
        </section>
      </div>

      <section className="panel long-horizon">
        <div><p className="eyebrow">Current direction</p><h3>{athlete.goal}</h3><p>Strength anchors remain squat, bench, and sumo. Chest, back, and triceps receive the largest flexible accessory allocation.</p></div>
        <div className="horizon-track"><span className="done">Baseline</span><i /><span className="active">Build</span><i /><span>Strength</span><i /><span>Review</span></div>
      </section>
    </div>
  )
}
