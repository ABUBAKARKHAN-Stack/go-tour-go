import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { onlineManager, QueryClient } from '@tanstack/react-query';
import Storage from 'expo-sqlite/kv-store';
import * as Network from 'expo-network';

import { StorageKeys } from '@/lib/storage';

/**
 * Shared React Query client. Queries cache aggressively (reference data rarely
 * changes) and the cache is persisted to SQLite so destinations, trips and
 * saved places stay readable offline.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 1000 * 60 * 60 * 24 * 7,
      retry: 1,
      networkMode: 'offlineFirst',
    },
    mutations: {
      networkMode: 'online',
    },
  },
});

export const queryPersister = createSyncStoragePersister({
  key: StorageKeys.queryCache,
  storage: {
    getItem: (key) => Storage.getItemSync(key),
    setItem: (key, value) => Storage.setItemSync(key, value),
    removeItem: (key) => {
      Storage.removeItemSync(key);
    },
  },
  throttleTime: 2000,
});

/**
 * Only these query roots are persisted (no messages/feeds/realtime data).
 * Persisted data must survive JSON: plain objects and arrays only, no Map/Set.
 */
const PERSISTED_ROOTS = new Set(['destinations', 'trips', 'saved', 'alerts', 'profile', 'weather', 'ratings']);

export const persistOptions = {
  persister: queryPersister,
  maxAge: 1000 * 60 * 60 * 24 * 7,
  // Bump to drop caches saved in an older shape (v2: ratings and translations were Maps).
  buster: 'v2',
  dehydrateOptions: {
    shouldDehydrateQuery: (query: { queryKey: readonly unknown[]; state: { status: string } }) =>
      query.state.status === 'success' && PERSISTED_ROOTS.has(String(query.queryKey[0])),
  },
};

// Keep React Query's online state in sync with the device.
onlineManager.setEventListener((setOnline) => {
  const sub = Network.addNetworkStateListener((state) => {
    setOnline(Boolean(state.isConnected) && state.isInternetReachable !== false);
  });
  return () => sub.remove();
});
