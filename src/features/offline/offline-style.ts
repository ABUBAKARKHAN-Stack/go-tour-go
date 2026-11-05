/** Font stack name used in the offline style; glyph files live in maps/glyphs/<GLYPH_FONT>/. */
export const GLYPH_FONT = 'NotoSans';

type Layer = Record<string, unknown>;

/** Fill and line layers for one OpenMapTiles-schema source, ids prefixed with `prefix`. */
function baseLayers(source: string, prefix: string): Layer[] {
  return [
    { id: `${prefix}-landcover`, type: 'fill', source, 'source-layer': 'landcover', paint: { 'fill-color': '#DCE6D5', 'fill-opacity': 0.7 } },
    { id: `${prefix}-park`, type: 'fill', source, 'source-layer': 'park', paint: { 'fill-color': '#D4E6D8' } },
    { id: `${prefix}-water`, type: 'fill', source, 'source-layer': 'water', paint: { 'fill-color': '#BFDCE2' } },
    {
      id: `${prefix}-building`,
      type: 'fill',
      source,
      'source-layer': 'building',
      minzoom: 13,
      paint: { 'fill-color': '#E6DCCB', 'fill-outline-color': '#D9CCB8' },
    },
    {
      id: `${prefix}-road-minor`,
      type: 'line',
      source,
      'source-layer': 'transportation',
      filter: ['in', ['get', 'class'], ['literal', ['minor', 'service', 'tertiary', 'track']]],
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': '#FFFFFF', 'line-width': ['interpolate', ['linear'], ['zoom'], 12, 0.5, 16, 6] },
    },
    {
      id: `${prefix}-road-major`,
      type: 'line',
      source,
      'source-layer': 'transportation',
      filter: ['in', ['get', 'class'], ['literal', ['motorway', 'trunk', 'primary', 'secondary']]],
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': '#F2D7A6', 'line-width': ['interpolate', ['linear'], ['zoom'], 6, 0.6, 16, 9] },
    },
    {
      id: `${prefix}-boundary`,
      type: 'line',
      source,
      'source-layer': 'boundary',
      filter: ['<=', ['get', 'admin_level'], 4],
      paint: { 'line-color': '#B5A58E', 'line-dasharray': [3, 2], 'line-width': 1 },
    },
  ];
}

/** Place, water and road names; Urdu names when the app is in Urdu. */
function labelLayers(source: string, prefix: string, language: 'en' | 'ur'): Layer[] {
  const name =
    language === 'ur'
      ? ['coalesce', ['get', 'name:ur'], ['get', 'name']]
      : ['coalesce', ['get', 'name:en'], ['get', 'name:latin'], ['get', 'name']];
  const text = { 'text-field': name, 'text-font': [GLYPH_FONT], 'text-max-width': 8 };
  const halo = { 'text-color': '#3C3A35', 'text-halo-color': '#FBF8F3', 'text-halo-width': 1.4 };
  return [
    {
      id: `${prefix}-label-road`,
      type: 'symbol',
      source,
      'source-layer': 'transportation_name',
      minzoom: 13,
      filter: ['in', ['get', 'class'], ['literal', ['motorway', 'trunk', 'primary', 'secondary', 'tertiary']]],
      layout: { ...text, 'symbol-placement': 'line', 'text-size': 11 },
      paint: { ...halo, 'text-color': '#6B6459' },
    },
    {
      id: `${prefix}-label-water`,
      type: 'symbol',
      source,
      'source-layer': 'water_name',
      minzoom: 9,
      layout: { ...text, 'text-size': 12 },
      paint: { ...halo, 'text-color': '#3E7C8A' },
    },
    {
      id: `${prefix}-label-place-minor`,
      type: 'symbol',
      source,
      'source-layer': 'place',
      minzoom: 11,
      filter: ['in', ['get', 'class'], ['literal', ['village', 'suburb', 'neighbourhood', 'quarter']]],
      layout: { ...text, 'text-size': 12 },
      paint: halo,
    },
    {
      id: `${prefix}-label-place-major`,
      type: 'symbol',
      source,
      'source-layer': 'place',
      minzoom: 4,
      filter: ['in', ['get', 'class'], ['literal', ['city', 'town']]],
      layout: { ...text, 'text-size': ['interpolate', ['linear'], ['zoom'], 5, 11, 12, 17] },
      paint: { ...halo, 'text-color': '#1C1A17' },
    },
  ];
}

/**
 * Self-contained style for OpenMapTiles-schema PMTiles files in the redesign
 * palette. Several files (an overview plus city packs) are drawn in order.
 * With `glyphs` (a file:// URL template to the downloaded fonts) it also
 * shows place, water and road names; without, it needs nothing but the files.
 */
export function offlineStyle(opts: { sources: { id: string; url: string }[]; glyphs?: string | null; language?: 'en' | 'ur' }) {
  const single = opts.sources.length === 1;
  const prefix = (id: string) => (single ? 'omt' : `omt-${id}`);
  const sources = Object.fromEntries(opts.sources.map((s) => [s.id, { type: 'vector', url: s.url }]));
  const layers: Layer[] = [
    { id: 'omt-background', type: 'background', paint: { 'background-color': '#F3EDE4' } },
    ...opts.sources.flatMap((s) => baseLayers(s.id, prefix(s.id))),
    ...(opts.glyphs ? opts.sources.flatMap((s) => labelLayers(s.id, prefix(s.id), opts.language ?? 'en')) : []),
  ];
  return { version: 8, name: 'GoTourGo offline', ...(opts.glyphs ? { glyphs: opts.glyphs } : {}), sources, layers };
}

/** Style for one file without labels (the map engine test). */
export function offlineBaseStyle(sourceUrl: string) {
  return offlineStyle({ sources: [{ id: 'openmaptiles', url: sourceUrl }] });
}

export const OFFLINE_LAYER_IDS = ['omt-water', 'omt-park', 'omt-landcover', 'omt-building', 'omt-road-minor', 'omt-road-major'];
