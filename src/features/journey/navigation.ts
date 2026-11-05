/**
 * Turn-by-turn progress for an active journey. Pure (unit tested): given the
 * route, the previous progress and a new GPS fix it returns where the
 * traveller is, the next manoeuvre, time left, and whether they left the
 * route or arrived. Runs on every navigation fix, foreground or background.
 */
import type { Route, RouteStep, TravelMode } from '@/features/routing/osrm';
import { distanceMeters } from '@/lib/geo';

import { projectPoint, type RouteIndex } from './route-geometry';
import { tx, txEn } from '@/lib/i18n';

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

type Translate = (text: string, vars?: Record<string, string | number | null | undefined>) => string;

export function spokenDistance(m: number, t: Translate = txEn): string {
  if (m >= 1000) {
    const km = Math.round(m / 100) / 10;
    return km === 1 ? t('1 kilometre') : t('{0} kilometres', { 0: km });
  }
  const rounded = m >= 100 ? Math.round(m / 50) * 50 : Math.max(10, Math.round(m / 10) * 10);
  return t('{0} metres', { 0: rounded });
}

/**
 * What the voice says for the upcoming step. `english` picks the English
 * wording (used when the phone has no voice for the app language).
 */
export function spokenInstruction(step: RouteStep, distance: number, lastThreshold: boolean, english = true): string {
  const t: Translate = english ? txEn : tx;
  const instruction = english ? step.instructionEn : step.instruction;
  if (step.type === 'arrive') {
    return lastThreshold ? t('You have arrived at your destination') : t('In {0}, you will arrive', { 0: spokenDistance(distance, t) });
  }
  if (lastThreshold) return instruction;
  const lowered = english ? instruction.charAt(0).toLowerCase() + instruction.slice(1) : instruction;
  return t('In {0}, {1}', { 0: spokenDistance(distance, t), 1: lowered });
}

export function formatEta(seconds: number): string {
  const mins = Math.max(1, Math.round(seconds / 60));
  if (mins < 60) return tx('{0} min', { 0: mins });
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? tx('{0} h {1} min', { 0: h, 1: m }) : tx('{0} h', { 0: h });
}

export function arrivalClock(seconds: number, now = Date.now()): string {
  const d = new Date(now + seconds * 1000);
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}
