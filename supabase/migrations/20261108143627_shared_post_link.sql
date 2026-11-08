-- Public view of one post for share links (https://<share site>/p?id=<post id>).
-- The post id (a random UUID) is the key. Only posts whose author has a public
-- profile are shown; others say "private" without revealing anything.
create function public.get_shared_post(p_id uuid)
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
    'created_at', p.created_at,
    'author', jsonb_build_object('name', coalesce(a.full_name, a.username), 'username', a.username, 'avatar_url', a.avatar_url),
    'place', coalesce(d.name || coalesce(', ' || d.city, ''), p.place_name),
    'likes', (select count(*) from public.post_likes l where l.post_id = p.id),
    'comments', (select count(*) from public.post_comments c where c.post_id = p.id)
  );
end;
$$;
revoke all on function public.get_shared_post(uuid) from public;
grant execute on function public.get_shared_post(uuid) to anon, authenticated;
