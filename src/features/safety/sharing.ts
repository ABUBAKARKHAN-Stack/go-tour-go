/**
 * Live location sharing with accepted friends for a limited time.
 *
 * - Foreground: updates are pushed from the regular location watcher
 *   (throttled to one write per 30 s or 50 m).
 * - Background: while sharing, an Android foreground service
 *   (startLocationUpdatesAsync) keeps updates flowing with a persistent
 *   "Sharing your location" notification so the user always knows.
 * - Expiry is enforced both by the app and by RLS (friends cannot read an
 *   expired share), and the user can stop at any time.
 */
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { useSyncExternalStore } from 'react';

import { distanceMeters } from '@/lib/geo';
import { storage, StorageKeys } from '@/lib/storage';
import { supabase } from '@/lib/supabase';
import { colors } from '@/lib/theme';

export const SHARING_TASK = 'gotourgo-location-sharing';
const MIN_INTERVAL_MS = 30_000;
const MIN_DISTANCE_M = 50;

export type SharingSession = {
  active: boolean;
  startedAt: number;
  /** null = until stopped */
  expiresAt: number | null;
  lastSentAt: number | null;
  lastSent: { latitude: number; longitude: number } | null;
};

export const SHARING_DURATIONS = [
  { label: '15 minutes', ms: 15 * 60_000 },
  { label: '1 hour', ms: 60 * 60_000 },
  { label: 'Until I stop', ms: null },
] as const;

const inactive: SharingSession = { active: false, startedAt: 0, expiresAt: null, lastSentAt: null, lastSent: null };

export function getSharingSession(fresh = false): SharingSession {
  if (fresh) storage.invalidate(StorageKeys.sharingSession);
  return storage.get<SharingSession>(StorageKeys.sharingSession, inactive);
}

export function useSharingSession(): SharingSession {
  return useSyncExternalStore(
    (cb) => storage.subscribe(StorageKeys.sharingSession, cb),
    () => getSharingSession(),
  );
}

export function isSessionLive(s: SharingSession, now = Date.now()) {
  return s.active && (s.expiresAt == null || s.expiresAt > now);
}

/** Writes a position if the session is live and the throttle allows it. */
export async function pushSharedLocation(
  fix: { latitude: number; longitude: number; accuracy?: number | null; heading?: number | null },
  force = false,
): Promise<void> {
  const session = getSharingSession(true);
  const now = Date.now();
  if (!session.active) return;
  if (!isSessionLive(session, now)) {
    await stopSharing();
    return;
  }
  const moved = session.lastSent ? distanceMeters(session.lastSent, fix) : Infinity;
  const elapsed = session.lastSentAt ? now - session.lastSentAt : Infinity;
  if (!force && elapsed < MIN_INTERVAL_MS && moved < MIN_DISTANCE_M) return;

  const { data } = await supabase.auth.getSession();
  const userId = data.session?.user.id;
  if (!userId) return;

  const { error } = await supabase.from('location_shares').upsert({
    user_id: userId,
    latitude: fix.latitude,
    longitude: fix.longitude,
    accuracy: fix.accuracy ?? null,
    heading: fix.heading ?? null,
    is_active: true,
    started_at: new Date(session.startedAt).toISOString(),
    expires_at: session.expiresAt ? new Date(session.expiresAt).toISOString() : null,
  });
  if (!error) {
    storage.set(StorageKeys.sharingSession, {
      ...session,
      lastSentAt: now,
      lastSent: { latitude: fix.latitude, longitude: fix.longitude },
    });
  }
}

TaskManager.defineTask<{ locations: Location.LocationObject[] }>(SHARING_TASK, async ({ data, error }) => {
  if (error) return;
  const last = data?.locations?.[data.locations.length - 1];
  if (!last) return;
  await pushSharedLocation({
    latitude: last.coords.latitude,
    longitude: last.coords.longitude,
    accuracy: last.coords.accuracy,
    heading: last.coords.heading,
  }).catch(() => undefined);
});

async function startBackgroundUpdates() {
  const bg = await Location.getBackgroundPermissionsAsync();
  if (!bg.granted) return false;
  const running = await Location.hasStartedLocationUpdatesAsync(SHARING_TASK).catch(() => false);
  if (running) return true;
  await Location.startLocationUpdatesAsync(SHARING_TASK, {
    accuracy: Location.Accuracy.Balanced,
    timeInterval: MIN_INTERVAL_MS,
    distanceInterval: MIN_DISTANCE_M,
    showsBackgroundLocationIndicator: true,
    foregroundService: {
      notificationTitle: 'GoTourGo is sharing your location',
      notificationBody: 'Your friends can see where you are. Open the app to stop sharing.',
      notificationColor: colors.primary,
      killServiceOnDestroy: false,
    },
  });
  return true;
}

/**
 * Starts sharing. Returns whether background updates are running (they need
 * "Allow all the time"; without it sharing works while the app is open).
 */
export async function startSharing(
  durationMs: number | null,
  fix: { latitude: number; longitude: number; accuracy?: number | null },
): Promise<{ background: boolean }> {
  const now = Date.now();
  storage.set<SharingSession>(StorageKeys.sharingSession, {
    active: true,
    startedAt: now,
    expiresAt: durationMs ? now + durationMs : null,
    lastSentAt: null,
    lastSent: null,
  });
  await pushSharedLocation(fix, true);
  const background = await startBackgroundUpdates().catch(() => false);
  return { background };
}

export async function stopSharing() {
  storage.set(StorageKeys.sharingSession, inactive);
  const running = await Location.hasStartedLocationUpdatesAsync(SHARING_TASK).catch(() => false);
  if (running) await Location.stopLocationUpdatesAsync(SHARING_TASK).catch(() => undefined);
  const { data } = await supabase.auth.getSession();
  const userId = data.session?.user.id;
  if (userId) {
    await supabase
      .from('location_shares')
      .update({ is_active: false, expires_at: new Date().toISOString() })
      .eq('user_id', userId);
  }
}

/** On app start: stop background updates if the session ended while the app was closed. */
export async function reconcileSharing() {
  const s = getSharingSession(true);
  if (s.active && !isSessionLive(s)) await stopSharing();
  else if (!s.active) {
    const running = await Location.hasStartedLocationUpdatesAsync(SHARING_TASK).catch(() => false);
    if (running) await Location.stopLocationUpdatesAsync(SHARING_TASK).catch(() => undefined);
  }
}
