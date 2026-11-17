/**
 * Routes for the app: Valhalla first (alternatives, direction-aware, can go
 * around hazards), the FOSSGIS OSRM server when Valhalla is down, busy or
 * finds nothing. Both are free, keyless public services.
 */
import type { LatLng } from '@/lib/geo';

import { fetchOsrmRoutes, RoutingUnavailable, type Route, type TravelMode } from './osrm';
import { fetchValhallaRoutes, type ValhallaOptions } from './valhalla';

export type RouteRequest = ValhallaOptions & { signal?: AbortSignal };

type Fetcher = (mode: TravelMode, from: LatLng, to: Route['to'], opts: ValhallaOptions, signal?: AbortSignal) => Promise<Route[]>;

/** The engines in order (swappable in tests). */
export const engines: { primary: Fetcher; fallback: Fetcher } = {
  primary: fetchValhallaRoutes,
  fallback: (mode, from, to, opts, signal) => fetchOsrmRoutes(mode, from, to, opts, signal),
};

function isAbort(e: unknown) {
  return (e as Error)?.name === 'AbortError';
}

/** The best route first, then alternatives (when asked and found). */
export async function getRoutes(mode: TravelMode, from: LatLng, to: Route['to'], req: RouteRequest = {}): Promise<Route[]> {
  const { signal, ...opts } = req;
  let first: unknown;
  try {
    return await engines.primary(mode, from, to, opts, signal);
  } catch (e) {
    if (isAbort(e)) throw e;
    first = e;
  }
  try {
    return await engines.fallback(mode, from, to, opts, signal);
  } catch (e) {
    if (isAbort(e)) throw e;
    // "No road" from either service says more than "service unavailable".
    if (!(e instanceof RoutingUnavailable)) throw e;
    throw first instanceof Error ? first : e;
  }
}

/** Just the best route. */
export async function getRoute(mode: TravelMode, from: LatLng, to: Route['to'], req: RouteRequest = {}): Promise<Route> {
  return (await getRoutes(mode, from, to, { ...req, alternatives: false }))[0];
}
