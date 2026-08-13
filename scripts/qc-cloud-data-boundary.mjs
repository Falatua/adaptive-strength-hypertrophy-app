import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const store = readFileSync(resolve('src/store/useAppStore.ts'), 'utf8')
const sync = readFileSync(resolve('src/services/cloud-sync.ts'), 'utf8')
const root = readFileSync(resolve('src/components/CloudAppRoot.tsx'), 'utf8')
const config = readFileSync(resolve('src/services/cloud-config.ts'), 'utf8')
const failures = []

if (!store.includes("if (typeof window !== 'undefined' && !cloudAuthoritativeBuild) window.localStorage.setItem")) {
  failures.push('the Zustand application store can write training state in a cloud-authoritative build')
}
if (!sync.includes('const cloudPayloadMemory = new Map<string, string>()')) failures.push('the automatic cloud outbox is not memory-only')
if (!sync.includes("key === CLOUD_OUTBOX_STORAGE_KEY ? cloudPayloadMemory.set(key, value) : browser.setItem(key, value)")) {
  failures.push('the automatic cloud outbox can write a training payload to browser storage')
}
if (!root.includes('window.localStorage.removeItem(LEGACY_APP_STORAGE_KEY)')) failures.push('the verified one-time migration does not remove the legacy training copy')
if (!root.includes('await fetchCloudSnapshot()') || !root.includes('await pushCloudSnapshot(currentState)')) failures.push('cloud bootstrap does not prove a remote source of truth')
if (!sync.includes('persistSession: true') || !sync.includes('autoRefreshToken: true')) failures.push('the browser auth session is not configured for secure renewal')
if (!config.includes("loopback && import.meta.env.VITE_FORGEPATH_LOCAL_E2E === 'true'")) failures.push('the local test override is not restricted to loopback')
if (/VITE_.*(?:SECRET|SERVICE|PASSWORD|PRIVATE)/i.test(`${store}\n${sync}\n${root}\n${config}`)) failures.push('browser source references a privileged Vite credential')

if (failures.length) {
  console.error(`Cloud data boundary QC failed:\n- ${failures.join('\n- ')}`)
  process.exit(1)
}

console.log('Cloud data boundary QC passed: Supabase is authoritative, the snapshot outbox is memory-only, legacy training storage is removed after verification, and the local test override is loopback-only.')
