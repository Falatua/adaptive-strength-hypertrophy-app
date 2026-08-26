import { createContext, useContext } from 'react'
import type { Session } from '@supabase/supabase-js'

export type SaveState = 'loading' | 'saved' | 'saving' | 'error'

export type CloudRuntimeValue = {
  session: Session
  saveState: SaveState
  lastSavedAt: string | null
  error: string | null
  signOut: () => Promise<void>
  sendVerificationLink: () => Promise<void>
  resetData: () => Promise<void>
  deleteAccount: () => Promise<void>
  retrySave: () => Promise<void>
}

export const CloudRuntimeContext = createContext<CloudRuntimeValue | null>(null)

export function useCloudRuntime() {
  return useContext(CloudRuntimeContext)
}

export function cloudSaveCopy(saveState: SaveState | null) {
  if (saveState === 'saving') return { short: 'Saving to private cloud', detail: 'Pending change is protected on this device' }
  if (saveState === 'error') return { short: 'Cloud save needs attention', detail: 'Pending change is protected on this device' }
  if (saveState === 'loading') return { short: 'Checking private cloud', detail: 'Verifying the newest saved copy' }
  if (saveState === 'saved') return { short: 'Saved to private cloud', detail: 'Cloud account is up to date' }
  return { short: 'Local test mode', detail: 'Saved on this test device' }
}
