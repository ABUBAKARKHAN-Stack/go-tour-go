import { simulator } from '@/features/proximity/simulator';

import { journeyStore } from './journey-store';

/** The route the simulated car should be on now; null once the journey is over. */
function currentRoute() {
  const j = journeyStore.get();
  return j.phase === 'active' ? (j.route?.coordinates ?? null) : null;
}

/**
 * Drives the active journey without moving (demo tool). The car follows
 * whatever route the journey is on: switch to another route, or get a new one
 * after going off it, and it carries on along that one. `wrongWay` drives a
 * little ahead, then turns round, to show the wrong-way warning and U-turn.
 */
export function simulateActiveJourney(opts: { wrongWay?: boolean } = {}) {
  const j = journeyStore.get();
  if (j.phase !== 'active' || !j.route || !j.target) return false;
  simulator.startAlongRoute(j.route.coordinates, j.target.name, opts.wrongWay ? 40 : 50, {
    wrongWayAfter: opts.wrongWay ? 300 : undefined,
    follow: currentRoute,
  });
  return true;
}
