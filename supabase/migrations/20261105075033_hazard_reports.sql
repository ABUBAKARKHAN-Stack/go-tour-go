-- Hazards reported by travellers (flooding, accidents, road works, ...),
-- shown to everyone on the map, in journeys and as alerts. Reports expire on
-- their own; other travellers confirm ("still there") or clear ("gone") them.

create type public.hazard_type as enum (
  'flood', 'accident', 'road_works', 'landslide', 'fog', 'snow', 'closure', 'blockade', 'other'
);

create table public.hazard_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  hazard_type public.hazard_type not null,
  severity public.alert_severity not null default 'medium' check (severity in ('low', 'medium', 'high')),
  description text check (char_length(description) <= 280),
  latitude double precision not null check (latitude between 20 and 40),
  longitude double precision not null check (longitude between 58 and 80),
  radius_m integer not null default 300 check (radius_m between 50 and 3000),
  confirmations integer not null default 0,
  dismissals integer not null default 0,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create index hazard_reports_active_idx on public.hazard_reports (expires_at);
create index hazard_reports_user_idx on public.hazard_reports (user_id, created_at);

create table public.hazard_votes (
  report_id uuid not null references public.hazard_reports (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  still_there boolean not null,
  created_at timestamptz not null default now(),
  primary key (report_id, user_id)
);

create index hazard_votes_user_idx on public.hazard_votes (user_id);

-- How long a report lasts without confirmations, by type.
create or replace function private.hazard_lifetime(t public.hazard_type)
returns interval
language sql
immutable
set search_path = ''
as $$
  select case t
    when 'accident' then interval '2 hours'
    when 'blockade' then interval '6 hours'
    when 'fog' then interval '6 hours'
    when 'flood' then interval '12 hours'
    when 'landslide' then interval '24 hours'
    when 'snow' then interval '24 hours'
    when 'closure' then interval '24 hours'
    when 'road_works' then interval '7 days'
    else interval '6 hours'
  end;
$$;

-- New reports: set expiry, limit 10 per person per day.
create or replace function private.hazard_before_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select count(*) from public.hazard_reports
       where user_id = new.user_id and created_at > now() - interval '24 hours') >= 10 then
    raise exception 'You can report up to 10 hazards a day.' using errcode = 'P0001';
  end if;
  new.created_at := now();
  new.expires_at := now() + private.hazard_lifetime(new.hazard_type);
  new.confirmations := 0;
  new.dismissals := 0;
  return new;
end;
$$;

create trigger hazard_reports_before_insert
  before insert on public.hazard_reports
  for each row execute function private.hazard_before_insert();

-- Votes: "still there" extends the report (half its lifetime, at most 3 days
-- from now); two more "gone" than "still there" votes close it.
create or replace function private.hazard_after_vote()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  r public.hazard_reports%rowtype;
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
  elsif r.dismissals >= r.confirmations + 2 then
    update public.hazard_reports set expires_at = now() where id = r.id;
  end if;
  return null;
end;
$$;

create trigger hazard_votes_after_change
  after insert or update on public.hazard_votes
  for each row execute function private.hazard_after_vote();

alter table public.hazard_reports enable row level security;
alter table public.hazard_votes enable row level security;
revoke all on table public.hazard_reports, public.hazard_votes from anon, authenticated;

grant select on table public.hazard_reports to anon, authenticated;
grant insert (hazard_type, severity, description, latitude, longitude, radius_m) on table public.hazard_reports to authenticated;
grant delete on table public.hazard_reports to authenticated;
grant select, insert, update (still_there) on table public.hazard_votes to authenticated;

create policy "Active hazards are readable by everyone"
  on public.hazard_reports for select to anon, authenticated
  using (expires_at > now());

-- Signed-up users report hazards (guest accounts can read but not report).
create policy "Signed-up users report hazards"
  on public.hazard_reports for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and coalesce(((select auth.jwt()) ->> 'is_anonymous')::boolean, false) = false
  );

create policy "Reporters delete their own hazards"
  on public.hazard_reports for delete to authenticated
  using (user_id = (select auth.uid()));

create policy "Users see their own hazard votes"
  on public.hazard_votes for select to authenticated
  using (user_id = (select auth.uid()));

create policy "Signed-up users vote on others' active hazards"
  on public.hazard_votes for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and coalesce(((select auth.jwt()) ->> 'is_anonymous')::boolean, false) = false
    and exists (
      select 1 from public.hazard_reports h
       where h.id = report_id and h.expires_at > now() and h.user_id <> (select auth.uid())
    )
  );

create policy "Users change their own hazard votes"
  on public.hazard_votes for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
