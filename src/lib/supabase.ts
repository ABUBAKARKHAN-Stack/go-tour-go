import 'react-native-url-polyfill/auto';
import { createClient, type Session } from '@supabase/supabase-js';
import Storage from 'expo-sqlite/kv-store';
import { AppState, Platform } from 'react-native';

import { env, isBackendConfigured } from '@/lib/env';

/**
 * Supabase client using the publishable key (safe in the app; RLS protects
 * data). The session is persisted by supabase-js in the SQLite-backed
 * kv-store (an AsyncStorage-compatible API), never handled manually.
 */
export const supabase = createClient(
  // Placeholder values keep the client constructible when env is missing; the
  // app shows a setup screen instead of calling the backend in that case.
  env.supabaseUrl || 'https://not-configured.supabase.co',
  env.supabasePublishableKey || 'not-configured',
  {
    auth: {
      ...(Platform.OS !== 'web' ? { storage: Storage } : {}),
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
      flowType: 'pkce',
    },
  },
);

// Refresh tokens only while the app is in the foreground (Supabase guidance
// for React Native). Registered once at module load; the app is usually
// already active at that point, so refreshing starts right away too.
if (Platform.OS !== 'web' && isBackendConfigured) {
  if (AppState.currentState === 'active') supabase.auth.startAutoRefresh();
  AppState.addEventListener('change', (state) => {
    if (state === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}

/** supabase-js's default storage key for the session ("sb-<project ref>-auth-token"). */
function sessionStorageKey() {
  try {
    return `sb-${new URL(env.supabaseUrl).hostname.split('.')[0]}-auth-token`;
  } catch {
    return null;
  }
}

/**
 * The saved session exactly as supabase-js stored it, without contacting the
 * server. Used only to stay signed in while offline; anything that talks to
 * Supabase still needs the session to be valid.
 */
export function readStoredSession(): Session | null {
  const key = sessionStorageKey();
  if (!key || Platform.OS === 'web') return null;
  try {
    const raw = Storage.getItemSync(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Session> | null;
    return parsed?.refresh_token && parsed.user?.id ? (parsed as Session) : null;
  } catch {
    return null;
  }
}

export const STORAGE_BUCKETS = {
  avatars: 'avatars',
  posts: 'post-images',
  stories: 'story-images',
  reviews: 'review-images',
} as const;
