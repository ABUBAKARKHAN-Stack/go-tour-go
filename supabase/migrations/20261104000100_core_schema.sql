-- GoTourGo core schema: profiles and public reference data (destinations,
-- translations, nearby services, road alerts).
--
-- Conventions (current Supabase guidance):
--   * RLS enabled on every table, grants revoked from client roles and granted
--     back per table with only the privileges the app needs.
--   * Policies use `to <role>` and wrap auth.uid() as `(select auth.uid())`.
--   * Security-definer helpers live in the non-exposed `private` schema with
--     `set search_path = ''`.

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type public.destination_category as enum (
  'historical', 'religious', 'attraction', 'viewpoint', 'cultural',
  'museum', 'food', 'shopping', 'park', 'nature'
);

create type public.service_category as enum (
  'restaurant', 'hotel', 'hospital', 'police', 'fuel', 'atm', 'pharmacy',
  'shopping', 'attraction'
);

create type public.alert_type as enum (
  'closure', 'rain', 'flood', 'fog', 'smog', 'snow', 'landslide', 'traffic', 'other'
);

create type public.alert_severity as enum ('low', 'medium', 'high', 'critical');

create type public.profile_visibility as enum ('public', 'friends');

-- ---------------------------------------------------------------------------
-- Shared trigger: keep updated_at current
-- ---------------------------------------------------------------------------
create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Profiles (1:1 with auth.users). Email stays in auth.users and is never
-- copied here, so it is not exposed to other users.
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique
    check (username ~ '^[a-z0-9_]{3,24}$'),
  full_name text check (char_length(full_name) <= 80),
  avatar_url text,
  bio text check (char_length(bio) <= 280),
  home_city text check (char_length(home_city) <= 80),
  visibility public.profile_visibility not null default 'public',
  allow_friend_requests boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function private.set_updated_at();

-- Create a profile for every new auth user. Username comes from sign-up
-- metadata when valid and free, otherwise a generated one is used.
create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested text := lower(coalesce(new.raw_user_meta_data ->> 'username', ''));
  final_username text;
begin
  if requested ~ '^[a-z0-9_]{3,24}$'
     and not exists (select 1 from public.profiles p where p.username = requested) then
    final_username := requested;
  else
    final_username := 'traveler_' || substr(replace(new.id::text, '-', ''), 1, 10);
  end if;

  insert into public.profiles (id, username, full_name)
  values (
    new.id,
    final_username,
    nullif(left(coalesce(new.raw_user_meta_data ->> 'full_name', ''), 80), '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- ---------------------------------------------------------------------------
-- Destinations / landmarks. radius_m is the per-landmark geofence radius.
-- ---------------------------------------------------------------------------
create table public.destinations (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]{2,80}$'),
  name text not null,
  category public.destination_category not null,
  city text not null,
  region text not null,
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  radius_m integer not null default 1000 check (radius_m between 50 and 5000),
  short_description text not null,
  description text not null,
  history text,
  culture text,
  significance text,
  local_customs text,
  food text,
  shopping text,
  tips text,
  opening_hours text,
  entry_fee text,
  best_time text,
  image_url text,
  is_landmark boolean not null default true,
  popularity smallint not null default 50 check (popularity between 0 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index destinations_category_idx on public.destinations (category);
create index destinations_city_idx on public.destinations (city);

create trigger destinations_set_updated_at
  before update on public.destinations
  for each row execute function private.set_updated_at();

-- Translations: one row per destination per locale. New languages need no
-- schema change; missing fields fall back to the base (English) row.
create table public.destination_translations (
  destination_id uuid not null references public.destinations (id) on delete cascade,
  locale text not null check (locale ~ '^[a-z]{2}(-[A-Z]{2})?$'),
  name text not null,
  short_description text,
  description text,
  history text,
  significance text,
  tips text,
  primary key (destination_id, locale)
);

create index destination_translations_locale_idx on public.destination_translations (locale);

-- ---------------------------------------------------------------------------
-- Nearby services (seeded fallback when the live OSM Overpass API fails)
-- ---------------------------------------------------------------------------
create table public.nearby_services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category public.service_category not null,
  city text not null,
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  address text,
  phone text,
  rating numeric(2, 1) check (rating between 0 and 5),
  created_at timestamptz not null default now()
);

create index nearby_services_city_category_idx on public.nearby_services (city, category);

-- ---------------------------------------------------------------------------
-- Road / travel alerts (seeded or admin-created through the dashboard)
-- ---------------------------------------------------------------------------
create table public.road_alerts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  alert_type public.alert_type not null,
  severity public.alert_severity not null,
  region text not null,
  city text,
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  radius_m integer not null default 5000 check (radius_m between 100 and 100000),
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  source text not null default 'GoTourGo demo data',
  created_at timestamptz not null default now()
);

create index road_alerts_active_idx on public.road_alerts (ends_at, severity);

-- ---------------------------------------------------------------------------
-- RLS + grants
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.destinations enable row level security;
alter table public.destination_translations enable row level security;
alter table public.nearby_services enable row level security;
alter table public.road_alerts enable row level security;

revoke all on table public.profiles, public.destinations, public.destination_translations,
  public.nearby_services, public.road_alerts from anon, authenticated;

-- Reference data: read-only for everyone; written via dashboard/service role.
grant select on table public.destinations, public.destination_translations,
  public.nearby_services, public.road_alerts to anon, authenticated;

create policy "Destinations are readable by everyone"
  on public.destinations for select to anon, authenticated using (true);

create policy "Destination translations are readable by everyone"
  on public.destination_translations for select to anon, authenticated using (true);

create policy "Nearby services are readable by everyone"
  on public.nearby_services for select to anon, authenticated using (true);

create policy "Active road alerts are readable by everyone"
  on public.road_alerts for select to anon, authenticated
  using (ends_at is null or ends_at > now());

-- Profiles: insert happens through the auth trigger; users update their own.
-- The select policy is defined in the social migration, once friendships exist.
-- Column-level update grant: id/created_at can never be changed by clients.
grant select on table public.profiles to authenticated;
grant update (username, full_name, avatar_url, bio, home_city, visibility, allow_friend_requests)
  on table public.profiles to authenticated;

create policy "Users update their own profile"
  on public.profiles for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);
