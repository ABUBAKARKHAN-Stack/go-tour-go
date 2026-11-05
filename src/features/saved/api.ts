import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/features/auth/auth-provider';
import { supabase } from '@/lib/supabase';

/** Set of saved destination ids for the current user (persisted offline). */
export function useSavedIds() {
  const { userId } = useAuth();
  return useQuery({
    queryKey: ['saved', userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('saved_places')
        .select('destination_id, created_at')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data as { destination_id: string }[]).map((r) => r.destination_id);
    },
  });
}

export function useToggleSaved() {
  const qc = useQueryClient();
  const { userId } = useAuth();
  const key = ['saved', userId];
  return useMutation({
    mutationFn: async ({ destinationId, save }: { destinationId: string; save: boolean }) => {
      const { error } = save
        ? await supabase.from('saved_places').insert({ user_id: userId, destination_id: destinationId })
        : await supabase.from('saved_places').delete().eq('user_id', userId!).eq('destination_id', destinationId);
      if (error && error.code !== '23505') throw error;
    },
    onMutate: async ({ destinationId, save }) => {
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<string[]>(key);
      qc.setQueryData<string[]>(key, (old = []) =>
        save ? [destinationId, ...old.filter((id) => id !== destinationId)] : old.filter((id) => id !== destinationId),
      );
      return { previous };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.previous) qc.setQueryData(key, ctx.previous);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['saved'] }),
  });
}
