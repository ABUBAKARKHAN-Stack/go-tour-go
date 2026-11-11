-- Guest mode (PR 7): anonymous sign-ins can explore, save places, plan trips,
-- use the AI guide and send an SOS, but not post, comment, like, review,
-- follow, befriend, message, share their live location or report hazards.
-- Enforced here with RESTRICTIVE policies (they AND with the existing
-- permissive ones), not only in the app.

-- Guests stay out of people search: profiles carry is_guest, set on sign-up
-- and cleared when the guest creates an account.
alter table public.profiles add column is_guest boolean not null default false;
create index profiles_not_guest_idx on public.profiles (is_guest) where is_guest;

-- True for an anonymous (guest) session.
create or replace function private.is_guest()
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce(((select auth.jwt()) ->> 'is_anonymous')::boolean, false)
$$;
grant execute on function private.is_guest() to authenticated;

-- Social writes.
create policy "Guests cannot post" on public.community_posts as restrictive for insert to authenticated with check (not private.is_guest());
create policy "Guests cannot edit posts" on public.community_posts as restrictive for update to authenticated using (not private.is_guest());
create policy "Guests cannot add post media" on public.post_media as restrictive for insert to authenticated with check (not private.is_guest());
create policy "Guests cannot comment" on public.post_comments as restrictive for insert to authenticated with check (not private.is_guest());
create policy "Guests cannot like" on public.post_likes as restrictive for insert to authenticated with check (not private.is_guest());
create policy "Guests cannot post stories" on public.stories as restrictive for insert to authenticated with check (not private.is_guest());
create policy "Guests cannot review" on public.reviews as restrictive for insert to authenticated with check (not private.is_guest());
create policy "Guests cannot edit reviews" on public.reviews as restrictive for update to authenticated using (not private.is_guest());
create policy "Guests cannot follow" on public.follows as restrictive for insert to authenticated with check (not private.is_guest());
create policy "Guests cannot message" on public.messages as restrictive for insert to authenticated with check (not private.is_guest());
-- A guest's profile is the automatic traveler_<id> one; it changes only after they create an account.
create policy "Guests cannot edit their profile" on public.profiles as restrictive for update to authenticated using (not private.is_guest());

-- Location sharing: no live sharing or live links for guests. SOS links stay
-- allowed, so a guest in trouble can still send their position.
create policy "Guests cannot share live location" on public.location_shares as restrictive for insert to authenticated with check (not private.is_guest());
create policy "Guests cannot update live location" on public.location_shares as restrictive for update to authenticated using (not private.is_guest());
create policy "Guests cannot choose location viewers" on public.location_share_viewers as restrictive for insert to authenticated with check (not private.is_guest());
create policy "Guests cannot create live links" on public.sos_events as restrictive for insert to authenticated with check (kind <> 'live' or not private.is_guest());

-- Uploads (avatars, post, story and review media) are for accounts only.
create policy "Guests cannot upload" on storage.objects as restrictive for insert to authenticated with check (not private.is_guest());

-- Security-definer RPCs skip table policies, so they check for guests themselves.
create or replace function public.send_friend_request(target uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $function$
declare
  me uuid := (select auth.uid());
  existing public.friendships;
  result uuid;
begin
  if me is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;
  if private.is_guest() then
    raise exception 'Create a free account to add friends' using errcode = '42501';
  end if;
  if target = me then
    raise exception 'You cannot add yourself' using errcode = 'P0001';
  end if;
  if not exists (select 1 from public.profiles p where p.id = target and p.allow_friend_requests and not p.is_guest) then
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
$function$;

create or replace function public.respond_friend_request(request_id uuid, accept boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if private.is_guest() then
    raise exception 'Create a free account to add friends' using errcode = '42501';
  end if;
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
$function$;

create or replace function public.start_conversation(other uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $function$
declare
  me uuid := (select auth.uid());
  a uuid := least(me, other);
  b uuid := greatest(me, other);
  result uuid;
begin
  if me is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;
  if private.is_guest() then
    raise exception 'Create a free account to send messages' using errcode = '42501';
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
$function$;


create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  requested text := lower(coalesce(new.raw_user_meta_data ->> 'username', ''));
  final_username text;
begin
  if requested ~ '^[a-z0-9_]{3,24}$'
     and not exists (select 1 from public.profiles p where p.username = requested) then
    final_username := requested;
  else
    final_username := 'traveler_' || substr(replace(new.id::text, '-', ''), 1, 10);
  end if;

  insert into public.profiles (id, username, full_name, is_guest)
  values (
    new.id,
    final_username,
    nullif(left(coalesce(new.raw_user_meta_data ->> 'full_name', ''), 80), ''),
    coalesce(new.is_anonymous, false)
  );
  return new;
end;
$function$;

create or replace function private.sync_guest_flag()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  update public.profiles set is_guest = coalesce(new.is_anonymous, false) where id = new.id;
  return new;
end;
$function$;

create trigger on_auth_user_guest_change
  after update of is_anonymous on auth.users
  for each row
  when (old.is_anonymous is distinct from new.is_anonymous)
  execute function private.sync_guest_flag();

-- Housekeeping helper (not scheduled): removes guests inactive for 30 days.
-- Run by hand or from a pg_cron job if the owner enables it:
--   select private.delete_stale_guests();
create or replace function private.delete_stale_guests(max_age interval default interval '30 days')
returns integer
language plpgsql
security definer
set search_path = ''
as $function$
declare
  removed integer;
begin
  with gone as (
    delete from auth.users u
     where u.is_anonymous
       and u.created_at < now() - max_age
       and coalesce(u.last_sign_in_at, u.created_at) < now() - max_age
     returning 1
  )
  select count(*) into removed from gone;
  return removed;
end;
$function$;
revoke all on function private.delete_stale_guests(interval) from public, anon, authenticated;
