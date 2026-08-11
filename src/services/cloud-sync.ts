import type { Session, SupabaseClient } from '@supabase/supabase-js'
import { BACKUP_APP_VERSION, BACKUP_SCHEMA_VERSION, createBackup, parseBackup, type ForgePathBackup, type RestorableAppState } from '../domain/backup'
import type { ForgePathDatabase, Json } from './supabase.types'

export const CLOUD_RULE_VERSION = 'cloud-sync-v1'
export const CLOUD_DEVICE_STORAGE_KEY = 'forgepath-cloud-device-v1'
export const CLOUD_OUTBOX_STORAGE_KEY = 'forgepath-cloud-outbox-v1'
export const CLOUD_VERSION_STORAGE_KEY = 'forgepath-cloud-server-version-v1'
export const CLOUD_LAST_SYNC_STORAGE_KEY = 'forgepath-cloud-last-sync-v1'

export type CloudConfiguration =
  | { status: 'ready'; url: string; publishableKey: string }
  | { status: 'missing'; reason: string }
  | { status: 'invalid'; reason: string }

export type CloudPushResult = {
  status: 'applied' | 'already_applied' | 'conflict'
  serverVersion: number
  eventId: string
  message: string
}

export type CloudSnapshot = {
  backup: ForgePathBackup
  serverVersion: number
  updatedAt: string
}

export type PendingSnapshot = {
  eventId: string
  deviceId: string
  deviceSequence: number
  baseVersion: number
  queuedAt: string
  backup: ForgePathBackup
}

type PushRpcRow = {
  status?: string
  server_version?: number
  event_id?: string
  message?: string
}

const configuredUrl = import.meta.env.VITE_SUPABASE_URL?.trim() ?? ''
const configuredPublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() ?? ''

export function evaluateCloudConfiguration(url: string, publishableKey: string): CloudConfiguration {
  if (!url && !publishableKey) return { status: 'missing', reason: 'Private cloud access is not enabled in this build.' }
  if (!url || !publishableKey) return { status: 'invalid', reason: 'The ForgePath cloud connection is incomplete.' }
  try {
    const parsed = new URL(url)
    const isCanonicalProjectOrigin = parsed.protocol === 'https:'
      && /^[a-z0-9]{20}\.supabase\.co$/.test(parsed.hostname)
      && !parsed.username
      && !parsed.password
      && !parsed.port
      && (parsed.pathname === '/' || parsed.pathname === '')
      && !parsed.search
      && !parsed.hash
    if (!isCanonicalProjectOrigin) throw new Error('invalid host')
    url = parsed.origin
  } catch {
    return { status: 'invalid', reason: 'The ForgePath cloud project URL is invalid.' }
  }
  const isModernPublishableKey = /^sb_publishable_[A-Za-z0-9_-]{20,}$/.test(publishableKey)
  const isLegacyAnonJwt = /^eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(publishableKey) && publishableKey.length >= 100
  if (!isModernPublishableKey && !isLegacyAnonJwt) return { status: 'invalid', reason: 'The ForgePath publishable key is invalid.' }
  return { status: 'ready', url, publishableKey }
}

export const cloudConfiguration = evaluateCloudConfiguration(configuredUrl, configuredPublishableKey)

export type ForgePathCloudClient = SupabaseClient<ForgePathDatabase>

let cloudClient: ForgePathCloudClient | null = null
let cloudClientPromise: Promise<ForgePathCloudClient> | null = null

export async function getCloudClient() {
  if (cloudConfiguration.status !== 'ready') return null
  if (cloudClient) return cloudClient
  if (!cloudClientPromise) {
    cloudClientPromise = import('@supabase/supabase-js').then(({ createClient }) => createClient<ForgePathDatabase>(cloudConfiguration.url, cloudConfiguration.publishableKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
    }))
  }
  cloudClient = await cloudClientPromise
  return cloudClient
}

function requireBrowserStorage() {
  if (typeof window === 'undefined') throw new Error('Cloud sync is available only in the installed or browser app.')
  return window.localStorage
}

function positiveInteger(value: string | null) {
  const parsed = Number(value)
  return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : 0
}

export function cloudDeviceId(storage = requireBrowserStorage()) {
  const existing = storage.getItem(CLOUD_DEVICE_STORAGE_KEY)
  if (existing && /^[0-9a-f-]{36}$/i.test(existing)) return existing
  const created = crypto.randomUUID()
  storage.setItem(CLOUD_DEVICE_STORAGE_KEY, created)
  return created
}

function nextDeviceSequence(storage: Storage) {
  const key = `${CLOUD_DEVICE_STORAGE_KEY}:sequence`
  const next = positiveInteger(storage.getItem(key)) + 1
  storage.setItem(key, String(next))
  return next
}

function localServerVersion(storage: Storage) {
  return positiveInteger(storage.getItem(CLOUD_VERSION_STORAGE_KEY))
}

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const validIsoDate = (value: unknown) => typeof value === 'string' && !Number.isNaN(new Date(value).getTime())

export function readPendingSnapshot(storage: Storage): PendingSnapshot | null {
  const raw = storage.getItem(CLOUD_OUTBOX_STORAGE_KEY)
  if (!raw) return null
  try {
    const candidate = JSON.parse(raw) as Partial<PendingSnapshot>
    if (!candidate || !uuidPattern.test(candidate.eventId ?? '') || !uuidPattern.test(candidate.deviceId ?? '')) throw new Error('invalid identity')
    if (!Number.isSafeInteger(candidate.deviceSequence) || Number(candidate.deviceSequence) < 1) throw new Error('invalid sequence')
    if (!Number.isSafeInteger(candidate.baseVersion) || Number(candidate.baseVersion) < 0) throw new Error('invalid base version')
    if (!validIsoDate(candidate.queuedAt)) throw new Error('invalid queue date')
    const parsed = parseBackup(JSON.stringify(candidate.backup))
    return { ...candidate, backup: parsed.backup } as PendingSnapshot
  } catch {
    storage.removeItem(CLOUD_OUTBOX_STORAGE_KEY)
    return null
  }
}

export function queueCloudSnapshot(backup: ForgePathBackup, storage: Storage): PendingSnapshot {
  const pending: PendingSnapshot = {
    eventId: crypto.randomUUID(),
    deviceId: cloudDeviceId(storage),
    deviceSequence: nextDeviceSequence(storage),
    baseVersion: localServerVersion(storage),
    queuedAt: new Date().toISOString(),
    backup
  }
  storage.setItem(CLOUD_OUTBOX_STORAGE_KEY, JSON.stringify(pending))
  return pending
}

async function requireAuthenticatedClient() {
  const client = await getCloudClient()
  if (!client) throw new Error(cloudConfiguration.status === 'ready' ? 'The ForgePath cloud client could not start.' : cloudConfiguration.reason)
  const { data, error } = await client.auth.getSession()
  if (error) throw error
  if (!data.session?.user) throw new Error('Sign in to your private ForgePath account before syncing.')
  return { client, session: data.session }
}

async function registerDevice(client: ForgePathCloudClient, session: Session, deviceId: string) {
  const now = new Date().toISOString()
  const platform = typeof navigator === 'undefined' ? 'Web' : navigator.platform || 'Web'
  const { error } = await client.from('forgepath_devices').upsert({
    id: deviceId,
    user_id: session.user.id,
    display_name: `${platform} browser`,
    platform,
    app_version: BACKUP_APP_VERSION,
    schema_version: BACKUP_SCHEMA_VERSION,
    last_seen_at: now
  }, { onConflict: 'user_id,id' })
  if (error) throw error
}

export function parseCloudPushResult(row: PushRpcRow, expectedEventId: string): CloudPushResult {
  const status = row.status
  if (!['applied', 'already_applied', 'conflict'].includes(status ?? '')) throw new Error('The cloud returned an unknown sync result.')
  const serverVersion = Number(row.server_version)
  if (!Number.isSafeInteger(serverVersion) || serverVersion < 0) throw new Error('The cloud returned an invalid version.')
  const eventId = String(row.event_id ?? '')
  if (eventId !== expectedEventId) throw new Error('The cloud returned a mismatched sync event.')
  return {
    status: status as CloudPushResult['status'],
    serverVersion,
    eventId,
    message: String(row.message ?? '')
  }
}

export function recordCloudPushResult(result: CloudPushResult, storage: Storage, confirmedAt = new Date().toISOString()) {
  if (result.status === 'conflict') return
  storage.setItem(CLOUD_VERSION_STORAGE_KEY, String(result.serverVersion))
  storage.setItem(CLOUD_LAST_SYNC_STORAGE_KEY, confirmedAt)
  storage.removeItem(CLOUD_OUTBOX_STORAGE_KEY)
}

async function sendPending(client: ForgePathCloudClient, session: Session, pending: PendingSnapshot, storage: Storage): Promise<CloudPushResult> {
  await registerDevice(client, session, pending.deviceId)
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  const { data, error } = await client.rpc('push_forgepath_snapshot', {
    p_event_id: pending.eventId,
    p_device_id: pending.deviceId,
    p_base_version: pending.baseVersion,
    p_device_sequence: pending.deviceSequence,
    p_schema_version: pending.backup.schemaVersion,
    p_app_version: pending.backup.appVersion,
    p_rule_version: CLOUD_RULE_VERSION,
    p_checksum: pending.backup.integrity.value,
    p_occurred_at: pending.queuedAt,
    p_timezone: timezone,
    p_payload: pending.backup as unknown as Json
  })
  if (error) throw error
  const result = parseCloudPushResult((data ?? {}) as PushRpcRow, pending.eventId)
  recordCloudPushResult(result, storage)
  return result
}

export async function pushCloudSnapshot(state: RestorableAppState): Promise<CloudPushResult> {
  const storage = requireBrowserStorage()
  const { client, session } = await requireAuthenticatedClient()
  return pushCloudSnapshotUsing(state, client, session, storage)
}

export async function pushCloudSnapshotUsing(state: RestorableAppState, client: ForgePathCloudClient, session: Session, storage: Storage): Promise<CloudPushResult> {
  const currentBackup = createBackup(state)
  const existing = readPendingSnapshot(storage)
  const pending = existing ?? queueCloudSnapshot(currentBackup, storage)
  const first = await sendPending(client, session, pending, storage)
  if (first.status === 'conflict' || pending.backup.integrity.value === currentBackup.integrity.value) return first
  return sendPending(client, session, queueCloudSnapshot(currentBackup, storage), storage)
}

export async function fetchCloudSnapshot(): Promise<CloudSnapshot | null> {
  const { client } = await requireAuthenticatedClient()
  const { data, error } = await client
    .from('forgepath_state_snapshots')
    .select('payload,version,updated_at')
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  const preview = parseBackup(JSON.stringify(data.payload))
  const serverVersion = Number(data.version)
  if (!Number.isSafeInteger(serverVersion) || serverVersion < 1) throw new Error('The cloud copy has an invalid version.')
  const updatedAt = String(data.updated_at)
  if (!validIsoDate(updatedAt)) throw new Error('The cloud copy has an invalid update time.')
  return { backup: preview.backup, serverVersion, updatedAt }
}

export function acceptCloudSnapshot(serverVersion: number, storage = requireBrowserStorage()) {
  if (!Number.isSafeInteger(serverVersion) || serverVersion < 1) throw new Error('The accepted cloud version is invalid.')
  storage.setItem(CLOUD_VERSION_STORAGE_KEY, String(serverVersion))
  storage.setItem(CLOUD_LAST_SYNC_STORAGE_KEY, new Date().toISOString())
  storage.removeItem(CLOUD_OUTBOX_STORAGE_KEY)
}

export function localCloudMetadata(storage = typeof window === 'undefined' ? null : window.localStorage) {
  return {
    lastSyncedAt: storage?.getItem(CLOUD_LAST_SYNC_STORAGE_KEY) ?? null,
    serverVersion: storage ? localServerVersion(storage) : 0,
    hasPendingUpload: Boolean(storage?.getItem(CLOUD_OUTBOX_STORAGE_KEY))
  }
}

export async function requestPrivateSignIn(email: string) {
  const client = await getCloudClient()
  if (!client) throw new Error(cloudConfiguration.status === 'ready' ? 'The ForgePath cloud client could not start.' : cloudConfiguration.reason)
  const normalized = email.trim().toLowerCase()
  if (!/^\S+@\S+\.\S+$/.test(normalized)) throw new Error('Enter the email address invited to the private alpha.')
  const redirectTo = new URL(import.meta.env.BASE_URL, window.location.origin).toString()
  const { error } = await client.auth.signInWithOtp({ email: normalized, options: { shouldCreateUser: false, emailRedirectTo: redirectTo } })
  if (error) throw error
}

export async function signOutCloud() {
  const client = await getCloudClient()
  if (!client) return
  const { error } = await client.auth.signOut()
  if (error) throw error
}
