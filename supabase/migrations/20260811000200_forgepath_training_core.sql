create table public.forgepath_entity_events (
  event_id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  device_id uuid not null,
  device_sequence bigint not null,
  entity_type text not null,
  entity_id text not null,
  operation text not null,
  expected_version bigint not null,
  resulting_version bigint not null,
  schema_version integer not null,
  rule_version text not null,
  checksum text not null,
  occurred_at timestamptz not null,
  timezone text not null,
  payload jsonb not null,
  received_at timestamptz not null default now(),
  constraint forgepath_entity_events_owner_event_unique unique (user_id, event_id),
  constraint forgepath_entity_events_device_owner foreign key (user_id, device_id) references public.forgepath_devices(user_id, id),
  constraint forgepath_entity_events_device_sequence_unique unique (user_id, device_id, device_sequence),
  constraint forgepath_entity_events_entity_version_unique unique (user_id, entity_type, entity_id, resulting_version),
  constraint forgepath_entity_events_type check (entity_type in ('exercise', 'workout_session', 'workout_movement', 'workout_set', 'movement_note', 'survey_instance', 'survey_answer')),
  constraint forgepath_entity_events_operation check (operation in ('created', 'updated', 'completed', 'corrected', 'skipped', 'deleted', 'restored')),
  constraint forgepath_entity_events_versions check (expected_version >= 0 and resulting_version = expected_version + 1),
  constraint forgepath_entity_events_schema_positive check (schema_version > 0),
  constraint forgepath_entity_events_checksum check (checksum ~ '^[0-9a-f]{8}$'),
  constraint forgepath_entity_events_timezone_length check (char_length(timezone) between 1 and 120),
  constraint forgepath_entity_events_payload_object check (jsonb_typeof(payload) = 'object'),
  constraint forgepath_entity_events_payload_limit check (octet_length(payload::text) <= 1048576)
);

create table public.forgepath_sync_cursors (
  user_id uuid not null references auth.users(id) on delete cascade,
  device_id uuid not null,
  last_received_at timestamptz,
  last_event_id uuid,
  updated_at timestamptz not null default now(),
  primary key (user_id, device_id),
  constraint forgepath_sync_cursors_device_owner foreign key (user_id, device_id) references public.forgepath_devices(user_id, id),
  constraint forgepath_sync_cursors_event_owner foreign key (user_id, last_event_id) references public.forgepath_entity_events(user_id, event_id)
);

create table public.forgepath_exercises (
  user_id uuid not null references auth.users(id) on delete cascade,
  id text not null,
  name text not null,
  family text not null,
  pattern text not null,
  primary_region text not null,
  regions text[] not null default '{}',
  equipment text[] not null default '{}',
  aliases text[] not null default '{}',
  favorite boolean not null default false,
  joint_feeling text not null default 'neutral',
  custom boolean not null default false,
  version bigint not null,
  source_device_id uuid not null,
  source_event_id uuid not null,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  retired_at timestamptz,
  primary key (user_id, id),
  constraint forgepath_exercises_source_device foreign key (user_id, source_device_id) references public.forgepath_devices(user_id, id),
  constraint forgepath_exercises_source_event foreign key (user_id, source_event_id) references public.forgepath_entity_events(user_id, event_id),
  constraint forgepath_exercises_name_length check (char_length(name) between 1 and 160),
  constraint forgepath_exercises_family_length check (char_length(family) between 1 and 160),
  constraint forgepath_exercises_pattern check (pattern in ('squat', 'hinge', 'horizontal-push', 'vertical-push', 'horizontal-pull', 'vertical-pull', 'isolation', 'carry')),
  constraint forgepath_exercises_joint_feeling check (joint_feeling in ('great', 'good', 'neutral', 'irritating', 'avoid')),
  constraint forgepath_exercises_version_positive check (version > 0),
  constraint forgepath_exercises_regions_present check (cardinality(regions) > 0),
  constraint forgepath_exercises_time_order check (created_at <= updated_at and (retired_at is null or retired_at >= created_at))
);

create unique index forgepath_exercises_owner_active_name_idx on public.forgepath_exercises (user_id, lower(name)) where retired_at is null;

create table public.forgepath_workout_sessions (
  user_id uuid not null references auth.users(id) on delete cascade,
  id text not null,
  planned_session_id text,
  mesocycle_id text,
  plan_version integer,
  title text not null,
  objective text not null,
  status text not null,
  available_minutes integer,
  actual_minutes integer,
  planned_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  completed_local_date date,
  timezone text not null,
  version bigint not null,
  source_device_id uuid not null,
  source_event_id uuid not null,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  deleted_at timestamptz,
  primary key (user_id, id),
  constraint forgepath_workout_sessions_source_device foreign key (user_id, source_device_id) references public.forgepath_devices(user_id, id),
  constraint forgepath_workout_sessions_source_event foreign key (user_id, source_event_id) references public.forgepath_entity_events(user_id, event_id),
  constraint forgepath_workout_sessions_status check (status in ('planned', 'active', 'completed', 'partial-primary', 'partial-no-primary', 'deferred', 'expired', 'stopped')),
  constraint forgepath_workout_sessions_title_length check (char_length(title) between 1 and 200),
  constraint forgepath_workout_sessions_objective_length check (char_length(objective) between 1 and 500),
  constraint forgepath_workout_sessions_timezone_length check (char_length(timezone) between 1 and 120),
  constraint forgepath_workout_sessions_minutes check ((available_minutes is null or available_minutes > 0) and (actual_minutes is null or actual_minutes >= 0)),
  constraint forgepath_workout_sessions_plan_version check (plan_version is null or plan_version > 0),
  constraint forgepath_workout_sessions_version_positive check (version > 0),
  constraint forgepath_workout_sessions_completion check (
    (status in ('completed', 'partial-primary', 'partial-no-primary', 'stopped') and completed_at is not null and completed_local_date is not null)
    or (status not in ('completed', 'partial-primary', 'partial-no-primary', 'stopped'))
  ),
  constraint forgepath_workout_sessions_time_order check (
    created_at <= updated_at
    and (started_at is null or started_at >= created_at)
    and (completed_at is null or started_at is null or completed_at >= started_at)
    and (deleted_at is null or deleted_at >= created_at)
  )
);

create table public.forgepath_workout_movements (
  user_id uuid not null references auth.users(id) on delete cascade,
  id text not null,
  session_id text not null,
  planned_exercise_id text,
  exercise_id text not null,
  exercise_name_snapshot text not null,
  family_snapshot text not null,
  primary_region text not null,
  regions text[] not null default '{}',
  role text not null,
  purpose text not null,
  position integer not null,
  status text not null,
  substituted_from_exercise_id text,
  version bigint not null,
  source_device_id uuid not null,
  source_event_id uuid not null,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  deleted_at timestamptz,
  primary key (user_id, id),
  constraint forgepath_workout_movements_owner_session_id_unique unique (user_id, session_id, id),
  constraint forgepath_workout_movements_session foreign key (user_id, session_id) references public.forgepath_workout_sessions(user_id, id),
  constraint forgepath_workout_movements_exercise foreign key (user_id, exercise_id) references public.forgepath_exercises(user_id, id),
  constraint forgepath_workout_movements_substitution foreign key (user_id, substituted_from_exercise_id) references public.forgepath_exercises(user_id, id),
  constraint forgepath_workout_movements_source_device foreign key (user_id, source_device_id) references public.forgepath_devices(user_id, id),
  constraint forgepath_workout_movements_source_event foreign key (user_id, source_event_id) references public.forgepath_entity_events(user_id, event_id),
  constraint forgepath_workout_movements_role check (role in ('primary', 'secondary', 'priority', 'maintenance', 'optional')),
  constraint forgepath_workout_movements_status check (status in ('planned', 'active', 'completed', 'skipped', 'not-completed')),
  constraint forgepath_workout_movements_position check (position >= 0),
  constraint forgepath_workout_movements_version_positive check (version > 0),
  constraint forgepath_workout_movements_regions_present check (cardinality(regions) > 0),
  constraint forgepath_workout_movements_time_order check (created_at <= updated_at and (deleted_at is null or deleted_at >= created_at))
);

create table public.forgepath_workout_sets (
  user_id uuid not null references auth.users(id) on delete cascade,
  id text not null,
  session_id text not null,
  workout_movement_id text not null,
  exercise_id text not null,
  exercise_name_snapshot text not null,
  family_snapshot text not null,
  primary_region text not null,
  regions text[] not null default '{}',
  set_index integer not null,
  set_type text not null default 'work',
  load numeric(12, 3) not null,
  load_unit text not null,
  normalized_load_kg numeric(12, 3) not null,
  reps integer not null,
  rir numeric(4, 1),
  volume_load_kg numeric(18, 3) generated always as (normalized_load_kg * reps) stored,
  completed_at timestamptz not null,
  version bigint not null,
  source_device_id uuid not null,
  source_event_id uuid not null,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  deleted_at timestamptz,
  primary key (user_id, id),
  constraint forgepath_workout_sets_movement foreign key (user_id, session_id, workout_movement_id) references public.forgepath_workout_movements(user_id, session_id, id),
  constraint forgepath_workout_sets_exercise foreign key (user_id, exercise_id) references public.forgepath_exercises(user_id, id),
  constraint forgepath_workout_sets_source_device foreign key (user_id, source_device_id) references public.forgepath_devices(user_id, id),
  constraint forgepath_workout_sets_source_event foreign key (user_id, source_event_id) references public.forgepath_entity_events(user_id, event_id),
  constraint forgepath_workout_sets_slot_unique unique (user_id, workout_movement_id, set_index),
  constraint forgepath_workout_sets_index check (set_index >= 0),
  constraint forgepath_workout_sets_load check (load >= 0 and normalized_load_kg >= 0),
  constraint forgepath_workout_sets_reps check (reps > 0),
  constraint forgepath_workout_sets_unit check (load_unit in ('lb', 'kg')),
  constraint forgepath_workout_sets_rir check (rir is null or rir between -2 and 10),
  constraint forgepath_workout_sets_version_positive check (version > 0),
  constraint forgepath_workout_sets_regions_present check (cardinality(regions) > 0),
  constraint forgepath_workout_sets_time_order check (created_at <= updated_at and completed_at >= created_at and (deleted_at is null or deleted_at >= created_at))
);

create table public.forgepath_movement_notes (
  user_id uuid not null references auth.users(id) on delete cascade,
  id text not null,
  session_id text not null,
  workout_movement_id text not null,
  exercise_id text not null,
  body text not null,
  version bigint not null,
  source_device_id uuid not null,
  source_event_id uuid not null,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  deleted_at timestamptz,
  primary key (user_id, id),
  constraint forgepath_movement_notes_movement foreign key (user_id, session_id, workout_movement_id) references public.forgepath_workout_movements(user_id, session_id, id),
  constraint forgepath_movement_notes_exercise foreign key (user_id, exercise_id) references public.forgepath_exercises(user_id, id),
  constraint forgepath_movement_notes_source_device foreign key (user_id, source_device_id) references public.forgepath_devices(user_id, id),
  constraint forgepath_movement_notes_source_event foreign key (user_id, source_event_id) references public.forgepath_entity_events(user_id, event_id),
  constraint forgepath_movement_notes_slot_unique unique (user_id, session_id, workout_movement_id, exercise_id),
  constraint forgepath_movement_notes_body_length check (char_length(body) between 1 and 1000),
  constraint forgepath_movement_notes_version_positive check (version > 0),
  constraint forgepath_movement_notes_time_order check (created_at <= updated_at and (deleted_at is null or deleted_at >= created_at))
);

create table public.forgepath_survey_instances (
  user_id uuid not null references auth.users(id) on delete cascade,
  id text not null,
  session_id text,
  survey_type text not null,
  mode text not null,
  status text not null,
  offered_at timestamptz not null,
  completed_at timestamptz,
  version bigint not null,
  source_device_id uuid not null,
  source_event_id uuid not null,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  deleted_at timestamptz,
  primary key (user_id, id),
  constraint forgepath_survey_instances_session foreign key (user_id, session_id) references public.forgepath_workout_sessions(user_id, id),
  constraint forgepath_survey_instances_source_device foreign key (user_id, source_device_id) references public.forgepath_devices(user_id, id),
  constraint forgepath_survey_instances_source_event foreign key (user_id, source_event_id) references public.forgepath_entity_events(user_id, event_id),
  constraint forgepath_survey_instances_type check (survey_type in ('onboarding', 'pre', 'post', 'daily', 'weekly', 'monthly', 'cycle', 'ad-hoc')),
  constraint forgepath_survey_instances_mode check (mode in ('full', 'quick', 'minimal', 'off', 'ask')),
  constraint forgepath_survey_instances_status check (status in ('offered', 'completed', 'partial', 'skipped', 'dismissed', 'expired')),
  constraint forgepath_survey_instances_completion check ((status in ('completed', 'partial', 'skipped', 'dismissed') and completed_at is not null) or status in ('offered', 'expired')),
  constraint forgepath_survey_instances_version_positive check (version > 0),
  constraint forgepath_survey_instances_time_order check (created_at <= updated_at and offered_at >= created_at and (completed_at is null or completed_at >= offered_at) and (deleted_at is null or deleted_at >= created_at))
);

create table public.forgepath_survey_answers (
  user_id uuid not null references auth.users(id) on delete cascade,
  id text not null,
  survey_instance_id text not null,
  question_id text not null,
  response_status text not null,
  value jsonb,
  version bigint not null,
  source_device_id uuid not null,
  source_event_id uuid not null,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  deleted_at timestamptz,
  primary key (user_id, id),
  constraint forgepath_survey_answers_instance foreign key (user_id, survey_instance_id) references public.forgepath_survey_instances(user_id, id),
  constraint forgepath_survey_answers_source_device foreign key (user_id, source_device_id) references public.forgepath_devices(user_id, id),
  constraint forgepath_survey_answers_source_event foreign key (user_id, source_event_id) references public.forgepath_entity_events(user_id, event_id),
  constraint forgepath_survey_answers_question_unique unique (user_id, survey_instance_id, question_id),
  constraint forgepath_survey_answers_status check (response_status in ('answered', 'skipped', 'not-sure', 'prefer-not', 'not-answered')),
  constraint forgepath_survey_answers_missingness check ((response_status = 'answered' and value is not null) or (response_status <> 'answered' and value is null)),
  constraint forgepath_survey_answers_version_positive check (version > 0),
  constraint forgepath_survey_answers_time_order check (created_at <= updated_at and (deleted_at is null or deleted_at >= created_at))
);

create index forgepath_entity_events_owner_received_idx on public.forgepath_entity_events (user_id, received_at, event_id);
create index forgepath_entity_events_owner_entity_idx on public.forgepath_entity_events (user_id, entity_type, entity_id, resulting_version desc);
create index forgepath_workout_sessions_owner_date_idx on public.forgepath_workout_sessions (user_id, completed_local_date desc) where deleted_at is null;
create index forgepath_workout_movements_owner_exercise_idx on public.forgepath_workout_movements (user_id, exercise_id, updated_at desc) where deleted_at is null;
create index forgepath_workout_sets_owner_exercise_idx on public.forgepath_workout_sets (user_id, exercise_id, completed_at desc) where deleted_at is null;
create index forgepath_workout_sets_owner_region_idx on public.forgepath_workout_sets (user_id, primary_region, completed_at desc) where deleted_at is null;
create index forgepath_movement_notes_owner_exercise_idx on public.forgepath_movement_notes (user_id, exercise_id, updated_at desc) where deleted_at is null;
create index forgepath_survey_instances_owner_type_idx on public.forgepath_survey_instances (user_id, survey_type, offered_at desc) where deleted_at is null;

alter table public.forgepath_entity_events enable row level security;
alter table public.forgepath_sync_cursors enable row level security;
alter table public.forgepath_exercises enable row level security;
alter table public.forgepath_workout_sessions enable row level security;
alter table public.forgepath_workout_movements enable row level security;
alter table public.forgepath_workout_sets enable row level security;
alter table public.forgepath_movement_notes enable row level security;
alter table public.forgepath_survey_instances enable row level security;
alter table public.forgepath_survey_answers enable row level security;

alter table public.forgepath_entity_events force row level security;
alter table public.forgepath_sync_cursors force row level security;
alter table public.forgepath_exercises force row level security;
alter table public.forgepath_workout_sessions force row level security;
alter table public.forgepath_workout_movements force row level security;
alter table public.forgepath_workout_sets force row level security;
alter table public.forgepath_movement_notes force row level security;
alter table public.forgepath_survey_instances force row level security;
alter table public.forgepath_survey_answers force row level security;

create policy "athletes_select_own_entity_events" on public.forgepath_entity_events for select to authenticated using ((select auth.uid()) = user_id);
create policy "athletes_select_own_sync_cursors" on public.forgepath_sync_cursors for select to authenticated using ((select auth.uid()) = user_id);
create policy "athletes_select_own_exercises" on public.forgepath_exercises for select to authenticated using ((select auth.uid()) = user_id);
create policy "athletes_select_own_workout_sessions" on public.forgepath_workout_sessions for select to authenticated using ((select auth.uid()) = user_id);
create policy "athletes_select_own_workout_movements" on public.forgepath_workout_movements for select to authenticated using ((select auth.uid()) = user_id);
create policy "athletes_select_own_workout_sets" on public.forgepath_workout_sets for select to authenticated using ((select auth.uid()) = user_id);
create policy "athletes_select_own_movement_notes" on public.forgepath_movement_notes for select to authenticated using ((select auth.uid()) = user_id);
create policy "athletes_select_own_survey_instances" on public.forgepath_survey_instances for select to authenticated using ((select auth.uid()) = user_id);
create policy "athletes_select_own_survey_answers" on public.forgepath_survey_answers for select to authenticated using ((select auth.uid()) = user_id);

revoke all on public.forgepath_entity_events from anon, authenticated;
revoke all on public.forgepath_sync_cursors from anon, authenticated;
revoke all on public.forgepath_exercises from anon, authenticated;
revoke all on public.forgepath_workout_sessions from anon, authenticated;
revoke all on public.forgepath_workout_movements from anon, authenticated;
revoke all on public.forgepath_workout_sets from anon, authenticated;
revoke all on public.forgepath_movement_notes from anon, authenticated;
revoke all on public.forgepath_survey_instances from anon, authenticated;
revoke all on public.forgepath_survey_answers from anon, authenticated;

grant select on public.forgepath_entity_events to authenticated;
grant select on public.forgepath_sync_cursors to authenticated;
grant select on public.forgepath_exercises to authenticated;
grant select on public.forgepath_workout_sessions to authenticated;
grant select on public.forgepath_workout_movements to authenticated;
grant select on public.forgepath_workout_sets to authenticated;
grant select on public.forgepath_movement_notes to authenticated;
grant select on public.forgepath_survey_instances to authenticated;
grant select on public.forgepath_survey_answers to authenticated;

create view public.forgepath_volume_facts
with (security_invoker = true)
as
select
  s.user_id,
  s.id as set_id,
  s.session_id,
  s.workout_movement_id,
  s.exercise_id,
  s.exercise_name_snapshot,
  s.family_snapshot,
  s.primary_region,
  s.regions,
  ws.completed_local_date as local_date,
  ws.timezone,
  s.completed_at,
  s.load,
  s.load_unit,
  s.normalized_load_kg,
  s.reps,
  s.volume_load_kg
from public.forgepath_workout_sets s
join public.forgepath_workout_sessions ws on ws.user_id = s.user_id and ws.id = s.session_id
where s.deleted_at is null and ws.deleted_at is null and ws.completed_local_date is not null;

create view public.forgepath_volume_rollups
with (security_invoker = true)
as
with periods as (
  select f.*, 'day'::text as period_kind, f.local_date as period_start, f.local_date as period_end from public.forgepath_volume_facts f
  union all
  select f.*, 'week'::text, date_trunc('week', f.local_date::timestamp)::date, (date_trunc('week', f.local_date::timestamp)::date + 6) from public.forgepath_volume_facts f
  union all
  select f.*, 'month'::text, date_trunc('month', f.local_date::timestamp)::date, (date_trunc('month', f.local_date::timestamp) + interval '1 month - 1 day')::date from public.forgepath_volume_facts f
  union all
  select f.*, 'year'::text, date_trunc('year', f.local_date::timestamp)::date, (date_trunc('year', f.local_date::timestamp) + interval '1 year - 1 day')::date from public.forgepath_volume_facts f
), scoped as (
  select p.*, 'total'::text as scope_type, 'all'::text as scope_id from periods p
  union all
  select p.*, 'primary_region'::text, p.primary_region from periods p
)
select
  user_id,
  period_kind,
  period_start,
  period_end,
  scope_type,
  scope_id,
  count(*)::bigint as completed_sets,
  sum(reps)::bigint as completed_reps,
  sum(volume_load_kg)::numeric(20, 3) as volume_load_kg,
  max(normalized_load_kg)::numeric(12, 3) as maximum_load_kg,
  count(distinct session_id)::bigint as session_count,
  count(distinct exercise_id)::bigint as exercise_count
from scoped
group by user_id, period_kind, period_start, period_end, scope_type, scope_id;

revoke all on public.forgepath_volume_facts from anon, authenticated;
revoke all on public.forgepath_volume_rollups from anon, authenticated;
grant select on public.forgepath_volume_facts to authenticated;
grant select on public.forgepath_volume_rollups to authenticated;

comment on table public.forgepath_entity_events is 'Append-only entity event ledger for normalized training data. Browser writes remain denied until the transactional event RPC ships.';
comment on table public.forgepath_workout_sets is 'Current completed-set projection. Original values and corrections remain in forgepath_entity_events.';
comment on table public.forgepath_survey_answers is 'Typed survey-answer projection with explicit missingness. Skipped and unknown answers never become neutral values.';
comment on view public.forgepath_volume_facts is 'RLS-invoking source-set facts with volume load calculated as normalized load in kilograms times repetitions.';
comment on view public.forgepath_volume_rollups is 'Reproducible daily, weekly, monthly, and yearly total and primary-region volume summaries.';
