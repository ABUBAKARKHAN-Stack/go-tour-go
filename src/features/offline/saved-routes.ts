import { OfflineManager } from '@maplibre/maplibre-react-native';
import { router } from 'expo-router';

import { journeyStore, type JourneyTarget } from '@/features/journey/journey-store';
import { journeyParams } from '@/features/routing/journey-params';
import type { Route } from '@/features/routing/osrm';
import { env } from '@/lib/env';
import { storage, useStorage } from '@/lib/storage';

import { boundsContain, offlineMap } from './catalog';
import { installedMaps } from './downloads';
import { corridorBoxes } from './map-choice';

/**
 * "Save route offline": keeps the route itself (geometry, turn-by-turn steps)
 * and the other ways to go, so the journey can start, and switch route, with
 * no signal; and the map along them. Where a
 * downloaded map already covers the route nothing more is fetched; otherwise
 * a corridor of small tile packs (about 1 km either side) is stored by
 * MapLibre for the online style.
 */
export type SavedRoute = {
  id: string;
  target: JourneyTarget;
  route: Route;
  /** The other routes offered with it (older saves have none). */
  alternatives?: Route[];
  /** Where it starts when that is a place rather than "Your location". */
  origin?: JourneyTarget;
  savedAt: number;
  /** covered: a downloaded map covers it; packs: corridor packs; none: route only (saved offline). */
  map: 'covered' | 'packs' | 'none';
  packIds: string[];
  percent: number;
  error: string | null;
};

const KEY = 'gtg.offline.routes';
let limitSet = false;

export function useSavedRoutes() {
  return useStorage<SavedRoute[]>(KEY, []);
}

function list() {
  return storage.get<SavedRoute[]>(KEY, []);
}

function patch(id: string, p: Partial<SavedRoute>) {
  storage.set(
    KEY,
    list().map((r) => (r.id === id ? { ...r, ...p } : r)),
  );
}

/** Same destination and travel mode as an already saved route. */
export function findSaved(target: JourneyTarget, route: Route) {
  return list().find(
    (r) => r.route.mode === route.mode && Math.abs(r.target.latitude - target.latitude) < 1e-5 && Math.abs(r.target.longitude - target.longitude) < 1e-5,
  );
}

/** A route and, for alternatives, the stretch that differs (only that needs extra map). */
export type RouteToSave = { route: Route; segment?: [number, number][] };

/** True when every part of the route is inside an installed map file. */
export function routeCoveredByDownloads(route: Route) {
  const installed = installedMaps();
  if (installed.includes('pakistan')) return true;
  const regions = installed.filter((id) => id !== 'overview').map((id) => offlineMap(id).bounds);
  if (!regions.length) return false;
  const step = Math.max(1, Math.floor(route.coordinates.length / 60));
  for (let i = 0; i < route.coordinates.length; i += step) {
    const [longitude, latitude] = route.coordinates[i];
    if (!regions.some((b) => boundsContain(b, { latitude, longitude }))) return false;
  }
  return true;
}

export async function saveRouteOffline(
  target: JourneyTarget,
  route: Route,
  opts: { online: boolean; alternatives?: RouteToSave[]; origin?: JourneyTarget },
): Promise<SavedRoute> {
  const existing = findSaved(target, route);
  if (existing) await deleteSavedRoute(existing.id);
  const alternatives = opts.alternatives ?? [];
  const covered = [route, ...alternatives.map((a) => a.route)].every(routeCoveredByDownloads);
  const saved: SavedRoute = {
    id: `${Date.now()}`,
    target,
    route,
    alternatives: alternatives.map((a) => a.route),
    ...(opts.origin ? { origin: opts.origin } : {}),
    savedAt: Date.now(),
    map: covered ? 'covered' : opts.online ? 'packs' : 'none',
    packIds: [],
    percent: covered ? 100 : 0,
    error: null,
  };
  storage.set(KEY, [saved, ...list()]);
  // The map along the route, plus along the stretches where the alternatives differ.
  if (saved.map === 'packs') void downloadCorridor(saved, [saved.route.coordinates, ...alternatives.map((a) => a.segment ?? a.route.coordinates)]);
  return saved;
}

async function downloadCorridor(saved: SavedRoute, lines: [number, number][][]) {
  if (!limitSet) {
    OfflineManager.setTileCountLimit(50_000);
    limitSet = true;
  }
  const boxes = lines.filter((l) => l.length > 1).flatMap((l) => corridorBoxes(l));
  const maxZoom = saved.route.distance > 300_000 ? 13 : 14;
  const progress = new Map<string, number>();
  const ids: string[] = [];
  const report = () => {
    const total = boxes.length;
    const sum = [...progress.values()].reduce((a, b) => a + b, 0);
    patch(saved.id, { percent: Math.round(sum / total), packIds: ids });
  };
  try {
    for (const [i, bounds] of boxes.entries()) {
      const pack = await OfflineManager.createPack(
        { mapStyle: env.mapStyleUrl, bounds, minZoom: 10, maxZoom, metadata: { route: saved.id, part: i } },
        (p, status) => {
          progress.set(p.id, status.percentage);
          report();
        },
        (_p, error) => patch(saved.id, { error: error.message }),
      );
      ids.push(pack.id);
      report();
    }
  } catch (e) {
    patch(saved.id, { error: e instanceof Error ? e.message : String(e), packIds: ids });
  }
}

/** Continues corridor downloads that the app was closed during. */
export async function resumeSavedRouteDownloads() {
  const pending = list().filter((r) => r.map === 'packs' && r.percent < 100);
  if (!pending.length) return;
  const packs = await OfflineManager.getPacks().catch(() => []);
  for (const pack of packs) {
    if (!pending.some((r) => r.id === pack.metadata?.route)) continue;
    const status = await pack.status().catch(() => null);
    if (status && status.state !== 'complete') await pack.resume().catch(() => undefined);
  }
}

export async function deleteSavedRoute(id: string) {
  const saved = list().find((r) => r.id === id);
  storage.set(
    KEY,
    list().filter((r) => r.id !== id),
  );
  if (!saved?.packIds.length) return;
  for (const packId of saved.packIds) await OfflineManager.deletePack(packId).catch(() => undefined);
}

/** Opens the saved route in the journey preview; no route request is needed. */
export function openSavedRoute(saved: SavedRoute) {
  journeyStore.loadSaved(saved.target, saved.route, saved.alternatives ?? [], saved.origin);
  const end = (t: JourneyTarget) => ({ id: t.id ?? `pin:${t.latitude.toFixed(5)}, ${t.longitude.toFixed(5)}`, name: t.name, latitude: t.latitude, longitude: t.longitude, subtitle: t.subtitle });
  router.push({ pathname: '/journey', params: journeyParams(saved.origin ? end(saved.origin) : 'me', end(saved.target)) });
}
