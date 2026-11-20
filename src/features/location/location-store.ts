import { useSyncExternalStore } from 'react';

export type Fix = {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  heading: number | null;
  speed: number | null;
  timestamp: number;
  simulated?: boolean;
};

export type PermissionState = 'unknown' | 'undetermined' | 'granted' | 'denied';

export type LocationState = {
  permission: PermissionState;
  /** Android "Location" toggle; null until checked. */
  servicesEnabled: boolean | null;
  background: PermissionState;
  status: 'idle' | 'locating' | 'watching' | 'error';
  error: string | null;
  fix: Fix | null;
  /** True while "Simulate journey" drives the location. */
  simulating: boolean;
};

let state: LocationState = {
  permission: 'unknown',
  servicesEnabled: null,
  background: 'unknown',
  status: 'idle',
  error: null,
  fix: null,
  simulating: false,
};

const listeners = new Set<() => void>();
const fixListeners = new Set<(fix: Fix) => void>();
/** The latest real GPS fix, kept even while a simulation hides it. */
let realFix: Fix | null = null;

export const locationStore = {
  get: () => state,
  set(patch: Partial<LocationState>) {
    const endingSimulation = state.simulating && patch.simulating === false;
    state = { ...state, ...patch };
    // A simulation ended: back to where the traveller really is (the location
    // provider also asks the GPS for a fresh fix).
    if (endingSimulation) state = { ...state, fix: realFix };
    listeners.forEach((l) => l());
  },
  /** Publishes a new fix to UI subscribers and the proximity engine. */
  pushFix(fix: Fix) {
    if (!fix.simulated) realFix = fix;
    // Ignore real GPS while a simulated journey is running.
    if (state.simulating && !fix.simulated) return;
    state = { ...state, fix, status: 'watching', error: null };
    listeners.forEach((l) => l());
    fixListeners.forEach((l) => l(fix));
  },
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  onFix(listener: (fix: Fix) => void) {
    fixListeners.add(listener);
    return () => {
      fixListeners.delete(listener);
    };
  },
};

export function useLocationState(): LocationState {
  return useSyncExternalStore(locationStore.subscribe, locationStore.get);
}

/** Latest known fix (or null). */
export function useLastLocation(): Fix | null {
  return useSyncExternalStore(locationStore.subscribe, () => locationStore.get().fix);
}
