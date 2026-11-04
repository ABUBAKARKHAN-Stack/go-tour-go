import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/features/auth/auth-provider';
import { STORAGE_BUCKETS, supabase } from '@/lib/supabase';
import type { Friendship, Profile, ProfileSummary } from '@/lib/types';
import { uploadImage } from '@/lib/upload';

const SUMMARY = 'id, username, full_name, avatar_url';

export function displayName(p: Pick<ProfileSummary, 'username' | 'full_name'> | null | undefined) {
  return p?.full_name || (p?.username ? `@${p.username}` : 'Traveler');
}

/** All friendship rows involving the current user, split by state. */
export function useFriendships() {
  const { userId } = useAuth();
  const query = useQuery({
    queryKey: ['friends', userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('friendships')
        .select(`*, requester:profiles!friendships_requester_id_fkey(${SUMMARY}), addressee:profiles!friendships_addressee_id_fkey(${SUMMARY})`)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Friendship[];
    },
  });

  const rows = query.data ?? [];
  const other = (f: Friendship) => (f.requester_id === userId ? f.addressee : f.requester);
  return {
    ...query,
    friends: rows
      .filter((f) => f.status === 'accepted')
      .map((f) => ({ friendship: f, profile: other(f) }))
      .filter((x): x is { friendship: Friendship; profile: ProfileSummary } => Boolean(x.profile)),
    incoming: rows.filter((f) => f.status === 'pending' && f.addressee_id === userId),
    outgoing: rows.filter((f) => f.status === 'pending' && f.requester_id === userId),
    statusWith(otherId: string): 'friends' | 'incoming' | 'outgoing' | 'none' {
      const f = rows.find((r) => r.requester_id === otherId || r.addressee_id === otherId);
      if (!f || f.status === 'declined') return 'none';
      if (f.status === 'accepted') return 'friends';
      return f.requester_id === userId ? 'outgoing' : 'incoming';
    },
    friendshipWith(otherId: string) {
      return rows.find((r) => r.requester_id === otherId || r.addressee_id === otherId) ?? null;
    },
  };
}

export function useUserSearch(term: string) {
  const { userId } = useAuth();
  const q = term.trim().replace(/[%_,()]/g, '');
  return useQuery({
    queryKey: ['user-search', q],
    enabled: q.length >= 2,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select(`${SUMMARY}, bio, home_city`)
        .or(`username.ilike.%${q}%,full_name.ilike.%${q}%`)
        .neq('id', userId!)
        .limit(20);
      if (error) throw error;
      return data as (ProfileSummary & { bio: string | null; home_city: string | null })[];
    },
  });
}

export function useProfile(id: string | undefined) {
  return useQuery({
    queryKey: ['profile', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', id!).maybeSingle();
      if (error) throw error;
      return data as Profile | null;
    },
  });
}

export function useFollowCounts(id: string | undefined) {
  const { userId } = useAuth();
  return useQuery({
    queryKey: ['follows', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const [followers, following, mine] = await Promise.all([
        supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', id!),
        supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', id!),
        supabase.from('follows').select('follower_id').eq('follower_id', userId!).eq('following_id', id!).maybeSingle(),
      ]);
      return {
        followers: followers.count ?? 0,
        following: following.count ?? 0,
        isFollowing: Boolean(mine.data),
      };
    },
  });
}

export function useSocialActions() {
  const qc = useQueryClient();
  const { userId } = useAuth();
  const invalidate = () => qc.invalidateQueries({ queryKey: ['friends'] });

  return {
    sendRequest: useMutation({
      mutationFn: async (target: string) => {
        const { error } = await supabase.rpc('send_friend_request', { target });
        if (error) throw error;
      },
      onSuccess: invalidate,
    }),
    respond: useMutation({
      mutationFn: async ({ id, accept }: { id: string; accept: boolean }) => {
        const { error } = await supabase.rpc('respond_friend_request', { request_id: id, accept });
        if (error) throw error;
      },
      onSuccess: invalidate,
    }),
    remove: useMutation({
      mutationFn: async (friendshipId: string) => {
        const { error } = await supabase.from('friendships').delete().eq('id', friendshipId);
        if (error) throw error;
      },
      onSuccess: invalidate,
    }),
    toggleFollow: useMutation({
      mutationFn: async ({ target, follow }: { target: string; follow: boolean }) => {
        const { error } = follow
          ? await supabase.from('follows').insert({ follower_id: userId, following_id: target })
          : await supabase.from('follows').delete().eq('follower_id', userId!).eq('following_id', target);
        if (error) throw error;
      },
      onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ['follows', v.target] }),
    }),
  };
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  const { userId } = useAuth();
  return useMutation({
    mutationFn: async (patch: Partial<Profile> & { avatarLocalUri?: string | null }) => {
      const { avatarLocalUri, ...rest } = patch;
      const update: Partial<Profile> = { ...rest };
      if (avatarLocalUri) update.avatar_url = await uploadImage(STORAGE_BUCKETS.avatars, userId!, avatarLocalUri);
      const { error } = await supabase
        .from('profiles')
        .update({
          username: update.username,
          full_name: update.full_name,
          bio: update.bio,
          home_city: update.home_city,
          visibility: update.visibility,
          allow_friend_requests: update.allow_friend_requests,
          ...(update.avatar_url ? { avatar_url: update.avatar_url } : {}),
        })
        .eq('id', userId!);
      if (error) {
        if (error.code === '23505') throw new Error('That username is taken.');
        throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['profile'] }),
  });
}
