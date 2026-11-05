import { useCallback, useSyncExternalStore } from 'react';
import Storage from 'expo-sqlite/kv-store';

/**
 * Small, synchronous key-value store for non-sensitive local state
 * (onboarding flag, preferences, cooldowns, cached data). Backed by SQLite
 * via expo-sqlite/kv-store, and also usable from background tasks.
 * Auth tokens are handled by supabase-js itself (see lib/supabase.ts).
 */
type Listener = () => void;
const listeners = new Map<string, Set<Listener>>();
const cache = new Map<string, unknown>();

function read<T>(key: string, fallback: T): T {
  if (cache.has(key)) return cache.get(key) as T;
  let value = fallback;
  try {
    const raw = Storage.getItemSync(key);
    if (raw != null) value = JSON.parse(raw) as T;
  } catch {
    value = fallback;
  }
  cache.set(key, value);
  return value;
}

export const storage = {
  get<T>(key: string, fallback: T): T {
    return read(key, fallback);
  },

  set<T>(key: string, value: T): void {
    cache.set(key, value);
    try {
      Storage.setItemSync(key, JSON.stringify(value));
    } catch (error) {
      console.warn('storage.set failed', key, error);
    }
    listeners.get(key)?.forEach((fn) => fn());
  },

  remove(key: string): void {
    cache.delete(key);
    try {
      Storage.removeItemSync(key);
    } catch {
      // ignore
    }
    listeners.get(key)?.forEach((fn) => fn());
  },

  /** Drops the in-memory copy so the next read hits SQLite (used by background tasks). */
  invalidate(key: string): void {
    cache.delete(key);
  },

  subscribe(key: string, listener: Listener): () => void {
    if (!listeners.has(key)) listeners.set(key, new Set());
    listeners.get(key)!.add(listener);
    return () => {
      listeners.get(key)?.delete(listener);
    };
  },
};

/** React binding: re-renders only components that read this key. */
export function useStorage<T>(key: string, fallback: T): [T, (value: T) => void] {
  const value = useSyncExternalStore(
    (cb) => storage.subscribe(key, cb),
    () => storage.get(key, fallback),
  );
  const set = useCallback((next: T) => storage.set(key, next), [key]);
  return [value, set];
}

export const StorageKeys = {
  onboardingDone: 'gtg.onboarding.done',
  preferences: 'gtg.preferences',
  proximityState: 'gtg.proximity.state',
  landmarkCache: 'gtg.proximity.landmarks',
  geofenceAnchor: 'gtg.proximity.geofenceAnchor',
  lastRoute: 'gtg.route.last',
  queryCache: 'gtg.query.cache',
  sharingSession: 'gtg.sharing.session',
} as const;
