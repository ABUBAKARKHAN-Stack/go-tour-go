-- Video posts (client brief 6.2). A post can carry one short video; its
-- image_url then holds the poster frame shown before playback.

alter table public.community_posts
  add column video_url text check (video_url is null or video_url like 'https://%'),
  add column video_duration_ms integer check (video_duration_ms is null or video_duration_ms between 0 and 120000);

-- Public-read bucket, 50 MB per file (the free plan's upload limit), video types only.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('post-videos', 'post-videos', true, 52428800, array['video/mp4', 'video/quicktime', 'video/3gpp', 'video/webm'])
on conflict (id) do nothing;

-- Same rule as the image buckets: users write only inside "<their id>/".
alter policy "Users upload images into their own folder"
  on storage.objects
  with check (
    bucket_id in ('avatars', 'post-images', 'story-images', 'review-images', 'post-videos')
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

alter policy "Users update their own images"
  on storage.objects
  using (
    bucket_id in ('avatars', 'post-images', 'story-images', 'review-images', 'post-videos')
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id in ('avatars', 'post-images', 'story-images', 'review-images', 'post-videos')
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

alter policy "Users delete their own images"
  on storage.objects
  using (
    bucket_id in ('avatars', 'post-images', 'story-images', 'review-images', 'post-videos')
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
