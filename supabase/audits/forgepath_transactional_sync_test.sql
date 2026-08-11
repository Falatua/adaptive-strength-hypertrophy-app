-- Destructive-path acceptance test that is fully rolled back.
-- It creates two temporary auth identities, exercises RLS and snapshot RPC
-- behavior as the authenticated role, returns proof rows, then removes all
-- test state with ROLLBACK.

begin;

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  ('00000000-0000-0000-0000-000000000000', '10000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'forgepath-rls-a@example.com', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '20000000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'forgepath-rls-b@example.com', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now());

create temporary table forgepath_acceptance_results (
  check_name text primary key,
  passed boolean not null,
  evidence jsonb not null
) on commit drop;
grant select, insert, update on table forgepath_acceptance_results to authenticated;

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);
select set_config('request.jwt.claims', '{"sub":"10000000-0000-4000-8000-000000000001","role":"authenticated"}', true);

insert into forgepath_acceptance_results
select 'authenticated_identity', auth.uid() = '10000000-0000-4000-8000-000000000001'::uuid,
  jsonb_build_object('auth_uid', auth.uid());

insert into forgepath_acceptance_results
select 'profile_isolation', count(*) = 1 and bool_and(user_id = auth.uid()),
  jsonb_build_object('visible_profiles', count(*))
from public.forgepath_profiles;

insert into public.forgepath_devices (
  id, user_id, display_name, platform, app_version, schema_version
) values (
  '10000000-0000-4000-8000-000000000010', auth.uid(), 'Acceptance browser', 'Test', '0.39.1', 25
);

insert into forgepath_acceptance_results
select 'own_device_registration', count(*) = 1 and bool_and(user_id = auth.uid()),
  jsonb_build_object('visible_devices', count(*))
from public.forgepath_devices;

do $test$
begin
  begin
    insert into public.forgepath_exercises default values;
    insert into forgepath_acceptance_results values (
      'normalized_projection_write_denied', false, '{"reason":"unexpected insert access"}'
    );
  exception when insufficient_privilege then
    insert into forgepath_acceptance_results values (
      'normalized_projection_write_denied', true, '{"sqlstate":"42501"}'
    );
  end;
end
$test$;

insert into forgepath_acceptance_results
select 'snapshot_apply',
  result ->> 'status' = 'applied' and (result ->> 'server_version')::bigint = 1,
  result
from (
  select public.push_forgepath_snapshot(
    '10000000-0000-4000-8000-000000000020',
    '10000000-0000-4000-8000-000000000010',
    0, 1, 25, '0.39.1', 'cloud-sync-v1', '1234abcd', now(), 'America/Los_Angeles',
    '{"format":"transactional-acceptance","value":1}'::jsonb
  ) as result
) applied;

insert into forgepath_acceptance_results
select 'snapshot_idempotent_replay',
  result ->> 'status' = 'already_applied' and (result ->> 'server_version')::bigint = 1,
  result
from (
  select public.push_forgepath_snapshot(
    '10000000-0000-4000-8000-000000000020',
    '10000000-0000-4000-8000-000000000010',
    0, 1, 25, '0.39.1', 'cloud-sync-v1', '1234abcd', now(), 'America/Los_Angeles',
    '{"format":"transactional-acceptance","value":1}'::jsonb
  ) as result
) replayed;

insert into forgepath_acceptance_results
select 'snapshot_conflict_preserved',
  result ->> 'status' = 'conflict' and (result ->> 'server_version')::bigint = 1,
  result
from (
  select public.push_forgepath_snapshot(
    '10000000-0000-4000-8000-000000000021',
    '10000000-0000-4000-8000-000000000010',
    0, 2, 25, '0.39.1', 'cloud-sync-v1', '5678abcd', now(), 'America/Los_Angeles',
    '{"format":"transactional-acceptance","value":2}'::jsonb
  ) as result
) conflicted;

insert into forgepath_acceptance_results
select 'snapshot_invariants',
  (select count(*) from public.forgepath_state_snapshots) = 1
    and (select version from public.forgepath_state_snapshots) = 1
    and (select count(*) from public.forgepath_sync_events) = 2
    and (select count(*) from public.forgepath_sync_conflicts where status = 'open') = 1,
  jsonb_build_object(
    'visible_snapshots', (select count(*) from public.forgepath_state_snapshots),
    'snapshot_version', (select version from public.forgepath_state_snapshots),
    'visible_events', (select count(*) from public.forgepath_sync_events),
    'open_conflicts', (select count(*) from public.forgepath_sync_conflicts where status = 'open')
  );

select set_config('request.jwt.claim.sub', '20000000-0000-4000-8000-000000000002', true);
select set_config('request.jwt.claims', '{"sub":"20000000-0000-4000-8000-000000000002","role":"authenticated"}', true);

insert into forgepath_acceptance_results
select 'cross_athlete_isolation',
  (select count(*) from public.forgepath_state_snapshots) = 0
    and (select count(*) from public.forgepath_sync_events) = 0
    and (select count(*) from public.forgepath_sync_conflicts) = 0
    and (select count(*) from public.forgepath_devices) = 0,
  jsonb_build_object(
    'visible_snapshots', (select count(*) from public.forgepath_state_snapshots),
    'visible_events', (select count(*) from public.forgepath_sync_events),
    'visible_conflicts', (select count(*) from public.forgepath_sync_conflicts),
    'visible_devices', (select count(*) from public.forgepath_devices)
  );

select check_name, passed, evidence
from forgepath_acceptance_results
order by check_name;

rollback;
