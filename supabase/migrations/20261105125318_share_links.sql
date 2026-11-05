-- SOS and live-location links: https://gotourgo.expo.app/sos?t=<token> and /live?t=<token>.
-- The token is unguessable (122 random bits). A link shows the sender's position
-- (their live position while they share it) for at most 24 hours, or until they
-- end it. Anyone with the link can view it, signed in or not, through
-- public.get_shared_location(); the table itself stays private to its owner.

alter table public.sos_events
  add column kind text not null default 'sos' check (kind in ('sos', 'live')),
  add column token text not null default replace(gen_random_uuid()::text, '-', ''),
  add column expires_at timestamptz not null default now() + interval '24 hours',
  add column ended_at timestamptz,
  add column phone text check (phone is null or phone ~ '^\+?[0-9]{7,15}$');

create unique index sos_events_token_idx on public.sos_events (token);

-- The server picks the token and caps the lifetime at 24 hours.
create or replace function private.prepare_share_link()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.token := replace(gen_random_uuid()::text, '-', '');
  new.created_at := now();
  new.ended_at := null;
  new.expires_at := least(coalesce(new.expires_at, now() + interval '24 hours'), now() + interval '24 hours');
  if new.expires_at < now() + interval '5 minutes' then
    new.expires_at := now() + interval '5 minutes';
  end if;
  return new;
end;
$$;

create trigger sos_events_prepare_link
  before insert on public.sos_events
  for each row execute function private.prepare_share_link();

-- Friends hear about SOS (not live-location links), and the alert opens the link.
create or replace function private.notify_sos()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  sender_name text;
begin
  if new.kind <> 'sos' then
    return null;
  end if;
  select coalesce(p.full_name, p.username) into sender_name
    from public.profiles p where p.id = new.user_id;

  insert into public.notifications (user_id, type, title, body, data)
  select
    case when f.requester_id = new.user_id then f.addressee_id else f.requester_id end,
    'sos',
    'SOS from ' || coalesce(sender_name, 'a friend'),
    'Your friend triggered SOS in GoTourGo. Check on them.',
    jsonb_build_object('user_id', new.user_id, 'latitude', new.latitude,
                       'longitude', new.longitude, 'sos_id', new.id, 'token', new.token)
  from public.friendships f
  where f.status = 'accepted'
    and new.user_id in (f.requester_id, f.addressee_id);
  return null;
end;
$$;

-- What a link shows. Returns null for unknown tokens.
create or replace function public.get_shared_location(p_token text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  e public.sos_events;
  sender_name text;
  sender_avatar text;
  s public.location_shares;
  live boolean := false;
  base jsonb;
begin
  if p_token is null or p_token !~ '^[0-9a-f]{32}$' then
    return null;
  end if;
  select * into e from public.sos_events where token = p_token;
  if not found then
    return null;
  end if;
  select coalesce(p.full_name, p.username), p.avatar_url into sender_name, sender_avatar
    from public.profiles p where p.id = e.user_id;

  base := jsonb_build_object(
    'kind', e.kind,
    'name', coalesce(sender_name, 'A GoTourGo traveller'),
    'avatar_url', sender_avatar,
    'created_at', e.created_at,
    'expires_at', e.expires_at,
    'ended_at', e.ended_at,
    'is_owner', e.user_id = (select auth.uid())
  );
  if e.ended_at is not null then
    return base || jsonb_build_object('status', 'ended');
  end if;
  if e.expires_at <= now() then
    return base || jsonb_build_object('status', 'expired');
  end if;

  select * into s from public.location_shares ls
   where ls.user_id = e.user_id
     and ls.is_active
     and (ls.expires_at is null or ls.expires_at > now());
  live := found;

  return base || jsonb_build_object(
    'status', 'active',
    'live', live,
    'latitude', case when live then s.latitude else e.latitude end,
    'longitude', case when live then s.longitude else e.longitude end,
    'accuracy', case when live then s.accuracy else e.accuracy end,
    'located_at', case when live then s.updated_at else e.created_at end,
    'phone', e.phone
  );
end;
$$;

-- The sender ends a link ("I'm safe" / stop sharing).
create or replace function public.end_shared_location(p_token text)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.sos_events
     set ended_at = now()
   where token = p_token
     and user_id = (select auth.uid())
     and ended_at is null;
$$;

-- Ends all of the caller's live-location links (when they stop sharing).
create or replace function public.end_my_live_links()
returns void
language sql
security definer
set search_path = ''
as $$
  update public.sos_events
     set ended_at = now()
   where user_id = (select auth.uid())
     and kind = 'live'
     and ended_at is null
     and expires_at > now();
$$;

revoke all on function public.get_shared_location(text) from public;
revoke all on function public.end_shared_location(text) from public;
revoke all on function public.end_my_live_links() from public;
grant execute on function public.get_shared_location(text) to anon, authenticated;
grant execute on function public.end_shared_location(text) to authenticated;
grant execute on function public.end_my_live_links() to authenticated;
