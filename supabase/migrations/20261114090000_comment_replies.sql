-- Replies to comments, one level deep like the photo apps: a reply to a reply
-- hangs under the same top comment. A reply must be on the same post.
alter table public.post_comments
  add column parent_id uuid references public.post_comments(id) on delete cascade;

create index post_comments_parent_idx on public.post_comments (parent_id) where parent_id is not null;

create or replace function private.comment_before_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  p public.post_comments%rowtype;
begin
  if new.parent_id is null then
    return new;
  end if;
  select * into p from public.post_comments where id = new.parent_id;
  if not found or p.post_id <> new.post_id then
    raise exception 'You can only reply to a comment on this post.' using errcode = 'P0001';
  end if;
  if p.parent_id is not null then
    new.parent_id := p.parent_id;
  end if;
  return new;
end;
$$;

create trigger post_comments_before_insert
  before insert on public.post_comments
  for each row execute function private.comment_before_insert();
