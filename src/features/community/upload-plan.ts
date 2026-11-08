/** A photo or video chosen in the composer, before upload. */
export type DraftMedia = {
  key: string;
  type: 'image' | 'video';
  uri: string;
  mimeType: string;
  durationMs: number | null;
  /** Local JPEG of a video's poster frame (made when picked). */
  posterUri: string | null;
};

/** What a post or story is tagged with: a landmark, or any place by name. */
export type PlaceTag = { destinationId: string | null; name: string; latitude: number | null; longitude: number | null };

/** An item after upload. */
export type UploadedMedia = { type: 'image' | 'video'; url: string; posterUrl: string | null; durationMs: number | null };

/**
 * The first item fills community_posts.image_url / video_url (older app
 * versions and previews show it); a video's poster is its image.
 */
export function coverColumns(media: UploadedMedia[]) {
  const first = media[0];
  if (!first) return { image_url: null, video_url: null, video_duration_ms: null };
  return first.type === 'video'
    ? { image_url: first.posterUrl, video_url: first.url, video_duration_ms: first.durationMs != null ? Math.round(first.durationMs) : null }
    : { image_url: first.url, video_url: null, video_duration_ms: null };
}

/** Share of the bytes sent so far, 0–1 (unknown sizes count as nothing). */
export function progressOf(totalBytes: number, sentBytes: number): number {
  if (totalBytes <= 0) return 0;
  return Math.max(0, Math.min(1, sentBytes / totalBytes));
}

export const VIDEO_TYPES: Record<string, string> = { 'video/mp4': 'mp4', 'video/quicktime': 'mov', 'video/3gpp': '3gp', 'video/webm': 'webm' };

/** A content type the post-videos bucket accepts, and its file extension. */
export function videoFileType(mimeType: string | null | undefined): { contentType: string; extension: string } {
  const contentType = mimeType && VIDEO_TYPES[mimeType] ? mimeType : 'video/mp4';
  return { contentType, extension: VIDEO_TYPES[contentType] };
}
