import { describe, expect, mock, test } from 'bun:test';

// The store's device modules, replaced so its logic can run here.
mock.module('expo-speech', () => ({ speak: () => undefined, stop: () => undefined, getAvailableVoicesAsync: async () => [] }));
mock.module('@/lib/storage', () => {
  const mem = new Map<string, unknown>();
  return {
    StorageKeys: { activeJourney: 'journey' },
    storage: { get: (k: string, d: unknown) => (mem.has(k) ? mem.get(k) : d), set: (k: string, v: unknown) => mem.set(k, v), remove: (k: string) => mem.delete(k), invalidate: () => undefined },
  };
});
mock.module('@/features/notifications/local-notifications', () => ({ CHANNELS: { alerts: 'alerts' }, notifyNow: async () => undefined }));
mock.module('@/features/alerts/hazard-card-store', () => ({ hazardCard: { show: () => undefined } }));
mock.module('@/features/routing/routes', () => ({ getRoutes: async () => { throw new Error('offline'); } }));

const { journeyStore, routeIndex } = await import('./journey-store');
const { remainingLine } = await import('./route-geometry');

const mk = (coords: [number, number][], duration: number) => ({
  mode: 'driving' as const,
  distance: 0,
  duration,
  coordinates: coords,
  steps: [],
  from: { latitude: coords[0][1], longitude: coords[0][0] },
  to: { latitude: 24.85, longitude: 67.05, name: 'End' },
  createdAt: 1,
});
// A: straight east along 24.85. B: same start, leaves at 67.02 going north 400 m, east, and back down to A at 67.04.
const A: [number, number][] = Array.from({ length: 51 }, (_, i) => [67.0 + i * 0.001, 24.85]);
const B: [number, number][] = [
  ...A.slice(0, 21),
  [67.02, 24.852], [67.02, 24.854],
  ...Array.from({ length: 19 }, (_, i) => [67.021 + i * 0.001, 24.854] as [number, number]),
  [67.04, 24.852],
  ...A.slice(40),
];
const fixAt = (lng: number, lat: number, t: number) => ({ latitude: lat, longitude: lng, accuracy: 8, timestamp: t * 1000, heading: null, speed: null });

describe('switching route while navigating', () => {
  test('the map gets the new route and its remaining part starts where you are', () => {
    journeyStore.loadSaved({ latitude: 24.85, longitude: 67.05, name: 'End' }, { driving: [mk(A, 600), mk(B, 700)] }, 'driving');
    journeyStore.start();
    let t = 1;
    for (const lng of [67.0, 67.005, 67.01, 67.015]) journeyStore.onFix(fixAt(lng, 24.85, t++));
    const s1 = journeyStore.get();
    expect(s1.alternatives).toHaveLength(1);
    expect(journeyStore.selectRoute(s1.alternatives[0])).toBe('switched');

    // Drive the new road: up and along it.
    for (const [lng, lat] of [[67.018, 24.85], [67.02, 24.851], [67.02, 24.853], [67.022, 24.854], [67.025, 24.854]] as [number, number][]) {
      journeyStore.onFix(fixAt(lng, lat, t++));
    }
    const s = journeyStore.get();
    expect(s.route?.coordinates).toBe(B);
    // The route left behind is not drawn any more once you're on the other road.
    expect(s.alternatives).toHaveLength(0);
    expect(s.progress?.offRoute).toBe(false);
    // What the map draws in blue starts at the car.
    const line = remainingLine(routeIndex()!, s.progress!.along);
    expect(line[0][0]).toBeCloseTo(67.025, 3);
    expect(line[0][1]).toBeCloseTo(24.854, 3);
  });
});

describe('placing you on a route that passes the same spot twice', () => {
  test('after a switch you are put on the first pass, not a later one nearby', () => {
    // C: east along 24.85 to 67.02, up and round a loop, then back west 10 m north of the start
    // (the other side of a divided road),
    // past 67.012 again before heading off south-east. D: same start, different road later.
    const C: [number, number][] = [
      ...Array.from({ length: 21 }, (_, i) => [67.0 + i * 0.001, 24.85] as [number, number]),
      [67.021, 24.851], [67.021, 24.8525],
      ...Array.from({ length: 13 }, (_, i) => [67.02 - i * 0.001, 24.85009] as [number, number]),
      [67.008, 24.849], [67.01, 24.845], [67.03, 24.84],
    ];
    const D: [number, number][] = [...C.slice(0, 15), [67.015, 24.86], [67.03, 24.87]];
    journeyStore.stop();
    journeyStore.loadSaved({ latitude: 24.84, longitude: 67.03, name: 'End' }, { driving: [mk(D, 600), mk(C, 700)] }, 'driving');
    journeyStore.start();
    let t = 100;
    for (const lng of [67.0, 67.004, 67.008, 67.011]) journeyStore.onFix(fixAt(lng, 24.85, t++));
    const alt = journeyStore.get().alternatives.find((a) => a.route.coordinates === C)!;
    expect(alt).toBeDefined();
    expect(journeyStore.selectRoute(alt)).toBe('switched');
    // GPS a few metres off, a little nearer the far side of the road.
    journeyStore.onFix(fixAt(67.012, 24.85006, t++));
    const p = journeyStore.get().progress!;
    // About 1.2 km in (the first pass), not ~3 km (the way back past the same spot).
    expect(p.along).toBeLessThan(1400);
    expect(p.along).toBeGreaterThan(1000);
  });
});

describe('following a route that comes back past itself', () => {
  test('stays on the stretch being driven, then picks up the way back', async () => {
    const { advance, stepStarts } = await import('./navigation');
    const { buildRouteIndex } = await import('./route-geometry');
    const C: [number, number][] = [
      ...Array.from({ length: 21 }, (_, i) => [67.0 + i * 0.001, 24.85] as [number, number]),
      [67.021, 24.851], [67.021, 24.8525],
      ...Array.from({ length: 13 }, (_, i) => [67.02 - i * 0.001, 24.85009] as [number, number]),
      [67.008, 24.849], [67.01, 24.845], [67.03, 24.84],
    ];
    const r = mk(C, 700);
    const idx = buildRouteIndex(C);
    const starts = stepStarts([]);
    let p = null as Awaited<ReturnType<typeof advance>> | null;
    const alongs: number[] = [];
    // Out along the first pass (GPS a little towards the far side), round the loop, and back.
    const path: [number, number][] = [
      [67.005, 24.85], [67.008, 24.85006], [67.011, 24.85006], [67.014, 24.85005], [67.017, 24.85], [67.02, 24.85],
      [67.021, 24.8515], [67.0205, 24.8525], [67.018, 24.85009], [67.014, 24.85009], [67.011, 24.85006],
    ];
    path.forEach(([lng, lat], i) => {
      p = advance(r, idx, starts, fixAt(lng, lat, i), p);
      alongs.push(p.along);
    });
    // Monotonic: never jumps ahead to the way back while on the first pass, and follows it after the loop.
    for (let i = 1; i < alongs.length; i++) expect(alongs[i]).toBeGreaterThanOrEqual(alongs[i - 1]);
    expect(alongs[3]).toBeLessThan(1600);
    expect(alongs[alongs.length - 1]).toBeGreaterThan(3000);
  });
});
