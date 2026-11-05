/**
 * Geometry on a route polyline, all on the phone (works offline):
 * - where a point is along the route (snapping, distance travelled, off-route)
 * - which landmarks and hazards lie along a route (corridor search)
 *
 * Distances use a local flat-earth projection per segment, accurate to well
 * under a metre at city scale, and a coarse grid so corridor searches over
 * thousands of landmarks stay fast.
 */
import { distanceMeters, type LatLng } from '@/lib/geo';

export type RouteIndex = {
  coords: [number, number][]; // [lng, lat]
  /** Distance from the start to each vertex, metres. */
  cum: number[];
  total: number;
};

const M_PER_DEG_LAT = 110_540;
const M_PER_DEG_LNG_EQ = 111_320;

export function buildRouteIndex(coords: [number, number][]): RouteIndex {
  const cum = [0];
  for (let i = 1; i < coords.length; i++) {
    const [lng1, lat1] = coords[i - 1];
    const [lng2, lat2] = coords[i];
    cum.push(cum[i - 1] + distanceMeters({ latitude: lat1, longitude: lng1 }, { latitude: lat2, longitude: lng2 }));
  }
  return { coords, cum, total: cum[cum.length - 1] ?? 0 };
}

export type Projection = {
  /** Metres from the route start to the snapped point. */
  along: number;
  /** Metres from the point to the route. */
  offRoute: number;
  segment: number;
  point: [number, number];
  /** Direction of travel on that segment, degrees clockwise from north. */
  bearing: number;
};

function projectOnSegment(index: RouteIndex, i: number, p: LatLng) {
  const [ax, ay] = index.coords[i];
  const [bx, by] = index.coords[i + 1];
  const kx = Math.cos((ay * Math.PI) / 180) * M_PER_DEG_LNG_EQ;
  const ky = M_PER_DEG_LAT;
  const dx = (bx - ax) * kx;
  const dy = (by - ay) * ky;
  const px = (p.longitude - ax) * kx;
  const py = (p.latitude - ay) * ky;
  const len2 = dx * dx + dy * dy;
  const t = len2 > 0 ? Math.max(0, Math.min(1, (px * dx + py * dy) / len2)) : 0;
  const ex = px - t * dx;
  const ey = py - t * dy;
  return {
    t,
    dist: Math.sqrt(ex * ex + ey * ey),
    point: [ax + (bx - ax) * t, ay + (by - ay) * t] as [number, number],
    bearing: ((Math.atan2(dx, dy) * 180) / Math.PI + 360) % 360,
  };
}

/**
 * Snaps a point to the route. With `window`, only segments in that range are
 * searched (used while navigating so the position cannot jump to a parallel
 * or returning part of the route).
 */
export function projectPoint(index: RouteIndex, p: LatLng, window?: { from: number; to: number }): Projection {
  const last = index.coords.length - 2;
  if (last < 0) {
    const only = index.coords[0] ?? [p.longitude, p.latitude];
    return { along: 0, offRoute: distanceMeters(p, { latitude: only[1], longitude: only[0] }), segment: 0, point: only, bearing: 0 };
  }
  const from = Math.max(0, window?.from ?? 0);
  const to = Math.min(last, window?.to ?? last);
  let best: Projection | null = null;
  for (let i = from; i <= to; i++) {
    const r = projectOnSegment(index, i, p);
    if (!best || r.dist < best.offRoute) {
      const segLen = index.cum[i + 1] - index.cum[i];
      best = { along: index.cum[i] + r.t * segLen, offRoute: r.dist, segment: i, point: r.point, bearing: r.bearing };
    }
  }
  return best!;
}

export type CorridorHit<T> = { item: T; along: number; offRoute: number };

const CELL = 0.01; // degrees, about 1.1 km

/**
 * Items within `maxOff(item)` metres of the route, ordered by distance along
 * it. Uses a grid of route segments so each item checks only nearby segments.
 */
export function corridor<T extends LatLng>(index: RouteIndex, items: T[], maxOff: (item: T) => number): CorridorHit<T>[] {
  if (index.coords.length < 2) return [];
  const grid = new Map<string, number[]>();
  const key = (x: number, y: number) => `${x}:${y}`;
  for (let i = 0; i < index.coords.length - 1; i++) {
    const [ax, ay] = index.coords[i];
    const [bx, by] = index.coords[i + 1];
    const x0 = Math.floor(Math.min(ax, bx) / CELL);
    const x1 = Math.floor(Math.max(ax, bx) / CELL);
    const y0 = Math.floor(Math.min(ay, by) / CELL);
    const y1 = Math.floor(Math.max(ay, by) / CELL);
    for (let x = x0; x <= x1; x++) {
      for (let y = y0; y <= y1; y++) {
        const k = key(x, y);
        const list = grid.get(k);
        if (list) list.push(i);
        else grid.set(k, [i]);
      }
    }
  }

  const hits: CorridorHit<T>[] = [];
  for (const item of items) {
    const limit = maxOff(item);
    const reach = Math.ceil(limit / 1100) + 1;
    const cx = Math.floor(item.longitude / CELL);
    const cy = Math.floor(item.latitude / CELL);
    const segments = new Set<number>();
    for (let x = cx - reach; x <= cx + reach; x++) {
      for (let y = cy - reach; y <= cy + reach; y++) {
        grid.get(key(x, y))?.forEach((s) => segments.add(s));
      }
    }
    let best: { along: number; dist: number } | null = null;
    for (const s of segments) {
      const r = projectOnSegment(index, s, item);
      if (!best || r.dist < best.dist) {
        best = { along: index.cum[s] + r.t * (index.cum[s + 1] - index.cum[s]), dist: r.dist };
      }
    }
    if (best && best.dist <= limit) hits.push({ item, along: best.along, offRoute: best.dist });
  }
  return hits.sort((a, b) => a.along - b.along);
}

/** The route from `along` metres onwards (for drawing what is left). */
export function remainingLine(index: RouteIndex, along: number): [number, number][] {
  if (index.coords.length < 2) return index.coords;
  let i = 0;
  while (i < index.cum.length - 2 && index.cum[i + 1] < along) i++;
  const segLen = index.cum[i + 1] - index.cum[i];
  const t = segLen > 0 ? Math.max(0, Math.min(1, (along - index.cum[i]) / segLen)) : 0;
  const [ax, ay] = index.coords[i];
  const [bx, by] = index.coords[i + 1];
  return [[ax + (bx - ax) * t, ay + (by - ay) * t], ...index.coords.slice(i + 1)];
}

/** The point `along` metres from the start, and the direction of travel there. */
export function pointAlong(index: RouteIndex, along: number): { latitude: number; longitude: number; bearing: number } {
  const line = remainingLine(index, Math.max(0, Math.min(index.total, along)));
  const [lng, lat] = line[0];
  const nextPoint = line[1] ?? line[0];
  const kx = Math.cos((lat * Math.PI) / 180);
  const bearing = ((Math.atan2((nextPoint[0] - lng) * kx, nextPoint[1] - lat) * 180) / Math.PI + 360) % 360;
  return { latitude: lat, longitude: lng, bearing };
}
