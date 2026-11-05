import { tx } from '@/lib/i18n';
/** Pure geo helpers (no React Native imports, so they run in unit tests). */

export type LatLng = { latitude: number; longitude: number };

const EARTH_RADIUS_M = 6_371_000;
const toRad = (deg: number) => (deg * Math.PI) / 180;
const toDeg = (rad: number) => (rad * 180) / Math.PI;

/** Great-circle distance in metres (haversine). */
export function distanceMeters(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Point reached travelling `distance` metres from `origin` on `bearingDeg`. */
export function destinationPoint(origin: LatLng, bearingDeg: number, distance: number): LatLng {
  const δ = distance / EARTH_RADIUS_M;
  const θ = toRad(bearingDeg);
  const φ1 = toRad(origin.latitude);
  const λ1 = toRad(origin.longitude);
  const φ2 = Math.asin(Math.sin(φ1) * Math.cos(δ) + Math.cos(φ1) * Math.sin(δ) * Math.cos(θ));
  const λ2 =
    λ1 + Math.atan2(Math.sin(θ) * Math.sin(δ) * Math.cos(φ1), Math.cos(δ) - Math.sin(φ1) * Math.sin(φ2));
  return { latitude: toDeg(φ2), longitude: ((toDeg(λ2) + 540) % 360) - 180 };
}

/** Closed polygon ring approximating a circle, as [lng, lat] pairs (GeoJSON order). */
export function circleRing(center: LatLng, radiusMeters: number, steps = 48): [number, number][] {
  const ring: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const p = destinationPoint(center, (i * 360) / steps, radiusMeters);
    ring.push([p.longitude, p.latitude]);
  }
  return ring;
}

/** [west, south, east, north] bounds of a list of [lng, lat] coordinates. */
export function boundsOf(coords: [number, number][]): [number, number, number, number] | null {
  if (coords.length === 0) return null;
  let w = Infinity;
  let s = Infinity;
  let e = -Infinity;
  let n = -Infinity;
  for (const [lng, lat] of coords) {
    w = Math.min(w, lng);
    e = Math.max(e, lng);
    s = Math.min(s, lat);
    n = Math.max(n, lat);
  }
  return [w, s, e, n];
}

export function formatDistance(meters: number): string {
  if (!Number.isFinite(meters)) return '';
  if (meters < 950) return `${Math.max(10, Math.round(meters / 10) * 10)} m`;
  const km = meters / 1000;
  return km < 10 ? `${km.toFixed(1)} km` : `${Math.round(km)} km`;
}

export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds)) return '';
  const minutes = Math.max(1, Math.round(seconds / 60));
  if (minutes < 60) return tx('{0} min', { 0: minutes });
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? tx('{0} h {1} min', { 0: h, 1: m }) : tx('{0} h', { 0: h });
}

/** Shortest distance from a point to a polyline of [lng, lat] (approximate, metres). */
export function distanceToLine(point: LatLng, line: [number, number][]): number {
  if (line.length === 0) return Infinity;
  if (line.length === 1) return distanceMeters(point, { latitude: line[0][1], longitude: line[0][0] });
  // Equirectangular projection around the point is accurate enough for route snapping.
  const k = Math.cos(toRad(point.latitude));
  const project = ([lng, lat]: [number, number]) => [
    toRad(lng - point.longitude) * k * EARTH_RADIUS_M,
    toRad(lat - point.latitude) * EARTH_RADIUS_M,
  ];
  let best = Infinity;
  for (let i = 0; i < line.length - 1; i++) {
    const [ax, ay] = project(line[i]);
    const [bx, by] = project(line[i + 1]);
    const dx = bx - ax;
    const dy = by - ay;
    const len2 = dx * dx + dy * dy;
    const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, -(ax * dx + ay * dy) / len2));
    const cx = ax + t * dx;
    const cy = ay + t * dy;
    best = Math.min(best, Math.hypot(cx, cy));
  }
  return best;
}

/** Remaining length along a route from the closest vertex to the end (metres). */
export function remainingRouteDistance(point: LatLng, line: [number, number][]): number {
  if (line.length < 2) return 0;
  let closest = 0;
  let closestDist = Infinity;
  for (let i = 0; i < line.length; i++) {
    const d = distanceMeters(point, { latitude: line[i][1], longitude: line[i][0] });
    if (d < closestDist) {
      closestDist = d;
      closest = i;
    }
  }
  let total = closestDist;
  for (let i = closest; i < line.length - 1; i++) {
    total += distanceMeters(
      { latitude: line[i][1], longitude: line[i][0] },
      { latitude: line[i + 1][1], longitude: line[i + 1][0] },
    );
  }
  return total;
}
