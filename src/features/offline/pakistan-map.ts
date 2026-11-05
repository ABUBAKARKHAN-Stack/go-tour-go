import { Directory, File, Paths } from 'expo-file-system';

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

/** MapLibre source URL for a PMTiles file, local (file://) or remote (https://). */
export function pmtilesUrl(location: string) {
  return `pmtiles://${location}`;
}

/**
 * Self-contained style for OpenMapTiles-schema vector tiles in the redesign
 * palette. It has no labels, so it needs no glyph server and renders fully
 * offline. Layer ids are prefixed "omt-" so callers can query them.
 */
export function offlineBaseStyle(sourceUrl: string) {
  return {
    version: 8,
    name: 'GoTourGo offline',
    sources: { openmaptiles: { type: 'vector', url: sourceUrl } },
    layers: [
      { id: 'omt-background', type: 'background', paint: { 'background-color': '#F3EDE4' } },
      {
        id: 'omt-landcover',
        type: 'fill',
        source: 'openmaptiles',
        'source-layer': 'landcover',
        paint: { 'fill-color': '#DCE6D5', 'fill-opacity': 0.7 },
      },
      {
        id: 'omt-park',
        type: 'fill',
        source: 'openmaptiles',
        'source-layer': 'park',
        paint: { 'fill-color': '#D4E6D8' },
      },
      {
        id: 'omt-water',
        type: 'fill',
        source: 'openmaptiles',
        'source-layer': 'water',
        paint: { 'fill-color': '#BFDCE2' },
      },
      {
        id: 'omt-building',
        type: 'fill',
        source: 'openmaptiles',
        'source-layer': 'building',
        minzoom: 13,
        paint: { 'fill-color': '#E6DCCB', 'fill-outline-color': '#D9CCB8' },
      },
      {
        id: 'omt-road-minor',
        type: 'line',
        source: 'openmaptiles',
        'source-layer': 'transportation',
        filter: ['in', ['get', 'class'], ['literal', ['minor', 'service', 'tertiary', 'track']]],
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': '#FFFFFF', 'line-width': ['interpolate', ['linear'], ['zoom'], 12, 0.5, 16, 6] },
      },
      {
        id: 'omt-road-major',
        type: 'line',
        source: 'openmaptiles',
        'source-layer': 'transportation',
        filter: ['in', ['get', 'class'], ['literal', ['motorway', 'trunk', 'primary', 'secondary']]],
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': '#F2D7A6', 'line-width': ['interpolate', ['linear'], ['zoom'], 6, 0.6, 16, 9] },
      },
      {
        id: 'omt-boundary',
        type: 'line',
        source: 'openmaptiles',
        'source-layer': 'boundary',
        filter: ['<=', ['get', 'admin_level'], 4],
        paint: { 'line-color': '#B5A58E', 'line-dasharray': [3, 2], 'line-width': 1 },
      },
    ],
  };
}

export const OFFLINE_LAYER_IDS = ['omt-water', 'omt-park', 'omt-landcover', 'omt-building', 'omt-road-minor', 'omt-road-major'];
