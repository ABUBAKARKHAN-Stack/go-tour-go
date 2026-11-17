import { afterEach, describe, expect, test } from 'bun:test';

import { buildRouteUrl, RoutingUnavailable, type Route } from './osrm';
import { journeyParams, parseJourneyParams, placeOnly, readPlace } from './journey-params';
import { engines, getRoutes } from './routes';
import { avoidRing, buildValhallaRequest, decodePolyline6, parseValhallaResponse, stepForType, type ValhallaResponse } from './valhalla';

/** Polyline encoder (6 decimals) to build fixtures, the inverse of decodePolyline6. */
function encode6(coords: [number, number][]): string {
  let out = '';
  let pLat = 0;
  let pLng = 0;
  const num = (v: number) => {
    let n = v < 0 ? ~(v << 1) : v << 1;
    let s = '';
    while (n >= 0x20) {
      s += String.fromCharCode((0x20 | (n & 0x1f)) + 63);
      n >>= 5;
    }
    return s + String.fromCharCode(n + 63);
  };
  for (const [lng, lat] of coords) {
    const la = Math.round(lat * 1e6);
    const ln = Math.round(lng * 1e6);
    out += num(la - pLat) + num(ln - pLng);
    pLat = la;
    pLng = ln;
  }
  return out;
}

const from = { latitude: 31.5204, longitude: 74.3587 };
const to = { latitude: 31.5881, longitude: 74.3107, id: 'x', name: 'Badshahi Mosque' };

// A route: east 2 km, then north 1 km through a roundabout.
const main: [number, number][] = [
  [74.3587, 31.5204],
  [74.3687, 31.5204],
  [74.3787, 31.5204],
  [74.3787, 31.5254],
  [74.3787, 31.5294],
];
const other: [number, number][] = [
  [74.3587, 31.5204],
  [74.3587, 31.5304],
  [74.3787, 31.5294],
];

const response: ValhallaResponse = {
  trip: {
    status: 0,
    summary: { length: 3.0, time: 420 },
    legs: [
      {
        shape: encode6(main),
        maneuvers: [
          { type: 1, street_names: ['Mall Road'], length: 2.0, time: 240, begin_shape_index: 0 },
          { type: 26, roundabout_exit_count: 2, length: 0.1, time: 20, begin_shape_index: 2 },
          { type: 27, street_names: ['Circular Road'], length: 0.9, time: 160, begin_shape_index: 3 },
          { type: 4, length: 0, time: 0, begin_shape_index: 4 },
        ],
      },
    ],
  },
  alternates: [
    {
      trip: {
        summary: { length: 2.4, time: 500 },
        legs: [
          {
            shape: encode6(other),
            maneuvers: [
              { type: 1, street_names: ['Jail Road'], length: 1.1, time: 200, begin_shape_index: 0 },
              { type: 10, street_names: ['Canal Road'], length: 1.3, time: 300, begin_shape_index: 1 },
              { type: 5, length: 0, time: 0, begin_shape_index: 2 },
            ],
          },
        ],
      },
    },
  ],
};

describe('valhalla', () => {
  test('decodes polyline6 shapes', () => {
    const back = decodePolyline6(encode6(main));
    expect(back).toHaveLength(main.length);
    back.forEach(([lng, lat], i) => {
      expect(lng).toBeCloseTo(main[i][0], 6);
      expect(lat).toBeCloseTo(main[i][1], 6);
    });
  });

  test('request: costing, alternatives, heading and areas to avoid', () => {
    const req = buildValhallaRequest('walking', from, to, { heading: 370, alternatives: true, avoid: [{ ...from, radius: 300 }] }) as {
      costing: string;
      alternates?: number;
      locations: { heading?: number; heading_tolerance?: number }[];
      exclude_polygons?: [number, number][][];
    };
    expect(req.costing).toBe('pedestrian');
    expect(req.alternates).toBe(2);
    expect(req.locations[0].heading).toBe(10);
    expect(req.locations[0].heading_tolerance).toBe(45);
    expect(req.locations[1].heading).toBeUndefined();
    expect(req.exclude_polygons).toHaveLength(1);
    // Closed square around the hazard.
    const ring = req.exclude_polygons![0];
    expect(ring[0]).toEqual(ring[ring.length - 1]);
    expect(buildValhallaRequest('driving', from, to)).not.toHaveProperty('alternates');
  });

  test('avoid ring holds the whole circle', () => {
    const ring = avoidRing({ ...from, radius: 300 });
    const lats = ring.map((p) => p[1]);
    // Square half-side ≈ 300 m ≈ 0.0027° of latitude.
    expect(Math.max(...lats) - from.latitude).toBeGreaterThan(0.0026);
  });

  test('maps manoeuvre types to steps', () => {
    expect(stepForType(1)).toMatchObject({ type: 'depart' });
    expect(stepForType(15)).toMatchObject({ type: 'turn', modifier: 'left' });
    expect(stepForType(12)).toMatchObject({ type: 'turn', modifier: 'uturn' });
    expect(stepForType(23)).toMatchObject({ type: 'fork', modifier: 'slight right' });
    expect(stepForType(26, 3)).toMatchObject({ type: 'roundabout', exit: 3 });
    expect(stepForType(27)).toBeNull();
    expect(stepForType(8)).toMatchObject({ type: 'continue' });
  });

  test('parses the route and its alternatives', () => {
    const routes = parseValhallaResponse(response, 'driving', from, to);
    expect(routes).toHaveLength(2);
    const [r, alt] = routes;
    expect(r.engine).toBe('valhalla');
    expect(r.distance).toBe(3000);
    expect(r.duration).toBe(420);
    expect(r.coordinates).toHaveLength(main.length);
    // The roundabout exit folds into one step, named after the road it leads to.
    expect(r.steps.map((s) => s.type)).toEqual(['depart', 'roundabout', 'arrive']);
    expect(r.steps[1].distance).toBe(1000);
    expect(r.steps[1].name).toBe('Circular Road');
    expect(r.steps[1].instructionEn).toBe('At the roundabout, take exit 2 onto Circular Road');
    expect(r.steps[1].location?.[0]).toBeCloseTo(74.3787, 5);
    expect(alt.steps[1].instructionEn).toBe('Turn right onto Canal Road');
  });

  test('no road vs service trouble', () => {
    expect(() => parseValhallaResponse({ error_code: 442, error: 'No path could be found for input' }, 'driving', from, to)).toThrow(
      'No road route found to this place.',
    );
    expect(() => parseValhallaResponse({ error_code: 100 }, 'driving', from, to)).toThrow(RoutingUnavailable);
  });
});

describe('osrm options', () => {
  test('heading becomes a bearing on the start', () => {
    const url = buildRouteUrl('driving', from, to, { heading: -90, alternatives: true });
    expect(url).toContain('&alternatives=3');
    expect(url).toContain('&bearings=270,45;');
    expect(buildRouteUrl('driving', from, to)).not.toContain('bearings');
  });
});

describe('routing fallback', () => {
  const saved = { ...engines };
  afterEach(() => {
    engines.primary = saved.primary;
    engines.fallback = saved.fallback;
  });
  const fake = (name: string) => ({ name, coordinates: [] }) as unknown as Route;

  test('Valhalla first', async () => {
    engines.primary = async () => [fake('v')];
    engines.fallback = async () => [fake('o')];
    expect(((await getRoutes('driving', from, to))[0] as unknown as { name: string }).name).toBe('v');
  });

  test('OSRM when Valhalla is down', async () => {
    engines.primary = async () => {
      throw new RoutingUnavailable('down');
    };
    engines.fallback = async () => [fake('o')];
    expect(((await getRoutes('driving', from, to))[0] as unknown as { name: string }).name).toBe('o');
  });

  test('"no road" wins over "service down" when both fail', async () => {
    engines.primary = async () => {
      throw new Error('No road route found to this place.');
    };
    engines.fallback = async () => {
      throw new RoutingUnavailable('down');
    };
    await expect(getRoutes('driving', from, to)).rejects.toThrow('No road route found to this place.');
  });

  test('a cancelled request is not retried', async () => {
    let fellBack = false;
    engines.primary = async () => {
      const e = new Error('aborted');
      e.name = 'AbortError';
      throw e;
    };
    engines.fallback = async () => {
      fellBack = true;
      return [];
    };
    await expect(getRoutes('driving', from, to)).rejects.toThrow('aborted');
    expect(fellBack).toBe(false);
  });
});

describe('journey params', () => {
  const place = { id: 'p1', name: 'Lahore Fort', latitude: 31.588, longitude: 74.315, subtitle: 'Lahore' };
  const start = { id: 'p2', name: 'Data Darbar', latitude: 31.579, longitude: 74.305 };

  test('round-trips every pair of ends', () => {
    expect(parseJourneyParams(journeyParams('me', place))).toEqual({ from: 'me', to: place });
    expect(parseJourneyParams(journeyParams(place, 'me'))).toEqual({ from: place, to: 'me' });
    expect(parseJourneyParams(journeyParams(start, place))).toEqual({ from: start, to: place });
  });

  test('missing destination is not a journey', () => {
    expect(parseJourneyParams({})).toBeNull();
    expect(parseJourneyParams({ name: 'x', lat: 'abc', lng: '1' })).toBeNull();
  });

  test('a single end', () => {
    expect(readPlace(placeOnly(start, 'from'), 'from')).toEqual(start);
    expect(readPlace(placeOnly(start, 'from'), 'to')).toBeNull();
  });
});
