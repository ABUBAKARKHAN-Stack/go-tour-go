/**
 * Turn-by-turn progress for an active journey. Pure (unit tested): given the
 * route, the previous progress and a new GPS fix it returns where the
 * traveller is, the next manoeuvre, time left, and whether they left the
 * route or arrived. Runs on every navigation fix, foreground or background.
 */
import type { Route, RouteStep, TravelMode } from '@/features/routing/osrm';
import { distanceMeters } from '@/lib/geo';

import { projectPoint, type RouteIndex } from './route-geometry';

export type NavFix = { latitude: number; longitude: number; accuracy: number | null; timestamp: number };

export type NavProgress = {
  along: number;
  remaining: number;
  /** Seconds left, scaled from the route's own estimate. */
  etaSeconds: number;
  /** Step being travelled now (its manoeuvre is behind the traveller). */
  stepIndex: number;
  /** Metres to the next manoeuvre (end of the current step). */
  toManeuver: number;
  segment: number;
  snapped: [number, number];
  bearing: number;
  offRouteMeters: number;
  /** Consecutive fixes beyond the off-route threshold. */
  offCount: number;
  offRoute: boolean;
  arrived: boolean;
  timestamp: number;
};

const OFF_ROUTE_FIXES = 3;
const ARRIVE_REMAINING_M = 30;
const ARRIVE_DISTANCE_M = 35;
/** Segments searched behind/ahead of the last position before a full search. */
const WINDOW_BACK = 15;
const WINDOW_AHEAD = 400;

export function stepStarts(steps: RouteStep[]): number[] {
  const starts: number[] = [];
  let acc = 0;
  for (const s of steps) {
    starts.push(acc);
    acc += s.distance;
  }
  return starts;
}

export function offRouteThreshold(accuracy: number | null) {
  return Math.min(100, Math.max(35, (accuracy ?? 20) * 1.5));
}

export function advance(
  route: Route,
  index: RouteIndex,
  starts: number[],
  fix: NavFix,
  prev: NavProgress | null,
): NavProgress {
  let proj = prev
    ? projectPoint(index, fix, { from: prev.segment - WINDOW_BACK, to: prev.segment + WINDOW_AHEAD })
    : projectPoint(index, fix);
  // Lost the thread (e.g. after a tunnel or a long gap): search everything.
  if (prev && proj.offRoute > 60) {
    const full = projectPoint(index, fix);
    if (full.offRoute < proj.offRoute) proj = full;
  }

  const threshold = offRouteThreshold(fix.accuracy);
  const isOff = proj.offRoute > threshold;
  const offCount = isOff ? (prev?.offCount ?? 0) + 1 : 0;

  // Do not let jitter move the position backwards while on the route.
  const along = !isOff && prev && proj.along < prev.along && prev.along - proj.along < 25 ? prev.along : proj.along;
  const remaining = Math.max(0, index.total - along);

  let stepIndex = 0;
  for (let i = 0; i < starts.length; i++) {
    if (starts[i] <= along + 5) stepIndex = i;
    else break;
  }
  const nextStart = starts[stepIndex + 1] ?? index.total;
  const toManeuver = Math.max(0, nextStart - along);

  const dest = { latitude: route.to.latitude, longitude: route.to.longitude };
  const arrived = remaining < ARRIVE_REMAINING_M || distanceMeters(fix, dest) < ARRIVE_DISTANCE_M;

  return {
    along,
    remaining,
    etaSeconds: index.total > 0 ? Math.round(route.duration * (remaining / index.total)) : 0,
    stepIndex,
    toManeuver,
    segment: proj.segment,
    snapped: proj.point,
    bearing: proj.bearing,
    offRouteMeters: proj.offRoute,
    offCount,
    offRoute: offCount >= OFF_ROUTE_FIXES && !arrived,
    arrived,
    timestamp: fix.timestamp,
  };
}

/** Distances (metres before a manoeuvre) at which the voice speaks. */
export function voiceThresholds(mode: TravelMode): number[] {
  if (mode === 'driving') return [800, 300, 60];
  if (mode === 'cycling') return [300, 100, 25];
  return [150, 40, 15];
}

/** The threshold just crossed between two fixes, if any. */
export function crossedThreshold(prevTo: number | null, nowTo: number, thresholds: number[]): number | null {
  if (prevTo == null) return null;
  for (const t of thresholds) {
    if (prevTo > t && nowTo <= t) return t;
  }
  return null;
}

export function spokenDistance(m: number): string {
  if (m >= 1000) {
    const km = Math.round(m / 100) / 10;
    return `${km} kilometre${km === 1 ? '' : 's'}`;
  }
  const rounded = m >= 100 ? Math.round(m / 50) * 50 : Math.max(10, Math.round(m / 10) * 10);
  return `${rounded} metres`;
}

/** What the voice says for the upcoming step at a given distance. */
export function spokenInstruction(step: RouteStep, distance: number, lastThreshold: boolean): string {
  if (step.type === 'arrive') return lastThreshold ? 'You have arrived at your destination' : `In ${spokenDistance(distance)}, you will arrive`;
  const text = step.instruction.charAt(0).toLowerCase() + step.instruction.slice(1);
  return lastThreshold ? step.instruction : `In ${spokenDistance(distance)}, ${text}`;
}

export function formatEta(seconds: number): string {
  const mins = Math.max(1, Math.round(seconds / 60));
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}

export function arrivalClock(seconds: number, now = Date.now()): string {
  const d = new Date(now + seconds * 1000);
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}
