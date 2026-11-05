import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import { supabase } from '@/lib/supabase';

import { USERNAME } from './schemas';

export type UsernameStatus = 'idle' | 'checking' | 'available' | 'taken' | 'unknown';

function useDebounced<T>(value: T, ms: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

/**
 * Live "is this username free?" while typing (public.username_available, which
 * works signed out). "unknown" when the check can't run, e.g. offline; the
 * server still guarantees uniqueness on sign-up.
 */
export function useUsernameAvailability(username: string, opts?: { skip?: boolean }): UsernameStatus {
  const name = username.trim().toLowerCase();
  const debounced = useDebounced(name, 400);
  const valid = USERNAME.test(debounced) && !opts?.skip;
  const query = useQuery({
    queryKey: ['username-available', debounced],
    enabled: valid,
    staleTime: 30_000,
    retry: 0,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('username_available', { p_username: debounced });
      if (error) throw error;
      return Boolean(data);
    },
  });
  if (opts?.skip || !USERNAME.test(name)) return 'idle';
  if (name !== debounced || query.isFetching) return 'checking';
  if (query.isError) return 'unknown';
  if (query.data === true) return 'available';
  if (query.data === false) return 'taken';
  return 'checking';
}
