/**
 * Route calculation via the free FOSSGIS OSRM servers (OpenStreetMap data,
 * no API key). Fair-use only: one request per user action, never per GPS fix.
 */
import type { LatLng } from '@/lib/geo';

export type TravelMode = 'driving' | 'walking';

export type Route = {
  mode: TravelMode;
  distance: number; // metres
  duration: number; // seconds
  /** [lng, lat] pairs (GeoJSON LineString coordinates). */
  coordinates: [number, number][];
  steps: { instruction: string; distance: number }[];
  from: LatLng;
  to: LatLng & { id?: string; name?: string };
  createdAt: number;
};

const BASE: Record<TravelMode, string> = {
  driving: 'https://routing.openstreetmap.de/routed-car/route/v1/driving',
  walking: 'https://routing.openstreetmap.de/routed-foot/route/v1/foot',
};

export function buildRouteUrl(mode: TravelMode, from: LatLng, to: LatLng) {
  const coords = `${from.longitude.toFixed(6)},${from.latitude.toFixed(6)};${to.longitude.toFixed(6)},${to.latitude.toFixed(6)}`;
  return `${BASE[mode]}/${coords}?overview=full&geometries=geojson&steps=true`;
}

type OsrmStep = {
  distance: number;
  name?: string;
  maneuver?: { type?: string; modifier?: string };
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

function describeStep(s: OsrmStep): string {
  const type = s.maneuver?.type ?? '';
  const mod = s.maneuver?.modifier ? ` ${s.maneuver.modifier}` : '';
  const road = s.name ? ` onto ${s.name}` : '';
  switch (type) {
    case 'depart':
      return `Head out${road}`;
    case 'arrive':
      return 'Arrive at your destination';
    case 'turn':
    case 'end of road':
      return `Turn${mod}${road}`;
    case 'roundabout':
    case 'rotary':
      return `Take the roundabout${road}`;
    case 'merge':
    case 'on ramp':
    case 'off ramp':
    case 'fork':
      return `Keep${mod}${road}`;
    default:
      return `Continue${mod}${road}`;
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
  if (json.code !== 'Ok' || !json.routes?.length) {
    if (json.code === 'NoRoute') throw new Error('No road route found to this place.');
    throw new Error('Unable to calculate route.');
  }
  const r = json.routes[0];
  const steps = (r.legs ?? [])
    .flatMap((l) => l.steps ?? [])
    .filter((s) => s.distance > 0 || s.maneuver?.type === 'arrive')
    .map((s) => ({ instruction: describeStep(s), distance: s.distance }));
  return {
    mode,
    distance: r.distance,
    // The public foot profile is sometimes slow to estimate; use 4.8 km/h as a floor.
    duration: mode === 'walking' ? Math.max(r.duration, r.distance / 1.33) : r.duration,
    coordinates: r.geometry.coordinates,
    steps,
    from,
    to,
    createdAt: now,
  };
}

export async function fetchRoute(mode: TravelMode, from: LatLng, to: Route['to'], signal?: AbortSignal): Promise<Route> {
  let res: Response;
  try {
    res = await fetch(buildRouteUrl(mode, from, to), {
      signal,
      headers: { Accept: 'application/json', 'User-Agent': 'GoTourGo-FYP/1.0' },
    });
  } catch (error) {
    if ((error as Error)?.name === 'AbortError') throw error;
    throw new Error('Unable to calculate route. Check your internet connection.');
  }
  if (res.status === 429) throw new Error('Routing service is busy. Try again shortly.');
  if (!res.ok) throw new Error('Unable to calculate route.');
  return parseOsrmResponse((await res.json()) as OsrmResponse, mode, from, to);
}

/** Hand-off for full turn-by-turn navigation. */
export function googleMapsDirectionsUrl(to: LatLng, mode: TravelMode) {
  return `https://www.google.com/maps/dir/?api=1&destination=${to.latitude},${to.longitude}&travelmode=${mode}`;
}
