import { useSyncExternalStore } from 'react';

import { coverColumns, progressOf, videoFileType, type DraftMedia, type PlaceTag, type UploadedMedia } from '@/features/community/upload-plan';
import { haptics } from '@/lib/haptics';
import { queryClient } from '@/lib/query-client';
import { STORAGE_BUCKETS, supabase } from '@/lib/supabase';
import { compressImage } from '@/lib/upload';
import { localFileSize, uploadWithProgress } from '@/lib/upload-progress';

/**
 * Posts and stories upload in the background: the composer hands a job to
 * this queue and closes at once; the Community feed shows each job's progress
 * (and Retry / Discard if it fails). Jobs live while the app runs; finished
 * items are kept on retry, so only what is missing is sent again.
 */
export type UploadJob = {
  id: string;
  kind: 'post' | 'story';
  userId: string;
  media: DraftMedia[];
  caption: string;
  place: PlaceTag | null;
  status: 'uploading' | 'failed';
  progress: number;
  error?: string;
  /** Uploaded items by DraftMedia.key (kept across retries). */
  done: Record<string, UploadedMedia>;
  /** Stories already created, by DraftMedia.key (so a retry doesn't repeat them). */
  posted?: Record<string, true>;
};

let jobs: UploadJob[] = [];
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function update(id: string, patch: Partial<UploadJob>) {
  jobs = jobs.map((j) => (j.id === id ? { ...j, ...patch } : j));
  emit();
}

export function useUploadJobs(): UploadJob[] {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => jobs,
  );
}

/** Queues a post or story and starts uploading it. Returns immediately. */
export function startUpload(input: Omit<UploadJob, 'id' | 'status' | 'progress' | 'done'>) {
  const job: UploadJob = { ...input, id: `up-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, status: 'uploading', progress: 0, done: {} };
  jobs = [job, ...jobs];
  emit();
  void run(job.id);
}

export function retryUpload(id: string) {
  update(id, { status: 'uploading', error: undefined });
  void run(id);
}

export function discardUpload(id: string) {
  jobs = jobs.filter((j) => j.id !== id);
  emit();
}

type Part = { media: DraftMedia; fileUri: string; posterUri: string | null; bytes: number };

async function run(id: string) {
  const job = jobs.find((j) => j.id === id);
  if (!job) return;
  try {
    // Photos are resized first (max 1280 px JPEG), so the sizes below are what is sent.
    const parts: Part[] = [];
    for (const m of job.media) {
      if (job.done[m.key]) continue;
      const fileUri = m.type === 'image' ? (await compressImage(m.uri)).uri : m.uri;
      const bytes = localFileSize(fileUri) + (m.posterUri ? localFileSize(m.posterUri) : 0);
      parts.push({ media: m, fileUri, posterUri: m.posterUri, bytes });
    }
    const total = parts.reduce((n, p) => n + p.bytes, 0);
    let sent = 0;
    const report = (current: number) => update(id, { progress: progressOf(total, sent + current) });

    for (const part of parts) {
      const { media } = part;
      let posterUrl: string | null = null;
      let posterBytes = 0;
      if (media.type === 'video' && part.posterUri) {
        posterBytes = localFileSize(part.posterUri);
        posterUrl = await uploadWithProgress(STORAGE_BUCKETS.posts, job.userId, part.posterUri, 'image/jpeg', 'jpg', report).catch(() => null);
      }
      const { contentType, extension } = media.type === 'video' ? videoFileType(media.mimeType) : { contentType: 'image/jpeg', extension: 'jpg' };
      const bucket = media.type === 'video' ? STORAGE_BUCKETS.postVideos : job.kind === 'story' ? STORAGE_BUCKETS.stories : STORAGE_BUCKETS.posts;
      const url = await uploadWithProgress(bucket, job.userId, part.fileUri, contentType, extension, (b) => report(posterBytes + b));
      sent += part.bytes;
      const latest = jobs.find((j) => j.id === id);
      if (!latest) return; // discarded meanwhile
      update(id, { done: { ...latest.done, [media.key]: { type: media.type, url, posterUrl, durationMs: media.durationMs } } });
    }

    const finished = jobs.find((j) => j.id === id);
    if (!finished) return;
    if (finished.kind === 'post') {
      const uploaded = finished.media.map((m) => finished.done[m.key]).filter((m): m is UploadedMedia => Boolean(m));
      await createPost(finished, uploaded);
    } else {
      await createStories(finished);
    }

    discardUpload(id);
    haptics.success();
    queryClient.invalidateQueries({ queryKey: finished.kind === 'post' ? ['feed'] : ['stories'] });
  } catch (e) {
    haptics.error();
    update(id, { status: 'failed', error: e instanceof Error ? e.message : String(e) });
  }
}

async function createPost(job: UploadJob, media: UploadedMedia[]) {
  const { data, error } = await supabase
    .from('community_posts')
    .insert({
      author_id: job.userId,
      body: job.caption.trim(),
      ...coverColumns(media),
      destination_id: job.place?.destinationId ?? null,
      place_name: job.place?.name ?? null,
      latitude: job.place?.latitude ?? null,
      longitude: job.place?.longitude ?? null,
    })
    .select('id')
    .single();
  if (error) throw error;
  if (media.length === 0) return;
  const { error: mediaError } = await supabase.from('post_media').insert(
    media.map((m, position) => ({
      post_id: data.id,
      position,
      type: m.type,
      url: m.url,
      poster_url: m.posterUrl,
      duration_ms: m.durationMs != null ? Math.round(m.durationMs) : null,
    })),
  );
  if (mediaError) {
    // Don't leave a half post behind; the job can be retried (files are kept).
    await supabase.from('community_posts').delete().eq('id', data.id);
    throw mediaError;
  }
}

/** One story per item, inserted in order so the viewer plays them in the order chosen. */
async function createStories(job: UploadJob) {
  for (const draft of job.media) {
    const m = job.done[draft.key];
    if (!m || jobs.find((j) => j.id === job.id)?.posted?.[draft.key]) continue;
    const image_url = m.type === 'video' ? m.posterUrl : m.url;
    if (!image_url) throw new Error('A video story needs its preview frame. Try again.');
    const { error } = await supabase.from('stories').insert({
      author_id: job.userId,
      image_url,
      video_url: m.type === 'video' ? m.url : null,
      video_duration_ms: m.type === 'video' && m.durationMs != null ? Math.round(m.durationMs) : null,
      caption: job.caption.trim() || null,
      place_name: job.place?.name ?? null,
      destination_id: job.place?.destinationId ?? null,
    });
    if (error) throw error;
    const latest = jobs.find((j) => j.id === job.id);
    update(job.id, { posted: { ...latest?.posted, [draft.key]: true } });
  }
}
