-- Realtime (database Broadcast to private channels), Storage buckets and the
-- AI usage counter used by the `ai` Edge Function.

-- ---------------------------------------------------------------------------
-- Realtime: broadcast row changes from the database to private topics.
--   conversation:<conversation_id>  new messages
--   location:<user_id>              a user's shared location
--   notifications:<user_id>         a user's in-app notifications
-- Clients subscribe with `{ config: { private: true } }`.
-- ---------------------------------------------------------------------------
create or replace function private.broadcast_message_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform realtime.broadcast_changes(
    'conversation:' || new.conversation_id::text,
    tg_op, tg_op, tg_table_name, tg_table_schema, new, old
  );
  return null;
end;
$$;

create trigger messages_broadcast
  after insert on public.messages
  for each row execute function private.broadcast_message_insert();

create or replace function private.broadcast_location_share()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  rec public.location_shares := coalesce(new, old);
begin
  perform realtime.broadcast_changes(
    'location:' || rec.user_id::text,
    tg_op, tg_op, tg_table_name, tg_table_schema, new, old
  );
  return null;
end;
$$;

create trigger location_shares_broadcast
  after insert or update or delete on public.location_shares
  for each row execute function private.broadcast_location_share();

create or replace function private.broadcast_notification_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform realtime.broadcast_changes(
    'notifications:' || new.user_id::text,
    tg_op, tg_op, tg_table_name, tg_table_schema, new, old
  );
  return null;
end;
$$;

create trigger notifications_broadcast
  after insert on public.notifications
  for each row execute function private.broadcast_notification_insert();

-- Topic authorization. Parses "<kind>:<uuid>" safely (invalid topics -> false).
create or replace function private.can_access_topic(topic text)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  kind text := split_part(topic, ':', 1);
  raw_id text := split_part(topic, ':', 2);
  target uuid;
  me uuid := (select auth.uid());
begin
  if me is null or raw_id !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    return false;
  end if;
  target := raw_id::uuid;

  if kind = 'notifications' then
    return target = me;
  elsif kind = 'conversation' then
    return private.is_conversation_member(target);
  elsif kind = 'location' then
    return target = me or private.are_friends(me, target);
  end if;
  return false;
end;
$$;

grant execute on function private.can_access_topic(text) to authenticated;

-- RLS is already enabled on realtime.messages; only add policies.
create policy "Authorized users receive GoTourGo broadcasts"
  on realtime.messages for select to authenticated
  using (
    realtime.messages.extension = 'broadcast'
    and private.can_access_topic((select realtime.topic()))
  );

-- ---------------------------------------------------------------------------
-- Storage: public-read image buckets; users write only under "<uid>/..."
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars', 'avatars', true, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('post-images', 'post-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('story-images', 'story-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('review-images', 'review-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "Users upload images into their own folder"
  on storage.objects for insert to authenticated
  with check (
    bucket_id in ('avatars', 'post-images', 'story-images', 'review-images')
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "Users update their own images"
  on storage.objects for update to authenticated
  using (
    bucket_id in ('avatars', 'post-images', 'story-images', 'review-images')
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id in ('avatars', 'post-images', 'story-images', 'review-images')
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "Users delete their own images"
  on storage.objects for delete to authenticated
  using (
    bucket_id in ('avatars', 'post-images', 'story-images', 'review-images')
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- ---------------------------------------------------------------------------
-- AI usage counter (written by the Edge Function with the service role only)
-- ---------------------------------------------------------------------------
create table public.ai_usage (
  user_id uuid not null references public.profiles (id) on delete cascade,
  day date not null default current_date,
  request_count integer not null default 0,
  primary key (user_id, day)
);

alter table public.ai_usage enable row level security;
revoke all on table public.ai_usage from anon, authenticated;

-- Atomically increments today's counter and returns the new value.
create or replace function private.increment_ai_usage(uid uuid)
returns integer
language sql
security definer
set search_path = ''
as $$
  insert into public.ai_usage as u (user_id, day, request_count)
  values (uid, current_date, 1)
  on conflict (user_id, day) do update set request_count = u.request_count + 1
  returning u.request_count;
$$;

revoke all on function private.increment_ai_usage(uuid) from public, anon, authenticated;

-- Exposed wrapper callable only by the service role from the Edge Function.
create or replace function public.increment_ai_usage(uid uuid)
returns integer
language sql
security definer
set search_path = ''
as $$
  select private.increment_ai_usage(uid);
$$;

revoke all on function public.increment_ai_usage(uuid) from public, anon, authenticated;
grant execute on function public.increment_ai_usage(uuid) to service_role;
