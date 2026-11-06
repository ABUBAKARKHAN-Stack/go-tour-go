-- The translate-urdu function starts its own next batch (bounded by p_runs),
-- so one start translates everything without long single requests.
-- (Self-chaining was later dropped from the function: the edge runtime ran out
-- of resources. Batches are now started by pg_cron, see 20261106231710. The
-- log table below is still used.)
create function public.chain_urdu_job(p_limit integer, p_runs integer, p_delay_seconds integer default 0)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_token text := encode(extensions.gen_random_bytes(24), 'hex');
begin
  if p_runs < 1 then return null; end if;
  delete from private.job_tokens where expires_at < now();
  insert into private.job_tokens (token) values (v_token);
  return net.http_post(
    url := 'https://bovepoelpxsstguclftl.supabase.co/functions/v1/translate-urdu',
    body := jsonb_build_object('token', v_token, 'limit', p_limit, 'offset', 0, 'runs', p_runs, 'delay', greatest(0, least(p_delay_seconds, 30))),
    headers := '{"Content-Type": "application/json"}'::jsonb,
    timeout_milliseconds := 145000
  );
end;
$$;
revoke all on function public.chain_urdu_job(integer, integer, integer) from public, anon, authenticated;
grant execute on function public.chain_urdu_job(integer, integer, integer) to service_role;

-- Owner entry point: select private.start_urdu_chain(6, 80);
create function private.start_urdu_chain(p_limit integer default 6, p_runs integer default 80)
returns bigint
language sql
security definer
set search_path = ''
as $$ select public.chain_urdu_job(p_limit, p_runs, 0) $$;
revoke all on function private.start_urdu_chain(integer, integer) from public, anon, authenticated;

-- A small log so progress can be followed without reading pg_net internals.
create table private.urdu_job_log (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  asked integer, translated integer, runs_left integer, note text
);

create function public.log_urdu_job(p_asked integer, p_translated integer, p_runs_left integer, p_note text)
returns void
language sql
security definer
set search_path = ''
as $$ insert into private.urdu_job_log (asked, translated, runs_left, note) values (p_asked, p_translated, p_runs_left, left(p_note, 500)) $$;
revoke all on function public.log_urdu_job(integer, integer, integer, text) from public, anon, authenticated;
grant execute on function public.log_urdu_job(integer, integer, integer, text) to service_role;
