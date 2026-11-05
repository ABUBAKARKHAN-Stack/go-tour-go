import { useMemo } from 'react';

import { useIsOnline } from '@/components/offline-banner';
import { useLastLocation } from '@/features/location/location-store';
import { env } from '@/lib/env';
import { language } from '@/lib/i18n';
import { storage, useStorage } from '@/lib/storage';

import { offlineMap, type OfflineMapId } from './catalog';
import { installedMaps, useOfflineDownloads } from './downloads';
import { chooseMapStyle } from './map-choice';
import { localMapFile, mapsDirectory, offlineStyle, pmtilesUrl } from './pakistan-map';

export const PREFER_DOWNLOADED_KEY = 'gtg.offline.preferDownloaded';

export function usePreferDownloadedMap() {
  return useStorage<boolean>(PREFER_DOWNLOADED_KEY, false);
}

export function useMapStyle(): string | object {
  const downloads = useOfflineDownloads();
  const online = useIsOnline();
  const [prefer] = usePreferDownloadedMap();
  const fix = useLastLocation();
  // Re-evaluate coverage only when the traveller moves to another ~10 km cell.
  const cell = fix ? `${Math.round(fix.latitude * 10)}:${Math.round(fix.longitude * 10)}` : '';
  const installed = installedMaps(downloads);
  const ids = chooseMapStyle(installed, {
    online,
    prefer,
    focus: cell && fix ? { latitude: fix.latitude, longitude: fix.longitude } : null,
    glyphsReady: downloads.glyphsReady,
  });
  const key = ids ? `${ids.join(',')}|${downloads.glyphsReady}` : '';

  return useMemo(() => {
    if (!key) return env.mapStyleUrl;
    const [list, glyphs] = key.split('|');
    const base = mapsDirectory().uri.replace(/\/?$/, '/');
    return offlineStyle({
      sources: list.split(',').map((id) => ({ id, url: pmtilesUrl(localMapFile(offlineMap(id as OfflineMapId).file).uri) })),
      glyphs: glyphs === 'true' ? `${base}glyphs/{fontstack}/{range}.pbf` : null,
      language,
    });
  }, [key]);
}

/** For non-React callers (tests, background). */
export function preferDownloadedMap() {
  return storage.get<boolean>(PREFER_DOWNLOADED_KEY, false);
}
