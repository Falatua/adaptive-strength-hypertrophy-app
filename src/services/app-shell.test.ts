import { afterEach, describe, expect, it, vi } from 'vitest'
import { checkForAppUpdate, readAppVersionStatus, reloadWithFreshAppShell } from './app-shell'

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
  it('compares the exact installed source with a no-cache published marker', async () => {
    const installed = 'a'.repeat(40)
    const available = 'b'.repeat(40)
    const fetcher = vi.fn(async () => new Response(`${available}\n`)) as unknown as typeof fetch
    await expect(readAppVersionStatus(fetcher, installed, 'https://example.com', '/forgepath/')).resolves.toEqual({
      installed,
      available,
      updateAvailable: true
    })
    expect(fetcher).toHaveBeenCalledWith(expect.objectContaining({ pathname: '/forgepath/source-version.txt' }), { cache: 'no-store' })
  })

  it('does not block local builds or an unavailable marker', async () => {
    expect(await readAppVersionStatus(vi.fn() as unknown as typeof fetch, '', 'https://example.com', '/')).toEqual({ installed: null, available: null, updateAvailable: false })
    const fetcher = vi.fn(async () => { throw new Error('offline') }) as unknown as typeof fetch
    expect(await readAppVersionStatus(fetcher, 'a'.repeat(40), 'https://example.com', '/')).toEqual({ installed: 'a'.repeat(40), available: null, updateAvailable: false })
  })

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
