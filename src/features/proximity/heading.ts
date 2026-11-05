/**
 * Direction-aware helpers for exploring without a journey (pure, unit tested):
 * prefer landmarks ahead of the traveller, spot hazards coming up in the
 * direction of travel, and size the background "refresh" geofence.
 */
import { distanceMeters, type LatLng } from '@/lib/geo';

const toRad = (d: number) => (d * Math.PI) / 180;
const toDeg = (r: number) => (r * 180) / Math.PI;

/** Initial bearing from `a` to `b`, degrees clockwise from north. */
export function bearingTo(a: LatLng, b: LatLng): number {
  const p1 = toRad(a.latitude);
  const p2 = toRad(b.latitude);
  const dl = toRad(b.longitude - a.longitude);
  const y = Math.sin(dl) * Math.cos(p2);
  const x = Math.cos(p1) * Math.sin(p2) - Math.sin(p1) * Math.cos(p2) * Math.cos(dl);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

/** Smallest difference between two bearings (0–180). */
export function angleDiff(a: number, b: number): number {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

export type MovingFix = LatLng & { heading: number | null; speed: number | null };

/** Moving fast enough for the GPS heading to mean something (about walking pace). */
export function isMoving(fix: MovingFix) {
  return fix.heading != null && fix.heading >= 0 && (fix.speed ?? 0) >= 1;
}

/**
 * Orders simultaneous landmark hits so the ones ahead come first (nearest
 * first within each group). Without a usable heading the order is unchanged.
 */
export function preferAhead<T extends { id: string; distance: number }>(
  hits: T[],
  fix: MovingFix,
  positionOf: (id: string) => LatLng | undefined,
  cone = 60,
): T[] {
  if (!isMoving(fix) || hits.length < 2) return hits;
  const ahead = (h: T) => {
    const p = positionOf(h.id);
    return p ? angleDiff(bearingTo(fix, p), fix.heading!) <= cone : false;
  };
  return [...hits].sort((a, b) => Number(ahead(b)) - Number(ahead(a)) || a.distance - b.distance);
}

/**
 * Hazards the traveller is heading into: within `lookahead` metres (plus the
 * hazard's radius), inside a cone around the direction of travel, not yet
 * announced. Only while moving.
 */
export function hazardsAheadOfFix<T extends LatLng & { id: string; radius: number }>(
  fix: MovingFix,
  hazards: T[],
  warned: ReadonlySet<string>,
  lookahead = 2000,
  cone = 35,
): (T & { distance: number })[] {
  if (!isMoving(fix)) return [];
  const out: (T & { distance: number })[] = [];
  for (const h of hazards) {
    if (warned.has(h.id)) continue;
    const distance = distanceMeters(fix, h);
    if (distance > lookahead + h.radius) continue;
    // Already inside: the regular radius alert covers it.
    if (distance <= h.radius) continue;
    if (angleDiff(bearingTo(fix, h), fix.heading!) <= cone) out.push({ ...h, distance });
  }
  return out.sort((a, b) => a.distance - b.distance);
}

/**
 * Radius of the background "refresh" geofence around the registration point.
 * Leaving it means the registered landmarks are getting far away, so the
 * nearest set is registered again. It sits inside the ring of registered
 * landmarks so it is crossed before running out of coverage.
 */
export function refreshRadius(anchor: LatLng, registered: LatLng[]): number {
  if (registered.length === 0) return 5000;
  const farthest = Math.max(...registered.map((p) => distanceMeters(anchor, p)));
  return Math.round(Math.min(30_000, Math.max(2000, farthest * 0.6)));
}
