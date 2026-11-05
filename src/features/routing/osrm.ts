/**
 * Route calculation via the free FOSSGIS OSRM servers (OpenStreetMap data,
 * no API key). Fair-use only: one request per user action, never per GPS fix.
 */
import type { LatLng } from '@/lib/geo';

export type TravelMode = 'driving' | 'cycling' | 'walking';

export type RouteStep = {
  instruction: string;
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

export function buildRouteUrl(mode: TravelMode, from: LatLng, to: LatLng) {
  const coords = `${from.longitude.toFixed(6)},${from.latitude.toFixed(6)};${to.longitude.toFixed(6)},${to.latitude.toFixed(6)}`;
  return `${BASE[mode]}/${coords}?overview=full&geometries=geojson&steps=true`;
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

function ordinal(n: number) {
  const suffix = n % 10 === 1 && n % 100 !== 11 ? 'st' : n % 10 === 2 && n % 100 !== 12 ? 'nd' : n % 10 === 3 && n % 100 !== 13 ? 'rd' : 'th';
  return `${n}${suffix}`;
}

/** Human instruction for a step, e.g. "Turn right onto Shahrah-e-Faisal". */
export function describeStep(s: Pick<RouteStep, 'type' | 'modifier' | 'name' | 'exit'>): string {
  const type = s.type ?? '';
  const mod = s.modifier && s.modifier !== 'straight' ? ` ${s.modifier}` : '';
  const road = s.name ? ` onto ${s.name}` : '';
  switch (type) {
    case 'depart':
      return `Head out${road}`;
    case 'arrive':
      return 'Arrive at your destination';
    case 'turn':
    case 'end of road':
      if (s.modifier === 'uturn') return `Make a U-turn${road}`;
      if (s.modifier === 'straight') return `Go straight${road}`;
      return `Turn${mod}${road}`;
    case 'roundabout':
    case 'rotary':
    case 'roundabout turn':
      return s.exit ? `At the roundabout, take the ${ordinal(s.exit)} exit${road}` : `Take the roundabout${road}`;
    case 'merge':
      return `Merge${mod}${road}`;
    case 'on ramp':
      return `Take the ramp${mod}${road}`;
    case 'off ramp':
      return `Take the exit${mod}${road}`;
    case 'fork':
      return `Keep${mod || ' ahead'} at the fork${road}`;
    default:
      return mod ? `Continue${mod}${road}` : `Continue${road}`;
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
  const travel = mode === 'cycling' ? 'bicycling' : mode;
  return `https://www.google.com/maps/dir/?api=1&destination=${to.latitude},${to.longitude}&travelmode=${travel}`;
}
