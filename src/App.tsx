import { lazy, Suspense } from 'react'
import { AppShell } from './components/AppShell'
import { Onboarding } from './components/Onboarding'
import { useAppStore } from './store/useAppStore'

const TodayScreen = lazy(() => import('./screens/TodayScreen').then((module) => ({ default: module.TodayScreen })))
const PlanScreen = lazy(() => import('./screens/PlanScreen').then((module) => ({ default: module.PlanScreen })))
const ProgressScreen = lazy(() => import('./screens/ProgressScreen').then((module) => ({ default: module.ProgressScreen })))
const LibraryScreen = lazy(() => import('./screens/LibraryScreen').then((module) => ({ default: module.LibraryScreen })))
const YouScreen = lazy(() => import('./screens/YouScreen').then((module) => ({ default: module.YouScreen })))
const WorkoutScreen = lazy(() => import('./screens/WorkoutScreen').then((module) => ({ default: module.WorkoutScreen })))

const loading = <div className="screen-loading" role="status">Loading your training data…</div>

function App() {
  const { nav, activeSessionId, onboardingComplete } = useAppStore()

  if (!onboardingComplete) return <Onboarding />
  if (activeSessionId) return <Suspense fallback={loading}><WorkoutScreen sessionId={activeSessionId} /></Suspense>

  const screen = {
    today: <TodayScreen />,
    plan: <PlanScreen />,
    progress: <ProgressScreen />,
    library: <LibraryScreen />,
    you: <YouScreen />
  }[nav]

  return <AppShell><Suspense fallback={loading}>{screen}</Suspense></AppShell>
}

export default App
