import type { Story } from '@/lib/types';

/**
 * Story authors in the order the strip shows them: yours first, then people
 * with unseen stories (newest first), then those you have seen.
 */
export function orderStoryAuthors(stories: Story[], userId: string | null, isSeen: (id: string) => boolean) {
  const byAuthor = new Map<string, Story[]>();
  for (const s of stories) {
    const list = byAuthor.get(s.author_id) ?? [];
    list.push(s);
    byAuthor.set(s.author_id, list);
  }
  const groups = [...byAuthor.entries()].map(([authorId, list]) => {
    const sorted = [...list].sort((a, b) => a.created_at.localeCompare(b.created_at));
    return {
      authorId,
      author: sorted[sorted.length - 1].author,
      stories: sorted,
      latest: sorted[sorted.length - 1],
      allSeen: sorted.every((s) => isSeen(s.id)),
    };
  });
  return groups.sort((a, b) => {
    if (a.authorId === userId) return -1;
    if (b.authorId === userId) return 1;
    if (a.allSeen !== b.allSeen) return a.allSeen ? 1 : -1;
    return b.latest.created_at.localeCompare(a.latest.created_at);
  });
}

export type StoryGroup = ReturnType<typeof orderStoryAuthors>[number];
