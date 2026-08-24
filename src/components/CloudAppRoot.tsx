import { useEffect, useRef, useState, type ReactNode } from 'react'
import { AlertTriangle, Eye, EyeOff, LoaderCircle, LockKeyhole, Mail, ShieldCheck } from 'lucide-react'
import type { Session, User } from '@supabase/supabase-js'
import App from '../App'
import { backupStateFrom, createBackup } from '../domain/backup'
import { useAppStore } from '../store/useAppStore'
import { cloudAuthoritativeBuild, cloudConfiguration, LEGACY_APP_STORAGE_KEY } from '../services/cloud-config'
import { passwordModeFor, type CloudPasswordMode } from '../services/cloud-auth-policy'
import {
  CLOUD_LAST_SYNC_STORAGE_KEY,
  CLOUD_OUTBOX_STORAGE_KEY,
  CLOUD_VERSION_STORAGE_KEY,
  deleteCloudAccount,
  fetchCloudSnapshot,
  getCloudClient,
  pushCloudSnapshot,
  requestPasswordRecovery,
  requestPrivateSignIn,
  resetCloudData,
  restoreVerifiedCloudSnapshot,
  signInWithPassword,
  signOutCloud,
  updateCloudPassword,
  validateNewPassword
} from '../services/cloud-sync'
import { checkForAppUpdate, reloadWithFreshAppShell } from '../services/app-shell'
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

export function CloudAuth({ passwordMode, onPasswordComplete }: { passwordMode: CloudPasswordMode | null; onPasswordComplete: (user: User) => void }) {
  const [mode, setMode] = useState<'signin' | 'forgot' | 'invite'>('invite')
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

  if (passwordMode) return <AuthFrame
    title={passwordMode === 'setup' ? 'Create your ForgePath password' : 'Choose a new password'}
    detail={passwordMode === 'setup' ? 'Your email is verified. Set the password you will use on future visits.' : 'Your recovery link is verified. Set a new password to return to your training.'}
  >
    <PasswordField value={password} onChange={setPassword} label="New password" autoComplete="new-password" />
    <PasswordField value={confirmation} onChange={setConfirmation} label="Confirm new password" autoComplete="new-password" />
    <p className="cloud-auth__hint">Use 12 or more characters with uppercase, lowercase, a number, and a symbol.</p>
    <button className="button button--primary button--full" disabled={busy || !password || !confirmation} onClick={() => run(async () => {
      const passwordError = validateNewPassword(password)
      if (passwordError) throw new Error(passwordError)
      if (password !== confirmation) throw new Error('The passwords do not match.')
      const user = await updateCloudPassword(password)
      onPasswordComplete(user)
    })}>{busy ? <LoaderCircle className="spin" size={17} /> : <ShieldCheck size={17} />} Save new password</button>
    {error && <AuthError message={error} />}
  </AuthFrame>

  return <AuthFrame title={mode === 'signin' ? 'Sign in with your password' : mode === 'forgot' ? 'Recover your account' : 'Welcome to ForgePath'} detail={mode === 'signin' ? 'For accounts that set a password. Most athletes just use the emailed link.' : mode === 'forgot' ? 'We will send a private recovery link if this email belongs to an account.' : 'Enter the email you were invited with and we will send you a link that signs you straight in. No password needed.'}>
    <label className="cloud-auth__field"><span>Email</span><span><Mail size={17} /><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" /></span></label>
    {mode === 'signin' && <PasswordField value={password} onChange={setPassword} />}
    <button className="button button--primary button--full" disabled={busy || !email.trim() || (mode === 'signin' && !password)} onClick={() => run(async () => {
      if (mode === 'signin') await signInWithPassword(email, password)
      else if (mode === 'forgot') {
        await requestPasswordRecovery(email)
        setMessage('If that email belongs to a ForgePath account, a recovery link is on its way.')
      } else {
        await requestPrivateSignIn(email)
        setMessage('If that email was invited, a sign-in link is on its way. Open it on this device and you are in.')
      }
    })}>{busy ? <LoaderCircle className="spin" size={17} /> : mode === 'signin' ? <LockKeyhole size={17} /> : <Mail size={17} />}{mode === 'signin' ? 'Sign in' : mode === 'forgot' ? 'Send recovery link' : 'Email me a sign-in link'}</button>
    {message && <p className="cloud-auth__message" role="status">{message}</p>}
    {error && <AuthError message={error} />}
    <div className="cloud-auth__links">
      {mode !== 'invite' && <button type="button" onClick={() => { setMode('invite'); setError(null); setMessage(null) }}>Use an emailed link instead</button>}
      {mode === 'invite' && <button type="button" onClick={() => { setMode('signin'); setError(null); setMessage(null) }}>I have a password</button>}
      {mode === 'signin' && <button type="button" onClick={() => { setMode('forgot'); setError(null); setMessage(null) }}>Forgot password?</button>}
    </div>
  </AuthFrame>
}

function AuthFrame({ title, detail, children }: { title: string; detail: string; children: ReactNode }) {
  return <main className="cloud-auth"><section className="cloud-auth__card"><div className="cloud-auth__intro"><h1>{title}</h1><p>{detail}</p></div>{children}</section></main>
}

function AuthError({ message }: { message: string }) {
  return <div className="import-error" role="alert"><AlertTriangle size={17} /><span><strong>Account action stopped</strong>{message}</span></div>
}

export function CloudLoading({ error, retry, refresh, signOut }: { error?: string | null; retry?: () => void; refresh?: () => void; signOut?: () => void }) {
  return <main className="cloud-auth"><section className="cloud-auth__card cloud-auth__loading">{error ? <><AlertTriangle size={28} /><h1>Cloud data did not load</h1><p>{error}</p>{retry && <button className="button button--primary" onClick={retry}>Try again</button>}{refresh && <p className="cloud-auth__hint">If trying again keeps failing, this device is probably still running an older copy of ForgePath. Updating reinstalls the newest app files. Your saved training is not touched.</p>}<div className="cloud-auth__links">{refresh && <button type="button" onClick={refresh}>Update ForgePath</button>}{signOut && <button type="button" onClick={signOut}>Sign out</button>}</div></> : <><LoaderCircle className="spin" size={28} /><h1>Opening your private training journal</h1><p>ForgePath is verifying the newest saved copy before opening the app.</p></>}</section></main>
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
  const lastSaveFailure = useRef<Error | null>(null)
  const passwordMode = passwordModeFor(session, recovery)

  useEffect(() => {
    if (!cloudAuthoritativeBuild) return
    let mounted = true
    let unsubscribe: (() => void) | undefined
    getCloudClient().then(async (client) => {
      if (!client || !mounted) return
      const listener = client.auth.onAuthStateChange((event, nextSession) => {
        if (!mounted) return
        if (event === 'PASSWORD_RECOVERY') setRecovery(true)
        if (event === 'SIGNED_OUT') setRecovery(false)
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
    // A stale cached build is the one failure retrying cannot clear, so look for a newer one first.
    void checkForAppUpdate().catch(() => undefined)
    try {
      await waitForStoreHydration()
      const snapshot = await fetchCloudSnapshot()
      if (snapshot) {
        restoreVerifiedCloudSnapshot(snapshot, (state) => useAppStore.getState().restoreBackup(state))
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
    if (session && !passwordMode) void Promise.resolve().then(bootstrap)
  // retryToken deliberately restarts the verified bootstrap after an explicit retry.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user.id, passwordMode, retryToken])

  const saveNow = async () => {
    if (!session || !ready) return
    lastSaveFailure.current = null
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
        saveTimer.current = null
        saveChain.current = saveChain.current.then(saveNow).catch((cause) => {
          lastSaveFailure.current = cause instanceof Error ? cause : new Error('Your latest change has not reached Supabase yet.')
          setSaveState('error')
          setError(messageFrom(cause, 'Your latest change has not reached Supabase yet.'))
        })
      }, 800)
    })
    return () => { unsubscribe(); if (saveTimer.current) window.clearTimeout(saveTimer.current) }
  // Subscription follows the authenticated runtime, not each save state update.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user.id, ready])

  useEffect(() => {
    if (!session || (saveState !== 'saving' && saveState !== 'error')) return
    const protectUnsavedCloudChange = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', protectUnsavedCloudChange)
    return () => window.removeEventListener('beforeunload', protectUnsavedCloudChange)
  }, [session, saveState])

  const flushPendingSave = async () => {
    if (saveTimer.current) {
      window.clearTimeout(saveTimer.current)
      saveTimer.current = null
      await saveNow()
      return
    }
    await saveChain.current
    if (lastSaveFailure.current) throw lastSaveFailure.current
  }

  const runtime: CloudRuntimeValue | null = session ? {
    session, saveState, lastSavedAt, error,
    retrySave: async () => { await saveNow() },
    signOut: async () => {
      if (saveState === 'saving') await flushPendingSave()
      if (saveState === 'error') throw new Error('Retry the unsaved change before signing out.')
      await signOutCloud()
      setSession(null)
    },
    resetData: async (password) => {
      if (!session.user.email) throw new Error('This account has no verified email.')
      if (password) await signInWithPassword(session.user.email, password)
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
      if (password) await signInWithPassword(session.user.email, password)
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
  if (!session) return <CloudAuth passwordMode={null} onPasswordComplete={() => undefined} />
  if (passwordMode) return <CloudAuth passwordMode={passwordMode} onPasswordComplete={(user) => {
    setSession((current) => current ? { ...current, user } : current)
    setRecovery(false)
  }} />
  if (!ready) return <CloudLoading
    error={error}
    retry={() => setRetryToken((value) => value + 1)}
    refresh={() => { void reloadWithFreshAppShell() }}
    signOut={() => { void signOutCloud().catch(() => undefined).then(() => setSession(null)) }}
  />
  return <CloudRuntimeContext.Provider value={runtime as CloudRuntimeValue}><App /></CloudRuntimeContext.Provider>
}
