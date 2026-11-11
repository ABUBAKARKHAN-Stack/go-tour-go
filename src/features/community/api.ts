import { useInfiniteQuery, useMutation, useQuery, useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { Share } from 'react-native';

import { useAuth } from '@/features/auth/auth-provider';
import { supabase } from '@/lib/supabase';
import type { CommunityPost, PostComment, Story } from '@/lib/types';
import { SHARE_SITE_URL } from '@/constants/app.constants';

export { formatCount } from '@/features/community/format';

const PAGE = 15;
const AUTHOR = 'author:profiles!community_posts_author_id_fkey(id, username, full_name, avatar_url)';

// Counts via embedded aggregates; `my_like` / `my_save` are filtered to the
// current user with .eq('my_like.user_id', ...), which filters only that
// embedded alias. `top_comment` is the newest comment (ordered and limited
// inside the embed).
const POST_SELECT = `*, ${AUTHOR}, destination:destinations(id, name, city), likes:post_likes(count), comments:post_comments(count), shares:post_shares(count), my_like:post_likes(user_id), my_save:saved_posts(user_id), top_comment:post_comments(id, author_id, body, created_at, author:profiles(id, username, full_name, avatar_url)), media:post_media(id, position, type, url, poster_url, duration_ms)`;

/** Applies the per-user filters and the top-comment limit every post query needs. */
function postQuery(userId: string) {
  return supabase
    .from('community_posts')
    .select(POST_SELECT)
    .eq('my_like.user_id', userId)
    .eq('my_save.user_id', userId)
    .order('created_at', { referencedTable: 'top_comment', ascending: false })
    .order('position', { referencedTable: 'media', ascending: true })
    .limit(1, { referencedTable: 'top_comment' });
}

/** Keeps the order of `ids` (the RPC / saved list order). */
function inOrder(posts: CommunityPost[], ids: string[]) {
  const byId = new Map(posts.map((p) => [p.id, p]));
  return ids.map((id) => byId.get(id)).filter((p): p is CommunityPost => Boolean(p));
}


export type FeedFilter = {
  destinationId?: string;
  authorId?: string;
  /** Only posts by these people (the Following feed). An empty list means no posts. */
  authorIds?: string[];
  /** Posts within `km` of a point (the Nearby feed). */
  near?: { latitude: number; longitude: number; km: number };
  /** Only the current user's saved posts, newest saved first. */
  saved?: boolean;
};

export function useFeed(filter?: FeedFilter) {
  const { userId } = useAuth();
  const authors = filter?.authorIds ? [...filter.authorIds].sort().join(',') : null;
  // Round the point (~1 km) so small GPS moves don't refetch the Nearby feed.
  const near = filter?.near ? `${filter.near.latitude.toFixed(2)},${filter.near.longitude.toFixed(2)},${filter.near.km}` : null;
  return useInfiniteQuery({
    queryKey: ['feed', filter?.destinationId ?? null, filter?.authorId ?? null, authors, near, filter?.saved ? 'saved' : null],
    enabled: Boolean(userId),
    initialPageParam: 0,
    getNextPageParam: (last: CommunityPost[], pages) => (last.length < PAGE ? undefined : pages.length * PAGE),
    queryFn: async ({ pageParam }) => {
      if (filter?.authorIds && filter.authorIds.length === 0) return [];
      if (filter?.near || filter?.saved) {
        let ids: string[];
        if (filter.near) {
          const { data, error } = await supabase.rpc('nearby_post_ids', {
            p_lat: Number(filter.near.latitude.toFixed(2)),
            p_lng: Number(filter.near.longitude.toFixed(2)),
            p_km: filter.near.km,
            p_limit: PAGE,
            p_offset: pageParam,
          });
          if (error) throw error;
          ids = (data ?? []) as string[];
        } else {
          const { data, error } = await supabase
            .from('saved_posts')
            .select('post_id')
            .order('created_at', { ascending: false })
            .range(pageParam, pageParam + PAGE - 1);
          if (error) throw error;
          ids = (data ?? []).map((r) => r.post_id as string);
        }
        if (ids.length === 0) return [];
        const { data, error } = await postQuery(userId!).in('id', ids);
        if (error) throw error;
        return inOrder(data as unknown as CommunityPost[], ids);
      }
      let q = postQuery(userId!)
        .order('created_at', { ascending: false })
        .range(pageParam, pageParam + PAGE - 1);
      if (filter?.destinationId) q = q.eq('destination_id', filter.destinationId);
      if (filter?.authorId) q = q.eq('author_id', filter.authorId);
      if (filter?.authorIds) q = q.in('author_id', filter.authorIds);
      const { data, error } = await q;
      if (error) throw error;
      return data as unknown as CommunityPost[];
    },
  });
}

/** How many posts are tagged at a landmark (for "See all (12)"). */
export function usePlacePostCount(destinationId: string | undefined) {
  const { userId } = useAuth();
  return useQuery({
    queryKey: ['feed', 'count', destinationId],
    enabled: Boolean(destinationId && userId),
    queryFn: async () => {
      const { count, error } = await supabase
        .from('community_posts')
        .select('id', { count: 'exact', head: true })
        .eq('destination_id', destinationId!);
      if (error) throw error;
      return count ?? 0;
    },
  });
}

export function usePost(id: string | undefined) {
  const { userId } = useAuth();
  return useQuery({
    queryKey: ['post', id],
    enabled: Boolean(id && userId),
    queryFn: async () => {
      const { data, error } = await postQuery(userId!).eq('id', id!).maybeSingle();
      if (error) throw error;
      return data as unknown as CommunityPost | null;
    },
  });
}

export function useComments(postId: string | undefined) {
  return useQuery({
    queryKey: ['comments', postId],
    enabled: Boolean(postId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('post_comments')
        .select('*, author:profiles(id, username, full_name, avatar_url)')
        .eq('post_id', postId!)
        .order('created_at', { ascending: true })
        .limit(100);
      if (error) throw error;
      return data as PostComment[];
    },
  });
}

type FeedData = InfiniteData<CommunityPost[]>;

export function useCommunityActions() {
  const qc = useQueryClient();
  const { userId, profile } = useAuth();

  const patchPost = (postId: string, fn: (p: CommunityPost) => CommunityPost) => {
    qc.setQueriesData<FeedData>({ queryKey: ['feed'] }, (data) =>
      data ? { ...data, pages: data.pages.map((page) => page.map((p) => (p.id === postId ? fn(p) : p))) } : data,
    );
    qc.setQueryData<CommunityPost | null>(['post', postId], (p) => (p ? fn(p) : p));
  };

  return {
    toggleLike: useMutation({
      mutationFn: async ({ postId, like }: { postId: string; like: boolean }) => {
        const { error } = like
          ? await supabase.from('post_likes').insert({ post_id: postId, user_id: userId })
          : await supabase.from('post_likes').delete().eq('post_id', postId).eq('user_id', userId!);
        if (error && error.code !== '23505') throw error;
      },
      onMutate: ({ postId, like }) => {
        patchPost(postId, (p) => ({
          ...p,
          my_like: like ? [{ user_id: userId! }] : [],
          likes: [{ count: Math.max(0, (p.likes[0]?.count ?? 0) + (like ? 1 : -1)) }],
        }));
      },
      onError: () => qc.invalidateQueries({ queryKey: ['feed'] }),
    }),

    // Bookmark: instant in the UI, rolled back if the write fails.
    toggleSave: useMutation({
      mutationFn: async ({ postId, save }: { postId: string; save: boolean }) => {
        const { error } = save
          ? await supabase.from('saved_posts').insert({ post_id: postId, user_id: userId })
          : await supabase.from('saved_posts').delete().eq('post_id', postId).eq('user_id', userId!);
        if (error && error.code !== '23505') throw error;
      },
      onMutate: ({ postId, save }) => patchPost(postId, (p) => ({ ...p, my_save: save ? [{ user_id: userId! }] : [] })),
      onError: (_e, { postId, save }) => patchPost(postId, (p) => ({ ...p, my_save: save ? [] : [{ user_id: userId! }] })),
      onSettled: () => qc.invalidateQueries({ queryKey: ['feed', null, null, null, null, 'saved'] }),
    }),

    // Opens the share sheet; counts a share only when the traveller completes it.
    sharePost: useMutation({
      mutationFn: async (post: CommunityPost) => {
        const place = post.destination ? `${post.destination.name}, ${post.destination.city}` : post.place_name;
        // The link opens a web page with the photos/video and an "Open in GoTourGo" button.
        const link = `${SHARE_SITE_URL}/p?id=${post.id}`;
        const message = [post.body ? `"${post.body}"` : null, place ? `📍 ${place}` : null, link].filter(Boolean).join('\n');
        const result = await Share.share({ message });
        if (result.action !== Share.sharedAction) return false;
        patchPost(post.id, (p) => ({ ...p, shares: [{ count: (p.shares[0]?.count ?? 0) + 1 }] }));
        await supabase.from('post_shares').insert({ post_id: post.id, user_id: userId });
        return true;
      },
    }),

    deletePost: useMutation({
      mutationFn: async (postId: string) => {
        const { error } = await supabase.from('community_posts').delete().eq('id', postId);
        if (error) throw error;
      },
      onSuccess: () => qc.invalidateQueries({ queryKey: ['feed'] }),
    }),

    // Comments show up at once (optimistic) and roll back if sending fails.
    addComment: useMutation({
      mutationFn: async ({ postId, body }: { postId: string; body: string; tempId: string }) => {
        const text = body.trim();
        if (!text) throw new Error('Write a comment first.');
        const { error } = await supabase.from('post_comments').insert({ post_id: postId, author_id: userId, body: text });
        if (error) throw error;
      },
      onMutate: ({ postId, body, tempId }) => {
        const pending: PostComment = {
          id: tempId,
          post_id: postId,
          author_id: userId!,
          body: body.trim(),
          created_at: new Date().toISOString(),
          author: profile ? { id: profile.id, username: profile.username, full_name: profile.full_name, avatar_url: profile.avatar_url } : null,
        };
        qc.setQueryData<PostComment[]>(['comments', postId], (list) => [...(list ?? []), pending]);
        patchPost(postId, (p) => ({ ...p, comments: [{ count: (p.comments[0]?.count ?? 0) + 1 }] }));
      },
      onError: (_e, v) => {
        qc.setQueryData<PostComment[]>(['comments', v.postId], (list) => list?.filter((c) => c.id !== v.tempId));
        patchPost(v.postId, (p) => ({ ...p, comments: [{ count: Math.max(0, (p.comments[0]?.count ?? 1) - 1) }] }));
      },
      onSettled: (_d, _e, v) => qc.invalidateQueries({ queryKey: ['comments', v.postId] }),
    }),

    deleteComment: useMutation({
      mutationFn: async ({ id }: { id: string; postId: string }) => {
        const { error } = await supabase.from('post_comments').delete().eq('id', id);
        if (error) throw error;
      },
      onMutate: ({ id, postId }) => {
        qc.setQueryData<PostComment[]>(['comments', postId], (list) => list?.filter((c) => c.id !== id));
        patchPost(postId, (p) => ({ ...p, comments: [{ count: Math.max(0, (p.comments[0]?.count ?? 1) - 1) }] }));
      },
      onSettled: (_d, _e, v) => {
        qc.invalidateQueries({ queryKey: ['comments', v.postId] });
        qc.invalidateQueries({ queryKey: ['feed'] });
      },
    }),
  };
}

export function useStories() {
  const { userId } = useAuth();
  return useQuery({
    queryKey: ['stories'],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stories')
        .select('*, author:profiles(id, username, full_name, avatar_url)')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(40);
      if (error) throw error;
      return data as Story[];
    },
  });
}

export function useStoryActions() {
  const qc = useQueryClient();
  return {
    remove: useMutation({
      mutationFn: async (id: string) => {
        const { error } = await supabase.from('stories').delete().eq('id', id);
        if (error) throw error;
      },
      onSuccess: () => qc.invalidateQueries({ queryKey: ['stories'] }),
    }),
  };
}

/** Posts whose text or place matches `term` (2+ characters), newest first. */
export function usePostSearch(term: string) {
  const { userId } = useAuth();
  const q = term.trim().replace(/[%,()]/g, ' ').trim();
  return useQuery({
    queryKey: ['post-search', q],
    enabled: Boolean(userId) && q.length >= 2,
    queryFn: async () => {
      const { data, error } = await postQuery(userId!)
        .or(`body.ilike.%${q}%,place_name.ilike.%${q}%`)
        .order('created_at', { ascending: false })
        .limit(30);
      if (error) throw error;
      return data as unknown as CommunityPost[];
    },
  });
}

/**
 * Star ratings that the authors of the shown top comments gave the post's
 * landmark (the "★ 5.0" next to a commenter). Keyed `${userId}:${destinationId}`.
 */
export function useCommenterRatings(posts: CommunityPost[]) {
  const pairs = posts
    .filter((p) => p.destination_id && p.top_comment[0])
    .map((p) => ({ user: p.top_comment[0].author_id, dest: p.destination_id! }));
  const users = [...new Set(pairs.map((x) => x.user))].sort();
  const dests = [...new Set(pairs.map((x) => x.dest))].sort();
  const query = useQuery({
    queryKey: ['commenter-ratings', users.join(','), dests.join(',')],
    enabled: users.length > 0,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.from('reviews').select('user_id, destination_id, rating').in('user_id', users).in('destination_id', dests);
      if (error) throw error;
      return Object.fromEntries((data ?? []).map((r) => [`${r.user_id}:${r.destination_id}`, r.rating as number])) as Record<string, number>;
    },
  });
  return query.data ?? {};
}
