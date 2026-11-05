import { describe, expect, test } from 'bun:test';

import { parseOsrmResponse, type Route } from '@/features/routing/osrm';
import { distanceMeters } from '@/lib/geo';

import { advance, crossedThreshold, formatEta, spokenDistance, spokenInstruction, stepStarts, voiceThresholds, type NavProgress } from './navigation';
import { hazardsAhead, journeyItems } from './journey-items';
import { buildRouteIndex, corridor, pointAlong, projectPoint, remainingLine } from './route-geometry';

// East along lat 24.85 for ~5 km, then north to 24.88 (~3.3 km). Karachi-ish.
const coords: [number, number][] = [];
for (let i = 0; i <= 50; i++) coords.push([67.0 + i * 0.001, 24.85]);
for (let i = 1; i <= 30; i++) coords.push([67.05, 24.85 + i * 0.001]);

const index = buildRouteIndex(coords);
const leg1 = index.cum[50];
const leg2 = index.total - leg1;

const route: Route = parseOsrmResponse(
  {
    code: 'Ok',
    routes: [
      {
        distance: index.total,
        duration: 900,
        geometry: { coordinates: coords },
        legs: [
          {
            steps: [
              { distance: leg1, duration: 550, name: 'Shahrah-e-Faisal', maneuver: { type: 'depart', location: coords[0] } },
              { distance: leg2, duration: 350, name: 'Korangi Road', maneuver: { type: 'turn', modifier: 'left', location: coords[50] } },
              { distance: 0, name: '', maneuver: { type: 'arrive', location: coords[80] } },
            ],
          },
        ],
      },
    ],
  },
  'driving',
  { latitude: 24.85, longitude: 67.0 },
  { latitude: 24.88, longitude: 67.05, name: 'Qayyumabad' },
);
const starts = stepStarts(route.steps);

const fix = (lat: number, lng: number, t: number, accuracy = 10) => ({ latitude: lat, longitude: lng, accuracy, timestamp: t });

describe('route geometry', () => {
  test('index measures the route', () => {
    expect(index.total).toBeGreaterThan(8000);
    expect(index.total).toBeLessThan(8600);
  });

  test('projects a point beside the route', () => {
    const p = projectPoint(index, { latitude: 24.8505, longitude: 67.02 });
    expect(Math.abs(p.offRoute - 55)).toBeLessThan(3);
    expect(Math.abs(p.along - index.cum[20])).toBeLessThan(2);
    expect(Math.round(p.bearing)).toBe(90);
  });

  test('corridor finds landmarks along the route in order, skips far ones', () => {
    const items = [
      { id: 'far', latitude: 24.9, longitude: 67.02, radius: 300 },
      { id: 'b', latitude: 24.87, longitude: 67.0505, radius: 300 },
      { id: 'a', latitude: 24.851, longitude: 67.01, radius: 300 },
      { id: 'near-off', latitude: 24.858, longitude: 67.03, radius: 200 },
    ];
    const hits = corridor(index, items, (i) => Math.max(i.radius, 1000));
    expect(hits.map((h) => h.item.id)).toEqual(['a', 'near-off', 'b']);
    expect(hits[0].offRoute).toBeLessThan(120);
    expect(hits[1].offRoute).toBeGreaterThan(800);
  });

  test('points along the route follow its direction', () => {
    const east = pointAlong(index, 1000);
    expect(east.latitude).toBeCloseTo(24.85, 6);
    expect(Math.round(east.bearing)).toBe(90);
    const north = pointAlong(index, index.cum[50] + 1000);
    expect(north.longitude).toBeCloseTo(67.05, 6);
    expect(Math.round(north.bearing)).toBe(0);
  });

  test('remaining line starts at the current position', () => {
    const line = remainingLine(index, index.cum[50] + 100);
    expect(line[0][0]).toBeCloseTo(67.05, 6);
    expect(line[0][1]).toBeGreaterThan(24.85);
    expect(line[line.length - 1]).toEqual(coords[80]);
  });
});

describe('navigation progress', () => {
  test('tracks distance to the next turn and time left', () => {
    const p = advance(route, index, starts, fix(24.8501, 67.03, 1), null);
    expect(p.stepIndex).toBe(0);
    expect(Math.abs(p.toManeuver - (leg1 - index.cum[30]))).toBeLessThan(5);
    expect(p.offRoute).toBe(false);
    expect(p.etaSeconds).toBeGreaterThan(0);
    expect(p.etaSeconds).toBeLessThan(900);
  });

  test('moves to the next step after the turn', () => {
    const p = advance(route, index, starts, fix(24.86, 67.0501, 1), null);
    expect(p.stepIndex).toBe(1);
    expect(route.steps[p.stepIndex].name).toBe('Korangi Road');
  });

  test('needs three fixes away before declaring off-route', () => {
    let p: NavProgress | null = advance(route, index, starts, fix(24.85, 67.02, 1), null);
    const away = [fix(24.8512, 67.022, 2), fix(24.8515, 67.023, 3), fix(24.852, 67.024, 4)];
    const flags: boolean[] = [];
    for (const f of away) {
      p = advance(route, index, starts, f, p);
      flags.push(p.offRoute);
    }
    expect(flags).toEqual([false, false, true]);
    p = advance(route, index, starts, fix(24.85, 67.025, 5), p);
    expect(p.offRoute).toBe(false);
  });

  test('a poor GPS fix does not count as off-route', () => {
    const p = advance(route, index, starts, fix(24.8505, 67.02, 1, 60), null);
    expect(p.offCount).toBe(0);
  });

  test('small backwards jitter does not move the position back', () => {
    const p1 = advance(route, index, starts, fix(24.85, 67.03, 1), null);
    const p2 = advance(route, index, starts, fix(24.85, 67.0299, 2), p1);
    expect(p2.along).toBe(p1.along);
  });

  test('arrives near the destination', () => {
    const p = advance(route, index, starts, fix(24.8798, 67.05, 9), null);
    expect(p.arrived).toBe(true);
    expect(p.offRoute).toBe(false);
    expect(distanceMeters({ latitude: 24.8798, longitude: 67.05 }, route.to)).toBeLessThan(35);
  });
});

describe('voice', () => {
  test('speaks once per threshold crossed', () => {
    const t = voiceThresholds('driving');
    expect(crossedThreshold(850, 790, t)).toBe(800);
    expect(crossedThreshold(790, 700, t)).toBeNull();
    expect(crossedThreshold(320, 55, t)).toBe(300);
    expect(crossedThreshold(null, 50, t)).toBeNull();
  });

  test('phrases', () => {
    expect(spokenDistance(1500)).toBe('1.5 kilometres');
    expect(spokenDistance(310)).toBe('300 metres');
    expect(spokenDistance(57)).toBe('60 metres');
    expect(spokenInstruction(route.steps[1], 300, false)).toBe('In 300 metres, turn left onto Korangi Road');
    expect(spokenInstruction(route.steps[1], 50, true)).toBe('Turn left onto Korangi Road');
    expect(spokenInstruction(route.steps[2], 10, true)).toBe('You have arrived at your destination');
    expect(formatEta(3720)).toBe('1 h 2 min');
    expect(formatEta(20)).toBe('1 min');
  });

  test('roundabout exits are described', () => {
    const r = parseOsrmResponse(
      { code: 'Ok', routes: [{ distance: 10, duration: 1, geometry: { coordinates: coords.slice(0, 2) }, legs: [{ steps: [{ distance: 10, name: 'Club Road', maneuver: { type: 'roundabout', exit: 2 } }] }] }] },
      'cycling',
      route.from,
      route.to,
    );
    expect(r.steps[0].instruction).toBe('At the roundabout, take exit 2 onto Club Road');
  });
});

describe('journey items', () => {
  const lm = (id: string, lat: number, lng: number, radius = 300) => ({
    id, name: id, shortDescription: '', category: 'historical' as const, latitude: lat, longitude: lng, radius,
  });
  const alert = (id: string, lat: number, lng: number, severity: 'low' | 'medium' | 'high' | 'critical', ends_at: string | null = null) => ({
    id, title: id, description: '', alert_type: 'flood' as const, severity, region: 'Sindh', city: 'Karachi',
    latitude: lat, longitude: lng, radius_m: 500, starts_at: '2026-01-01', ends_at, source: 'test',
  });

  test('lists landmarks and hazards in route order, skipping minor or expired alerts', () => {
    const items = journeyItems(
      index,
      [lm('frere', 24.851, 67.01), lm('far', 24.95, 67.0), lm('lake', 24.875, 67.06, 3000)],
      [alert('flood', 24.8502, 67.04, 'high'), alert('drizzle', 24.85, 67.02, 'low'), alert('old', 24.85, 67.03, 'critical', '2020-01-01')],
      Date.parse('2026-11-05'),
    );
    expect(items.map((i) => i.id)).toEqual(['frere', 'alert:flood', 'lake']);
    expect(items[1].kind).toBe('hazard');
  });
});

describe('hazards ahead', () => {
  const hz = (id: string, along: number, radius = 300) => ({
    kind: 'hazard' as const, id, name: id, detail: '', latitude: 0, longitude: 0, radius, along, offRoute: 0,
  });
  test('warns once, only when the hazard is coming up', () => {
    const items = [hz('a', 5000), hz('b', 1500), hz('behind', 200, 100)];
    expect(hazardsAhead(items, 1000, 2000, []).map((i) => i.id)).toEqual(['b']);
    expect(hazardsAhead(items, 3200, 2000, ['b']).map((i) => i.id)).toEqual(['a']);
    expect(hazardsAhead(items, 3200, 2000, ['a', 'b'])).toEqual([]);
  });
});
