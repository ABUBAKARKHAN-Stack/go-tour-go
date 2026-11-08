-- The client gets the full landmark sheet and sends it back whole. Only rows
-- they mark edited = yes are applied; rows left at "no" are skipped, so
-- untouched rows (including English-only ones that the strict bilingual rule
-- would refuse) cannot be overwritten by spreadsheet damage or get locked.
-- A file without the edited column (the new-landmark template) is applied as before.

alter table public.landmark_import
  add column if not exists edited text,
  add column if not exists urdu_machine_translated text; -- in the export; ignored on import

drop view if exists public.landmark_sheet;
create view public.landmark_sheet with (security_invoker = true) as
select
  'no'::text as edited,
  d.slug,
  d.name,
  coalesce(t.name, d.name_ur) as name_ur,
  d.category::text as category,
  d.city,
  d.region,
  round(d.latitude::numeric, 6) as latitude,
  round(d.longitude::numeric, 6) as longitude,
  d.radius_m,
  d.short_description,
  t.short_description as short_description_ur,
  d.description,
  t.description as description_ur,
  d.history,
  t.history as history_ur,
  d.significance,
  t.significance as significance_ur,
  d.culture,
  t.culture as culture_ur,
  d.local_customs,
  t.local_customs as local_customs_ur,
  d.food,
  t.food as food_ur,
  d.shopping,
  t.shopping as shopping_ur,
  d.tips,
  t.tips as tips_ur,
  d.opening_hours,
  d.entry_fee,
  d.best_time,
  d.image_url,
  d.image_credit,
  d.wikipedia_url,
  coalesce(t.machine_translated, false) as urdu_machine_translated
from public.destinations d
left join public.destination_translations t on t.destination_id = d.id and t.locale = 'ur'
where d.active
order by d.region, d.city, d.name;
revoke all on public.landmark_sheet from public, anon, authenticated;
grant select on public.landmark_sheet to service_role;

create or replace function private.apply_landmark_import()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
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
  -- Rows from the full sheet that the client did not mark are only logged.
  if lower(coalesce(trim(new.edited), '')) = 'no' then
    new.result := 'skipped (edited = no)';
    return new;
  end if;

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
$function$;
