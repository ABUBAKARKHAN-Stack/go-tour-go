-- Hand-fed landmarks: the owner imports CSV files into public.destinations from
-- the Supabase dashboard (Table Editor -> Import data from CSV). See
-- docs/LANDMARKS-IMPORT.md. Phones pick new rows up through the existing
-- destinations_bump_version trigger.

-- 1. Reject coordinates outside Pakistan (typos, swapped lat/lng). All existing
--    rows are inside these bounds (checked before this migration).
alter table public.destinations
  add constraint destinations_in_pakistan
  check (latitude between 23.5 and 37.2 and longitude between 60.8 and 77.9);

-- 2. Public bucket for landmark photos uploaded by hand in the dashboard
--    (Storage -> landmark-photos). Public URLs need no read policy; there are
--    no write policies, so only the dashboard / service role can upload.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('landmark-photos', 'landmark-photos', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- 3. Urdu text by slug. A CSV cannot know destination ids, so Urdu rows are
--    imported here (keyed by slug) and a trigger copies them into
--    destination_translations (locale 'ur') and destinations.name_ur.
create table public.landmark_urdu_import (
  id bigint generated always as identity primary key,
  slug text not null,
  name text not null,
  short_description text,
  description text,
  history text,
  significance text,
  culture text,
  local_customs text,
  food text,
  shopping text,
  tips text,
  imported_at timestamptz not null default now()
);

comment on table public.landmark_urdu_import is
  'Owner-only staging for Urdu landmark text (CSV import by slug). Applied to destination_translations by trigger.';

-- Dashboard / service role only: RLS on with no policies, and no grants to app roles.
alter table public.landmark_urdu_import enable row level security;
revoke all on public.landmark_urdu_import from anon, authenticated;

create function private.apply_landmark_urdu()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  dest uuid;
begin
  select d.id into dest from public.destinations d where d.slug = new.slug;
  if dest is null then
    raise exception 'No landmark with slug "%". Import the landmark first, then its Urdu row.', new.slug;
  end if;

  insert into public.destination_translations
    (destination_id, locale, name, short_description, description, history, significance,
     culture, local_customs, food, shopping, tips, machine_translated)
  values
    (dest, 'ur', new.name, nullif(new.short_description, ''), nullif(new.description, ''),
     nullif(new.history, ''), nullif(new.significance, ''), nullif(new.culture, ''),
     nullif(new.local_customs, ''), nullif(new.food, ''), nullif(new.shopping, ''),
     nullif(new.tips, ''), false)
  on conflict (destination_id, locale) do update set
    name = excluded.name,
    short_description = coalesce(excluded.short_description, public.destination_translations.short_description),
    description = coalesce(excluded.description, public.destination_translations.description),
    history = coalesce(excluded.history, public.destination_translations.history),
    significance = coalesce(excluded.significance, public.destination_translations.significance),
    culture = coalesce(excluded.culture, public.destination_translations.culture),
    local_customs = coalesce(excluded.local_customs, public.destination_translations.local_customs),
    food = coalesce(excluded.food, public.destination_translations.food),
    shopping = coalesce(excluded.shopping, public.destination_translations.shopping),
    tips = coalesce(excluded.tips, public.destination_translations.tips),
    machine_translated = false,
    updated_at = now();

  -- Name for offline search and lists; also bumps the destinations data version.
  update public.destinations set name_ur = new.name where id = dest and name_ur is distinct from new.name;
  return new;
end;
$$;

revoke all on function private.apply_landmark_urdu() from public, anon, authenticated;

create trigger landmark_urdu_import_apply
  after insert on public.landmark_urdu_import
  for each row execute function private.apply_landmark_urdu();
