import { useSyncExternalStore } from 'react';

import { fetchRoute, type Route, type TravelMode } from '@/features/routing/osrm';
import type { LatLng } from '@/lib/geo';
import { storage, StorageKeys } from '@/lib/storage';

/**
 * Active route + navigation state shared by the map, details screen and the
 * proximity card. The last route is persisted so it can be shown offline.
 */
type RouteState = {
  route: Route | null;
  loading: boolean;
  error: string | null;
  navigating: boolean;
  /** Destination being routed to (set before the request completes). */
  target: (LatLng & { id?: string; name?: string }) | null;
  /** Shown from cache because the network request failed. */
  offline: boolean;
};

let state: RouteState = {
  route: null,
  loading: false,
  error: null,
  navigating: false,
  target: null,
  offline: false,
};
const listeners = new Set<() => void>();
let controller: AbortController | null = null;

function set(patch: Partial<RouteState>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

export const routeStore = {
  get: () => state,
  subscribe(l: () => void) {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  },

  async request(from: LatLng, to: RouteState['target'] & object, mode: TravelMode) {
    controller?.abort();
    controller = new AbortController();
    set({ loading: true, error: null, target: to, navigating: false, offline: false });
    try {
      const route = await fetchRoute(mode, from, to, controller.signal);
      storage.set(StorageKeys.lastRoute, route);
      set({ route, loading: false });
      return route;
    } catch (error) {
      if ((error as Error)?.name === 'AbortError') return null;
      // Offline fallback: reuse a previously calculated route to the same place.
      const cached = storage.get<Route | null>(StorageKeys.lastRoute, null);
      if (cached && cached.to.id && cached.to.id === to.id) {
        set({ route: cached, loading: false, offline: true, error: null });
        return cached;
      }
      set({ loading: false, error: (error as Error)?.message ?? 'Unable to calculate route.' });
      return null;
    }
  },

  restoreLast() {
    const cached = storage.get<Route | null>(StorageKeys.lastRoute, null);
    if (cached) set({ route: cached, target: cached.to, offline: true });
    return cached;
  },

  startNavigation() {
    if (state.route) set({ navigating: true });
  },

  stopNavigation() {
    set({ navigating: false });
  },

  clear() {
    controller?.abort();
    set({ route: null, loading: false, error: null, navigating: false, target: null, offline: false });
  },
};

export function useRouteState() {
  return useSyncExternalStore(routeStore.subscribe, routeStore.get);
}
