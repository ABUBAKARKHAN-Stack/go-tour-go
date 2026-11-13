import * as Location from 'expo-location';
import { useEffect, type ReactNode } from 'react';
import { AppState, Linking, Platform } from 'react-native';

import { locationStore, type Fix } from '@/features/location/location-store';

/**
 * Foreground location: Balanced accuracy, at most one update every 10 s or
 * 25 m, only while the app is active (navigation switches to high accuracy). Background proximity is handled by OS
 * geofencing (see proximity/geofence-task.ts), not by this watcher.
 */
const WATCH_OPTIONS: Location.LocationOptions = {
  accuracy: Location.Accuracy.Balanced,
  timeInterval: 10_000,
  distanceInterval: 25,
  mayShowUserSettingsDialog: true,
};

/** While navigating: high accuracy, about once a second or every 5 m. */
const NAVIGATION_OPTIONS: Location.LocationOptions = {
  accuracy: Location.Accuracy.BestForNavigation,
  timeInterval: 1000,
  distanceInterval: 5,
  mayShowUserSettingsDialog: true,
};

/*
 * Watcher states: stopped -> starting -> watching (balanced or navigation).
 * `wanted` is what the app asked for last; `generation` changes on every stop,
 * so a start that was still waiting when the app stopped it (for example the
 * app went to the background) drops its watcher instead of leaving GPS on.
 */
let subscription: Location.LocationSubscription | null = null;
let starting = false;
let wanted = false;
let generation = 0;
let navigationMode = false;
/** The accuracy the running watcher was started with. */
let watchingNavigation = false;

/** Switches the foreground watcher between battery-friendly and navigation accuracy. */
export function setNavigationMode(on: boolean) {
  if (navigationMode === on) return;
  navigationMode = on;
  // A start in progress picks the new mode up when it finishes.
  if (subscription) {
    stopWatching();
    startWatching();
  }
}

function toFix(l: Location.LocationObject): Fix {
  return {
    latitude: l.coords.latitude,
    longitude: l.coords.longitude,
    accuracy: l.coords.accuracy ?? null,
    heading: l.coords.heading ?? null,
    speed: l.coords.speed ?? null,
    timestamp: l.timestamp,
  };
}

async function refreshPermissionState() {
  const [fg, bg, services] = await Promise.all([
    Location.getForegroundPermissionsAsync(),
    Location.getBackgroundPermissionsAsync().catch(() => null),
    Location.hasServicesEnabledAsync().catch(() => null),
  ]);
  locationStore.set({
    permission: fg.granted ? 'granted' : fg.canAskAgain ? 'undetermined' : 'denied',
    background: bg?.granted ? 'granted' : bg && !bg.canAskAgain ? 'denied' : 'undetermined',
    servicesEnabled: services,
  });
  return fg.granted;
}

export async function startWatching() {
  wanted = true;
  if (subscription || starting) return;
  starting = true;
  const gen = generation;
  const stale = () => gen !== generation;
  try {
    const granted = await refreshPermissionState();
    if (!granted || stale()) return;
    if (locationStore.get().servicesEnabled === false) {
      locationStore.set({ status: 'error', error: 'Location services are turned off.' });
      return;
    }
    locationStore.set({ status: locationStore.get().fix ? 'watching' : 'locating' });

    // Show something quickly: last known position first (cheap, no GPS fix needed).
    const last = await Location.getLastKnownPositionAsync({ maxAge: 5 * 60_000 }).catch(() => null);
    if (stale()) return;
    if (last) locationStore.pushFix(toFix(last));

    const nav = navigationMode;
    const sub = await Location.watchPositionAsync(
      nav ? NAVIGATION_OPTIONS : WATCH_OPTIONS,
      (l) => locationStore.pushFix(toFix(l)),
      (reason) => locationStore.set({ status: 'error', error: reason || 'Location unavailable.' }),
    );
    if (stale()) {
      // Stopped while starting: don't leave this watcher running.
      sub.remove();
      return;
    }
    subscription = sub;
    watchingNavigation = nav;
  } catch (error) {
    if (!stale()) {
      locationStore.set({
        status: 'error',
        error: error instanceof Error ? error.message : 'Location unavailable.',
      });
    }
  } finally {
    starting = false;
    if (stale()) {
      // Stopped while starting, then asked to start again: start fresh now.
      if (wanted) void startWatching();
    } else if (subscription && watchingNavigation !== navigationMode) {
      // Navigation mode changed while starting.
      stopWatching();
      void startWatching();
    }
  }
}

export function stopWatching() {
  wanted = false;
  generation += 1;
  subscription?.remove();
  subscription = null;
}

/** Asks for foreground location (called from a contextual prompt, not at launch). */
export async function requestLocationPermission(): Promise<boolean> {
  const res = await Location.requestForegroundPermissionsAsync();
  await refreshPermissionState();
  if (res.granted) await startWatching();
  return res.granted;
}

/** Asks for "Allow all the time" (Android requires foreground first). */
export async function requestBackgroundPermission(): Promise<boolean> {
  const fg = await Location.requestForegroundPermissionsAsync();
  if (!fg.granted) {
    await refreshPermissionState();
    return false;
  }
  const bg = await Location.requestBackgroundPermissionsAsync();
  await refreshPermissionState();
  return bg.granted;
}

export async function getCurrentFix(): Promise<Fix | null> {
  const known = locationStore.get().fix;
  if (known && Date.now() - known.timestamp < 60_000) return known;
  try {
    const l = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
    const fix = toFix(l);
    locationStore.pushFix(fix);
    return fix;
  } catch {
    const last = await Location.getLastKnownPositionAsync().catch(() => null);
    return last ? toFix(last) : known;
  }
}

export function openLocationSettings() {
  if (Platform.OS === 'android') {
    Linking.sendIntent('android.settings.LOCATION_SOURCE_SETTINGS').catch(() => Linking.openSettings());
  } else {
    Linking.openSettings();
  }
}

export function LocationProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Only start automatically when permission was granted before; first-time
    // permission is requested contextually from the map/home screens.
    startWatching();
    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'active') startWatching();
      else stopWatching(); // background proximity relies on OS geofencing
    });
    return () => {
      sub.remove();
      stopWatching();
    };
  }, []);

  return children;
}
