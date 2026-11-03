import { afterEach, expect, it, vi } from 'vitest'
import { localStorageError, reportLocalStorageError, subscribeLocalStorage } from './local-storage'

afterEach(() => reportLocalStorageError(null))
it('reports a failed device save and clears it only after a successful retry', () => {
  const listener = vi.fn()
  const unsubscribe = subscribeLocalStorage(listener)
  reportLocalStorageError(new Error('QuotaExceededError'))
  expect(localStorageError()).toContain('download a backup')
  expect(listener).toHaveBeenCalledTimes(1)
  reportLocalStorageError(null)
  expect(localStorageError()).toBeNull()
  unsubscribe()
  reportLocalStorageError(new Error('Denied'))
  expect(listener).toHaveBeenCalledTimes(2)
})
it('keeps local authority even when legacy cloud recovery is configured', async () => {
  vi.stubEnv('VITE_SUPABASE_URL', 'https://abcdefghijklmnopqrst.supabase.co')
  vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', 'sb_publishable_abcdefghijklmnopqrstuv')
  vi.resetModules()
  const config = await import('./cloud-config')
  expect(config.cloudConfiguration.status).toBe('ready')
  expect(config.cloudAuthoritativeBuild).toBe(false)
  vi.unstubAllEnvs()
})
