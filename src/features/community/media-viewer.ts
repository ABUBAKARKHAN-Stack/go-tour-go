import { router } from 'expo-router';

import type { CommunityPost } from '@/lib/types';

/** One photo or video in the full-screen viewer. */
export type ViewerItem = { key: string; type: 'image' | 'video'; url: string; poster: string | null };

/** A post's photos and videos in order (older posts have a single image or video). */
export function viewerItems(post: CommunityPost): ViewerItem[] {
  if (post.media?.length) {
    return post.media.map((m) => ({ key: m.id, type: m.type, url: m.url, poster: m.type === 'video' ? m.poster_url : null }));
  }
  if (post.video_url) return [{ key: `${post.id}-v`, type: 'video', url: post.video_url, poster: post.image_url }];
  if (post.image_url) return [{ key: `${post.id}-i`, type: 'image', url: post.image_url, poster: null }];
  return [];
}

// The post being opened, handed to the viewer so it shows at once (it loads the post itself if missing).
const handoff = new Map<string, CommunityPost>();

export function takeViewerPost(id: string) {
  return handoff.get(id) ?? null;
}

/** Opens a post's photos and videos full screen at `index`. */
export function openMediaViewer(post: CommunityPost, index = 0) {
  handoff.clear();
  handoff.set(post.id, post);
  router.push({ pathname: '/media/[id]', params: { id: post.id, index: String(index) } });
}
