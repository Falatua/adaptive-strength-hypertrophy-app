import { BarChart3, CalendarRange, Dumbbell, LibraryBig, Sparkles, UserRound } from 'lucide-react'
import type { ReactNode } from 'react'
import type { NavKey } from '../domain/types'
import { useAppStore } from '../store/useAppStore'
import { PixelAvatar } from './PixelAvatar'

const navItems: { id: NavKey; label: string; icon: typeof Dumbbell }[] = [
  { id: 'today', label: 'Today', icon: Dumbbell },
  { id: 'plan', label: 'Plan', icon: CalendarRange },
  { id: 'progress', label: 'Progress', icon: BarChart3 },
  { id: 'library', label: 'Library', icon: LibraryBig },
  { id: 'you', label: 'You', icon: UserRound }
]

export function AppShell({ children }: { children: ReactNode }) {
  const { nav, setNav, athlete, notice, setNotice, settings } = useAppStore()

  return (
    <div className={`app-shell ${settings.reducedMotion ? 'reduced-motion' : ''}`}>
      <aside className="sidebar" aria-label="Primary navigation">
        <button className="brand" onClick={() => setNav('today')} aria-label="ForgePath home">
          <span className="brand__mark">F</span>
          <span><strong>ForgePath</strong><small>Private Alpha</small></span>
        </button>
        <div className="sidebar__athlete">
          <PixelAvatar size="small" />
          <div><strong>{athlete.name}</strong><small>{athlete.continuity} path</small></div>
        </div>
        <nav className="sidebar__nav">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <button key={item.id} className={nav === item.id ? 'active' : ''} onClick={() => setNav(item.id)} aria-current={nav === item.id ? 'page' : undefined}>
                <Icon size={20} /><span>{item.label}</span>
              </button>
            )
          })}
        </nav>
        <div className="sidebar__footer">
          <Sparkles size={16} />
          <span>Rules v0.13<br /><small>Local and private</small></span>
        </div>
      </aside>
      <main id="main-content" className="main-content">{children}</main>
      <nav className="bottom-nav" aria-label="Primary navigation">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <button key={item.id} className={nav === item.id ? 'active' : ''} onClick={() => setNav(item.id)} aria-current={nav === item.id ? 'page' : undefined}>
              <Icon size={20} /><span>{item.label}</span>
            </button>
          )
        })}
      </nav>
      {notice && (
        <div className="toast" role="status" aria-live="polite">
          <span>{notice}</span>
          <button onClick={() => setNotice(null)} aria-label="Dismiss message">×</button>
        </div>
      )}
    </div>
  )
}
