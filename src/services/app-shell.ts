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

export async function reloadWithFreshAppShell(availableVersion: string | null = null) {
  let appScope = typeof window === 'undefined' ? '' : new URL(import.meta.env.BASE_URL, window.location.origin).href
  if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
    // Only remove the worker controlling this ForgePath scope. Other GitHub Pages apps can share
    // the same origin and must keep their own workers and offline files.
    const registration = await navigator.serviceWorker.getRegistration()
    appScope = registration?.scope || appScope
    await registration?.unregister()
  }
  if (typeof caches !== 'undefined') {
    const keys = await caches.keys()
    await Promise.all(keys.filter((key) => key.toLowerCase().includes('forgepath') || (appScope && key.includes(appScope))).map((key) => caches.delete(key)))
  }
  const destination = new URL(window.location.href)
  destination.searchParams.set('forgepath_update', availableVersion?.slice(0, 12) || String(Date.now()))
  window.location.replace(destination.toString())
}
