import { useMemo, useRef, useState, type ChangeEvent } from 'react'
import { AlertTriangle, Bell, BrainCircuit, Database, Download, Dumbbell, Eye, FileCheck2, HardDrive, MapPin, Moon, Pencil, Plus, RotateCcw, ShieldCheck, Sparkles, Undo2, Upload, UserRound, Wrench } from 'lucide-react'
import { nanoid } from 'nanoid'
import { useAppStore } from '../store/useAppStore'
import type { CelebrationLevel, EquipmentProfile, EquipmentProfileKind, SurveyMode } from '../domain/types'
import { Modal } from '../components/Modal'
import { PixelAvatar } from '../components/PixelAvatar'
import { createBackup, parseBackup, type BackupPreview } from '../domain/backup'

const surveyModeLabels: Record<SurveyMode, string> = { full: 'Full', quick: 'Quick', minimal: 'Minimal', off: 'Off', ask: 'Ask each time' }

export function YouScreen() {
  const {
    athlete, settings, updateSettings, equipmentProfiles, setActiveEquipmentProfile, saveEquipmentProfile, history, exercises, sessions, surveys, deferredFeedback, records, mesocycles, historyMutations, cycleReviews, substitutionEvents,
    activeMesocycleId, activeSessionId, onboardingComplete, recoverySnapshot, restoreBackup, undoLastRestore,
    resetDemo, setNotice
  } = useAppStore()
  const [resetOpen, setResetOpen] = useState(false)
  const [importPreview, setImportPreview] = useState<BackupPreview | null>(null)
  const [importError, setImportError] = useState<string | null>(null)
  const [equipmentOpen, setEquipmentOpen] = useState(false)
  const [equipmentError, setEquipmentError] = useState<string | null>(null)
  const [equipmentValues, setEquipmentValues] = useState({ id: '', name: '', kind: 'custom' as EquipmentProfileKind, equipment: '', constraints: '', barbell: '5', dumbbell: '5', cable: '5', machine: '10', other: '5' })
  const fileInput = useRef<HTMLInputElement>(null)
  const activeEquipmentProfile = equipmentProfiles.find((profile) => profile.id === settings.activeEquipmentProfileId) ?? equipmentProfiles[0]
  const knownEquipment = useMemo(() => [...new Set(exercises.flatMap((exercise) => exercise.equipment))].sort(), [exercises])

  const exportData = () => {
    const payload = createBackup({ athlete, settings, equipmentProfiles, history, exercises, sessions, surveys, deferredFeedback, records, mesocycles, historyMutations, cycleReviews, substitutionEvents, activeMesocycleId, activeSessionId, onboardingComplete })
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `forgepath-backup-v11-${new Date().toISOString().slice(0, 10)}.json`
    anchor.click()
    URL.revokeObjectURL(url)
    setNotice('Verified version 11 backup created as open JSON, including equipment profiles, executable load increments, records, plans, history changes, substitutions, surveys, and recovery provenance.')
  }

  const openEquipmentEditor = (profile?: EquipmentProfile) => {
    setEquipmentError(null)
    setEquipmentValues(profile ? {
      id: profile.id, name: profile.name, kind: profile.kind, equipment: profile.equipment.join(', '), constraints: profile.constraints.join('\n'),
      barbell: String(profile.increments.barbell), dumbbell: String(profile.increments.dumbbell), cable: String(profile.increments.cable), machine: String(profile.increments.machine), other: String(profile.increments.other)
    } : { id: '', name: '', kind: 'custom', equipment: '', constraints: '', barbell: '5', dumbbell: '5', cable: '5', machine: '10', other: '5' })
    setEquipmentOpen(true)
  }

  const submitEquipmentProfile = () => {
    const result = saveEquipmentProfile({
      id: equipmentValues.id || `equipment-${nanoid(8)}`, name: equipmentValues.name, kind: equipmentValues.kind,
      equipment: equipmentValues.equipment.split(','), constraints: equipmentValues.constraints.split('\n'),
      increments: { barbell: Number(equipmentValues.barbell), dumbbell: Number(equipmentValues.dumbbell), cable: Number(equipmentValues.cable), machine: Number(equipmentValues.machine), other: Number(equipmentValues.other) },
      incrementUnit: settings.units, source: 'athlete', updatedAt: new Date().toISOString()
    })
    if (!result.ok) return setEquipmentError(result.error ?? 'That equipment profile could not be saved.')
    setEquipmentOpen(false)
  }

  const readImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setImportError(null)
    if (file.size > 25 * 1024 * 1024) {
      setImportError('That backup is larger than the 25 MB private-alpha restore limit.')
      return
    }
    try {
      setImportPreview(parseBackup(await file.text()))
    } catch (error) {
      setImportError(error instanceof Error ? error.message : 'The backup could not be read.')
    }
  }

  const surveyModes: SurveyMode[] = ['full', 'quick', 'minimal', 'off', 'ask']

  return (
    <div className="screen">
      <header className="screen-header"><div><p className="eyebrow">Athlete model and control</p><h1>The app learns. You stay in charge.</h1><p>Correct assumptions, adjust question burden, and export every meaningful part of your private history.</p></div></header>
      <section className="profile-hero">
        <PixelAvatar size="large" mood="ready" />
        <div className="profile-hero__copy"><span className="status-chip status-chip--lime">{athlete.entryRoute}</span><h2>{athlete.name}'s current path</h2><p>{athlete.goal}</p><div><span><Dumbbell size={15} /> {athlete.trainingAge} years training</span><span><MapPin size={15} /> {settings.equipmentLocation}</span><span><Sparkles size={15} /> {athlete.continuity} continuity</span></div></div>
      </section>

      <div className="settings-layout">
        <div className="settings-main">
          <section className="panel">
            <div className="panel__header"><div><p className="eyebrow">Multi-dimensional placement</p><h3>Current training profile</h3></div><UserRound size={19} /></div>
            <div className="level-list">{Object.entries(athlete.level).map(([key, value]) => <div key={key}><span>{key.replace(/([A-Z])/g, ' $1')}</span><div>{Array.from({ length: 5 }, (_, index) => <i key={index} className={index < value ? 'filled' : ''} />)}</div><strong>{value}/5</strong></div>)}</div>
            <p className="chart-note">Experience and current preparedness stay separate. An interrupted schedule does not turn an experienced athlete into a beginner.</p>
          </section>

          <section className="panel equipment-profile-panel">
            <div className="panel__header"><div><p className="eyebrow">Equipment-profile-v1</p><h3>Training locations</h3></div><button className="button button--small button--secondary" onClick={() => openEquipmentEditor()}><Plus size={15} /> Add</button></div>
            <p className="callout-copy">The active location controls movement availability and executable load jumps. A location name alone never implies equipment.</p>
            <div className="equipment-profile-list">{equipmentProfiles.map((profile) => {
              const active = profile.id === activeEquipmentProfile?.id
              return <article key={profile.id} className={active ? 'active' : ''}>
                <button className="equipment-profile-select" onClick={() => setActiveEquipmentProfile(profile.id)} aria-pressed={active}>
                  <span className="equipment-profile-icon"><MapPin size={18} /></span>
                  <span><strong>{profile.name}</strong><small>{profile.kind.replace('-', ' ')} · {profile.equipment.length} items · {profile.incrementUnit}</small></span>
                  <b>{active ? 'Active' : 'Use here'}</b>
                </button>
                <button className="icon-button" onClick={() => openEquipmentEditor(profile)} aria-label={`Edit ${profile.name}`}><Pencil size={16} /></button>
              </article>
            })}</div>
            {activeEquipmentProfile && <div className="equipment-profile-summary"><Wrench size={18} /><span><strong>{activeEquipmentProfile.equipment.join(' · ')}</strong><small>Load jumps: barbell {activeEquipmentProfile.increments.barbell}, dumbbell {activeEquipmentProfile.increments.dumbbell}, cable {activeEquipmentProfile.increments.cable}, machine {activeEquipmentProfile.increments.machine} {activeEquipmentProfile.incrementUnit}</small>{activeEquipmentProfile.constraints.length > 0 && <small>Constraints: {activeEquipmentProfile.constraints.join(' · ')}</small>}</span></div>}
          </section>

          <section className="panel">
            <div className="panel__header"><div><p className="eyebrow">Question burden</p><h3>Survey preferences</h3></div><BrainCircuit size={19} /></div>
            <label className="setting-row"><span><strong>Pre-session check-in</strong><small>Full 10, quick 5, minimal 3, off, or choose each workout.</small></span><select aria-label="Pre-session check-in mode" value={settings.preSurveyMode} onChange={(event) => updateSettings({ preSurveyMode: event.target.value as SurveyMode })}>{surveyModes.map((mode) => <option key={mode} value={mode}>{surveyModeLabels[mode]}</option>)}</select></label>
            <label className="setting-row"><span><strong>Post-session feedback</strong><small>Full 10, quick 5, minimal 3, off, or choose each workout.</small></span><select aria-label="Post-session feedback mode" value={settings.postSurveyMode} onChange={(event) => updateSettings({ postSurveyMode: event.target.value as SurveyMode })}>{surveyModes.map((mode) => <option key={mode} value={mode}>{surveyModeLabels[mode]}</option>)}</select></label>
            <p className="chart-note">Every question and whole survey remains skippable. Missing means unknown and never lowers adherence or readiness.</p>
          </section>

          <section className="panel">
            <div className="panel__header"><div><p className="eyebrow">Visual and workout focus</p><h3>Experience controls</h3></div><Eye size={19} /></div>
            <label className="toggle-row"><span><strong>Focused training mode</strong><small>Reduce pixel-world decoration during active sets.</small></span><input type="checkbox" checked={settings.focusedMode} onChange={(event) => updateSettings({ focusedMode: event.target.checked })} /></label>
            <label className="toggle-row"><span><strong>Reduced motion</strong><small>Keep characters and charts visually still.</small></span><input type="checkbox" checked={settings.reducedMotion} onChange={(event) => updateSettings({ reducedMotion: event.target.checked })} /></label>
          </section>

          <section className="panel">
            <div className="panel__header"><div><p className="eyebrow">Optional game layer</p><h3>Achievement controls</h3></div><Sparkles size={19} /></div>
            <label className="setting-row"><span><strong>Celebration level</strong><small>Off, restrained, standard, or high-energy visual feedback.</small></span><select value={settings.celebrationLevel} onChange={(event) => updateSettings({ celebrationLevel: event.target.value as CelebrationLevel })}>{(['off', 'subtle', 'normal', 'high-energy'] as const).map((level) => <option key={level} value={level}>{level}</option>)}</select></label>
            <label className="toggle-row"><span><strong>Quiet mode</strong><small>Hide live prompts and celebrations without changing training or records.</small></span><input type="checkbox" checked={settings.quietMode} onChange={(event) => updateSettings({ quietMode: event.target.checked })} /></label>
            <label className="toggle-row"><span><strong>Planned opportunities</strong><small>Show only records already available inside the prescribed work.</small></span><input type="checkbox" checked={settings.opportunityPrompts} onChange={(event) => updateSettings({ opportunityPrompts: event.target.checked })} /></label>
            <label className="toggle-row"><span><strong>In-workout achievements</strong><small>Show provisional wins after completed sets, then validate at session save.</small></span><input type="checkbox" checked={settings.sessionAchievements} onChange={(event) => updateSettings({ sessionAchievements: event.target.checked })} /></label>
            <label className="toggle-row"><span><strong>Pixel confetti</strong><small>Use a brief visual flourish only for earned achievements.</small></span><input type="checkbox" checked={settings.confetti} onChange={(event) => updateSettings({ confetti: event.target.checked })} /></label>
            <label className="toggle-row"><span><strong>Sounds</strong><small>Optional milestone and timer audio when an approved sound pack is connected.</small></span><input type="checkbox" checked={settings.sounds} onChange={(event) => updateSettings({ sounds: event.target.checked })} /></label>
            <label className="toggle-row"><span><strong>Haptics</strong><small>Subtle set-completion feedback on supported devices.</small></span><input type="checkbox" checked={settings.haptics} onChange={(event) => updateSettings({ haptics: event.target.checked })} /></label>
            <p className="chart-note">Quiet mode and celebration controls never affect logging, progression, or the underlying record ledger.</p>
          </section>
        </div>

        <aside className="settings-aside">
          <section className="panel">
            <div className="panel__header"><div><p className="eyebrow">Local data</p><h3>Backup and recovery</h3></div><ShieldCheck size={19} /></div>
            <div className="privacy-status"><HardDrive size={28} /><strong>Stored on this device</strong><p>Workout execution and deterministic rules do not need Supabase or a language-model API.</p></div>
            <div className="data-actions">
              <button className="full-row-button" onClick={exportData}><Download size={17} /> Export verified backup</button>
              <button className="full-row-button" onClick={() => fileInput.current?.click()}><Upload size={17} /> Preview and restore</button>
              <input ref={fileInput} className="sr-only" type="file" accept="application/json,.json" onChange={readImport} aria-label="Choose ForgePath backup to restore" />
            </div>
            {importError && <div className="import-error" role="alert"><AlertTriangle size={17} /><span><strong>Restore blocked</strong>{importError}</span></div>}
            {recoverySnapshot && <div className="recovery-callout"><Undo2 size={17} /><span><strong>Automatic restore point available</strong><small>Your pre-restore local state can be recovered until another restore or reset.</small></span><button onClick={undoLastRestore}>Undo last restore</button></div>}
          </section>
          <section className="panel"><div className="panel__header"><div><p className="eyebrow">System versions</p><h3>Diagnostics</h3></div><Database size={19} /></div><ul className="diagnostic-list"><li><span>App</span><strong>0.17.0 private alpha</strong></li><li><span>Rules</span><strong>0.17 equipment availability + executable loads</strong></li><li><span>Calculations</span><strong>Volume v2 · PR v2 · Plan dose v1 · Muscle dose v1 · Equipment v1 · Load increment v1</strong></li><li><span>Backup schema</span><strong>Version 11</strong></li><li><span>Persistence</span><strong>Local v9</strong></li><li><span>Cloud sync</span><strong>Not connected</strong></li><li><span>AI provider</span><strong>Not required</strong></li></ul></section>
          <section className="panel"><div className="panel__header"><div><p className="eyebrow">Notifications</p><h3>Quiet by default</h3></div><Bell size={19} /></div><p className="callout-copy">PRs and reminders never interrupt an active set, punish a missed day, or push unsafe work.</p></section>
          <button className="button button--danger button--full" onClick={() => setResetOpen(true)}><RotateCcw size={17} /> Reset private alpha</button>
        </aside>
      </div>
      <footer className="screen-footer"><Moon size={16} /> ForgePath Private Alpha · Built from the Obsidian Build Bible · Local state only</footer>

      <Modal open={equipmentOpen} onClose={() => setEquipmentOpen(false)} title={equipmentValues.id ? 'Edit training location' : 'Add training location'} description="List only equipment you can actually use here. ForgePath will treat every omitted requirement as unavailable." wide>
        <div className="form-grid equipment-profile-form">
          <label><span className="field-label">Location name</span><input aria-label="Equipment profile name" value={equipmentValues.name} onChange={(event) => setEquipmentValues({ ...equipmentValues, name: event.target.value })} placeholder="Example: Garage Gym" /></label>
          <label><span className="field-label">Location type</span><select aria-label="Equipment profile type" value={equipmentValues.kind} onChange={(event) => setEquipmentValues({ ...equipmentValues, kind: event.target.value as EquipmentProfileKind })}>{(['commercial-gym', 'home-gym', 'travel', 'hotel', 'bodyweight', 'custom'] as const).map((kind) => <option key={kind} value={kind}>{kind.replace('-', ' ')}</option>)}</select></label>
          <label className="catalog-edit-grid__wide"><span className="field-label">Available equipment, separated by commas</span><textarea aria-label="Available equipment" rows={4} value={equipmentValues.equipment} onChange={(event) => setEquipmentValues({ ...equipmentValues, equipment: event.target.value })} placeholder="barbell, plates, rack, bench, dumbbells" /><small className="field-help">Known catalog terms: {knownEquipment.join(', ')}</small></label>
          <label className="catalog-edit-grid__wide"><span className="field-label">Constraints, one per line</span><textarea aria-label="Equipment constraints" rows={3} value={equipmentValues.constraints} onChange={(event) => setEquipmentValues({ ...equipmentValues, constraints: event.target.value })} placeholder="No dropping weights&#10;Dumbbells stop at 75 lb" /></label>
        </div>
        <fieldset className="increment-editor"><legend>Smallest executable load jump · {settings.units}</legend><div>{(['barbell', 'dumbbell', 'cable', 'machine', 'other'] as const).map((kind) => <label key={kind}><span>{kind}</span><input aria-label={`${kind} load increment`} type="number" min="0.1" max="100" step="0.1" value={equipmentValues[kind]} onChange={(event) => setEquipmentValues({ ...equipmentValues, [kind]: event.target.value })} /></label>)}</div></fieldset>
        <p className="catalog-trust-note"><ShieldCheck size={16} /> Equipment matching is exact and conservative. You can always edit this profile, but the app will not silently assume missing machines or attachments.</p>
        {equipmentError && <p className="form-error" role="alert">{equipmentError}</p>}
        <div className="modal__actions"><button className="button button--ghost" onClick={() => setEquipmentOpen(false)}>Cancel</button><button className="button button--primary" onClick={submitEquipmentProfile}><ShieldCheck size={17} /> Save location</button></div>
      </Modal>

      <Modal open={resetOpen} onClose={() => setResetOpen(false)} title="Reset local app data" description="This replaces current local changes with the private-alpha demonstration profile. Export first if you want a recoverable copy.">
        <div className="modal__actions"><button className="button button--ghost" onClick={() => setResetOpen(false)}>Keep my data</button><button className="button button--danger" onClick={() => { resetDemo(); setResetOpen(false) }}>Reset local data</button></div>
      </Modal>

      <Modal open={Boolean(importPreview)} onClose={() => setImportPreview(null)} title="Preview backup before restore" description="The file has passed format, integrity, identity, reference, date, and numeric-data checks. Nothing changes until you confirm.">
        {importPreview && <>
          <div className="backup-identity"><FileCheck2 size={28} /><div><span>Schema {importPreview.backup.schemaVersion} · App {importPreview.backup.appVersion}</span><strong>{importPreview.summary.athleteName}'s training data</strong><small>Exported {new Date(importPreview.summary.exportedAt).toLocaleString()}</small></div></div>
          <div className="backup-summary">
            <div><small>Completed sets</small><strong>{importPreview.summary.completedSets.toLocaleString()}</strong></div>
            <div><small>Exercises</small><strong>{importPreview.summary.exercises}</strong></div>
            <div><small>Training locations</small><strong>{importPreview.summary.equipmentProfiles}</strong></div>
            <div><small>Sessions</small><strong>{importPreview.summary.sessions}</strong></div>
            <div><small>Surveys</small><strong>{importPreview.summary.surveys}</strong></div>
            <div><small>Feedback follow-ups</small><strong>{importPreview.summary.deferredFeedback}</strong></div>
            <div><small>Records</small><strong>{importPreview.summary.records}</strong></div>
            <div><small>Plan versions</small><strong>{importPreview.summary.planVersions}</strong></div>
            <div><small>Cycle reviews</small><strong>{importPreview.summary.cycleReviews}</strong></div>
            <div><small>Substitutions</small><strong>{importPreview.summary.substitutions}</strong></div>
          </div>
          {importPreview.warnings.map((warning) => <div className="warning-box" key={warning}><AlertTriangle size={17} />{warning}</div>)}
          <p className="modal-note">ForgePath will keep one automatic copy of your current local state so this restore can be undone. Exporting the current state first remains the safest long-term backup.</p>
          <div className="modal__actions"><button className="button button--ghost" onClick={() => setImportPreview(null)}>Cancel</button><button className="button button--ghost" onClick={exportData}>Export current first</button><button className="button button--primary" onClick={() => { restoreBackup(importPreview.backup.data); setImportPreview(null) }}>Restore validated backup</button></div>
        </>}
      </Modal>
    </div>
  )
}
