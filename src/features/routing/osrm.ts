/**
 * Route calculation via the free FOSSGIS OSRM servers (OpenStreetMap data,
 * no API key). Fair-use only: one request per user action, never per GPS fix.
 */
import type { LatLng } from '@/lib/geo';
import { tx, txEn } from '@/lib/i18n';

export type TravelMode = 'driving' | 'cycling' | 'walking';

export type RouteStep = {
  /** In the app language. */
  instruction: string;
  /** English, for the voice when no voice exists for the app language. */
  instructionEn: string;
  distance: number; // metres travelled after this manoeuvre
  duration: number; // seconds
  type: string; // OSRM manoeuvre type: depart, turn, roundabout, arrive...
  modifier: string | null; // left, slight right, straight, uturn...
  name: string | null; // road name after the manoeuvre
  exit: number | null; // roundabout exit
  location: [number, number] | null; // [lng, lat] of the manoeuvre
};

export type Route = {
  mode: TravelMode;
  distance: number; // metres
  duration: number; // seconds
  /** [lng, lat] pairs (GeoJSON LineString coordinates). */
  coordinates: [number, number][];
  steps: RouteStep[];
  from: LatLng;
  to: LatLng & { id?: string; name?: string };
  createdAt: number;
};

const BASE: Record<TravelMode, string> = {
  driving: 'https://routing.openstreetmap.de/routed-car/route/v1/driving',
  cycling: 'https://routing.openstreetmap.de/routed-bike/route/v1/bike',
  walking: 'https://routing.openstreetmap.de/routed-foot/route/v1/foot',
};

export function buildRouteUrl(mode: TravelMode, from: LatLng, to: LatLng, alternatives = false) {
  const coords = `${from.longitude.toFixed(6)},${from.latitude.toFixed(6)};${to.longitude.toFixed(6)},${to.latitude.toFixed(6)}`;
  return `${BASE[mode]}/${coords}?overview=full&geometries=geojson&steps=true${alternatives ? '&alternatives=3' : ''}`;
}

type OsrmStep = {
  distance: number;
  duration?: number;
  name?: string;
  ref?: string;
  maneuver?: { type?: string; modifier?: string; exit?: number; location?: [number, number] };
};

type OsrmResponse = {
  code: string;
  message?: string;
  routes?: {
    distance: number;
    duration: number;
    geometry: { coordinates: [number, number][] };
    legs?: { steps?: OsrmStep[] }[];
  }[];
};

type Translate = (text: string, vars?: Record<string, string | number | null | undefined>) => string;

const MODIFIERS: Record<string, string> = {
  left: 'left',
  right: 'right',
  'slight left': 'slight left',
  'slight right': 'slight right',
  'sharp left': 'sharp left',
  'sharp right': 'sharp right',
};

/**
 * Human instruction for a step, e.g. "Turn right onto Shahrah-e-Faisal".
 * Whole-sentence templates so other languages can order words naturally.
 */
export function describeStep(s: Pick<RouteStep, 'type' | 'modifier' | 'name' | 'exit'>, t: Translate = tx): string {
  const type = s.type ?? '';
  const road = s.name ?? null;
  const dir = s.modifier && MODIFIERS[s.modifier] ? t(MODIFIERS[s.modifier]) : null;
  const pick = (plain: string, onto: string, vars: Record<string, string | number> = {}) =>
    road ? t(onto, { ...vars, road }) : t(plain, vars);
  switch (type) {
    case 'depart':
      return pick('Head out', 'Head out onto {road}');
    case 'arrive':
      return t('Arrive at your destination');
    case 'turn':
    case 'end of road':
      if (s.modifier === 'uturn') return pick('Make a U-turn', 'Make a U-turn onto {road}');
      if (!dir) return pick('Go straight', 'Go straight onto {road}');
      return pick('Turn {dir}', 'Turn {dir} onto {road}', { dir });
    case 'roundabout':
    case 'rotary':
    case 'roundabout turn':
      return s.exit
        ? pick('At the roundabout, take exit {exit}', 'At the roundabout, take exit {exit} onto {road}', { exit: s.exit })
        : pick('Take the roundabout', 'Take the roundabout onto {road}');
    case 'merge':
      return pick('Merge', 'Merge onto {road}');
    case 'on ramp':
      return pick('Take the ramp', 'Take the ramp onto {road}');
    case 'off ramp':
      return pick('Take the exit', 'Take the exit onto {road}');
    case 'fork':
      return dir ? pick('Keep {dir} at the fork', 'Keep {dir} at the fork onto {road}', { dir }) : pick('Keep ahead at the fork', 'Keep ahead at the fork onto {road}');
    default:
      return dir ? pick('Continue {dir}', 'Continue {dir} onto {road}', { dir }) : pick('Continue', 'Continue onto {road}');
  }
}

type OsrmRoute = NonNullable<OsrmResponse['routes']>[number];

function toRoute(r: OsrmRoute, mode: TravelMode, from: LatLng, to: Route['to'], now: number): Route {
  const steps: RouteStep[] = (r.legs ?? [])
    .flatMap((l) => l.steps ?? [])
    .filter((s) => s.distance > 0 || s.maneuver?.type === 'arrive')
    .map((s) => {
      const step = {
        type: s.maneuver?.type ?? 'continue',
        modifier: s.maneuver?.modifier ?? null,
        name: s.name || s.ref || null,
        exit: s.maneuver?.exit ?? null,
      };
      return {
        ...step,
        instruction: describeStep(step),
        instructionEn: describeStep(step, txEn),
        distance: s.distance,
        duration: s.duration ?? 0,
        location: s.maneuver?.location ?? null,
      };
    });
  return {
    mode,
    distance: r.distance,
    // Public foot/bike profiles can be optimistic; floor at 4.8 km/h walking, 15 km/h cycling.
    duration: mode === 'walking' ? Math.max(r.duration, r.distance / 1.33) : mode === 'cycling' ? Math.max(r.duration, r.distance / 4.2) : r.duration,
    coordinates: r.geometry.coordinates,
    steps,
    from,
    to,
    createdAt: now,
  };
}

function checkResponse(json: OsrmResponse) {
  if (json.code !== 'Ok' || !json.routes?.length) {
    if (json.code === 'NoRoute') throw new Error(tx('No road route found to this place.'));
    throw new Error(tx('Unable to calculate route.'));
  }
}

/** Pure parser (unit-tested). Throws a user-facing error on failure. */
export function parseOsrmResponse(
  json: OsrmResponse,
  mode: TravelMode,
  from: LatLng,
  to: Route['to'],
  now = Date.now(),
): Route {
  checkResponse(json);
  return toRoute(json.routes![0], mode, from, to, now);
}

/** All routes in a response (the best first, then alternatives). */
export function parseOsrmRoutes(json: OsrmResponse, mode: TravelMode, from: LatLng, to: Route['to'], now = Date.now()): Route[] {
  checkResponse(json);
  return json.routes!.map((r) => toRoute(r, mode, from, to, now));
}

async function requestOsrm(mode: TravelMode, from: LatLng, to: LatLng, alternatives: boolean, signal?: AbortSignal): Promise<OsrmResponse> {
  let res: Response;
  try {
    res = await fetch(buildRouteUrl(mode, from, to, alternatives), {
      signal,
      headers: { Accept: 'application/json', 'User-Agent': 'GoTourGo-FYP/1.0' },
    });
  } catch (error) {
    if ((error as Error)?.name === 'AbortError') throw error;
    throw new Error(tx('Unable to calculate route. Check your internet connection.'));
  }
  if (res.status === 429) throw new Error(tx('Routing service is busy. Try again shortly.'));
  if (!res.ok) throw new Error(tx('Unable to calculate route.'));
  return (await res.json()) as OsrmResponse;
}

export async function fetchRoute(mode: TravelMode, from: LatLng, to: Route['to'], signal?: AbortSignal): Promise<Route> {
  return parseOsrmResponse(await requestOsrm(mode, from, to, false, signal), mode, from, to);
}

/** The best route plus up to three alternatives (used to go around hazards). */
export async function fetchRoutes(mode: TravelMode, from: LatLng, to: Route['to'], signal?: AbortSignal): Promise<Route[]> {
  return parseOsrmRoutes(await requestOsrm(mode, from, to, true, signal), mode, from, to);
}

/** Hand-off for full turn-by-turn navigation. */
export function googleMapsDirectionsUrl(to: LatLng, mode: TravelMode) {
  const travel = mode === 'cycling' ? 'bicycling' : mode;
  return `https://www.google.com/maps/dir/?api=1&destination=${to.latitude},${to.longitude}&travelmode=${travel}`;
}
