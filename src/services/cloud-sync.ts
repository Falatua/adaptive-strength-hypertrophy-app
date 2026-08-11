import type { Session, SupabaseClient } from '@supabase/supabase-js'
import { BACKUP_APP_VERSION, BACKUP_SCHEMA_VERSION, createBackup, parseBackup, type ForgePathBackup, type RestorableAppState } from '../domain/backup'

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

type PendingSnapshot = {
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
  if (!url && !publishableKey) return { status: 'missing', reason: 'A dedicated ForgePath cloud project has not been connected yet.' }
  if (!url || !publishableKey) return { status: 'invalid', reason: 'The ForgePath cloud connection is incomplete.' }
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== 'https:' || !parsed.hostname.endsWith('.supabase.co')) throw new Error('invalid host')
  } catch {
    return { status: 'invalid', reason: 'The ForgePath cloud project URL is invalid.' }
  }
  if (publishableKey.length < 20) return { status: 'invalid', reason: 'The ForgePath publishable key is invalid.' }
  return { status: 'ready', url, publishableKey }
}

export const cloudConfiguration = evaluateCloudConfiguration(configuredUrl, configuredPublishableKey)

let cloudClient: SupabaseClient | null = null
let cloudClientPromise: Promise<SupabaseClient> | null = null

export async function getCloudClient() {
  if (cloudConfiguration.status !== 'ready') return null
  if (cloudClient) return cloudClient
  if (!cloudClientPromise) {
    cloudClientPromise = import('@supabase/supabase-js').then(({ createClient }) => createClient(cloudConfiguration.url, cloudConfiguration.publishableKey, {
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

function readPending(storage: Storage): PendingSnapshot | null {
  const raw = storage.getItem(CLOUD_OUTBOX_STORAGE_KEY)
  if (!raw) return null
  try {
    const candidate = JSON.parse(raw) as PendingSnapshot
    parseBackup(JSON.stringify(candidate.backup))
    return candidate
  } catch {
    storage.removeItem(CLOUD_OUTBOX_STORAGE_KEY)
    return null
  }
}

function queueSnapshot(backup: ForgePathBackup, storage: Storage): PendingSnapshot {
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

async function registerDevice(client: SupabaseClient, session: Session, deviceId: string) {
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

async function sendPending(client: SupabaseClient, session: Session, pending: PendingSnapshot, storage: Storage): Promise<CloudPushResult> {
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
    p_payload: pending.backup
  })
  if (error) throw error
  const row = (data ?? {}) as PushRpcRow
  const status = row.status
  if (!['applied', 'already_applied', 'conflict'].includes(status ?? '')) throw new Error('The cloud returned an unknown sync result.')
  const serverVersion = Number(row.server_version)
  if (!Number.isSafeInteger(serverVersion) || serverVersion < 0) throw new Error('The cloud returned an invalid version.')
  const result: CloudPushResult = {
    status: status as CloudPushResult['status'],
    serverVersion,
    eventId: String(row.event_id ?? pending.eventId),
    message: String(row.message ?? '')
  }
  if (result.status !== 'conflict') {
    storage.setItem(CLOUD_VERSION_STORAGE_KEY, String(result.serverVersion))
    storage.setItem(CLOUD_LAST_SYNC_STORAGE_KEY, new Date().toISOString())
    storage.removeItem(CLOUD_OUTBOX_STORAGE_KEY)
  }
  return result
}

export async function pushCloudSnapshot(state: RestorableAppState): Promise<CloudPushResult> {
  const storage = requireBrowserStorage()
  const { client, session } = await requireAuthenticatedClient()
  const currentBackup = createBackup(state)
  const existing = readPending(storage)
  const pending = existing ?? queueSnapshot(currentBackup, storage)
  const first = await sendPending(client, session, pending, storage)
  if (first.status === 'conflict' || pending.backup.integrity.value === currentBackup.integrity.value) return first
  return sendPending(client, session, queueSnapshot(currentBackup, storage), storage)
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
  return { backup: preview.backup, serverVersion, updatedAt: String(data.updated_at) }
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
