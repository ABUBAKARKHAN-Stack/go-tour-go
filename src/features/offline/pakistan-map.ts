import { Directory, File, Paths } from 'expo-file-system';

import { GLYPH_FONT } from './offline-style';

export { GLYPH_FONT, OFFLINE_LAYER_IDS, offlineBaseStyle, offlineStyle } from './offline-style';

/**
 * Offline map files built by .github/workflows/build-pakistan-map.yml from
 * OpenStreetMap and published on the repository's "pakistan-map" release.
 * The repository is public, so the files download without credentials.
 */
export const MAP_RELEASE_BASE = 'https://github.com/ABUBAKARKHAN-Stack/go-tour-go/releases/download/pakistan-map';

export type MapManifest = {
  version: number;
  builtAt: string;
  source: string;
  schema: string;
  maxzoom: number;
  files: Record<string, { bytes: number; sha256: string }>;
};

export const PAKISTAN_FILE = 'pakistan.pmtiles';
export const TEST_FILE = 'karachi-test.pmtiles';

export async function fetchMapManifest(): Promise<MapManifest> {
  const res = await fetch(`${MAP_RELEASE_BASE}/manifest.json`, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(res.status === 404 ? 'The offline map has not been published yet.' : `Map manifest unavailable (${res.status}).`);
  return (await res.json()) as MapManifest;
}

export function mapsDirectory() {
  const dir = new Directory(Paths.document, 'maps');
  if (!dir.exists) dir.create({ intermediates: true, idempotent: true });
  return dir;
}

export function localMapFile(name: string) {
  return new File(mapsDirectory(), name);
}

/** Label glyphs for the offline style: maps/glyphs/NotoSans/<range>.pbf. */
export function glyphsDirectory() {
  const dir = new Directory(mapsDirectory(), 'glyphs', GLYPH_FONT);
  if (!dir.exists) dir.create({ intermediates: true, idempotent: true });
  return dir;
}

/** MapLibre source URL for a PMTiles file, local (file://) or remote (https://). */
export function pmtilesUrl(location: string) {
  return `pmtiles://${location}`;
}

