import { useSyncExternalStore } from 'react';

import { storage, StorageKeys } from '@/lib/storage';

/**
 * The SOS that was sent and not yet ended with "I'm safe". It is saved on the
 * phone (not kept in the Safety screen), so leaving the screen or restarting
 * the app never loses the way to end the SOS link. The link itself lasts at
 * most 24 hours on the server, so an older one is no longer shown.
 */
export type SosSession = {
  userId: string;
  message: string;
  lat: number | null;
  lng: number | null;
  token: string | null;
  sentAt: number;
};

/** Server limit for SOS links (share_links migration). */
const SOS_LINK_MS = 24 * 60 * 60 * 1000;

function current(userId: string | null, now = Date.now()): SosSession | null {
  const s = storage.get<SosSession | null>(StorageKeys.sosSession, null);
  if (!s || !userId || s.userId !== userId || now - s.sentAt > SOS_LINK_MS) return null;
  return s;
}

export function saveSosSession(session: Omit<SosSession, 'sentAt'>) {
  storage.set<SosSession>(StorageKeys.sosSession, { ...session, sentAt: Date.now() });
}

export function clearSosSession() {
  storage.remove(StorageKeys.sosSession);
}

/** The signed-in traveller's open SOS, or null. */
export function useSosSession(userId: string | null): SosSession | null {
  return useSyncExternalStore(
    (cb) => storage.subscribe(StorageKeys.sosSession, cb),
    () => current(userId),
  );
}
