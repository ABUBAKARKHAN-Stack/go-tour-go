import { useSyncExternalStore } from 'react';

/** Which hazard the in-app hazard card shows (design screen 10). */
type HazardCardState = { alertId: string | null; distance: number; visible: boolean; shownAt: number };

let state: HazardCardState = { alertId: null, distance: 0, visible: false, shownAt: 0 };
const listeners = new Set<() => void>();

export const hazardCard = {
  get: () => state,
  show(alertId: string, distance: number) {
    state = { alertId, distance, visible: true, shownAt: Date.now() };
    listeners.forEach((l) => l());
  },
  /** Hides the card; with an id, only if it still shows that hazard. */
  dismiss(alertId?: string) {
    if (alertId && state.alertId !== alertId) return;
    state = { ...state, visible: false };
    listeners.forEach((l) => l());
  },
  subscribe(l: () => void) {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  },
};

export function useHazardCard() {
  return useSyncExternalStore(hazardCard.subscribe, hazardCard.get);
}
