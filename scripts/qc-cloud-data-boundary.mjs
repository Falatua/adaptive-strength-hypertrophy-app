import { readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'

const store = readFileSync(resolve('src/store/useAppStore.ts'), 'utf8')
const sync = readFileSync(resolve('src/services/cloud-sync.ts'), 'utf8')
const root = readFileSync(resolve('src/components/CloudAppRoot.tsx'), 'utf8')
const panel = readFileSync(resolve('src/components/CloudSyncPanel.tsx'), 'utf8')
const config = readFileSync(resolve('src/services/cloud-config.ts'), 'utf8')
const shell = readFileSync(resolve('src/services/app-shell.ts'), 'utf8')
const failures = []
const sourceFiles = (directory) => readdirSync(resolve(directory), { withFileTypes: true }).flatMap((entry) => {
  const path = resolve(directory, entry.name)
  return entry.isDirectory() ? sourceFiles(path) : entry.name.endsWith('.ts') || entry.name.endsWith('.tsx') ? [path] : []
})
const jsonComparisonSources = [...sourceFiles('src/domain'), resolve('src/store/useAppStore.ts')]
  .map((path) => readFileSync(path, 'utf8'))
  .join('\n')

if (!store.includes("if (typeof window !== 'undefined' && !cloudAuthoritativeBuild) window.localStorage.setItem")) {
  failures.push('the Zustand application store can write training state in a cloud-authoritative build')
}
if (!sync.includes('const cloudPayloadMemory = new Map<string, string>()')) failures.push('the automatic cloud outbox is not memory-only')
if (!sync.includes("key === CLOUD_OUTBOX_STORAGE_KEY ? cloudPayloadMemory.set(key, value) : browser.setItem(key, value)")) {
  failures.push('the automatic cloud outbox can write a training payload to browser storage')
}
if (!root.includes('window.localStorage.removeItem(LEGACY_APP_STORAGE_KEY)')) failures.push('the verified one-time migration does not remove the legacy training copy')
if (!root.includes("window.addEventListener('beforeunload', protectUnsavedCloudChange)") || !root.includes("saveState !== 'saving' && saveState !== 'error'")) failures.push('the browser can close without warning while a cloud change is pending or failed')
if (!root.includes('if (saveTimer.current) {') || !root.includes('await saveNow()') || !root.includes('await flushPendingSave()') || !root.includes('if (lastSaveFailure.current) throw lastSaveFailure.current')) failures.push('sign-out can bypass or swallow a cloud save that is still waiting in the debounce timer')
if (!root.includes('await fetchCloudSnapshot()') || !root.includes('await pushCloudSnapshot(currentState)')) failures.push('cloud bootstrap does not prove a remote source of truth')
if (!sync.includes('CLOUD_ACCOUNT_STORAGE_KEY') || !sync.includes('prepareCloudStorageForAccount(session.user.id')) failures.push('cloud device and version metadata are not isolated by signed-in account')
if (!sync.includes("select('payload,version,updated_at,checksum,schema_version,app_version')")) failures.push('cloud restore does not compare snapshot projection metadata with its verified backup envelope')
if (!sync.includes('parseCloudSnapshotRow(data)')) failures.push('cloud snapshot rows do not pass through the reviewed restore contract')
const restoreIndex = sync.indexOf('restoreState(snapshot.backup.data)')
const acceptIndex = sync.indexOf('acceptCloudSnapshot(snapshot.serverVersion, storage)')
if (!root.includes('restoreVerifiedCloudSnapshot(snapshot') || restoreIndex < 0 || acceptIndex < 0 || restoreIndex > acceptIndex) failures.push('cloud bootstrap accepts a server version before the verified state restore succeeds')
if (/JSON\.stringify\([^\n]+\)\s*[!=]==?\s*JSON\.stringify\(/.test(jsonComparisonSources)) failures.push('domain or store logic compares JSON using order-sensitive JSON.stringify equality')
if (!sync.includes('persistSession: true') || !sync.includes('autoRefreshToken: true')) failures.push('the browser auth session is not configured for secure renewal')
if (!sync.includes('shouldCreateUser: false') || /\.auth\.signUp\s*\(/.test(sync) || /\.auth\.admin\b/.test(sync)) failures.push('the browser authentication service can escape the invite-only account boundary')
if (!sync.includes('isUninvitedEmailError') || !sync.includes('Do not reveal whether an email is on the private invitation list')) failures.push('the passwordless login path can reveal invitation membership')
if (/signInWithPassword|resetPasswordForEmail|updateCloudPassword|forgepath_password_ready|type=["']password["']/.test(`${sync}\n${root}\n${panel}`)) failures.push('a password authentication path remains in the athlete-facing product')
if (!config.includes("loopback && import.meta.env.VITE_FORGEPATH_LOCAL_E2E === 'true'")) failures.push('the local test override is not restricted to loopback')
if (/VITE_.*(?:SECRET|SERVICE|PASSWORD|PRIVATE)/i.test(`${store}\n${sync}\n${root}\n${config}`)) failures.push('browser source references a privileged Vite credential')
if (!root.includes('void checkForAppUpdate()')) failures.push('cloud bootstrap does not look for a newer build before blaming the saved copy')
if (!root.includes('await readAppVersionStatus()') || !root.includes('if (version.updateAvailable)')) failures.push('cloud bootstrap does not block an exact known old build before loading or saving')
if (!root.includes('refresh={() => { void reloadWithFreshAppShell() }}') || !root.includes('signOut={() => { void signOutCloud()')) failures.push('a failed cloud load strands the athlete with retry as the only control')
if (!shell.includes('registration.unregister()') || !shell.includes('caches.delete(key)') || !shell.includes('window.location.reload()')) failures.push('the app-shell repair does not replace the installed worker and cached app files')
if (!shell.includes('source-version.txt') || !shell.includes("cache: 'no-store'") || !shell.includes('available !== normalizedInstalled')) failures.push('the installed app cannot compare its exact source version with the published build')
if (/localStorage|CLOUD_|restoreBackup|resetForTesting/.test(shell)) failures.push('the app-shell repair reaches into training or cloud state')

if (failures.length) {
  console.error(`Cloud data boundary QC failed:\n- ${failures.join('\n- ')}`)
  process.exit(1)
}

console.log('Cloud data boundary QC passed: Supabase is authoritative, authentication is invitation-only and passwordless, the snapshot outbox is memory-only, exact stale builds are blocked, and failed loads remain recoverable.')
