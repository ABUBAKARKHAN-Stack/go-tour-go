import { describe, expect, mock, test } from 'bun:test';

// Simulated fixes go to the location store; proximity state persistence is not needed here.
mock.module('@/features/proximity/proximity-store', () => ({
  loadProximityState: () => ({ lastFix: null }),
  saveProximityState: () => undefined,
}));

const { simulator } = await import('./simulator');
const { locationStore } = await import('@/features/location/location-store');

// Route A: east along lat 24.85. Route B: from 67.003 on A, north.
const routeA: [number, number][] = Array.from({ length: 30 }, (_, i) => [67.0 + i * 0.001, 24.85]);
const routeB: [number, number][] = [[67.003, 24.85], ...Array.from({ length: 30 }, (_, i) => [67.003, 24.851 + i * 0.001] as [number, number])];

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

describe('simulated drive', () => {
  test('follows the route the journey switched to, from where the car is', async () => {
    const fixes: { latitude: number; longitude: number }[] = [];
    const off = locationStore.onFix((f) => fixes.push(f));
    let current = routeA;
    // 100 km/h ≈ 28 m a fix: about 3 fixes to reach the turn at 67.003 (≈300 m).
    simulator.startAlongRoute(routeA, 'Test', 100, { follow: () => current, tickMs: 5 });
    await wait(40);
    current = routeB;
    await wait(80);
    simulator.stop();
    off();

    const before = fixes.slice(0, 4);
    const after = fixes.slice(-5);
    expect(before.every((f) => Math.abs(f.latitude - 24.85) < 1e-6)).toBe(true);
    // After the switch: on route B (north from 67.003), not continuing east on A.
    after.forEach((f) => expect(f.longitude).toBeCloseTo(67.003, 4));
    expect(after[after.length - 1].latitude).toBeGreaterThan(after[0].latitude);
  });

  test('stops when the journey is over', async () => {
    let current: [number, number][] | null = routeA;
    simulator.startAlongRoute(routeA, 'Test', 100, { follow: () => current, tickMs: 5 });
    await wait(20);
    current = null;
    await wait(20);
    expect(simulator.get().running).toBe(false);
  });
});
