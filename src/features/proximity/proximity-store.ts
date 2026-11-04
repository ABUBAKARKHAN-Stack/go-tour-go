import { useSyncExternalStore } from 'react';

import { emptyState, type ProximityHit, type ProximityState } from '@/features/proximity/engine';
import { storage, StorageKeys } from '@/lib/storage';

/** Persisted engine state (shared with the background geofencing task). */
export function loadProximityState(fresh = false): ProximityState {
  if (fresh) storage.invalidate(StorageKeys.proximityState);
  return storage.get<ProximityState>(StorageKeys.proximityState, emptyState());
}

export function saveProximityState(state: ProximityState) {
  storage.set(StorageKeys.proximityState, state);
}

/** In-app contextual card state (not persisted). */
type CardState = {
  /** Landmarks to show in the card, nearest first. */
  hits: ProximityHit[];
  visible: boolean;
  /** Landmarks the user is currently inside (for "You're near" chips). */
  inside: ProximityHit[];
};

let card: CardState = { hits: [], visible: false, inside: [] };
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export const proximityCard = {
  get: () => card,
  show(hits: ProximityHit[]) {
    card = { ...card, hits, visible: hits.length > 0 };
    emit();
  },
  dismiss() {
    card = { ...card, visible: false };
    emit();
  },
  setInside(inside: ProximityHit[]) {
    const same =
      inside.length === card.inside.length && inside.every((h, i) => h.id === card.inside[i]?.id);
    // Avoid re-renders for distance-only changes.
    if (same) return;
    card = { ...card, inside };
    emit();
  },
  subscribe(l: () => void) {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  },
};

export function useProximityCard() {
  return useSyncExternalStore(proximityCard.subscribe, proximityCard.get);
}
