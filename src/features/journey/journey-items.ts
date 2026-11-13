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
 * The blocked spot of a hazard, in metres around its point. A report's radius
 * is the area to warn about (up to tens of kilometres for fog or snow), not
 * the road that is blocked, so "a way around" only has to miss this core.
 */
export const HAZARD_CORE_M = 300;
/** Closer than this to a hazard's point, the traveller is already at it: no detour makes sense. */
export const AT_HAZARD_M = HAZARD_CORE_M + 150;

/** The part of a hazard a detour must stay clear of. */
export function hazardCore(radius: number) {
  return Math.min(radius, HAZARD_CORE_M);
}

/**
 * From a list of routes (best first), the first whose closest approach to the
 * hazard's point stays at least `margin` metres outside its core, or null if
 * none does (often the case on mountain roads with a single way through).
 */
export function routeAvoiding<R extends { coordinates: [number, number][] }>(
  routes: R[],
  hazard: { latitude: number; longitude: number; radius: number },
  margin = 150,
): R | null {
  const clearance = hazardCore(hazard.radius) + margin;
  for (const r of routes) {
    const index = buildRouteIndex(r.coordinates);
    if (projectPoint(index, hazard).offRoute > clearance) return r;
  }
  return null;
}
