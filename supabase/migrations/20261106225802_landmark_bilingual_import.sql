-- Bilingual landmark content, hand edits protected from the OSM import.
-- See docs/LANDMARKS-IMPORT.md.
--
-- 1. destinations.locked: set automatically on any write that is not a system
--    job (OSM import, machine translation). The OSM import skips locked rows,
--    so hand edits and hand-hidden duplicates survive it.
-- 2. landmark_import: ONE sheet with English and Urdu side by side. Strict
--    rule: name, short description and description in both languages; every
--    other section either in both or in neither. Same slug = update.
-- 3. landmark_sheet: the export view (all shown landmarks in the same columns),
--    so the client can edit existing landmarks and import the file back.
-- 4. landmark_urdu_import (added earlier today, never used) is dropped in the
--    next migration (20261106225842_drop_landmark_urdu_import).

-- 1. Lock -------------------------------------------------------------------
alter table public.destinations add column locked boolean not null default false;
comment on column public.destinations.locked is
  'Edited by hand (dashboard or landmark_import). The OSM import never changes locked rows.';

-- System jobs mark their writes with set_config('gotourgo.system_write', 'on', true).
create function private.is_system_write()
returns boolean
language sql
stable
set search_path = ''
as $$ select coalesce(current_setting('gotourgo.system_write', true), '') = 'on' $$;

create function private.lock_hand_edits()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not private.is_system_write() then
    new.locked := true;
  end if;
  return new;
end;
$$;

create trigger destinations_lock_hand_edits
  before insert or update on public.destinations
  for each row execute function private.lock_hand_edits();

-- Hand-written landmarks are hand edits by definition.
select set_config('gotourgo.system_write', 'on', true);
update public.destinations set locked = true where source = 'curated';

-- OSM import: mark its writes as system writes and leave locked rows alone.
create or replace function private.import_osm_dataset()
 returns jsonb
 language plpgsql
 security definer
 set search_path to ''
as $function$
declare
  v_places integer;
  v_inserted integer;
  v_matched integer;
  v_urdu integer;
begin
  perform set_config('gotourgo.system_write', 'on', true);

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

  -- Curated rows only gain what they lack (photo, links, Urdu name).
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
         wikipedia_url = excluded.wikipedia_url, active = true
   where not d.locked;
  get diagnostics v_inserted = row_count;

  update public.destinations d
     set active = false
   where d.source = 'osm' and d.active and not d.locked
     and not exists (select 1 from private.stage_landmarks s where s.osm_id = d.osm_id);

  insert into public.destination_translations as t (destination_id, locale, name, short_description, description, machine_translated, updated_at)
  select coalesce(m.destination_id, d.id), 'ur',
         coalesce(nullif(s.name_ur, ''), s.name),
         nullif(s.short_description_ur, ''), nullif(s.description_ur, ''), false, now()
    from private.stage_landmarks s
    left join matched m on m.osm_id = s.osm_id
    left join public.destinations d on d.osm_id = s.osm_id
   where coalesce(m.destination_id, d.id) is not null
     and not exists (select 1 from public.destinations x where x.id = coalesce(m.destination_id, d.id) and x.locked)
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
$function$;

revoke all on function private.import_osm_dataset() from public, anon, authenticated;

-- 2. Bilingual import ---------------------------------------------------------
-- Every column is text so a CSV never fails on types; the trigger checks
-- values and reports the slug and column in plain words.
create table public.landmark_import (
  id bigint generated always as identity primary key,
  slug text, name text, name_ur text, category text, city text, region text,
  latitude text, longitude text, radius_m text,
  short_description text, short_description_ur text,
  description text, description_ur text,
  history text, history_ur text,
  significance text, significance_ur text,
  culture text, culture_ur text,
  local_customs text, local_customs_ur text,
  food text, food_ur text,
  shopping text, shopping_ur text,
  tips text, tips_ur text,
  opening_hours text, entry_fee text, best_time text,
  image_url text, image_credit text, wikipedia_url text,
  result text,
  imported_at timestamptz not null default now()
);
comment on table public.landmark_import is
  'Owner-only: import the bilingual landmark sheet here (Table Editor -> Import data from CSV). Each row creates or updates the landmark with the same slug.';
alter table public.landmark_import enable row level security;
revoke all on public.landmark_import from anon, authenticated;

create function private.apply_landmark_import()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  ref text := coalesce(nullif(trim(new.slug), ''), '(row without slug)');
  v_lat double precision;
  v_lng double precision;
  v_radius integer;
  v_id uuid;
  v_existed boolean;
  old_t public.destination_translations%rowtype;
  v_machine boolean := false;
  pair record;
begin
  -- Trim every value; empty cells become null.
  new.slug := lower(nullif(trim(new.slug), ''));
  new.name := nullif(trim(new.name), '');               new.name_ur := nullif(trim(new.name_ur), '');
  new.category := lower(nullif(trim(new.category), ''));
  new.city := nullif(trim(new.city), '');               new.region := nullif(trim(new.region), '');
  new.short_description := nullif(trim(new.short_description), '');  new.short_description_ur := nullif(trim(new.short_description_ur), '');
  new.description := nullif(trim(new.description), ''); new.description_ur := nullif(trim(new.description_ur), '');
  new.history := nullif(trim(new.history), '');         new.history_ur := nullif(trim(new.history_ur), '');
  new.significance := nullif(trim(new.significance), ''); new.significance_ur := nullif(trim(new.significance_ur), '');
  new.culture := nullif(trim(new.culture), '');         new.culture_ur := nullif(trim(new.culture_ur), '');
  new.local_customs := nullif(trim(new.local_customs), ''); new.local_customs_ur := nullif(trim(new.local_customs_ur), '');
  new.food := nullif(trim(new.food), '');               new.food_ur := nullif(trim(new.food_ur), '');
  new.shopping := nullif(trim(new.shopping), '');       new.shopping_ur := nullif(trim(new.shopping_ur), '');
  new.tips := nullif(trim(new.tips), '');               new.tips_ur := nullif(trim(new.tips_ur), '');
  new.opening_hours := nullif(trim(new.opening_hours), ''); new.entry_fee := nullif(trim(new.entry_fee), '');
  new.best_time := nullif(trim(new.best_time), '');     new.image_url := nullif(trim(new.image_url), '');
  new.image_credit := nullif(trim(new.image_credit), ''); new.wikipedia_url := nullif(trim(new.wikipedia_url), '');

  if new.slug is null or new.slug !~ '^[a-z0-9-]{2,80}$' then
    raise exception 'Row %: slug must be 2-80 lowercase letters, digits or "-".', ref;
  end if;

  -- Required, in both languages.
  if new.name is null or new.name_ur is null then raise exception 'Row %: name and name_ur are both required.', ref; end if;
  if new.short_description is null or new.short_description_ur is null then
    raise exception 'Row %: short_description and short_description_ur are both required.', ref; end if;
  if new.description is null or new.description_ur is null then
    raise exception 'Row %: description and description_ur are both required.', ref; end if;
  if new.category is null or new.city is null or new.region is null then
    raise exception 'Row %: category, city and region are required.', ref; end if;
  if new.category not in (select unnest(enum_range(null::public.destination_category))::text) then
    raise exception 'Row %: category "%" is not one of: %.', ref, new.category,
      array_to_string(enum_range(null::public.destination_category)::text[], ', ');
  end if;

  -- Optional sections: both languages or neither.
  for pair in
    select * from (values
      ('history', new.history, new.history_ur),
      ('significance', new.significance, new.significance_ur),
      ('culture', new.culture, new.culture_ur),
      ('local_customs', new.local_customs, new.local_customs_ur),
      ('food', new.food, new.food_ur),
      ('shopping', new.shopping, new.shopping_ur),
      ('tips', new.tips, new.tips_ur)
    ) as p(col, en, ur)
  loop
    if (pair.en is null) <> (pair.ur is null) then
      raise exception 'Row %: % is filled in one language only. Fill both % and %_ur, or leave both empty.',
        ref, pair.col, pair.col, pair.col;
    end if;
  end loop;

  begin
    v_lat := trim(new.latitude)::double precision;
    v_lng := trim(new.longitude)::double precision;
  exception when others then
    raise exception 'Row %: latitude and longitude must be numbers like 31.5880 and 74.3107.', ref;
  end;
  if v_lat is null or v_lng is null or v_lat not between 23.5 and 37.2 or v_lng not between 60.8 and 77.9 then
    raise exception 'Row %: % , % is not in Pakistan. Latitude is the first number (23.5-37.2), longitude the second (60.8-77.9).',
      ref, new.latitude, new.longitude;
  end if;
  begin
    v_radius := round(trim(new.radius_m)::numeric);
  exception when others then
    raise exception 'Row %: radius_m must be a whole number of metres (50-5000).', ref;
  end;
  if v_radius is null or v_radius not between 50 and 5000 then
    raise exception 'Row %: radius_m must be between 50 and 5000 metres.', ref;
  end if;

  -- Create or update the landmark (a hand edit, so the row becomes locked).
  select id into v_id from public.destinations where slug = new.slug;
  v_existed := v_id is not null;
  if v_existed then
    update public.destinations set
      name = new.name, name_ur = new.name_ur, category = new.category::public.destination_category,
      city = new.city, region = new.region, latitude = v_lat, longitude = v_lng, radius_m = v_radius,
      short_description = new.short_description, description = new.description,
      history = new.history, significance = new.significance, culture = new.culture,
      local_customs = new.local_customs, food = new.food, shopping = new.shopping, tips = new.tips,
      opening_hours = new.opening_hours, entry_fee = new.entry_fee, best_time = new.best_time,
      image_url = new.image_url, image_credit = new.image_credit, wikipedia_url = new.wikipedia_url
    where id = v_id;
  else
    insert into public.destinations (
      slug, name, name_ur, category, city, region, latitude, longitude, radius_m,
      short_description, description, history, significance, culture, local_customs, food, shopping, tips,
      opening_hours, entry_fee, best_time, image_url, image_credit, wikipedia_url, source
    ) values (
      new.slug, new.name, new.name_ur, new.category::public.destination_category, new.city, new.region,
      v_lat, v_lng, v_radius, new.short_description, new.description, new.history, new.significance,
      new.culture, new.local_customs, new.food, new.shopping, new.tips, new.opening_hours, new.entry_fee,
      new.best_time, new.image_url, new.image_credit, new.wikipedia_url, 'curated'
    ) returning id into v_id;
  end if;

  -- Urdu. Text that came back unchanged from a machine translation keeps its
  -- machine label; anything else from the sheet counts as written by people.
  select * into old_t from public.destination_translations where destination_id = v_id and locale = 'ur';
  if found and old_t.machine_translated then
    v_machine := (old_t.name, old_t.short_description, old_t.description, old_t.history, old_t.significance,
                  old_t.culture, old_t.local_customs, old_t.food, old_t.shopping, old_t.tips)
                 is not distinct from
                 (new.name_ur, new.short_description_ur, new.description_ur, new.history_ur, new.significance_ur,
                  new.culture_ur, new.local_customs_ur, new.food_ur, new.shopping_ur, new.tips_ur);
  end if;
  insert into public.destination_translations as t
    (destination_id, locale, name, short_description, description, history, significance,
     culture, local_customs, food, shopping, tips, machine_translated, updated_at)
  values
    (v_id, 'ur', new.name_ur, new.short_description_ur, new.description_ur, new.history_ur, new.significance_ur,
     new.culture_ur, new.local_customs_ur, new.food_ur, new.shopping_ur, new.tips_ur, v_machine, now())
  on conflict (destination_id, locale) do update set
    name = excluded.name, short_description = excluded.short_description, description = excluded.description,
    history = excluded.history, significance = excluded.significance, culture = excluded.culture,
    local_customs = excluded.local_customs, food = excluded.food, shopping = excluded.shopping,
    tips = excluded.tips, machine_translated = excluded.machine_translated, updated_at = now();

  new.result := case when v_existed then 'updated' else 'created' end;
  return new;
end;
$$;
revoke all on function private.apply_landmark_import() from public, anon, authenticated;

create trigger landmark_import_apply
  before insert on public.landmark_import
  for each row execute function private.apply_landmark_import();

-- 3. Export view ----------------------------------------------------------------
create view public.landmark_sheet
with (security_invoker = true)
as
select d.slug, d.name, coalesce(t.name, d.name_ur) as name_ur, d.category::text as category, d.city, d.region,
       round(d.latitude::numeric, 6) as latitude, round(d.longitude::numeric, 6) as longitude, d.radius_m,
       d.short_description, t.short_description as short_description_ur,
       d.description, t.description as description_ur,
       d.history, t.history as history_ur,
       d.significance, t.significance as significance_ur,
       d.culture, t.culture as culture_ur,
       d.local_customs, t.local_customs as local_customs_ur,
       d.food, t.food as food_ur,
       d.shopping, t.shopping as shopping_ur,
       d.tips, t.tips as tips_ur,
       d.opening_hours, d.entry_fee, d.best_time, d.image_url, d.image_credit, d.wikipedia_url,
       coalesce(t.machine_translated, false) as urdu_machine_translated
  from public.destinations d
  left join public.destination_translations t on t.destination_id = d.id and t.locale = 'ur'
 where d.active
 order by d.region, d.city, d.name;
comment on view public.landmark_sheet is
  'Owner-only export: every shown landmark in the landmark_import columns (English + Urdu). Edit and import back into landmark_import.';
revoke all on public.landmark_sheet from anon, authenticated;
