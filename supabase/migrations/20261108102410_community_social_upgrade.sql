-- Community upgrade: saved (bookmarked) posts, share counts, a Nearby feed and
-- per-conversation unread state for the Messages badge.

-- Saved posts: private to their owner.
create table public.saved_posts (
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  post_id uuid not null references public.community_posts (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);
create index saved_posts_post_idx on public.saved_posts (post_id);
alter table public.saved_posts enable row level security;
revoke all on table public.saved_posts from anon, authenticated;
grant select, insert, delete on table public.saved_posts to authenticated;
create policy "Users see their saved posts"
  on public.saved_posts for select to authenticated
  using (user_id = (select auth.uid()));
create policy "Users save posts"
  on public.saved_posts for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "Users unsave posts"
  on public.saved_posts for delete to authenticated
  using (user_id = (select auth.uid()));

-- Shares: one row each time someone shares a post (for the share count).
create table public.post_shares (
  id bigint generated always as identity primary key,
  post_id uuid not null references public.community_posts (id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);
create index post_shares_post_idx on public.post_shares (post_id);
create index post_shares_user_idx on public.post_shares (user_id);
alter table public.post_shares enable row level security;
revoke all on table public.post_shares from anon, authenticated;
grant select, insert on table public.post_shares to authenticated;
create policy "Signed-in users see share counts"
  on public.post_shares for select to authenticated
  using (true);
create policy "Users record their own shares"
  on public.post_shares for insert to authenticated
  with check (user_id = (select auth.uid()));

-- Nearby feed: ids of posts within p_km of a point (the post's own location,
-- else its landmark's), newest first. Runs as the caller, so RLS applies.
create function public.nearby_post_ids(p_lat double precision, p_lng double precision, p_km double precision default 50,
                                       p_limit integer default 15, p_offset integer default 0)
returns setof uuid
language sql
stable
security invoker
set search_path = ''
as $$
  select q.id from (
    select p.id, p.created_at,
           coalesce(p.latitude, d.latitude) as lat,
           coalesce(p.longitude, d.longitude) as lng
    from public.community_posts p
    left join public.destinations d on d.id = p.destination_id
  ) q
  where q.lat is not null
    and q.lat between p_lat - p_km / 111.0 and p_lat + p_km / 111.0
    and q.lng between p_lng - p_km / (111.0 * greatest(cos(radians(p_lat)), 0.2))
                  and p_lng + p_km / (111.0 * greatest(cos(radians(p_lat)), 0.2))
    and 6371 * 2 * asin(sqrt(power(sin(radians(q.lat - p_lat) / 2), 2)
        + cos(radians(p_lat)) * cos(radians(q.lat)) * power(sin(radians(q.lng - p_lng) / 2), 2))) <= p_km
  order by q.created_at desc
  limit least(greatest(p_limit, 1), 50) offset greatest(p_offset, 0);
$$;
revoke all on function public.nearby_post_ids(double precision, double precision, double precision, integer, integer) from public, anon;
grant execute on function public.nearby_post_ids(double precision, double precision, double precision, integer, integer) to authenticated;

-- Opening a chat marks its message notifications as read (drives the badge).
-- Security definer like mark_notifications_read: users cannot update
-- notifications directly; this only touches the caller's own rows.
create function public.mark_conversation_read(p_conversation_id uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.notifications
     set read_at = now()
   where user_id = (select auth.uid())
     and type = 'message'
     and read_at is null
     and data ->> 'conversation_id' = p_conversation_id::text;
$$;
revoke all on function public.mark_conversation_read(uuid) from public, anon;
grant execute on function public.mark_conversation_read(uuid) to authenticated;
