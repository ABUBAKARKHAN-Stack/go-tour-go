import { describe, expect, test } from 'bun:test';

import { buildRouteUrl, parseOsrmResponse } from './osrm';

const from = { latitude: 31.5204, longitude: 74.3587 };
const to = { latitude: 31.5881, longitude: 74.3107, id: 'x', name: 'Badshahi Mosque' };

describe('osrm', () => {
  test('builds lng,lat URL with geojson geometry', () => {
    const url = buildRouteUrl('driving', from, to);
    expect(url).toContain('/routed-car/route/v1/driving/74.358700,31.520400;74.310700,31.588100');
    expect(url).toContain('geometries=geojson');
  });

  test('parses a route', () => {
    const r = parseOsrmResponse(
      {
        code: 'Ok',
        routes: [
          {
            distance: 9800,
            duration: 1500,
            geometry: { coordinates: [[74.3587, 31.5204], [74.33, 31.55], [74.3107, 31.5881]] },
            legs: [
              {
                steps: [
                  { distance: 500, name: 'Mall Road', maneuver: { type: 'depart' } },
                  { distance: 9300, name: 'Circular Road', maneuver: { type: 'turn', modifier: 'left' } },
                  { distance: 0, name: '', maneuver: { type: 'arrive' } },
                ],
              },
            ],
          },
        ],
      },
      'driving',
      from,
      to,
      123,
    );
    expect(r.distance).toBe(9800);
    expect(r.coordinates).toHaveLength(3);
    expect(r.steps.map((s) => s.instruction)).toEqual([
      'Head out onto Mall Road',
      'Turn left onto Circular Road',
      'Arrive at your destination',
    ]);
    expect(r.createdAt).toBe(123);
  });

  test('walking duration has a realistic floor', () => {
    const r = parseOsrmResponse(
      { code: 'Ok', routes: [{ distance: 1330, duration: 60, geometry: { coordinates: [[0, 0], [0, 0.01]] } }] },
      'walking',
      from,
      to,
    );
    expect(Math.round(r.duration)).toBe(1000);
  });

  test('errors are user-facing', () => {
    expect(() => parseOsrmResponse({ code: 'NoRoute' }, 'driving', from, to)).toThrow('No road route');
    expect(() => parseOsrmResponse({ code: 'InvalidQuery' }, 'driving', from, to)).toThrow('Unable to calculate route');
  });
});
