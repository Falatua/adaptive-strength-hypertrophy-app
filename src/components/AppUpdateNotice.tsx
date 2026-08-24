import { useCallback, useEffect, useRef, useState } from 'react'
import { RefreshCw, Sparkles } from 'lucide-react'
import { checkForAppUpdate, readAppVersionStatus, type AppVersionStatus } from '../services/app-shell'

const DEFAULT_UPDATE_CHECK_INTERVAL_MS = 60_000

type AppUpdateNoticeProps = {
  onRefresh: (availableVersion: string | null) => Promise<void>
  checkIntervalMs?: number
}

export function AppUpdateNotice({ onRefresh, checkIntervalMs = DEFAULT_UPDATE_CHECK_INTERVAL_MS }: AppUpdateNoticeProps) {
  const [version, setVersion] = useState<AppVersionStatus | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [refreshError, setRefreshError] = useState<string | null>(null)
  const checking = useRef(false)

  const check = useCallback(async () => {
    if (checking.current) return
    checking.current = true
    try {
      await checkForAppUpdate().catch(() => false)
      const nextVersion = await readAppVersionStatus()
      if (nextVersion.updateAvailable) setVersion(nextVersion)
    } finally {
      checking.current = false
    }
  }, [])

  useEffect(() => {
    void check()
    const interval = window.setInterval(() => {
      if (!document.hidden) void check()
    }, Math.max(15_000, checkIntervalMs))
    const checkWhenVisible = () => { if (!document.hidden) void check() }
    window.addEventListener('focus', checkWhenVisible)
    window.addEventListener('online', checkWhenVisible)
    document.addEventListener('visibilitychange', checkWhenVisible)
    return () => {
      window.clearInterval(interval)
      window.removeEventListener('focus', checkWhenVisible)
      window.removeEventListener('online', checkWhenVisible)
      document.removeEventListener('visibilitychange', checkWhenVisible)
    }
  }, [check, checkIntervalMs])

  if (!version?.updateAvailable) return null

  const refresh = async () => {
    setRefreshing(true)
    setRefreshError(null)
    try {
      await onRefresh(version.available)
    } catch (cause) {
      setRefreshError(cause instanceof Error && cause.message
        ? cause.message
        : 'ForgePath could not safely refresh. Try again after your training finishes saving.')
      setRefreshing(false)
    }
  }

  return <section className="app-update-notice" role="alert" aria-live="polite" aria-atomic="true">
    <span className="app-update-notice__icon" aria-hidden="true"><Sparkles size={19} /></span>
    <span className="app-update-notice__copy">
      <strong>Update ready</strong>
      <span>A new ForgePath update is ready. Refresh the page to use the newest fixes and improvements.</span>
      {refreshError && <small>{refreshError}</small>}
    </span>
    <button className="button button--primary" type="button" disabled={refreshing} onClick={() => { void refresh() }}>
      <RefreshCw className={refreshing ? 'spin' : undefined} size={17} />
      {refreshing ? 'Saving first…' : 'Refresh now'}
    </button>
  </section>
}
