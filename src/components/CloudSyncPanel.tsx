import { useEffect, useState } from 'react'
import { AlertTriangle, CheckCircle2, Cloud, CloudOff, DownloadCloud, LoaderCircle, LogOut, Mail, RefreshCw, ShieldCheck, UploadCloud } from 'lucide-react'
import type { Session } from '@supabase/supabase-js'
import { backupStateFrom } from '../domain/backup'
import { useAppStore } from '../store/useAppStore'
import { acceptCloudSnapshot, cloudConfiguration, fetchCloudSnapshot, getCloudClient, localCloudMetadata, pushCloudSnapshot, requestPrivateSignIn, signOutCloud, type CloudSnapshot } from '../services/cloud-sync'

type BusyAction = 'auth' | 'push' | 'pull' | 'restore' | null

export function CloudSyncPanel() {
  const restoreBackup = useAppStore((state) => state.restoreBackup)
  const setNotice = useAppStore((state) => state.setNotice)
  const [session, setSession] = useState<Session | null>(null)
  const [checkingSession, setCheckingSession] = useState(cloudConfiguration.status === 'ready')
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState<BusyAction>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [cloudCopy, setCloudCopy] = useState<CloudSnapshot | null>(null)
  const [metadata, setMetadata] = useState(localCloudMetadata)

  useEffect(() => {
    let mounted = true
    let unsubscribe: (() => void) | null = null
    getCloudClient().then((client) => {
      if (!client || !mounted) return
      client.auth.getSession().then(({ data, error: sessionError }) => {
        if (!mounted) return
        if (sessionError) setError(sessionError.message)
        setSession(data.session)
        setCheckingSession(false)
      })
      const { data: listener } = client.auth.onAuthStateChange((_event, nextSession) => {
        if (mounted) {
          setSession(nextSession)
          setCheckingSession(false)
          if (!nextSession) setCloudCopy(null)
        }
      })
      unsubscribe = () => listener.subscription.unsubscribe()
    }).catch((cause: unknown) => {
      if (!mounted) return
      setError(cause instanceof Error ? cause.message : 'The private cloud session could not be checked.')
      setCheckingSession(false)
    })
    return () => {
      mounted = false
      unsubscribe?.()
    }
  }, [])

  const fail = (cause: unknown) => {
    setError(cause instanceof Error ? cause.message : 'The cloud request could not be completed.')
    setMessage(null)
    setBusy(null)
    setMetadata(localCloudMetadata())
  }

  const sendLink = async () => {
    setBusy('auth')
    setError(null)
    try {
      await requestPrivateSignIn(email)
      setMessage('Check your email for the private sign-in link. This screen can stay open.')
      setBusy(null)
    } catch (cause) {
      fail(cause)
    }
  }

  const push = async () => {
    setBusy('push')
    setError(null)
    setMessage(null)
    try {
      const result = await pushCloudSnapshot(backupStateFrom(useAppStore.getState()))
      if (result.status === 'conflict') {
        setError('A newer cloud copy exists. Review it before choosing what should become current; ForgePath did not overwrite either copy.')
      } else {
        setMessage(`Cloud copy saved as version ${result.serverVersion}.`)
      }
      setMetadata(localCloudMetadata())
      setBusy(null)
    } catch (cause) {
      fail(cause)
    }
  }

  const pull = async () => {
    setBusy('pull')
    setError(null)
    setMessage(null)
    try {
      const snapshot = await fetchCloudSnapshot()
      setCloudCopy(snapshot)
      setMessage(snapshot ? `Cloud version ${snapshot.serverVersion} passed the ForgePath backup integrity check.` : 'No cloud copy exists yet. Your local training data is unchanged.')
      setMetadata(localCloudMetadata())
      setBusy(null)
    } catch (cause) {
      fail(cause)
    }
  }

  const restore = () => {
    if (!cloudCopy) return
    setBusy('restore')
    acceptCloudSnapshot(cloudCopy.serverVersion)
    restoreBackup(cloudCopy.backup.data)
    setMetadata(localCloudMetadata())
    setCloudCopy(null)
    setMessage(null)
    setBusy(null)
    setNotice(`Cloud version ${cloudCopy.serverVersion} restored after integrity validation. Your prior local state is available as an undo point.`)
  }

  const signOut = async () => {
    setBusy('auth')
    setError(null)
    try {
      await signOutCloud()
      setSession(null)
      setCloudCopy(null)
      setMessage('Signed out. Local workout data remains on this device.')
      setBusy(null)
    } catch (cause) {
      fail(cause)
    }
  }

  if (cloudConfiguration.status !== 'ready') {
    return <section className="panel cloud-panel cloud-panel--pending" aria-label="Cloud sync setup">
      <div className="panel__header"><div><p className="eyebrow">Private cloud</p><h3>Release gate closed</h3></div><CloudOff size={19} /></div>
      <div className="cloud-boundary"><ShieldCheck size={23} /><div><strong>Local training stays available</strong><p>{cloudConfiguration.reason} No JB-OS or Roman TD data will be reused.</p></div></div>
      <p className="chart-note">This build contains no cloud endpoint or publishable key. Service-role keys and database passwords never belong in the app.</p>
    </section>
  }

  if (checkingSession) {
    return <section className="panel cloud-panel" aria-label="Cloud sync"><div className="cloud-wait"><LoaderCircle className="spin" size={22} /><span><strong>Checking private session</strong><small>Local logging remains available.</small></span></div></section>
  }

  return <section className="panel cloud-panel" aria-label="Cloud sync">
    <div className="panel__header"><div><p className="eyebrow">Private cloud</p><h3>{session ? 'Manual cross-device checkpoint' : 'Connect your invited account'}</h3></div><Cloud size={19} /></div>
    {!session ? <>
      <p className="callout-copy">Only an email already invited to this private alpha can sign in. Asking for a link never creates a public account.</p>
      <label className="cloud-email"><span className="field-label">Invited email</span><span><Mail size={16} /><input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" /></span></label>
      <button className="button button--primary button--full" disabled={busy === 'auth' || !email.trim()} onClick={sendLink}>{busy === 'auth' ? <LoaderCircle className="spin" size={16} /> : <Mail size={16} />} Email private sign-in link</button>
    </> : <>
      <div className="cloud-account"><CheckCircle2 size={22} /><span><small>Signed in privately</small><strong>{session.user.email ?? 'ForgePath athlete'}</strong></span><button className="text-button" disabled={Boolean(busy)} onClick={signOut}><LogOut size={14} /> Sign out</button></div>
      <div className="cloud-status-grid">
        <div><small>This device knows</small><strong>Cloud v{metadata.serverVersion || 'none'}</strong></div>
        <div><small>Last confirmed</small><strong>{metadata.lastSyncedAt ? new Date(metadata.lastSyncedAt).toLocaleString() : 'Not yet synced'}</strong></div>
        <div><small>Outbox</small><strong>{metadata.hasPendingUpload ? 'Upload waiting' : 'Clear'}</strong></div>
      </div>
      <div className="cloud-actions">
        <button className="full-row-button" disabled={Boolean(busy)} onClick={push}>{busy === 'push' ? <LoaderCircle className="spin" size={17} /> : <UploadCloud size={17} />} Save this device to cloud</button>
        <button className="full-row-button" disabled={Boolean(busy)} onClick={pull}>{busy === 'pull' ? <LoaderCircle className="spin" size={17} /> : <DownloadCloud size={17} />} Check cloud copy</button>
      </div>
      {cloudCopy && <div className="cloud-review"><RefreshCw size={18} /><div><strong>Cloud version {cloudCopy.serverVersion}</strong><small>{cloudCopy.backup.data.history.length} completed sets · {cloudCopy.backup.data.sessions.length} sessions · saved {new Date(cloudCopy.updatedAt).toLocaleString()}</small><p>Restoring creates an automatic local undo point. Nothing changes until you choose restore.</p><button className="button button--small button--secondary" disabled={Boolean(busy)} onClick={restore}>Restore this cloud copy</button></div></div>}
    </>}
    {message && <div className="cloud-message" role="status"><CheckCircle2 size={17} /><span>{message}</span></div>}
    {error && <div className="import-error" role="alert"><AlertTriangle size={17} /><span><strong>Cloud action stopped</strong>{error}</span></div>}
    <p className="chart-note">This first slice uses explicit save and reviewed restore. Automatic merging and active-workout handoff stay off until their conflict and recovery gates are complete.</p>
  </section>
}
