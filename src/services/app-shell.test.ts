import { afterEach, describe, expect, it, vi } from 'vitest'
import { checkForAppUpdate, readAppVersionStatus, reloadWithFreshAppShell } from './app-shell'

const withBrowser = (registrations: { scope?: string; unregister: () => Promise<boolean>; update: () => Promise<void> }[], cacheKeys: string[]) => {
  const deleted: string[] = []
  const replace = vi.fn()
  vi.stubGlobal('navigator', { serviceWorker: {
    getRegistration: async () => registrations[0],
  } })
  vi.stubGlobal('caches', { keys: async () => cacheKeys, delete: async (key: string) => { deleted.push(key); return true } })
  vi.stubGlobal('window', { location: { href: 'https://example.com/forgepath/', origin: 'https://example.com', replace } })
  return { deleted, replace }
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

  it('removes only this app worker and ForgePath caches, then opens a cache-busted URL', async () => {
    const unregister = vi.fn(async () => true)
    const unrelatedUnregister = vi.fn(async () => true)
    const { deleted, replace } = withBrowser([
      { scope: 'https://example.com/forgepath/', unregister, update: async () => undefined },
      { unregister: unrelatedUnregister, update: async () => undefined }
    ], ['workbox-precache-forgepath', 'workbox-precache-v2-https://example.com/forgepath/', 'forgepath-runtime', 'roman-td-runtime'])
    await reloadWithFreshAppShell('b'.repeat(40))
    expect(unregister).toHaveBeenCalledTimes(1)
    expect(unrelatedUnregister).not.toHaveBeenCalled()
    expect(deleted).toEqual(['workbox-precache-forgepath', 'workbox-precache-v2-https://example.com/forgepath/', 'forgepath-runtime'])
    expect(replace).toHaveBeenCalledWith('https://example.com/forgepath/?forgepath_update=bbbbbbbbbbbb')
  })
})
