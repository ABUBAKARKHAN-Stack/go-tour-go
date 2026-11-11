import type { Session } from '@supabase/supabase-js';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import * as Network from 'expo-network';

import { recordError } from '@/lib/crash-log';
import { isBackendConfigured } from '@/lib/env';
import { readStoredSession, supabase } from '@/lib/supabase';
import type { Profile } from '@/lib/types';
import { tx } from '@/lib/i18n';

type AuthState = {
  /** True until the persisted session has been loaded and verified. */
  loading: boolean;
  session: Session | null;
  userId: string | null;
  email: string | null;
  /** Exploring without an account (anonymous sign-in): can browse and save, not post or share. */
  isGuest: boolean;
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
    // True while we trust the saved login without the server (no internet).
    let offlineTrust = false;

    // getClaims() verifies the JWT (and refreshes it when it has expired), so
    // online we only trust the stored session after it succeeds. Both steps
    // need the network, so offline we keep the saved session instead of
    // signing the traveller out; it is verified again when the network returns.
    const verify = async () => {
      try {
        const { data, error } = await supabase.auth.getClaims();
        if (!mounted) return;
        if (!error && data?.claims) {
          const { data: sessionData } = await supabase.auth.getSession();
          if (!mounted) return;
          offlineTrust = false;
          setSession(sessionData.session);
          setUserId(data.claims.sub);
          return;
        }
        const stored = readStoredSession();
        if (stored && (isNetworkError(error) || !(await isOnline()))) {
          offlineTrust = true;
          setSession(stored);
          setUserId(stored.user.id);
          return;
        }
        offlineTrust = false;
        setSession(null);
        setUserId(null);
      } catch (e) {
        recordError(e, 'auth.verify');
        const stored = readStoredSession();
        offlineTrust = Boolean(stored);
        setSession(stored);
        setUserId(stored?.user.id ?? null);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    verify();

    // Verify again (and refresh the token) when the connection comes back.
    const net = Network.addNetworkStateListener((state) => {
      if (offlineTrust && state.isConnected !== false && state.isInternetReachable !== false) verify();
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, next) => {
      if (!mounted) return;
      // verify() decides the starting state; INITIAL_SESSION reports no session
      // whenever the network is down, which would wrongly sign the traveller out.
      if (event === 'INITIAL_SESSION') return;
      if (event === 'SIGNED_OUT') {
        offlineTrust = false;
        setSession(null);
        setUserId(null);
        queryClient.clear();
        return;
      }
      if (next) {
        offlineTrust = false;
        setSession(next);
        setUserId(next.user.id);
      }
    });

    return () => {
      mounted = false;
      net.remove();
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
      isGuest: session?.user.is_anonymous === true,
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
  if (!ctx) throw new Error(tx('useAuth must be used inside AuthProvider'));
  return ctx;
}

function isNetworkError(error: unknown) {
  if (!error || typeof error !== 'object') return false;
  const e = error as { name?: string; message?: string; status?: number };
  return e.name === 'AuthRetryableFetchError' || e.status === 0 || /network|fetch|timed? ?out|connection/i.test(e.message ?? '');
}

async function isOnline() {
  const state = await Network.getNetworkStateAsync().catch(() => null);
  return Boolean(state && state.isConnected !== false && state.isInternetReachable !== false);
}

/** For screens that are only reachable when signed in. */
export function useUserId(): string {
  const { userId } = useAuth();
  return userId ?? '';
}
