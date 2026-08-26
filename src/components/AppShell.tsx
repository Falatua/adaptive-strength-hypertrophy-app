import { useEffect, useRef, type ReactNode } from 'react'
import { BACKUP_APP_VERSION } from '../domain/backup'
import type { NavKey } from '../domain/types'
import { useAppStore } from '../store/useAppStore'
import { continuityLabels } from '../domain/readable-labels'
import { athleteLevel } from '../domain/athlete-level-engine'
import { PixelAvatar } from './PixelAvatar'
import { LevelProgress } from './LevelProgress'
import { ForgeGlyph, type ForgeGlyphName } from './ForgeGlyph'
import { cloudSaveCopy, useCloudRuntime } from './cloud-runtime-context'

const navItems: { id: NavKey; label: string; icon: ForgeGlyphName }[] = [
  { id: 'today', label: 'Today', icon: 'today' },
  { id: 'plan', label: 'Plan', icon: 'plan' },
  { id: 'progress', label: 'Progress', icon: 'progress' },
  { id: 'library', label: 'Library', icon: 'library' },
  { id: 'you', label: 'You', icon: 'you' }
]

export function AppShell({ children }: { children: ReactNode }) {
  const { nav, setNav, athlete, notice, setNotice, settings , history, records, sessions } = useAppStore()
  const athleteProgress = athleteLevel({ history, records, sessions })
  const cloudRuntime = useCloudRuntime()
  const saveCopy = cloudSaveCopy(cloudRuntime?.saveState ?? null)
  const mainRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
      mainRef.current?.scrollTo({ top: 0, left: 0, behavior: 'auto' })
      mainRef.current?.focus({ preventScroll: true })
    })
    return () => cancelAnimationFrame(frame)
  }, [nav])

  useEffect(() => {
    if (!notice) return
    const timeout = window.setTimeout(() => setNotice(null), 10_000)
    return () => window.clearTimeout(timeout)
  }, [notice, setNotice])

  return (
    <div className={`app-shell ${settings.reducedMotion ? 'reduced-motion' : ''}`}>
      <aside className="sidebar" aria-label="Primary navigation">
        <button className="brand" onClick={() => setNav('today')} aria-label="ForgePath home">
          <span className="brand__mark"><ForgeGlyph name="mark" size={25} /></span>
          <span><strong>ForgePath</strong><small>Private Alpha</small></span>
        </button>
        <div className="sidebar__athlete">
          <PixelAvatar size="small" form={athleteProgress.form} level={athleteProgress.level} />
          <div><strong>{athlete.name}</strong><small>{continuityLabels[athlete.continuity]}</small><LevelProgress progress={athleteProgress} compact /></div>
        </div>
        <nav className="sidebar__nav">
          {navItems.map((item) => {
            return (
              <button key={item.id} className={nav === item.id ? 'active' : ''} onClick={() => setNav(item.id)} aria-current={nav === item.id ? 'page' : undefined}>
                <ForgeGlyph name={item.icon} size={20} /><span>{item.label}</span>
              </button>
            )
          })}
        </nav>
        <div className="sidebar__footer">
          <ForgeGlyph name="saved" size={16} />
          <span>ForgePath {BACKUP_APP_VERSION}<br /><small aria-live="polite">{saveCopy.short}</small></span>
        </div>
      </aside>
      <main ref={mainRef} id="main-content" className="main-content" tabIndex={-1}>{children}</main>
      <nav className="bottom-nav" aria-label="Primary navigation">
        {navItems.map((item) => {
          return (
            <button key={item.id} className={nav === item.id ? 'active' : ''} onClick={() => setNav(item.id)} aria-current={nav === item.id ? 'page' : undefined}>
              <ForgeGlyph name={item.icon} size={20} /><span>{item.label}</span>
            </button>
          )
        })}
      </nav>
      {notice && (
        <div className="toast" role="status" aria-live="polite" aria-atomic="true">
          <span>{notice}</span>
          <button onClick={() => setNotice(null)} aria-label="Dismiss message">×</button>
        </div>
      )}
    </div>
  )
}
