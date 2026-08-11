import { describe, expect, it } from 'vitest'
import { CLOUD_OUTBOX_STORAGE_KEY, CLOUD_VERSION_STORAGE_KEY, acceptCloudSnapshot, evaluateCloudConfiguration } from './cloud-sync'

describe('cloud configuration boundary', () => {
  it('keeps the private alpha local when no dedicated project is configured', () => {
    expect(evaluateCloudConfiguration('', '')).toEqual({ status: 'missing', reason: 'A dedicated ForgePath cloud project has not been connected yet.' })
  })

  it('rejects a partial or non-Supabase browser configuration', () => {
    expect(evaluateCloudConfiguration('https://forgepath.supabase.co', '').status).toBe('invalid')
    expect(evaluateCloudConfiguration('http://forgepath.supabase.co', 'publishable-key-with-safe-length').status).toBe('invalid')
    expect(evaluateCloudConfiguration('https://example.com', 'publishable-key-with-safe-length').status).toBe('invalid')
  })

  it('accepts the project URL and browser-safe publishable key pair', () => {
    expect(evaluateCloudConfiguration('https://forgepath.supabase.co', 'publishable-key-with-safe-length')).toEqual({
      status: 'ready',
      url: 'https://forgepath.supabase.co',
      publishableKey: 'publishable-key-with-safe-length'
    })
  })

  it('accepts a reviewed cloud version and clears the stale local outbox', () => {
    const values = new Map<string, string>([[CLOUD_OUTBOX_STORAGE_KEY, 'pending']])
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key)
    } as unknown as Storage
    acceptCloudSnapshot(7, storage)
    expect(values.get(CLOUD_VERSION_STORAGE_KEY)).toBe('7')
    expect(values.has(CLOUD_OUTBOX_STORAGE_KEY)).toBe(false)
  })
})
