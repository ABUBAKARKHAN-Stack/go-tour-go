-- Run the machine-Urdu job unattended: every minute start three batches until
-- the queue is empty (or 400 batches have been logged), then unschedule.
-- To run it again later (e.g. after adding a language or old data):
--   select cron.schedule('urdu-translation', '* * * * *', 'select private.urdu_cron_tick()');
create extension if not exists pg_cron;

create function private.urdu_cron_tick()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if jsonb_array_length(public.urdu_translation_queue(1, 0)) = 0
     or (select count(*) from private.urdu_job_log) >= 400 then
    perform cron.unschedule('urdu-translation');
    return;
  end if;
  perform private.start_urdu_job(8, 0);
  perform private.start_urdu_job(8, 8);
  perform private.start_urdu_job(8, 16);
end;
$$;
revoke all on function private.urdu_cron_tick() from public, anon, authenticated;

select cron.schedule('urdu-translation', '* * * * *', 'select private.urdu_cron_tick()');
