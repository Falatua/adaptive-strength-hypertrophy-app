import { useMemo, useState } from 'react'
import { AlertTriangle, ChevronRight, Clock3, Dumbbell, Filter, GitMerge, Heart, History, ListChecks, Pencil, Plus, Search, ShieldCheck, Star, Target, Trash2, Undo2 } from 'lucide-react'
import { nanoid } from 'nanoid'
import { duplicateCandidates, volumeLoad } from '../domain/training-engine'
import { findExerciseDuplicatePairs } from '../domain/history-engine'
import type { BodyRegion, CompletedSetRecord, Exercise, MovementPattern } from '../domain/types'
import { useAppStore } from '../store/useAppStore'
import { Modal } from '../components/Modal'

const regionFilters: { id: BodyRegion | 'all'; label: string }[] = [
  { id: 'all', label: 'All' }, { id: 'chest', label: 'Chest' }, { id: 'back', label: 'Back' }, { id: 'shoulders', label: 'Shoulders' },
  { id: 'quadriceps', label: 'Quads' }, { id: 'hamstrings', label: 'Hamstrings' }, { id: 'glutes', label: 'Glutes' }, { id: 'biceps', label: 'Biceps' }, { id: 'triceps', label: 'Triceps' }
]

export function LibraryScreen() {
  const { exercises, history, historyMutations, toggleFavorite, setJointFeeling, addCustomExercise, correctHistorySet, deleteHistorySet, mergeExercises, undoLatestHistoryMutation, setNotice } = useAppStore()
  const [search, setSearch] = useState('')
  const [region, setRegion] = useState<BodyRegion | 'all'>('all')
  const [selected, setSelected] = useState<Exercise | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [customName, setCustomName] = useState('')
  const [customPattern, setCustomPattern] = useState<MovementPattern>('horizontal-push')
  const [customRegion, setCustomRegion] = useState<BodyRegion>('chest')
  const [qualityOpen, setQualityOpen] = useState(false)
  const [editingSet, setEditingSet] = useState<CompletedSetRecord | null>(null)
  const [editValues, setEditValues] = useState({ load: '', reps: '', rir: '', technique: '', pain: '', qualityConfirmed: false, completedAt: '', reason: '' })
  const [deleteOpen, setDeleteOpen] = useState<CompletedSetRecord | null>(null)
  const [deleteReason, setDeleteReason] = useState('')
  const [mergePair, setMergePair] = useState<{ first: Exercise; second: Exercise } | null>(null)
  const [mergeTargetId, setMergeTargetId] = useState('')
  const [mergeReason, setMergeReason] = useState('Duplicate movement identity')
  const [formError, setFormError] = useState<string | null>(null)

  const filtered = useMemo(() => exercises.filter((exercise) => {
    if (exercise.retired) return false
    const needle = search.toLowerCase()
    const matchesSearch = !needle || [exercise.name, exercise.family, ...exercise.aliases, ...exercise.roleTags].join(' ').toLowerCase().includes(needle)
    const matchesRegion = region === 'all' || exercise.regions.includes(region)
    return matchesSearch && matchesRegion
  }), [exercises, search, region])

  const activeExercises = useMemo(() => exercises.filter((exercise) => !exercise.retired), [exercises])
  const duplicates = useMemo(() => customName.trim().length >= 3 ? duplicateCandidates(customName, activeExercises) : [], [customName, activeExercises])
  const duplicatePairs = useMemo(() => findExerciseDuplicatePairs(exercises), [exercises])
  const selectedHistory = selected ? history.filter((set) => set.exerciseId === selected.id).sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()) : []
  const groupedDates = selectedHistory.reduce<Record<string, typeof selectedHistory>>((groups, set) => {
    const key = set.completedAt.slice(0, 10)
    groups[key] = [...(groups[key] ?? []), set]
    return groups
  }, {})

  const openCorrection = (workSet: CompletedSetRecord) => {
    setSelected(null)
    setEditingSet(workSet)
    setFormError(null)
    setEditValues({
      load: String(workSet.load), reps: String(workSet.reps), rir: String(workSet.rir), technique: String(workSet.technique), pain: String(workSet.pain),
      qualityConfirmed: workSet.qualityConfirmed === true,
      completedAt: new Date(new Date(workSet.completedAt).getTime() - new Date(workSet.completedAt).getTimezoneOffset() * 60_000).toISOString().slice(0, 16), reason: ''
    })
  }

  const submitCorrection = () => {
    if (!editingSet) return
    if (!editValues.completedAt || Number.isNaN(new Date(editValues.completedAt).getTime())) return setFormError('Choose a valid completion date and time.')
    const result = correctHistorySet(editingSet.id, {
      load: Number(editValues.load), reps: Number(editValues.reps), rir: Number(editValues.rir), technique: Number(editValues.technique), pain: Number(editValues.pain),
      qualityConfirmed: editValues.qualityConfirmed,
      completedAt: new Date(editValues.completedAt).toISOString()
    }, editValues.reason)
    if (!result.ok) return setFormError(result.error ?? 'The set could not be corrected.')
    setEditingSet(null)
  }

  const submitDelete = () => {
    if (!deleteOpen) return
    const result = deleteHistorySet(deleteOpen.id, deleteReason)
    if (!result.ok) return setFormError(result.error ?? 'The set could not be removed.')
    setDeleteOpen(null)
    setDeleteReason('')
  }

  const openMerge = (first: Exercise, second: Exercise) => {
    setQualityOpen(false)
    setMergePair({ first, second })
    setMergeTargetId(first.id)
    setMergeReason('Duplicate movement identity')
    setFormError(null)
  }

  const submitMerge = () => {
    if (!mergePair) return
    const sourceId = mergeTargetId === mergePair.first.id ? mergePair.second.id : mergePair.first.id
    const result = mergeExercises([sourceId], mergeTargetId, mergeReason)
    if (!result.ok) return setFormError(result.error ?? 'The movements could not be merged.')
    setMergePair(null)
    setQualityOpen(false)
    setSelected(null)
  }

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
        <div className="screen-header__actions"><button className="button button--secondary" onClick={() => setQualityOpen(true)}><ListChecks size={17} /> Data quality {duplicatePairs.length ? `(${duplicatePairs.length})` : ''}</button><button className="button button--primary" onClick={() => setAddOpen(true)}><Plus size={17} /> Add movement</button></div>
      </header>

      <section className="library-categories">
        {[
          ['Body part', '11 regions', 'chest'], ['Movement type', '8 patterns', 'squat'], ['Training role', 'Anchor to accessory', 'primary'],
          ['Goal / weak point', 'Builder relationships', 'target'], ['Equipment', 'Current gym profile', 'equipment'], ['My movements', `${activeExercises.filter((exercise) => exercise.favorite).length} preferred`, 'heart']
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
              <div className="history-table history-table--editable">{Object.entries(groupedDates).slice(0, 8).map(([date, sets]) => <div className="history-day" key={date}><span><Clock3 size={14} />{new Date(`${date}T12:00:00`).toLocaleDateString()} · {volumeLoad(sets).toLocaleString()} volume</span>{sets.map((workSet) => <div className="history-set-row" key={workSet.id}><span><strong>{workSet.load} × {workSet.reps}</strong><small>Set {workSet.setIndex + 1} · {workSet.rir} RIR · {workSet.qualityConfirmed ? `technique ${workSet.technique} · pain ${workSet.pain}` : 'quality not confirmed'}</small>{workSet.originalExerciseName && <small>Originally logged as {workSet.originalExerciseName}</small>}</span><span><button aria-label={`Correct ${workSet.load} by ${workSet.reps} set`} onClick={() => openCorrection(workSet)}><Pencil size={15} /> Correct</button><button className="danger-link" aria-label={`Delete ${workSet.load} by ${workSet.reps} set`} onClick={() => { setSelected(null); setDeleteOpen(workSet); setDeleteReason(''); setFormError(null) }}><Trash2 size={15} /> Delete</button></span></div>)}</div>)}</div>
            </section>
            <div className="builder-callout"><Target size={21} /><div><strong>Builder relationship</strong><p>{selected.roleTags.includes('secondary builder') ? 'This movement is currently linked to a protected strength anchor. Transfer remains a personal hypothesis until repeated outcomes support it.' : 'No protected builder relationship has been assigned yet.'}</p></div></div>
          </div>
        )}
      </Modal>

      <section className="panel mutation-ledger">
        <div className="panel__header"><div><p className="eyebrow">Auditable history</p><h3>Correction and merge ledger</h3></div>{historyMutations.some((event) => !event.undoneAt) && <button className="button button--secondary" onClick={() => { const result = undoLatestHistoryMutation(); if (!result.ok) setNotice(result.error ?? 'Nothing to undo.') }}><Undo2 size={16} /> Undo latest change</button>}</div>
        {historyMutations.length ? <div className="mutation-list">{[...historyMutations].reverse().slice(0, 6).map((event) => <div key={event.id} className={event.undoneAt ? 'is-undone' : ''}><span className="record-medal">{event.type === 'exercise-merged' ? '↗' : event.type === 'set-deleted' ? '−' : '±'}</span><span><strong>{event.description}</strong><small>{event.reason} · {new Date(event.createdAt).toLocaleString()}{event.undoneAt ? ' · undone' : ''}</small></span><span>{event.volumeAfter - event.volumeBefore >= 0 ? '+' : ''}{(event.volumeAfter - event.volumeBefore).toLocaleString()} volume</span></div>)}</div> : <div className="compact-empty"><ShieldCheck size={24} /><strong>No history changes yet</strong><p>Corrections, deletions, and merges will appear here with their reasons and consequences.</p></div>}
      </section>

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add a distinct movement" description="ForgePath checks names, aliases, and exercise families before creating another history.">
        <label className="field-label" htmlFor="custom-name">Movement name</label><input id="custom-name" value={customName} onChange={(event) => setCustomName(event.target.value)} placeholder="Example: Incline Bench Press" />
        {duplicates.length > 0 && <div className="duplicate-warning"><AlertTriangle size={18} /><div><strong>Possible existing movement{duplicates.length > 1 ? 's' : ''}</strong>{duplicates.slice(0, 3).map(({ exercise, score }) => <button key={exercise.id} onClick={() => { setAddOpen(false); setSelected(exercise) }}><span>{exercise.name}</span><small>{Math.round(score * 100)}% match · use existing history</small></button>)}</div></div>}
        <div className="form-grid"><label><span className="field-label">Movement type</span><select value={customPattern} onChange={(event) => setCustomPattern(event.target.value as MovementPattern)}>{['squat', 'hinge', 'horizontal-push', 'vertical-push', 'horizontal-pull', 'vertical-pull', 'isolation', 'carry'].map((item) => <option key={item} value={item}>{item}</option>)}</select></label><label><span className="field-label">Primary body part</span><select value={customRegion} onChange={(event) => setCustomRegion(event.target.value as BodyRegion)}>{regionFilters.filter((item) => item.id !== 'all').map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label></div>
        <div className="modal__actions"><button className="button button--ghost" onClick={() => setAddOpen(false)}>Cancel</button><button className="button button--primary" disabled={!customName.trim()} onClick={createCustom}><ShieldCheck size={17} /> Create separate history</button></div>
      </Modal>

      <Modal open={qualityOpen} onClose={() => setQualityOpen(false)} title="Exercise data quality" description="Probable duplicates are suggestions, never silent changes. Review the identities and decide which movement history should remain canonical." wide>
        {duplicatePairs.length ? <div className="quality-list">{duplicatePairs.map((pair) => <div key={`${pair.first.id}:${pair.second.id}`}><span><GitMerge size={18} /><span><strong>{pair.first.name}</strong><small>and {pair.second.name}</small></span></span><span><b>{Math.round(pair.score * 100)}% likely</b><small>{pair.reason}</small></span><button className="button button--secondary" onClick={() => openMerge(pair.first, pair.second)}>Review merge</button></div>)}</div> : <div className="compact-empty"><ShieldCheck size={28} /><strong>No probable duplicates found</strong><p>All active movements currently have distinct canonical identities.</p></div>}
        <div className="modal__actions"><button className="button button--ghost" onClick={() => setQualityOpen(false)}>Close</button></div>
      </Modal>

      <Modal open={Boolean(editingSet)} onClose={() => setEditingSet(null)} title="Correct completed set" description="The original value remains in the correction ledger. All volume, records, and charts replay after you save.">
        {editingSet && <><div className="form-grid correction-grid">{(['load', 'reps', 'rir', 'technique', 'pain'] as const).map((field) => <label key={field}><span className="field-label">{field === 'rir' ? 'RIR' : field[0].toUpperCase() + field.slice(1)}</span><input type="number" min="0" step={field === 'load' ? '0.5' : '1'} value={editValues[field]} onChange={(event) => setEditValues({ ...editValues, [field]: event.target.value })} /></label>)}</div><label className="toggle-row"><span><strong>Confirm technique and pain</strong><small>Only confirmed quality can turn this number into a validated PR.</small></span><input type="checkbox" checked={editValues.qualityConfirmed} onChange={(event) => setEditValues({ ...editValues, qualityConfirmed: event.target.checked })} /></label><label><span className="field-label">Completed date and time</span><input type="datetime-local" value={editValues.completedAt} onChange={(event) => setEditValues({ ...editValues, completedAt: event.target.value })} /></label><label><span className="field-label">Reason for correction</span><input value={editValues.reason} onChange={(event) => setEditValues({ ...editValues, reason: event.target.value })} placeholder="Example: Entered plate total incorrectly" /></label>{formError && <p className="form-error" role="alert">{formError}</p>}<div className="correction-preview"><span>Before <strong>{editingSet.load} × {editingSet.reps}</strong></span><ChevronRight size={16} /><span>After <strong>{Number(editValues.load) || 0} × {Number(editValues.reps) || 0}</strong></span><small>{((Number(editValues.load) || 0) * (Number(editValues.reps) || 0) - editingSet.load * editingSet.reps).toLocaleString()} volume change · {editValues.qualityConfirmed ? 'quality confirmed' : 'numeric-only'}</small></div><div className="modal__actions"><button className="button button--ghost" onClick={() => setEditingSet(null)}>Cancel</button><button className="button button--primary" onClick={submitCorrection}><ShieldCheck size={17} /> Save and replay</button></div></>}
      </Modal>

      <Modal open={Boolean(deleteOpen)} onClose={() => setDeleteOpen(null)} title="Remove completed set" description="This changes training history. The set will remain recoverable through Undo latest change.">
        {deleteOpen && <><div className="destructive-summary"><AlertTriangle size={21} /><span><strong>{deleteOpen.exerciseName}</strong><p>{deleteOpen.load} × {deleteOpen.reps} on {new Date(deleteOpen.completedAt).toLocaleString()}</p><small>This removes {(deleteOpen.load * deleteOpen.reps).toLocaleString()} volume before replaying records.</small></span></div><label><span className="field-label">Reason for removal</span><input value={deleteReason} onChange={(event) => setDeleteReason(event.target.value)} placeholder="Example: Accidental duplicate set" /></label>{formError && <p className="form-error" role="alert">{formError}</p>}<div className="modal__actions"><button className="button button--ghost" onClick={() => setDeleteOpen(null)}>Keep set</button><button className="button button--danger" onClick={submitDelete}><Trash2 size={17} /> Remove and replay</button></div></>}
      </Modal>

      <Modal open={Boolean(mergePair)} onClose={() => setMergePair(null)} title="Merge duplicate movements" description="Choose the identity to keep. Original names, set timestamps, notes, and source IDs remain in the audit trail and can be restored with Undo.">
        {mergePair && <><div className="merge-choice" role="radiogroup" aria-label="Movement identity to keep">{[mergePair.first, mergePair.second].map((exercise) => <button key={exercise.id} role="radio" aria-checked={mergeTargetId === exercise.id} className={mergeTargetId === exercise.id ? 'selected' : ''} onClick={() => setMergeTargetId(exercise.id)}><span className={`movement-emblem movement-emblem--${exercise.pattern}`}>{exercise.name.slice(0, 1)}</span><span><strong>Keep {exercise.name}</strong><small>{history.filter((workSet) => workSet.exerciseId === exercise.id).length} completed sets · {exercise.aliases.length} aliases</small></span></button>)}</div><div className="merge-consequence"><GitMerge size={19} /><span><strong>{history.filter((workSet) => [mergePair.first.id, mergePair.second.id].includes(workSet.exerciseId)).length} completed sets will share one progression history.</strong><p>Future planned references move to the kept identity. Completed sessions and prior mesocycle versions remain historical truth.</p></span></div><label><span className="field-label">Reason for merge</span><input value={mergeReason} onChange={(event) => setMergeReason(event.target.value)} /></label>{formError && <p className="form-error" role="alert">{formError}</p>}<div className="modal__actions"><button className="button button--ghost" onClick={() => setMergePair(null)}>Cancel</button><button className="button button--primary" onClick={submitMerge}><GitMerge size={17} /> Merge and replay</button></div></>}
      </Modal>
    </div>
  )
}
