-- Migration: Drop 6 unused columns and update referencing functions
-- 1. wikidata (legacy scraper tag)
-- 2. osm_id (internal OpenStreetMap element ID)
-- 3. image_license (never populated or displayed)
-- 4. image_page_url (never displayed; image_url & image_credit used instead)
-- 5. is_landmark (redundant; all destinations are landmarks, non-landmarks live in places)
-- 6. popularity (dummy static integer; sorting uses featured and distance)

begin;

-- Update public.search_places to remove reference to d.popularity
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
           d.city, d.latitude, d.longitude, (case when d.featured then 50.0 else 25.0 end)::real as rank
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

-- Update public.urdu_translation_queue to remove reference to d.popularity
create or replace function public.urdu_translation_queue(p_limit integer default 10, p_offset integer default 0)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(jsonb_agg(item), '[]'::jsonb) from (
    select jsonb_build_object('id', d.id, 'fields', jsonb_strip_nulls(jsonb_build_object(
      'name', case when t.name is null then d.name end,
      'short_description', case when t.short_description is null then d.short_description end,
      'description', case when t.description is null then d.description end,
      'history', case when d.history is not null and t.history is null then d.history end,
      'significance', case when d.significance is not null and t.significance is null then d.significance end,
      'culture', case when d.culture is not null and t.culture is null then d.culture end,
      'local_customs', case when d.local_customs is not null and t.local_customs is null then d.local_customs end,
      'food', case when d.food is not null and t.food is null then d.food end,
      'shopping', case when d.shopping is not null and t.shopping is null then d.shopping end,
      'tips', case when d.tips is not null and t.tips is null then d.tips end
    ))) as item
    from public.destinations d
    left join public.destination_translations t on t.destination_id = d.id and t.locale = 'ur'
    where d.active and (
      t.name is null or t.short_description is null or t.description is null
      or (d.history is not null and t.history is null) or (d.significance is not null and t.significance is null)
      or (d.culture is not null and t.culture is null) or (d.local_customs is not null and t.local_customs is null)
      or (d.food is not null and t.food is null) or (d.shopping is not null and t.shopping is null)
      or (d.tips is not null and t.tips is null))
    order by d.featured desc, d.name, d.id
    limit greatest(1, least(p_limit, 25)) offset greatest(0, p_offset)
  ) q;
$$;

-- Drop obsolete index if exists
drop index if exists public.destinations_wikidata_idx;

-- Drop the 6 unused columns from public.destinations
alter table public.destinations
  drop column if exists wikidata,
  drop column if exists osm_id,
  drop column if exists image_license,
  drop column if exists image_page_url,
  drop column if exists is_landmark,
  drop column if exists popularity;

commit;
