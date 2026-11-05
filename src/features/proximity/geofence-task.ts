/**
 * Background landmark alerts using OS geofencing (Android Geofencing API via
 * expo-location + expo-task-manager). Battery-friendly: no continuous GPS.
 *
 * Limitations (Android/Expo): requires "Allow all the time" location, a
 * development build or APK (not Expo Go), max 100 regions per app, and stops
 * if the user force-stops the app. Regions are re-registered on app start and
 * whenever the traveller leaves the refresh region (see REFRESH_REGION).
 *
 * IMPORTANT: this module must be imported at the top level of the app
 * (src/app/_layout.tsx) so the task is defined before the OS delivers events.
 */
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';

import type { Landmark } from '@/features/destinations/api';
import { applyOsTransition, DEFAULT_SETTINGS, nearestLandmarks } from '@/features/proximity/engine';
import { refreshRadius } from '@/features/proximity/heading';
import { loadProximityState, saveProximityState } from '@/features/proximity/proximity-store';
import {
  CHANNELS,
  configureNotifications,
  landmarkNotificationText,
  notifyNow,
  PROXIMITY_CATEGORY,
} from '@/features/notifications/local-notifications';
import { distanceMeters } from '@/lib/geo';
import { getPreferences } from '@/lib/preferences';
import { storage, StorageKeys } from '@/lib/storage';

export const GEOFENCE_TASK = 'gotourgo-landmark-geofences';
/** Android allows 100 geofences per app; keep a margin. */
const MAX_REGIONS = 90;
/**
 * An extra region around where the landmarks were registered. Leaving it
 * (even with the app closed) re-registers the nearest landmarks around the
 * new position, so coverage follows the traveller across the country.
 */
const REFRESH_REGION = '__refresh__';
/** Re-register regions after moving this far from the registration anchor. */
const REANCHOR_METERS = 20_000;

type GeofenceEvent = {
  eventType: Location.GeofencingEventType;
  region: Location.LocationRegion;
};

TaskManager.defineTask<GeofenceEvent>(GEOFENCE_TASK, async ({ data, error }) => {
  if (error || !data?.region?.identifier) return;
  const prefs = getPreferences();
  if (!prefs.backgroundAlerts) return;

  const id = data.region.identifier;
  const kind = data.eventType === Location.GeofencingEventType.Enter ? 'enter' : 'exit';

  if (id === REFRESH_REGION) {
    if (kind !== 'exit') return;
    const last = await Location.getLastKnownPositionAsync().catch(() => null);
    const anchor = last
      ? { latitude: last.coords.latitude, longitude: last.coords.longitude }
      : { latitude: data.region.latitude, longitude: data.region.longitude };
    await registerGeofences(anchor, true).catch(() => undefined);
    return;
  }
  const settings = { ...DEFAULT_SETTINGS, cooldownMs: prefs.proximityCooldownHours * 3_600_000 };

  // Re-read from SQLite: the foreground engine may have written meanwhile.
  const state = loadProximityState(true);
  const { state: next, announce } = applyOsTransition(state, id, kind, Date.now(), settings);
  saveProximityState(next);
  if (!announce) return;

  storage.invalidate(StorageKeys.landmarkCache);
  const landmark = storage.get<Landmark[]>(StorageKeys.landmarkCache, []).find((l) => l.id === id);
  if (!landmark) return;

  await configureNotifications();
  const text = landmarkNotificationText(landmark.name, landmark.shortDescription);
  await notifyNow({
    ...text,
    channel: CHANNELS.proximity,
    category: PROXIMITY_CATEGORY,
    data: { type: 'proximity', destinationId: landmark.id },
  });
});

/** Registers the nearest landmarks as OS geofences (call when opted in and permission granted). */
export async function registerGeofences(anchor: { latitude: number; longitude: number } | null, force = false) {
  const prefs = getPreferences();
  if (!prefs.backgroundAlerts) return stopGeofences();

  const bg = await Location.getBackgroundPermissionsAsync();
  if (!bg.granted) return;

  const landmarks = storage.get<Landmark[]>(StorageKeys.landmarkCache, []);
  if (landmarks.length === 0) return;

  const lastAnchor = storage.get<{ latitude: number; longitude: number } | null>(StorageKeys.geofenceAnchor, null);
  const running = await Location.hasStartedGeofencingAsync(GEOFENCE_TASK).catch(() => false);
  const moved = anchor && lastAnchor ? distanceMeters(anchor, lastAnchor) > REANCHOR_METERS : true;
  if (running && !moved && !force) return;

  const center = anchor ?? lastAnchor ?? landmarks[0];
  const nearest = nearestLandmarks(center, landmarks, MAX_REGIONS - 1);
  const regions: Location.LocationRegion[] = nearest.map((l) => ({
    identifier: l.id,
    latitude: l.latitude,
    longitude: l.longitude,
    radius: l.radius,
    notifyOnEnter: true,
    notifyOnExit: true,
  }));
  regions.push({
    identifier: REFRESH_REGION,
    latitude: center.latitude,
    longitude: center.longitude,
    radius: refreshRadius(center, nearest),
    notifyOnEnter: false,
    notifyOnExit: true,
  });

  await Location.startGeofencingAsync(GEOFENCE_TASK, regions);
  if (anchor) storage.set(StorageKeys.geofenceAnchor, anchor);
}

export async function stopGeofences() {
  const running = await Location.hasStartedGeofencingAsync(GEOFENCE_TASK).catch(() => false);
  if (running) await Location.stopGeofencingAsync(GEOFENCE_TASK);
}
