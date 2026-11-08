-- Selected buddies for live location sharing (client brief 7.3).
-- A share is seen by all accepted friends (audience = 'friends', the default and
-- what SOS uses) or only by the friends the owner picked (audience = 'selected').
-- The picked friends are kept in location_share_viewers so the choice is
-- remembered for the next share.

alter table public.location_shares
  add column audience text not null default 'friends'
  check (audience in ('friends', 'selected'));

create table public.location_share_viewers (
  owner_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  viewer_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (owner_id, viewer_id),
  check (owner_id <> viewer_id)
);
create index location_share_viewers_viewer_idx on public.location_share_viewers (viewer_id);

alter table public.location_share_viewers enable row level security;
revoke all on table public.location_share_viewers from anon, authenticated;
grant select, insert, delete on table public.location_share_viewers to authenticated;

create policy "Owners see their chosen viewers"
  on public.location_share_viewers for select to authenticated
  using (owner_id = (select auth.uid()));
create policy "Owners choose friends as viewers"
  on public.location_share_viewers for insert to authenticated
  with check (owner_id = (select auth.uid()) and private.are_friends(owner_id, viewer_id));
create policy "Owners remove viewers"
  on public.location_share_viewers for delete to authenticated
  using (owner_id = (select auth.uid()));

-- May `viewer` see `owner`'s shared location? Friends only; with a selected
-- audience, only the picked friends.
create function private.can_see_location(viewer uuid, owner uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.are_friends(viewer, owner)
    and (
      coalesce((select s.audience from public.location_shares s where s.user_id = owner), 'friends') = 'friends'
      or exists (select 1 from public.location_share_viewers v where v.owner_id = owner and v.viewer_id = viewer)
    );
$$;
revoke all on function private.can_see_location(uuid, uuid) from public, anon;
grant execute on function private.can_see_location(uuid, uuid) to authenticated;

alter policy "Owners and friends see active location shares"
  on public.location_shares
  using (
    user_id = (select auth.uid())
    or (
      is_active
      and (expires_at is null or expires_at > now())
      and private.can_see_location((select auth.uid()), user_id)
    )
  );

-- Realtime topic location:<id> follows the same rule.
create or replace function private.can_access_topic(topic text)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $function$
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
    return target = me or private.can_see_location(me, target);
  end if;
  return false;
end;
$function$;

-- The broadcast only says "this share changed"; clients re-read the row through
-- RLS. So a friend who joined the topic before being left out of a selected
-- audience never receives coordinates.
create or replace function private.broadcast_location_share()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  rec public.location_shares := coalesce(new, old);
begin
  perform realtime.send(
    jsonb_build_object('record', jsonb_build_object('user_id', rec.user_id)),
    tg_op,
    'location:' || rec.user_id::text,
    true
  );
  return null;
end;
$$;

-- Changing the chosen viewers also tells current subscribers to re-read.
create function private.broadcast_location_viewers()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  owner uuid := coalesce(new.owner_id, old.owner_id);
begin
  perform realtime.send(
    jsonb_build_object('record', jsonb_build_object('user_id', owner)),
    'UPDATE',
    'location:' || owner::text,
    true
  );
  return null;
end;
$$;

create trigger location_share_viewers_broadcast
  after insert or delete on public.location_share_viewers
  for each row execute function private.broadcast_location_viewers();
