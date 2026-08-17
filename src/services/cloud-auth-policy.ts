import type { Session } from '@supabase/supabase-js'

export type CloudPasswordMode = 'setup' | 'recovery'

// An invited athlete's email is the credential. A verified invite or sign-in link is proof enough, so
// arriving with a session opens the app immediately rather than demanding a password first. A password
// remains optional for anyone who wants one, and a recovery link still leads to setting a new one.
export function passwordModeFor(session: Session | null, recovery: boolean): CloudPasswordMode | null {
  if (!session) return null
  return recovery ? 'recovery' : null
}
