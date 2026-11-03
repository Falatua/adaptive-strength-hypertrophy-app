import { useSyncExternalStore } from 'react'
import App from '../App'
import { useAppStore } from '../store/useAppStore'
import { localStorageError, subscribeLocalStorage } from '../services/local-storage'
import { reloadWithFreshAppShell } from '../services/app-shell'
import { AppUpdateNotice } from './AppUpdateNotice'
import { LocalDataPanel } from './LocalDataPanel'
import { downloadLocalBackup } from '../services/local-backup'

export function LocalAppRoot() {
  const onboarded = useAppStore((state) => state.onboardingComplete)
  const error = useSyncExternalStore(subscribeLocalStorage, localStorageError)
  return <>
    <AppUpdateNotice onRefresh={async () => {
      if (localStorageError()) throw new Error('Download a backup and resolve the device save error before updating.')
      await reloadWithFreshAppShell()
    }} />
    {error && <section className="panel local-save-error" role="alert"><h3>Device save needs attention</h3><p>{error}</p><button className="full-row-button" onClick={downloadLocalBackup}>Download emergency backup</button><button className="full-row-button" onClick={() => useAppStore.setState({})}>Try saving again</button></section>}
    {!onboarded && <div className="local-recovery"><LocalDataPanel /></div>}
    <App />
  </>
}
