import type { Session } from '@supabase/supabase-js';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { isBackendConfigured } from '@/lib/env';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/lib/types';

type AuthState = {
  /** True until the persisted session has been loaded and verified. */
  loading: boolean;
  session: Session | null;
  userId: string | null;
  email: string | null;
  profile: Profile | null;
  profileLoading: boolean;
  refreshProfile: () => Promise<unknown>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(isBackendConfigured);
  const [session, setSession] = useState<Session | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!isBackendConfigured) return;
    let mounted = true;

    // getClaims() verifies the JWT locally (JWKS) and refreshes it if needed,
    // so we only trust the stored session after this succeeds.
    const verify = async () => {
      const { data, error } = await supabase.auth.getClaims();
      const { data: sessionData } = await supabase.auth.getSession();
      if (!mounted) return;
      if (error || !data?.claims) {
        setSession(null);
        setUserId(null);
      } else {
        setSession(sessionData.session);
        setUserId(data.claims.sub);
      }
      setLoading(false);
    };
    verify();

    const { data: sub } = supabase.auth.onAuthStateChange((event, next) => {
      if (!mounted) return;
      setSession(next);
      setUserId(next?.user.id ?? null);
      if (event === 'SIGNED_OUT') queryClient.clear();
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [queryClient]);

  const profileQuery = useQuery({
    queryKey: ['profile', userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId!).single();
      if (error) throw error;
      return data as Profile;
    },
  });

  const value = useMemo<AuthState>(
    () => ({
      loading,
      session,
      userId,
      email: session?.user.email ?? null,
      profile: profileQuery.data ?? null,
      profileLoading: profileQuery.isLoading,
      refreshProfile: profileQuery.refetch,
    }),
    [loading, session, userId, profileQuery.data, profileQuery.isLoading, profileQuery.refetch],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

/** For screens that are only reachable when signed in. */
export function useUserId(): string {
  const { userId } = useAuth();
  return userId ?? '';
}
