import { useCallback } from 'react';

import { StorageKeys, storage, useStorage } from '@/lib/storage';
import type { Story } from '@/lib/types';

/** Story ids this phone has viewed, with their expiry, so seen rings turn grey. */
type Seen = Record<string, string>;

export function markStorySeen(story: Pick<Story, 'id' | 'expires_at'>) {
  const now = new Date().toISOString();
  const seen = storage.get<Seen>(StorageKeys.storiesSeen, {});
  if (seen[story.id]) return;
  // Drop expired entries while writing, so the list never grows.
  const next: Seen = { [story.id]: story.expires_at };
  for (const [id, exp] of Object.entries(seen)) if (exp > now) next[id] = exp;
  storage.set(StorageKeys.storiesSeen, next);
}

export function useSeenStories() {
  const [seen] = useStorage<Seen>(StorageKeys.storiesSeen, {});
  return useCallback((id: string) => Boolean(seen[id]), [seen]);
}

export { orderStoryAuthors, type StoryGroup } from '@/features/community/story-order';
