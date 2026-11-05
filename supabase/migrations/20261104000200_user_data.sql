-- Per-user travel data: saved places, trip checklist and destination reviews.

create type public.trip_status as enum ('todo', 'in_progress', 'visited');

-- ---------------------------------------------------------------------------
-- Saved places (bookmarks)
-- ---------------------------------------------------------------------------
create table public.saved_places (
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  destination_id uuid not null references public.destinations (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, destination_id)
);

create index saved_places_destination_idx on public.saved_places (destination_id);

-- ---------------------------------------------------------------------------
-- Trip checklist (not an itinerary generator)
-- ---------------------------------------------------------------------------
create table public.trip_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  destination_id uuid not null references public.destinations (id) on delete cascade,
  status public.trip_status not null default 'todo',
  notes text check (char_length(notes) <= 1000),
  planned_date date,
  visited_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, destination_id)
);

create index trip_items_user_status_idx on public.trip_items (user_id, status);
create index trip_items_destination_idx on public.trip_items (destination_id);

create or replace function private.trip_items_track_visit()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = 'visited' and (tg_op = 'INSERT' or old.status is distinct from 'visited') then
    new.visited_at := now();
  elsif new.status <> 'visited' then
    new.visited_at := null;
  end if;
  return new;
end;
$$;

create trigger trip_items_track_visit
  before insert or update of status on public.trip_items
  for each row execute function private.trip_items_track_visit();

create trigger trip_items_set_updated_at
  before update on public.trip_items
  for each row execute function private.set_updated_at();

-- ---------------------------------------------------------------------------
-- Reviews: one per user per destination (prevents duplicate submissions).
-- ---------------------------------------------------------------------------
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  destination_id uuid not null references public.destinations (id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  body text not null default '' check (char_length(body) <= 2000),
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, destination_id)
);

create index reviews_destination_created_idx on public.reviews (destination_id, created_at desc);

create trigger reviews_set_updated_at
  before update on public.reviews
  for each row execute function private.set_updated_at();

-- Basic spam guard: at most 10 new reviews per user per hour.
create or replace function private.reviews_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (
    select count(*) from public.reviews r
    where r.user_id = new.user_id and r.created_at > now() - interval '1 hour'
  ) >= 10 then
    raise exception 'Too many reviews. Please try again later.' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create trigger reviews_rate_limit
  before insert on public.reviews
  for each row execute function private.reviews_rate_limit();

-- Average rating per destination. security_invoker keeps the reviews RLS.
create view public.destination_rating_summary
with (security_invoker = true) as
select
  destination_id,
  round(avg(rating)::numeric, 1) as average_rating,
  count(*)::integer as review_count
from public.reviews
group by destination_id;

-- ---------------------------------------------------------------------------
-- RLS + grants
-- ---------------------------------------------------------------------------
alter table public.saved_places enable row level security;
alter table public.trip_items enable row level security;
alter table public.reviews enable row level security;

revoke all on table public.saved_places, public.trip_items, public.reviews,
  public.destination_rating_summary from anon, authenticated;

grant select, insert, delete on table public.saved_places to authenticated;
grant select, insert, update, delete on table public.trip_items to authenticated;
grant select, insert, update, delete on table public.reviews to authenticated;
grant select on table public.destination_rating_summary to anon, authenticated;

create policy "Users read their saved places"
  on public.saved_places for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "Users save places for themselves"
  on public.saved_places for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "Users remove their saved places"
  on public.saved_places for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users read their trip items"
  on public.trip_items for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "Users add their trip items"
  on public.trip_items for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "Users update their trip items"
  on public.trip_items for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "Users delete their trip items"
  on public.trip_items for delete to authenticated
  using ((select auth.uid()) = user_id);

-- Reviews are public so ratings show before sign-in.
create policy "Reviews are readable by everyone"
  on public.reviews for select to anon, authenticated using (true);
create policy "Users write their own reviews"
  on public.reviews for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "Users edit their own reviews"
  on public.reviews for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "Users delete their own reviews"
  on public.reviews for delete to authenticated
  using ((select auth.uid()) = user_id);

grant select on table public.reviews to anon;
