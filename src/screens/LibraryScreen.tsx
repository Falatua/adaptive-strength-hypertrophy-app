import { useMemo, useRef, useState, type ChangeEvent } from 'react'
import { AlertTriangle, BookOpen, BrainCircuit, CalendarPlus, ChevronDown, ChevronRight, Clock3, Download, Dumbbell, FileCheck2, Filter, GitMerge, Heart, History, ListChecks, Pencil, Plus, RefreshCcw, Search, ShieldCheck, Target, ThumbsDown, ThumbsUp, Trash2, Undo2, Upload } from 'lucide-react'
import { nanoid } from 'nanoid'
import { duplicateCandidates, volumeLoad } from '../domain/training-engine'
import { findExerciseDuplicateGroups } from '../domain/catalog-engine'
import { buildTrainingHistoryImport, parseTrainingHistoryCsv, type ImportUnit, type TrainingHistoryImportPreview } from '../domain/import-engine'
import type { BodyRegion, CompletedSetRecord, Exercise, MuscleId, MovementPattern } from '../domain/types'
import { muscleCreditsFor, muscleDefinitions } from '../domain/muscle-dose'
import { exerciseEquipmentFit } from '../domain/equipment-engine'
import { buildPlacementHistoryEvidence } from '../domain/placement-history-engine'
import { useAppStore } from '../store/useAppStore'
import { Modal } from '../components/Modal'
import { MovementArt } from '../components/MovementArt'
import { movementNotesForExercise } from '../domain/movement-note-engine'
import { bodyRegionFilters as regionFilters, bodyRegionFilterIds } from './library-filters'
import { ABX_BACK_PAD_ANGLES, benchAngleLabel, normalizeBenchAngle, supportsBenchAngle } from '../domain/bench-angle-engine'
import { BodyRegionGlyph, ForgeGlyph, MovementPatternGlyph } from '../components/ForgeGlyph'
import { normalizeHistoricalLoad, type HistoricalEffortScale, type HistoricalLoadUnit } from '../domain/history-entry-engine'

const muscleLabel = new Map(muscleDefinitions.map((muscle) => [muscle.id, muscle.label]))
type BrowseDimension = 'body' | 'favorites'
type PreferenceFilter = 'all' | 'preferred' | 'avoid'

const patternLabels: Record<MovementPattern, string> = {
  squat: 'Squat pattern',
  hinge: 'Hinge pattern',
  'horizontal-push': 'Horizontal push',
  'vertical-push': 'Vertical push',
  'horizontal-pull': 'Horizontal pull',
  'vertical-pull': 'Vertical pull',
  isolation: 'Isolation',
  carry: 'Carry'
}

const localDateInput = () => {
  const now = new Date()
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10)
}

const freshHistoryEntry = (units: HistoricalLoadUnit) => ({
  date: localDateInput(), setCount: '3', reps: '8', load: '', loadUnit: units,
  effortScale: 'rir' as HistoricalEffortScale, effortValue: '2', benchAngleDeg: '',
  technique: '', pain: '', sessionName: '', note: ''
})


export function LibraryScreen() {
  const { athlete, activeSessionId, exercises, equipmentProfiles, history, movementNotes, historyMutations, substitutionEvents, settings, setExercisePreference, setJointFeeling, addCustomExercise, updateExerciseCatalog, correctHistorySet, deleteHistorySet, mergeExercises, importCompletedHistory, addHistoricalPerformance, undoLatestHistoryMutation, restartOnboarding, setNotice } = useAppStore()
  const [placementEvidenceAssessedAt] = useState(() => new Date().toISOString())
  const [search, setSearch] = useState('')
  const [region, setRegion] = useState<BodyRegion | 'all'>('all')
  const [preferenceFilter, setPreferenceFilter] = useState<PreferenceFilter>('all')
  const [compactLibrary] = useState(() => typeof window !== 'undefined' && window.matchMedia('(max-width: 620px)').matches)
  const initialWindowSize = compactLibrary ? 24 : 48
  const [filtersOpen, setFiltersOpen] = useState(() => !compactLibrary)
  const [visibleWindow, setVisibleWindow] = useState({ key: '', count: initialWindowSize })
  const [browseDimension, setBrowseDimension] = useState<BrowseDimension | null>(null)
  const filterPanelRef = useRef<HTMLDivElement>(null)
  const [selected, setSelected] = useState<Exercise | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [customName, setCustomName] = useState('')
  const [customPattern, setCustomPattern] = useState<MovementPattern>('horizontal-push')
  const [customRegion, setCustomRegion] = useState<BodyRegion>('chest')
  const [customEquipment, setCustomEquipment] = useState('')
  const [customDistinction, setCustomDistinction] = useState('')
  const [customMappingEnabled, setCustomMappingEnabled] = useState(false)
  const [customDirectMuscle, setCustomDirectMuscle] = useState<MuscleId | ''>('')
  const [customSecondaryMuscles, setCustomSecondaryMuscles] = useState<MuscleId[]>([])
  const [qualityOpen, setQualityOpen] = useState(false)
  const [editingSet, setEditingSet] = useState<CompletedSetRecord | null>(null)
  const [editValues, setEditValues] = useState({ load: '', reps: '', rir: '', technique: '', pain: '', benchAngleDeg: '', qualityConfirmed: false, completedAt: '', reason: '' })
  const [deleteOpen, setDeleteOpen] = useState<CompletedSetRecord | null>(null)
  const [deleteReason, setDeleteReason] = useState('')
  const [mergeGroup, setMergeGroup] = useState<Exercise[] | null>(null)
  const [mergeTargetId, setMergeTargetId] = useState('')
  const [mergeReason, setMergeReason] = useState('Duplicate movement identity')
  const [catalogEdit, setCatalogEdit] = useState<Exercise | null>(null)
  const [catalogValues, setCatalogValues] = useState({ name: '', family: '', aliases: '', pattern: 'horizontal-push' as MovementPattern, primaryRegion: 'chest' as BodyRegion, equipment: '', description: '', reason: '', muscleMappingEnabled: false, directMuscle: '' as MuscleId | '', secondaryMuscles: [] as MuscleId[] })
  const [formError, setFormError] = useState<string | null>(null)
  const [importOpen, setImportOpen] = useState(false)
  const [importUnits, setImportUnits] = useState<ImportUnit>(settings.units)
  const [importPreview, setImportPreview] = useState<TrainingHistoryImportPreview | null>(null)
  const [importMappings, setImportMappings] = useState<Record<string, string>>({})
  const [importError, setImportError] = useState<string | null>(null)
  const [historyEntryOpen, setHistoryEntryOpen] = useState(false)
  const [historyEntryValues, setHistoryEntryValues] = useState(() => freshHistoryEntry(settings.units))

  const activeEquipmentProfile = equipmentProfiles.find((profile) => profile.id === settings.activeEquipmentProfileId) ?? equipmentProfiles[0]
  const filtered = useMemo(() => exercises.filter((exercise) => {
    if (exercise.retired) return false
    const needle = search.toLowerCase()
    const matchesSearch = !needle || [exercise.name, exercise.family, ...exercise.aliases, ...exercise.roleTags].join(' ').toLowerCase().includes(needle)
    const matchesRegion = region === 'all' || exercise.regions.includes(region)
    const matchesPreference = preferenceFilter === 'all' || (preferenceFilter === 'preferred' ? exercise.favorite : exercise.disliked)
    return matchesSearch && matchesRegion && matchesPreference
  }), [exercises, preferenceFilter, search, region])

  const activeExercises = useMemo(() => exercises.filter((exercise) => !exercise.retired), [exercises])
  const filterWindowKey = `${search}\u0000${region}\u0000${preferenceFilter}`
  const visibleCount = visibleWindow.key === filterWindowKey ? visibleWindow.count : initialWindowSize
  const placementEvidence = useMemo(() => athlete.strengthAnchors.flatMap((exerciseId) => {
    const exercise = exercises.find((candidate) => candidate.id === exerciseId)
    return exercise ? [buildPlacementHistoryEvidence({ exercise, history, assessedAt: placementEvidenceAssessedAt })] : []
  }), [athlete.strengthAnchors, exercises, history, placementEvidenceAssessedAt])
  const duplicates = useMemo(() => customName.trim().length >= 3 ? duplicateCandidates(customName, activeExercises) : [], [customName, activeExercises])
  const duplicateGroups = useMemo(() => findExerciseDuplicateGroups(exercises), [exercises])
  const exactCreationDuplicate = duplicates.some((candidate) => candidate.score === 1)
  const catalogCandidates = useMemo(() => {
    if (!catalogEdit) return []
    const alternatives = activeExercises.filter((exercise) => exercise.id !== catalogEdit.id)
    const queries = [catalogValues.name, ...catalogValues.aliases.split(',')].map((value) => value.trim()).filter((value) => value.length >= 3)
    const byId = new Map<string, { exercise: Exercise; score: number }>()
    queries.forEach((query) => duplicateCandidates(query, alternatives).forEach((candidate) => {
      const current = byId.get(candidate.exercise.id)
      if (!current || candidate.score > current.score) byId.set(candidate.exercise.id, candidate)
    }))
    return [...byId.values()].sort((a, b) => b.score - a.score).slice(0, 3)
  }, [activeExercises, catalogEdit, catalogValues.aliases, catalogValues.name])
  const selectedHistory = selected ? history.filter((set) => set.exerciseId === selected.id).sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()) : []
  const selectedMovementNotes = selected ? movementNotesForExercise(movementNotes, selected.id) : []
  const selectedMuscleCredits = selected ? muscleCreditsFor(selected.id, exercises) : undefined
  const selectedEquipmentFit = selected ? exerciseEquipmentFit(selected, activeEquipmentProfile) : undefined
  const selectedAngleSummary = selected && supportsBenchAngle(selected) ? [...selectedHistory.reduce((groups, workSet) => {
    const key = benchAngleLabel(workSet.benchAngleDeg)
    const existing = groups.get(key) ?? { label: key, sets: 0, volume: 0, latestAt: workSet.completedAt }
    existing.sets += 1
    existing.volume += workSet.load * workSet.reps
    if (new Date(workSet.completedAt) > new Date(existing.latestAt)) existing.latestAt = workSet.completedAt
    groups.set(key, existing)
    return groups
  }, new Map<string, { label: string; sets: number; volume: number; latestAt: string }>()).values()] : []
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
      benchAngleDeg: workSet.benchAngleDeg === undefined ? '' : String(workSet.benchAngleDeg), qualityConfirmed: workSet.qualityConfirmed === true,
      completedAt: new Date(new Date(workSet.completedAt).getTime() - new Date(workSet.completedAt).getTimezoneOffset() * 60_000).toISOString().slice(0, 16), reason: ''
    })
  }

  const openHistoryEntry = () => {
    setHistoryEntryValues(freshHistoryEntry(settings.units))
    setFormError(null)
    setHistoryEntryOpen(true)
  }

  const submitHistoryEntry = () => {
    if (!selected) return
    const completedAt = new Date(`${historyEntryValues.date}T12:00:00`)
    const result = addHistoricalPerformance({
      exerciseId: selected.id,
      completedAt: completedAt.toISOString(),
      setCount: Number(historyEntryValues.setCount),
      reps: Number(historyEntryValues.reps),
      load: Number(historyEntryValues.load),
      loadUnit: historyEntryValues.loadUnit,
      effortScale: historyEntryValues.effortScale,
      effortValue: historyEntryValues.effortScale === 'unknown' ? null : Number(historyEntryValues.effortValue),
      benchAngleDeg: supportsBenchAngle(selected) && historyEntryValues.benchAngleDeg !== '' ? normalizeBenchAngle(Number(historyEntryValues.benchAngleDeg)) : null,
      technique: historyEntryValues.technique === '' ? null : Number(historyEntryValues.technique),
      pain: historyEntryValues.pain === '' ? null : Number(historyEntryValues.pain),
      sessionName: historyEntryValues.sessionName,
      note: historyEntryValues.note
    })
    if (!result.ok) return setFormError(result.error ?? 'That past performance could not be added.')
    setHistoryEntryOpen(false)
    setFormError(null)
  }

  const submitCorrection = () => {
    if (!editingSet) return
    if (!editValues.completedAt || Number.isNaN(new Date(editValues.completedAt).getTime())) return setFormError('Choose a valid completion date and time.')
    const result = correctHistorySet(editingSet.id, {
      load: Number(editValues.load), reps: Number(editValues.reps), rir: Number(editValues.rir), technique: Number(editValues.technique), pain: Number(editValues.pain),
      benchAngleDeg: editValues.benchAngleDeg === '' ? null : normalizeBenchAngle(Number(editValues.benchAngleDeg)), qualityConfirmed: editValues.qualityConfirmed,
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

  const openMerge = (group: Exercise[]) => {
    setQualityOpen(false)
    setMergeGroup(group)
    setMergeTargetId(group[0]?.id ?? '')
    setMergeReason('Duplicate movement identity')
    setFormError(null)
  }

  const submitMerge = () => {
    if (!mergeGroup) return
    const sourceIds = mergeGroup.filter((exercise) => exercise.id !== mergeTargetId).map((exercise) => exercise.id)
    const result = mergeExercises(sourceIds, mergeTargetId, mergeReason)
    if (!result.ok) return setFormError(result.error ?? 'The movements could not be merged.')
    setMergeGroup(null)
    setQualityOpen(false)
    setSelected(null)
  }

  const openCatalogEdit = (exercise: Exercise) => {
    setSelected(null)
    setCatalogEdit(exercise)
    setCatalogValues({
      name: exercise.name, family: exercise.family, aliases: exercise.aliases.join(', '), pattern: exercise.pattern,
      primaryRegion: exercise.primaryRegion, equipment: exercise.equipment.join(', '), description: exercise.description, reason: '',
      muscleMappingEnabled: Boolean(exercise.muscleMapping), directMuscle: exercise.muscleMapping?.direct ?? '', secondaryMuscles: exercise.muscleMapping?.secondary ?? []
    })
    setFormError(null)
  }

  const submitCatalogEdit = () => {
    if (!catalogEdit) return
    if (catalogEdit.custom && catalogValues.muscleMappingEnabled && !catalogValues.directMuscle) return setFormError('Choose one direct muscle or leave this movement unmapped.')
    const result = updateExerciseCatalog(catalogEdit.id, {
      name: catalogValues.name,
      family: catalogValues.family,
      aliases: catalogValues.aliases.split(','),
      pattern: catalogValues.pattern,
      primaryRegion: catalogValues.primaryRegion,
      equipment: catalogValues.equipment.split(','),
      description: catalogValues.description,
      muscleMapping: catalogEdit.custom && catalogValues.muscleMappingEnabled && catalogValues.directMuscle ? {
        ruleVersion: 'exercise-muscle-map-v1', direct: catalogValues.directMuscle,
        secondary: catalogValues.secondaryMuscles.filter((muscle) => muscle !== catalogValues.directMuscle),
        source: 'athlete', reviewedAt: new Date().toISOString()
      } : catalogEdit.custom ? null : undefined
    }, catalogValues.reason)
    if (!result.ok) return setFormError(result.error ?? 'The movement could not be updated.')
    setCatalogEdit(null)
    setSelected(result.exercise ?? null)
  }

  const createCustom = () => {
    if (!customName.trim()) return
    if (customMappingEnabled && !customDirectMuscle) return setFormError('Choose one direct muscle or leave this movement unmapped.')
    addCustomExercise({
      id: nanoid(), name: customName.trim(), family: customName.trim(), aliases: [], pattern: customPattern,
      regions: [customRegion], primaryRegion: customRegion, equipment: customEquipment.split(',').map((item) => item.trim()).filter(Boolean), description: customDistinction.trim() ? `Athlete-created movement. Distinct because: ${customDistinction.trim()}` : 'Athlete-created movement. Add setup and history as you train it.',
      roleTags: ['custom'], favorite: false, jointFeeling: 'neutral', custom: true,
      muscleMapping: customMappingEnabled && customDirectMuscle ? {
        ruleVersion: 'exercise-muscle-map-v1', direct: customDirectMuscle,
        secondary: customSecondaryMuscles.filter((muscle) => muscle !== customDirectMuscle),
        source: 'athlete', reviewedAt: new Date().toISOString()
      } : undefined
    })
    setCustomName('')
    setCustomDistinction('')
    setCustomEquipment('')
    setCustomMappingEnabled(false)
    setCustomDirectMuscle('')
    setCustomSecondaryMuscles([])
    setAddOpen(false)
    setNotice('Custom movement added with its own history.')
  }

  const openImport = () => {
    setImportOpen(true)
    setImportUnits(settings.units)
    setImportPreview(null)
    setImportMappings({})
    setImportError(null)
  }

  const readImportFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    try {
      const preview = parseTrainingHistoryCsv({ raw: await file.text(), sourceName: file.name, sourceUnits: importUnits, appUnits: settings.units, exercises, existingHistory: history })
      setImportPreview(preview)
      setImportMappings(Object.fromEntries(preview.mappings.flatMap((mapping) => mapping.exactExerciseId ? [[mapping.sourceExerciseName, mapping.exactExerciseId]] : [])))
      setImportError(preview.errors.length ? 'Fix the source file and choose it again. No rows have been imported.' : null)
    } catch (error) {
      setImportPreview(null)
      setImportMappings({})
      setImportError(error instanceof Error ? error.message : 'The training-history file could not be read.')
    }
  }

  const commitImport = () => {
    if (!importPreview) return
    try {
      const projection = buildTrainingHistoryImport({ preview: importPreview, exerciseMappings: importMappings, exercises, existingHistory: history, batchId: nanoid(8) })
      const result = importCompletedHistory(projection.records, importPreview.sourceName, projection.skippedDuplicates)
      if (!result.ok) return setImportError(result.error ?? 'The validated history could not be imported.')
      setImportOpen(false)
      setImportPreview(null)
      setImportMappings({})
    } catch (error) {
      setImportError(error instanceof Error ? error.message : 'The validated history could not be imported.')
    }
  }

  const downloadImportTemplate = () => {
    const blob = new Blob(['date,exercise,load,reps,rir,session\n2026-08-01,Competition Bench Press,185,6,2,Upper A\n'], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'forgepath-history-template.csv'
    anchor.click()
    URL.revokeObjectURL(url)
  }

  const openBrowseDimension = (dimension: BrowseDimension) => {
    setBrowseDimension(dimension)
    setFiltersOpen(true)
    setSearch('')
    setRegion('all')
    setPreferenceFilter(dimension === 'favorites' ? 'preferred' : 'all')
    window.requestAnimationFrame(() => filterPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }

  const clearFilters = () => {
    setSearch('')
    setRegion('all')
    setPreferenceFilter('all')
    setBrowseDimension(null)
  }

  return (
    <div className="screen">
      <header className="screen-header">
        <div><p className="eyebrow">Movement library</p><h1>Find it. Rate it. Train it.</h1><p>Browse by body part, mark movements you prefer or want to avoid, and open any movement for its complete history and setup details.</p></div>
        <div className="screen-header__actions"><button className="button button--secondary" onClick={openImport}><Upload size={17} /> Import history</button><button className="button button--secondary" onClick={() => setQualityOpen(true)}><ListChecks size={17} /> Data quality {duplicateGroups.length ? `(${duplicateGroups.length})` : ''}</button><button className="button button--primary" onClick={() => { setFormError(null); setAddOpen(true) }}><Plus size={17} /> Add movement</button></div>
      </header>

      <section className="library-categories">
        <button aria-pressed={browseDimension === 'body'} onClick={() => openBrowseDimension('body')}><span className="category-pixel category-pixel--body"><BodyRegionGlyph region="all" size={50} /></span><strong>Body part</strong><small>{bodyRegionFilterIds.length} areas</small></button>
        <button aria-pressed={browseDimension === 'favorites'} onClick={() => openBrowseDimension('favorites')}><span className="category-pixel category-pixel--preference"><ThumbsUp size={30} aria-hidden="true" /></span><strong>My preferences</strong><small>{activeExercises.filter((exercise) => exercise.favorite).length} preferred · {activeExercises.filter((exercise) => exercise.disliked).length} avoid</small></button>
        <button className="library-view-all" aria-pressed={browseDimension === null && region === 'all' && preferenceFilter === 'all' && !search} onClick={clearFilters}><span className="category-pixel category-pixel--target"><ForgeGlyph name="library" size={22} /></span><strong>View all</strong><small>{activeExercises.length} movements</small></button>
      </section>

      <section className="library-browser" ref={filterPanelRef}>
        <div className="library-toolbar">
          <label className="search-box"><Search size={18} /><span className="sr-only">Search exercises</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search a movement or its other names..." /></label>
          <button className="filter-button" aria-expanded={filtersOpen} aria-controls="library-filter-panel" onClick={() => setFiltersOpen((current) => !current)}><Filter size={17} /> {filtersOpen ? 'Hide filters' : 'Show filters'}</button>
          <span>{filtered.length} movements</span>
        </div>
        {!filtersOpen && <div className="library-filter-summary"><ForgeGlyph name="choice" size={15} /><span>{region === 'all' ? 'All body parts' : regionFilters.find((item) => item.id === region)?.label} · {preferenceFilter === 'all' ? 'All preferences' : preferenceFilter}</span></div>}
        {filtersOpen && <div className="filter-stack" id="library-filter-panel">
          <div className="filter-chips" aria-label="Body part and weak point filter"><span>Body part</span>{regionFilters.map((item) => <button key={item.id} className={region === item.id ? 'selected' : ''} aria-pressed={region === item.id} onClick={() => setRegion(item.id)}><BodyRegionGlyph region={item.id} size={20} />{item.label}</button>)}</div>

          <div className="filter-chips filter-chips--availability" aria-label="Movement preference filter"><span>Preference</span><button className={preferenceFilter === 'all' ? 'selected' : ''} aria-pressed={preferenceFilter === 'all'} onClick={() => setPreferenceFilter('all')}>All</button><button className={preferenceFilter === 'preferred' ? 'selected' : ''} aria-pressed={preferenceFilter === 'preferred'} onClick={() => setPreferenceFilter('preferred')}><ThumbsUp size={14} /> Preferred</button><button className={preferenceFilter === 'avoid' ? 'selected' : ''} aria-pressed={preferenceFilter === 'avoid'} onClick={() => setPreferenceFilter('avoid')}><ThumbsDown size={14} /> Avoid</button><button onClick={clearFilters}>Reset</button></div>
        </div>}
        {filtered.length ? (
          <div className="exercise-grid">
            {filtered.slice(0, visibleCount).map((exercise) => {
              const exactHistory = history.filter((set) => set.exerciseId === exercise.id)
              const latest = [...exactHistory].sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())[0]
              const equipmentFit = exerciseEquipmentFit(exercise, activeEquipmentProfile)
              return (
                <article className={`library-card ${equipmentFit.available ? 'is-available' : 'is-unavailable'} ${exercise.favorite ? 'is-preferred' : ''} ${exercise.disliked ? 'is-disliked' : ''}`} key={exercise.id}>
                  <div className="library-card__top"><MovementArt exercise={exercise} /><div className="exercise-preference" role="group" aria-label={`${exercise.name} preference`}><button className={exercise.favorite ? 'is-active is-preferred' : ''} aria-pressed={exercise.favorite} onClick={() => setExercisePreference(exercise.id, exercise.favorite ? 'neutral' : 'preferred')}><ThumbsUp size={17} /><span>Prefer</span></button><button className={exercise.disliked ? 'is-active is-avoid' : ''} aria-pressed={Boolean(exercise.disliked)} onClick={() => setExercisePreference(exercise.id, exercise.disliked ? 'neutral' : 'avoid')}><ThumbsDown size={17} /><span>Avoid</span></button></div></div>
                  <p className="eyebrow library-card__family"><MovementPatternGlyph pattern={exercise.pattern} size={16} />{exercise.family} · {exercise.pattern.replace('-', ' ')}</p>
                  <h3>{exercise.name}</h3>
                  <p>{exercise.description}</p>
                  <div className="library-card__tags"><span>{patternLabels[exercise.pattern].toLowerCase()}</span><span>{exercise.primaryRegion}</span><span className={`joint joint--${exercise.jointFeeling}`}>{exercise.jointFeeling}</span>{exercise.custom && <span>custom</span>}<span className={equipmentFit.available ? 'equipment-available' : 'equipment-missing'}>{equipmentFit.available ? 'available here' : `missing ${equipmentFit.missing.length}`}</span></div>
                  <div className="library-card__history"><History size={15} /><span>{latest ? <>Last: <strong>{latest.load} × {latest.reps}</strong> · {new Date(latest.completedAt).toLocaleDateString()}</> : 'No exact history yet'}</span></div>
                  <button className="library-card__open" onClick={() => setSelected(exercise)} aria-label={`View details for ${exercise.name}`}><span>View movement details</span><ChevronDown size={20} /></button>
                </article>
              )
            })}
          </div>
        ) : <div className="empty-state"><Search size={32} /><h3>Nothing matches this search yet.</h3><p>Try a different body part or movement type, or add your own movement. We will flag likely duplicates before saving it.</p><button className="button button--secondary" onClick={clearFilters}>View all movements</button></div>}
        {filtered.length > visibleCount && <div className="library-load-more"><small>Showing {visibleCount} of {filtered.length} movements</small><button className="button button--secondary" onClick={() => setVisibleWindow({ key: filterWindowKey, count: Math.min(filtered.length, visibleCount + initialWindowSize) })}>Load {Math.min(initialWindowSize, filtered.length - visibleCount)} more</button></div>}
      </section>

      <section className="panel placement-history-panel">
        <div className="panel__header"><div><p className="eyebrow">Your exact history</p><h3>Start from what you have actually lifted</h3></div><BrainCircuit size={20} /></div>
        <p className="chart-note">ForgePath can summarize your recent work on this exact lift and suggest how much history backs it, or how ready you are for heavy work. You must review and accept each suggestion. Skill, pain, recovery, and neighboring variations are never inferred.</p>
        <div className="placement-history-grid">{placementEvidence.map((evidence) => <article key={evidence.exerciseId} className={evidence.totalSetCount ? 'has-evidence' : ''}><span><strong>{evidence.exerciseName}</strong><small>{evidence.basis === 'recent-window' ? `${evidence.recentSetCount} sets · ${evidence.recentExposureDateCount} dates in ${evidence.windowDays} days` : evidence.basis === 'latest-stale' ? 'Exact history exists, but it is stale' : 'No exact history'}</small></span><div><b>Evidence {evidence.suggestedDataConfidence}/5</b><b>{evidence.suggestedStrengthTolerance === null ? 'Tolerance not inferred' : `Tolerance ${evidence.suggestedStrengthTolerance}/5`}</b></div>{evidence.recentImportedSetCount > 0 && <small>{evidence.recentImportedSetCount} recent imported set{evidence.recentImportedSetCount === 1 ? '' : 's'} remain numeric-only.</small>}</article>)}</div>
        <div className="placement-history-action"><span><ShieldCheck size={17} /><small>Reviewing creates a new starting plan going forward. Your completed history is never rewritten.</small></span><button className="button button--secondary" disabled={Boolean(activeSessionId) || !placementEvidence.some((evidence) => evidence.totalSetCount > 0)} onClick={() => restartOnboarding(1)}>Review my starting plan</button></div>
      </section>

      <Modal open={Boolean(selected)} onClose={() => { setSelected(null); setHistoryEntryOpen(false) }} title={selected?.name ?? 'Movement'} description={selected?.description} wide>
        {selected && (
          <div className="exercise-detail">
            <div className="exercise-detail__summary">
              <MovementArt exercise={selected} large />
              <div><p className="eyebrow">Canonical ID · {selected.id}</p><h3>{selected.family}</h3><p>{selected.regions.join(' · ')} · {selected.equipment.join(' · ')}</p><div className="library-card__tags">{selected.roleTags.map((tag) => <span key={tag}>{tag}</span>)}</div></div>
            </div>
            <div className="detail-stats">
              <div><small>Last time you did this</small><strong>{selectedHistory[0] ? new Date(selectedHistory[0].completedAt).toLocaleDateString() : 'Never'}</strong></div>
              <div><small>Exact volume load</small><strong>{volumeLoad(selectedHistory).toLocaleString()}</strong></div>
              <div><small>Completed sets</small><strong>{selectedHistory.length}</strong></div>
              <div><small>Programming preference</small><strong>{selected.favorite ? 'Preferred' : selected.disliked ? 'Avoid' : 'Neutral'}</strong></div>
              <div><small>Joint response</small><strong>{selected.jointFeeling}</strong></div>
              <div><small>Saved notes</small><strong>{selectedMovementNotes.length}</strong></div>
            </div>
            <section className={`history-entry-panel ${historyEntryOpen ? 'is-open' : ''}`} aria-labelledby="history-entry-title">
              <div className="history-entry-panel__header"><span><CalendarPlus size={20} /><span><p className="eyebrow">Start with what you know</p><h3 id="history-entry-title">Add a past performance</h3><small>Give ForgePath an exact baseline without creating a fake planned workout.</small></span></span><button className="button button--secondary" disabled={Boolean(activeSessionId)} aria-expanded={historyEntryOpen} onClick={() => historyEntryOpen ? setHistoryEntryOpen(false) : openHistoryEntry()}>{historyEntryOpen ? 'Close entry' : 'Enter past sets'}</button></div>
              {activeSessionId && <p className="control-reason">Finish or leave the active workout before changing completed history.</p>}
              {historyEntryOpen && <div className="history-entry-form">
                <div className="history-entry-form__truth"><ShieldCheck size={18} /><span><strong>Exact movement evidence</strong><p>These sets can inform future load, repetitions, setup, and confidence for {selected.name}. They do not prove readiness, recovery, technique, pain, or plan completion unless you enter those fields.</p></span></div>
                <div className="form-grid history-entry-grid">
                  <label><span className="field-label">Training date</span><input aria-label="Past performance date" type="date" max={localDateInput()} value={historyEntryValues.date} onChange={(event) => setHistoryEntryValues({ ...historyEntryValues, date: event.target.value })} /></label>
                  <label><span className="field-label">Sets</span><input aria-label="Past performance sets" type="number" inputMode="numeric" min="1" max="50" step="1" value={historyEntryValues.setCount} onChange={(event) => setHistoryEntryValues({ ...historyEntryValues, setCount: event.target.value })} /></label>
                  <label><span className="field-label">Repetitions per set</span><input aria-label="Past performance repetitions" type="number" inputMode="numeric" min="1" max="1000" step="1" value={historyEntryValues.reps} onChange={(event) => setHistoryEntryValues({ ...historyEntryValues, reps: event.target.value })} /></label>
                  <label><span className="field-label">Weight</span><span className="history-entry-load"><input aria-label="Past performance weight" type="number" inputMode="decimal" min="0" max="100000" step="0.5" placeholder="135" value={historyEntryValues.load} onChange={(event) => setHistoryEntryValues({ ...historyEntryValues, load: event.target.value })} /><select aria-label="Past performance weight unit" value={historyEntryValues.loadUnit} onChange={(event) => setHistoryEntryValues({ ...historyEntryValues, loadUnit: event.target.value as HistoricalLoadUnit })}><option value="lb">lb</option><option value="kg">kg</option></select></span></label>
                  <label><span className="field-label">Effort scale</span><select aria-label="Past performance effort scale" value={historyEntryValues.effortScale} onChange={(event) => { const effortScale = event.target.value as HistoricalEffortScale; setHistoryEntryValues({ ...historyEntryValues, effortScale, effortValue: effortScale === 'unknown' ? '' : effortScale === 'rpe' ? '8' : '2' }) }}><option value="rir">RIR, reps left</option><option value="rpe">RPE, exertion</option><option value="unknown">I do not know</option></select></label>
                  {historyEntryValues.effortScale !== 'unknown' && <label><span className="field-label">{historyEntryValues.effortScale === 'rpe' ? 'RPE' : 'RIR'}</span><input aria-label="Past performance effort value" type="number" inputMode="decimal" min={historyEntryValues.effortScale === 'rpe' ? '1' : '0'} max="10" step="0.5" value={historyEntryValues.effortValue} onChange={(event) => setHistoryEntryValues({ ...historyEntryValues, effortValue: event.target.value })} /><small className="field-help">{historyEntryValues.effortScale === 'rpe' ? '10 means no repetitions were left.' : '0 means no repetitions were left.'}</small></label>}
                  {supportsBenchAngle(selected) && <label className="history-entry-angle"><span className="field-label">ABX back-pad angle (optional)</span><input aria-label="Past performance bench angle" type="number" inputMode="decimal" min="0" max="90" step="1" placeholder="45" value={historyEntryValues.benchAngleDeg} onChange={(event) => setHistoryEntryValues({ ...historyEntryValues, benchAngleDeg: event.target.value })} /><span className="bench-angle-presets" aria-label="ABX back-pad presets">{ABX_BACK_PAD_ANGLES.map((angle) => <button type="button" key={angle} aria-pressed={historyEntryValues.benchAngleDeg === String(angle)} onClick={() => setHistoryEntryValues({ ...historyEntryValues, benchAngleDeg: String(angle) })}>{angle}°</button>)}</span><small className="field-help">ABX presets are shortcuts. Any 0–90° value is allowed. Blank means the angle is unknown, not zero.</small></label>}
                  <label><span className="field-label">Technique (optional)</span><select aria-label="Past performance technique" value={historyEntryValues.technique} onChange={(event) => setHistoryEntryValues({ ...historyEntryValues, technique: event.target.value })}><option value="">Unknown</option><option value="1">1 · broke down</option><option value="2">2</option><option value="3">3</option><option value="4">4</option><option value="5">5 · consistent</option></select></label>
                  <label><span className="field-label">Pain or irritation (optional)</span><select aria-label="Past performance pain" value={historyEntryValues.pain} onChange={(event) => setHistoryEntryValues({ ...historyEntryValues, pain: event.target.value })}><option value="">Unknown</option><option value="0">0 · none</option><option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option><option value="5">5 · severe</option></select></label>
                  <label className="history-entry-grid__wide"><span className="field-label">Session name (optional)</span><input aria-label="Past performance session name" maxLength={120} placeholder="Example: Upper day" value={historyEntryValues.sessionName} onChange={(event) => setHistoryEntryValues({ ...historyEntryValues, sessionName: event.target.value })} /></label>
                  <label className="history-entry-grid__wide"><span className="field-label">Setup or context note (optional)</span><textarea aria-label="Past performance note" maxLength={500} rows={3} placeholder="Grip, machine, tempo, equipment, or anything that makes this performance comparable later" value={historyEntryValues.note} onChange={(event) => setHistoryEntryValues({ ...historyEntryValues, note: event.target.value })} /></label>
                </div>
                <div className="history-entry-preview" aria-live="polite"><span><strong>{Number(historyEntryValues.setCount) || 0} × {Number(historyEntryValues.reps) || 0} at {Number(historyEntryValues.load) || 0} {historyEntryValues.loadUnit}</strong><small>{((Number(historyEntryValues.setCount) || 0) * (Number(historyEntryValues.reps) || 0) * (Number(historyEntryValues.load) || 0)).toLocaleString()} {historyEntryValues.loadUnit} volume{historyEntryValues.benchAngleDeg ? ` · ${historyEntryValues.benchAngleDeg}° bench` : ''}{historyEntryValues.effortScale === 'unknown' ? ' · effort unknown' : ` · ${historyEntryValues.effortScale.toUpperCase()} ${historyEntryValues.effortValue}`}</small></span>{historyEntryValues.loadUnit !== settings.units && <span><small>Stored in your current unit</small><strong>{normalizeHistoricalLoad(Number(historyEntryValues.load) || 0, historyEntryValues.loadUnit, settings.units)} {settings.units}</strong></span>}</div>
                {(historyEntryValues.technique === '') !== (historyEntryValues.pain === '') && <p className="form-guidance">Enter both technique and pain to confirm quality, or leave both unknown.</p>}
                {formError && <p className="form-error" role="alert">{formError}</p>}
                <div className="history-entry-actions"><button className="button button--ghost" onClick={() => setHistoryEntryOpen(false)}>Cancel</button><button className="button button--primary" disabled={!historyEntryValues.date || !historyEntryValues.load || !historyEntryValues.setCount || !historyEntryValues.reps || (historyEntryValues.effortScale !== 'unknown' && historyEntryValues.effortValue === '') || ((historyEntryValues.technique === '') !== (historyEntryValues.pain === ''))} onClick={submitHistoryEntry}><CalendarPlus size={17} /> Add {Number(historyEntryValues.setCount) || 0} past set{Number(historyEntryValues.setCount) === 1 ? '' : 's'}</button></div>
              </div>}
            </section>
            {supportsBenchAngle(selected) && <section className="angle-history"><div className="panel__header"><div><p className="eyebrow">What each setup shows</p><h3>Progress by bench angle</h3></div><Target size={18} /></div><p>Each recorded angle keeps its own targets and records. Untracked older work stays visible but is never assumed to match a tracked setup.</p>{selectedAngleSummary.length ? <div className="angle-history__grid">{selectedAngleSummary.map((item) => <article key={item.label}><strong>{item.label}</strong><span>{item.sets} set{item.sets === 1 ? '' : 's'} · {item.volume.toLocaleString()} volume</span><small>Last used {new Date(item.latestAt).toLocaleDateString()}</small></article>)}</div> : <div className="compact-empty"><Target size={24} /><strong>No angles recorded yet</strong><p>Open Bench angle during a workout whenever the setup matters.</p></div>}</section>}
            <div className="preference-picker"><span><Target size={18} /><span><strong>Should ForgePath program this movement?</strong><small>Preferred movements rank higher. Avoided movements are excluded from new secondary work, accessories, and substitution suggestions. A current main lift stays protected until you approve a training-block change.</small></span></span><div><button className={selected.favorite ? 'selected preferred' : ''} aria-pressed={selected.favorite} onClick={() => { const preference = selected.favorite ? 'neutral' : 'preferred'; setExercisePreference(selected.id, preference); setSelected({ ...selected, favorite: preference === 'preferred', disliked: false }) }}><ThumbsUp size={17} /> Prefer</button><button className={!selected.favorite && !selected.disliked ? 'selected neutral' : ''} aria-pressed={!selected.favorite && !selected.disliked} onClick={() => { setExercisePreference(selected.id, 'neutral'); setSelected({ ...selected, favorite: false, disliked: false }) }}>Neutral</button><button className={selected.disliked ? 'selected avoid' : ''} aria-pressed={Boolean(selected.disliked)} onClick={() => { const preference = selected.disliked ? 'neutral' : 'avoid'; setExercisePreference(selected.id, preference); setSelected({ ...selected, favorite: false, disliked: preference === 'avoid' }) }}><ThumbsDown size={17} /> Avoid</button></div></div>
            <div className={`exercise-muscle-map ${selectedMuscleCredits ? '' : 'is-unmapped'}`}>
              <span><Target size={18} /><span><strong>{selected.custom ? selected.muscleMapping ? 'Muscles you mapped' : 'No muscles mapped yet' : 'Built-in muscle mapping'}</strong><small>{selected.custom && selected.muscleMapping ? `Reviewed ${new Date(selected.muscleMapping.reviewedAt).toLocaleDateString()} · editable and undoable` : selected.custom ? 'Completed and planned sets receive no muscle credit until you review a mapping.' : 'Built in and fixed. You can edit the mapping on movements you create yourself.'}</small></span></span>
              {selectedMuscleCredits ? <span className="exercise-muscle-map__credits"><b>Direct · {muscleLabel.get(Object.entries(selectedMuscleCredits).find(([, credit]) => credit === 1)?.[0] as MuscleId) ?? 'Unknown'}</b><small>Secondary · {Object.entries(selectedMuscleCredits).filter(([, credit]) => credit === 0.5).map(([muscle]) => muscleLabel.get(muscle as MuscleId)).join(', ') || 'None'}</small></span> : <b>No inferred credit</b>}
            </div>
            {selectedEquipmentFit && <div className={`exercise-equipment-fit ${selectedEquipmentFit.available ? 'is-available' : 'is-unavailable'}`}><Dumbbell size={18} /><span><strong>{selectedEquipmentFit.available ? `Available at ${activeEquipmentProfile.name}` : `Unavailable at ${activeEquipmentProfile.name}`}</strong><small>{selectedEquipmentFit.available ? `All required items are present: ${selectedEquipmentFit.required.join(', ')}.` : `Missing: ${selectedEquipmentFit.missing.join(', ')}. Other history and analytics remain available.`}</small></span></div>}
            <div className="catalog-control"><span><Pencil size={17} /><span><strong>{selected.custom ? 'Edit movement identity' : 'Manage search aliases'}</strong><small>{selected.custom ? 'Name, family, equipment, and body-part metadata can change without changing this movement’s history ID.' : 'The built-in taxonomy stays protected, but you can add the names you personally use.'}</small></span></span><button className="button button--secondary" onClick={() => openCatalogEdit(selected)}>Edit catalog</button></div>
            <div className="joint-picker"><span><Heart size={17} /><strong>How this feels on your joints</strong></span><div>{(['great', 'good', 'neutral', 'irritating', 'avoid'] as const).map((feeling) => <button key={feeling} className={selected.jointFeeling === feeling ? 'selected' : ''} onClick={() => { setJointFeeling(selected.id, feeling); setSelected({ ...selected, jointFeeling: feeling }) }}>{feeling}</button>)}</div></div>
            <section className="movement-note-history"><div className="panel__header"><div><p className="eyebrow">Week-to-week recall</p><h3>Movement notebook</h3></div><BookOpen size={18} /></div>
              {selectedMovementNotes.length ? <div className="movement-note-history__list">{selectedMovementNotes.slice(0, 16).map((note) => <article key={note.id}><div><strong>{new Date(note.sessionDate).toLocaleDateString()}</strong><small>{note.microcycleNumber ? `Training round ${note.microcycleNumber}` : 'Outside a numbered training round'} · {note.sessionTitle}</small>{note.originalExerciseName && <small>Originally written for {note.originalExerciseName}</small>}</div><p>{note.body}</p></article>)}</div> : <div className="compact-empty"><BookOpen size={24} /><strong>No movement notes yet</strong><p>Workout notes about setup, tempo, cues, joint feel, and discoveries will stay attached to this exact movement here.</p></div>}
            </section>
            <section><div className="panel__header"><div><p className="eyebrow">Exact movement only</p><h3>When you trained it</h3></div><History size={18} /></div>
              <div className="history-table history-table--editable">{Object.entries(groupedDates).slice(0, 8).map(([date, sets]) => <div className="history-day" key={date}><span><Clock3 size={14} />{new Date(`${date}T12:00:00`).toLocaleDateString()} · {volumeLoad(sets).toLocaleString()} volume</span>{sets.map((workSet) => <div className="history-set-row" key={workSet.id}><span><strong>{workSet.load} × {workSet.reps}</strong><small>Set {workSet.setIndex + 1} · {benchAngleLabel(workSet.benchAngleDeg)} · {workSet.rirKnown === false ? 'RIR unknown' : workSet.historyEntryEffortScale === 'rpe' ? `RPE ${workSet.historyEntryEffortValue}` : `${workSet.rir} RIR`} · {workSet.qualityConfirmed ? `technique ${workSet.technique} · pain ${workSet.pain}` : 'quality not confirmed'}</small>{workSet.historyEntrySource === 'library' && <small>Athlete-entered history · {workSet.historyEntrySessionName}{workSet.historyEntryNote ? ` · ${workSet.historyEntryNote}` : ''}</small>}{workSet.originalExerciseName && <small>Originally logged as {workSet.originalExerciseName}{workSet.importSourceName ? ` · ${workSet.importSourceName} row ${workSet.importRow}` : ''}</small>}</span><span><button aria-label={`Correct ${workSet.load} by ${workSet.reps} set`} onClick={() => openCorrection(workSet)}><Pencil size={15} /> Correct</button><button className="danger-link" aria-label={`Delete ${workSet.load} by ${workSet.reps} set`} onClick={() => { setSelected(null); setDeleteOpen(workSet); setDeleteReason(''); setFormError(null) }}><Trash2 size={15} /> Delete</button></span></div>)}</div>)}</div>
            </section>
            <div className="builder-callout"><Target size={21} /><div><strong>Builder relationship</strong><p>{selected.roleTags.includes('secondary builder') ? 'This movement is currently linked to one of your main lifts. Whether it carries over is a starting guess until your own results back it up.' : 'No protected builder relationship has been assigned yet.'}</p></div></div>
          </div>
        )}
      </Modal>

      <section className="panel mutation-ledger">
        <div className="panel__header"><div><p className="eyebrow">Auditable data</p><h3>History and movement changes</h3></div>{historyMutations.some((event) => !event.undoneAt) && <button className="button button--secondary" onClick={() => { const result = undoLatestHistoryMutation(); if (!result.ok) setNotice(result.error ?? 'Nothing to undo.') }}><Undo2 size={16} /> Undo latest change</button>}</div>
        {historyMutations.length ? <div className="mutation-list">{[...historyMutations].reverse().slice(0, 6).map((event) => <div key={event.id} className={event.undoneAt ? 'is-undone' : ''}><span className="record-medal">{event.type === 'history-imported' ? 'I' : event.type === 'history-entered' ? '+' : event.type === 'exercise-merged' ? '↗' : event.type === 'exercise-edited' ? 'A' : event.type === 'set-deleted' ? '−' : '±'}</span><span><strong>{event.description}</strong><small>{event.reason} · {new Date(event.createdAt).toLocaleString()}{event.undoneAt ? ' · undone' : ''}</small></span><span>{event.volumeAfter - event.volumeBefore >= 0 ? '+' : ''}{(event.volumeAfter - event.volumeBefore).toLocaleString()} volume</span></div>)}</div> : <div className="compact-empty"><ShieldCheck size={24} /><strong>No data changes yet</strong><p>Past-performance entries, imports, catalog edits, corrections, deletions, and merges will appear here with their reasons and consequences.</p></div>}
      </section>

      <section className="panel substitution-ledger">
        <div className="panel__header"><div><p className="eyebrow">What you preferred before</p><h3>Swaps you have made</h3></div><RefreshCcw size={19} /></div>
        {substitutionEvents.length ? <div className="substitution-event-list">{[...substitutionEvents].reverse().slice(0, 8).map((event) => {
          const original = exercises.find((exercise) => exercise.id === event.originalExerciseId)
          const selectedExercise = exercises.find((exercise) => exercise.id === event.selectedExerciseId)
          return <article key={event.id}>
            <span className={`substitution-outcome substitution-outcome--${event.outcome}`}>{event.outcome.replace('-', ' ')}</span>
            <div><strong>{original?.name ?? 'Unknown movement'} <ChevronRight size={14} /> {selectedExercise?.name ?? 'Unknown movement'}</strong><small>{event.role} · reason: {event.reason === 'none' ? 'not provided' : event.reason.replace('-', ' ')} · {new Date(event.createdAt).toLocaleString()}</small><p>{event.prescriptionNote}</p><small>{event.sourceSetIds.length} completed set{event.sourceSetIds.length === 1 ? '' : 's'} · {event.prescriptionMethod.replace('-', ' ')}{event.postFeedback && !event.postFeedback.skipped ? ` · stimulus ${event.postFeedback.targetStimulus ?? 'unknown'} · pain ${event.postFeedback.pain ?? 'unknown'} · enjoyment ${event.postFeedback.enjoyment ?? 'unknown'}` : ' · feedback unknown'}</small></div>
          </article>
        })}</div> : <div className="compact-empty"><RefreshCcw size={25} /><strong>No substitutions yet</strong><p>Movement changes will appear here with the reason, the alternatives we ranked, the recalculated targets, the sets you completed, and any feedback you gave.</p></div>}
      </section>

      <Modal open={importOpen} onClose={() => setImportOpen(false)} title="Import completed history" description="Preview every row and match the names in your file to one movement before anything changes." wide>
        <div className="import-intro"><FileCheck2 size={23} /><span><strong>Source-safe CSV import</strong><p>Required columns: date, exercise, load, reps. Optional: RIR and session. Dates must use YYYY-MM-DD or an ISO date and time. Imported numbers remain unverified until quality is explicitly confirmed later.</p></span></div>
        <div className="import-controls">
          <label><span className="field-label">Source load unit</span><select aria-label="Source load unit" value={importUnits} onChange={(event) => { setImportUnits(event.target.value as ImportUnit); setImportPreview(null); setImportMappings({}); setImportError(null) }}><option value="lb">Pounds</option><option value="kg">Kilograms</option></select></label>
          <label className="button button--primary import-file-button"><Upload size={17} /> {importPreview ? 'Choose another CSV' : 'Choose CSV'}<input aria-label="Training history CSV" type="file" accept=".csv,text/csv" onChange={readImportFile} /></label>
          <button className="button button--ghost" onClick={downloadImportTemplate}><Download size={17} /> Template</button>
        </div>
        {importError && <div className="import-error" role="alert"><AlertTriangle size={17} /><span><strong>Import not ready</strong>{importError}</span></div>}
        {importPreview && <>
          <div className="import-summary">
            <div><small>Source rows</small><strong>{importPreview.rows.length}</strong></div>
            <div><small>Movement names</small><strong>{importPreview.mappings.length}</strong></div>
            <div><small>Date range</small><strong>{importPreview.earliestDate ? `${new Date(importPreview.earliestDate).toLocaleDateString()} to ${new Date(importPreview.latestDate!).toLocaleDateString()}` : 'None'}</strong></div>
            <div><small>Already imported</small><strong>{importPreview.duplicateFingerprints.length}</strong></div>
          </div>
          {importPreview.convertedLoads > 0 && <p className="catalog-trust-note"><ShieldCheck size={16} /> {importPreview.convertedLoads} load value{importPreview.convertedLoads === 1 ? '' : 's'} will convert from {importPreview.sourceUnits} to your {importPreview.appUnits} setting and round to one decimal place.</p>}
          {importPreview.errors.length > 0 && <div className="import-row-errors"><strong>{importPreview.errors.length} row issue{importPreview.errors.length === 1 ? '' : 's'}</strong>{importPreview.errors.slice(0, 8).map((error) => <p key={error}>{error}</p>)}{importPreview.errors.length > 8 && <p>And {importPreview.errors.length - 8} more.</p>}</div>}
          <section className="import-mapping-section"><div className="panel__header"><div><p className="eyebrow">Match these movements</p><h3>Map each source movement</h3></div><ShieldCheck size={19} /></div>
            <div className="import-mapping-list">{importPreview.mappings.map((mapping) => {
              const suggestion = activeExercises.find((exercise) => exercise.id === mapping.suggestedExerciseId)
              return <label key={mapping.sourceExerciseName} className={`import-mapping import-mapping--${mapping.status}`}><span><strong>{mapping.sourceExerciseName}</strong><small>{mapping.rowCount} set{mapping.rowCount === 1 ? '' : 's'} · {mapping.status === 'exact' ? 'exact name or nickname match' : mapping.status === 'review' ? `${Math.round((mapping.suggestedScore ?? 0) * 100)}% possible match${suggestion ? ` to ${suggestion.name}` : ''}` : 'no clear match'}</small></span><select aria-label={`Map ${mapping.sourceExerciseName}`} value={importMappings[mapping.sourceExerciseName] ?? ''} onChange={(event) => setImportMappings({ ...importMappings, [mapping.sourceExerciseName]: event.target.value })}><option value="">Choose the movement to keep</option>{[...activeExercises].sort((a, b) => a.name.localeCompare(b.name)).map((exercise) => <option key={exercise.id} value={exercise.id}>{exercise.name}</option>)}</select></label>
            })}</div>
          </section>
          <div className="import-boundary"><AlertTriangle size={18} /><span><strong>Nothing is inferred silently.</strong><p>Uncertain names require your choice. Re-imported row fingerprints are skipped. Imported sets keep their original name, source file, row number, date, and unit, but they do not count as stored-plan completion.</p></span></div>
        </>}
        <div className="modal__actions"><button className="button button--ghost" onClick={() => setImportOpen(false)}>Cancel</button><button className="button button--primary" disabled={!importPreview || importPreview.errors.length > 0 || importPreview.mappings.some((mapping) => !importMappings[mapping.sourceExerciseName])} onClick={commitImport}><FileCheck2 size={17} /> Import validated sets</button></div>
      </Modal>

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add a distinct movement" description="ForgePath checks names, aliases, and exercise families before creating another history.">
        <label className="field-label" htmlFor="custom-name">Movement name</label><input id="custom-name" value={customName} onChange={(event) => setCustomName(event.target.value)} placeholder="Example: Incline Bench Press" />
        {duplicates.length > 0 && <div className="duplicate-warning"><AlertTriangle size={18} /><div><strong>Possible existing movement{duplicates.length > 1 ? 's' : ''}</strong>{duplicates.slice(0, 3).map(({ exercise, score }) => <button key={exercise.id} onClick={() => { setAddOpen(false); setSelected(exercise) }}><span>{exercise.name}</span><small>{Math.round(score * 100)}% match · use existing history</small></button>)}</div></div>}
        {exactCreationDuplicate && <label><span className="field-label">Why is this a distinct movement?</span><textarea aria-label="Distinct movement reason" rows={3} value={customDistinction} onChange={(event) => setCustomDistinction(event.target.value)} placeholder="Example: Fixed 30-degree bench with a different grip and setup" /><small className="field-help">An exact name match can create a separate history only when you record the meaningful setup difference.</small></label>}
        <div className="form-grid"><label><span className="field-label">Movement type</span><select value={customPattern} onChange={(event) => setCustomPattern(event.target.value as MovementPattern)}>{['squat', 'hinge', 'horizontal-push', 'vertical-push', 'horizontal-pull', 'vertical-pull', 'isolation', 'carry'].map((item) => <option key={item} value={item}>{item}</option>)}</select></label><label><span className="field-label">Primary body part</span><select value={customRegion} onChange={(event) => setCustomRegion(event.target.value as BodyRegion)}>{regionFilters.filter((item) => item.id !== 'all').map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label></div>
        <label><span className="field-label">Required equipment, separated by commas</span><input aria-label="Custom movement equipment" value={customEquipment} onChange={(event) => setCustomEquipment(event.target.value)} placeholder="Example: dumbbells, adjustable bench" /><small className="field-help">Use the same terms as your location profile so availability remains explicit.</small></label>
        <label className="toggle-row muscle-map-toggle"><span><strong>Set the muscles worked</strong><small>Optional. Your explicit choices apply to completed and planned sets. No selection is inferred from the body-part field.</small></span><input aria-label="Set the muscles this works" type="checkbox" checked={customMappingEnabled} onChange={(event) => { setCustomMappingEnabled(event.target.checked); if (!event.target.checked) { setCustomDirectMuscle(''); setCustomSecondaryMuscles([]) } }} /></label>
        {customMappingEnabled && <div className="muscle-map-editor"><label><span className="field-label">Direct muscle · 1.0 credit</span><select aria-label="Custom direct muscle" value={customDirectMuscle} onChange={(event) => { const direct = event.target.value as MuscleId; setCustomDirectMuscle(direct); setCustomSecondaryMuscles((current) => current.filter((muscle) => muscle !== direct)) }}><option value="">Choose one direct muscle</option>{muscleDefinitions.map((muscle) => <option key={muscle.id} value={muscle.id}>{muscle.label}</option>)}</select></label><fieldset><legend>Secondary muscles · 0.5 credit each · {customSecondaryMuscles.length}/8</legend><div className="muscle-map-options">{muscleDefinitions.filter((muscle) => muscle.id !== customDirectMuscle).map((muscle) => <label key={muscle.id}><input aria-label={`Custom secondary ${muscle.label}`} type="checkbox" checked={customSecondaryMuscles.includes(muscle.id)} disabled={!customSecondaryMuscles.includes(muscle.id) && customSecondaryMuscles.length >= 8} onChange={(event) => setCustomSecondaryMuscles((current) => event.target.checked ? [...current, muscle.id] : current.filter((item) => item !== muscle.id))} /><span>{muscle.label}</span></label>)}</div></fieldset></div>}
        {formError && <p className="form-error" role="alert">{formError}</p>}
        <div className="modal__actions"><button className="button button--ghost" onClick={() => setAddOpen(false)}>Cancel</button><button className="button button--primary" disabled={!customName.trim() || !customEquipment.split(',').some((item) => item.trim()) || (exactCreationDuplicate && customDistinction.trim().length < 10) || (customMappingEnabled && !customDirectMuscle)} onClick={createCustom}><ShieldCheck size={17} /> {exactCreationDuplicate ? 'Create documented variation' : 'Create separate history'}</button></div>
      </Modal>

      <Modal open={qualityOpen} onClose={() => setQualityOpen(false)} title="Exercise data quality" description="Connected duplicate suggestions are grouped so several accidental copies can be reviewed in one decision. Nothing changes until you confirm." wide>
        {duplicateGroups.length ? <div className="quality-list">{duplicateGroups.map((group) => <div key={group.exercises.map((exercise) => exercise.id).join(':')}><span><GitMerge size={18} /><span><strong>{group.exercises.length} connected identities</strong><small>{group.exercises.map((exercise) => exercise.name).join(' · ')}</small></span></span><span><b>{Math.round(group.maxScore * 100)}% highest match</b><small>{group.pairs.length} evidence link{group.pairs.length === 1 ? '' : 's'}</small></span><button className="button button--secondary" onClick={() => openMerge(group.exercises)}>Review group</button></div>)}</div> : <div className="compact-empty"><ShieldCheck size={28} /><strong>No probable duplicates found</strong><p>Every active movement is already its own distinct lift.</p></div>}
        <div className="modal__actions"><button className="button button--ghost" onClick={() => setQualityOpen(false)}>Close</button></div>
      </Modal>

      <Modal open={Boolean(catalogEdit)} onClose={() => setCatalogEdit(null)} title={catalogEdit?.custom ? 'Edit custom movement' : 'Manage movement aliases'} description="The movement keeps its identity. Completed-set names remain historical truth, and this change can be undone from the catalog ledger." wide>
        {catalogEdit && <>
          {catalogEdit.custom ? <div className="form-grid catalog-edit-grid">
            <label><span className="field-label">Movement name</span><input aria-label="Catalog movement name" value={catalogValues.name} onChange={(event) => setCatalogValues({ ...catalogValues, name: event.target.value })} /></label>
            <label><span className="field-label">Exercise family</span><input aria-label="Catalog exercise family" value={catalogValues.family} onChange={(event) => setCatalogValues({ ...catalogValues, family: event.target.value })} /></label>
            <label><span className="field-label">Movement type</span><select aria-label="Catalog movement type" value={catalogValues.pattern} onChange={(event) => setCatalogValues({ ...catalogValues, pattern: event.target.value as MovementPattern })}>{['squat', 'hinge', 'horizontal-push', 'vertical-push', 'horizontal-pull', 'vertical-pull', 'isolation', 'carry'].map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
            <label><span className="field-label">Primary body part</span><select aria-label="Catalog primary body part" value={catalogValues.primaryRegion} onChange={(event) => setCatalogValues({ ...catalogValues, primaryRegion: event.target.value as BodyRegion })}>{regionFilters.filter((item) => item.id !== 'all').map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
            <label className="catalog-edit-grid__wide"><span className="field-label">Equipment, separated by commas</span><input aria-label="Catalog equipment" value={catalogValues.equipment} onChange={(event) => setCatalogValues({ ...catalogValues, equipment: event.target.value })} /></label>
            <label className="catalog-edit-grid__wide"><span className="field-label">Setup or distinction note</span><textarea aria-label="Catalog movement description" rows={3} value={catalogValues.description} onChange={(event) => setCatalogValues({ ...catalogValues, description: event.target.value })} /></label>
          </div> : <div className="protected-taxonomy"><ShieldCheck size={20} /><span><strong>{catalogEdit.name} stays canonical</strong><p>Its name, family, movement type, body part, equipment, and history ID are protected. Add only the alternate names you use when searching or importing.</p></span></div>}
          {catalogEdit.custom && <><label className="toggle-row muscle-map-toggle"><span><strong>Use an athlete-reviewed muscle mapping</strong><small>Turn this off to keep the movement visibly unmapped. Existing volume and exercise history remain unchanged.</small></span><input aria-label="Use athlete-reviewed muscle mapping" type="checkbox" checked={catalogValues.muscleMappingEnabled} onChange={(event) => setCatalogValues({ ...catalogValues, muscleMappingEnabled: event.target.checked, directMuscle: event.target.checked ? catalogValues.directMuscle : '', secondaryMuscles: event.target.checked ? catalogValues.secondaryMuscles : [] })} /></label>{catalogValues.muscleMappingEnabled && <div className="muscle-map-editor"><label><span className="field-label">Direct muscle · 1.0 credit</span><select aria-label="Catalog direct muscle" value={catalogValues.directMuscle} onChange={(event) => { const directMuscle = event.target.value as MuscleId; setCatalogValues({ ...catalogValues, directMuscle, secondaryMuscles: catalogValues.secondaryMuscles.filter((muscle) => muscle !== directMuscle) }) }}><option value="">Choose one direct muscle</option>{muscleDefinitions.map((muscle) => <option key={muscle.id} value={muscle.id}>{muscle.label}</option>)}</select></label><fieldset><legend>Secondary muscles · 0.5 credit each · {catalogValues.secondaryMuscles.length}/8</legend><div className="muscle-map-options">{muscleDefinitions.filter((muscle) => muscle.id !== catalogValues.directMuscle).map((muscle) => <label key={muscle.id}><input aria-label={`Catalog secondary ${muscle.label}`} type="checkbox" checked={catalogValues.secondaryMuscles.includes(muscle.id)} disabled={!catalogValues.secondaryMuscles.includes(muscle.id) && catalogValues.secondaryMuscles.length >= 8} onChange={(event) => setCatalogValues({ ...catalogValues, secondaryMuscles: event.target.checked ? [...catalogValues.secondaryMuscles, muscle.id] : catalogValues.secondaryMuscles.filter((item) => item !== muscle.id) })} /><span>{muscle.label}</span></label>)}</div></fieldset></div>}</>}
          <label><span className="field-label">Search aliases, separated by commas</span><input aria-label="Catalog aliases" value={catalogValues.aliases} onChange={(event) => setCatalogValues({ ...catalogValues, aliases: event.target.value })} placeholder="Example: Low incline, 30 degree bench" /></label>
          {catalogCandidates.length > 0 && <div className="duplicate-warning"><AlertTriangle size={18} /><div><strong>Check these related movements before saving</strong>{catalogCandidates.map(({ exercise, score }) => <button key={exercise.id} onClick={() => { setCatalogEdit(null); setSelected(exercise) }}><span>{exercise.name}</span><small>{Math.round(score * 100)}% match · review existing history</small></button>)}</div></div>}
          <label><span className="field-label">Reason for catalog change</span><input aria-label="Catalog edit reason" value={catalogValues.reason} onChange={(event) => setCatalogValues({ ...catalogValues, reason: event.target.value })} placeholder="Example: Added the name I use in my notebook" /></label>
          <p className="catalog-trust-note"><ShieldCheck size={16} /> Exact name or alias collisions are blocked. Related variations remain visible in Data quality for your review.</p>
          {formError && <p className="form-error" role="alert">{formError}</p>}
          <div className="modal__actions"><button className="button button--ghost" onClick={() => setCatalogEdit(null)}>Cancel</button><button className="button button--primary" onClick={submitCatalogEdit}><ShieldCheck size={17} /> Save without splitting history</button></div>
        </>}
      </Modal>

      <Modal open={Boolean(editingSet)} onClose={() => setEditingSet(null)} title="Correct completed set" description="The original value stays in your change history. All volume, records, and charts replay after you save.">
        {editingSet && <><div className="form-grid correction-grid">{(['load', 'reps', 'rir', 'technique', 'pain'] as const).map((field) => <label key={field}><span className="field-label">{field === 'rir' ? 'RIR' : field[0].toUpperCase() + field.slice(1)}</span><input type="number" min="0" step={field === 'load' ? '0.5' : '1'} value={editValues[field]} onChange={(event) => setEditValues({ ...editValues, [field]: event.target.value })} /></label>)}<label><span className="field-label">Bench angle (optional)</span><input type="number" min="0" max="90" step="1" placeholder="Untracked" value={editValues.benchAngleDeg} onChange={(event) => setEditValues({ ...editValues, benchAngleDeg: event.target.value })} /></label></div><label className="toggle-row"><span><strong>Confirm technique and pain</strong><small>Only confirmed quality can turn this number into a validated PR.</small></span><input type="checkbox" checked={editValues.qualityConfirmed} onChange={(event) => setEditValues({ ...editValues, qualityConfirmed: event.target.checked })} /></label><label><span className="field-label">Completed date and time</span><input type="datetime-local" value={editValues.completedAt} onChange={(event) => setEditValues({ ...editValues, completedAt: event.target.value })} /></label><label><span className="field-label">Reason for correction</span><input value={editValues.reason} onChange={(event) => setEditValues({ ...editValues, reason: event.target.value })} placeholder="Example: Entered plate total incorrectly" /></label>{formError && <p className="form-error" role="alert">{formError}</p>}<div className="correction-preview"><span>Before <strong>{editingSet.load} × {editingSet.reps} · {benchAngleLabel(editingSet.benchAngleDeg)}</strong></span><ChevronRight size={16} /><span>After <strong>{Number(editValues.load) || 0} × {Number(editValues.reps) || 0} · {editValues.benchAngleDeg === '' ? 'Angle untracked' : `${normalizeBenchAngle(Number(editValues.benchAngleDeg))}° bench`}</strong></span><small>{((Number(editValues.load) || 0) * (Number(editValues.reps) || 0) - editingSet.load * editingSet.reps).toLocaleString()} volume change · {editValues.qualityConfirmed ? 'quality confirmed' : 'numeric-only'}</small></div><div className="modal__actions"><button className="button button--ghost" onClick={() => setEditingSet(null)}>Cancel</button><button className="button button--primary" onClick={submitCorrection}><ShieldCheck size={17} /> Save and replay</button></div></>}
      </Modal>

      <Modal open={Boolean(deleteOpen)} onClose={() => setDeleteOpen(null)} title="Remove completed set" description="This changes training history. The set will remain recoverable through Undo latest change.">
        {deleteOpen && <><div className="destructive-summary"><AlertTriangle size={21} /><span><strong>{deleteOpen.exerciseName}</strong><p>{deleteOpen.load} × {deleteOpen.reps} on {new Date(deleteOpen.completedAt).toLocaleString()}</p><small>This removes {(deleteOpen.load * deleteOpen.reps).toLocaleString()} volume before replaying records.</small></span></div><label><span className="field-label">Reason for removal</span><input value={deleteReason} onChange={(event) => setDeleteReason(event.target.value)} placeholder="Example: Accidental duplicate set" /></label>{formError && <p className="form-error" role="alert">{formError}</p>}<div className="modal__actions"><button className="button button--ghost" onClick={() => setDeleteOpen(null)}>Keep set</button><button className="button button--danger" onClick={submitDelete}><Trash2 size={17} /> Remove and replay</button></div></>}
      </Modal>

      <Modal open={Boolean(mergeGroup)} onClose={() => setMergeGroup(null)} title="Merge duplicate movements" description="Choose one identity to keep. Every other identity in this connected group will retire into it in one audited, undoable event.">
        {mergeGroup && <><div className="merge-choice" role="radiogroup" aria-label="Movement identity to keep">{mergeGroup.map((exercise) => <button key={exercise.id} role="radio" aria-checked={mergeTargetId === exercise.id} className={mergeTargetId === exercise.id ? 'selected' : ''} onClick={() => setMergeTargetId(exercise.id)}><MovementArt exercise={exercise} /><span><strong>Keep {exercise.name}</strong><small>{history.filter((workSet) => workSet.exerciseId === exercise.id).length} completed sets · {exercise.aliases.length} aliases</small></span></button>)}</div><div className="merge-consequence"><GitMerge size={19} /><span><strong>{history.filter((workSet) => mergeGroup.some((exercise) => exercise.id === workSet.exerciseId)).length} completed sets will share one progression history.</strong><p>{mergeGroup.length - 1} duplicate identit{mergeGroup.length - 1 === 1 ? 'y retires' : 'ies retire'} into the selected identity. Future planned references move to it. Completed sessions and prior training-block versions remain historical truth.</p></span></div><label><span className="field-label">Reason for merge</span><input value={mergeReason} onChange={(event) => setMergeReason(event.target.value)} /></label>{formError && <p className="form-error" role="alert">{formError}</p>}<div className="modal__actions"><button className="button button--ghost" onClick={() => setMergeGroup(null)}>Cancel</button><button className="button button--primary" onClick={submitMerge}><GitMerge size={17} /> Merge {mergeGroup.length} identities</button></div></>}
      </Modal>
    </div>
  )
}
