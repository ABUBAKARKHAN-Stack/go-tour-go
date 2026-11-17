/**
 * Route calculation via the free FOSSGIS Valhalla server (OpenStreetMap data,
 * no API key). Valhalla gives alternative routes, starts a route in the
 * direction the traveller is heading (a proper U-turn instead of a route
 * "behind" them) and can route around an area (a hazard). Fair use: one
 * request per user action, never per GPS fix.
 *
 * Its manoeuvres are turned into the same steps as OSRM's, so instructions,
 * Urdu text, voice and icons work the same whichever service answered.
 */
import { SERVICES } from '@/constants/app.constants';
import { destinationPoint, type LatLng } from '@/lib/geo';
import { tx, txEn } from '@/lib/i18n';

import { describeStep, realisticDuration, RoutingUnavailable, type Route, type RouteOptions, type RouteStep, type TravelMode } from './osrm';

const COSTING: Record<TravelMode, string> = { driving: 'auto', cycling: 'bicycle', walking: 'pedestrian' };

export type ValhallaOptions = RouteOptions & {
  /** Areas to stay out of: a hazard's centre and radius in metres. */
  avoid?: (LatLng & { radius: number })[];
};

/** A square ring around a circle (Valhalla avoids roads crossing it). */
export function avoidRing(c: LatLng & { radius: number }): [number, number][] {
  const r = c.radius * Math.SQRT2; // corners of the square that holds the circle
  return [45, 135, 225, 315, 45].map((b) => {
    const p = destinationPoint(c, b, r);
    return [Number(p.longitude.toFixed(6)), Number(p.latitude.toFixed(6))];
  });
}

export function buildValhallaRequest(mode: TravelMode, from: LatLng, to: LatLng, opts: ValhallaOptions = {}) {
  const start: Record<string, number> = { lat: Number(from.latitude.toFixed(6)), lon: Number(from.longitude.toFixed(6)) };
  if (opts.heading != null && Number.isFinite(opts.heading)) {
    start.heading = Math.round(((opts.heading % 360) + 360) % 360);
    start.heading_tolerance = 45;
  }
  const body: Record<string, unknown> = {
    locations: [start, { lat: Number(to.latitude.toFixed(6)), lon: Number(to.longitude.toFixed(6)) }],
    costing: COSTING[mode],
    units: 'kilometers',
    directions_options: { units: 'kilometers', language: 'en-US' },
  };
  if (opts.alternatives) body.alternates = 2;
  if (opts.avoid?.length) body.exclude_polygons = opts.avoid.map(avoidRing);
  return body;
}

export function buildValhallaUrl(mode: TravelMode, from: LatLng, to: LatLng, opts: ValhallaOptions = {}) {
  return `${SERVICES.valhalla}?json=${encodeURIComponent(JSON.stringify(buildValhallaRequest(mode, from, to, opts)))}`;
}

/** Decodes an encoded polyline with 6 decimal places into [lng, lat] pairs. */
export function decodePolyline6(encoded: string): [number, number][] {
  const out: [number, number][] = [];
  let i = 0;
  let lat = 0;
  let lng = 0;
  const next = () => {
    let result = 0;
    let shift = 0;
    let b: number;
    do {
      b = encoded.charCodeAt(i++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    return result & 1 ? ~(result >> 1) : result >> 1;
  };
  while (i < encoded.length) {
    lat += next();
    lng += next();
    out.push([lng / 1e6, lat / 1e6]);
  }
  return out;
}

type ValhallaManeuver = {
  type: number;
  street_names?: string[];
  begin_street_names?: string[];
  length: number; // km
  time: number; // s
  begin_shape_index: number;
  roundabout_exit_count?: number;
};

type ValhallaTrip = {
  status?: number;
  summary?: { length: number; time: number };
  legs?: { shape: string; maneuvers?: ValhallaManeuver[] }[];
};

export type ValhallaResponse = {
  trip?: ValhallaTrip;
  alternates?: { trip?: ValhallaTrip }[];
  error_code?: number;
  error?: string;
  status_code?: number;
};

type StepShape = Pick<RouteStep, 'type' | 'modifier' | 'exit'>;

/** Valhalla manoeuvre type (see its API reference) → the OSRM-style step we use. */
export function stepForType(type: number, exitCount?: number): StepShape | null {
  const s = (t: string, modifier: string | null = null, exit: number | null = null): StepShape => ({ type: t, modifier, exit });
  switch (type) {
    case 1:
    case 2:
    case 3:
      return s('depart');
    case 4:
    case 5:
    case 6:
      return s('arrive');
    case 9:
      return s('turn', 'slight right');
    case 10:
      return s('turn', 'right');
    case 11:
      return s('turn', 'sharp right');
    case 12:
    case 13:
      return s('turn', 'uturn');
    case 14:
      return s('turn', 'sharp left');
    case 15:
      return s('turn', 'left');
    case 16:
      return s('turn', 'slight left');
    case 17:
      return s('on ramp', 'straight');
    case 18:
      return s('on ramp', 'slight right');
    case 19:
      return s('on ramp', 'slight left');
    case 20:
      return s('off ramp', 'slight right');
    case 21:
      return s('off ramp', 'slight left');
    case 22:
      return s('fork', 'straight');
    case 23:
      return s('fork', 'slight right');
    case 24:
      return s('fork', 'slight left');
    case 25:
      return s('merge', 'straight');
    case 37:
      return s('merge', 'slight right');
    case 38:
      return s('merge', 'slight left');
    case 26:
      return s('roundabout', null, exitCount && exitCount > 0 ? exitCount : null);
    case 27:
      return null; // leaving the roundabout: part of the roundabout step
    default:
      return s('continue', 'straight'); // becomes, continue, ferry, building...
  }
}

function tripToRoute(trip: ValhallaTrip, mode: TravelMode, from: LatLng, to: Route['to'], now: number): Route | null {
  const legs = trip.legs ?? [];
  const coordinates: [number, number][] = [];
  const steps: RouteStep[] = [];
  for (const leg of legs) {
    const shape = decodePolyline6(leg.shape ?? '');
    coordinates.push(...shape);
    for (const m of leg.maneuvers ?? []) {
      const shapeStep = stepForType(m.type, m.roundabout_exit_count);
      const distance = Math.round((m.length ?? 0) * 1000);
      const name = m.street_names?.[0] ?? m.begin_street_names?.[0] ?? null;
      const prev = steps[steps.length - 1];
      if (!shapeStep) {
        // Roundabout exit: one step "take exit N onto <road>", like OSRM.
        if (prev) {
          prev.distance += distance;
          prev.duration += m.time ?? 0;
          if (name && !prev.name) {
            prev.name = name;
            prev.instruction = describeStep(prev);
            prev.instructionEn = describeStep(prev, txEn);
          }
        }
        continue;
      }
      if (distance <= 0 && shapeStep.type !== 'arrive') continue;
      const step = { ...shapeStep, name };
      const at = shape[m.begin_shape_index] ?? null;
      steps.push({
        ...step,
        instruction: describeStep(step),
        instructionEn: describeStep(step, txEn),
        distance,
        duration: m.time ?? 0,
        location: at,
      });
    }
  }
  if (coordinates.length < 2) return null;
  const distance = Math.round((trip.summary?.length ?? 0) * 1000);
  return {
    mode,
    distance,
    duration: realisticDuration(mode, trip.summary?.time ?? 0, distance),
    coordinates,
    steps,
    from,
    to,
    createdAt: now,
    engine: 'valhalla',
  };
}

/** No road between the two places (as opposed to the service failing). */
const NO_ROUTE_CODES = new Set([170, 171, 442, 443]);

/** Pure parser (unit-tested): the best route first, then alternatives. */
export function parseValhallaResponse(json: ValhallaResponse, mode: TravelMode, from: LatLng, to: Route['to'], now = Date.now()): Route[] {
  if (json.error_code != null || !json.trip) {
    if (json.error_code != null && NO_ROUTE_CODES.has(json.error_code)) throw new Error(tx('No road route found to this place.'));
    throw new RoutingUnavailable(tx('Unable to calculate route.'));
  }
  const trips = [json.trip, ...(json.alternates ?? []).map((a) => a.trip).filter((t): t is ValhallaTrip => Boolean(t))];
  const routes = trips.map((t) => tripToRoute(t, mode, from, to, now)).filter((r): r is Route => Boolean(r));
  if (!routes.length) throw new RoutingUnavailable(tx('Unable to calculate route.'));
  return routes;
}

export async function fetchValhallaRoutes(
  mode: TravelMode,
  from: LatLng,
  to: Route['to'],
  opts: ValhallaOptions = {},
  signal?: AbortSignal,
): Promise<Route[]> {
  let res: Response;
  try {
    res = await fetch(buildValhallaUrl(mode, from, to, opts), {
      signal,
      headers: { Accept: 'application/json', 'User-Agent': 'GoTourGo-FYP/1.0' },
    });
  } catch (error) {
    if ((error as Error)?.name === 'AbortError') throw error;
    throw new RoutingUnavailable(tx('Unable to calculate route. Check your internet connection.'));
  }
  if (res.status === 429) throw new RoutingUnavailable(tx('Routing service is busy. Try again shortly.'));
  // Valhalla answers 400 with an error_code for "no route"; anything else 4xx/5xx is the service.
  if (!res.ok && res.status !== 400) throw new RoutingUnavailable(tx('Unable to calculate route.'));
  let json: ValhallaResponse;
  try {
    json = (await res.json()) as ValhallaResponse;
  } catch {
    throw new RoutingUnavailable(tx('Unable to calculate route.'));
  }
  return parseValhallaResponse(json, mode, from, to);
}
