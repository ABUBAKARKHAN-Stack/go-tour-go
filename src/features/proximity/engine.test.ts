import { describe, expect, test } from 'bun:test';

import { destinationPoint } from '../../lib/geo';
import {
  applyOsTransition,
  DEFAULT_SETTINGS,
  emptyState,
  evaluate,
  nearestLandmarks,
  type EngineFix,
  type EngineLandmark,
  type ProximityState,
} from './engine';

// Badshahi Mosque (1000 m) and Fort Road Food Street (300 m) overlap.
const badshahi: EngineLandmark = { id: 'badshahi', latitude: 31.5881, longitude: 74.3107, radius: 1000 };
const foodStreet: EngineLandmark = { id: 'food', latitude: 31.5869, longitude: 74.3122, radius: 300 };
const faisal: EngineLandmark = { id: 'faisal', latitude: 33.7295, longitude: 73.0372, radius: 1000 };
const landmarks = [badshahi, foodStreet, faisal];

const MIN = 60_000;
let clock = 1_700_000_000_000;

/** Fix at `meters` north of a landmark centre. */
function fixAt(lm: EngineLandmark, meters: number, accuracy = 15, advanceMs = 20_000): EngineFix {
  clock += advanceMs;
  const p = destinationPoint(lm, 0, meters);
  return { ...p, accuracy, timestamp: clock };
}

function run(state: ProximityState, fixes: EngineFix[]) {
  let s = state;
  const announcements: string[][] = [];
  for (const f of fixes) {
    const r = evaluate(f, landmarks, s);
    s = r.state;
    if (r.announce) announcements.push([r.announce.primary.id, ...r.announce.others.map((o) => o.id)]);
  }
  return { state: s, announcements };
}

describe('proximity engine', () => {
  test('outside radius does not notify', () => {
    const { announcements } = run(emptyState(), [fixAt(badshahi, 3000), fixAt(badshahi, 2500), fixAt(badshahi, 1500)]);
    expect(announcements).toEqual([]);
  });

  test('approach -> inside notifies exactly once despite repeated GPS updates', () => {
    const fixes = [
      fixAt(badshahi, 3000),
      fixAt(badshahi, 1800),
      fixAt(badshahi, 900, 200), // inaccurate-ish, needs confirmation
      fixAt(badshahi, 850),
      fixAt(badshahi, 800),
      fixAt(badshahi, 820),
      fixAt(badshahi, 790),
    ];
    const { announcements, state } = run(emptyState(), fixes);
    expect(announcements).toEqual([['badshahi']]);
    expect(state.landmarks.badshahi.inside).toBe(true);
  });

  test('single high-confidence fix enters immediately', () => {
    const r = evaluate(fixAt(badshahi, 400, 10), landmarks, emptyState());
    expect(r.entered.map((e) => e.id)).toEqual(['badshahi']);
    expect(r.announce?.primary.id).toBe('badshahi');
  });

  test('a single borderline fix (drift) does not enter', () => {
    const r = evaluate(fixAt(badshahi, 990, 40), landmarks, emptyState());
    expect(r.entered).toEqual([]);
    expect(r.state.landmarks.badshahi.pending).toBe(1);
    // drifting back out resets confirmation
    const r2 = evaluate(fixAt(badshahi, 1010, 40), landmarks, r.state);
    expect(r2.state.landmarks.badshahi).toBeUndefined();
  });

  test('GPS drift around the boundary does not cause exit/enter flapping', () => {
    let s = run(emptyState(), [fixAt(badshahi, 500, 10)]).state;
    const drift = [1020, 980, 1050, 1100, 990, 1120];
    const { announcements, state } = run(s, drift.map((m) => fixAt(badshahi, m, 30)));
    expect(announcements).toEqual([]);
    expect(state.landmarks.badshahi.inside).toBe(true); // exit needs > 1200 m
    s = state;
    const out = evaluate(fixAt(badshahi, 1300, 20), landmarks, s);
    expect(out.exited).toContain('badshahi');
  });

  test('leave and re-enter within cooldown does not notify again', () => {
    const { state } = run(emptyState(), [fixAt(badshahi, 300, 10)]);
    const { announcements } = run(state, [
      fixAt(badshahi, 2000, 10, 5 * MIN),
      fixAt(badshahi, 300, 10, 10 * MIN),
    ]);
    expect(announcements).toEqual([]);
  });

  test('re-entering after cooldown notifies again', () => {
    const { state } = run(emptyState(), [fixAt(badshahi, 300, 10)]);
    const out = run(state, [fixAt(badshahi, 2000, 10, 5 * MIN)]).state;
    clock += DEFAULT_SETTINGS.cooldownMs;
    const { announcements } = run(out, [fixAt(badshahi, 300, 10, 1000)]);
    expect(announcements).toEqual([['badshahi']]);
  });

  test('staying inside past the cooldown does not re-notify (requires exit)', () => {
    const { state } = run(emptyState(), [fixAt(badshahi, 300, 10)]);
    clock += DEFAULT_SETTINGS.cooldownMs * 2;
    const { announcements } = run(state, [fixAt(badshahi, 320, 10, 1000), fixAt(badshahi, 310, 10)]);
    expect(announcements).toEqual([]);
  });

  test('overlapping radii produce one grouped announcement, nearest first', () => {
    const r = evaluate(
      { latitude: foodStreet.latitude, longitude: foodStreet.longitude, accuracy: 10, timestamp: (clock += 20_000) },
      landmarks,
      emptyState(),
    );
    expect(r.announce?.primary.id).toBe('food');
    expect(r.announce?.others.map((o) => o.id)).toEqual(['badshahi']);
    expect(r.inside.map((i) => i.id)).toEqual(['food', 'badshahi']);
  });

  test('entering a second landmark later still announces it', () => {
    const s1 = run(emptyState(), [fixAt(badshahi, 900, 10)]).state; // only badshahi
    const r = evaluate(
      { latitude: foodStreet.latitude, longitude: foodStreet.longitude, accuracy: 10, timestamp: (clock += 60_000) },
      landmarks,
      s1,
    );
    expect(r.announce?.primary.id).toBe('food');
    expect(r.announce?.others).toEqual([]);
  });

  test('GPS jump implying > 300 km/h is rejected', () => {
    const s = run(emptyState(), [fixAt(faisal, 5000, 10)]).state;
    // 280 km away 10 s later
    const r = evaluate({ ...badshahi, accuracy: 10, timestamp: clock + 10_000 }, landmarks, s);
    expect(r.rejected).toBe('jump');
    expect(r.announce).toBeNull();
  });

  test('out-of-order (older) fixes are ignored', () => {
    const s = run(emptyState(), [fixAt(faisal, 5000, 10)]).state;
    const r = evaluate({ ...destinationPoint(badshahi, 0, 100), accuracy: 10, timestamp: clock - 60_000 }, landmarks, s);
    expect(r.rejected).toBe('stale');
  });

  test('very inaccurate fixes cannot trigger small geofences', () => {
    const r1 = evaluate({ latitude: foodStreet.latitude, longitude: foodStreet.longitude, accuracy: 600, timestamp: (clock += 20_000) }, [foodStreet], emptyState());
    const r2 = evaluate({ latitude: foodStreet.latitude, longitude: foodStreet.longitude, accuracy: 600, timestamp: (clock += 20_000) }, [foodStreet], r1.state);
    expect(r2.entered).toEqual([]);
  });

  test('OS geofence transitions respect cooldown and dedupe with foreground', () => {
    const now = (clock += 1000);
    const a = applyOsTransition(emptyState(), 'badshahi', 'enter', now);
    expect(a.announce).toBe(true);
    const b = applyOsTransition(a.state, 'badshahi', 'enter', now + 1000);
    expect(b.announce).toBe(false); // already inside
    const c = applyOsTransition(b.state, 'badshahi', 'exit', now + MIN);
    const d = applyOsTransition(c.state, 'badshahi', 'enter', now + 2 * MIN);
    expect(d.announce).toBe(false); // cooldown
    // Foreground engine sees the user inside already: no duplicate announce.
    const r = evaluate(fixAt(badshahi, 200, 10), landmarks, d.state);
    expect(r.announce).toBeNull();
  });

  test('nearestLandmarks keeps the closest ones', () => {
    const near = nearestLandmarks(foodStreet, landmarks, 2).map((l) => l.id);
    expect(near).toEqual(['food', 'badshahi']);
  });
});
