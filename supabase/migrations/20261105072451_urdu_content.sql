-- Urdu as a first-class content language.
--  * Translations can hold every guide section, and record whether they were
--    machine translated (shown to the reader) or written/sourced by people.
--  * The OSM import also carries Urdu Wikipedia summaries into translations.

alter table public.destination_translations
  add column culture text,
  add column local_customs text,
  add column food text,
  add column shopping text,
  add column machine_translated boolean not null default false,
  add column updated_at timestamptz not null default now();

alter table private.stage_landmarks
  add column short_description_ur text,
  add column description_ur text;

-- Re-create the import so it also writes Urdu translations for imported
-- landmarks (Urdu Wikipedia / Wikidata). Human text is never replaced by
-- machine text; sourced text replaces earlier machine text.
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
  v_urdu integer;
begin
  if (select count(*) from private.stage_places) < 100 then
    raise exception 'Refusing to import: only % staged places', (select count(*) from private.stage_places);
  end if;

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

  -- Urdu text from Urdu Wikipedia / Wikidata, for imported and matched curated landmarks.
  insert into public.destination_translations as t (destination_id, locale, name, short_description, description, machine_translated, updated_at)
  select coalesce(m.destination_id, d.id), 'ur',
         coalesce(nullif(s.name_ur, ''), s.name),
         nullif(s.short_description_ur, ''), nullif(s.description_ur, ''), false, now()
    from private.stage_landmarks s
    left join matched m on m.osm_id = s.osm_id
    left join public.destinations d on d.osm_id = s.osm_id
   where coalesce(m.destination_id, d.id) is not null
     and (nullif(s.short_description_ur, '') is not null or nullif(s.description_ur, '') is not null or nullif(s.name_ur, '') is not null)
  on conflict (destination_id, locale) do update
     set name = coalesce(case when t.machine_translated then null else t.name end, excluded.name),
         short_description = case when t.short_description is null or t.machine_translated then coalesce(excluded.short_description, t.short_description) else t.short_description end,
         description = case when t.description is null or t.machine_translated then coalesce(excluded.description, t.description) else t.description end,
         updated_at = now();
  get diagnostics v_urdu = row_count;

  update public.dataset_versions
     set version = version + 1, row_count = v_places, imported_at = now()
   where name = 'places';

  truncate private.stage_places, private.stage_landmarks;

  return jsonb_build_object(
    'places', v_places,
    'landmarks_upserted', v_inserted,
    'curated_enriched', v_matched,
    'urdu_translations', v_urdu,
    'landmarks_active', (select count(*) from public.destinations where active)
  );
end;
$$;

revoke all on function private.import_osm_dataset() from public, anon, authenticated;
