-- Live "is this username free?" check for sign-up (signed out) and profile edit.
-- Returns only a boolean; the caller's own current username counts as available.
create or replace function public.username_available(p_username text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select lower(p_username) ~ '^[a-z0-9_]{3,24}$'
     and not exists (
       select 1 from public.profiles p
        where p.username = lower(p_username)
          and p.id is distinct from (select auth.uid())
     );
$$;

revoke all on function public.username_available(text) from public;
grant execute on function public.username_available(text) to anon, authenticated;
