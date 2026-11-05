import { describe, expect, test } from 'bun:test';

import { boundsContain, OFFLINE_MAPS, offlineMap } from './catalog';
import { chooseMapStyle, corridorBoxes } from './map-choice';
import { offlineStyle } from './offline-style';

const KARACHI = { latitude: 24.86, longitude: 67.03 };
const LAHORE = { latitude: 31.55, longitude: 74.34 };
const opts = (o: Partial<Parameters<typeof chooseMapStyle>[1]>) => ({ online: false, prefer: false, focus: KARACHI, glyphsReady: true, ...o });

describe('catalog', () => {
  test('regions sit inside Pakistan and contain their city', () => {
    const pk = offlineMap('pakistan').bounds;
    for (const m of OFFLINE_MAPS) {
      expect(m.bounds[0]).toBeGreaterThanOrEqual(pk[0]);
      expect(m.bounds[2]).toBeLessThanOrEqual(pk[2]);
    }
    expect(boundsContain(offlineMap('karachi').bounds, KARACHI)).toBe(true);
    expect(boundsContain(offlineMap('lahore').bounds, LAHORE)).toBe(true);
    expect(boundsContain(offlineMap('islamabad').bounds, { latitude: 33.907, longitude: 73.393 })).toBe(true); // Murree
    expect(boundsContain(offlineMap('northern').bounds, { latitude: 36.32, longitude: 74.66 })).toBe(true); // Karimabad, Hunza
  });
});

describe('chooseMapStyle', () => {
  test('online style while online, unless downloads are preferred', () => {
    expect(chooseMapStyle(['karachi'], opts({ online: true }))).toBeNull();
    expect(chooseMapStyle(['karachi'], opts({ online: true, prefer: true }))).toEqual(['karachi']);
  });
  test('offline: always the downloads, wherever the traveller is', () => {
    expect(chooseMapStyle([], opts({}))).toBeNull();
    expect(chooseMapStyle(['karachi'], opts({}))).toEqual(['karachi']);
    // Seen on a phone: Lahore downloaded, traveller in Karachi, map moved to Lahore offline.
    expect(chooseMapStyle(['lahore'], opts({ focus: KARACHI }))).toEqual(['lahore']);
    expect(chooseMapStyle(['overview', 'karachi'], opts({ focus: LAHORE }))).toEqual(['overview', 'karachi']);
  });
  test('online + prefer downloads: only where they cover the traveller', () => {
    expect(chooseMapStyle(['lahore'], opts({ online: true, prefer: true, focus: KARACHI }))).toBeNull();
    expect(chooseMapStyle(['lahore'], opts({ online: true, prefer: true, focus: LAHORE }))).toEqual(['lahore']);
  });
  test('all of Pakistan replaces the other files', () => {
    expect(chooseMapStyle(['karachi', 'pakistan', 'overview'], opts({ focus: LAHORE }))).toEqual(['pakistan']);
  });
});

describe('corridorBoxes', () => {
  test('splits a long route into padded ~25 km boxes', () => {
    // Straight line north from Karachi, about 111 km.
    const coords: [number, number][] = Array.from({ length: 101 }, (_, i) => [67.0, 24.8 + i * 0.01]);
    const boxes = corridorBoxes(coords);
    expect(boxes.length).toBeGreaterThanOrEqual(4);
    expect(boxes.length).toBeLessThanOrEqual(5);
    for (const [w, s, e, n] of boxes) {
      expect(e - w).toBeCloseTo(0.024, 3);
      expect(n - s).toBeLessThan(0.3);
    }
    expect(boxes[0][1]).toBeLessThan(24.8);
    expect(boxes[boxes.length - 1][3]).toBeGreaterThan(25.8);
  });
  test('a short route is one box', () => {
    expect(corridorBoxes([[67.0, 24.8], [67.01, 24.81]])).toHaveLength(1);
  });
});

describe('offlineStyle', () => {
  test('one source keeps the omt- ids the engine test queries', () => {
    const style = offlineStyle({ sources: [{ id: 'openmaptiles', url: 'pmtiles://x' }] });
    const ids = style.layers.map((l) => l.id);
    expect(ids).toContain('omt-water');
    expect(ids.some((id) => String(id).includes('label'))).toBe(false);
    expect('glyphs' in style).toBe(false);
  });
  test('several sources with labels in the chosen language', () => {
    const style = offlineStyle({
      sources: [
        { id: 'overview', url: 'pmtiles://a' },
        { id: 'karachi', url: 'pmtiles://b' },
      ],
      glyphs: 'file:///maps/glyphs/{fontstack}/{range}.pbf',
      language: 'ur',
    });
    expect(Object.keys(style.sources)).toEqual(['overview', 'karachi']);
    const ids = style.layers.map((l) => String(l.id));
    expect(ids).toContain('omt-overview-water');
    expect(ids).toContain('omt-karachi-label-place-major');
    // Labels are drawn above every fill and line layer.
    const firstLabel = ids.findIndex((id) => id.includes('label'));
    expect(ids.slice(firstLabel).every((id) => id.includes('label'))).toBe(true);
    const place = style.layers.find((l) => l.id === 'omt-karachi-label-place-major') as { layout: { 'text-field': unknown[] } };
    expect(JSON.stringify(place.layout['text-field'])).toContain('name:ur');
  });
});
