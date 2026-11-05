import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';

import { useAuth } from '@/features/auth/auth-provider';
import { useFriendships } from '@/features/social/api';
import { subscribeToTopic } from '@/lib/realtime';
import { supabase } from '@/lib/supabase';
import type { LocationShare, ProfileSummary } from '@/lib/types';
import { tx } from '@/lib/i18n';

export const STALE_AFTER_MS = 10 * 60_000;

export type FriendLocation = LocationShare & { profile: ProfileSummary; stale: boolean };

/**
 * Shared locations of accepted friends (RLS only returns active, unexpired
 * shares of friends). Live updates arrive through each friend's private
 * `location:<id>` broadcast topic.
 */
export function useFriendLocations() {
  const { userId } = useAuth();
  const { friends } = useFriendships();
  const qc = useQueryClient();
  const friendIds = useMemo(() => friends.map((f) => f.profile.id).sort(), [friends]);

  const query = useQuery({
    queryKey: ['friend-locations', userId, friendIds.join(',')],
    enabled: Boolean(userId) && friendIds.length > 0,
    refetchInterval: 60_000, // safety net if realtime drops; cheap single query
    queryFn: async () => {
      const { data, error } = await supabase.from('location_shares').select('*').in('user_id', friendIds);
      if (error) throw error;
      return data as LocationShare[];
    },
  });

  useEffect(() => {
    if (friendIds.length === 0) return;
    const unsubs = friendIds.map((id) =>
      subscribeToTopic<LocationShare>(`location:${id}`, () => {
        qc.invalidateQueries({ queryKey: ['friend-locations'] });
      }),
    );
    return () => unsubs.forEach((u) => u());
  }, [friendIds, qc]);

  const now = useNow(30_000);
  const locations: FriendLocation[] = (query.data ?? [])
    .filter((s) => s.is_active && (!s.expires_at || Date.parse(s.expires_at) > now))
    .map((s) => {
      const profile = friends.find((f) => f.profile.id === s.user_id)?.profile;
      return profile ? { ...s, profile, stale: now - Date.parse(s.updated_at) > STALE_AFTER_MS } : null;
    })
    .filter((x): x is FriendLocation => Boolean(x));

  return { ...query, locations, hasFriends: friendIds.length > 0 };
}

export function timeAgo(iso: string | number) {
  const ms = Date.now() - (typeof iso === 'number' ? iso : Date.parse(iso));
  const min = Math.round(ms / 60_000);
  if (min < 1) return tx('just now');
  if (min < 60) return tx('{0} min ago', { 0: min });
  const h = Math.round(min / 60);
  if (h < 24) return tx('{0} h ago', { 0: h });
  return tx('{0} d ago', { 0: Math.round(h / 24) });
}

/** Current time that re-renders every `intervalMs` (for "stale" and "x min ago" labels). */
export function useNow(intervalMs = 30_000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}
