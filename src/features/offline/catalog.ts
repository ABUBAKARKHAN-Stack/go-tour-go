import type { LatLng } from '@/lib/geo';
import { tx } from '@/lib/i18n';

/** [west, south, east, north] in degrees. */
export type Bounds = [number, number, number, number];

export type OfflineMapId = 'pakistan' | 'overview' | 'karachi' | 'lahore' | 'islamabad' | 'northern';

export type OfflineMap = {
  id: OfflineMapId;
  /** File name on the "pakistan-map" release (see scripts/build-pakistan-map.sh). */
  file: string;
  kind: 'country' | 'overview' | 'region';
  name: string;
  description: string;
  bounds: Bounds;
  maxzoom: number;
};

const PAKISTAN_BOUNDS: Bounds = [60.8, 23.6, 77.9, 37.1];

/** Region bounds must match REGIONS in scripts/build-pakistan-map.sh. */
export const OFFLINE_MAPS: OfflineMap[] = [
  {
    id: 'pakistan',
    file: 'pakistan.pmtiles',
    kind: 'country',
    name: tx('All of Pakistan'),
    description: tx('Every city, road and village at street level. Includes all the packs below.'),
    bounds: PAKISTAN_BOUNDS,
    maxzoom: 14,
  },
  {
    id: 'overview',
    file: 'pakistan-overview.pmtiles',
    kind: 'overview',
    name: tx('Pakistan overview'),
    description: tx('Cities, motorways and main roads for the whole country. Small and quick to download.'),
    bounds: PAKISTAN_BOUNDS,
    maxzoom: 8,
  },
  {
    id: 'karachi',
    file: 'region-karachi.pmtiles',
    kind: 'region',
    name: tx('Karachi'),
    description: tx('Clifton, Saddar, Malir, Port Qasim and Hub'),
    bounds: [66.65, 24.7, 67.6, 25.2],
    maxzoom: 14,
  },
  {
    id: 'lahore',
    file: 'region-lahore.pmtiles',
    kind: 'region',
    name: tx('Lahore'),
    description: tx('Walled City, Gulberg, DHA and the Wagah road'),
    bounds: [74.05, 31.25, 74.6, 31.75],
    maxzoom: 14,
  },
  {
    id: 'islamabad',
    file: 'region-islamabad.pmtiles',
    kind: 'region',
    name: tx('Islamabad and Rawalpindi'),
    description: tx('Both cities, the Margalla Hills and Murree'),
    bounds: [72.75, 33.4, 73.5, 34.0],
    maxzoom: 14,
  },
  {
    id: 'northern',
    file: 'region-northern.pmtiles',
    kind: 'region',
    name: tx('Northern Areas'),
    description: tx('Gilgit-Baltistan, Hunza, Skardu, Swat, Chitral and Naran'),
    bounds: [71.2, 34.5, 77.9, 37.1],
    maxzoom: 14,
  },
];

export function offlineMap(id: OfflineMapId): OfflineMap {
  return OFFLINE_MAPS.find((m) => m.id === id)!;
}

export function boundsContain(b: Bounds, p: LatLng) {
  return p.longitude >= b[0] && p.longitude <= b[2] && p.latitude >= b[1] && p.latitude <= b[3];
}

/** Glyph ranges published with the maps (Noto Sans, Latin and Arabic script). */
export const GLYPH_RANGES = [
  '0-255',
  '256-511',
  '512-767',
  '768-1023',
  '1536-1791',
  '1792-2047',
  '2048-2303',
  '8192-8447',
  '64256-64511',
  '64512-64767',
  '64768-65023',
  '65024-65279',
];

export const glyphFile = (range: string) => `glyphs-noto-sans-${range}.pbf`;
