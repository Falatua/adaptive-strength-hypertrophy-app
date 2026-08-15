import { afterEach, describe, expect, it, vi } from 'vitest'
import { checkForAppUpdate, reloadWithFreshAppShell } from './app-shell'

const withBrowser = (registrations: { unregister: () => Promise<boolean>; update: () => Promise<void> }[], cacheKeys: string[]) => {
  const deleted: string[] = []
  const reload = vi.fn()
  vi.stubGlobal('navigator', { serviceWorker: {
    getRegistration: async () => registrations[0],
    getRegistrations: async () => registrations
  } })
  vi.stubGlobal('caches', { keys: async () => cacheKeys, delete: async (key: string) => { deleted.push(key); return true } })
  vi.stubGlobal('window', { location: { reload } })
  return { deleted, reload }
}

afterEach(() => vi.unstubAllGlobals())

describe('stale app shell recovery', () => {
  it('asks the installed worker for a newer build', async () => {
    const update = vi.fn(async () => undefined)
    withBrowser([{ unregister: async () => true, update }], [])
    expect(await checkForAppUpdate()).toBe(true)
    expect(update).toHaveBeenCalledTimes(1)
  })

  it('reports when no worker is installed instead of failing', async () => {
    vi.stubGlobal('navigator', {})
    expect(await checkForAppUpdate()).toBe(false)
  })

  it('removes every installed worker and cached app file, then reloads', async () => {
    const unregister = vi.fn(async () => true)
    const { deleted, reload } = withBrowser([{ unregister, update: async () => undefined }], ['forgepath-precache', 'forgepath-runtime'])
    await reloadWithFreshAppShell()
    expect(unregister).toHaveBeenCalledTimes(1)
    expect(deleted).toEqual(['forgepath-precache', 'forgepath-runtime'])
    expect(reload).toHaveBeenCalledTimes(1)
  })
})
