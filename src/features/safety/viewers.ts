import { useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/features/auth/auth-provider';
import { supabase } from '@/lib/supabase';

/**
 * The friends picked to see your live location when sharing with "Chosen
 * friends" (table location_share_viewers). The choice is kept for next time.
 */
export function useShareViewers() {
  const { userId } = useAuth();
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ['share-viewers', userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await supabase.from('location_share_viewers').select('viewer_id');
      if (error) throw error;
      return (data ?? []).map((r) => r.viewer_id as string);
    },
  });

  /** Replaces the saved list with `ids` (only the differences are written). */
  const save = async (ids: string[]) => {
    if (!userId) return;
    const current = new Set(query.data ?? []);
    const next = new Set(ids);
    const removed = [...current].filter((id) => !next.has(id));
    const added = [...next].filter((id) => !current.has(id));
    if (removed.length) {
      const { error } = await supabase.from('location_share_viewers').delete().eq('owner_id', userId).in('viewer_id', removed);
      if (error) throw error;
    }
    if (added.length) {
      const { error } = await supabase.from('location_share_viewers').insert(added.map((viewer_id) => ({ owner_id: userId, viewer_id })));
      if (error) throw error;
    }
    qc.setQueryData(['share-viewers', userId], ids);
  };

  return { ...query, viewers: query.data ?? [], save };
}
