-- Locks the cloud projection to the same integrity envelope the browser verifies.
-- This prevents row metadata drift, cross-account event reuse, and partial
-- idempotent replays from being accepted as a valid ForgePath snapshot.

alter table public.forgepath_state_snapshots
  add constraint forgepath_state_snapshots_envelope_contract check (
    jsonb_typeof(payload) = 'object'
    and payload ->> 'format' = 'forgepath-backup'
    and jsonb_typeof(payload -> 'data') = 'object'
    and payload #>> '{integrity,algorithm}' = 'fnv1a32'
    and payload #>> '{integrity,value}' ~ '^[0-9a-f]{8}$'
    and checksum = payload #>> '{integrity,value}'
    and schema_version = case
      when payload ->> 'schemaVersion' ~ '^[1-9][0-9]*$' then (payload ->> 'schemaVersion')::integer
      else -1
    end
    and app_version = payload ->> 'appVersion'
  ) not valid;

alter table public.forgepath_state_snapshots
  validate constraint forgepath_state_snapshots_envelope_contract;

alter table public.forgepath_sync_events
  add constraint forgepath_sync_events_envelope_contract check (
    jsonb_typeof(payload) = 'object'
    and payload ->> 'format' = 'forgepath-backup'
    and jsonb_typeof(payload -> 'data') = 'object'
    and payload #>> '{integrity,algorithm}' = 'fnv1a32'
    and payload #>> '{integrity,value}' ~ '^[0-9a-f]{8}$'
    and checksum = payload #>> '{integrity,value}'
    and schema_version = case
      when payload ->> 'schemaVersion' ~ '^[1-9][0-9]*$' then (payload ->> 'schemaVersion')::integer
      else -1
    end
    and app_version = payload ->> 'appVersion'
  ) not valid;

alter table public.forgepath_sync_events
  validate constraint forgepath_sync_events_envelope_contract;

create or replace function public.push_forgepath_snapshot(
  p_event_id uuid,
  p_device_id uuid,
  p_base_version bigint,
  p_device_sequence bigint,
  p_schema_version integer,
  p_app_version text,
  p_rule_version text,
  p_checksum text,
  p_occurred_at timestamptz,
  p_timezone text,
  p_payload jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_current_version bigint := 0;
  v_current_checksum text;
  v_existing_user_id uuid;
  v_existing_device_id uuid;
  v_existing_device_sequence bigint;
  v_existing_base_version bigint;
  v_existing_status text;
  v_existing_version bigint;
  v_existing_schema_version integer;
  v_existing_app_version text;
  v_existing_rule_version text;
  v_existing_checksum text;
  v_existing_occurred_at timestamptz;
  v_existing_timezone text;
  v_existing_payload jsonb;
  v_next_version bigint;
begin
  if v_user_id is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  if p_base_version < 0 or p_device_sequence < 1 or p_schema_version < 1 then raise exception 'Invalid sync version metadata' using errcode = '22023'; end if;
  if p_checksum !~ '^[0-9a-f]{8}$' then raise exception 'Invalid snapshot checksum' using errcode = '22023'; end if;
  if jsonb_typeof(p_payload) is distinct from 'object' or octet_length(p_payload::text) > 26214400 then raise exception 'Invalid snapshot payload' using errcode = '22023'; end if;
  if char_length(p_app_version) not between 1 and 40 or char_length(p_rule_version) not between 1 and 80 or char_length(p_timezone) not between 1 and 120 then raise exception 'Invalid sync metadata' using errcode = '22023'; end if;
  if p_payload ->> 'format' is distinct from 'forgepath-backup'
    or jsonb_typeof(p_payload -> 'data') is distinct from 'object'
    or p_payload #>> '{integrity,algorithm}' is distinct from 'fnv1a32'
    or p_payload #>> '{integrity,value}' is distinct from p_checksum
    or p_payload ->> 'schemaVersion' is distinct from p_schema_version::text
    or p_payload ->> 'appVersion' is distinct from p_app_version
  then raise exception 'Snapshot envelope does not match sync metadata' using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(v_user_id::text, 0));

  if not exists (
    select 1 from public.forgepath_devices
    where user_id = v_user_id and id = p_device_id and revoked_at is null
  ) then raise exception 'Device is not registered or has been revoked' using errcode = '42501'; end if;

  select user_id, device_id, device_sequence, base_version, status, resulting_version,
         schema_version, app_version, rule_version, checksum, occurred_at, timezone, payload
    into v_existing_user_id, v_existing_device_id, v_existing_device_sequence, v_existing_base_version,
         v_existing_status, v_existing_version, v_existing_schema_version, v_existing_app_version,
         v_existing_rule_version, v_existing_checksum, v_existing_occurred_at, v_existing_timezone,
         v_existing_payload
  from public.forgepath_sync_events
  where event_id = p_event_id;

  if found then
    if v_existing_user_id is distinct from v_user_id
      or v_existing_device_id is distinct from p_device_id
      or v_existing_device_sequence is distinct from p_device_sequence
      or v_existing_base_version is distinct from p_base_version
      or v_existing_schema_version is distinct from p_schema_version
      or v_existing_app_version is distinct from p_app_version
      or v_existing_rule_version is distinct from p_rule_version
      or v_existing_checksum is distinct from p_checksum
      or v_existing_occurred_at is distinct from p_occurred_at
      or v_existing_timezone is distinct from p_timezone
      or v_existing_payload is distinct from p_payload
    then raise exception 'Event ID was reused with different content or ownership' using errcode = '22000';
    end if;
    return jsonb_build_object(
      'status', case when v_existing_status = 'applied' then 'already_applied' else v_existing_status end,
      'server_version', coalesce(v_existing_version, p_base_version),
      'event_id', p_event_id,
      'message', 'Idempotent replay accepted.'
    );
  end if;

  select version, checksum into v_current_version, v_current_checksum
  from public.forgepath_state_snapshots
  where user_id = v_user_id;
  if not found then v_current_version := 0; v_current_checksum := null; end if;

  if p_base_version <> v_current_version then
    insert into public.forgepath_sync_events (
      event_id, user_id, device_id, device_sequence, base_version, resulting_version, status, entity_id,
      schema_version, app_version, rule_version, checksum, occurred_at, timezone, payload
    ) values (
      p_event_id, v_user_id, p_device_id, p_device_sequence, p_base_version, v_current_version, 'conflict', v_user_id,
      p_schema_version, p_app_version, p_rule_version, p_checksum, p_occurred_at, p_timezone, p_payload
    );
    insert into public.forgepath_sync_conflicts (user_id, event_id, expected_version, actual_version, incoming_checksum, current_checksum)
    values (v_user_id, p_event_id, p_base_version, v_current_version, p_checksum, v_current_checksum);
    return jsonb_build_object('status', 'conflict', 'server_version', v_current_version, 'event_id', p_event_id, 'message', 'A newer cloud version exists. No snapshot was overwritten.');
  end if;

  v_next_version := v_current_version + 1;
  insert into public.forgepath_sync_events (
    event_id, user_id, device_id, device_sequence, base_version, resulting_version, status, entity_id,
    schema_version, app_version, rule_version, checksum, occurred_at, timezone, payload
  ) values (
    p_event_id, v_user_id, p_device_id, p_device_sequence, p_base_version, v_next_version, 'applied', v_user_id,
    p_schema_version, p_app_version, p_rule_version, p_checksum, p_occurred_at, p_timezone, p_payload
  );
  insert into public.forgepath_state_snapshots (user_id, version, source_event_id, schema_version, app_version, checksum, payload, updated_at)
  values (v_user_id, v_next_version, p_event_id, p_schema_version, p_app_version, p_checksum, p_payload, now())
  on conflict (user_id) do update set
    version = excluded.version,
    source_event_id = excluded.source_event_id,
    schema_version = excluded.schema_version,
    app_version = excluded.app_version,
    checksum = excluded.checksum,
    payload = excluded.payload,
    updated_at = excluded.updated_at;
  update public.forgepath_devices set last_seen_at = now(), app_version = p_app_version, schema_version = p_schema_version
  where user_id = v_user_id and id = p_device_id;
  return jsonb_build_object('status', 'applied', 'server_version', v_next_version, 'event_id', p_event_id, 'message', 'Snapshot stored.');
end;
$$;

revoke all on function public.push_forgepath_snapshot(uuid, uuid, bigint, bigint, integer, text, text, text, timestamptz, text, jsonb) from public, anon;
grant execute on function public.push_forgepath_snapshot(uuid, uuid, bigint, bigint, integer, text, text, text, timestamptz, text, jsonb) to authenticated;

comment on constraint forgepath_state_snapshots_envelope_contract on public.forgepath_state_snapshots is 'Projection metadata must agree with the browser-verified ForgePath backup envelope.';
comment on constraint forgepath_sync_events_envelope_contract on public.forgepath_sync_events is 'Every applied or conflicted snapshot event must retain a self-consistent ForgePath backup envelope.';
comment on function public.push_forgepath_snapshot is 'Idempotently accepts one authenticated, envelope-consistent athlete snapshot or preserves a version conflict without overwrite.';
