import { useState } from 'react'
import { Bell, BrainCircuit, Database, Download, Dumbbell, Eye, HardDrive, MapPin, Moon, RotateCcw, ShieldCheck, Sparkles, UserRound } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import type { SurveyMode } from '../domain/types'
import { Modal } from '../components/Modal'
import { PixelAvatar } from '../components/PixelAvatar'

export function YouScreen() {
  const { athlete, settings, updateSettings, history, exercises, sessions, records, resetDemo, setNotice } = useAppStore()
  const [resetOpen, setResetOpen] = useState(false)

  const exportData = () => {
    const payload = { exportedAt: new Date().toISOString(), version: 1, athlete, settings, history, exercises, sessions, records }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `forgepath-export-${new Date().toISOString().slice(0, 10)}.json`
    anchor.click()
    URL.revokeObjectURL(url)
    setNotice('Private training export created as open JSON.')
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

          <section className="panel">
            <div className="panel__header"><div><p className="eyebrow">Question burden</p><h3>Survey preferences</h3></div><BrainCircuit size={19} /></div>
            <label className="setting-row"><span><strong>Pre-session check-in</strong><small>Sleep, readiness, pain, and available time.</small></span><select value={settings.preSurveyMode} onChange={(event) => updateSettings({ preSurveyMode: event.target.value as SurveyMode })}>{surveyModes.map((mode) => <option key={mode} value={mode}>{mode}</option>)}</select></label>
            <label className="setting-row"><span><strong>Post-session feedback</strong><small>Difficulty, stimulus, joints, fatigue, and fit.</small></span><select value={settings.postSurveyMode} onChange={(event) => updateSettings({ postSurveyMode: event.target.value as SurveyMode })}>{surveyModes.map((mode) => <option key={mode} value={mode}>{mode}</option>)}</select></label>
            <p className="chart-note">Every question and whole survey remains skippable. Missing means unknown and never lowers adherence or readiness.</p>
          </section>

          <section className="panel">
            <div className="panel__header"><div><p className="eyebrow">Visual and workout focus</p><h3>Experience controls</h3></div><Eye size={19} /></div>
            <label className="toggle-row"><span><strong>Focused training mode</strong><small>Reduce pixel-world decoration during active sets.</small></span><input type="checkbox" checked={settings.focusedMode} onChange={(event) => updateSettings({ focusedMode: event.target.checked })} /></label>
            <label className="toggle-row"><span><strong>Reduced motion</strong><small>Keep characters and charts visually still.</small></span><input type="checkbox" checked={settings.reducedMotion} onChange={(event) => updateSettings({ reducedMotion: event.target.checked })} /></label>
            <label className="toggle-row"><span><strong>Sounds</strong><small>Optional milestone and timer audio.</small></span><input type="checkbox" checked={settings.sounds} onChange={(event) => updateSettings({ sounds: event.target.checked })} /></label>
            <label className="toggle-row"><span><strong>Haptics</strong><small>Subtle set-completion feedback on supported devices.</small></span><input type="checkbox" checked={settings.haptics} onChange={(event) => updateSettings({ haptics: event.target.checked })} /></label>
          </section>
        </div>

        <aside className="settings-aside">
          <section className="panel"><div className="panel__header"><div><p className="eyebrow">Local data</p><h3>Private by default</h3></div><ShieldCheck size={19} /></div><div className="privacy-status"><HardDrive size={28} /><strong>Stored on this device</strong><p>Workout execution and deterministic rules do not need Supabase or a language-model API.</p></div><button className="full-row-button" onClick={exportData}><Download size={17} /> Export open JSON</button></section>
          <section className="panel"><div className="panel__header"><div><p className="eyebrow">System versions</p><h3>Diagnostics</h3></div><Database size={19} /></div><ul className="diagnostic-list"><li><span>App</span><strong>0.1.0 private alpha</strong></li><li><span>Rules</span><strong>0.1 load-first</strong></li><li><span>Calculations</span><strong>Volume v1</strong></li><li><span>Persistence</span><strong>Local v1</strong></li><li><span>Cloud sync</span><strong>Not connected</strong></li><li><span>AI provider</span><strong>Not required</strong></li></ul></section>
          <section className="panel"><div className="panel__header"><div><p className="eyebrow">Notifications</p><h3>Quiet by default</h3></div><Bell size={19} /></div><p className="callout-copy">PRs and reminders never interrupt an active set, punish a missed day, or push unsafe work.</p></section>
          <button className="button button--danger button--full" onClick={() => setResetOpen(true)}><RotateCcw size={17} /> Reset private alpha</button>
        </aside>
      </div>
      <footer className="screen-footer"><Moon size={16} /> ForgePath Private Alpha · Built from the Obsidian Build Bible · Local state only</footer>

      <Modal open={resetOpen} onClose={() => setResetOpen(false)} title="Reset local app data" description="This replaces current local changes with the private-alpha demonstration profile. Export first if you want a recoverable copy.">
        <div className="modal__actions"><button className="button button--ghost" onClick={() => setResetOpen(false)}>Keep my data</button><button className="button button--danger" onClick={() => { resetDemo(); setResetOpen(false) }}>Reset local data</button></div>
      </Modal>
    </div>
  )
}
