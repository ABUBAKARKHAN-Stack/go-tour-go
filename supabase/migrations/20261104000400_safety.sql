-- Safety: live location sharing with friends, trusted contacts, SOS log.

-- ---------------------------------------------------------------------------
-- One row per user holding their latest shared position.
-- expires_at null + is_active = "until stopped".
-- ---------------------------------------------------------------------------
create table public.location_shares (
  user_id uuid primary key default auth.uid() references public.profiles (id) on delete cascade,
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  accuracy real,
  heading real,
  is_active boolean not null default false,
  started_at timestamptz,
  expires_at timestamptz,
  updated_at timestamptz not null default now()
);

create index location_shares_active_idx on public.location_shares (is_active, expires_at);

create trigger location_shares_set_updated_at
  before update on public.location_shares
  for each row execute function private.set_updated_at();

-- ---------------------------------------------------------------------------
-- Trusted contacts (reached through WhatsApp share links from the app)
-- ---------------------------------------------------------------------------
create table public.trusted_contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  phone text not null check (phone ~ '^\+?[0-9]{7,15}$'),
  relationship text check (char_length(relationship) <= 40),
  created_at timestamptz not null default now()
);

create index trusted_contacts_user_idx on public.trusted_contacts (user_id);

-- ---------------------------------------------------------------------------
-- SOS log (demonstration only; no emergency service is contacted)
-- ---------------------------------------------------------------------------
create table public.sos_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  latitude double precision check (latitude between -90 and 90),
  longitude double precision check (longitude between -180 and 180),
  accuracy real,
  message text check (char_length(message) <= 500),
  contacts_notified integer not null default 0,
  created_at timestamptz not null default now()
);

create index sos_events_user_created_idx on public.sos_events (user_id, created_at desc);

-- Let accepted friends know when someone triggers SOS (in-app notification).
create or replace function private.notify_sos()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  sender_name text;
begin
  select coalesce(p.full_name, p.username) into sender_name
    from public.profiles p where p.id = new.user_id;

  insert into public.notifications (user_id, type, title, body, data)
  select
    case when f.requester_id = new.user_id then f.addressee_id else f.requester_id end,
    'sos',
    'SOS from ' || coalesce(sender_name, 'a friend'),
    'Your friend triggered SOS in GoTourGo. Check on them.',
    jsonb_build_object('user_id', new.user_id, 'latitude', new.latitude,
                       'longitude', new.longitude, 'sos_id', new.id)
  from public.friendships f
  where f.status = 'accepted'
    and new.user_id in (f.requester_id, f.addressee_id);
  return null;
end;
$$;

create trigger sos_events_notify
  after insert on public.sos_events
  for each row execute function private.notify_sos();

-- ---------------------------------------------------------------------------
-- RLS + grants
-- ---------------------------------------------------------------------------
alter table public.location_shares enable row level security;
alter table public.trusted_contacts enable row level security;
alter table public.sos_events enable row level security;

revoke all on table public.location_shares, public.trusted_contacts, public.sos_events
  from anon, authenticated;

grant select, insert, update, delete on table public.location_shares to authenticated;
grant select, insert, update, delete on table public.trusted_contacts to authenticated;
grant select, insert on table public.sos_events to authenticated;

-- Owners always see their row; accepted friends only while sharing is active.
create policy "Owners and friends see active location shares"
  on public.location_shares for select to authenticated
  using (
    user_id = (select auth.uid())
    or (
      is_active
      and (expires_at is null or expires_at > now())
      and private.are_friends((select auth.uid()), user_id)
    )
  );
create policy "Users create their own location share"
  on public.location_shares for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "Users update their own location share"
  on public.location_shares for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "Users delete their own location share"
  on public.location_shares for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users read their trusted contacts"
  on public.trusted_contacts for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "Users add their trusted contacts"
  on public.trusted_contacts for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "Users update their trusted contacts"
  on public.trusted_contacts for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "Users delete their trusted contacts"
  on public.trusted_contacts for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users read their SOS events"
  on public.sos_events for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "Users log their own SOS events"
  on public.sos_events for insert to authenticated
  with check ((select auth.uid()) = user_id);
