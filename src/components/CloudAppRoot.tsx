import { useEffect, useRef, useState, type ReactNode } from 'react'
import { AlertTriangle, Cloud, Eye, EyeOff, LoaderCircle, LockKeyhole, Mail, ShieldCheck } from 'lucide-react'
import type { Session } from '@supabase/supabase-js'
import App from '../App'
import { backupStateFrom, createBackup } from '../domain/backup'
import { useAppStore } from '../store/useAppStore'
import { cloudAuthoritativeBuild, cloudConfiguration, LEGACY_APP_STORAGE_KEY } from '../services/cloud-config'
import {
  CLOUD_LAST_SYNC_STORAGE_KEY,
  CLOUD_OUTBOX_STORAGE_KEY,
  CLOUD_VERSION_STORAGE_KEY,
  acceptCloudSnapshot,
  deleteCloudAccount,
  fetchCloudSnapshot,
  getCloudClient,
  pushCloudSnapshot,
  requestPasswordRecovery,
  requestPrivateSignIn,
  resetCloudData,
  signInWithPassword,
  signOutCloud,
  updateCloudPassword,
  validateNewPassword
} from '../services/cloud-sync'
import { CloudRuntimeContext, type CloudRuntimeValue, type SaveState } from './cloud-runtime-context'

function messageFrom(cause: unknown, fallback: string) {
  return cause instanceof Error && cause.message ? cause.message : fallback
}

function waitForStoreHydration() {
  if (useAppStore.persist.hasHydrated()) return Promise.resolve()
  return new Promise<void>((resolve) => {
    const unsubscribe = useAppStore.persist.onFinishHydration(() => {
      unsubscribe()
      resolve()
    })
  })
}

function clearLegacyTrainingStorage() {
  window.localStorage.removeItem(LEGACY_APP_STORAGE_KEY)
  window.localStorage.removeItem(CLOUD_OUTBOX_STORAGE_KEY)
}

function clearCloudVersionStorage() {
  window.localStorage.removeItem(CLOUD_VERSION_STORAGE_KEY)
  window.localStorage.removeItem(CLOUD_LAST_SYNC_STORAGE_KEY)
  window.localStorage.removeItem(CLOUD_OUTBOX_STORAGE_KEY)
}

function PasswordField({ value, onChange, label = 'Password', autoComplete = 'current-password' }: { value: string; onChange: (value: string) => void; label?: string; autoComplete?: string }) {
  const [visible, setVisible] = useState(false)
  return <label className="cloud-auth__field"><span>{label}</span><span><LockKeyhole size={17} /><input type={visible ? 'text' : 'password'} value={value} onChange={(event) => onChange(event.target.value)} autoComplete={autoComplete} /><button type="button" aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`} onClick={() => setVisible((current) => !current)}>{visible ? <EyeOff size={17} /> : <Eye size={17} />}</button></span></label>
}

function CloudAuth({ recovery, onRecoveryComplete }: { recovery: boolean; onRecoveryComplete: () => void }) {
  const [mode, setMode] = useState<'signin' | 'forgot' | 'invite'>(recovery ? 'signin' : 'signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const run = async (action: () => Promise<void>) => {
    setBusy(true)
    setError(null)
    setMessage(null)
    try { await action() } catch (cause) { setError(messageFrom(cause, 'ForgePath could not complete that account request.')) } finally { setBusy(false) }
  }

  if (recovery) return <AuthFrame title="Choose a new password" detail="Your recovery link is verified. Set a new password to return to your training.">
    <PasswordField value={password} onChange={setPassword} label="New password" autoComplete="new-password" />
    <PasswordField value={confirmation} onChange={setConfirmation} label="Confirm new password" autoComplete="new-password" />
    <p className="cloud-auth__hint">Use 12 or more characters with uppercase, lowercase, a number, and a symbol.</p>
    <button className="button button--primary button--full" disabled={busy || !password || !confirmation} onClick={() => run(async () => {
      const passwordError = validateNewPassword(password)
      if (passwordError) throw new Error(passwordError)
      if (password !== confirmation) throw new Error('The passwords do not match.')
      await updateCloudPassword(password)
      onRecoveryComplete()
    })}>{busy ? <LoaderCircle className="spin" size={17} /> : <ShieldCheck size={17} />} Save new password</button>
    {error && <AuthError message={error} />}
  </AuthFrame>

  return <AuthFrame title={mode === 'signin' ? 'Welcome back' : mode === 'forgot' ? 'Recover your account' : 'Finish your invitation'} detail={mode === 'signin' ? 'Sign in to load your private ForgePath training data from Supabase.' : mode === 'forgot' ? 'We will send a private recovery link if this email belongs to an account.' : 'Use the exact email that was invited. This cannot create a public account.'}>
    <label className="cloud-auth__field"><span>Email</span><span><Mail size={17} /><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" /></span></label>
    {mode === 'signin' && <PasswordField value={password} onChange={setPassword} />}
    <button className="button button--primary button--full" disabled={busy || !email.trim() || (mode === 'signin' && !password)} onClick={() => run(async () => {
      if (mode === 'signin') await signInWithPassword(email, password)
      else if (mode === 'forgot') {
        await requestPasswordRecovery(email)
        setMessage('If that email belongs to a ForgePath account, a recovery link is on its way.')
      } else {
        await requestPrivateSignIn(email)
        setMessage('If that email was invited, a secure setup link is on its way.')
      }
    })}>{busy ? <LoaderCircle className="spin" size={17} /> : mode === 'signin' ? <LockKeyhole size={17} /> : <Mail size={17} />}{mode === 'signin' ? 'Sign in' : 'Send secure link'}</button>
    {message && <p className="cloud-auth__message" role="status">{message}</p>}
    {error && <AuthError message={error} />}
    <div className="cloud-auth__links">
      {mode !== 'signin' && <button type="button" onClick={() => { setMode('signin'); setError(null); setMessage(null) }}>Back to sign in</button>}
      {mode === 'signin' && <><button type="button" onClick={() => setMode('forgot')}>Forgot password?</button><button type="button" onClick={() => setMode('invite')}>I have an invitation</button></>}
    </div>
  </AuthFrame>
}

function AuthFrame({ title, detail, children }: { title: string; detail: string; children: ReactNode }) {
  return <main className="cloud-auth"><section className="cloud-auth__card"><div className="cloud-auth__brand"><span><Cloud size={22} /></span><div><small>ForgePath private cloud</small><strong>Your training follows you</strong></div></div><div className="cloud-auth__intro"><h1>{title}</h1><p>{detail}</p></div>{children}<p className="cloud-auth__privacy"><ShieldCheck size={16} /> Training data is isolated to your account by Row Level Security.</p></section></main>
}

function AuthError({ message }: { message: string }) {
  return <div className="import-error" role="alert"><AlertTriangle size={17} /><span><strong>Account action stopped</strong>{message}</span></div>
}

function CloudLoading({ error, retry }: { error?: string | null; retry?: () => void }) {
  return <main className="cloud-auth"><section className="cloud-auth__card cloud-auth__loading">{error ? <><AlertTriangle size={28} /><h1>Cloud data did not load</h1><p>{error}</p>{retry && <button className="button button--primary" onClick={retry}>Try again</button>}</> : <><LoaderCircle className="spin" size={28} /><h1>Loading your private training data</h1><p>ForgePath is verifying the latest Supabase copy before opening the app.</p></>}</section></main>
}

export function CloudAppRoot() {
  const [session, setSession] = useState<Session | null>(null)
  const [checking, setChecking] = useState(cloudAuthoritativeBuild)
  const [recovery, setRecovery] = useState(false)
  const [ready, setReady] = useState(!cloudAuthoritativeBuild)
  const [saveState, setSaveState] = useState<SaveState>(cloudAuthoritativeBuild ? 'loading' : 'saved')
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(cloudConfiguration.status === 'invalid' ? cloudConfiguration.reason : null)
  const [retryToken, setRetryToken] = useState(0)
  const saveTimer = useRef<number | null>(null)
  const saveChain = useRef(Promise.resolve())
  const lastBackupChecksum = useRef<string | null>(null)

  useEffect(() => {
    if (!cloudAuthoritativeBuild) return
    let mounted = true
    let unsubscribe: (() => void) | undefined
    getCloudClient().then(async (client) => {
      if (!client || !mounted) return
      const listener = client.auth.onAuthStateChange((event, nextSession) => {
        if (!mounted) return
        if (event === 'PASSWORD_RECOVERY') setRecovery(true)
        setSession(nextSession)
        if (!nextSession) { setReady(false); setSaveState('loading') }
      })
      unsubscribe = () => listener.data.subscription.unsubscribe()
      const { data, error: sessionError } = await client.auth.getSession()
      if (!mounted) return
      if (sessionError) setError(sessionError.message)
      setSession(data.session)
      setChecking(false)
    }).catch((cause) => { if (mounted) { setError(messageFrom(cause, 'The private cloud session could not be checked.')); setChecking(false) } })
    return () => { mounted = false; unsubscribe?.() }
  }, [])

  const bootstrap = async () => {
    if (!session) return
    setReady(false)
    setSaveState('loading')
    setError(null)
    try {
      await waitForStoreHydration()
      const snapshot = await fetchCloudSnapshot()
      if (snapshot) {
        acceptCloudSnapshot(snapshot.serverVersion)
        useAppStore.getState().restoreBackup(snapshot.backup.data)
        lastBackupChecksum.current = snapshot.backup.integrity.value
        setLastSavedAt(snapshot.updatedAt)
      } else {
        const currentState = backupStateFrom(useAppStore.getState())
        const result = await pushCloudSnapshot(currentState)
        if (result.status === 'conflict') throw new Error('A newer cloud version appeared during setup. Reload before making changes.')
        lastBackupChecksum.current = createBackup(currentState).integrity.value
        setLastSavedAt(new Date().toISOString())
      }
      clearLegacyTrainingStorage()
      setSaveState('saved')
      setReady(true)
    } catch (cause) {
      setSaveState('error')
      setError(messageFrom(cause, 'ForgePath could not load your cloud training data.'))
    }
  }

  useEffect(() => {
    if (session && !recovery) void Promise.resolve().then(bootstrap)
  // retryToken deliberately restarts the verified bootstrap after an explicit retry.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user.id, recovery, retryToken])

  const saveNow = async () => {
    if (!session || !ready) return
    setSaveState('saving')
    setError(null)
    const currentState = backupStateFrom(useAppStore.getState())
    const currentChecksum = createBackup(currentState).integrity.value
    if (currentChecksum === lastBackupChecksum.current) {
      setSaveState('saved')
      return
    }
    const result = await pushCloudSnapshot(currentState)
    if (result.status === 'conflict') throw new Error('This account changed on another device. Reload to use the newest cloud copy before making more changes.')
    clearLegacyTrainingStorage()
    lastBackupChecksum.current = currentChecksum
    const savedAt = new Date().toISOString()
    setLastSavedAt(savedAt)
    setSaveState('saved')
  }

  useEffect(() => {
    if (!session || !ready) return
    const unsubscribe = useAppStore.subscribe(() => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current)
      setSaveState('saving')
      saveTimer.current = window.setTimeout(() => {
        saveChain.current = saveChain.current.then(saveNow).catch((cause) => {
          setSaveState('error')
          setError(messageFrom(cause, 'Your latest change has not reached Supabase yet.'))
        })
      }, 800)
    })
    return () => { unsubscribe(); if (saveTimer.current) window.clearTimeout(saveTimer.current) }
  // Subscription follows the authenticated runtime, not each save state update.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user.id, ready])

  const runtime: CloudRuntimeValue | null = session ? {
    session, saveState, lastSavedAt, error,
    retrySave: async () => { await saveNow() },
    signOut: async () => {
      if (saveState === 'saving') await saveChain.current
      if (saveState === 'error') throw new Error('Retry the unsaved change before signing out.')
      await signOutCloud()
      setSession(null)
    },
    resetData: async (password) => {
      if (!session.user.email) throw new Error('This account has no verified email.')
      await signInWithPassword(session.user.email, password)
      await resetCloudData()
      clearCloudVersionStorage()
      useAppStore.getState().resetForTesting()
      const result = await pushCloudSnapshot(backupStateFrom(useAppStore.getState()))
      if (result.status === 'conflict') throw new Error('The clean cloud state could not be established. Reload and try again.')
      clearLegacyTrainingStorage()
      lastBackupChecksum.current = createBackup(backupStateFrom(useAppStore.getState())).integrity.value
      setLastSavedAt(new Date().toISOString())
      setSaveState('saved')
    },
    deleteAccount: async (password) => {
      if (!session.user.email) throw new Error('This account has no verified email.')
      await signInWithPassword(session.user.email, password)
      await deleteCloudAccount()
      const client = await getCloudClient()
      await client?.auth.signOut({ scope: 'local' })
      clearLegacyTrainingStorage()
      clearCloudVersionStorage()
      setSession(null)
    }
  } : null

  if (!cloudAuthoritativeBuild) return <App />
  if (checking) return <CloudLoading />
  if (!session) return <CloudAuth recovery={false} onRecoveryComplete={() => setRecovery(false)} />
  if (recovery || session.user.user_metadata?.forgepath_password_ready !== true) return <CloudAuth recovery onRecoveryComplete={() => setRecovery(false)} />
  if (!ready) return <CloudLoading error={error} retry={() => setRetryToken((value) => value + 1)} />
  return <CloudRuntimeContext.Provider value={runtime as CloudRuntimeValue}><App /></CloudRuntimeContext.Provider>
}
