import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/features/auth/auth-provider';
import { STORAGE_BUCKETS, supabase } from '@/lib/supabase';
import type { Review } from '@/lib/types';
import { uploadImage } from '@/lib/upload';

export function useReviews(destinationId: string | undefined) {
  return useQuery({
    queryKey: ['reviews', destinationId],
    enabled: Boolean(destinationId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select('*, author:profiles(id, username, full_name, avatar_url)')
        .eq('destination_id', destinationId!)
        .order('created_at', { ascending: false })
        .limit(30);
      if (error) throw error;
      return data as Review[];
    },
  });
}

/** Create or edit the user's single review for a destination (one per user). */
export function useSaveReview() {
  const qc = useQueryClient();
  const { userId } = useAuth();
  return useMutation({
    mutationFn: async (input: { destinationId: string; rating: number; body: string; imageLocalUri?: string | null; existingImage?: string | null }) => {
      const body = input.body.trim();
      if (input.rating < 1 || input.rating > 5) throw new Error('Choose a rating from 1 to 5 stars.');
      const image_url = input.imageLocalUri
        ? await uploadImage(STORAGE_BUCKETS.reviews, userId!, input.imageLocalUri)
        : (input.existingImage ?? null);
      const { error } = await supabase.from('reviews').upsert(
        { user_id: userId, destination_id: input.destinationId, rating: input.rating, body, image_url },
        { onConflict: 'user_id,destination_id' },
      );
      if (error) throw error;
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ['reviews', v.destinationId] });
      qc.invalidateQueries({ queryKey: ['ratings'] });
    },
  });
}

export function useDeleteReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: string; destinationId: string }) => {
      const { error } = await supabase.from('reviews').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ['reviews', v.destinationId] });
      qc.invalidateQueries({ queryKey: ['ratings'] });
    },
  });
}
