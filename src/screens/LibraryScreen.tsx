import { useMemo, useState } from 'react'
import { AlertTriangle, ChevronRight, Clock3, Dumbbell, Filter, Heart, History, Plus, Search, ShieldCheck, Star, Target } from 'lucide-react'
import { nanoid } from 'nanoid'
import { duplicateCandidates, volumeLoad } from '../domain/training-engine'
import type { BodyRegion, Exercise, MovementPattern } from '../domain/types'
import { useAppStore } from '../store/useAppStore'
import { Modal } from '../components/Modal'

const regionFilters: { id: BodyRegion | 'all'; label: string }[] = [
  { id: 'all', label: 'All' }, { id: 'chest', label: 'Chest' }, { id: 'back', label: 'Back' }, { id: 'shoulders', label: 'Shoulders' },
  { id: 'quadriceps', label: 'Quads' }, { id: 'hamstrings', label: 'Hamstrings' }, { id: 'glutes', label: 'Glutes' }, { id: 'biceps', label: 'Biceps' }, { id: 'triceps', label: 'Triceps' }
]

export function LibraryScreen() {
  const { exercises, history, toggleFavorite, setJointFeeling, addCustomExercise, setNotice } = useAppStore()
  const [search, setSearch] = useState('')
  const [region, setRegion] = useState<BodyRegion | 'all'>('all')
  const [selected, setSelected] = useState<Exercise | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [customName, setCustomName] = useState('')
  const [customPattern, setCustomPattern] = useState<MovementPattern>('horizontal-push')
  const [customRegion, setCustomRegion] = useState<BodyRegion>('chest')

  const filtered = useMemo(() => exercises.filter((exercise) => {
    const needle = search.toLowerCase()
    const matchesSearch = !needle || [exercise.name, exercise.family, ...exercise.aliases, ...exercise.roleTags].join(' ').toLowerCase().includes(needle)
    const matchesRegion = region === 'all' || exercise.regions.includes(region)
    return matchesSearch && matchesRegion
  }), [exercises, search, region])

  const duplicates = useMemo(() => customName.trim().length >= 3 ? duplicateCandidates(customName, exercises) : [], [customName, exercises])
  const selectedHistory = selected ? history.filter((set) => set.exerciseId === selected.id).sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()) : []
  const groupedDates = selectedHistory.reduce<Record<string, typeof selectedHistory>>((groups, set) => {
    const key = set.completedAt.slice(0, 10)
    groups[key] = [...(groups[key] ?? []), set]
    return groups
  }, {})

  const createCustom = () => {
    if (!customName.trim()) return
    addCustomExercise({
      id: nanoid(), name: customName.trim(), family: customName.trim(), aliases: [], pattern: customPattern,
      regions: [customRegion], primaryRegion: customRegion, equipment: ['custom'], description: 'Athlete-created movement. Add setup and history as you train it.',
      roleTags: ['custom'], favorite: false, jointFeeling: 'neutral', custom: true
    })
    setCustomName('')
    setAddOpen(false)
    setNotice('Custom movement added with its own canonical history.')
  }

  return (
    <div className="screen">
      <header className="screen-header">
        <div><p className="eyebrow">Canonical exercise knowledge</p><h1>One movement. One history.</h1><p>Browse by body part, movement type, role, goal, equipment, and personal response without fragmenting progression.</p></div>
        <button className="button button--primary" onClick={() => setAddOpen(true)}><Plus size={17} /> Add movement</button>
      </header>

      <section className="library-categories">
        {[
          ['Body part', '11 regions', 'chest'], ['Movement type', '8 patterns', 'squat'], ['Training role', 'Anchor to accessory', 'primary'],
          ['Goal / weak point', 'Builder relationships', 'target'], ['Equipment', 'Current gym profile', 'equipment'], ['My movements', `${exercises.filter((exercise) => exercise.favorite).length} preferred`, 'heart']
        ].map(([title, detail, icon]) => <button key={title} onClick={() => title === 'My movements' ? setSearch('preferred:') : setNotice(`${title} view is using the shared canonical taxonomy.`)}><span className={`category-pixel category-pixel--${icon}`}><Dumbbell size={19} /></span><strong>{title}</strong><small>{detail}</small><ChevronRight size={16} /></button>)}
      </section>

      <section className="library-browser">
        <div className="library-toolbar">
          <label className="search-box"><Search size={18} /><span className="sr-only">Search exercises</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search names, aliases, roles, equipment..." /></label>
          <button className="filter-button"><Filter size={17} /> Filters</button>
          <span>{filtered.length} movements</span>
        </div>
        <div className="filter-chips">{regionFilters.map((item) => <button key={item.id} className={region === item.id ? 'selected' : ''} onClick={() => setRegion(item.id)}>{item.label}</button>)}</div>
        {filtered.length ? (
          <div className="exercise-grid">
            {filtered.map((exercise) => {
              const exactHistory = history.filter((set) => set.exerciseId === exercise.id)
              const latest = [...exactHistory].sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())[0]
              return (
                <article className="library-card" key={exercise.id}>
                  <div className="library-card__top"><span className={`movement-emblem movement-emblem--${exercise.pattern}`}>{exercise.name.slice(0, 1)}</span><button className={exercise.favorite ? 'favorite active' : 'favorite'} onClick={() => toggleFavorite(exercise.id)} aria-label={`${exercise.favorite ? 'Remove' : 'Add'} ${exercise.name} ${exercise.favorite ? 'from' : 'to'} favorites`}><Star size={17} fill={exercise.favorite ? 'currentColor' : 'none'} /></button></div>
                  <p className="eyebrow">{exercise.family} · {exercise.pattern.replace('-', ' ')}</p>
                  <h3>{exercise.name}</h3>
                  <p>{exercise.description}</p>
                  <div className="library-card__tags"><span>{exercise.primaryRegion}</span><span className={`joint joint--${exercise.jointFeeling}`}>{exercise.jointFeeling}</span>{exercise.custom && <span>custom</span>}</div>
                  <div className="library-card__history"><History size={15} /><span>{latest ? <>Last: <strong>{latest.load} × {latest.reps}</strong> · {new Date(latest.completedAt).toLocaleDateString()}</> : 'No exact history yet'}</span></div>
                  <button className="library-card__open" onClick={() => setSelected(exercise)}>Open movement <ChevronRight size={16} /></button>
                </article>
              )
            })}
          </div>
        ) : <div className="empty-state"><Search size={32} /><h3>No movements match this exact filter.</h3><p>Remove a filter or create a distinct custom movement. ForgePath will warn about likely duplicates first.</p><button className="button button--secondary" onClick={() => { setSearch(''); setRegion('all') }}>Clear filters</button></div>}
      </section>

      <Modal open={Boolean(selected)} onClose={() => setSelected(null)} title={selected?.name ?? 'Movement'} description={selected?.description} wide>
        {selected && (
          <div className="exercise-detail">
            <div className="exercise-detail__summary">
              <div className={`movement-emblem movement-emblem--large movement-emblem--${selected.pattern}`}>{selected.name.slice(0, 1)}</div>
              <div><p className="eyebrow">Canonical ID · {selected.id}</p><h3>{selected.family}</h3><p>{selected.regions.join(' · ')} · {selected.equipment.join(' · ')}</p><div className="library-card__tags">{selected.roleTags.map((tag) => <span key={tag}>{tag}</span>)}</div></div>
            </div>
            <div className="detail-stats">
              <div><small>Last exact exposure</small><strong>{selectedHistory[0] ? new Date(selectedHistory[0].completedAt).toLocaleDateString() : 'Never'}</strong></div>
              <div><small>Exact volume load</small><strong>{volumeLoad(selectedHistory).toLocaleString()}</strong></div>
              <div><small>Completed sets</small><strong>{selectedHistory.length}</strong></div>
              <div><small>Joint response</small><strong>{selected.jointFeeling}</strong></div>
            </div>
            <div className="joint-picker"><span><Heart size={17} /><strong>How this feels on your joints</strong></span><div>{(['great', 'good', 'neutral', 'irritating', 'avoid'] as const).map((feeling) => <button key={feeling} className={selected.jointFeeling === feeling ? 'selected' : ''} onClick={() => { setJointFeeling(selected.id, feeling); setSelected({ ...selected, jointFeeling: feeling }) }}>{feeling}</button>)}</div></div>
            <section><div className="panel__header"><div><p className="eyebrow">Exact movement only</p><h3>Exposure history</h3></div><History size={18} /></div>
              <div className="history-table">{Object.entries(groupedDates).slice(0, 8).map(([date, sets]) => <div key={date}><span><Clock3 size={14} />{new Date(`${date}T12:00:00`).toLocaleDateString()}</span><strong>{sets.map((set) => `${set.load}×${set.reps}`).join(' · ')}</strong><small>{volumeLoad(sets).toLocaleString()} volume · avg {Math.round((sets.reduce((sum, set) => sum + set.rir, 0) / sets.length) * 10) / 10} RIR</small></div>)}</div>
            </section>
            <div className="builder-callout"><Target size={21} /><div><strong>Builder relationship</strong><p>{selected.roleTags.includes('secondary builder') ? 'This movement is currently linked to a protected strength anchor. Transfer remains a personal hypothesis until repeated outcomes support it.' : 'No protected builder relationship has been assigned yet.'}</p></div></div>
          </div>
        )}
      </Modal>

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add a distinct movement" description="ForgePath checks names, aliases, and exercise families before creating another history.">
        <label className="field-label" htmlFor="custom-name">Movement name</label><input id="custom-name" value={customName} onChange={(event) => setCustomName(event.target.value)} placeholder="Example: Incline Bench Press" />
        {duplicates.length > 0 && <div className="duplicate-warning"><AlertTriangle size={18} /><div><strong>Possible existing movement{duplicates.length > 1 ? 's' : ''}</strong>{duplicates.slice(0, 3).map(({ exercise, score }) => <button key={exercise.id} onClick={() => { setAddOpen(false); setSelected(exercise) }}><span>{exercise.name}</span><small>{Math.round(score * 100)}% match · use existing history</small></button>)}</div></div>}
        <div className="form-grid"><label><span className="field-label">Movement type</span><select value={customPattern} onChange={(event) => setCustomPattern(event.target.value as MovementPattern)}>{['squat', 'hinge', 'horizontal-push', 'vertical-push', 'horizontal-pull', 'vertical-pull', 'isolation', 'carry'].map((item) => <option key={item} value={item}>{item}</option>)}</select></label><label><span className="field-label">Primary body part</span><select value={customRegion} onChange={(event) => setCustomRegion(event.target.value as BodyRegion)}>{regionFilters.filter((item) => item.id !== 'all').map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label></div>
        <div className="modal__actions"><button className="button button--ghost" onClick={() => setAddOpen(false)}>Cancel</button><button className="button button--primary" disabled={!customName.trim()} onClick={createCustom}><ShieldCheck size={17} /> Create separate history</button></div>
      </Modal>
    </div>
  )
}
