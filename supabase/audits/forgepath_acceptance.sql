-- Read-only ForgePath production acceptance audit.
-- Run after every migration. It returns evidence only and changes no athlete data.

with expected(version, name, statement_count, content_sha256) as (
  values
    ('20260811000100'::text, 'forgepath_cloud_foundation'::text, 1, 'c18793b38bfcfa6b45b483bc1be0c4a9051cc50649efd4c8c38946559331813c'::text),
    ('20260811000200'::text, 'forgepath_training_core'::text, 1, '50484d39e0ef86cbe49cce813357586d185fa23b1e7c3847a88b9bc45ceef5c8'::text),
    ('20260813000100'::text, 'forgepath_account_controls'::text, 1, '18a316cb8c7657f15a0ffc6e8cf556e388de411cde9695499f9f01d96d2ebfd8'::text)
), actual as (
  select
    version,
    name,
    cardinality(statements) as statement_count,
    encode(extensions.digest(statements[1], 'sha256'), 'hex') as content_sha256
  from supabase_migrations.schema_migrations
)
select
  'migration_ledger' as check_name,
  bool_and(actual.version is not null
    and actual.name = expected.name
    and actual.statement_count = expected.statement_count
    and actual.content_sha256 = expected.content_sha256) as passed,
  jsonb_agg(jsonb_build_object(
    'version', expected.version,
    'expected_name', expected.name,
    'actual_name', actual.name,
    'expected_sha256', expected.content_sha256,
    'actual_sha256', actual.content_sha256
  ) order by expected.version) as evidence
from expected
left join actual using (version)

union all

select
  'table_rls' as check_name,
  count(*) = 14 and bool_and(c.relrowsecurity and c.relforcerowsecurity) as passed,
  jsonb_build_object(
    'table_count', count(*),
    'rls_enabled_count', count(*) filter (where c.relrowsecurity),
    'force_rls_count', count(*) filter (where c.relforcerowsecurity)
  ) as evidence
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind = 'r'
  and c.relname like 'forgepath_%'

union all

select
  'normalized_browser_mutation_grants' as check_name,
  count(*) = 0 as passed,
  jsonb_build_object('unexpected_grants', coalesce(jsonb_agg(jsonb_build_object(
    'grantee', grantee,
    'table', table_name,
    'privilege', privilege_type
  )) filter (where grantee is not null), '[]'::jsonb)) as evidence
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name like 'forgepath_%'
  and table_name not in ('forgepath_profiles', 'forgepath_devices')
  and grantee in ('anon', 'authenticated')
  and privilege_type in ('INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'TRIGGER', 'REFERENCES')

union all

select
  'ownership_mutation_grants' as check_name,
  count(*) = 4
    and count(*) filter (where table_name = 'forgepath_profiles' and privilege_type in ('INSERT', 'UPDATE')) = 2
    and count(*) filter (where table_name = 'forgepath_devices' and privilege_type in ('INSERT', 'UPDATE')) = 2
    and bool_and(grantee = 'authenticated') as passed,
  jsonb_build_object('expected_grants', coalesce(jsonb_agg(jsonb_build_object(
    'grantee', grantee,
    'table', table_name,
    'privilege', privilege_type
  ) order by table_name, privilege_type), '[]'::jsonb)) as evidence
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name in ('forgepath_profiles', 'forgepath_devices')
  and grantee in ('anon', 'authenticated')
  and privilege_type in ('INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'TRIGGER', 'REFERENCES')

union all

select
  'volume_view_security' as check_name,
  count(*) = 2 and bool_and(coalesce(array_to_string(c.reloptions, ','), '') like '%security_invoker=true%') as passed,
  jsonb_build_object('views', coalesce(jsonb_agg(jsonb_build_object(
    'view', c.relname,
    'options', c.reloptions
  ) order by c.relname), '[]'::jsonb)) as evidence
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind = 'v'
  and c.relname in ('forgepath_volume_facts', 'forgepath_volume_rollups')

union all

select
  'snapshot_rpc' as check_name,
  count(*) = 1
    and bool_and(p.prosecdef)
    and bool_and(pg_get_function_result(p.oid) = 'jsonb')
    and bool_and(has_function_privilege('authenticated', p.oid, 'EXECUTE'))
    and not bool_or(has_function_privilege('anon', p.oid, 'EXECUTE')) as passed,
  jsonb_build_object(
    'function_count', count(*),
    'security_definer_count', count(*) filter (where p.prosecdef),
    'authenticated_execute', bool_or(has_function_privilege('authenticated', p.oid, 'EXECUTE')),
    'anon_execute', bool_or(has_function_privilege('anon', p.oid, 'EXECUTE'))
  ) as evidence
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname = 'push_forgepath_snapshot'

union all

select
  'account_reset_rpc' as check_name,
  count(*) = 1
    and bool_and(p.prosecdef)
    and bool_and(pg_get_function_result(p.oid) = 'jsonb')
    and bool_and(has_function_privilege('authenticated', p.oid, 'EXECUTE'))
    and not bool_or(has_function_privilege('anon', p.oid, 'EXECUTE')) as passed,
  jsonb_build_object(
    'function_count', count(*),
    'security_definer_count', count(*) filter (where p.prosecdef),
    'authenticated_execute', bool_or(has_function_privilege('authenticated', p.oid, 'EXECUTE')),
    'anon_execute', bool_or(has_function_privilege('anon', p.oid, 'EXECUTE'))
  ) as evidence
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname = 'reset_forgepath_data';
