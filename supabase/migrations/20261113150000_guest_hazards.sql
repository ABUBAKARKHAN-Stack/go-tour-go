-- Guests (anonymous sign-ins) can report hazards and vote on them, with
-- safeguards, since anyone can make many guest accounts:
--  - a guest can report up to 3 hazards a day (members 10);
--  - guest "still there" votes count like anyone's;
--  - guest "gone" votes alone can't close a report: closing needs at least one
--    member's "gone" vote (two more "gone" than "still there", as before), or
--    four more "gone" than "still there".

alter table public.hazard_reports add column by_guest boolean not null default false;
alter table public.hazard_votes add column by_guest boolean not null default false;

create or replace function private.hazard_before_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  guest boolean := private.is_guest();
  daily integer := case when guest then 3 else 10 end;
begin
  if (select count(*) from public.hazard_reports
       where user_id = new.user_id and created_at > now() - interval '24 hours') >= daily then
    if guest then
      raise exception 'Guests can report up to 3 hazards a day. Create a free account to report more.' using errcode = 'P0001';
    end if;
    raise exception 'You can report up to 10 hazards a day.' using errcode = 'P0001';
  end if;
  new.by_guest := guest;
  new.created_at := now();
  new.expires_at := now() + private.hazard_lifetime(new.hazard_type);
  new.confirmations := 0;
  new.dismissals := 0;
  return new;
end;
$$;

-- Who voted is recorded by the server, never by the app.
create or replace function private.hazard_vote_before_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.by_guest := private.is_guest();
  return new;
end;
$$;

create trigger hazard_votes_before_change
  before insert or update on public.hazard_votes
  for each row execute function private.hazard_vote_before_change();

create or replace function private.hazard_after_vote()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  r public.hazard_reports%rowtype;
  member_gone integer;
begin
  select * into r from public.hazard_reports where id = new.report_id;
  if not found then return null; end if;
  update public.hazard_reports h
     set confirmations = (select count(*) from public.hazard_votes v where v.report_id = h.id and v.still_there),
         dismissals = (select count(*) from public.hazard_votes v where v.report_id = h.id and not v.still_there)
   where h.id = new.report_id
  returning * into r;
  if new.still_there then
    update public.hazard_reports
       set expires_at = least(now() + interval '3 days', greatest(expires_at, now() + private.hazard_lifetime(hazard_type) / 2))
     where id = r.id;
  else
    select count(*) into member_gone from public.hazard_votes v
     where v.report_id = r.id and not v.still_there and not v.by_guest;
    if (r.dismissals >= r.confirmations + 2 and member_gone > 0) or r.dismissals >= r.confirmations + 4 then
      update public.hazard_reports set expires_at = now() where id = r.id;
    end if;
  end if;
  return null;
end;
$$;

-- Guests may now report and vote (the safeguards above apply).
drop policy "Signed-up users report hazards" on public.hazard_reports;
create policy "Travellers report hazards"
  on public.hazard_reports for insert to authenticated
  with check (user_id = (select auth.uid()));

drop policy "Signed-up users vote on others' active hazards" on public.hazard_votes;
create policy "Travellers vote on others' active hazards"
  on public.hazard_votes for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.hazard_reports h
       where h.id = hazard_votes.report_id
         and h.expires_at > now()
         and h.user_id <> (select auth.uid())
    )
  );
