/**
 * Background navigation: while a journey is active, an Android foreground
 * service ("Navigating to …" notification) keeps location updates flowing
 * with the app in the background or the screen off. Each update advances the
 * saved journey, raises landmark alerts (shared cooldown state with the
 * foreground engine, so nothing is announced twice), warns about hazards
 * ahead and detects arrival. In the foreground the app does all of this
 * itself, so the task stands back while the app is active.
 *
 * IMPORTANT: imported at the top level of src/app/_layout.tsx so the task is
 * defined before Android delivers updates to a restarted app.
 */
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { AppState } from 'react-native';

import { DEFAULT_SETTINGS, evaluate } from '@/features/proximity/engine';
import { loadProximityState, saveProximityState } from '@/features/proximity/proximity-store';
import {
  CHANNELS,
  configureNotifications,
  landmarkNotificationText,
  notifyNow,
  PROXIMITY_CATEGORY,
} from '@/features/notifications/local-notifications';
import { formatDistance } from '@/lib/geo';
import { getPreferences } from '@/lib/preferences';
import { storage, StorageKeys } from '@/lib/storage';
import { colors } from '@/lib/theme';

import { hazardLookahead, hazardsAhead } from './journey-items';
import { announceHazard, readStoredJourney, type StoredJourney } from './journey-store';
import { advance, stepStarts } from './navigation';
import { buildRouteIndex } from './route-geometry';

export const JOURNEY_TASK = 'gotourgo-journey-navigation';

TaskManager.defineTask<{ locations: Location.LocationObject[] }>(JOURNEY_TASK, async ({ data, error }) => {
  if (error || !data?.locations?.length) return;
  if (AppState.currentState === 'active') return;

  const saved = readStoredJourney(true);
  if (!saved) {
    await stopJourneyUpdates();
    return;
  }

  const index = buildRouteIndex(saved.route.coordinates);
  const starts = stepStarts(saved.route.steps);
  let progress = saved.progress;
  for (const l of data.locations) {
    progress = advance(saved.route, index, starts, {
      latitude: l.coords.latitude,
      longitude: l.coords.longitude,
      accuracy: l.coords.accuracy ?? null,
      timestamp: l.timestamp,
    }, progress);
  }
  if (!progress) return;
  await configureNotifications();

  if (progress.arrived) {
    storage.remove(StorageKeys.activeJourney);
    await notifyNow({
      title: `You've arrived at ${saved.target.name}`,
      body: 'Open GoTourGo to see what is around you.',
      channel: CHANNELS.proximity,
      data: { type: 'journey-arrived' },
    });
    await stopJourneyUpdates();
    return;
  }

  // Landmarks and hazards on the route: shared engine and cooldown state.
  const last = data.locations[data.locations.length - 1];
  const prefs = getPreferences();
  const settings = { ...DEFAULT_SETTINGS, cooldownMs: prefs.proximityCooldownHours * 3_600_000 };
  const landmarks = saved.items.filter((i) => i.kind === 'landmark');
  const result = evaluate(
    { latitude: last.coords.latitude, longitude: last.coords.longitude, accuracy: last.coords.accuracy ?? null, timestamp: last.timestamp },
    landmarks,
    loadProximityState(true),
    settings,
  );
  if (!result.rejected) {
    saveProximityState(result.state);
    const hit = result.announce?.primary;
    const item = hit ? landmarks.find((l) => l.id === hit.id) : undefined;
    if (hit && item) {
      const text = landmarkNotificationText(item.name, item.detail, formatDistance(hit.distance), result.announce!.others.length);
      await notifyNow({
        ...text,
        channel: CHANNELS.proximity,
        category: PROXIMITY_CATEGORY,
        data: { type: 'proximity', destinationId: item.id },
      });
    }
  }

  const ahead = hazardsAhead(saved.items, progress.along, hazardLookahead(saved.mode), saved.warned ?? []);
  for (const h of ahead.slice(0, 1)) await announceHazard(h, Math.max(0, h.along - progress.along), () => undefined);

  storage.set<StoredJourney>(StorageKeys.activeJourney, {
    ...saved,
    progress,
    warned: [...(saved.warned ?? []), ...ahead.map((h) => h.id)],
  });
});

export type BackgroundResult = 'started' | 'no-permission' | 'failed';

export async function hasBackgroundLocation() {
  const bg = await Location.getBackgroundPermissionsAsync().catch(() => null);
  return Boolean(bg?.granted);
}

/** Starts background navigation updates (needs "Allow all the time"). */
export async function startJourneyUpdates(destinationName: string): Promise<BackgroundResult> {
  try {
    const bg = await Location.getBackgroundPermissionsAsync();
    if (!bg.granted) return 'no-permission';
    if (await Location.hasStartedLocationUpdatesAsync(JOURNEY_TASK).catch(() => false)) {
      await Location.stopLocationUpdatesAsync(JOURNEY_TASK);
    }
    await Location.startLocationUpdatesAsync(JOURNEY_TASK, {
      accuracy: Location.Accuracy.High,
      timeInterval: 3000,
      distanceInterval: 15,
      pausesUpdatesAutomatically: false,
      activityType: Location.ActivityType.AutomotiveNavigation,
      showsBackgroundLocationIndicator: true,
      foregroundService: {
        notificationTitle: `Navigating to ${destinationName}`,
        notificationBody: 'GoTourGo will alert you about landmarks and hazards on the way.',
        notificationColor: colors.primary,
        killServiceOnDestroy: false,
      },
    });
    return 'started';
  } catch {
    return 'failed';
  }
}

export async function stopJourneyUpdates() {
  const running = await Location.hasStartedLocationUpdatesAsync(JOURNEY_TASK).catch(() => false);
  if (running) await Location.stopLocationUpdatesAsync(JOURNEY_TASK).catch(() => undefined);
}
