import { distanceMeters } from '@/lib/geo';

import { boundsContain, OFFLINE_MAPS, offlineMap, type Bounds, type OfflineMapId } from './catalog';

const SEGMENT_M = 25_000;
const PAD_DEG = 0.012;

/**
 * Picks the style for the app's maps.
 * - Offline: always the downloaded maps when there are any, wherever the
 *   traveller is or looks (areas not downloaded show the overview, which is
 *   fetched with every city pack).
 * - Online with "use downloaded maps" on: the downloads when they cover the
 *   traveller, otherwise the online style.
 * - Otherwise the online style (which also shows MapLibre's cached tiles and
 *   saved route packs).
 */
export function chooseMapStyle(installed: OfflineMapId[], opts: { online: boolean; prefer: boolean; focus: { latitude: number; longitude: number } | null; glyphsReady: boolean }) {
  if (installed.length === 0 || (opts.online && !opts.prefer)) return null;
  // All of Pakistan contains every other file.
  const ids: OfflineMapId[] = installed.includes('pakistan') ? ['pakistan'] : OFFLINE_MAPS.map((m) => m.id).filter((id) => installed.includes(id));
  if (!opts.online) return ids;
  const covered =
    ids.includes('pakistan') || ids.includes('overview') || !opts.focus || ids.some((id) => boundsContain(offlineMap(id).bounds, opts.focus!));
  return covered ? ids : null;
}

/** Splits the route into ~25 km pieces and returns a padded box for each. */
export function corridorBoxes(coords: [number, number][]): Bounds[] {
  const boxes: Bounds[] = [];
  let start = 0;
  let run = 0;
  for (let i = 1; i < coords.length; i++) {
    run += distanceMeters({ latitude: coords[i - 1][1], longitude: coords[i - 1][0] }, { latitude: coords[i][1], longitude: coords[i][0] });
    if (run >= SEGMENT_M || i === coords.length - 1) {
      const part = coords.slice(start, i + 1);
      const lngs = part.map((c) => c[0]);
      const lats = part.map((c) => c[1]);
      boxes.push([Math.min(...lngs) - PAD_DEG, Math.min(...lats) - PAD_DEG, Math.max(...lngs) + PAD_DEG, Math.max(...lats) + PAD_DEG]);
      start = i;
      run = 0;
    }
  }
  return boxes;
}

