import { createContext, useContext } from 'react'
import type { Session } from '@supabase/supabase-js'

export type SaveState = 'loading' | 'saved' | 'saving' | 'error'

export type CloudRuntimeValue = {
  session: Session
  saveState: SaveState
  lastSavedAt: string | null
  error: string | null
  signOut: () => Promise<void>
  resetData: (password?: string) => Promise<void>
  deleteAccount: (password?: string) => Promise<void>
  retrySave: () => Promise<void>
}

export const CloudRuntimeContext = createContext<CloudRuntimeValue | null>(null)

export function useCloudRuntime() {
  return useContext(CloudRuntimeContext)
}
