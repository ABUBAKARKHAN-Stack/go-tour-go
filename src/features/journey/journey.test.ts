import { describe, expect, test } from 'bun:test';

import { parseOsrmResponse, type Route } from '@/features/routing/osrm';
import { distanceMeters } from '@/lib/geo';

import { alternativesAhead, compareRoute, pickAlternatives, stillTakeable, takeableAlternatives } from './alternatives';
import { clusterPins, metersPerPixel } from './journey-clusters';
import { viaRoad } from './route-names';
import { advance, crossedThreshold, formatEta, movementHeading, spokenDistance, spokenInstruction, spokenParts, stepStarts, voiceThresholds, wrongWayNeedsReroute, type NavFix, type NavProgress } from './navigation';
import * as journeyItemsModule from './journey-items';
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
    // English wording: one part, English voice.
    expect(spokenParts(route.steps[1], 50, true)).toEqual([{ text: 'Turn left onto Korangi Road', english: true }]);
    // App-language voice (tests run with English text): the road name in English letters is its own English part.
    expect(spokenParts(route.steps[1], 50, true, false)).toEqual([
      { text: 'Turn left onto', english: false },
      { text: 'Korangi Road', english: true },
    ]);
    expect(spokenParts(route.steps[1], 300, false, false).map((p) => p.english)).toEqual([false, true]);
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

describe('route around a hazard', () => {
  const { routeAvoiding, hazardCore, HAZARD_CORE_M } = journeyItemsModule;
  test('picks the first route that stays clear', () => {
    const through = { id: 'through', coordinates: coords };
    const around = { id: 'around', coordinates: [[67.0, 24.85], [67.0, 24.9], [67.05, 24.9], [67.05, 24.88]] as [number, number][] };
    const hazard = { latitude: 24.8502, longitude: 67.04, radius: 300 };
    expect(routeAvoiding([through, around], hazard)?.id).toBe('around');
    expect(routeAvoiding([through], hazard)).toBeNull();
  });

  test('a wide warning area only has to be missed at its blocked spot', () => {
    // Fog or snow is reported over tens of kilometres; the detour only needs to miss the core.
    const around = { id: 'around', coordinates: [[67.0, 24.85], [67.0, 24.9], [67.05, 24.9], [67.05, 24.88]] as [number, number][] };
    const fog = { latitude: 24.8502, longitude: 67.04, radius: 30_000 };
    expect(routeAvoiding([around], fog)?.id).toBe('around');
    expect(hazardCore(30_000)).toBe(HAZARD_CORE_M);
    expect(hazardCore(120)).toBe(120);
  });
});

describe('direction of travel', () => {
  const at = (lng: number, t: number, heading: number | null, speed: number | null): NavFix => ({
    latitude: 24.85,
    longitude: lng,
    accuracy: 8,
    timestamp: t * 1000,
    heading,
    speed,
  });
  const drive = (fixes: NavFix[], start: NavProgress | null = null) => {
    let p = start;
    const out: NavProgress[] = [];
    for (const f of fixes) {
      p = advance(route, index, starts, f, p);
      out.push(p);
    }
    return out;
  };

  test('heading: GPS course when moving, else from movement, else unknown', () => {
    expect(movementHeading(at(67.02, 1, 95, 10), null, 'driving')).toBe(95);
    // Too slow for the GPS course: measured from the last point once 8 m away.
    expect(movementHeading(at(67.021, 1, 95, 0.5), [67.02, 24.85], 'driving')).toBeCloseTo(90, 0);
    expect(movementHeading(at(67.02002, 1, -1, 0), [67.02, 24.85], 'driving')).toBeNull();
  });

  test('going the right way: no warning, arrow along the road', () => {
    const ps = drive([at(67.02, 1, 90, 12), at(67.0212, 2, 91, 12), at(67.0224, 3, 89, 12), at(67.0236, 4, 90, 12)]);
    expect(ps.some((p) => p.wrongWay)).toBe(false);
    expect(ps[3].heading).toBeCloseTo(90, 0);
  });

  test('turning round on the route: "wrong way", arrow turns, distance grows', () => {
    const forward = drive([at(67.02, 1, 90, 12), at(67.0212, 2, 90, 12), at(67.0224, 3, 90, 12)]);
    // 20 m steps back the way they came.
    const back = drive([at(67.0222, 4, 270, 12), at(67.022, 5, 270, 12), at(67.0218, 6, 270, 12)], forward[2]);
    expect(back[0].wrongWay).toBe(false);
    expect(back[2].wrongWay).toBe(true);
    expect(back[2].heading).toBeCloseTo(270, 0);
    expect(back[2].remaining).toBeGreaterThan(forward[2].remaining + 50);
    // The arrow is drawn where the traveller is.
    expect(back[2].position[0]).toBeCloseTo(67.0218, 5);
    // A new route once it goes on for 15 s, or 80 m back.
    expect(wrongWayNeedsReroute(back[2], back[2].wrongSince! + 1000)).toBe(false);
    expect(wrongWayNeedsReroute(back[2], back[2].wrongSince! + 15_000)).toBe(true);
    const further = drive([at(67.0212, 7, 270, 12)], back[2]);
    expect(wrongWayNeedsReroute(further[0], further[0].wrongSince! + 1000)).toBe(true);

    // Turning back the right way clears it after two fixes.
    const again = drive([at(67.022, 7, 90, 12), at(67.0222, 8, 90, 12)], back[2]);
    expect(again[0].wrongWay).toBe(true);
    expect(again[1].wrongWay).toBe(false);
  });

  test('a sudden big step back counts at once', () => {
    const forward = drive([at(67.02, 1, 90, 12), at(67.0212, 2, 90, 12), at(67.0224, 3, 90, 12)]);
    const back = drive([at(67.0212, 4, 270, 12)], forward[2]);
    expect(back[0].wrongWay).toBe(true);
  });

  test('going backwards without a GPS course is still noticed', () => {
    const forward = drive([at(67.02, 1, null, null), at(67.021, 2, null, null), at(67.022, 3, null, null)]);
    const back = drive([at(67.021, 4, null, null), at(67.020, 5, null, null), at(67.019, 6, null, null)], forward[2]);
    expect(forward.some((p) => p.wrongWay)).toBe(false);
    expect(back[2].wrongWay).toBe(true);
  });

  test('GPS jitter while stopped is never "wrong way"', () => {
    const fixes = [67.02, 67.02003, 67.01998, 67.02002, 67.01997, 67.02001].map((lng, i) => at(lng, i + 1, i % 2 ? 270 : 90, 0.2));
    expect(drive(fixes).some((p) => p.wrongWay)).toBe(false);
  });
});

describe('alternative routes', () => {
  // Leaves the main route at vertex 20, runs 300 m north of it, rejoins at vertex 40.
  const altCoords: [number, number][] = [
    ...coords.slice(0, 21),
    ...Array.from({ length: 19 }, (_, i) => [67.0 + (21 + i) * 0.001, 24.853] as [number, number]),
    ...coords.slice(40),
  ];
  const altRoute: Route = { ...route, coordinates: altCoords, duration: route.duration + 240, createdAt: 2 };

  test('finds where it splits off and labels the different part', () => {
    const c = compareRoute(index, altRoute)!;
    expect(c).not.toBeNull();
    expect(Math.abs(c.splitAlong - index.cum[20])).toBeLessThan(120);
    expect(c.label[1]).toBeCloseTo(24.853, 5);
    // Only the different stretch is drawn: it starts and ends on the main road, near the split and the rejoin.
    const [startLng] = c.segment[0];
    const [endLng, endLat] = c.segment[c.segment.length - 1];
    expect(startLng).toBeGreaterThan(67.015);
    expect(startLng).toBeLessThanOrEqual(67.021);
    expect(endLat).toBeCloseTo(24.85, 5);
    expect(endLng).toBeLessThan(67.046);
    expect(c.segment.length).toBeLessThan(altCoords.length - 20);
  });

  test('the same road twice is not an alternative', () => {
    expect(compareRoute(index, { ...route, createdAt: 3 })).toBeNull();
    expect(pickAlternatives(route, index, [route, { ...route, createdAt: 3 }, altRoute])).toHaveLength(1);
  });

  test('takeable only while you are on it, before its turn-off', () => {
    const [alt] = pickAlternatives(route, index, [altRoute]);
    // On the shared road before the turn-off: can switch.
    expect(stillTakeable(alt, { latitude: 24.85, longitude: 67.01 }, index.cum[10])).toBe(true);
    // Took the other road (north of the main route): the main road is no longer this alternative's.
    expect(stillTakeable(alt, { latitude: 24.85, longitude: 67.03 }, index.cum[30])).toBe(false);
    // On the alternative's own road: it is the one you are on.
    expect(stillTakeable(alt, { latitude: 24.853, longitude: 67.03 }, index.cum[20])).toBe(true);
    // Unchanged list keeps its identity (no re-render).
    const list = [alt];
    expect(takeableAlternatives(list, { latitude: 24.85, longitude: 67.01 }, index.cum[10])).toBe(list);
    expect(takeableAlternatives(list, { latitude: 24.85, longitude: 67.03 }, index.cum[30])).toHaveLength(0);
  });

  test('mid-journey alternatives compare with the time left', () => {
    const [alt] = pickAlternatives(route, index, [altRoute], 300);
    expect(alt.delta).toBe(altRoute.duration - 300);
  });

  test('time difference, and gone once its turn-off is behind', () => {
    const [alt] = pickAlternatives(route, index, [altRoute]);
    expect(alt.delta).toBe(240);
    // Same road, same id: taps and labels stay attached to the right route.
    expect(pickAlternatives(route, index, [{ ...altRoute, createdAt: 9 }])[0].id).toBe(alt.id);
    expect(alternativesAhead([alt], index.cum[10])).toHaveLength(1);
    expect(alternativesAhead([alt], index.cum[30])).toHaveLength(0);
  });
});

describe('via road', () => {
  const main = [
    { name: 'کورنگی روڈ', distance: 2000 },
    { name: 'Korangi Road', distance: 900 },
    { name: 'Shahrah-e-Faisal', distance: 200 },
  ];
  test('prefers a road named in the app language when it is a sizeable part', () => {
    expect(viaRoad(main)).toBe('Korangi Road');
    expect(viaRoad(main, { urdu: true })).toBe('کورنگی روڈ');
    expect(viaRoad([{ name: 'کورنگی روڈ', distance: 2000 }, { name: 'Lane 4', distance: 100 }])).toBe('کورنگی روڈ');
  });
  test('an alternative is named after the road that sets it apart', () => {
    const alt = [
      { name: 'کورنگی روڈ', distance: 2000 },
      { name: 'Shahrah-e-Quaideen', distance: 800 },
    ];
    expect(viaRoad(alt, { exclude: main })).toBe('Shahrah-e-Quaideen');
    expect(viaRoad(main, { exclude: main })).toBe('Korangi Road');
    expect(viaRoad([])).toBeNull();
  });
});

describe('landmark pin groups', () => {
  const at = (id: string, lat: number, lng: number) => ({ id, latitude: lat, longitude: lng });
  // Three landmarks ~100 m apart, one 5 km away.
  const pins = [at('a', 24.85, 67.0), at('b', 24.85, 67.001), at('c', 24.85, 67.002), at('d', 24.85, 67.05)];

  test('zoomed out, close landmarks share one pin; far ones stay apart', () => {
    const groups = clusterPins(pins, 12);
    expect(groups.map((g) => g.members.map((m) => m.id))).toEqual([['a', 'b', 'c'], ['d']]);
    expect(groups[0].lead.id).toBe('a');
    expect(groups[0].longitude).toBeCloseTo(67.001, 5);
  });

  test('zoomed in, every landmark has its own pin', () => {
    expect(clusterPins(pins, 17)).toHaveLength(4);
  });

  test('metres per pixel halves with each zoom level', () => {
    expect(metersPerPixel(10, 0) / metersPerPixel(11, 0)).toBeCloseTo(2, 6);
    expect(metersPerPixel(0, 0)).toBeCloseTo(78271.5, 0);
  });
});
