/**
 * Landmark proximity (geofence) engine. Pure and deterministic: given a
 * location fix, the landmarks, the previous state and settings, it returns
 * the next state plus what (if anything) to notify. Shared by the foreground
 * watcher, the background geofencing task and the journey simulator.
 *
 * Edge cases handled:
 *  - GPS drift at the boundary: entering needs 2 consecutive inside fixes
 *    (or one fix whose whole accuracy circle is inside), and exiting needs the
 *    user to go beyond radius * 1.15 + 50 m (hysteresis).
 *  - Repeated location events: a landmark notifies only on the transition
 *    outside -> inside, never while staying inside.
 *  - Leaving and re-entering: re-notification needs an exit AND an expired
 *    cooldown (default 6 h).
 *  - Inaccurate fixes: ignored for landmarks whose radius is smaller than the
 *    fix accuracy (min threshold 150 m).
 *  - Rapid location changes / GPS jumps: fixes implying > 300 km/h are dropped.
 *  - Out-of-order or duplicate events: fixes older than the last one are dropped.
 *  - Multiple / overlapping landmarks: each keeps its own state; one grouped
 *    notification names the nearest new landmark plus "N more nearby".
 */
import { distanceMeters } from '@/lib/geo';

export type EngineLandmark = {
  id: string;
  latitude: number;
  longitude: number;
  radius: number;
};

export type EngineFix = {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  timestamp: number;
};

export type LandmarkProximity = {
  inside: boolean;
  /** Consecutive fixes inside the radius while still marked outside. */
  pending: number;
  lastNotifiedAt: number | null;
  enteredAt: number | null;
  exitedAt: number | null;
};

export type ProximityState = {
  landmarks: Record<string, LandmarkProximity>;
  lastFix: EngineFix | null;
};

export type EngineSettings = {
  cooldownMs: number;
  confirmFixes: number;
  exitFactor: number;
  exitBufferM: number;
  minAccuracyGateM: number;
  maxSpeedMps: number;
};

export const DEFAULT_SETTINGS: EngineSettings = {
  cooldownMs: 6 * 60 * 60 * 1000,
  confirmFixes: 2,
  exitFactor: 1.15,
  exitBufferM: 50,
  minAccuracyGateM: 150,
  maxSpeedMps: 300 / 3.6,
};

export type ProximityHit = { id: string; distance: number };

export type EvaluateResult = {
  state: ProximityState;
  /** Landmarks entered on this fix (sorted nearest first). */
  entered: ProximityHit[];
  exited: string[];
  /** Landmarks currently inside (sorted nearest first). */
  inside: ProximityHit[];
  /** What to announce (notification + in-app card), respecting cooldowns. */
  announce: { primary: ProximityHit; others: ProximityHit[] } | null;
  rejected: null | 'stale' | 'jump';
};

export const emptyState = (): ProximityState => ({ landmarks: {}, lastFix: null });

const fresh = (): LandmarkProximity => ({
  inside: false,
  pending: 0,
  lastNotifiedAt: null,
  enteredAt: null,
  exitedAt: null,
});

export function exitDistance(radius: number, s: EngineSettings = DEFAULT_SETTINGS) {
  return radius * s.exitFactor + s.exitBufferM;
}

function cooledDown(entry: LandmarkProximity, now: number, s: EngineSettings) {
  return entry.lastNotifiedAt == null || now - entry.lastNotifiedAt >= s.cooldownMs;
}

export function evaluate(
  fix: EngineFix,
  landmarks: EngineLandmark[],
  prev: ProximityState,
  settings: EngineSettings = DEFAULT_SETTINGS,
): EvaluateResult {
  const s = settings;
  const noop = (rejected: EvaluateResult['rejected']): EvaluateResult => ({
    state: prev,
    entered: [],
    exited: [],
    inside: insideList(prev, landmarks, fix),
    announce: null,
    rejected,
  });

  const last = prev.lastFix;
  if (last) {
    const dt = (fix.timestamp - last.timestamp) / 1000;
    if (dt < 0) return noop('stale');
    if (dt > 0 && dt < 120) {
      const speed = distanceMeters(last, fix) / dt;
      if (speed > s.maxSpeedMps) return noop('jump');
    }
  }

  const accuracy = fix.accuracy ?? 0;
  const next: Record<string, LandmarkProximity> = { ...prev.landmarks };
  const entered: ProximityHit[] = [];
  const exited: string[] = [];
  const inside: ProximityHit[] = [];

  for (const lm of landmarks) {
    const entry = { ...(next[lm.id] ?? fresh()) };
    const d = distanceMeters(fix, lm);
    const reliable = accuracy <= Math.max(s.minAccuracyGateM, lm.radius);

    if (reliable) {
      if (!entry.inside) {
        if (d <= lm.radius) {
          entry.pending += 1;
          const certain = d + accuracy <= lm.radius;
          if (certain || entry.pending >= s.confirmFixes) {
            entry.inside = true;
            entry.pending = 0;
            entry.enteredAt = fix.timestamp;
            entered.push({ id: lm.id, distance: d });
          }
        } else {
          entry.pending = 0;
        }
      } else if (d > exitDistance(lm.radius, s)) {
        entry.inside = false;
        entry.pending = 0;
        entry.exitedAt = fix.timestamp;
        exited.push(lm.id);
      }
    }

    if (entry.inside) inside.push({ id: lm.id, distance: d });

    // Keep state small: drop entries that carry no information any more.
    const idle = !entry.inside && entry.pending === 0 && cooledDown(entry, fix.timestamp, s);
    if (idle) delete next[lm.id];
    else next[lm.id] = entry;
  }

  entered.sort((a, b) => a.distance - b.distance);
  inside.sort((a, b) => a.distance - b.distance);

  const announceable = entered.filter((h) => cooledDown(next[h.id] ?? fresh(), fix.timestamp, s));
  let announce: EvaluateResult['announce'] = null;
  if (announceable.length) {
    for (const h of announceable) next[h.id] = { ...next[h.id], lastNotifiedAt: fix.timestamp };
    announce = { primary: announceable[0], others: announceable.slice(1) };
  }

  return {
    state: { landmarks: next, lastFix: fix },
    entered,
    exited,
    inside,
    announce,
    rejected: null,
  };
}

function insideList(state: ProximityState, landmarks: EngineLandmark[], fix: EngineFix): ProximityHit[] {
  return landmarks
    .filter((l) => state.landmarks[l.id]?.inside)
    .map((l) => ({ id: l.id, distance: distanceMeters(fix, l) }))
    .sort((a, b) => a.distance - b.distance);
}

/**
 * OS geofence transitions (background). The OS already applied its own
 * dwell/hysteresis, so an ENTER is treated as confirmed. Cooldown still applies.
 */
export function applyOsTransition(
  prev: ProximityState,
  landmarkId: string,
  kind: 'enter' | 'exit',
  now: number,
  settings: EngineSettings = DEFAULT_SETTINGS,
): { state: ProximityState; announce: boolean } {
  const entry = { ...(prev.landmarks[landmarkId] ?? fresh()) };
  let announce = false;
  if (kind === 'enter') {
    if (!entry.inside) {
      entry.inside = true;
      entry.pending = 0;
      entry.enteredAt = now;
      if (cooledDown(entry, now, settings)) {
        entry.lastNotifiedAt = now;
        announce = true;
      }
    }
  } else if (entry.inside) {
    entry.inside = false;
    entry.exitedAt = now;
  }
  return { state: { ...prev, landmarks: { ...prev.landmarks, [landmarkId]: entry } }, announce };
}

/** Nearest N landmarks to register as OS geofences (Android allows 100 per app). */
export function nearestLandmarks<T extends EngineLandmark>(
  point: { latitude: number; longitude: number },
  landmarks: T[],
  limit = 90,
): T[] {
  return landmarks
    .map((l) => ({ l, d: distanceMeters(point, l) }))
    .sort((a, b) => a.d - b.d)
    .slice(0, limit)
    .map((x) => x.l);
}
