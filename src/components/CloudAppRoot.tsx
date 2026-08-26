import { useEffect, useRef, useState, type ReactNode } from 'react'
import { AlertTriangle, Check, Clipboard, KeyRound, LoaderCircle, Mail, Smartphone } from 'lucide-react'
import type { Session } from '@supabase/supabase-js'
import App from '../App'
import { backupStateFrom, createBackup } from '../domain/backup'
import { useAppStore } from '../store/useAppStore'
import { cloudAuthoritativeBuild, cloudConfiguration, LEGACY_APP_STORAGE_KEY } from '../services/cloud-config'
import {
  CLOUD_LAST_SYNC_STORAGE_KEY,
  CLOUD_OUTBOX_STORAGE_KEY,
  CLOUD_VERSION_STORAGE_KEY,
  deleteCloudAccount,
  createHomeScreenHandoff,
  fetchCloudSnapshot,
  formatHomeScreenHandoffCode,
  getCloudClient,
  isHomeScreenAuthCallback,
  isInstalledHomeScreenApp,
  localCloudMetadata,
  normalizeHomeScreenHandoffCode,
  planCloudBootstrap,
  planCloudMutation,
  pushCloudSnapshot,
  readPendingSnapshot,
  redeemHomeScreenHandoff,
  requestPrivateSignIn,
  resetCloudData,
  restoreVerifiedCloudSnapshot,
  signOutCloud,
  stageCloudSnapshot
} from '../services/cloud-sync'
import { checkForAppUpdate, readAppVersionStatus, reloadWithFreshAppShell } from '../services/app-shell'
import { AppUpdateNotice } from './AppUpdateNotice'
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
}

function clearCloudVersionStorage() {
  window.localStorage.removeItem(CLOUD_VERSION_STORAGE_KEY)
  window.localStorage.removeItem(CLOUD_LAST_SYNC_STORAGE_KEY)
  window.localStorage.removeItem(CLOUD_OUTBOX_STORAGE_KEY)
}

function downloadPendingRecovery() {
  const pending = readPendingSnapshot(window.localStorage)
  if (!pending) throw new Error('There is no pending device recovery copy to download.')
  const blob = new Blob([JSON.stringify(pending.backup, null, 2)], { type: 'application/json' })
  const href = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = href
  anchor.download = `forgepath-pending-recovery-${pending.queuedAt.slice(0, 10)}.json`
  anchor.click()
  URL.revokeObjectURL(href)
}

export function CloudAuth() {
  const homeScreenApp = isInstalledHomeScreenApp()
  const [email, setEmail] = useState('')
  const [handoffCode, setHandoffCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const run = async (action: () => Promise<void>) => {
    setBusy(true)
    setError(null)
    setMessage(null)
    try { await action() } catch (cause) { setError(messageFrom(cause, 'ForgePath could not complete that account request.')) } finally { setBusy(false) }
  }

  return <AuthFrame title="Welcome to ForgePath" detail={homeScreenApp ? "Enter an email invited by the creator. The confirmation opens in Safari, where ForgePath gives you a one-time Home Screen code. Return here and enter it once; this app then keeps you signed in." : "Enter an email invited by the creator. There is no password. Confirm one email link in this same browser profile, then ForgePath keeps you signed in through refreshes and app updates until you choose Sign out or clear this browser's site data."}>
    <label className="cloud-auth__field"><span>Email</span><span><Mail size={17} /><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" /></span></label>
    <button className="button button--primary button--full" disabled={busy || !email.trim()} onClick={() => run(async () => {
      if (homeScreenApp) await requestPrivateSignIn(email, true)
      else await requestPrivateSignIn(email)
      setMessage(homeScreenApp ? 'If that email was invited, open the confirmation link in Safari. Create the one-time Home Screen code there, then return to this app.' : 'If that email was invited, open the private confirmation link in this same browser profile. This is the one-time check for this browser; ForgePath will keep the renewed session here afterward.')
    })}>{busy ? <LoaderCircle className="spin" size={17} /> : <Mail size={17} />} Log in with email</button>
    {homeScreenApp && <div className="cloud-auth__handoff">
      <div className="cloud-auth__divider"><span>Then return here</span></div>
      <label className="cloud-auth__field"><span>One-time Home Screen code</span><span><KeyRound size={17} /><input type="text" value={formatHomeScreenHandoffCode(handoffCode)} onChange={(event) => setHandoffCode(normalizeHomeScreenHandoffCode(event.target.value))} autoCapitalize="characters" autoCorrect="off" spellCheck={false} inputMode="text" /></span></label>
      <button className="button button--secondary button--full" disabled={busy || normalizeHomeScreenHandoffCode(handoffCode).length !== 20} onClick={() => run(async () => {
        await redeemHomeScreenHandoff(handoffCode)
        setMessage('Home Screen sign-in complete. ForgePath is opening your cloud training journal.')
      })}>{busy ? <LoaderCircle className="spin" size={17} /> : <Smartphone size={17} />} Finish Home Screen login</button>
    </div>}
    {message && <p className="cloud-auth__message" role="status">{message}</p>}
    {error && <AuthError message={error} />}
  </AuthFrame>
}

function HomeScreenHandoff() {
  const [code, setCode] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createCode = async () => {
    setBusy(true)
    setError(null)
    setCopied(false)
    try {
      const handoff = await createHomeScreenHandoff()
      setCode(handoff.code)
    } catch (cause) {
      setError(messageFrom(cause, 'ForgePath could not create the Home Screen code.'))
    } finally {
      setBusy(false)
    }
  }

  const copyCode = async () => {
    if (!code) return
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
    } catch {
      setError('Copy was blocked. Press and hold the code, then copy it manually.')
    }
  }

  const continueInBrowser = () => {
    const url = new URL(window.location.href)
    url.searchParams.delete('forgepath_auth')
    url.hash = ''
    window.location.replace(url.toString())
  }

  return <AuthFrame title="Finish on your Home Screen" detail="Your invited email is verified in Safari. Create a private one-time code, then open ForgePath from your Home Screen and enter it there. The code expires in five minutes and stops working after one use.">
    {!code ? <button className="button button--primary button--full" disabled={busy} onClick={() => { void createCode() }}>{busy ? <LoaderCircle className="spin" size={17} /> : <Smartphone size={17} />} Create Home Screen code</button> : <div className="cloud-auth__code">
      <span>Your one-time code</span>
      <strong aria-label={`Home Screen code ${formatHomeScreenHandoffCode(code)}`}>{formatHomeScreenHandoffCode(code)}</strong>
      <button className="button button--primary button--full" onClick={() => { void copyCode() }}>{copied ? <Check size={17} /> : <Clipboard size={17} />} {copied ? 'Copied' : 'Copy code'}</button>
      <p>Now open the ForgePath icon on your Home Screen, paste this code, and press <strong>Finish Home Screen login</strong>. Do not share this code.</p>
    </div>}
    {error && <AuthError message={error} />}
    <div className="cloud-auth__links"><button type="button" onClick={continueInBrowser}>Use ForgePath in Safari instead</button></div>
  </AuthFrame>
}

function AuthFrame({ title, detail, children }: { title: string; detail: string; children: ReactNode }) {
  return <main className="cloud-auth"><section className="cloud-auth__card"><div className="cloud-auth__intro"><h1>{title}</h1><p>{detail}</p></div>{children}</section></main>
}

function AuthError({ message }: { message: string }) {
  return <div className="import-error" role="alert"><AlertTriangle size={17} /><span><strong>Account action stopped</strong>{message}</span></div>
}

export function CloudLoading({ error, retry, refresh, signOut, recover }: { error?: string | null; retry?: () => void; refresh?: () => void; signOut?: () => void; recover?: () => void }) {
  return <main className="cloud-auth"><section className="cloud-auth__card cloud-auth__loading">{error ? <><AlertTriangle size={28} /><h1>Cloud data did not load</h1><p>{error}</p>{recover && <button className="button button--secondary" onClick={recover}>Download pending recovery</button>}{retry && <button className="button button--primary" onClick={retry}>Try again</button>}{refresh && <p className="cloud-auth__hint">If trying again keeps failing, this device is probably still running an older copy of ForgePath. Updating reinstalls the newest app files. Your saved training is not touched.</p>}<div className="cloud-auth__links">{refresh && <button type="button" onClick={refresh}>Update ForgePath</button>}{signOut && <button type="button" onClick={signOut}>Sign out</button>}</div></> : <><LoaderCircle className="spin" size={28} /><h1>Opening your private training journal</h1><p>ForgePath is verifying the newest saved copy before opening the app.</p></>}</section></main>
}

export function CloudAppRoot() {
  const browserHomeScreenHandoff = isHomeScreenAuthCallback() && !isInstalledHomeScreenApp()
  const [session, setSession] = useState<Session | null>(null)
  const [checking, setChecking] = useState(cloudAuthoritativeBuild)
  const [ready, setReady] = useState(!cloudAuthoritativeBuild)
  const [saveState, setSaveState] = useState<SaveState>(cloudAuthoritativeBuild ? 'loading' : 'saved')
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(cloudConfiguration.status === 'invalid' ? cloudConfiguration.reason : null)
  const [retryToken, setRetryToken] = useState(0)
  const saveTimer = useRef<number | null>(null)
  const saveChain = useRef(Promise.resolve())
  const lastBackupChecksum = useRef<string | null>(null)
  const lastSaveFailure = useRef<Error | null>(null)

  useEffect(() => {
    if (!cloudAuthoritativeBuild) return
    let mounted = true
    let unsubscribe: (() => void) | undefined
    getCloudClient().then(async (client) => {
      if (!client || !mounted) return
      const listener = client.auth.onAuthStateChange((_event, nextSession) => {
        if (!mounted) return
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
      const version = await readAppVersionStatus()
      if (version.updateAvailable) {
        throw new Error(`This device is running ForgePath ${version.installed?.slice(0, 8)}, but ${version.available?.slice(0, 8)} is published. Update ForgePath before loading or saving training data.`)
      }
      await waitForStoreHydration()
      const snapshot = await fetchCloudSnapshot()
      const pending = readPendingSnapshot(window.localStorage)
      const bootstrapPlan = planCloudBootstrap(snapshot, pending)
      if (bootstrapPlan === 'cloud' && snapshot) {
        restoreVerifiedCloudSnapshot(snapshot, (state) => useAppStore.getState().restoreBackup(state))
        lastBackupChecksum.current = snapshot.backup.integrity.value
        setLastSavedAt(snapshot.updatedAt)
      } else if (bootstrapPlan === 'pending' && pending) {
        const result = await pushCloudSnapshot(pending.backup.data)
        if (result.status === 'conflict') throw new Error('This device has unsynced training changes and the cloud account changed too. Both copies are preserved. Review them before continuing.')
        useAppStore.getState().restoreBackup(pending.backup.data)
        lastBackupChecksum.current = pending.backup.integrity.value
        setLastSavedAt(new Date().toISOString())
      } else if (bootstrapPlan === 'conflict') {
        throw new Error('This device has unsynced training changes from an older cloud version. Both copies are preserved. Do not clear browser data; use recovery review before continuing.')
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
    if (session && !browserHomeScreenHandoff) void Promise.resolve().then(bootstrap)
  // retryToken deliberately restarts the verified bootstrap after an explicit retry.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user.id, retryToken, browserHomeScreenHandoff])

  const saveNow = async () => {
    if (!session || !ready) return
    lastSaveFailure.current = null
    setSaveState('saving')
    setError(null)
    const currentState = backupStateFrom(useAppStore.getState())
    const currentChecksum = createBackup(currentState).integrity.value
    if (currentChecksum === lastBackupChecksum.current && !localCloudMetadata().hasPendingUpload) {
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
      try {
        const currentState = backupStateFrom(useAppStore.getState())
        const currentChecksum = createBackup(currentState).integrity.value
        const pending = readPendingSnapshot(window.localStorage)
        const mutationPlan = planCloudMutation(currentChecksum, lastBackupChecksum.current, pending?.backup.integrity.value ?? null)
        // Navigation, notices, and other interface-only state still trigger Zustand.
        // Do not manufacture a cloud version when the restorable training state is unchanged.
        if (mutationPlan === 'none') return
        if (mutationPlan === 'stage') stageCloudSnapshot(currentState)
      } catch (cause) {
        lastSaveFailure.current = cause instanceof Error ? cause : new Error('This device could not preserve the pending training change.')
        setSaveState('error')
        setError('This device could not preserve the pending training change. Keep ForgePath open and export a backup before clearing browser data.')
        return
      }
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

  const refreshWithNewestBuild = async (availableVersion: string | null) => {
    if (session && ready) {
      if (saveState === 'error') await saveNow()
      await flushPendingSave()
    }
    await reloadWithFreshAppShell(availableVersion)
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
    sendVerificationLink: async () => {
      if (!session.user.email) throw new Error('This account has no verified email.')
      await requestPrivateSignIn(session.user.email)
    },
    resetData: async () => {
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
    deleteAccount: async () => {
      await deleteCloudAccount()
      const client = await getCloudClient()
      await client?.auth.signOut({ scope: 'local' })
      clearLegacyTrainingStorage()
      clearCloudVersionStorage()
      setSession(null)
    }
  } : null

  const withUpdateNotice = (content: ReactNode) => <>{content}<AppUpdateNotice onRefresh={refreshWithNewestBuild} /></>

  if (!cloudAuthoritativeBuild) return withUpdateNotice(<App />)
  if (checking) return withUpdateNotice(<CloudLoading />)
  if (!session) return withUpdateNotice(<CloudAuth />)
  if (browserHomeScreenHandoff) return withUpdateNotice(<HomeScreenHandoff />)
  if (!ready) return withUpdateNotice(<CloudLoading
    error={error}
    recover={readPendingSnapshot(window.localStorage) ? downloadPendingRecovery : undefined}
    retry={() => setRetryToken((value) => value + 1)}
    refresh={() => { void reloadWithFreshAppShell() }}
    signOut={() => { void signOutCloud().catch(() => undefined).then(() => setSession(null)) }}
  />)
  return withUpdateNotice(<CloudRuntimeContext.Provider value={runtime as CloudRuntimeValue}><App /></CloudRuntimeContext.Provider>)
}
