/**
 * Turn-by-turn progress for an active journey. Pure (unit tested): given the
 * route, the previous progress and a new GPS fix it returns where the
 * traveller is, the next manoeuvre, time left, and whether they left the
 * route or arrived. Runs on every navigation fix, foreground or background.
 */
import { describeStep, type Route, type RouteStep, type TravelMode } from '@/features/routing/osrm';
import { hasArabicScript } from '@/features/data/search-text';
import { angleDiff, bearingTo } from '@/features/proximity/heading';
import { distanceMeters } from '@/lib/geo';

import { projectContinuing, projectEarliest, projectPoint, type RouteIndex } from './route-geometry';
import { tx, txEn } from '@/lib/i18n';

export type NavFix = {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  timestamp: number;
  /** GPS course over ground, degrees (-1 or null when unknown). */
  heading?: number | null;
  /** Metres per second (null when unknown). */
  speed?: number | null;
};

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
  /** Direction of the route where the traveller is. */
  bearing: number;
  /** Where to draw the traveller: on the route, or their real spot when off it or going the wrong way. */
  position: [number, number];
  /** Which way the traveller is really going (null before they have moved). */
  heading: number | null;
  /** Unsmoothed distance along the route (detects going backwards). */
  rawAlong: number;
  /** Furthest point reached along the route. */
  maxAlong: number;
  /** Last point a movement direction was measured from. */
  anchor: [number, number];
  /** Consecutive fixes going against / with the route. */
  wrongCount: number;
  rightCount: number;
  /** Travelling along the route in the wrong direction. */
  wrongWay: boolean;
  /** When the wrong-way stretch began (ms), or null. */
  wrongSince: number | null;
  offRouteMeters: number;
  /** Consecutive fixes beyond the off-route threshold. */
  offCount: number;
  offRoute: boolean;
  arrived: boolean;
  timestamp: number;
};

const OFF_ROUTE_FIXES = 3;
/** Fixes against the route before "wrong way" (or fewer once clearly behind). */
const WRONG_WAY_FIXES = 3;
const RIGHT_WAY_FIXES = 2;
/** Metres back from the furthest point reached that count as going backwards. */
const WRONG_WAY_BACK_M = 40;
/** Moving less than this between fixes gives no usable direction. */
const HEADING_MIN_MOVE_M = 8;
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

/** GPS heading is trustworthy above this speed (m/s): a brisk walk, or a slow vehicle. */
export function headingSpeed(mode: TravelMode) {
  return mode === 'walking' ? 0.8 : 1.5;
}

/**
 * Which way the traveller is going on this fix: the GPS course when moving
 * fast enough, else the direction from the last measured point once they
 * have moved a few metres, else null (standing still).
 */
export function movementHeading(fix: NavFix, anchor: [number, number] | null, mode: TravelMode): number | null {
  const course = fix.heading;
  if (course != null && Number.isFinite(course) && course >= 0 && (fix.speed ?? 0) >= headingSpeed(mode)) return course % 360;
  if (!anchor) return null;
  const from = { longitude: anchor[0], latitude: anchor[1] };
  if (distanceMeters(from, fix) < HEADING_MIN_MOVE_M) return null;
  return bearingTo(from, fix);
}

/** Has the wrong-way stretch gone on long enough to plan a new route from here? */
export function wrongWayNeedsReroute(p: NavProgress, now: number) {
  return p.wrongWay && ((p.wrongSince != null && now - p.wrongSince >= 15_000) || p.maxAlong - p.rawAlong >= 80);
}

export function advance(
  route: Route,
  index: RouteIndex,
  starts: number[],
  fix: NavFix,
  prev: NavProgress | null,
): NavProgress {
  // Following along: search just around the last position. First fix on a route: its
  // first close stretch (a later pass of a looping route can be nearer).
  // Following along: the stretch being driven, around the last position (a loop or the
  // other side of a divided road further on can pass nearer). First fix on a route:
  // its first close stretch.
  const near = offRouteThreshold(fix.accuracy);
  let proj = prev
    ? projectContinuing(index, fix, near, prev.segment, { from: prev.segment - WINDOW_BACK, to: prev.segment + WINDOW_AHEAD })
    : projectEarliest(index, fix, near);
  // Lost the thread (e.g. after a tunnel or a long gap): search everything.
  if (prev && proj.offRoute > 60) {
    const full = projectPoint(index, fix);
    if (full.offRoute < proj.offRoute) proj = full;
  }

  const threshold = offRouteThreshold(fix.accuracy);
  const isOff = proj.offRoute > threshold;
  const offCount = isOff ? (prev?.offCount ?? 0) + 1 : 0;
  const here: [number, number] = [fix.longitude, fix.latitude];

  // Direction of travel, and whether it goes with or against the route.
  const moved = movementHeading(fix, prev?.anchor ?? null, route.mode);
  const anchor = moved != null || !prev ? here : prev.anchor;
  const rawAlong = proj.along;
  const prevRaw = prev?.rawAlong ?? rawAlong;
  let wrongCount = 0;
  let rightCount = 0;
  let wrongWay = false;
  let maxAlong = Math.max(prev?.maxAlong ?? rawAlong, rawAlong);
  if (!isOff && prev) {
    const against = moved != null ? angleDiff(moved, proj.bearing) > 135 : rawAlong < prevRaw - HEADING_MIN_MOVE_M;
    const along = moved != null ? angleDiff(moved, proj.bearing) < 60 : rawAlong > prevRaw + HEADING_MIN_MOVE_M;
    // (Progress saved by an older version has no counters yet.)
    wrongCount = against ? (prev.wrongCount ?? 0) + 1 : along ? 0 : (prev.wrongCount ?? 0);
    rightCount = along ? (prev.rightCount ?? 0) + 1 : against ? 0 : (prev.rightCount ?? 0);
    if (prev.wrongWay) {
      wrongWay = rightCount < RIGHT_WAY_FIXES;
      // Turned round: start counting progress from here again.
      if (!wrongWay) maxAlong = rawAlong;
    } else {
      wrongWay = wrongCount >= WRONG_WAY_FIXES || (wrongCount >= 1 && maxAlong - rawAlong > WRONG_WAY_BACK_M);
    }
  }
  const wrongSince = wrongWay ? (prev?.wrongWay ? prev.wrongSince : fix.timestamp) : null;

  // Do not let jitter move the position backwards while going the right way on the route.
  const along =
    !isOff && !wrongWay && prev && rawAlong < prev.along && prev.along - rawAlong < 25 ? prev.along : rawAlong;
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

  // The arrow follows the road when going its way; otherwise it shows where the traveller really goes.
  const onRouteForward = !isOff && !wrongWay;
  const heading =
    moved != null
      ? onRouteForward && angleDiff(moved, proj.bearing) < 60
        ? proj.bearing
        : moved
      : (prev?.heading ?? null);

  return {
    along,
    remaining,
    etaSeconds: index.total > 0 ? Math.round(route.duration * (remaining / index.total)) : 0,
    stepIndex,
    toManeuver,
    segment: proj.segment,
    snapped: proj.point,
    bearing: proj.bearing,
    position: onRouteForward ? proj.point : here,
    heading,
    rawAlong,
    maxAlong,
    anchor,
    wrongCount,
    rightCount,
    wrongWay: wrongWay && !arrived,
    wrongSince,
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

/** A piece of a spoken instruction and the voice that says it. */
export type SpokenPart = { text: string; english: boolean };

const ROAD_MARK = '\u0001';

/**
 * The instruction as voice parts. The Urdu voice can't read road names in
 * English letters (most OpenStreetMap names), so in Urdu such a name is said
 * by the English voice, in its place: "[N-35] پر بائیں مڑیں".
 */
export function spokenParts(step: RouteStep, distance: number, lastThreshold: boolean, english = true): SpokenPart[] {
  if (english || !step.name || hasArabicScript(step.name)) {
    return [{ text: spokenInstruction(step, distance, lastThreshold, english), english }];
  }
  const marked = spokenInstruction({ ...step, instruction: describeStep({ ...step, name: ROAD_MARK }, tx) }, distance, lastThreshold, false);
  const parts: SpokenPart[] = [];
  marked.split(ROAD_MARK).forEach((piece, i) => {
    if (i > 0) parts.push({ text: step.name!, english: true });
    if (piece.trim()) parts.push({ text: piece.trim(), english: false });
  });
  return parts;
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
