import { downloadLocalBackup } from '../services/local-backup'
import { useState } from 'react'
import { parseBackup, type ForgePathBackup } from '../domain/backup'
import { cloudConfiguration } from '../services/cloud-config'
import { useAppStore } from '../store/useAppStore'
import { localStorageError } from '../services/local-storage'

export function LocalDataPanel() {
  const [preview, setPreview] = useState<ForgePathBackup | null>(null)
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [email, setEmail] = useState('')
  const run = async (action: () => Promise<void> | void) => {
    setBusy(true)
    setMessage('')
    setPreview(null)
    try { await action() } catch (cause) { setMessage(cause instanceof Error ? cause.message : 'Recovery could not finish. Your existing data has been kept.') }
    finally { setBusy(false) }
  }
  const previewText = (text: string) => setPreview(parseBackup(text).backup)
  return <section className="panel local-data-panel" aria-label="Device storage and recovery">
    <h3>Your training stays on this device</h3>
    <p>No account or connection is needed to train. Keep a backup in Files for recovery or transfer to another device. Devices do not sync automatically.</p>
    <button type="button" className="full-row-button" onClick={downloadLocalBackup}>Download device backup</button>
    <details>
      <summary>Recover existing training</summary>
      <p>Preview a backup or your old cloud copy before replacing this device’s training. The previous device state remains available through Undo last restore in You. The cloud original is never changed.</p>
      <label className="full-row-button">Choose backup file<input aria-label="Recover training from backup" type="file" accept=".json,application/json" disabled={busy} onChange={(event) => {
        const file = event.target.files?.[0]
        if (file) void run(async () => previewText(await file.text()))
        event.target.value = ''
      }} /></label>
      <button type="button" className="full-row-button" disabled={busy} onClick={() => void run(() => {
        const raw = window.localStorage.getItem('forgepath-cloud-outbox-v1')
        if (!raw) throw new Error('No interrupted cloud save is stored on this device. Choose a backup file or check the old cloud copy.')
        // Read without the legacy parser's cleanup: even damaged originals are preserved.
        previewText(JSON.stringify(JSON.parse(raw).backup))
      })}>Preview interrupted cloud save</button>
      {cloudConfiguration.status === 'ready' && <>
        <button type="button" className="full-row-button" disabled={busy} onClick={() => void run(async () => {
          const { getCloudClient, parseCloudSnapshotRow } = await import('../services/cloud-sync')
          const client = await getCloudClient()
          if (!client) throw new Error('Legacy recovery is not configured. Use a backup file.')
          const { data: auth, error: authError } = await client.auth.getSession()
          if (authError) throw authError
          if (!auth.session) throw new Error('Sign in below once to read your old cloud copy, or import a backup file.')
          const { data, error } = await client.from('forgepath_state_snapshots').select('payload,version,updated_at,checksum,schema_version,app_version').maybeSingle()
          if (error) throw error
          if (!data) throw new Error('No saved cloud training was found for this account.')
          setPreview(parseCloudSnapshotRow(data).backup)
        })}>Preview old cloud copy</button>
        <label>Email for old account<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" /></label>
        <button type="button" className="full-row-button" disabled={busy || !email.trim()} onClick={() => void run(async () => {
          const { requestPrivateSignIn } = await import('../services/cloud-sync')
          await requestPrivateSignIn(email.trim())
          setMessage('Open the sign-in email in this browser, then choose Preview old cloud copy. For a Home Screen app, download the recovered backup in the browser and import it into the installed app.')
        })}>Email recovery sign-in link</button>
      </>}
      {preview && <div className="recovery-callout">
        <p>Verified backup for {preview.data.athlete.name || 'athlete'}: {preview.data.history.length} completed sets, saved {new Date(preview.exportedAt).toLocaleString()}. Restoring replaces the current device state and keeps a local undo copy.</p>
        <button type="button" disabled={busy} onClick={() => {
          try {
            useAppStore.getState().restoreBackup(preview.data)
            if (localStorageError()) throw new Error(localStorageError()!)
            setPreview(null)
            setMessage('Training recovered and saved on this device. Download a backup to keep a separate copy.')
          } catch (cause) { setMessage(cause instanceof Error ? cause.message : 'Restore failed.') }
        }}>Use this training on this device</button>
        <button type="button" onClick={() => setPreview(null)}>Cancel recovery</button>
      </div>}
      {message && <p role="status">{message}</p>}
    </details>
  </section>
}
