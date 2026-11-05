import { useEffect, useMemo, useRef, type ReactNode } from 'react';
import { AppState } from 'react-native';

import { useAuth } from '@/features/auth/auth-provider';
import { ALERT_LABELS, useRoadAlerts } from '@/features/alerts/api';
import { toLandmark, useDestinations } from '@/features/destinations/api';
import { locationStore, type Fix } from '@/features/location/location-store';
import { DEFAULT_SETTINGS, evaluate, type EngineLandmark } from '@/features/proximity/engine';
import { registerGeofences } from '@/features/proximity/geofence-task';
import { loadProximityState, proximityCard, saveProximityState } from '@/features/proximity/proximity-store';
import {
  CHANNELS,
  landmarkNotificationText,
  notifyNow,
  PROXIMITY_CATEGORY,
} from '@/features/notifications/local-notifications';
import { formatDistance } from '@/lib/geo';
import { getPreferences } from '@/lib/preferences';

const ALERT_PREFIX = 'alert:';

/**
 * Runs the proximity engine on every (throttled) foreground fix. Uses only
 * local distance maths: no network calls per GPS update.
 */
export function ProximityProvider({ children }: { children: ReactNode }) {
  const { userId } = useAuth();
  const destinations = useDestinations();
  const alerts = useRoadAlerts();

  const engineInput = useMemo(() => {
    const landmarks = (destinations.data ?? []).map(toLandmark);
    const byId = new Map(landmarks.map((l) => [l.id, l]));
    const alertRegions = (alerts.data ?? [])
      .filter((a) => a.severity === 'high' || a.severity === 'critical')
      .map((a) => ({
        id: ALERT_PREFIX + a.id,
        latitude: a.latitude,
        longitude: a.longitude,
        radius: Math.min(5000, a.radius_m),
        alert: a,
      }));
    const regions: EngineLandmark[] = [...landmarks, ...alertRegions];
    return { regions, byId, alertsById: new Map(alertRegions.map((a) => [a.id, a.alert])) };
  }, [destinations.data, alerts.data]);

  const inputRef = useRef(engineInput);
  useEffect(() => {
    inputRef.current = engineInput;
  }, [engineInput]);

  // Keep OS geofences registered near the user (no-op unless opted in).
  useEffect(() => {
    if (!userId || !destinations.data?.length) return;
    registerGeofences(locationStore.get().fix).catch(() => undefined);
  }, [userId, destinations.data]);

  useEffect(() => {
    const handle = (fix: Fix) => {
      const { regions, byId, alertsById } = inputRef.current;
      if (regions.length === 0) return;
      const prefs = getPreferences();
      const settings = { ...DEFAULT_SETTINGS, cooldownMs: prefs.proximityCooldownHours * 3_600_000 };

      const result = evaluate(fix, regions, loadProximityState(), settings);
      if (result.rejected) return;
      saveProximityState(result.state);
      proximityCard.setInside(result.inside.filter((h) => !h.id.startsWith(ALERT_PREFIX)));

      if (!result.announce) return;
      const hits = [result.announce.primary, ...result.announce.others];
      const landmarkHits = hits.filter((h) => !h.id.startsWith(ALERT_PREFIX));
      const alertHits = hits.filter((h) => h.id.startsWith(ALERT_PREFIX));

      if (landmarkHits.length) {
        const primary = byId.get(landmarkHits[0].id);
        if (primary) {
          const text = landmarkNotificationText(
            primary.name,
            primary.shortDescription,
            formatDistance(landmarkHits[0].distance),
            landmarkHits.length - 1,
          );
          notifyNow({
            ...text,
            channel: CHANNELS.proximity,
            category: PROXIMITY_CATEGORY,
            data: { type: 'proximity', destinationId: primary.id },
          });
          if (prefs.inAppProximityCard && AppState.currentState === 'active') {
            proximityCard.show(landmarkHits);
          }
        }
      }

      if (prefs.roadAlertNotifications) {
        for (const hit of alertHits.slice(0, 1)) {
          const alert = alertsById.get(hit.id);
          if (!alert) continue;
          notifyNow({
            title: `${ALERT_LABELS[alert.alert_type]}: ${alert.title}`,
            body: alert.description,
            channel: CHANNELS.alerts,
            data: { type: 'alert', alertId: alert.id },
          });
        }
      }

      // Re-anchor OS geofences when the user has moved far.
      registerGeofences(fix).catch(() => undefined);
    };

    return locationStore.onFix(handle);
  }, []);

  return children;
}
