-- Gemini Flash takes about 90 s per batch: start four batches every two
-- minutes so ticks do not overlap on the same landmarks.
create or replace function private.urdu_cron_tick()
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
  perform private.start_urdu_job(8, 24);
end;
$$;
revoke all on function private.urdu_cron_tick() from public, anon, authenticated;

select cron.schedule('urdu-translation', '*/2 * * * *', 'select private.urdu_cron_tick()');
