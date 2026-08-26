import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { resolve } from 'node:path'

const manifestPath = resolve('supabase/migrations/manifest.json')
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
const migrationDirectory = resolve('supabase/migrations')
const [foundationEntry, trainingCoreEntry, accountControlsEntry, snapshotContractEntry, homeScreenHandoffEntry] = manifest.migrations
const foundationPath = resolve(migrationDirectory, foundationEntry.file)
const trainingCorePath = resolve(migrationDirectory, trainingCoreEntry.file)
const accountControlsPath = resolve(migrationDirectory, accountControlsEntry.file)
const snapshotContractPath = resolve(migrationDirectory, snapshotContractEntry.file)
const homeScreenHandoffPath = resolve(migrationDirectory, homeScreenHandoffEntry.file)
const foundation = readFileSync(foundationPath, 'utf8')
const trainingCore = readFileSync(trainingCorePath, 'utf8')
const accountControls = readFileSync(accountControlsPath, 'utf8')
const snapshotContract = readFileSync(snapshotContractPath, 'utf8')
const homeScreenHandoff = readFileSync(homeScreenHandoffPath, 'utf8')
const migration = `${foundation}\n${trainingCore}\n${accountControls}\n${snapshotContract}\n${homeScreenHandoff}`
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

if (manifest.schemaVersion !== 1 || manifest.migrations.length !== 5) failures.push('migration manifest shape is invalid')
for (const entry of manifest.migrations) {
  if (`${entry.version}_${entry.name}.sql` !== entry.file) failures.push(`${entry.file} does not match its version and name`)
  const contents = readFileSync(resolve(migrationDirectory, entry.file))
  const digest = createHash('sha256').update(contents).digest('hex')
  if (digest !== entry.sha256) failures.push(`${entry.file} checksum drifted from the reviewed migration manifest`)
  if (entry.remoteStatementCount !== 1) failures.push(`${entry.file} remote statement count no longer matches the repaired migration ledger`)
}

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
  'forgepath_state_snapshots_envelope_contract',
  'forgepath_sync_events_envelope_contract',
  "p_payload #>> '{integrity,value}' is distinct from p_checksum",
  'v_existing_device_sequence is distinct from p_device_sequence',
  'v_existing_payload is distinct from p_payload',
  'Event ID was reused with different content or ownership'
]) {
  if (!snapshotContract.includes(evidence)) failures.push(`snapshot envelope safety evidence is missing: ${evidence}`)
}

for (const evidence of [
  'reset_forgepath_data',
  "p_confirmation <> 'RESET'",
  "auth.jwt() ->> 'iat'",
  'Recent sign-in required',
  'delete from public.forgepath_state_snapshots where user_id = v_user_id',
  'grant execute on function public.reset_forgepath_data(text) to authenticated'
]) {
  if (!accountControls.includes(evidence)) failures.push(`account data control evidence is missing: ${evidence}`)
}

const deleteAccountFunction = readFileSync(resolve('supabase/functions/delete-account/index.ts'), 'utf8')
for (const evidence of ['createSupabaseContext', "auth: 'user'", 'supabaseAdmin.auth.admin.deleteUser', "body.confirmation !== 'DELETE'", 'Recent sign-in required', 'allowedOrigins.has(origin)']) {
  if (!deleteAccountFunction.includes(evidence)) failures.push(`account deletion evidence is missing: ${evidence}`)
}
if (/VITE_|localStorage|sessionStorage/.test(deleteAccountFunction)) failures.push('account deletion function risks exposing privileged configuration or browser storage')

for (const evidence of ['forgepath_auth_handoffs', 'code_hash text not null unique', 'expires_at timestamptz not null', 'redeemed_at timestamptz', 'enable row level security', 'force row level security', 'revoke all on public.forgepath_auth_handoffs from public, anon, authenticated']) {
  if (!homeScreenHandoff.includes(evidence)) failures.push(`Home Screen handoff migration evidence is missing: ${evidence}`)
}

const pwaHandoffFunction = readFileSync(resolve('supabase/functions/pwa-handoff/index.ts'), 'utf8')
for (const evidence of ['allowedOrigins.has(origin)', 'cache-control', 'recentSignInSeconds', "body.action === 'create'", "body.action === 'redeem'", ".is('redeemed_at', null)", ".gt('expires_at', redeemedAt)", "generateLink({ type: 'magiclink', email })", 'hashed_token']) {
  if (!pwaHandoffFunction.includes(evidence)) failures.push(`Home Screen handoff function evidence is missing: ${evidence}`)
}
if (/localStorage|sessionStorage|VITE_/.test(pwaHandoffFunction)) failures.push('Home Screen handoff function risks exposing browser storage or build-time credentials')

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
if (!supabaseConfig.includes('https://falatua.github.io/adaptive-strength-hypertrophy-app-pages/?forgepath_auth=home-screen')) failures.push('the exact production Home Screen email callback is not allow-listed')
if (!supabaseConfig.includes('[functions.pwa-handoff]') || !supabaseConfig.includes('verify_jwt = false')) failures.push('the signed-out Home Screen redemption endpoint is not explicitly configured for application-level verification')

const deployWorkflow = readFileSync(resolve('.github/workflows/deploy-pages.yml'), 'utf8')
if (!deployWorkflow.includes("vars.FORGEPATH_CLOUD_RELEASE_ENABLED == 'true'")) failures.push('Pages does not gate cloud configuration behind the remote-auth release switch')
if (!deployWorkflow.includes('secrets.FORGEPATH_SUPABASE_URL') || !deployWorkflow.includes('secrets.FORGEPATH_SUPABASE_PUBLISHABLE_KEY')) failures.push('Pages is missing browser-safe ForgePath secret references')

const acceptanceAudit = readFileSync(resolve('supabase/audits/forgepath_acceptance.sql'), 'utf8')
for (const entry of manifest.migrations) {
  if (!acceptanceAudit.includes(entry.version) || !acceptanceAudit.includes(entry.sha256)) failures.push(`production acceptance audit is missing ${entry.file}`)
}

const transactionalAudit = readFileSync(resolve('supabase/audits/forgepath_transactional_sync_test.sql'), 'utf8')
for (const evidence of ['normalized_projection_write_denied', 'snapshot_apply', 'snapshot_idempotent_replay', 'idempotent_replay_metadata_rejected', 'snapshot_envelope_rejected', 'snapshot_conflict_preserved', 'snapshot_invariants', 'cross_athlete_isolation', 'rollback;']) {
  if (!transactionalAudit.includes(evidence)) failures.push(`transactional production audit is missing ${evidence}`)
}
for (const evidence of ['migration_ledger', 'table_rls', 'home_screen_handoff_grants', 'normalized_browser_mutation_grants', 'ownership_mutation_grants', 'volume_view_security', 'snapshot_rpc', 'snapshot_envelope_constraints', 'stored_snapshot_envelopes']) {
  if (!acceptanceAudit.includes(`'${evidence}'`)) failures.push(`production acceptance audit is missing ${evidence}`)
}

if (failures.length) {
  console.error(`Supabase foundation QC failed:\n- ${failures.join('\n- ')}`)
  process.exit(1)
}

console.log(`Supabase foundation QC passed for ${manifest.migrations.length} checksum-locked migrations, ${requiredTables.length + 1} RLS-protected tables, a server-only one-time Home Screen handoff, two security-invoker volume views, explicit survey missingness, and the idempotent conflict-preserving snapshot RPC.`)
