import { useInfiniteQuery, useMutation, useQuery, useQueryClient, type InfiniteData } from '@tanstack/react-query';

import { useAuth } from '@/features/auth/auth-provider';
import { STORAGE_BUCKETS, supabase } from '@/lib/supabase';
import type { CommunityPost, PostComment, Story } from '@/lib/types';
import { uploadImage } from '@/lib/upload';

const PAGE = 15;
const AUTHOR = 'author:profiles!community_posts_author_id_fkey(id, username, full_name, avatar_url)';

// Counts via embedded aggregates; `my_like` is filtered to the current user
// with .eq('my_like.user_id', ...), which filters only that embedded alias.
const POST_SELECT = `*, ${AUTHOR}, destination:destinations(id, name, city), likes:post_likes(count), comments:post_comments(count), my_like:post_likes(user_id)`;

export function useFeed(filter?: { destinationId?: string; authorId?: string }) {
  const { userId } = useAuth();
  return useInfiniteQuery({
    queryKey: ['feed', filter?.destinationId ?? null, filter?.authorId ?? null],
    enabled: Boolean(userId),
    initialPageParam: 0,
    getNextPageParam: (last: CommunityPost[], pages) => (last.length < PAGE ? undefined : pages.length * PAGE),
    queryFn: async ({ pageParam }) => {
      let q = supabase
        .from('community_posts')
        .select(POST_SELECT)
        .eq('my_like.user_id', userId!)
        .order('created_at', { ascending: false })
        .range(pageParam, pageParam + PAGE - 1);
      if (filter?.destinationId) q = q.eq('destination_id', filter.destinationId);
      if (filter?.authorId) q = q.eq('author_id', filter.authorId);
      const { data, error } = await q;
      if (error) throw error;
      return data as unknown as CommunityPost[];
    },
  });
}

export function usePost(id: string | undefined) {
  const { userId } = useAuth();
  return useQuery({
    queryKey: ['post', id],
    enabled: Boolean(id && userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('community_posts')
        .select(POST_SELECT)
        .eq('my_like.user_id', userId!)
        .eq('id', id!)
        .maybeSingle();
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
  const { userId } = useAuth();

  const patchPost = (postId: string, fn: (p: CommunityPost) => CommunityPost) => {
    qc.setQueriesData<FeedData>({ queryKey: ['feed'] }, (data) =>
      data ? { ...data, pages: data.pages.map((page) => page.map((p) => (p.id === postId ? fn(p) : p))) } : data,
    );
    qc.setQueryData<CommunityPost | null>(['post', postId], (p) => (p ? fn(p) : p));
  };

  return {
    createPost: useMutation({
      mutationFn: async (input: {
        body: string;
        imageLocalUri?: string | null;
        destinationId?: string | null;
        placeName?: string | null;
        latitude?: number | null;
        longitude?: number | null;
      }) => {
        const body = input.body.trim();
        if (!body) throw new Error('Write something to share.');
        const image_url = input.imageLocalUri ? await uploadImage(STORAGE_BUCKETS.posts, userId!, input.imageLocalUri) : null;
        const { error } = await supabase.from('community_posts').insert({
          author_id: userId,
          body,
          image_url,
          destination_id: input.destinationId ?? null,
          place_name: input.placeName ?? null,
          latitude: input.latitude ?? null,
          longitude: input.longitude ?? null,
        });
        if (error) throw error;
      },
      onSuccess: () => qc.invalidateQueries({ queryKey: ['feed'] }),
    }),

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

    deletePost: useMutation({
      mutationFn: async (postId: string) => {
        const { error } = await supabase.from('community_posts').delete().eq('id', postId);
        if (error) throw error;
      },
      onSuccess: () => qc.invalidateQueries({ queryKey: ['feed'] }),
    }),

    addComment: useMutation({
      mutationFn: async ({ postId, body }: { postId: string; body: string }) => {
        const text = body.trim();
        if (!text) throw new Error('Write a comment first.');
        const { error } = await supabase.from('post_comments').insert({ post_id: postId, author_id: userId, body: text });
        if (error) throw error;
      },
      onSuccess: (_d, v) => {
        qc.invalidateQueries({ queryKey: ['comments', v.postId] });
        patchPost(v.postId, (p) => ({ ...p, comments: [{ count: (p.comments[0]?.count ?? 0) + 1 }] }));
      },
    }),

    deleteComment: useMutation({
      mutationFn: async ({ id }: { id: string; postId: string }) => {
        const { error } = await supabase.from('post_comments').delete().eq('id', id);
        if (error) throw error;
      },
      onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ['comments', v.postId] }),
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
  const { userId } = useAuth();
  return {
    create: useMutation({
      mutationFn: async (input: { imageLocalUri: string; caption?: string; placeName?: string | null; destinationId?: string | null }) => {
        const image_url = await uploadImage(STORAGE_BUCKETS.stories, userId!, input.imageLocalUri);
        const { error } = await supabase.from('stories').insert({
          author_id: userId,
          image_url,
          caption: input.caption?.trim() || null,
          place_name: input.placeName ?? null,
          destination_id: input.destinationId ?? null,
        });
        if (error) throw error;
      },
      onSuccess: () => qc.invalidateQueries({ queryKey: ['stories'] }),
    }),
    remove: useMutation({
      mutationFn: async (id: string) => {
        const { error } = await supabase.from('stories').delete().eq('id', id);
        if (error) throw error;
      },
      onSuccess: () => qc.invalidateQueries({ queryKey: ['stories'] }),
    }),
  };
}
