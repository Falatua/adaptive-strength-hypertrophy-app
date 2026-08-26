import type { Session } from '@supabase/supabase-js'
import { describe, expect, it, vi } from 'vitest'
import { createBackup, type RestorableAppState } from '../domain/backup'
import { athlete, equipmentProfiles, exercises, history, mesocycles, records, sessions } from '../domain/seed'
import {
  CLOUD_LAST_SYNC_STORAGE_KEY,
  CLOUD_ACCOUNT_STORAGE_KEY,
  CLOUD_DEVICE_STORAGE_KEY,
  CLOUD_OUTBOX_STORAGE_KEY,
  CLOUD_VERSION_STORAGE_KEY,
  acceptCloudSnapshot,
  createHomeScreenHandoffCode,
  createHomeScreenHandoffUsing,
  evaluateCloudConfiguration,
  formatHomeScreenHandoffCode,
  hashHomeScreenHandoffCode,
  homeScreenSignInRedirect,
  normalizeHomeScreenHandoffCode,
  parseCloudPushResult,
  parseCloudSnapshotRow,
  persistentCloudAuthOptions,
  planCloudBootstrap,
  planCloudMutation,
  prepareCloudStorageForAccount,
  pushCloudSnapshotUsing,
  queueCloudSnapshot,
  readPendingSnapshot,
  recordCloudPushResult,
  redeemHomeScreenHandoffUsing,
  requestPrivateSignInUsing,
  restoreVerifiedCloudSnapshot,
  signInCooldownRemaining,
  SIGN_IN_COOLDOWN_STORAGE_KEY,
  stageCloudSnapshot,
  startSignInCooldown,
  type ForgePathCloudClient
} from './cloud-sync'
import type { Json } from './supabase.types'

const projectUrl = 'https://abcdefghijklmnopqrst.supabase.co'
const publishableKey = `sb_publishable_${'a'.repeat(32)}`

const state = (): RestorableAppState => ({
  athlete: structuredClone(athlete),
  settings: {
    units: 'lb', preSurveyMode: 'ask', postSurveyMode: 'ask', focusedMode: false,
    reducedMotion: false, sounds: false, haptics: true, celebrationLevel: 'subtle', opportunityPrompts: true,
    sessionAchievements: true, confetti: false, quietMode: false, availableMinutes: 60, equipmentLocation: 'Commercial Gym', activeEquipmentProfileId: 'equipment-commercial-gym'
  },
  equipmentProfiles: structuredClone(equipmentProfiles),
  exercises: structuredClone(exercises),
  sessions: structuredClone(sessions),
  history: structuredClone(history),
  movementNotes: [], surveys: [], deferredFeedback: [], records: structuredClone(records),
  historyMutations: [], cycleReviews: [], substitutionEvents: [], placementVerifications: [], placementExitReviews: [],
  movementPlacementExitReviews: [], missedOpportunityEvents: [], mesocycles: structuredClone(mesocycles),
  activeMesocycleId: mesocycles[0].id, activeSessionId: null, onboardingComplete: true
})

const storageHarness = (entries: Array<[string, string]> = []) => {
  const values = new Map<string, string>(entries)
  const storage = {
    get length() { return values.size },
    clear: () => values.clear(),
    getItem: (key: string) => values.get(key) ?? null,
    key: (index: number) => [...values.keys()][index] ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key)
  } as Storage
  return { values, storage }
}

describe('cloud configuration boundary', () => {
  it('keeps the private alpha local when no dedicated project is configured', () => {
    expect(evaluateCloudConfiguration('', '')).toEqual({ status: 'missing', reason: 'Private cloud access is not enabled in this build.' })
  })

  it('rejects partial, spoofed, credentialed, and non-canonical project URLs', () => {
    expect(evaluateCloudConfiguration(projectUrl, '').status).toBe('invalid')
    expect(evaluateCloudConfiguration(projectUrl.replace('https:', 'http:'), publishableKey).status).toBe('invalid')
    expect(evaluateCloudConfiguration('https://example.com', publishableKey).status).toBe('invalid')
    expect(evaluateCloudConfiguration('https://supabase.co.example.com', publishableKey).status).toBe('invalid')
    expect(evaluateCloudConfiguration('https://user:pass@abcdefghijklmnopqrst.supabase.co', publishableKey).status).toBe('invalid')
    expect(evaluateCloudConfiguration(`${projectUrl}/rest/v1`, publishableKey).status).toBe('invalid')
    expect(evaluateCloudConfiguration(`${projectUrl}?project=other`, publishableKey).status).toBe('invalid')
    expect(evaluateCloudConfiguration('https://too-short.supabase.co', publishableKey).status).toBe('invalid')
  })

  it('accepts only canonical projects and browser-safe modern or legacy keys', () => {
    expect(evaluateCloudConfiguration(`${projectUrl}/`, publishableKey)).toEqual({ status: 'ready', url: projectUrl, publishableKey })
    const legacyAnonKey = `eyJ${'a'.repeat(40)}.${'b'.repeat(40)}.${'c'.repeat(40)}`
    expect(evaluateCloudConfiguration(projectUrl, legacyAnonKey).status).toBe('ready')
    expect(evaluateCloudConfiguration(projectUrl, 'service-role-secret')).toEqual({ status: 'invalid', reason: 'The ForgePath publishable key is invalid.' })
  })
})

describe('invitation-only email-link policy', () => {
  it('keeps a verified browser session in durable storage and renews it automatically', () => {
    const { storage } = storageHarness()
    expect(persistentCloudAuthOptions(storage)).toEqual({
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage
    })
  })

  it('normalizes the email, refuses account creation, and returns to the exact app base', async () => {
    const signInWithOtp = vi.fn().mockResolvedValue({ error: null })
    await requestPrivateSignInUsing({ auth: { signInWithOtp } }, ' Athlete@Example.com ', 'https://example.com/forgepath/')
    expect(signInWithOtp).toHaveBeenCalledWith({
      email: 'athlete@example.com',
      options: { shouldCreateUser: false, emailRedirectTo: 'https://example.com/forgepath/' }
    })
  })

  it('does not reveal whether the email was invited', async () => {
    const signInWithOtp = vi.fn().mockResolvedValue({ error: { code: 'signup_disabled', message: 'Signups not allowed for otp' } })
    await expect(requestPrivateSignInUsing({ auth: { signInWithOtp } }, 'unknown@example.com', 'https://example.com/')).resolves.toBeUndefined()
  })

  it('explains the email-service limit without implying that the private account is locked', async () => {
    const signInWithOtp = vi.fn().mockResolvedValue({ error: { code: 'over_email_send_rate_limit', message: 'rate limit' } })
    await expect(requestPrivateSignInUsing({ auth: { signInWithOtp } }, 'athlete@example.com', 'https://example.com/')).rejects.toThrow(/temporarily paused new sign-in emails/i)
    await expect(requestPrivateSignInUsing({ auth: { signInWithOtp } }, 'athlete@example.com', 'https://example.com/')).rejects.toThrow(/account is not locked/i)
  })

  it('distinguishes connection request throttling from the email-send quota', async () => {
    const signInWithOtp = vi.fn().mockResolvedValue({ error: { code: 'over_request_rate_limit', message: 'rate limit' } })
    await expect(requestPrivateSignInUsing({ auth: { signInWithOtp } }, 'athlete@example.com', 'https://example.com/')).rejects.toThrow(/connection.*few minutes/i)
  })

  it('marks a Home Screen request without changing the exact application scope', () => {
    expect(homeScreenSignInRedirect('https://example.com/forgepath/')).toBe('https://example.com/forgepath/?forgepath_auth=home-screen')
  })

  it('keeps the send cooldown through a phone-browser refresh and clears it after expiry', () => {
    const { storage, values } = storageHarness()
    expect(startSignInCooldown(storage, 1_000)).toBe(60)
    expect(values.get(SIGN_IN_COOLDOWN_STORAGE_KEY)).toBe('61000')
    expect(signInCooldownRemaining(storage, 1_001)).toBe(60)
    expect(signInCooldownRemaining(storage, 60_001)).toBe(1)
    expect(signInCooldownRemaining(storage, 61_000)).toBe(0)
    expect(values.has(SIGN_IN_COOLDOWN_STORAGE_KEY)).toBe(false)
  })

  it('creates, normalizes, and formats a uniform 100-bit one-time code', () => {
    const code = createHomeScreenHandoffCode(Uint8Array.from({ length: 20 }, (_, index) => index))
    expect(code).toBe('23456789ABCDEFGHJKLM')
    expect(normalizeHomeScreenHandoffCode('2345-6789 abcd efgh jklm')).toBe(code)
    expect(formatHomeScreenHandoffCode(code)).toBe('2345 6789 ABCD EFGH JKLM')
  })

  it('stores only a SHA-256 code digest in the server-only handoff function', async () => {
    const invoke = vi.fn().mockResolvedValue({ data: { expiresInSeconds: 300 }, error: null })
    const client = { functions: { invoke }, auth: { verifyOtp: vi.fn() } }
    const code = '23456789ABCDEFGHJKLM'
    const expectedHash = await hashHomeScreenHandoffCode(code)
    await expect(createHomeScreenHandoffUsing(client, code)).resolves.toBe(300)
    expect(invoke).toHaveBeenCalledWith('pwa-handoff', { body: { action: 'create', codeHash: expectedHash } })
    expect(JSON.stringify(invoke.mock.calls)).not.toContain(code)
  })

  it('uses browser-neutral recovery language for incomplete Home Screen codes', async () => {
    await expect(hashHomeScreenHandoffCode('short')).rejects.toThrow(/verified browser/i)
    await expect(hashHomeScreenHandoffCode('short')).rejects.not.toThrow(/Safari/i)
  })

  it('distinguishes a stale verified browser from a generic handoff failure', async () => {
    const invoke = vi.fn().mockResolvedValue({
      data: null,
      error: { context: new Response(JSON.stringify({ errorCode: 'AUTH_STALE' }), { status: 401 }) }
    })
    const client = { functions: { invoke }, auth: { verifyOtp: vi.fn() } }
    await expect(createHomeScreenHandoffUsing(client, '23456789ABCDEFGHJKLM')).rejects.toThrow(/older than ten minutes/i)
  })

  it('redeems a one-time code into a new local magic-link session without exposing tokens in the URL', async () => {
    const invoke = vi.fn().mockResolvedValue({ data: { tokenHash: 'server-generated-token-hash' }, error: null })
    const verifyOtp = vi.fn().mockResolvedValue({ error: null })
    const client = { functions: { invoke }, auth: { verifyOtp } }
    await redeemHomeScreenHandoffUsing(client, '2345 6789 ABCD EFGH JKLM')
    expect(invoke).toHaveBeenCalledWith('pwa-handoff', { body: { action: 'redeem', codeHash: expect.stringMatching(/^[0-9a-f]{64}$/) } })
    expect(verifyOtp).toHaveBeenCalledWith({ token_hash: 'server-generated-token-hash', type: 'magiclink' })
  })

  it('keeps a temporary token-generation failure retryable and distinct from an invalid code', async () => {
    const invoke = vi.fn().mockResolvedValue({
      data: { errorCode: 'TOKEN_CREATE_FAILED' },
      error: { message: 'Edge Function returned a non-2xx status code' }
    })
    const client = { functions: { invoke }, auth: { verifyOtp: vi.fn() } }
    await expect(redeemHomeScreenHandoffUsing(client, '23456789ABCDEFGHJKLM')).rejects.toThrow(/same code once more/i)
  })
})

describe('durable snapshot outbox', () => {
  it('ignores interface-only store updates while staging real changes and retrying an existing outbox', () => {
    expect(planCloudMutation('same', 'same', null)).toBe('none')
    expect(planCloudMutation('new', 'old', null)).toBe('stage')
    expect(planCloudMutation('new', 'old', 'new')).toBe('retry')
    expect(planCloudMutation('restored', 'restored', 'stale-pending')).toBe('stage')
  })

  it('chooses cloud, pending recovery, or a preserved conflict without silently dropping either copy', () => {
    const pending = {
      eventId: '22222222-2222-4222-8222-222222222222',
      deviceId: '11111111-1111-4111-8111-111111111111',
      deviceSequence: 1,
      baseVersion: 7,
      queuedAt: '2026-08-11T12:00:00.000Z',
      backup: createBackup(state(), '2026-08-11T12:00:00.000Z')
    }
    const cloudState = state()
    cloudState.settings.availableMinutes = 30
    const cloud = { backup: createBackup(cloudState, '2026-08-11T13:00:00.000Z'), serverVersion: 7, updatedAt: '2026-08-11T13:00:00.000Z' }
    const matchingCloud = { ...cloud, backup: pending.backup, serverVersion: 8 }

    expect(planCloudBootstrap(cloud, null)).toBe('cloud')
    expect(planCloudBootstrap(null, null)).toBe('empty')
    expect(planCloudBootstrap(cloud, pending)).toBe('pending')
    expect(planCloudBootstrap(matchingCloud, pending)).toBe('cloud')
    expect(planCloudBootstrap({ ...cloud, serverVersion: 8 }, pending)).toBe('conflict')
    expect(planCloudBootstrap(null, { ...pending, baseVersion: 0 })).toBe('pending')
  })

  it('isolates device, sequence, version, and pending data when the browser changes accounts', () => {
    const firstAccount = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
    const secondAccount = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
    const { storage, values } = storageHarness([
      [CLOUD_ACCOUNT_STORAGE_KEY, firstAccount],
      [CLOUD_DEVICE_STORAGE_KEY, '11111111-1111-4111-8111-111111111111'],
      [`${CLOUD_DEVICE_STORAGE_KEY}:sequence`, '8'],
      [CLOUD_VERSION_STORAGE_KEY, '12'],
      [CLOUD_LAST_SYNC_STORAGE_KEY, '2026-08-13T12:00:00.000Z'],
      [CLOUD_OUTBOX_STORAGE_KEY, 'pending-private-state']
    ])

    expect(prepareCloudStorageForAccount(firstAccount, storage)).toBe(false)
    expect(values.get(CLOUD_VERSION_STORAGE_KEY)).toBe('12')
    expect(prepareCloudStorageForAccount(secondAccount, storage)).toBe(true)
    expect(values.get(CLOUD_ACCOUNT_STORAGE_KEY)).toBe(secondAccount)
    expect(values.has(CLOUD_DEVICE_STORAGE_KEY)).toBe(false)
    expect(values.has(`${CLOUD_DEVICE_STORAGE_KEY}:sequence`)).toBe(false)
    expect(values.has(CLOUD_VERSION_STORAGE_KEY)).toBe(false)
    expect(values.has(CLOUD_LAST_SYNC_STORAGE_KEY)).toBe(false)
    expect(values.has(CLOUD_OUTBOX_STORAGE_KEY)).toBe(false)
  })

  it('rejects invalid account identities before changing cloud metadata', () => {
    const { storage, values } = storageHarness([[CLOUD_VERSION_STORAGE_KEY, '7']])
    expect(() => prepareCloudStorageForAccount('not-a-user-id', storage)).toThrow(/invalid identity/i)
    expect(values.get(CLOUD_VERSION_STORAGE_KEY)).toBe('7')
  })

  it('queues an integrity-protected snapshot with a monotonic device sequence and known base version', () => {
    const { storage, values } = storageHarness([
      ['forgepath-cloud-device-v1', '11111111-1111-4111-8111-111111111111'],
      ['forgepath-cloud-device-v1:sequence', '4'],
      [CLOUD_VERSION_STORAGE_KEY, '7']
    ])
    const pending = queueCloudSnapshot(createBackup(state(), '2026-08-11T12:00:00.000Z'), storage)
    expect(pending.deviceSequence).toBe(5)
    expect(pending.baseVersion).toBe(7)
    expect(pending.deviceId).toBe('11111111-1111-4111-8111-111111111111')
    expect(readPendingSnapshot(storage)).toEqual(pending)
    expect(values.has(CLOUD_OUTBOX_STORAGE_KEY)).toBe(true)
  })

  it('discards malformed envelopes and integrity-invalid backups instead of sending them', () => {
    const valid = {
      eventId: '22222222-2222-4222-8222-222222222222',
      deviceId: '11111111-1111-4111-8111-111111111111',
      deviceSequence: 1,
      baseVersion: 0,
      queuedAt: '2026-08-11T12:00:00.000Z',
      backup: createBackup(state(), '2026-08-11T12:00:00.000Z')
    }
    const cases = [
      { ...valid, eventId: 'not-a-uuid' },
      { ...valid, deviceSequence: 0 },
      { ...valid, baseVersion: -1 },
      { ...valid, queuedAt: 'not-a-date' },
      { ...valid, backup: { ...valid.backup, integrity: { algorithm: 'fnv1a32', value: '00000000' } } }
    ]
    for (const candidate of cases) {
      const { storage, values } = storageHarness([[CLOUD_OUTBOX_STORAGE_KEY, JSON.stringify(candidate)]])
      expect(readPendingSnapshot(storage)).toBeNull()
      expect(values.has(CLOUD_OUTBOX_STORAGE_KEY)).toBe(false)
    }
  })

  it('keeps a conflicted outbox but clears a confirmed or idempotently replayed event', () => {
    const pending = 'pending-event'
    const conflictHarness = storageHarness([[CLOUD_OUTBOX_STORAGE_KEY, pending], [CLOUD_VERSION_STORAGE_KEY, '3']])
    recordCloudPushResult({ status: 'conflict', serverVersion: 4, eventId: 'event', message: '' }, conflictHarness.storage)
    expect(conflictHarness.values.get(CLOUD_OUTBOX_STORAGE_KEY)).toBe(pending)
    expect(conflictHarness.values.get(CLOUD_VERSION_STORAGE_KEY)).toBe('3')

    for (const status of ['applied', 'already_applied'] as const) {
      const confirmedHarness = storageHarness([[CLOUD_OUTBOX_STORAGE_KEY, pending]])
      recordCloudPushResult({ status, serverVersion: 8, eventId: 'event', message: '' }, confirmedHarness.storage, '2026-08-11T13:00:00.000Z')
      expect(confirmedHarness.values.has(CLOUD_OUTBOX_STORAGE_KEY)).toBe(false)
      expect(confirmedHarness.values.get(CLOUD_VERSION_STORAGE_KEY)).toBe('8')
      expect(confirmedHarness.values.get(CLOUD_LAST_SYNC_STORAGE_KEY)).toBe('2026-08-11T13:00:00.000Z')
    }
  })

  it('keeps and safely rebases a newer same-device change that arrives while an older save is in flight', () => {
    const { storage, values } = storageHarness([[CLOUD_VERSION_STORAGE_KEY, '7']])
    const first = queueCloudSnapshot(createBackup(state(), '2026-08-11T12:00:00.000Z'), storage)
    const laterState = state()
    laterState.settings.availableMinutes = 45
    const later = stageCloudSnapshot(laterState, storage)

    recordCloudPushResult({ status: 'applied', serverVersion: 8, eventId: first.eventId, message: '' }, storage)

    const preserved = readPendingSnapshot(storage)
    expect(preserved?.eventId).toBe(later.eventId)
    expect(preserved?.baseVersion).toBe(8)
    expect(preserved?.backup.data.settings.availableMinutes).toBe(45)
    expect(values.get(CLOUD_VERSION_STORAGE_KEY)).toBe('8')
  })

  it('replays a pending event first, then queues current device state against the confirmed version', async () => {
    const { storage, values } = storageHarness([
      ['forgepath-cloud-device-v1', '11111111-1111-4111-8111-111111111111'],
      ['forgepath-cloud-device-v1:sequence', '1']
    ])
    const priorState = state()
    const pending = queueCloudSnapshot(createBackup(priorState, '2026-08-11T12:00:00.000Z'), storage)
    const currentState = state()
    currentState.athlete.name = 'Updated athlete'

    const rpc = vi.fn()
      .mockImplementationOnce((_name, args) => Promise.resolve({ data: { status: 'already_applied', server_version: 1, event_id: args.p_event_id }, error: null }))
      .mockImplementationOnce((_name, args) => Promise.resolve({ data: { status: 'applied', server_version: 2, event_id: args.p_event_id }, error: null }))
    const upsert = vi.fn().mockResolvedValue({ error: null })
    const client = { from: vi.fn(() => ({ upsert })), rpc } as unknown as ForgePathCloudClient
    const session = { user: { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' } } as unknown as Session

    const result = await pushCloudSnapshotUsing(currentState, client, session, storage)

    expect(result).toMatchObject({ status: 'applied', serverVersion: 2 })
    expect(rpc).toHaveBeenCalledTimes(2)
    expect(rpc.mock.calls[0][1]).toMatchObject({ p_event_id: pending.eventId, p_device_sequence: 2, p_base_version: 0 })
    expect(rpc.mock.calls[1][1]).toMatchObject({ p_device_sequence: 3, p_base_version: 1 })
    expect(rpc.mock.calls[1][1].p_event_id).not.toBe(pending.eventId)
    expect(values.get(CLOUD_VERSION_STORAGE_KEY)).toBe('2')
    expect(values.has(CLOUD_OUTBOX_STORAGE_KEY)).toBe(false)
  })

  it('retains the exact queued event after a network failure for idempotent retry', async () => {
    const { storage, values } = storageHarness([
      ['forgepath-cloud-device-v1', '11111111-1111-4111-8111-111111111111']
    ])
    const rpc = vi.fn().mockResolvedValue({ data: null, error: new Error('network unavailable') })
    const upsert = vi.fn().mockResolvedValue({ error: null })
    const client = { from: vi.fn(() => ({ upsert })), rpc } as unknown as ForgePathCloudClient
    const session = { user: { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' } } as unknown as Session

    await expect(pushCloudSnapshotUsing(state(), client, session, storage)).rejects.toThrow(/network unavailable/i)
    const queuedAfterFailure = values.get(CLOUD_OUTBOX_STORAGE_KEY)
    expect(queuedAfterFailure).toBeTruthy()
    const parsed = JSON.parse(queuedAfterFailure!)
    expect(parsed.eventId).toBe(rpc.mock.calls[0][1].p_event_id)
    expect(parsed.deviceSequence).toBe(rpc.mock.calls[0][1].p_device_sequence)
  })

  it('preserves the local outbox and local version when the server reports a conflict', async () => {
    const { storage, values } = storageHarness([
      ['forgepath-cloud-device-v1', '11111111-1111-4111-8111-111111111111'],
      [CLOUD_VERSION_STORAGE_KEY, '2']
    ])
    const rpc = vi.fn().mockImplementation((_name, args) => Promise.resolve({
      data: { status: 'conflict', server_version: 3, event_id: args.p_event_id }, error: null
    }))
    const upsert = vi.fn().mockResolvedValue({ error: null })
    const client = { from: vi.fn(() => ({ upsert })), rpc } as unknown as ForgePathCloudClient
    const session = { user: { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' } } as unknown as Session

    const result = await pushCloudSnapshotUsing(state(), client, session, storage)
    expect(result.status).toBe('conflict')
    expect(values.get(CLOUD_VERSION_STORAGE_KEY)).toBe('2')
    expect(values.has(CLOUD_OUTBOX_STORAGE_KEY)).toBe(true)
  })
})

describe('untrusted RPC response validation', () => {
  const eventId = '22222222-2222-4222-8222-222222222222'

  it('accepts the three documented results only when version and event identity are valid', () => {
    for (const status of ['applied', 'already_applied', 'conflict'] as const) {
      expect(parseCloudPushResult({ status, server_version: 2, event_id: eventId, message: 'ok' }, eventId)).toEqual({ status, serverVersion: 2, eventId, message: 'ok' })
    }
  })

  it('rejects unknown status, invalid version, and mismatched event identity', () => {
    expect(() => parseCloudPushResult({ status: 'overwritten', server_version: 2, event_id: eventId }, eventId)).toThrow(/unknown sync result/i)
    expect(() => parseCloudPushResult({ status: 'applied', server_version: -1, event_id: eventId }, eventId)).toThrow(/invalid version/i)
    expect(() => parseCloudPushResult({ status: 'applied', server_version: 2, event_id: '33333333-3333-4333-8333-333333333333' }, eventId)).toThrow(/mismatched sync event/i)
  })
})

describe('reviewed cloud restore', () => {
  const reorderJsonObjects = (value: unknown): unknown => {
    if (Array.isArray(value)) return value.map(reorderJsonObjects)
    if (value && typeof value === 'object') {
      return Object.fromEntries(Object.entries(value as Record<string, unknown>).reverse().map(([key, item]) => [key, reorderJsonObjects(item)]))
    }
    return value
  }

  it('accepts a PostgreSQL-style reordered backup only when row metadata matches the verified envelope', () => {
    const backup = createBackup(state(), '2026-08-13T12:00:00.000Z')
    const row = {
      payload: reorderJsonObjects(backup) as Json,
      version: 9,
      updated_at: '2026-08-13T12:05:00.000Z',
      checksum: backup.integrity.value,
      schema_version: backup.schemaVersion,
      app_version: backup.appVersion
    }
    expect(parseCloudSnapshotRow(row)).toMatchObject({ serverVersion: 9, updatedAt: row.updated_at })
    expect(parseCloudSnapshotRow(row).backup.integrity.value).toBe(backup.integrity.value)
  })

  it('loads a snapshot written before the current schema, which is what the live accounts hold', () => {
    const backup = createBackup(state(), '2026-08-13T12:00:00.000Z')
    // Integrity covers the data, not the envelope, so this is byte-for-byte how a row saved by the
    // previous schema still sits in Postgres today.
    const storedEarlier = { ...JSON.parse(JSON.stringify(backup)), schemaVersion: backup.schemaVersion - 1 }
    const row = {
      payload: storedEarlier as Json,
      version: 19,
      updated_at: '2026-08-16T01:02:21.480Z',
      checksum: backup.integrity.value,
      schema_version: backup.schemaVersion - 1,
      app_version: backup.appVersion
    }
    const snapshot = parseCloudSnapshotRow(row)
    expect(snapshot.serverVersion).toBe(19)
    expect(snapshot.backup.schemaVersion).toBe(backup.schemaVersion)
  })

  it('refuses a snapshot written by a newer schema rather than silently downgrading it', () => {
    const backup = createBackup(state(), '2026-08-13T12:00:00.000Z')
    const fromTheFuture = { ...JSON.parse(JSON.stringify(backup)), schemaVersion: backup.schemaVersion + 5 }
    expect(() => parseCloudSnapshotRow({
      payload: fromTheFuture as Json,
      version: 9,
      updated_at: '2026-08-13T12:05:00.000Z',
      checksum: backup.integrity.value,
      schema_version: backup.schemaVersion + 5,
      app_version: backup.appVersion
    })).toThrow(/unsupported backup format or schema/i)
  })

  it('rejects snapshot projection metadata that disagrees with the verified backup', () => {
    const backup = createBackup(state(), '2026-08-13T12:00:00.000Z')
    const row = {
      payload: backup as unknown as Json,
      version: 9,
      updated_at: '2026-08-13T12:05:00.000Z',
      checksum: backup.integrity.value,
      schema_version: backup.schemaVersion,
      app_version: backup.appVersion
    }
    expect(() => parseCloudSnapshotRow({ ...row, checksum: '00000000' })).toThrow(/checksum/i)
    expect(() => parseCloudSnapshotRow({ ...row, schema_version: backup.schemaVersion - 1 })).toThrow(/schema metadata/i)
    expect(() => parseCloudSnapshotRow({ ...row, app_version: '0.0.0' })).toThrow(/app metadata/i)
  })

  it('accepts a reviewed cloud version and clears the stale local outbox', () => {
    const { storage, values } = storageHarness([[CLOUD_OUTBOX_STORAGE_KEY, 'pending']])
    acceptCloudSnapshot(7, storage)
    expect(values.get(CLOUD_VERSION_STORAGE_KEY)).toBe('7')
    expect(values.has(CLOUD_OUTBOX_STORAGE_KEY)).toBe(false)
  })

  it('records a cloud version only after the verified state restore succeeds', () => {
    const backup = createBackup(state(), '2026-08-13T12:00:00.000Z')
    const snapshot = { backup, serverVersion: 7, updatedAt: '2026-08-13T12:05:00.000Z' }
    const failed = storageHarness([[CLOUD_OUTBOX_STORAGE_KEY, 'pending']])
    expect(() => restoreVerifiedCloudSnapshot(snapshot, () => { throw new Error('restore failed') }, failed.storage)).toThrow(/restore failed/i)
    expect(failed.values.has(CLOUD_VERSION_STORAGE_KEY)).toBe(false)
    expect(failed.values.get(CLOUD_OUTBOX_STORAGE_KEY)).toBe('pending')

    const restored = storageHarness([[CLOUD_OUTBOX_STORAGE_KEY, 'pending']])
    const restoreState = vi.fn()
    restoreVerifiedCloudSnapshot(snapshot, restoreState, restored.storage)
    expect(restoreState).toHaveBeenCalledWith(backup.data)
    expect(restored.values.get(CLOUD_VERSION_STORAGE_KEY)).toBe('7')
    expect(restored.values.has(CLOUD_OUTBOX_STORAGE_KEY)).toBe(false)
  })

  it('rejects an impossible cloud version without changing local state', () => {
    const { storage, values } = storageHarness([[CLOUD_OUTBOX_STORAGE_KEY, 'pending']])
    expect(() => acceptCloudSnapshot(0, storage)).toThrow(/accepted cloud version is invalid/i)
    expect(values.get(CLOUD_OUTBOX_STORAGE_KEY)).toBe('pending')
  })
})
