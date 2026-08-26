import type { Session, SupabaseClient } from '@supabase/supabase-js'
import { BACKUP_APP_VERSION, BACKUP_SCHEMA_VERSION, createBackup, parseBackup, type ForgePathBackup, type RestorableAppState } from '../domain/backup'
import type { ForgePathDatabase, Json } from './supabase.types'
import { cloudConfiguration, evaluateCloudConfiguration, type CloudConfiguration } from './cloud-config'

export { cloudConfiguration, evaluateCloudConfiguration }
export type { CloudConfiguration }

export const CLOUD_RULE_VERSION = 'cloud-sync-v1'
export const CLOUD_ACCOUNT_STORAGE_KEY = 'forgepath-cloud-account-v1'
export const CLOUD_DEVICE_STORAGE_KEY = 'forgepath-cloud-device-v1'
export const CLOUD_OUTBOX_STORAGE_KEY = 'forgepath-cloud-outbox-v1'
export const CLOUD_VERSION_STORAGE_KEY = 'forgepath-cloud-server-version-v1'
export const CLOUD_LAST_SYNC_STORAGE_KEY = 'forgepath-cloud-last-sync-v1'
export const HOME_SCREEN_AUTH_QUERY = 'forgepath_auth'
export const HOME_SCREEN_AUTH_VALUE = 'home-screen'
const HOME_SCREEN_CODE_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'
const HOME_SCREEN_CODE_LENGTH = 20

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

export type CloudBootstrapPlan = 'cloud' | 'pending' | 'conflict' | 'empty'
export type CloudMutationPlan = 'none' | 'retry' | 'stage'

export function planCloudBootstrap(snapshot: CloudSnapshot | null, pending: PendingSnapshot | null): CloudBootstrapPlan {
  if (!pending) return snapshot ? 'cloud' : 'empty'
  if (snapshot?.backup.integrity.value === pending.backup.integrity.value) return 'cloud'
  if ((!snapshot && pending.baseVersion === 0) || snapshot?.serverVersion === pending.baseVersion) return 'pending'
  return 'conflict'
}

export function planCloudMutation(currentChecksum: string, confirmedChecksum: string | null, pendingChecksum: string | null): CloudMutationPlan {
  if (currentChecksum === confirmedChecksum && !pendingChecksum) return 'none'
  if (currentChecksum === pendingChecksum) return 'retry'
  return 'stage'
}

type PushRpcRow = {
  status?: string
  server_version?: number
  event_id?: string
  message?: string
}

export type ForgePathCloudClient = SupabaseClient<ForgePathDatabase>

let cloudClient: ForgePathCloudClient | null = null
let cloudClientPromise: Promise<ForgePathCloudClient> | null = null

export function persistentCloudAuthOptions(storage: Storage) {
  return {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage
  } as const
}

export async function getCloudClient() {
  if (cloudConfiguration.status !== 'ready') return null
  if (cloudClient) return cloudClient
  if (!cloudClientPromise) {
    const { url, publishableKey } = cloudConfiguration
    cloudClientPromise = import('@supabase/supabase-js').then(({ createClient }) => createClient<ForgePathDatabase>(url, publishableKey, {
      // Keep Supabase's existing default storage key so already-verified browsers remain signed in.
      // Supplying persistent browser storage explicitly prevents an SDK default change from silently
      // turning the private alpha into an in-memory session that disappears on refresh.
      auth: persistentCloudAuthOptions(requireBrowserStorage())
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

export function prepareCloudStorageForAccount(userId: string, storage: Storage) {
  if (!uuidPattern.test(userId)) throw new Error('The signed-in cloud account has an invalid identity.')
  const priorAccount = storage.getItem(CLOUD_ACCOUNT_STORAGE_KEY)
  if (priorAccount === userId) return false
  storage.removeItem(CLOUD_DEVICE_STORAGE_KEY)
  storage.removeItem(`${CLOUD_DEVICE_STORAGE_KEY}:sequence`)
  storage.removeItem(CLOUD_VERSION_STORAGE_KEY)
  storage.removeItem(CLOUD_LAST_SYNC_STORAGE_KEY)
  storage.removeItem(CLOUD_OUTBOX_STORAGE_KEY)
  storage.setItem(CLOUD_ACCOUNT_STORAGE_KEY, userId)
  return true
}

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
  const current = readPendingSnapshot(storage)
  if (!current || current.eventId === result.eventId) {
    storage.removeItem(CLOUD_OUTBOX_STORAGE_KEY)
    return
  }
  // A later local change may have replaced the outbox while this request was in flight.
  // Keep that newer payload and advance only its expected server version so it can follow
  // the confirmed event without producing a false same-device conflict.
  storage.setItem(CLOUD_OUTBOX_STORAGE_KEY, JSON.stringify({
    ...current,
    baseVersion: result.serverVersion
  } satisfies PendingSnapshot))
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
  const storage = cloudAuthoritativeStorage()
  const { client, session } = await requireAuthenticatedClient()
  prepareCloudStorageForAccount(session.user.id, storage)
  return pushCloudSnapshotUsing(state, client, session, storage)
}

function cloudAuthoritativeStorage(): Storage {
  return requireBrowserStorage()
}

export function stageCloudSnapshot(state: RestorableAppState, storage = requireBrowserStorage()) {
  return queueCloudSnapshot(createBackup(state), storage)
}

export async function pushCloudSnapshotUsing(state: RestorableAppState, client: ForgePathCloudClient, session: Session, storage: Storage): Promise<CloudPushResult> {
  const currentBackup = createBackup(state)
  const existing = readPendingSnapshot(storage)
  const pending = existing ?? queueCloudSnapshot(currentBackup, storage)
  const first = await sendPending(client, session, pending, storage)
  if (first.status === 'conflict' || pending.backup.integrity.value === currentBackup.integrity.value) return first
  return sendPending(client, session, queueCloudSnapshot(currentBackup, storage), storage)
}

export function parseCloudSnapshotRow(data: {
  payload: Json
  version: unknown
  updated_at: unknown
  checksum: unknown
  schema_version: unknown
  app_version: unknown
}): CloudSnapshot {
  // The projection columns describe the payload as it was stored, so they must be compared with the
  // stored envelope, not with the result of migrating it forward. Comparing against the migrated copy
  // rejected every snapshot written before the current schema, which locks an athlete out of their own
  // data the moment the schema moves. parseBackup still verifies the payload's own integrity.
  const stored = data.payload as Record<string, unknown> | null
  const storedEnvelope = stored && typeof stored === 'object' && !Array.isArray(stored) ? stored : null
  const storedIntegrity = storedEnvelope && typeof storedEnvelope.integrity === 'object' && storedEnvelope.integrity !== null
    ? (storedEnvelope.integrity as Record<string, unknown>)
    : null
  const storedChecksum = String(storedIntegrity?.value ?? '')
  const storedSchemaVersion = Number(storedEnvelope?.schemaVersion)
  const storedAppVersion = String(storedEnvelope?.appVersion ?? '')
  const preview = parseBackup(JSON.stringify(data.payload))
  if (String(data.checksum ?? '') !== storedChecksum) throw new Error('The cloud copy checksum does not match its verified backup.')
  if (Number(data.schema_version) !== storedSchemaVersion) throw new Error('The cloud copy schema metadata does not match its verified backup.')
  if (String(data.app_version ?? '') !== storedAppVersion) throw new Error('The cloud copy app metadata does not match its verified backup.')
  const serverVersion = Number(data.version)
  if (!Number.isSafeInteger(serverVersion) || serverVersion < 1) throw new Error('The cloud copy has an invalid version.')
  const updatedAt = String(data.updated_at)
  if (!validIsoDate(updatedAt)) throw new Error('The cloud copy has an invalid update time.')
  return { backup: preview.backup, serverVersion, updatedAt }
}

export async function fetchCloudSnapshot(): Promise<CloudSnapshot | null> {
  const { client, session } = await requireAuthenticatedClient()
  const storage = cloudAuthoritativeStorage()
  prepareCloudStorageForAccount(session.user.id, storage)
  const { data, error } = await client
    .from('forgepath_state_snapshots')
    .select('payload,version,updated_at,checksum,schema_version,app_version')
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  return parseCloudSnapshotRow(data)
}

export function acceptCloudSnapshot(serverVersion: number, storage = requireBrowserStorage()) {
  if (!Number.isSafeInteger(serverVersion) || serverVersion < 1) throw new Error('The accepted cloud version is invalid.')
  storage.setItem(CLOUD_VERSION_STORAGE_KEY, String(serverVersion))
  storage.setItem(CLOUD_LAST_SYNC_STORAGE_KEY, new Date().toISOString())
  storage.removeItem(CLOUD_OUTBOX_STORAGE_KEY)
}

export function restoreVerifiedCloudSnapshot(snapshot: CloudSnapshot, restoreState: (state: RestorableAppState) => void, storage = requireBrowserStorage()) {
  restoreState(snapshot.backup.data)
  acceptCloudSnapshot(snapshot.serverVersion, storage)
}

export function localCloudMetadata(storage = typeof window === 'undefined' ? null : window.localStorage) {
  return {
    lastSyncedAt: storage?.getItem(CLOUD_LAST_SYNC_STORAGE_KEY) ?? null,
    serverVersion: storage ? localServerVersion(storage) : 0,
    hasPendingUpload: Boolean(storage?.getItem(CLOUD_OUTBOX_STORAGE_KEY))
  }
}

export function isInstalledHomeScreenApp() {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false
  const iosStandalone = Boolean((navigator as Navigator & { standalone?: boolean }).standalone)
  return iosStandalone || window.matchMedia?.('(display-mode: standalone)').matches === true
}

export function isHomeScreenAuthCallback(location = typeof window === 'undefined' ? null : window.location) {
  if (!location) return false
  return new URLSearchParams(location.search).get(HOME_SCREEN_AUTH_QUERY) === HOME_SCREEN_AUTH_VALUE
}

export function homeScreenSignInRedirect(baseUrl: string) {
  const redirect = new URL(baseUrl)
  redirect.searchParams.set(HOME_SCREEN_AUTH_QUERY, HOME_SCREEN_AUTH_VALUE)
  return redirect.toString()
}

export function createHomeScreenHandoffCode(bytes = crypto.getRandomValues(new Uint8Array(HOME_SCREEN_CODE_LENGTH))) {
  if (bytes.length < HOME_SCREEN_CODE_LENGTH) throw new Error('ForgePath could not create a secure Home Screen code.')
  return Array.from(bytes.slice(0, HOME_SCREEN_CODE_LENGTH), (byte) => HOME_SCREEN_CODE_ALPHABET[byte & 31]).join('')
}

export function normalizeHomeScreenHandoffCode(value: string) {
  return value.toUpperCase().replace(/[^2-9A-HJ-NP-Z]/g, '').slice(0, HOME_SCREEN_CODE_LENGTH)
}

export function formatHomeScreenHandoffCode(value: string) {
  return normalizeHomeScreenHandoffCode(value).replace(/(.{4})(?=.)/g, '$1 ')
}

export async function hashHomeScreenHandoffCode(value: string) {
  const normalized = normalizeHomeScreenHandoffCode(value)
  if (normalized.length !== HOME_SCREEN_CODE_LENGTH) throw new Error('Enter the complete Home Screen code shown in Safari.')
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(normalized))
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

export async function requestPrivateSignIn(email: string, forHomeScreen = false) {
  const client = await getCloudClient()
  if (!client) throw new Error(cloudConfiguration.status === 'ready' ? 'The ForgePath cloud client could not start.' : cloudConfiguration.reason)
  const appBase = new URL(import.meta.env.BASE_URL, window.location.origin).toString()
  const redirectTo = forHomeScreen ? homeScreenSignInRedirect(appBase) : appBase
  await requestPrivateSignInUsing(client, email, redirectTo)
}

type PasswordlessClient = {
  auth: {
    signInWithOtp: (credentials: { email: string; options: { shouldCreateUser: false; emailRedirectTo: string } }) => Promise<{ error: { code?: string; message?: string } | null }>
  }
}

function isUninvitedEmailError(error: { code?: string; message?: string }) {
  const code = error.code?.toLowerCase() ?? ''
  const message = error.message?.toLowerCase() ?? ''
  return code === 'signup_disabled' || code === 'user_not_found' || /signups? not allowed|user not found|not registered/.test(message)
}

function isEmailRateLimitError(error: { code?: string; message?: string }) {
  const code = error.code?.toLowerCase() ?? ''
  const message = error.message?.toLowerCase() ?? ''
  return code.includes('rate_limit') || /rate limit|wait .*second|email.*recently/.test(message)
}

function emailRateLimitMessage(error: { code?: string; message?: string }) {
  const code = error.code?.toLowerCase() ?? ''
  const message = error.message?.toLowerCase() ?? ''
  if (code === 'over_email_send_rate_limit') {
    return 'Supabase has temporarily paused new sign-in emails. Use the newest ForgePath email already received. If none arrives, wait before trying again. Your account is not locked.'
  }
  if (code === 'over_request_rate_limit') {
    return 'Too many sign-in requests came from this connection. Wait a few minutes, then try once. Your account is not locked.'
  }
  if (/wait .*second|email.*recently/.test(message)) {
    return 'A sign-in email was requested recently. Wait one minute, then try once. Your account is not locked.'
  }
  return 'Sign-in email requests are temporarily limited. Use the newest ForgePath email already received, or wait before trying once more. Your account is not locked.'
}

export async function requestPrivateSignInUsing(client: PasswordlessClient, email: string, redirectTo: string) {
  const normalized = email.trim().toLowerCase()
  if (!/^\S+@\S+\.\S+$/.test(normalized)) throw new Error('Enter the email address invited by the creator.')
  const { error } = await client.auth.signInWithOtp({
    email: normalized,
    options: { shouldCreateUser: false, emailRedirectTo: redirectTo }
  })
  // Do not reveal whether an email is on the private invitation list.
  if (!error || isUninvitedEmailError(error)) return
  if (isEmailRateLimitError(error)) throw new Error(emailRateLimitMessage(error))
  throw new Error('ForgePath could not send a private sign-in link. Check your connection and try again.')
}

type HomeScreenHandoffClient = {
  functions: {
    invoke: (name: string, options: { body: { action: 'create' | 'redeem'; codeHash: string } }) => Promise<{
      data: { tokenHash?: string; expiresInSeconds?: number; error?: string; errorCode?: string } | null
      error: { message?: string; context?: Response } | null
    }>
  }
  auth: {
    verifyOtp: (credentials: { token_hash: string; type: 'magiclink' }) => Promise<{ error: { message?: string } | null }>
  }
}

async function homeScreenFunctionErrorCode(data: { errorCode?: string } | null, error: { context?: Response } | null) {
  if (data?.errorCode) return data.errorCode
  if (!error?.context) return null
  try {
    const payload = await error.context.clone().json() as { errorCode?: unknown }
    return typeof payload.errorCode === 'string' ? payload.errorCode : null
  } catch {
    return null
  }
}

export async function createHomeScreenHandoffUsing(client: HomeScreenHandoffClient, code: string) {
  const codeHash = await hashHomeScreenHandoffCode(code)
  const { data, error } = await client.functions.invoke('pwa-handoff', { body: { action: 'create', codeHash } })
  if (error || !data?.expiresInSeconds) {
    const errorCode = await homeScreenFunctionErrorCode(data, error)
    if (errorCode === 'AUTH_STALE') throw new Error('This browser verification is older than ten minutes. Use the newest ForgePath email link, then create the Home Screen code right away.')
    if (errorCode === 'AUTH_REQUIRED') throw new Error('This browser is not signed in to ForgePath. Use the newest email link in this browser, then create the Home Screen code.')
    throw new Error('ForgePath could not create the Home Screen code. Open the newest email sign-in link and try once more.')
  }
  return data.expiresInSeconds
}

export async function createHomeScreenHandoff() {
  const client = await getCloudClient()
  if (!client) throw new Error(cloudConfiguration.status === 'ready' ? 'The ForgePath cloud client could not start.' : cloudConfiguration.reason)
  const code = createHomeScreenHandoffCode()
  const expiresInSeconds = await createHomeScreenHandoffUsing(client, code)
  return { code, expiresInSeconds }
}

export async function redeemHomeScreenHandoffUsing(client: HomeScreenHandoffClient, code: string) {
  const codeHash = await hashHomeScreenHandoffCode(code)
  const { data, error } = await client.functions.invoke('pwa-handoff', { body: { action: 'redeem', codeHash } })
  if (error || !data?.tokenHash) {
    const errorCode = await homeScreenFunctionErrorCode(data, error)
    if (errorCode === 'CODE_INVALID') throw new Error('That Home Screen code is invalid, expired, or already finished. Create a fresh code in your verified browser, then enter it within five minutes.')
    if (errorCode === 'TOKEN_CREATE_FAILED') throw new Error('Supabase could not prepare the Home Screen session. Try the same code once more; if it still fails, create a fresh code in your verified browser.')
    throw new Error('ForgePath could not verify that Home Screen code. Check the code and connection, then try once more.')
  }
  const { error: verificationError } = await client.auth.verifyOtp({ token_hash: data.tokenHash, type: 'magiclink' })
  if (verificationError) throw new Error('ForgePath could not finish signing in on the Home Screen. Create a fresh code in your verified browser and try once more.')
}

export async function redeemHomeScreenHandoff(code: string) {
  const client = await getCloudClient()
  if (!client) throw new Error(cloudConfiguration.status === 'ready' ? 'The ForgePath cloud client could not start.' : cloudConfiguration.reason)
  await redeemHomeScreenHandoffUsing(client, code)
}

export async function resetCloudData() {
  const { client } = await requireAuthenticatedClient()
  const { data, error } = await client.rpc('reset_forgepath_data', { p_confirmation: 'RESET' })
  if (error) throw error
  return data
}

export async function deleteCloudAccount() {
  const { client } = await requireAuthenticatedClient()
  const { data, error } = await client.functions.invoke('delete-account', { body: { confirmation: 'DELETE' } })
  if (error) throw error
  return data
}

export async function signOutCloud() {
  const client = await getCloudClient()
  if (!client) return
  const { error } = await client.auth.signOut()
  if (error) throw error
}
