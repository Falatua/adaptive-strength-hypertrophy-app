// A device that keeps an older cached build cannot be repaired by retrying a cloud load, because the
// stale code is what rejects the newer saved copy. These helpers refresh the installed app files
// without touching any training data.

export const INSTALLED_SOURCE_VERSION = (import.meta.env.VITE_FORGEPATH_SOURCE_VERSION ?? '').trim()
const sourceVersionPattern = /^[0-9a-f]{40}$/i

export type AppVersionStatus = {
  installed: string | null
  available: string | null
  updateAvailable: boolean
}

export async function readAppVersionStatus(
  fetcher: typeof fetch = fetch,
  installed = INSTALLED_SOURCE_VERSION,
  origin = typeof window === 'undefined' ? 'http://localhost' : window.location.origin,
  basePath = import.meta.env.BASE_URL
): Promise<AppVersionStatus> {
  const normalizedInstalled = sourceVersionPattern.test(installed) ? installed.toLowerCase() : null
  if (!normalizedInstalled) return { installed: null, available: null, updateAvailable: false }
  try {
    const markerUrl = new URL(`${basePath}source-version.txt`, origin)
    markerUrl.searchParams.set('check', String(Date.now()))
    const response = await fetcher(markerUrl, { cache: 'no-store' })
    if (!response.ok) return { installed: normalizedInstalled, available: null, updateAvailable: false }
    const marker = (await response.text()).trim().toLowerCase()
    const available = sourceVersionPattern.test(marker) ? marker : null
    return { installed: normalizedInstalled, available, updateAvailable: Boolean(available && available !== normalizedInstalled) }
  } catch {
    return { installed: normalizedInstalled, available: null, updateAvailable: false }
  }
}

export async function checkForAppUpdate() {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return false
  const registration = await navigator.serviceWorker.getRegistration()
  if (!registration) return false
  await registration.update()
  return true
}

export async function reloadWithFreshAppShell() {
  if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations()
    await Promise.all(registrations.map((registration) => registration.unregister()))
  }
  if (typeof caches !== 'undefined') {
    const keys = await caches.keys()
    await Promise.all(keys.map((key) => caches.delete(key)))
  }
  window.location.reload()
}
