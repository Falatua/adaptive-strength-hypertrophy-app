create extension if not exists pgcrypto with schema extensions;

create table public.forgepath_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint forgepath_profiles_display_name_length check (display_name is null or char_length(display_name) between 1 and 120)
);

create table public.forgepath_devices (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null,
  platform text not null,
  app_version text not null,
  schema_version integer not null,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  revoked_at timestamptz,
  constraint forgepath_devices_owner_id_unique unique (user_id, id),
  constraint forgepath_devices_name_length check (char_length(display_name) between 1 and 120),
  constraint forgepath_devices_platform_length check (char_length(platform) between 1 and 120),
  constraint forgepath_devices_schema_positive check (schema_version > 0)
);

create table public.forgepath_sync_events (
  event_id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  device_id uuid not null,
  device_sequence bigint not null,
  base_version bigint not null,
  resulting_version bigint,
  status text not null,
  entity_type text not null default 'state_snapshot',
  entity_id uuid not null,
  schema_version integer not null,
  app_version text not null,
  rule_version text not null,
  checksum text not null,
  occurred_at timestamptz not null,
  timezone text not null,
  payload jsonb not null,
  received_at timestamptz not null default now(),
  constraint forgepath_sync_events_device_owner foreign key (user_id, device_id) references public.forgepath_devices(user_id, id),
  constraint forgepath_sync_events_device_sequence_unique unique (user_id, device_id, device_sequence),
  constraint forgepath_sync_events_status check (status in ('applied', 'conflict')),
  constraint forgepath_sync_events_entity check (entity_type = 'state_snapshot' and entity_id = user_id),
  constraint forgepath_sync_events_versions check (
    base_version >= 0 and
    ((status = 'applied' and resulting_version > 0) or (status = 'conflict' and resulting_version >= 0))
  ),
  constraint forgepath_sync_events_schema_positive check (schema_version > 0),
  constraint forgepath_sync_events_checksum check (checksum ~ '^[0-9a-f]{8}$'),
  constraint forgepath_sync_events_timezone_length check (char_length(timezone) between 1 and 120),
  constraint forgepath_sync_events_payload_object check (jsonb_typeof(payload) = 'object'),
  constraint forgepath_sync_events_payload_limit check (octet_length(payload::text) <= 26214400)
);

create table public.forgepath_state_snapshots (
  user_id uuid primary key references auth.users(id) on delete cascade,
  version bigint not null,
  source_event_id uuid not null references public.forgepath_sync_events(event_id),
  schema_version integer not null,
  app_version text not null,
  checksum text not null,
  payload jsonb not null,
  updated_at timestamptz not null default now(),
  constraint forgepath_state_snapshots_version_positive check (version > 0),
  constraint forgepath_state_snapshots_schema_positive check (schema_version > 0),
  constraint forgepath_state_snapshots_checksum check (checksum ~ '^[0-9a-f]{8}$'),
  constraint forgepath_state_snapshots_payload_object check (jsonb_typeof(payload) = 'object'),
  constraint forgepath_state_snapshots_payload_limit check (octet_length(payload::text) <= 26214400)
);

create table public.forgepath_sync_conflicts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_id uuid not null references public.forgepath_sync_events(event_id),
  expected_version bigint not null,
  actual_version bigint not null,
  incoming_checksum text not null,
  current_checksum text,
  status text not null default 'open',
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  constraint forgepath_sync_conflicts_event_unique unique (user_id, event_id),
  constraint forgepath_sync_conflicts_versions check (expected_version >= 0 and actual_version >= 0),
  constraint forgepath_sync_conflicts_status check (status in ('open', 'resolved', 'dismissed')),
  constraint forgepath_sync_conflicts_resolution check ((status = 'open' and resolved_at is null) or (status <> 'open' and resolved_at is not null))
);

create index forgepath_sync_events_owner_received_idx on public.forgepath_sync_events (user_id, received_at desc);
create index forgepath_sync_conflicts_owner_status_idx on public.forgepath_sync_conflicts (user_id, status, created_at desc);
create index forgepath_devices_owner_seen_idx on public.forgepath_devices (user_id, last_seen_at desc);

alter table public.forgepath_profiles enable row level security;
alter table public.forgepath_devices enable row level security;
alter table public.forgepath_sync_events enable row level security;
alter table public.forgepath_state_snapshots enable row level security;
alter table public.forgepath_sync_conflicts enable row level security;

alter table public.forgepath_profiles force row level security;
alter table public.forgepath_devices force row level security;
alter table public.forgepath_sync_events force row level security;
alter table public.forgepath_state_snapshots force row level security;
alter table public.forgepath_sync_conflicts force row level security;

create policy "athletes_select_own_profile" on public.forgepath_profiles for select to authenticated using ((select auth.uid()) = user_id);
create policy "athletes_insert_own_profile" on public.forgepath_profiles for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "athletes_update_own_profile" on public.forgepath_profiles for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy "athletes_select_own_devices" on public.forgepath_devices for select to authenticated using ((select auth.uid()) = user_id);
create policy "athletes_insert_own_devices" on public.forgepath_devices for insert to authenticated with check ((select auth.uid()) = user_id and revoked_at is null);
create policy "athletes_update_own_active_devices" on public.forgepath_devices for update to authenticated using ((select auth.uid()) = user_id and revoked_at is null) with check ((select auth.uid()) = user_id);

create policy "athletes_select_own_sync_events" on public.forgepath_sync_events for select to authenticated using ((select auth.uid()) = user_id);
create policy "athletes_select_own_snapshot" on public.forgepath_state_snapshots for select to authenticated using ((select auth.uid()) = user_id);
create policy "athletes_select_own_conflicts" on public.forgepath_sync_conflicts for select to authenticated using ((select auth.uid()) = user_id);

revoke all on public.forgepath_profiles from anon, authenticated;
revoke all on public.forgepath_devices from anon, authenticated;
revoke all on public.forgepath_sync_events from anon, authenticated;
revoke all on public.forgepath_state_snapshots from anon, authenticated;
revoke all on public.forgepath_sync_conflicts from anon, authenticated;

grant select, insert, update on public.forgepath_profiles to authenticated;
grant select, insert, update on public.forgepath_devices to authenticated;
grant select on public.forgepath_sync_events to authenticated;
grant select on public.forgepath_state_snapshots to authenticated;
grant select on public.forgepath_sync_conflicts to authenticated;

create or replace function public.touch_forgepath_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger forgepath_profiles_updated_at before update on public.forgepath_profiles for each row execute function public.touch_forgepath_updated_at();

create or replace function public.handle_new_forgepath_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.forgepath_profiles (user_id, display_name)
  values (new.id, nullif(trim(coalesce(new.raw_user_meta_data ->> 'display_name', '')), ''))
  on conflict (user_id) do nothing;
  return new;
end;
$$;

create trigger forgepath_auth_user_created after insert on auth.users for each row execute function public.handle_new_forgepath_user();

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
  v_existing_status text;
  v_existing_version bigint;
  v_existing_checksum text;
  v_next_version bigint;
begin
  if v_user_id is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  if p_base_version < 0 or p_device_sequence < 1 or p_schema_version < 1 then raise exception 'Invalid sync version metadata' using errcode = '22023'; end if;
  if p_checksum !~ '^[0-9a-f]{8}$' then raise exception 'Invalid snapshot checksum' using errcode = '22023'; end if;
  if jsonb_typeof(p_payload) <> 'object' or octet_length(p_payload::text) > 26214400 then raise exception 'Invalid snapshot payload' using errcode = '22023'; end if;
  if char_length(p_app_version) not between 1 and 40 or char_length(p_rule_version) not between 1 and 80 or char_length(p_timezone) not between 1 and 120 then raise exception 'Invalid sync metadata' using errcode = '22023'; end if;

  perform pg_advisory_xact_lock(hashtextextended(v_user_id::text, 0));

  if not exists (
    select 1 from public.forgepath_devices
    where user_id = v_user_id and id = p_device_id and revoked_at is null
  ) then raise exception 'Device is not registered or has been revoked' using errcode = '42501'; end if;

  select status, resulting_version, checksum
    into v_existing_status, v_existing_version, v_existing_checksum
  from public.forgepath_sync_events
  where event_id = p_event_id and user_id = v_user_id;

  if found then
    if v_existing_checksum <> p_checksum then raise exception 'Event ID was reused with different content' using errcode = '22000'; end if;
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
revoke all on function public.touch_forgepath_updated_at() from public, anon, authenticated;
revoke all on function public.handle_new_forgepath_user() from public, anon, authenticated;

comment on table public.forgepath_sync_events is 'Append-only private-alpha sync ledger. Direct browser mutation is intentionally denied.';
comment on table public.forgepath_state_snapshots is 'Validated bootstrap projection of the latest accepted sync event, not a replacement for the append-only ledger.';
comment on function public.push_forgepath_snapshot is 'Idempotently accepts one authenticated athlete snapshot or preserves a version conflict without overwrite.';
