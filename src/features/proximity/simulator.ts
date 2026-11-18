import { useSyncExternalStore } from 'react';

import { locationStore } from '@/features/location/location-store';
import { emptyState } from '@/features/proximity/engine';
import { loadProximityState, saveProximityState } from '@/features/proximity/proximity-store';
import { buildRouteIndex, pointAlong, projectPoint } from '@/features/journey/route-geometry';
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
   * Runs in real time, so voice prompts come at the right distances.
   */
  startAlongRoute(
    coordinates: [number, number][],
    name: string,
    speedKmh = 50,
    opts: {
      /** "Wrong way" demo: drive this far, then turn round and drive back along the route. */
      wrongWayAfter?: number;
      /**
       * The route to drive now. When it changes (another route chosen, a new
       * route after going off it), the drive carries on along the new one
       * from where the car is, like a driver following the new directions.
       * Returning null ends the drive (the journey ended).
       */
      follow?: () => [number, number][] | null | undefined;
      /** Milliseconds between fixes in real time (tests run faster; fixes still say 1 s apart). */
      tickMs?: number;
    } = {},
  ) {
    simulator.stop();
    let coords = coordinates;
    let index = buildRouteIndex(coords);
    if (index.total <= 0) return;
    // Real time (one fix a second, like navigation GPS), so voice guidance is
    // timed as on a real drive.
    const stepSeconds = 1;
    const stepMeters = (speedKmh / 3.6) * stepSeconds;
    let turnAt = opts.wrongWayAfter != null ? Math.min(opts.wrongWayAfter, index.total / 2) : null;
    let along = 0;
    let backwards = false;
    let last = pointAlong(index, 0);
    const stepsLeft = () => Math.ceil(((turnAt != null ? 2 * turnAt : index.total) - along) / stepMeters);
    saveProximityState({ ...loadProximityState(), lastFix: null });
    locationStore.set({ simulating: true });
    sim = { running: true, targetName: name, step: 0, total: stepsLeft() + 1 };
    emit();

    let i = 0;
    let t = Date.now();
    timer = setInterval(() => {
      const now = opts.follow ? opts.follow() : coords;
      if (now === null) {
        simulator.stop();
        return;
      }
      if (now && now !== coords && now.length > 1) {
        // Switched to another route: continue on it from the car's spot, going forward.
        coords = now;
        index = buildRouteIndex(coords);
        along = projectPoint(index, last).along;
        backwards = false;
        turnAt = null;
        sim = { ...sim, total: i + stepsLeft() + 1 };
      }

      if (backwards) {
        along -= stepMeters;
        if (along <= 0) {
          simulator.stop();
          return;
        }
      } else if (i > 0) {
        along += stepMeters;
        if (turnAt != null && along >= turnAt) {
          backwards = true;
          turnAt = null;
        }
      }
      const end = along >= index.total;
      const p = pointAlong(index, Math.min(along, index.total));
      last = p;
      t += stepSeconds * 1000;
      locationStore.pushFix({
        latitude: p.latitude,
        longitude: p.longitude,
        accuracy: 8,
        heading: backwards ? (p.bearing + 180) % 360 : p.bearing,
        speed: speedKmh / 3.6,
        timestamp: t,
        simulated: true,
      });
      i += 1;
      sim = { ...sim, step: i };
      emit();
      if (end) simulator.stop();
    }, opts.tickMs ?? stepSeconds * 1000);
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
