import { describe, expect, test } from 'bun:test';

import { angleDiff, bearingTo, hazardsAheadOfFix, preferAhead, refreshRadius } from './heading';

const here = { latitude: 31.5, longitude: 74.3 };
const north = { latitude: 31.51, longitude: 74.3 };
const south = { latitude: 31.49, longitude: 74.3 };
const east = { latitude: 31.5, longitude: 74.31 };

describe('bearings', () => {
  test('compass directions', () => {
    expect(Math.round(bearingTo(here, north))).toBe(0);
    expect(Math.round(bearingTo(here, east))).toBe(90);
    expect(Math.round(bearingTo(here, south))).toBe(180);
    expect(angleDiff(350, 10)).toBe(20);
    expect(angleDiff(90, 270)).toBe(180);
  });
});

describe('preferAhead', () => {
  const pos: Record<string, { latitude: number; longitude: number }> = { behind: south, ahead: north, side: east };
  const hits = [
    { id: 'behind', distance: 100 },
    { id: 'side', distance: 150 },
    { id: 'ahead', distance: 300 },
  ];
  test('heading north puts the landmark ahead first', () => {
    const fix = { ...here, heading: 0, speed: 5 };
    expect(preferAhead(hits, fix, (id) => pos[id]).map((h) => h.id)).toEqual(['ahead', 'behind', 'side']);
  });
  test('standing still keeps nearest-first order', () => {
    const fix = { ...here, heading: 0, speed: 0 };
    expect(preferAhead(hits, fix, (id) => pos[id]).map((h) => h.id)).toEqual(['behind', 'side', 'ahead']);
  });
});

describe('hazards ahead while exploring', () => {
  const hazards = [
    { id: 'n', latitude: 31.51, longitude: 74.3, radius: 200 }, // ~1.1 km north
    { id: 's', latitude: 31.49, longitude: 74.3, radius: 200 }, // behind
    { id: 'far', latitude: 31.55, longitude: 74.3, radius: 200 }, // ~5.5 km
    { id: 'inside', latitude: 31.5005, longitude: 74.3, radius: 300 }, // already inside
  ];
  test('only hazards ahead within range, once', () => {
    const fix = { ...here, heading: 5, speed: 12 };
    expect(hazardsAheadOfFix(fix, hazards, new Set()).map((h) => h.id)).toEqual(['n']);
    expect(hazardsAheadOfFix(fix, hazards, new Set(['n']))).toEqual([]);
  });
  test('nothing when not moving or heading unknown', () => {
    expect(hazardsAheadOfFix({ ...here, heading: 0, speed: 0 }, hazards, new Set())).toEqual([]);
    expect(hazardsAheadOfFix({ ...here, heading: null, speed: 10 }, hazards, new Set())).toEqual([]);
  });
});

describe('refresh geofence', () => {
  test('sits inside the registered ring, within limits', () => {
    expect(refreshRadius(here, [north, east])).toBeGreaterThanOrEqual(2000);
    const far = [{ latitude: 32.5, longitude: 74.3 }];
    expect(refreshRadius(here, far)).toBe(30_000);
    expect(refreshRadius(here, [])).toBe(5000);
  });
});
