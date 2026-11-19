/**
 * Alternative routes next to the one being followed (pure, unit tested):
 * where each one splits off, where to put its "+4 min" label, and whether it
 * is really different at all.
 */
import type { Route } from '@/features/routing/osrm';

import { buildRouteIndex, projectPoint, type RouteIndex } from './route-geometry';

export type AltRoute = {
  /** Stable for the same road (keys, taps). */
  id: string;
  route: Route;
  /** Only the part that differs from the main route: what is drawn and tappable. */
  segment: [number, number][];
  /** Metres along the main route where this one leaves it (gone once passed). */
  splitAlong: number;
  /** Seconds slower (+) or faster (−) than the main route. */
  delta: number;
  /** A spot on the part of this route that differs, for its label. */
  label: [number, number];
};

/** Off the main route by more than this, a point is on a different road. */
const APART_M = 35;
/** Alternatives that differ for less than this are the same route. */
const MIN_DIFFERENT_M = 300;
const MAX_ALTERNATIVES = 2;

/**
 * How `alt` relates to the main route: where it splits off and the middle of
 * the stretch that differs. Null when it is (nearly) the same road.
 */
export function compareRoute(
  main: RouteIndex,
  alt: Route,
): { splitAlong: number; label: [number, number]; segment: [number, number][] } | null {
  const own = buildRouteIndex(alt.coordinates);
  let first = -1;
  let last = -1;
  let before = 0; // last sampled point still on the main route before it splits
  let after = -1; // first sampled point back on it after the last differing one
  let splitAlong = 0;
  // Sample the route (about 400 points at most) so long routes stay quick on a phone.
  const step = Math.max(25, own.total / 400);
  let lastSampled = -Infinity;
  for (let i = 0; i < alt.coordinates.length; i++) {
    const isEnd = i === alt.coordinates.length - 1;
    if (!isEnd && own.cum[i] - lastSampled < step) continue;
    lastSampled = own.cum[i];
    const [longitude, latitude] = alt.coordinates[i];
    const p = projectPoint(main, { latitude, longitude });
    if (p.offRoute > APART_M) {
      if (first < 0) first = i;
      last = i;
      after = -1;
    } else if (first < 0) {
      splitAlong = p.along;
      before = i;
    } else if (after < 0) {
      after = i;
    }
  }
  if (first < 0) return null;
  const differs = own.cum[last] - own.cum[first];
  if (differs < MIN_DIFFERENT_M) return null;
  // The middle of the differing stretch, by distance.
  const middle = own.cum[first] + differs / 2;
  let k = first;
  while (k < last && own.cum[k] < middle) k++;
  return { splitAlong, label: alt.coordinates[k], segment: alt.coordinates.slice(before, (after < 0 ? alt.coordinates.length - 1 : after) + 1) };
}

/**
 * Up to two alternatives that really differ from the main route, quickest
 * first. `mainDuration` is what the main route still takes (alternatives
 * fetched mid-journey start where the traveller is, so they compare with the
 * time left, not the whole route).
 */
export function pickAlternatives(main: Route, mainIndex: RouteIndex, candidates: Route[], mainDuration = main.duration): AltRoute[] {
  const out: AltRoute[] = [];
  for (const r of candidates) {
    if (r === main) continue;
    const c = compareRoute(mainIndex, r);
    if (!c) continue;
    // Skip near-copies of an alternative already kept.
    if (out.some((o) => !compareRoute(buildRouteIndex(o.route.coordinates), r))) continue;
    out.push({
      id: `${Math.round(r.distance)}-${Math.round(r.duration)}-${r.coordinates.length}`,
      route: r,
      segment: c.segment,
      splitAlong: c.splitAlong,
      delta: Math.round(r.duration - mainDuration),
      label: c.label,
    });
  }
  return out.sort((a, b) => a.delta - b.delta).slice(0, MAX_ALTERNATIVES);
}

const indexes = new WeakMap<Route, RouteIndex>();

/** A route's geometry index, built once per route. */
export function routeIndexOf(route: Route): RouteIndex {
  let idx = indexes.get(route);
  if (!idx) {
    idx = buildRouteIndex(route.coordinates);
    indexes.set(route, idx);
  }
  return idx;
}

/**
 * Can the traveller still take this alternative? Only while they are on it
 * (the shared road before it turns off) and its turn-off isn't behind them.
 * Once they leave it (they took the other road) it is gone, like in map apps.
 */
export function stillTakeable(alt: AltRoute, here: { latitude: number; longitude: number }, along: number, nearM = 40): boolean {
  if (along > alt.splitAlong + 30) return false;
  return projectPoint(routeIndexOf(alt.route), here).offRoute <= nearM;
}

/** The alternatives the traveller can still take (the same array when nothing changed). */
export function takeableAlternatives(alts: AltRoute[], here: { latitude: number; longitude: number }, along: number, nearM = 40): AltRoute[] {
  const left = alts.filter((a) => stillTakeable(a, here, along, nearM));
  return left.length === alts.length ? alts : left;
}

/** Alternatives still ahead: the ones whose split point is not yet behind the traveller. */
export function alternativesAhead(alts: AltRoute[], along: number): AltRoute[] {
  const left = alts.filter((a) => along <= a.splitAlong + 30);
  return left.length === alts.length ? alts : left;
}
