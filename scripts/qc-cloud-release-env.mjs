const enabled = process.env.FORGEPATH_CLOUD_RELEASE_ENABLED === 'true'
const url = process.env.VITE_SUPABASE_URL?.trim() ?? ''
const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() ?? ''

const validUrl = /^https:\/\/[a-z]{20}\.supabase\.co$/.test(url)
const validPublishableKey = /^sb_publishable_[A-Za-z0-9_-]{20,}$/.test(key)
const validLegacyAnonKey = /^eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(key) && key.length >= 100
const looksPrivileged = /^sb_secret_/i.test(key) || /service[_-]?role/i.test(key)

if (!enabled) {
  if (url || key) throw new Error('ForgePath cloud credentials must stay out of builds while the cloud release gate is closed.')
  console.log('ForgePath cloud release gate is closed; no browser credentials will be compiled.')
  process.exit(0)
}

if (!validUrl) throw new Error('ForgePath cloud release is enabled, but VITE_SUPABASE_URL is missing or invalid.')
if (looksPrivileged || (!validPublishableKey && !validLegacyAnonKey)) {
  throw new Error('ForgePath cloud release is enabled, but VITE_SUPABASE_PUBLISHABLE_KEY is missing, malformed, or privileged.')
}

console.log('ForgePath cloud release environment passed the browser-safe URL and key checks.')
