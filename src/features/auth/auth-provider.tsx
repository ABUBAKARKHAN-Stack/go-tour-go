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
    // Bumped by every check and every sign-in/out event, so a slow check that
    // finishes late can't overwrite what happened after it started.
    let generation = 0;

    const apply = (next: Session | null, trusted: boolean) => {
      offlineTrust = trusted;
      setSession(next);
      setUserId(next?.user.id ?? null);
    };
    const ready = () => {
      if (mounted) setLoading(false);
    };

    /*
     * Starting state: signed out, verified, or trusted offline. The splash
     * waits for this, so it must never wait on the network: supabase-js
     * retries an expired token for about 30 s offline, and on Wi-Fi without
     * internet a request can hang for much longer.
     *  - No saved login: signed out at once.
     *  - Offline with a saved login: trust it at once; verify when back online.
     *  - Online: verify, but after VERIFY_WAIT_MS show the saved login and let
     *    the check finish in the background.
     */
    const verify = async () => {
      const gen = ++generation;
      const current = () => mounted && gen === generation;
      const stored = readStoredSession();
      if (!stored) {
        if (current()) apply(null, false);
        ready();
        return;
      }
      if (!(await isOnline(true))) {
        if (current()) apply(stored, true);
        ready();
        return;
      }

      const check = checkSession();
      const waited = await Promise.race([check, wait(VERIFY_WAIT_MS).then(() => 'slow' as const)]);
      if (waited === 'slow') {
        if (current()) apply(stored, true);
        ready();
      }
      const result = await check;
      if (!current()) return;
      if (result.kind === 'valid') apply(result.session, false);
      // No connection after all: keep the saved login; verify when it returns.
      else if (result.kind === 'unreachable') apply(stored, true);
      else apply(null, false);
      ready();
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
        generation += 1;
        apply(null, false);
        ready();
        queryClient.clear();
        return;
      }
      if (next) {
        generation += 1;
        apply(next, false);
        ready();
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

/** How long the splash waits for the server to confirm the saved login. */
const VERIFY_WAIT_MS = 4000;

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

type SessionCheck = { kind: 'valid'; session: Session } | { kind: 'unreachable' } | { kind: 'invalid' };

/**
 * Asks the server whether the saved login is still good. getClaims() verifies
 * the JWT (refreshing it when it has expired); "unreachable" means the network
 * failed, not that the login is bad.
 */
async function checkSession(): Promise<SessionCheck> {
  try {
    const { data, error } = await supabase.auth.getClaims();
    if (!error && data?.claims) {
      const { data: sessionData } = await supabase.auth.getSession();
      return sessionData.session ? { kind: 'valid', session: sessionData.session } : { kind: 'invalid' };
    }
    if (isNetworkError(error) || !(await isOnline())) return { kind: 'unreachable' };
    return { kind: 'invalid' };
  } catch (e) {
    recordError(e, 'auth.verify');
    return { kind: 'unreachable' };
  }
}

function isNetworkError(error: unknown) {
  if (!error || typeof error !== 'object') return false;
  const e = error as { name?: string; message?: string; status?: number };
  return e.name === 'AuthRetryableFetchError' || e.status === 0 || /network|fetch|timed? ?out|connection/i.test(e.message ?? '');
}

/**
 * Whether the phone has internet. `unknownIsOnline` decides the answer when
 * Android hasn't measured reachability yet (right after start).
 */
async function isOnline(unknownIsOnline = false) {
  const state = await Promise.race([Network.getNetworkStateAsync().catch(() => null), wait(1500).then(() => null)]);
  if (!state) return unknownIsOnline;
  if (state.isConnected === false || state.isInternetReachable === false) return false;
  return true;
}

/** For screens that are only reachable when signed in. */
export function useUserId(): string {
  const { userId } = useAuth();
  return userId ?? '';
}
