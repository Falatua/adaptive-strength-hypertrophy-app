import { useState } from 'react'
import { AlertTriangle, CheckCircle2, Cloud, CloudOff, KeyRound, LoaderCircle, LogOut, RefreshCw, RotateCcw, ShieldCheck, Trash2 } from 'lucide-react'
import { cloudConfiguration } from '../services/cloud-config'
import { updateCloudPassword, validateNewPassword } from '../services/cloud-sync'
import { useCloudRuntime } from './cloud-runtime-context'
import { Modal } from './Modal'

type BusyAction = 'signout' | 'password' | 'reset' | 'delete' | 'retry' | null

function errorMessage(cause: unknown) {
  return cause instanceof Error ? cause.message : 'The account action could not be completed.'
}

export function CloudSyncPanel() {
  const runtime = useCloudRuntime()
  const [busy, setBusy] = useState<BusyAction>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [passwordOpen, setPasswordOpen] = useState(false)
  const [resetOpen, setResetOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [typedConfirmation, setTypedConfirmation] = useState('')

  const run = async (action: BusyAction, request: () => Promise<void>, done?: () => void) => {
    setBusy(action)
    setMessage(null)
    setError(null)
    try {
      await request()
      done?.()
    } catch (cause) {
      setError(errorMessage(cause))
    } finally {
      setBusy(null)
    }
  }

  const clearSensitiveFields = () => {
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setTypedConfirmation('')
  }

  if (!runtime) return <section className="panel cloud-panel cloud-panel--pending" aria-label="Cloud account">
    <div className="panel__header"><div><p className="eyebrow">Private cloud</p><h3>Cloud access is unavailable</h3></div><CloudOff size={19} /></div>
    <div className="cloud-boundary"><ShieldCheck size={23} /><div><strong>This build is not cloud-authoritative</strong><p>{cloudConfiguration.status === 'ready' ? 'The local test override is active.' : cloudConfiguration.reason}</p></div></div>
  </section>

  const savedLabel = runtime.saveState === 'saved' ? 'Saved to Supabase' : runtime.saveState === 'saving' ? 'Saving to Supabase' : 'Cloud save needs attention'

  return <>
    <section className="panel cloud-panel" aria-label="Cloud account">
      <div className="panel__header"><div><p className="eyebrow">Private cloud</p><h3>Your account and data</h3></div><Cloud size={19} /></div>
      <div className="cloud-account"><CheckCircle2 size={22} /><span><small>Signed in securely</small><strong>{runtime.session.user.email ?? 'ForgePath athlete'}</strong></span><button className="text-button" disabled={Boolean(busy) || runtime.saveState === 'saving'} onClick={() => run('signout', runtime.signOut)}><LogOut size={14} /> Sign out</button></div>
      <div className={`cloud-save-state cloud-save-state--${runtime.saveState}`}><span>{runtime.saveState === 'saving' ? <LoaderCircle className="spin" size={19} /> : runtime.saveState === 'error' ? <AlertTriangle size={19} /> : <ShieldCheck size={19} />}</span><div><strong>{savedLabel}</strong><small>{runtime.lastSavedAt ? `Last confirmed ${new Date(runtime.lastSavedAt).toLocaleString()}` : 'Waiting for the first confirmed save'}</small></div>{runtime.saveState === 'error' && <button type="button" disabled={busy === 'retry'} onClick={() => run('retry', runtime.retrySave)}><RefreshCw size={15} /> Retry</button>}</div>
      <p className="chart-note">Training history, plans, surveys, notes, and settings are stored in your private Supabase account. This browser keeps only the signed-in session and device metadata.</p>
      <div className="data-actions">
        <button className="full-row-button" onClick={() => { clearSensitiveFields(); setPasswordOpen(true) }}><KeyRound size={17} /> Change password</button>
        <button className="full-row-button" onClick={() => { clearSensitiveFields(); setResetOpen(true) }}><RotateCcw size={17} /> Reset training data</button>
        <button className="full-row-button full-row-button--danger" onClick={() => { clearSensitiveFields(); setDeleteOpen(true) }}><Trash2 size={17} /> Delete account and data</button>
      </div>
      {(error || runtime.error) && <div className="import-error" role="alert"><AlertTriangle size={17} /><span><strong>Cloud action stopped</strong>{error ?? runtime.error}</span></div>}
      {message && <div className="cloud-message" role="status"><CheckCircle2 size={17} /><span>{message}</span></div>}
    </section>

    <Modal open={passwordOpen} onClose={() => setPasswordOpen(false)} title="Change your password" description="Confirm your current password, then choose a new password that is unique to ForgePath.">
      <div className="cloud-sensitive-form">
        <label><span className="field-label">Current password</span><input type="password" autoComplete="current-password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} /></label>
        <label><span className="field-label">New password</span><input type="password" autoComplete="new-password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} /></label>
        <label><span className="field-label">Confirm new password</span><input type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} /></label>
        <p className="modal-note">Use at least 12 characters with uppercase, lowercase, a number, and a symbol.</p>
      </div>
      <div className="modal__actions"><button className="button button--ghost" onClick={() => setPasswordOpen(false)}>Cancel</button><button className="button button--primary" disabled={busy === 'password' || !currentPassword || !newPassword || !confirmPassword} onClick={() => run('password', async () => {
        const passwordError = validateNewPassword(newPassword)
        if (passwordError) throw new Error(passwordError)
        if (newPassword !== confirmPassword) throw new Error('The new passwords do not match.')
        await updateCloudPassword(newPassword, currentPassword)
        setMessage('Your password was changed.')
      }, () => { clearSensitiveFields(); setPasswordOpen(false) })}>{busy === 'password' ? <LoaderCircle className="spin" size={16} /> : <KeyRound size={16} />} Change password</button></div>
    </Modal>

    <Modal open={resetOpen} onClose={() => setResetOpen(false)} title="Reset all training data" description="This permanently deletes your cloud training history, plans, surveys, notes, settings, and recovery state, then starts onboarding again. Your login remains active. Export first if you want a recoverable copy.">
      <div className="cloud-sensitive-form"><label><span className="field-label">Current password</span><input type="password" autoComplete="current-password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} /></label><label><span className="field-label">Type RESET to confirm</span><input value={typedConfirmation} onChange={(event) => setTypedConfirmation(event.target.value)} autoComplete="off" /></label></div>
      <div className="modal__actions"><button className="button button--ghost" onClick={() => setResetOpen(false)}>Keep my data</button><button className="button button--danger" disabled={busy === 'reset' || !currentPassword || typedConfirmation !== 'RESET'} onClick={() => run('reset', () => runtime.resetData(currentPassword), () => { clearSensitiveFields(); setResetOpen(false); setMessage('Your cloud training data was reset. Onboarding is ready for a fresh start.') })}>{busy === 'reset' ? <LoaderCircle className="spin" size={16} /> : <RotateCcw size={16} />} Reset training data</button></div>
    </Modal>

    <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Delete your ForgePath account" description="This permanently deletes the login and every ForgePath data row linked to it. This cannot be undone. Export first if you want to keep a personal copy.">
      <div className="warning-box"><AlertTriangle size={18} /> You will be signed out immediately and will need a new invitation to return.</div>
      <div className="cloud-sensitive-form"><label><span className="field-label">Current password</span><input type="password" autoComplete="current-password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} /></label><label><span className="field-label">Type DELETE to confirm</span><input value={typedConfirmation} onChange={(event) => setTypedConfirmation(event.target.value)} autoComplete="off" /></label></div>
      <div className="modal__actions"><button className="button button--ghost" onClick={() => setDeleteOpen(false)}>Keep my account</button><button className="button button--danger" disabled={busy === 'delete' || !currentPassword || typedConfirmation !== 'DELETE'} onClick={() => run('delete', () => runtime.deleteAccount(currentPassword))}>{busy === 'delete' ? <LoaderCircle className="spin" size={16} /> : <Trash2 size={16} />} Permanently delete account</button></div>
    </Modal>
  </>
}
