import type { Session } from '@supabase/supabase-js'
import { describe, expect, it, vi } from 'vitest'
import { createBackup, type RestorableAppState } from '../domain/backup'
import { athlete, equipmentProfiles, exercises, history, mesocycles, records, sessions } from '../domain/seed'
import {
  CLOUD_LAST_SYNC_STORAGE_KEY,
  CLOUD_OUTBOX_STORAGE_KEY,
  CLOUD_VERSION_STORAGE_KEY,
  acceptCloudSnapshot,
  evaluateCloudConfiguration,
  parseCloudPushResult,
  pushCloudSnapshotUsing,
  queueCloudSnapshot,
  readPendingSnapshot,
  recordCloudPushResult,
  updateCloudPasswordUsing,
  validateNewPassword,
  type ForgePathCloudClient
} from './cloud-sync'

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

describe('password policy', () => {
  it('requires a long mixed-character password before sending an Auth update', () => {
    expect(validateNewPassword('Short1!')).toMatch(/12 characters/i)
    expect(validateNewPassword('alllowercase12!')).toMatch(/uppercase/i)
    expect(validateNewPassword('ALLUPPERCASE12!')).toMatch(/lowercase/i)
    expect(validateNewPassword('NoNumbersHere!')).toMatch(/number/i)
    expect(validateNewPassword('NoSymbolsHere12')).toMatch(/symbol/i)
    expect(validateNewPassword('PrivatePath12!')).toBeNull()
  })

  it('reauthenticates with the current password before changing an existing password', async () => {
    const getUser = vi.fn().mockResolvedValue({ data: { user: { email: 'athlete@example.com' } }, error: null })
    const signInWithPassword = vi.fn().mockResolvedValue({ data: { session: {} }, error: null })
    const updateUser = vi.fn().mockResolvedValue({ data: { user: { id: 'athlete-id' } }, error: null })
    const client = { auth: { getUser, signInWithPassword, updateUser } } as unknown as ForgePathCloudClient

    await updateCloudPasswordUsing(client, 'PrivatePath12!', 'CurrentPath12!')

    expect(signInWithPassword).toHaveBeenCalledWith({ email: 'athlete@example.com', password: 'CurrentPath12!' })
    expect(updateUser).toHaveBeenCalledWith(expect.objectContaining({
      password: 'PrivatePath12!',
      current_password: 'CurrentPath12!',
      data: { forgepath_password_ready: true }
    }))
    expect(signInWithPassword.mock.invocationCallOrder[0]).toBeLessThan(updateUser.mock.invocationCallOrder[0])
  })

  it('stops password changes when current-password reauthentication fails', async () => {
    const updateUser = vi.fn()
    const client = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { email: 'athlete@example.com' } }, error: null }),
        signInWithPassword: vi.fn().mockResolvedValue({ data: {}, error: new Error('invalid credentials') }),
        updateUser
      }
    } as unknown as ForgePathCloudClient

    await expect(updateCloudPasswordUsing(client, 'PrivatePath12!', 'WrongCurrent12!')).rejects.toThrow(/current password is incorrect/i)
    expect(updateUser).not.toHaveBeenCalled()
  })
})

describe('durable snapshot outbox', () => {
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
  it('accepts a reviewed cloud version and clears the stale local outbox', () => {
    const { storage, values } = storageHarness([[CLOUD_OUTBOX_STORAGE_KEY, 'pending']])
    acceptCloudSnapshot(7, storage)
    expect(values.get(CLOUD_VERSION_STORAGE_KEY)).toBe('7')
    expect(values.has(CLOUD_OUTBOX_STORAGE_KEY)).toBe(false)
  })

  it('rejects an impossible cloud version without changing local state', () => {
    const { storage, values } = storageHarness([[CLOUD_OUTBOX_STORAGE_KEY, 'pending']])
    expect(() => acceptCloudSnapshot(0, storage)).toThrow(/accepted cloud version is invalid/i)
    expect(values.get(CLOUD_OUTBOX_STORAGE_KEY)).toBe('pending')
  })
})
