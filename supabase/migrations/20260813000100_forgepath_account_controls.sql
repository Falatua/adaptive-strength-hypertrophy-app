create or replace function public.reset_forgepath_data(p_confirmation text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_issued_at bigint;
  v_deleted bigint := 0;
  v_count bigint;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  if p_confirmation <> 'RESET' then
    raise exception 'Reset confirmation required' using errcode = '22023';
  end if;

  v_issued_at := nullif(auth.jwt() ->> 'iat', '')::bigint;
  if v_issued_at is null or extract(epoch from now())::bigint - v_issued_at > 300 then
    raise exception 'Recent sign-in required' using errcode = '42501';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(v_user_id::text, 0));

  delete from public.forgepath_survey_answers where user_id = v_user_id;
  get diagnostics v_count = row_count; v_deleted := v_deleted + v_count;
  delete from public.forgepath_survey_instances where user_id = v_user_id;
  get diagnostics v_count = row_count; v_deleted := v_deleted + v_count;
  delete from public.forgepath_movement_notes where user_id = v_user_id;
  get diagnostics v_count = row_count; v_deleted := v_deleted + v_count;
  delete from public.forgepath_workout_sets where user_id = v_user_id;
  get diagnostics v_count = row_count; v_deleted := v_deleted + v_count;
  delete from public.forgepath_workout_movements where user_id = v_user_id;
  get diagnostics v_count = row_count; v_deleted := v_deleted + v_count;
  delete from public.forgepath_workout_sessions where user_id = v_user_id;
  get diagnostics v_count = row_count; v_deleted := v_deleted + v_count;
  delete from public.forgepath_exercises where user_id = v_user_id;
  get diagnostics v_count = row_count; v_deleted := v_deleted + v_count;
  delete from public.forgepath_sync_cursors where user_id = v_user_id;
  get diagnostics v_count = row_count; v_deleted := v_deleted + v_count;
  delete from public.forgepath_entity_events where user_id = v_user_id;
  get diagnostics v_count = row_count; v_deleted := v_deleted + v_count;
  delete from public.forgepath_sync_conflicts where user_id = v_user_id;
  get diagnostics v_count = row_count; v_deleted := v_deleted + v_count;
  delete from public.forgepath_state_snapshots where user_id = v_user_id;
  get diagnostics v_count = row_count; v_deleted := v_deleted + v_count;
  delete from public.forgepath_sync_events where user_id = v_user_id;
  get diagnostics v_count = row_count; v_deleted := v_deleted + v_count;
  delete from public.forgepath_devices where user_id = v_user_id;
  get diagnostics v_count = row_count; v_deleted := v_deleted + v_count;

  return jsonb_build_object('status', 'reset', 'deleted_rows', v_deleted, 'user_id', v_user_id);
end;
$$;

revoke all on function public.reset_forgepath_data(text) from public, anon;
grant execute on function public.reset_forgepath_data(text) to authenticated;

comment on function public.reset_forgepath_data(text) is 'Deletes every ForgePath data row owned by the recently reauthenticated athlete while preserving the Auth account.';
