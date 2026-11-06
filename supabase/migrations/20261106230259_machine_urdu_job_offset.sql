-- Let several batches run side by side on different landmarks.
drop function if exists public.urdu_translation_queue(integer);
create function public.urdu_translation_queue(p_limit integer default 10, p_offset integer default 0)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(jsonb_agg(item), '[]'::jsonb) from (
    select jsonb_build_object('id', d.id, 'fields', jsonb_strip_nulls(jsonb_build_object(
      'name', case when t.name is null then d.name end,
      'short_description', case when t.short_description is null then d.short_description end,
      'description', case when t.description is null then d.description end,
      'history', case when d.history is not null and t.history is null then d.history end,
      'significance', case when d.significance is not null and t.significance is null then d.significance end,
      'culture', case when d.culture is not null and t.culture is null then d.culture end,
      'local_customs', case when d.local_customs is not null and t.local_customs is null then d.local_customs end,
      'food', case when d.food is not null and t.food is null then d.food end,
      'shopping', case when d.shopping is not null and t.shopping is null then d.shopping end,
      'tips', case when d.tips is not null and t.tips is null then d.tips end
    ))) as item
    from public.destinations d
    left join public.destination_translations t on t.destination_id = d.id and t.locale = 'ur'
    where d.active and (
      t.name is null or t.short_description is null or t.description is null
      or (d.history is not null and t.history is null) or (d.significance is not null and t.significance is null)
      or (d.culture is not null and t.culture is null) or (d.local_customs is not null and t.local_customs is null)
      or (d.food is not null and t.food is null) or (d.shopping is not null and t.shopping is null)
      or (d.tips is not null and t.tips is null))
    order by d.featured desc, d.popularity desc, d.name, d.id
    limit greatest(1, least(p_limit, 25)) offset greatest(0, p_offset)
  ) q;
$$;
revoke all on function public.urdu_translation_queue(integer, integer) from public, anon, authenticated;
grant execute on function public.urdu_translation_queue(integer, integer) to service_role;

drop function if exists private.start_urdu_job(integer);
create function private.start_urdu_job(p_limit integer default 10, p_offset integer default 0)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_token text := encode(extensions.gen_random_bytes(24), 'hex');
begin
  delete from private.job_tokens where expires_at < now();
  insert into private.job_tokens (token) values (v_token);
  return net.http_post(
    url := 'https://bovepoelpxsstguclftl.supabase.co/functions/v1/translate-urdu',
    body := jsonb_build_object('token', v_token, 'limit', p_limit, 'offset', p_offset),
    headers := '{"Content-Type": "application/json"}'::jsonb,
    timeout_milliseconds := 145000
  );
end;
$$;
revoke all on function private.start_urdu_job(integer, integer) from public, anon, authenticated;
