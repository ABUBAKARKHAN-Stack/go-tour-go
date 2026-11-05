-- Pakistan-wide places (for search) and landmarks imported from OpenStreetMap,
-- enriched with Wikidata/Wikipedia/Commons. Loaded by the "Import Pakistan
-- places and landmarks" GitHub Actions workflow (scripts/import_pakistan_data.py).
--
-- All distance maths happens on the phone (the app keeps a local copy), so no
-- PostGIS is needed. pg_trgm powers the online search fallback.

create extension if not exists pg_trgm with schema extensions;

-- ---------------------------------------------------------------------------
-- Destinations: imported landmarks live alongside the curated ones, so the
-- map, proximity alerts, details, trips and saved places work for both.
-- ---------------------------------------------------------------------------
alter table public.destinations
  add column source text not null default 'curated' check (source in ('curated', 'osm')),
  add column osm_id text unique,
  add column wikidata text,
  add column wikipedia_url text,
  add column name_ur text,
  add column image_credit text,
  add column image_license text,
  add column image_page_url text,
  add column featured boolean not null default false,
  -- Imported rows are never deleted (trips, reviews and saved places point at
  -- them); a landmark that disappears from OpenStreetMap is deactivated instead.
  add column active boolean not null default true;

-- Hand-written destinations are the featured set.
update public.destinations set featured = true where source = 'curated';

create index destinations_updated_idx on public.destinations (updated_at, id);
create index destinations_wikidata_idx on public.destinations (wikidata) where wikidata is not null;
create index destinations_name_trgm_idx on public.destinations using gin (lower(name) extensions.gin_trgm_ops);

-- ---------------------------------------------------------------------------
-- Places: cities, towns, villages, neighbourhoods and notable named places
-- (universities, hospitals, airports, stations...). Search-only reference data.
-- ---------------------------------------------------------------------------
create table public.places (
  id text primary key check (id ~ '^[nwr][0-9]+$'),   -- OSM element: n123 / w456 / r789
  name text not null check (char_length(name) between 1 and 200),
  name_ur text,
  kind text not null check (kind ~ '^[a-z_]{2,30}$'),
  district text,
  province text,
  latitude double precision not null check (latitude between 20 and 40),
  longitude double precision not null check (longitude between 58 and 80),
  rank smallint not null default 0 check (rank between 0 and 100),
  updated_at timestamptz not null default now()
);

create index places_name_trgm_idx on public.places using gin (lower(name) extensions.gin_trgm_ops);
create index places_kind_idx on public.places (kind);

-- Versions of the imported datasets. The app re-downloads a dataset when its
-- version changes (full copies are simpler and safer than row deltas here).
create table public.dataset_versions (
  name text primary key check (name in ('places', 'destinations')),
  version integer not null default 1,
  row_count integer not null default 0,
  imported_at timestamptz not null default now()
);

insert into public.dataset_versions (name, version, row_count)
select 'places', 1, 0
union all
select 'destinations', 1, (select count(*) from public.destinations);

alter table public.places enable row level security;
alter table public.dataset_versions enable row level security;
revoke all on table public.places, public.dataset_versions from anon, authenticated;
grant select on table public.places, public.dataset_versions to anon, authenticated;

create policy "Places are readable by everyone"
  on public.places for select to anon, authenticated using (true);

create policy "Dataset versions are readable by everyone"
  on public.dataset_versions for select to anon, authenticated using (true);

-- Curated edits made in the dashboard should reach phones too.
create or replace function private.bump_destinations_version()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.dataset_versions
     set version = version + 1,
         row_count = (select count(*) from public.destinations where active),
         imported_at = now()
   where name = 'destinations';
  return null;
end;
$$;

create trigger destinations_bump_version
  after insert or update or delete on public.destinations
  for each statement execute function private.bump_destinations_version();

-- ---------------------------------------------------------------------------
-- Online search fallback (the app normally searches its local copy).
-- ---------------------------------------------------------------------------
create or replace function public.search_places(
  q text,
  near_lat double precision default null,
  near_lng double precision default null,
  max_results integer default 20
)
returns table (
  result_type text,
  id text,
  name text,
  name_ur text,
  kind text,
  area text,
  latitude double precision,
  longitude double precision,
  score real
)
language sql
stable
security invoker
set search_path = ''
as $$
  with term as (
    select lower(btrim(q)) as t,
           '%' || replace(replace(replace(lower(btrim(q)), '\', '\\'), '%', '\%'), '_', '\_') || '%' as pattern
  ),
  candidates as (
    select 'place'::text as result_type, p.id, p.name, p.name_ur, p.kind,
           coalesce(p.district, p.province) as area, p.latitude, p.longitude, p.rank::real as rank
      from public.places p, term
     where char_length(term.t) >= 2
       and (lower(p.name) like term.pattern or extensions.similarity(lower(p.name), term.t) > 0.35
            or p.name_ur like '%' || btrim(q) || '%')
    union all
    select 'landmark', d.id::text, d.name, d.name_ur, d.category::text,
           d.city, d.latitude, d.longitude, d.popularity::real
      from public.destinations d, term
     where d.active
       and char_length(term.t) >= 2
       and (lower(d.name) like term.pattern or extensions.similarity(lower(d.name), term.t) > 0.35
            or d.name_ur like '%' || btrim(q) || '%')
  )
  select c.result_type, c.id, c.name, c.name_ur, c.kind, c.area, c.latitude, c.longitude,
         (case when lower(c.name) = (select t from term) then 3
               when lower(c.name) like (select t from term) || '%' then 2
               else 1 end) * 100
         + c.rank
         + extensions.similarity(lower(c.name), (select t from term)) * 50
         - case when near_lat is null or near_lng is null then 0
                else least(60, sqrt(power((c.latitude - near_lat) * 111, 2)
                                  + power((c.longitude - near_lng) * 111 * cos(radians(near_lat)), 2)) / 10)
           end as score
    from candidates c
   order by score desc
   limit least(greatest(max_results, 1), 50);
$$;

revoke all on function public.search_places(text, double precision, double precision, integer) from public;
grant execute on function public.search_places(text, double precision, double precision, integer) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Import (run by the GitHub Actions workflow with the database owner's
-- connection; never callable by app users).
-- ---------------------------------------------------------------------------
create table private.stage_places (
  id text, name text, name_ur text, kind text, district text, province text,
  latitude double precision, longitude double precision, rank smallint
);

create table private.stage_landmarks (
  osm_id text, slug text, name text, name_ur text, category text, city text, region text,
  latitude double precision, longitude double precision, radius_m integer,
  short_description text, description text, image_url text, image_credit text,
  image_license text, image_page_url text, wikidata text, wikipedia_url text, popularity smallint
);

revoke all on table private.stage_places, private.stage_landmarks from public, anon, authenticated;

create or replace function private.import_osm_dataset()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_places integer;
  v_inserted integer;
  v_matched integer;
begin
  if (select count(*) from private.stage_places) < 100 then
    raise exception 'Refusing to import: only % staged places', (select count(*) from private.stage_places);
  end if;

  -- Places: replace the set with the staged one.
  insert into public.places as p (id, name, name_ur, kind, district, province, latitude, longitude, rank, updated_at)
  select distinct on (s.id) s.id, s.name, nullif(s.name_ur, ''), s.kind, nullif(s.district, ''), nullif(s.province, ''),
         s.latitude, s.longitude, coalesce(s.rank, 0), now()
    from private.stage_places s
   where s.id ~ '^[nwr][0-9]+$' and s.name <> ''
  on conflict (id) do update
     set name = excluded.name, name_ur = excluded.name_ur, kind = excluded.kind,
         district = excluded.district, province = excluded.province,
         latitude = excluded.latitude, longitude = excluded.longitude, rank = excluded.rank,
         updated_at = now()
   where (p.name, p.name_ur, p.kind, p.district, p.province, p.latitude, p.longitude, p.rank)
         is distinct from
         (excluded.name, excluded.name_ur, excluded.kind, excluded.district, excluded.province,
          excluded.latitude, excluded.longitude, excluded.rank);

  delete from public.places p where not exists (select 1 from private.stage_places s where s.id = p.id);
  select count(*) into v_places from public.places;

  -- Curated destinations that match an imported landmark (same Wikidata item, or
  -- close by with a similar name) gain its photo and links; the duplicate is
  -- not imported separately.
  create temporary table matched on commit drop as
  select distinct on (s.osm_id) s.osm_id, d.id as destination_id
    from private.stage_landmarks s
    join public.destinations d
      on d.source = 'curated'
     and (
       (s.wikidata is not null and d.wikidata = s.wikidata)
       or (abs(d.latitude - s.latitude) < 0.01 and abs(d.longitude - s.longitude) < 0.01
           and extensions.similarity(lower(d.name), lower(s.name)) > 0.4)
     )
   order by s.osm_id, extensions.similarity(lower(d.name), lower(s.name)) desc;

  update public.destinations d
     set wikidata = coalesce(d.wikidata, s.wikidata),
         wikipedia_url = coalesce(d.wikipedia_url, s.wikipedia_url),
         name_ur = coalesce(d.name_ur, nullif(s.name_ur, '')),
         image_url = coalesce(d.image_url, s.image_url),
         image_credit = case when d.image_url is null then s.image_credit else d.image_credit end,
         image_license = case when d.image_url is null then s.image_license else d.image_license end,
         image_page_url = case when d.image_url is null then s.image_page_url else d.image_page_url end
    from matched m
    join private.stage_landmarks s on s.osm_id = m.osm_id
   where d.id = m.destination_id;
  get diagnostics v_matched = row_count;

  -- Imported landmarks: insert new ones, refresh existing ones.
  insert into public.destinations as d (
    slug, name, name_ur, category, city, region, latitude, longitude, radius_m,
    short_description, description, image_url, image_credit, image_license, image_page_url,
    is_landmark, popularity, source, osm_id, wikidata, wikipedia_url, featured, active
  )
  select distinct on (s.osm_id)
         s.slug, s.name, nullif(s.name_ur, ''), s.category::public.destination_category,
         s.city, s.region, s.latitude, s.longitude, least(5000, greatest(50, s.radius_m)),
         s.short_description, coalesce(nullif(s.description, ''), s.short_description),
         nullif(s.image_url, ''), nullif(s.image_credit, ''), nullif(s.image_license, ''), nullif(s.image_page_url, ''),
         true, least(100, greatest(0, coalesce(s.popularity, 30))), 'osm', s.osm_id,
         nullif(s.wikidata, ''), nullif(s.wikipedia_url, ''), false, true
    from private.stage_landmarks s
   where not exists (select 1 from matched m where m.osm_id = s.osm_id)
     and not exists (select 1 from public.destinations c where c.slug = s.slug and c.osm_id is distinct from s.osm_id)
  on conflict (osm_id) do update
     set name = excluded.name, name_ur = excluded.name_ur, category = excluded.category,
         city = excluded.city, region = excluded.region, latitude = excluded.latitude,
         longitude = excluded.longitude, radius_m = excluded.radius_m,
         short_description = excluded.short_description, description = excluded.description,
         image_url = excluded.image_url, image_credit = excluded.image_credit,
         image_license = excluded.image_license, image_page_url = excluded.image_page_url,
         popularity = excluded.popularity, wikidata = excluded.wikidata,
         wikipedia_url = excluded.wikipedia_url, active = true;
  get diagnostics v_inserted = row_count;

  update public.destinations d
     set active = false
   where d.source = 'osm' and d.active
     and not exists (select 1 from private.stage_landmarks s where s.osm_id = d.osm_id);

  update public.dataset_versions
     set version = version + 1, row_count = v_places, imported_at = now()
   where name = 'places';

  truncate private.stage_places, private.stage_landmarks;

  return jsonb_build_object(
    'places', v_places,
    'landmarks_upserted', v_inserted,
    'curated_enriched', v_matched,
    'landmarks_active', (select count(*) from public.destinations where active)
  );
end;
$$;

revoke all on function private.import_osm_dataset() from public, anon, authenticated;
