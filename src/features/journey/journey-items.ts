import type { Landmark } from '@/features/destinations/api';
import type { RoadAlert } from '@/lib/types';

import { buildRouteIndex, corridor, projectPoint, type RouteIndex } from './route-geometry';

/** A landmark or hazard along a journey, with where it falls on the route. */
export type JourneyItem = {
  kind: 'landmark' | 'hazard';
  id: string;
  name: string;
  detail: string;
  latitude: number;
  longitude: number;
  /** Alert radius in metres. */
  radius: number;
  /** Metres from the start of the route. */
  along: number;
  /** Metres between the item and the route. */
  offRoute: number;
  severity?: RoadAlert['severity'];
  alertType?: RoadAlert['alert_type'];
};

/** Landmarks within this distance of the route are listed "on your way". */
export const LANDMARK_REACH_M = 800;
export const MAX_LANDMARKS = 40;

/** Hazards worth warning about on a route (low severity is too noisy). */
const HAZARD_SEVERITIES = new Set(['medium', 'high', 'critical']);

export function journeyItems(index: RouteIndex, landmarks: Landmark[], alerts: RoadAlert[], now = Date.now()): JourneyItem[] {
  const lmHits = corridor(index, landmarks, (l) => Math.max(l.radius + 150, LANDMARK_REACH_M))
    // Within the alert radius first, then the most central, capped for long trips.
    .slice(0, 400)
    .map(
      (h): JourneyItem => ({
        kind: 'landmark',
        id: h.item.id,
        name: h.item.name,
        detail: h.item.shortDescription,
        latitude: h.item.latitude,
        longitude: h.item.longitude,
        radius: h.item.radius,
        along: h.along,
        offRoute: h.offRoute,
      }),
    );
  const landmarksOnWay =
    lmHits.length > MAX_LANDMARKS
      ? [...lmHits]
          .sort((a, b) => a.offRoute - a.radius - (b.offRoute - b.radius))
          .slice(0, MAX_LANDMARKS)
          .sort((a, b) => a.along - b.along)
      : lmHits;

  const active = alerts.filter((a) => HAZARD_SEVERITIES.has(a.severity) && (!a.ends_at || new Date(a.ends_at).getTime() > now));
  const hazards = corridor(index, active, (a) => Math.min(5000, a.radius_m) + 100).map(
    (h): JourneyItem => ({
      kind: 'hazard',
      id: `alert:${h.item.id}`,
      name: h.item.title,
      detail: h.item.description,
      latitude: h.item.latitude,
      longitude: h.item.longitude,
      radius: Math.min(5000, h.item.radius_m),
      along: h.along,
      offRoute: h.offRoute,
      severity: h.item.severity,
      alertType: h.item.alert_type,
    }),
  );

  return [...landmarksOnWay, ...hazards].sort((a, b) => a.along - b.along);
}

export function isOnRoute(item: JourneyItem) {
  return item.offRoute <= item.radius;
}

/** How far ahead (metres along the route) hazards are announced. */
export function hazardLookahead(mode: 'driving' | 'cycling' | 'walking') {
  return mode === 'driving' ? 2000 : mode === 'cycling' ? 800 : 400;
}

/** Hazards coming up within `lookahead` metres that have not been announced yet. */
export function hazardsAhead(items: JourneyItem[], along: number, lookahead: number, warned: string[]): JourneyItem[] {
  return items.filter(
    (i) => i.kind === 'hazard' && !warned.includes(i.id) && i.along - i.radius <= along + lookahead && i.along + i.radius >= along,
  );
}

/**
 * From a list of routes (best first), the first that keeps at least
 * `margin` metres outside the hazard's radius, or null if none does.
 */
export function routeAvoiding<R extends { coordinates: [number, number][] }>(
  routes: R[],
  hazard: { latitude: number; longitude: number; radius: number },
  margin = 100,
): R | null {
  for (const r of routes) {
    const index = buildRouteIndex(r.coordinates);
    if (projectPoint(index, hazard).offRoute > hazard.radius + margin) return r;
  }
  return null;
}
