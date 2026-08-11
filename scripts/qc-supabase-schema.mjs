import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const migrationPath = resolve('supabase/migrations/20260811000100_forgepath_cloud_foundation.sql')
const migration = readFileSync(migrationPath, 'utf8')
const requiredTables = ['forgepath_profiles', 'forgepath_devices', 'forgepath_sync_events', 'forgepath_state_snapshots', 'forgepath_sync_conflicts']
const failures = []

for (const table of requiredTables) {
  if (!migration.includes(`create table public.${table}`)) failures.push(`${table} is missing`)
  if (!migration.includes(`alter table public.${table} enable row level security`)) failures.push(`${table} does not enable RLS`)
  if (!migration.includes(`alter table public.${table} force row level security`)) failures.push(`${table} does not force RLS`)
  if (!migration.includes(`revoke all on public.${table} from anon, authenticated`)) failures.push(`${table} does not revoke default browser access`)
}

for (const evidence of ['auth.uid()', 'pg_advisory_xact_lock', 'Idempotent replay accepted', "'conflict'", 'octet_length(p_payload::text) > 26214400']) {
  if (!migration.includes(evidence)) failures.push(`sync safety evidence is missing: ${evidence}`)
}

const envExample = readFileSync(resolve('.env.example'), 'utf8')
if (/service.role|password|secret/i.test(envExample)) failures.push('.env.example names a server-only credential')
if (!envExample.includes('VITE_SUPABASE_PUBLISHABLE_KEY')) failures.push('browser-safe publishable key variable is missing')

if (failures.length) {
  console.error(`Supabase foundation QC failed:\n- ${failures.join('\n- ')}`)
  process.exit(1)
}

console.log(`Supabase foundation QC passed for ${requiredTables.length} RLS-protected tables and the idempotent conflict-preserving RPC.`)
