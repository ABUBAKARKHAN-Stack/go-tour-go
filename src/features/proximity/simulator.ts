import { useSyncExternalStore } from 'react';

import { locationStore } from '@/features/location/location-store';
import { emptyState } from '@/features/proximity/engine';
import { loadProximityState, saveProximityState } from '@/features/proximity/proximity-store';
import { buildRouteIndex, pointAlong } from '@/features/journey/route-geometry';
import { destinationPoint, type LatLng } from '@/lib/geo';

/**
 * "Simulate journey" developer tool. Feeds synthetic fixes through the same
 * location store -> proximity engine pipeline as real GPS: approach from
 * 3 km, pass through the landmark, and leave again. Real GPS is ignored
 * while it runs.
 */
type SimState = { running: boolean; targetName: string | null; step: number; total: number };

let sim: SimState = { running: false, targetName: null, step: 0, total: 0 };
let timer: ReturnType<typeof setInterval> | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function buildPath(target: LatLng, radius: number): LatLng[] {
  const start = Math.max(3000, radius * 3);
  const step = Math.max(60, radius / 6);
  const path: LatLng[] = [];
  // From the south, moving north through the centre and out the other side.
  for (let d = start; d > 0; d -= step) path.push(destinationPoint(target, 180, d));
  path.push(target);
  for (let d = step; d <= start; d += step) path.push(destinationPoint(target, 0, d));
  return path;
}

export const simulator = {
  get: () => sim,
  subscribe(l: () => void) {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  },
  start(target: LatLng & { name: string; radius: number }, intervalMs = 1500) {
    simulator.stop();
    const path = buildPath(target, target.radius);
    // Forget the previous position so the jump to the start is not rejected.
    saveProximityState({ ...loadProximityState(), lastFix: null });
    locationStore.set({ simulating: true });
    sim = { running: true, targetName: target.name, step: 0, total: path.length };
    emit();

    let i = 0;
    let t = Date.now();
    timer = setInterval(() => {
      if (i >= path.length) {
        simulator.stop();
        return;
      }
      t += 20_000; // pretend 20 s between fixes (walking/driving speed)
      locationStore.pushFix({ ...path[i], accuracy: 12, heading: 0, speed: null, timestamp: t, simulated: true });
      i += 1;
      sim = { ...sim, step: i };
      emit();
    }, intervalMs);
  },
  /**
   * Drives along a route (the active journey) at a steady speed, so journey
   * guidance, voice, landmark and hazard alerts can be shown without moving.
   * Simulated time runs faster than real time.
   */
  startAlongRoute(coordinates: [number, number][], name: string, speedKmh = 50) {
    simulator.stop();
    const index = buildRouteIndex(coordinates);
    if (index.total <= 0) return;
    const stepSeconds = 2;
    const stepMeters = (speedKmh / 3.6) * stepSeconds;
    const total = Math.ceil(index.total / stepMeters) + 1;
    saveProximityState({ ...loadProximityState(), lastFix: null });
    locationStore.set({ simulating: true });
    sim = { running: true, targetName: name, step: 0, total };
    emit();

    let i = 0;
    let t = Date.now();
    timer = setInterval(() => {
      if (i >= total) {
        simulator.stop();
        return;
      }
      const p = pointAlong(index, i * stepMeters);
      t += stepSeconds * 1000;
      locationStore.pushFix({ latitude: p.latitude, longitude: p.longitude, accuracy: 8, heading: p.bearing, speed: speedKmh / 3.6, timestamp: t, simulated: true });
      i += 1;
      sim = { ...sim, step: i };
      emit();
    }, 700);
  },
  stop() {
    if (timer) clearInterval(timer);
    timer = null;
    if (sim.running) {
      // Drop the simulated last fix so real GPS is not rejected as a jump.
      saveProximityState({ ...loadProximityState(), lastFix: null });
    }
    sim = { running: false, targetName: null, step: 0, total: 0 };
    locationStore.set({ simulating: false });
    emit();
  },
  /** Clears all landmark cooldowns/inside flags (for repeated demos). */
  resetCooldowns() {
    saveProximityState(emptyState());
  },
};

export function useSimulator() {
  return useSyncExternalStore(simulator.subscribe, simulator.get);
}
