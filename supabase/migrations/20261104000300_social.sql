-- Social layer: friendships, follows, community posts, likes, comments,
-- stories, direct messages and in-app notifications.

create type public.friendship_status as enum ('pending', 'accepted', 'declined');

-- ---------------------------------------------------------------------------
-- Friendships. One row per pair (either direction), enforced by a unique
-- index on the unordered pair. Created/answered only through RPCs below.
-- ---------------------------------------------------------------------------
create table public.friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles (id) on delete cascade,
  addressee_id uuid not null references public.profiles (id) on delete cascade,
  status public.friendship_status not null default 'pending',
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  check (requester_id <> addressee_id)
);

create unique index friendships_pair_idx on public.friendships (
  least(requester_id, addressee_id), greatest(requester_id, addressee_id)
);
create index friendships_requester_idx on public.friendships (requester_id, status);
create index friendships_addressee_idx on public.friendships (addressee_id, status);

create table public.follows (
  follower_id uuid not null references public.profiles (id) on delete cascade,
  following_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);

create index follows_following_idx on public.follows (following_id);

-- ---------------------------------------------------------------------------
-- Helpers used by policies (security definer, not exposed through the API)
-- ---------------------------------------------------------------------------
create or replace function private.are_friends(a uuid, b uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.friendships f
    where f.status = 'accepted'
      and ((f.requester_id = a and f.addressee_id = b)
        or (f.requester_id = b and f.addressee_id = a))
  );
$$;

-- Any friendship row (pending, accepted or declined) between the two users.
create or replace function private.has_relationship(a uuid, b uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.friendships f
    where (f.requester_id = a and f.addressee_id = b)
       or (f.requester_id = b and f.addressee_id = a)
  );
$$;

grant execute on function private.are_friends(uuid, uuid) to authenticated;
grant execute on function private.has_relationship(uuid, uuid) to authenticated;

-- Profiles: public ones are visible to signed-in users; friends-only profiles
-- are visible to the owner and anyone with a friendship row (so pending
-- requests still show a name).
create policy "Profiles are visible according to privacy settings"
  on public.profiles for select to authenticated
  using (
    visibility = 'public'
    or id = (select auth.uid())
    or private.has_relationship((select auth.uid()), id)
  );

-- ---------------------------------------------------------------------------
-- Community posts, likes, comments
-- ---------------------------------------------------------------------------
create table public.community_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  image_url text,
  destination_id uuid references public.destinations (id) on delete set null,
  place_name text check (char_length(place_name) <= 120),
  latitude double precision check (latitude between -90 and 90),
  longitude double precision check (longitude between -180 and 180),
  created_at timestamptz not null default now()
);

create index community_posts_created_idx on public.community_posts (created_at desc);
create index community_posts_author_idx on public.community_posts (author_id);
create index community_posts_destination_idx on public.community_posts (destination_id);

create table public.post_likes (
  post_id uuid not null references public.community_posts (id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create index post_likes_user_idx on public.post_likes (user_id);

create table public.post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts (id) on delete cascade,
  author_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 500),
  created_at timestamptz not null default now()
);

create index post_comments_post_created_idx on public.post_comments (post_id, created_at);
create index post_comments_author_idx on public.post_comments (author_id);

-- ---------------------------------------------------------------------------
-- Stories: lightweight 24h travel moments
-- ---------------------------------------------------------------------------
create table public.stories (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  image_url text not null,
  caption text check (char_length(caption) <= 200),
  place_name text check (char_length(place_name) <= 120),
  destination_id uuid references public.destinations (id) on delete set null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '24 hours')
);

create index stories_expires_idx on public.stories (expires_at desc);
create index stories_author_idx on public.stories (author_id);

-- ---------------------------------------------------------------------------
-- Direct messages: 1:1 conversations between friends
-- ---------------------------------------------------------------------------
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_a uuid not null references public.profiles (id) on delete cascade,
  user_b uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  last_message_at timestamptz,
  last_message_preview text,
  check (user_a < user_b),
  unique (user_a, user_b)
);

create index conversations_user_b_idx on public.conversations (user_b);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index messages_conversation_created_idx on public.messages (conversation_id, created_at desc);
create index messages_sender_idx on public.messages (sender_id);

create or replace function private.is_conversation_member(conversation uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.conversations c
    where c.id = conversation
      and (select auth.uid()) in (c.user_a, c.user_b)
  );
$$;

grant execute on function private.is_conversation_member(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- In-app notifications (inserted by triggers, never by clients)
-- ---------------------------------------------------------------------------
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type text not null,
  title text not null,
  body text not null default '',
  data jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index notifications_user_created_idx on public.notifications (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- RPCs
-- ---------------------------------------------------------------------------
create or replace function public.send_friend_request(target uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := (select auth.uid());
  existing public.friendships;
  result uuid;
begin
  if me is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;
  if target = me then
    raise exception 'You cannot add yourself' using errcode = 'P0001';
  end if;
  if not exists (select 1 from public.profiles p where p.id = target and p.allow_friend_requests) then
    raise exception 'This traveler is not accepting friend requests' using errcode = 'P0001';
  end if;

  select * into existing from public.friendships f
  where least(f.requester_id, f.addressee_id) = least(me, target)
    and greatest(f.requester_id, f.addressee_id) = greatest(me, target);

  if existing.id is null then
    insert into public.friendships (requester_id, addressee_id)
    values (me, target)
    returning id into result;
  elsif existing.status = 'accepted' then
    result := existing.id;
  elsif existing.status = 'pending' and existing.addressee_id = me then
    -- They already asked us: accept.
    update public.friendships
       set status = 'accepted', responded_at = now()
     where id = existing.id;
    result := existing.id;
  elsif existing.status = 'pending' then
    result := existing.id;
  else
    -- Declined earlier: allow a fresh request from either side.
    update public.friendships
       set requester_id = me, addressee_id = target, status = 'pending',
           created_at = now(), responded_at = null
     where id = existing.id;
    result := existing.id;
  end if;
  return result;
end;
$$;

create or replace function public.respond_friend_request(request_id uuid, accept boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.friendships
     set status = case when accept then 'accepted'::public.friendship_status
                       else 'declined'::public.friendship_status end,
         responded_at = now()
   where id = request_id
     and addressee_id = (select auth.uid())
     and status = 'pending';
  if not found then
    raise exception 'Friend request not found' using errcode = 'P0002';
  end if;
end;
$$;

create or replace function public.start_conversation(other uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := (select auth.uid());
  a uuid := least(me, other);
  b uuid := greatest(me, other);
  result uuid;
begin
  if me is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;
  if not private.are_friends(me, other) then
    raise exception 'You can only message friends' using errcode = 'P0001';
  end if;
  insert into public.conversations (user_a, user_b)
  values (a, b)
  on conflict (user_a, user_b) do nothing;
  select c.id into result from public.conversations c where c.user_a = a and c.user_b = b;
  return result;
end;
$$;

create or replace function public.mark_notifications_read()
returns void
language sql
security definer
set search_path = ''
as $$
  update public.notifications
     set read_at = now()
   where user_id = (select auth.uid()) and read_at is null;
$$;

revoke all on function public.send_friend_request(uuid) from public, anon;
revoke all on function public.respond_friend_request(uuid, boolean) from public, anon;
revoke all on function public.start_conversation(uuid) from public, anon;
revoke all on function public.mark_notifications_read() from public, anon;
grant execute on function public.send_friend_request(uuid) to authenticated;
grant execute on function public.respond_friend_request(uuid, boolean) to authenticated;
grant execute on function public.start_conversation(uuid) to authenticated;
grant execute on function public.mark_notifications_read() to authenticated;

-- ---------------------------------------------------------------------------
-- Notification triggers
-- ---------------------------------------------------------------------------
create or replace function private.notify_friendship_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_name text;
begin
  if new.status = 'pending'
     and (tg_op = 'INSERT' or old.status is distinct from 'pending') then
    select coalesce(p.full_name, p.username) into actor_name
      from public.profiles p where p.id = new.requester_id;
    insert into public.notifications (user_id, type, title, body, data)
    values (new.addressee_id, 'friend_request', 'New friend request',
            coalesce(actor_name, 'A traveler') || ' wants to connect with you.',
            jsonb_build_object('friendship_id', new.id, 'user_id', new.requester_id));
  elsif new.status = 'accepted' and tg_op = 'UPDATE' and old.status <> 'accepted' then
    select coalesce(p.full_name, p.username) into actor_name
      from public.profiles p where p.id = new.addressee_id;
    insert into public.notifications (user_id, type, title, body, data)
    values (new.requester_id, 'friend_accepted', 'Friend request accepted',
            coalesce(actor_name, 'A traveler') || ' accepted your friend request.',
            jsonb_build_object('friendship_id', new.id, 'user_id', new.addressee_id));
  end if;
  return null;
end;
$$;

create trigger friendships_notify
  after insert or update of status on public.friendships
  for each row execute function private.notify_friendship_change();

create or replace function private.on_message_inserted()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  convo public.conversations;
  recipient uuid;
  sender_name text;
begin
  update public.conversations
     set last_message_at = new.created_at,
         last_message_preview = left(new.body, 120)
   where id = new.conversation_id
  returning * into convo;

  recipient := case when convo.user_a = new.sender_id then convo.user_b else convo.user_a end;
  select coalesce(p.full_name, p.username) into sender_name
    from public.profiles p where p.id = new.sender_id;

  insert into public.notifications (user_id, type, title, body, data)
  values (recipient, 'message', coalesce(sender_name, 'New message'), left(new.body, 140),
          jsonb_build_object('conversation_id', new.conversation_id, 'user_id', new.sender_id));
  return null;
end;
$$;

create trigger messages_after_insert
  after insert on public.messages
  for each row execute function private.on_message_inserted();

-- ---------------------------------------------------------------------------
-- RLS + grants
-- ---------------------------------------------------------------------------
alter table public.friendships enable row level security;
alter table public.follows enable row level security;
alter table public.community_posts enable row level security;
alter table public.post_likes enable row level security;
alter table public.post_comments enable row level security;
alter table public.stories enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.notifications enable row level security;

revoke all on table public.friendships, public.follows, public.community_posts,
  public.post_likes, public.post_comments, public.stories, public.conversations,
  public.messages, public.notifications from anon, authenticated;

grant select, delete on table public.friendships to authenticated;
grant select, insert, delete on table public.follows to authenticated;
grant select, insert, delete on table public.community_posts to authenticated;
grant update (body, image_url, destination_id, place_name) on table public.community_posts to authenticated;
grant select, insert, delete on table public.post_likes to authenticated;
grant select, insert, delete on table public.post_comments to authenticated;
grant select, insert, delete on table public.stories to authenticated;
grant select on table public.conversations to authenticated;
grant select, insert on table public.messages to authenticated;
grant select, delete on table public.notifications to authenticated;
grant update (read_at) on table public.notifications to authenticated;

-- Friendships
create policy "Users see friendships they are part of"
  on public.friendships for select to authenticated
  using ((select auth.uid()) in (requester_id, addressee_id));
create policy "Users remove friendships they are part of"
  on public.friendships for delete to authenticated
  using ((select auth.uid()) in (requester_id, addressee_id));

-- Follows
create policy "Follows are visible to signed-in users"
  on public.follows for select to authenticated using (true);
create policy "Users follow as themselves"
  on public.follows for insert to authenticated
  with check ((select auth.uid()) = follower_id);
create policy "Users unfollow as themselves"
  on public.follows for delete to authenticated
  using ((select auth.uid()) = follower_id);

-- Posts
create policy "Posts are visible to signed-in users"
  on public.community_posts for select to authenticated using (true);
create policy "Users create their own posts"
  on public.community_posts for insert to authenticated
  with check ((select auth.uid()) = author_id);
create policy "Users edit their own posts"
  on public.community_posts for update to authenticated
  using ((select auth.uid()) = author_id)
  with check ((select auth.uid()) = author_id);
create policy "Users delete their own posts"
  on public.community_posts for delete to authenticated
  using ((select auth.uid()) = author_id);

-- Likes
create policy "Likes are visible to signed-in users"
  on public.post_likes for select to authenticated using (true);
create policy "Users like as themselves"
  on public.post_likes for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "Users remove their own likes"
  on public.post_likes for delete to authenticated
  using ((select auth.uid()) = user_id);

-- Comments (author or post owner may delete)
create policy "Comments are visible to signed-in users"
  on public.post_comments for select to authenticated using (true);
create policy "Users comment as themselves"
  on public.post_comments for insert to authenticated
  with check ((select auth.uid()) = author_id);
create policy "Authors or post owners delete comments"
  on public.post_comments for delete to authenticated
  using (
    (select auth.uid()) = author_id
    or exists (
      select 1 from public.community_posts p
      where p.id = post_id and p.author_id = (select auth.uid())
    )
  );

-- Stories (only unexpired ones are visible)
create policy "Active stories are visible to signed-in users"
  on public.stories for select to authenticated
  using (expires_at > now() or author_id = (select auth.uid()));
create policy "Users post their own stories"
  on public.stories for insert to authenticated
  with check ((select auth.uid()) = author_id);
create policy "Users delete their own stories"
  on public.stories for delete to authenticated
  using ((select auth.uid()) = author_id);

-- Conversations & messages (members only)
create policy "Members see their conversations"
  on public.conversations for select to authenticated
  using ((select auth.uid()) in (user_a, user_b));

create policy "Members read conversation messages"
  on public.messages for select to authenticated
  using (private.is_conversation_member(conversation_id));
create policy "Members send messages as themselves"
  on public.messages for insert to authenticated
  with check (
    (select auth.uid()) = sender_id
    and private.is_conversation_member(conversation_id)
  );

-- Notifications (own only)
create policy "Users read their notifications"
  on public.notifications for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "Users mark their notifications read"
  on public.notifications for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "Users delete their notifications"
  on public.notifications for delete to authenticated
  using ((select auth.uid()) = user_id);
