export const LEGACY_APP_STORAGE_KEY = 'forgepath-private-alpha-v1'

export type CloudConfiguration =
  | { status: 'ready'; url: string; publishableKey: string }
  | { status: 'missing'; reason: string }
  | { status: 'invalid'; reason: string }

const configuredUrl = import.meta.env.VITE_SUPABASE_URL?.trim() ?? ''
const configuredPublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() ?? ''

export function evaluateCloudConfiguration(url: string, publishableKey: string): CloudConfiguration {
  if (!url && !publishableKey) return { status: 'missing', reason: 'Private cloud access is not enabled in this build.' }
  if (!url || !publishableKey) return { status: 'invalid', reason: 'The ForgePath cloud connection is incomplete.' }
  try {
    const parsed = new URL(url)
    const isCanonicalProjectOrigin = parsed.protocol === 'https:'
      && /^[a-z0-9]{20}\.supabase\.co$/.test(parsed.hostname)
      && !parsed.username
      && !parsed.password
      && !parsed.port
      && (parsed.pathname === '/' || parsed.pathname === '')
      && !parsed.search
      && !parsed.hash
    if (!isCanonicalProjectOrigin) throw new Error('invalid host')
    url = parsed.origin
  } catch {
    return { status: 'invalid', reason: 'The ForgePath cloud project URL is invalid.' }
  }
  const isModernPublishableKey = /^sb_publishable_[A-Za-z0-9_-]{20,}$/.test(publishableKey)
  const isLegacyAnonJwt = /^eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(publishableKey) && publishableKey.length >= 100
  if (!isModernPublishableKey && !isLegacyAnonJwt) return { status: 'invalid', reason: 'The ForgePath publishable key is invalid.' }
  return { status: 'ready', url, publishableKey }
}

export const cloudConfiguration = evaluateCloudConfiguration(configuredUrl, configuredPublishableKey)

// Device storage is authoritative even when legacy recovery credentials are configured.
// Supabase is contacted only when the athlete explicitly requests an old copy.
export const cloudAuthoritativeBuild = false
