import { describe, expect, test } from 'bun:test';

import { orderStoryAuthors } from '@/features/community/story-order';
import type { Story } from '@/lib/types';

const story = (id: string, author: string, created: string): Story => ({
  id,
  author_id: author,
  image_url: `https://example.com/${id}.jpg`,
  caption: null,
  place_name: null,
  destination_id: null,
  created_at: created,
  expires_at: '2099-01-01T00:00:00Z',
  author: { id: author, username: author, full_name: null, avatar_url: null },
});

describe('orderStoryAuthors', () => {
  const stories = [
    story('a1', 'ali', '2026-11-06T08:00:00Z'),
    story('a2', 'ali', '2026-11-06T10:00:00Z'),
    story('b1', 'bina', '2026-11-06T09:00:00Z'),
    story('m1', 'me', '2026-11-06T07:00:00Z'),
    story('c1', 'chand', '2026-11-06T11:00:00Z'),
  ];

  test('own stories first, then unseen newest first, then seen', () => {
    const seen = new Set(['c1']);
    const groups = orderStoryAuthors(stories, 'me', (id) => seen.has(id));
    expect(groups.map((g) => g.authorId)).toEqual(['me', 'ali', 'bina', 'chand']);
    expect(groups.find((g) => g.authorId === 'chand')?.allSeen).toBe(true);
  });

  test("an author's stories play oldest first and the latest is the bubble", () => {
    const ali = orderStoryAuthors(stories, null, () => false).find((g) => g.authorId === 'ali')!;
    expect(ali.stories.map((s) => s.id)).toEqual(['a1', 'a2']);
    expect(ali.latest.id).toBe('a2');
  });

  test('an author counts as seen only when every story is seen', () => {
    const groups = orderStoryAuthors(stories, null, (id) => id === 'a1');
    expect(groups.find((g) => g.authorId === 'ali')?.allSeen).toBe(false);
  });
});
