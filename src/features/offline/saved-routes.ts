import { OfflineManager } from '@maplibre/maplibre-react-native';
import { router } from 'expo-router';

import { journeyStore, type JourneyTarget } from '@/features/journey/journey-store';
import type { Route } from '@/features/routing/osrm';
import { env } from '@/lib/env';
import { storage, useStorage } from '@/lib/storage';

import { boundsContain, offlineMap } from './catalog';
import { installedMaps } from './downloads';
import { corridorBoxes } from './map-choice';

/**
 * "Save route offline": keeps the route itself (geometry, turn-by-turn steps)
 * so the journey can start with no signal, and the map along it. Where a
 * downloaded map already covers the route nothing more is fetched; otherwise
 * a corridor of small tile packs (about 1 km either side) is stored by
 * MapLibre for the online style.
 */
export type SavedRoute = {
  id: string;
  target: JourneyTarget;
  route: Route;
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

export async function saveRouteOffline(target: JourneyTarget, route: Route, opts: { online: boolean }): Promise<SavedRoute> {
  const existing = findSaved(target, route);
  if (existing) await deleteSavedRoute(existing.id);
  const covered = routeCoveredByDownloads(route);
  const saved: SavedRoute = {
    id: `${Date.now()}`,
    target,
    route,
    savedAt: Date.now(),
    map: covered ? 'covered' : opts.online ? 'packs' : 'none',
    packIds: [],
    percent: covered ? 100 : 0,
    error: null,
  };
  storage.set(KEY, [saved, ...list()]);
  if (saved.map === 'packs') void downloadCorridor(saved);
  return saved;
}

async function downloadCorridor(saved: SavedRoute) {
  if (!limitSet) {
    OfflineManager.setTileCountLimit(50_000);
    limitSet = true;
  }
  const boxes = corridorBoxes(saved.route.coordinates);
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
  journeyStore.loadSaved(saved.target, saved.route);
  router.push({
    pathname: '/journey',
    params: {
      name: saved.target.name,
      lat: String(saved.target.latitude),
      lng: String(saved.target.longitude),
      ...(saved.target.id ? { id: saved.target.id } : {}),
      ...(saved.target.subtitle ? { subtitle: saved.target.subtitle } : {}),
    },
  });
}
