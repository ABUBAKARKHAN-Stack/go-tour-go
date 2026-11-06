-- Machine Urdu drafts for landmarks: the edge function translate-urdu asks for
-- a queue, sends it to Gemini and writes the drafts back. Only empty Urdu
-- fields are filled (human text is never replaced) and rows are labelled
-- machine_translated. Started from SQL with private.start_urdu_job().

create extension if not exists pg_net;

-- Single-use keys so only a job started from the database can run the function.
create table private.job_tokens (
  token text primary key,
  expires_at timestamptz not null default now() + interval '10 minutes'
);

create function public.consume_job_token(p_token text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from private.job_tokens where token = p_token and expires_at > now();
  return found;
end;
$$;

-- Active landmarks whose Urdu is missing a required field or a section that
-- exists in English. Returns only the English text that needs translating.
create function public.urdu_translation_queue(p_limit integer default 10)
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
    order by d.featured desc, d.popularity desc, d.name
    limit greatest(1, least(p_limit, 25))
  ) q;
$$;

-- Writes machine drafts into empty Urdu fields only. A system write, so the
-- landmark does not become locked.
create function public.apply_machine_urdu(p_id uuid, p_fields jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  f jsonb := coalesce(p_fields, '{}'::jsonb);
  v_name text := nullif(trim(f ->> 'name'), '');
begin
  perform set_config('gotourgo.system_write', 'on', true);
  if not exists (select 1 from public.destinations where id = p_id) then return; end if;

  insert into public.destination_translations as t
    (destination_id, locale, name, short_description, description, history, significance,
     culture, local_customs, food, shopping, tips, machine_translated, updated_at)
  values (
    p_id, 'ur',
    coalesce(v_name, (select name from public.destinations where id = p_id)),
    nullif(trim(f ->> 'short_description'), ''), nullif(trim(f ->> 'description'), ''),
    nullif(trim(f ->> 'history'), ''), nullif(trim(f ->> 'significance'), ''),
    nullif(trim(f ->> 'culture'), ''), nullif(trim(f ->> 'local_customs'), ''),
    nullif(trim(f ->> 'food'), ''), nullif(trim(f ->> 'shopping'), ''), nullif(trim(f ->> 'tips'), ''),
    true, now())
  on conflict (destination_id, locale) do update set
    name = coalesce(t.name, excluded.name),
    short_description = coalesce(t.short_description, excluded.short_description),
    description = coalesce(t.description, excluded.description),
    history = coalesce(t.history, excluded.history),
    significance = coalesce(t.significance, excluded.significance),
    culture = coalesce(t.culture, excluded.culture),
    local_customs = coalesce(t.local_customs, excluded.local_customs),
    food = coalesce(t.food, excluded.food),
    shopping = coalesce(t.shopping, excluded.shopping),
    tips = coalesce(t.tips, excluded.tips),
    machine_translated = true,
    updated_at = now();

  if v_name is not null then
    update public.destinations set name_ur = v_name where id = p_id and name_ur is null;
  end if;
end;
$$;

revoke all on function public.consume_job_token(text) from public, anon, authenticated;
revoke all on function public.urdu_translation_queue(integer) from public, anon, authenticated;
revoke all on function public.apply_machine_urdu(uuid, jsonb) from public, anon, authenticated;
grant execute on function public.consume_job_token(text) to service_role;
grant execute on function public.urdu_translation_queue(integer) to service_role;
grant execute on function public.apply_machine_urdu(uuid, jsonb) to service_role;

-- Starts one batch: creates a single-use key and calls the edge function.
create function private.start_urdu_job(p_limit integer default 10)
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
    body := jsonb_build_object('token', v_token, 'limit', p_limit),
    headers := '{"Content-Type": "application/json"}'::jsonb,
    timeout_milliseconds := 145000
  );
end;
$$;
revoke all on function private.start_urdu_job(integer) from public, anon, authenticated;
