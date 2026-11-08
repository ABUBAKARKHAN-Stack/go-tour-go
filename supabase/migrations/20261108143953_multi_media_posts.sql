-- Instagram-style posts and stories: several photos/videos per post, video
-- stories, and photo/video posts without a caption.

-- Up to 10 items per post, in order. community_posts.image_url / video_url keep
-- the first item, so older app versions and the share page still show it.
create table public.post_media (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts (id) on delete cascade,
  position smallint not null check (position between 0 and 9),
  type text not null check (type in ('image', 'video')),
  url text not null check (url like 'https://%'),
  poster_url text check (poster_url is null or poster_url like 'https://%'),
  duration_ms integer check (duration_ms is null or duration_ms between 0 and 120000),
  width integer,
  height integer,
  created_at timestamptz not null default now(),
  unique (post_id, position)
);
create index post_media_post_idx on public.post_media (post_id);

alter table public.post_media enable row level security;
revoke all on table public.post_media from anon, authenticated;
grant select, insert, delete on table public.post_media to authenticated;
-- Visible like posts (to every signed-in user); written only by the post's author.
create policy "Post media is visible to signed-in users"
  on public.post_media for select to authenticated
  using (true);
create policy "Authors add media to their posts"
  on public.post_media for insert to authenticated
  with check (exists (select 1 from public.community_posts p where p.id = post_id and p.author_id = (select auth.uid())));
create policy "Authors remove media from their posts"
  on public.post_media for delete to authenticated
  using (exists (select 1 from public.community_posts p where p.id = post_id and p.author_id = (select auth.uid())));

-- A caption is optional when the post has photos or a video.
alter table public.community_posts drop constraint community_posts_body_check;
alter table public.community_posts add constraint community_posts_body_check check (char_length(body) <= 2000);

-- Video stories: image_url holds the poster frame.
alter table public.stories
  add column video_url text check (video_url is null or video_url like 'https://%'),
  add column video_duration_ms integer check (video_duration_ms is null or video_duration_ms between 0 and 120000);

-- The share page shows every item of the post.
create or replace function public.get_shared_post(p_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  p public.community_posts;
  a public.profiles;
  d public.destinations;
begin
  select * into p from public.community_posts where id = p_id;
  if not found then
    return null;
  end if;
  select * into a from public.profiles where id = p.author_id;
  if a.visibility <> 'public' then
    return jsonb_build_object('status', 'private');
  end if;
  select * into d from public.destinations where id = p.destination_id;
  return jsonb_build_object(
    'status', 'ok',
    'id', p.id,
    'body', p.body,
    'image_url', p.image_url,
    'video_url', p.video_url,
    'media', coalesce((select jsonb_agg(jsonb_build_object('type', m.type, 'url', m.url, 'poster_url', m.poster_url) order by m.position)
                       from public.post_media m where m.post_id = p.id), '[]'::jsonb),
    'created_at', p.created_at,
    'author', jsonb_build_object('name', coalesce(a.full_name, a.username), 'username', a.username, 'avatar_url', a.avatar_url),
    'place', coalesce(d.name || coalesce(', ' || d.city, ''), p.place_name),
    'likes', (select count(*) from public.post_likes l where l.post_id = p.id),
    'comments', (select count(*) from public.post_comments c where c.post_id = p.id)
  );
end;
$$;
