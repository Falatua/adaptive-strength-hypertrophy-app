import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const foundationPath = resolve('supabase/migrations/20260811000100_forgepath_cloud_foundation.sql')
const trainingCorePath = resolve('supabase/migrations/20260811000200_forgepath_training_core.sql')
const foundation = readFileSync(foundationPath, 'utf8')
const trainingCore = readFileSync(trainingCorePath, 'utf8')
const migration = `${foundation}\n${trainingCore}`
const requiredTables = [
  'forgepath_profiles',
  'forgepath_devices',
  'forgepath_sync_events',
  'forgepath_state_snapshots',
  'forgepath_sync_conflicts',
  'forgepath_entity_events',
  'forgepath_sync_cursors',
  'forgepath_exercises',
  'forgepath_workout_sessions',
  'forgepath_workout_movements',
  'forgepath_workout_sets',
  'forgepath_movement_notes',
  'forgepath_survey_instances',
  'forgepath_survey_answers'
]
const failures = []

for (const table of requiredTables) {
  if (!migration.includes(`create table public.${table}`)) failures.push(`${table} is missing`)
  if (!migration.includes(`alter table public.${table} enable row level security`)) failures.push(`${table} does not enable RLS`)
  if (!migration.includes(`alter table public.${table} force row level security`)) failures.push(`${table} does not force RLS`)
  if (!migration.includes(`revoke all on public.${table} from anon, authenticated`)) failures.push(`${table} does not revoke default browser access`)
}

for (const evidence of ['auth.uid()', 'pg_advisory_xact_lock', 'Idempotent replay accepted', "'conflict'", 'octet_length(p_payload::text) > 26214400']) {
  if (!foundation.includes(evidence)) failures.push(`snapshot sync safety evidence is missing: ${evidence}`)
}

for (const evidence of [
  'resulting_version = expected_version + 1',
  'forgepath_entity_events_device_sequence_unique',
  'forgepath_survey_answers_missingness',
  'generated always as (normalized_load_kg * reps) stored',
  "'day'::text as period_kind",
  "'week'::text",
  "'month'::text",
  "'year'::text",
  "'primary_region'::text",
  'with (security_invoker = true)'
]) {
  if (!trainingCore.includes(evidence)) failures.push(`normalized training evidence is missing: ${evidence}`)
}

for (const table of requiredTables.slice(5)) {
  if (/grant\s+(insert|update|delete|all)[^;]*on\s+public\./i.test(trainingCore)) {
    failures.push('normalized training projections grant browser mutation access')
    break
  }
  if (!trainingCore.includes(`create policy "athletes_select_own_${table.replace('forgepath_', '')}`) && !['forgepath_entity_events', 'forgepath_sync_cursors'].includes(table)) {
    failures.push(`${table} does not expose an athlete-owned select policy`)
  }
}

const envExample = readFileSync(resolve('.env.example'), 'utf8')
if (/service.role|password|secret/i.test(envExample)) failures.push('.env.example names a server-only credential')
if (!envExample.includes('VITE_SUPABASE_PUBLISHABLE_KEY')) failures.push('browser-safe publishable key variable is missing')

const supabaseConfig = readFileSync(resolve('supabase/config.toml'), 'utf8')
if (!supabaseConfig.includes('enable_signup = false')) failures.push('local Supabase configuration does not preserve invite-only signup')
if (!supabaseConfig.includes('enable_anonymous_sign_ins = false')) failures.push('local Supabase configuration allows anonymous sign-ins')

const deployWorkflow = readFileSync(resolve('.github/workflows/deploy-pages.yml'), 'utf8')
if (!deployWorkflow.includes("vars.FORGEPATH_CLOUD_RELEASE_ENABLED == 'true'")) failures.push('Pages does not gate cloud configuration behind the remote-auth release switch')
if (!deployWorkflow.includes('secrets.FORGEPATH_SUPABASE_URL') || !deployWorkflow.includes('secrets.FORGEPATH_SUPABASE_PUBLISHABLE_KEY')) failures.push('Pages is missing browser-safe ForgePath secret references')

if (failures.length) {
  console.error(`Supabase foundation QC failed:\n- ${failures.join('\n- ')}`)
  process.exit(1)
}

console.log(`Supabase foundation QC passed for ${requiredTables.length} RLS-protected tables, two security-invoker volume views, explicit survey missingness, and the idempotent conflict-preserving snapshot RPC.`)
