import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
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
// for React Native). Registered once at module load.
if (Platform.OS !== 'web' && isBackendConfigured) {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}

export const STORAGE_BUCKETS = {
  avatars: 'avatars',
  posts: 'post-images',
  stories: 'story-images',
  reviews: 'review-images',
} as const;
