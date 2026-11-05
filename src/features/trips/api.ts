import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/features/auth/auth-provider';
import { supabase } from '@/lib/supabase';
import type { TripItem, TripStatus } from '@/lib/types';
import { tx } from '@/lib/i18n';

export const TRIP_STATUSES: { value: TripStatus; label: string }[] = [
  { value: 'todo', label: tx('To Do') },
  { value: 'in_progress', label: tx('In Progress') },
  { value: 'visited', label: tx('Visited') },
];

export function useTrips() {
  const { userId } = useAuth();
  return useQuery({
    queryKey: ['trips', userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trip_items')
        .select('*')
        .order('planned_date', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as TripItem[];
    },
  });
}

/**
 * Trip mutations with optimistic updates (rolled back on failure). Writes need
 * a connection; reads come from the persisted cache when offline.
 */
export function useTripActions() {
  const qc = useQueryClient();
  const { userId } = useAuth();
  const key = ['trips', userId];

  const optimistic = async (update: (items: TripItem[]) => TripItem[]) => {
    await qc.cancelQueries({ queryKey: key });
    const previous = qc.getQueryData<TripItem[]>(key);
    qc.setQueryData<TripItem[]>(key, (old) => update(old ?? []));
    return { previous };
  };
  const rollback = (_e: unknown, _v: unknown, ctx?: { previous?: TripItem[] }) => {
    if (ctx?.previous) qc.setQueryData(key, ctx.previous);
  };
  const settle = () => qc.invalidateQueries({ queryKey: ['trips'] });

  return {
    add: useMutation({
      mutationFn: async (input: { destinationId: string; plannedDate?: string | null; notes?: string | null }) => {
        const { data, error } = await supabase
          .from('trip_items')
          .upsert(
            {
              user_id: userId,
              destination_id: input.destinationId,
              planned_date: input.plannedDate ?? null,
              notes: input.notes ?? null,
            },
            { onConflict: 'user_id,destination_id', ignoreDuplicates: true },
          )
          .select()
          .maybeSingle();
        if (error) throw error;
        return data as TripItem | null;
      },
      onSettled: settle,
    }),
    update: useMutation({
      mutationFn: async ({ id, patch }: { id: string; patch: Partial<Pick<TripItem, 'status' | 'notes' | 'planned_date'>> }) => {
        const { error } = await supabase.from('trip_items').update(patch).eq('id', id);
        if (error) throw error;
      },
      onMutate: ({ id, patch }) => optimistic((items) => items.map((i) => (i.id === id ? { ...i, ...patch } : i))),
      onError: rollback,
      onSettled: settle,
    }),
    setStatusForDestination: useMutation({
      mutationFn: async ({ destinationId, status }: { destinationId: string; status: TripStatus }) => {
        const { error } = await supabase
          .from('trip_items')
          .upsert({ user_id: userId, destination_id: destinationId, status }, { onConflict: 'user_id,destination_id' });
        if (error) throw error;
      },
      onSettled: settle,
    }),
    remove: useMutation({
      mutationFn: async (id: string) => {
        const { error } = await supabase.from('trip_items').delete().eq('id', id);
        if (error) throw error;
      },
      onMutate: (id) => optimistic((items) => items.filter((i) => i.id !== id)),
      onError: rollback,
      onSettled: settle,
    }),
  };
}
