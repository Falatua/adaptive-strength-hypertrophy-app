// A device that keeps an older cached build cannot be repaired by retrying a cloud load, because the
// stale code is what rejects the newer saved copy. These helpers refresh the installed app files
// without touching any training data.

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
