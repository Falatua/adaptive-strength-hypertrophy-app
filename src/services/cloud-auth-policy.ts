import type { Session } from '@supabase/supabase-js'

export type CloudPasswordMode = 'setup' | 'recovery'

export function passwordModeFor(session: Session | null, recovery: boolean): CloudPasswordMode | null {
  if (!session) return null
  if (recovery) return 'recovery'
  return session.user.user_metadata?.forgepath_password_ready === true ? null : 'setup'
}
