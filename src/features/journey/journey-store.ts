import * as Speech from 'expo-speech';
import { useSyncExternalStore } from 'react';

import type { Landmark } from '@/features/destinations/api';
import { fetchRoute, type Route, type TravelMode } from '@/features/routing/osrm';
import { distanceMeters, type LatLng } from '@/lib/geo';
import { isUrdu, tx, txEn } from '@/lib/i18n';

import { storage, StorageKeys } from '@/lib/storage';
import type { RoadAlert } from '@/lib/types';

import { hazardLookahead, hazardsAhead, journeyItems, type JourneyItem } from './journey-items';
import { CHANNELS, notifyNow } from '@/features/notifications/local-notifications';
import { formatDistance } from '@/lib/geo';
import { advance, crossedThreshold, spokenInstruction, stepStarts, voiceThresholds, type NavFix, type NavProgress } from './navigation';
import { buildRouteIndex, type RouteIndex } from './route-geometry';

/**
 * Journey state: plan (routes for each travel mode) → preview → active
 * navigation → arrived. The active journey is persisted so the background
 * navigation task and a restarted app can continue it.
 */
export type JourneyTarget = LatLng & { id?: string; name: string; subtitle?: string };
export type JourneyPhase = 'idle' | 'planning' | 'preview' | 'active' | 'arrived';

export type JourneyState = {
  phase: JourneyPhase;
  target: JourneyTarget | null;
  origin: LatLng | null;
  mode: TravelMode;
  routes: Partial<Record<TravelMode, Route>>;
  routeErrors: Partial<Record<TravelMode, string>>;
  route: Route | null;
  items: JourneyItem[];
  progress: NavProgress | null;
  rerouting: boolean;
  voice: boolean;
  startedAt: number | null;
  /** Hazards already announced on this journey. */
  warned: string[];
  error: string | null;
};

/** What the background task and app restarts need. */
export type StoredJourney = {
  target: JourneyTarget;
  mode: TravelMode;
  route: Route;
  items: JourneyItem[];
  startedAt: number;
  progress: NavProgress | null;
  voice: boolean;
  warned: string[];
};

const MODES: TravelMode[] = ['driving', 'cycling', 'walking'];
/** Skip modes that make no sense for the distance (as the crow flies). */
const MODE_MAX_KM: Record<TravelMode, number> = { driving: Infinity, cycling: 120, walking: 25 };
const REROUTE_MIN_INTERVAL_MS = 20_000;
const PERSIST_INTERVAL_MS = 10_000;

const idle: JourneyState = {
  phase: 'idle',
  target: null,
  origin: null,
  mode: 'driving',
  routes: {},
  routeErrors: {},
  route: null,
  items: [],
  progress: null,
  rerouting: false,
  voice: true,
  startedAt: null,
  warned: [],
  error: null,
};

let state: JourneyState = idle;
let index: RouteIndex | null = null;
let starts: number[] = [];
let lastReroute = 0;
let lastPersist = 0;
let planController: AbortController | null = null;
let context: { landmarks: Landmark[]; alerts: RoadAlert[] } = { landmarks: [], alerts: [] };
const listeners = new Set<() => void>();
const eventListeners = new Set<(e: JourneyEvent) => void>();

export type JourneyEvent = { type: 'arrived' } | { type: 'rerouted' } | { type: 'off-route' };

function set(patch: Partial<JourneyState>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

function emit(e: JourneyEvent) {
  eventListeners.forEach((l) => l(e));
}

function indexRoute(route: Route | null) {
  index = route ? buildRouteIndex(route.coordinates) : null;
  starts = route ? stepStarts(route.steps) : [];
}

function itemsFor(route: Route | null) {
  if (!route) return [];
  return journeyItems(index ?? buildRouteIndex(route.coordinates), context.landmarks, context.alerts);
}

export function readStoredJourney(fresh = false): StoredJourney | null {
  if (fresh) storage.invalidate(StorageKeys.activeJourney);
  return storage.get<StoredJourney | null>(StorageKeys.activeJourney, null);
}

function persist(force = false) {
  if (state.phase !== 'active' || !state.route || !state.target || !state.startedAt) return;
  const now = Date.now();
  if (!force && now - lastPersist < PERSIST_INTERVAL_MS) return;
  lastPersist = now;
  storage.set<StoredJourney>(StorageKeys.activeJourney, {
    target: state.target,
    mode: state.mode,
    route: state.route,
    items: state.items,
    startedAt: state.startedAt,
    progress: state.progress,
    voice: state.voice,
    warned: state.warned,
  });
}

/** Spoken + notified warning for a hazard coming up on the route (foreground and background). */
export async function announceHazard(
  item: JourneyItem,
  metresAhead: number,
  voice: (phrase: string, vars?: Record<string, string | number>) => void,
) {
  const near = metresAhead <= 50;
  const vars = { 0: item.name, 1: formatDistance(metresAhead) };
  voice(near ? 'Caution. {0} here.' : 'Caution. {0} in {1}.', vars);
  await notifyNow({
    title: near ? tx('Hazard here: {0}', vars) : tx('Hazard ahead in {1}: {0}', vars),
    body: item.detail || tx('Reported on your route. Slow down and take care.'),
    channel: CHANNELS.alerts,
    data: { type: 'alert', alertId: item.id.replace(/^alert:/, '') },
  });
}

/** Whether this phone has an Urdu text-to-speech voice (checked once). */
let urduVoice: boolean | null = null;
if (isUrdu) {
  Speech.getAvailableVoicesAsync()
    .then((voices) => {
      urduVoice = voices.some((v) => v.language?.toLowerCase().startsWith('ur'));
    })
    .catch(() => {
      urduVoice = false;
    });
}

/** Speak English unless the app is in Urdu and the phone can speak Urdu. */
function speakEnglish() {
  return !isUrdu || !urduVoice;
}

function say(text: string) {
  if (!state.voice) return;
  Speech.stop();
  Speech.speak(text, { language: speakEnglish() ? 'en-US' : 'ur-PK', rate: 0.98 });
}

/** Speaks a phrase (English source text with placeholders) in the voice language. */
export function speak(phrase: string, vars?: Record<string, string | number | null | undefined>) {
  say(speakEnglish() ? txEn(phrase, vars) : tx(phrase, vars));
}

export const journeyStore = {
  get: () => state,
  subscribe(l: () => void) {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  },
  onEvent(l: (e: JourneyEvent) => void) {
    eventListeners.add(l);
    return () => {
      eventListeners.delete(l);
    };
  },

  /** Landmarks and hazards used to find what lies along routes. */
  setContext(landmarks: Landmark[], alerts: RoadAlert[]) {
    context = { landmarks, alerts };
    if (state.route && (state.phase === 'preview' || state.phase === 'active')) {
      set({ items: itemsFor(state.route) });
    }
  },

  /** Calculates routes for every sensible travel mode, in parallel. */
  async plan(target: JourneyTarget, origin: LatLng, preferred: TravelMode) {
    planController?.abort();
    planController = new AbortController();
    const signal = planController.signal;
    const crowKm = distanceMeters(origin, target) / 1000;
    const modes = MODES.filter((m) => crowKm <= MODE_MAX_KM[m]);
    set({ ...idle, voice: state.voice, phase: 'planning', target, origin, mode: preferred });

    const results = await Promise.allSettled(modes.map((m) => fetchRoute(m, origin, target, signal)));
    if (signal.aborted) return;
    const routes: JourneyState['routes'] = {};
    const routeErrors: JourneyState['routeErrors'] = {};
    results.forEach((r, i) => {
      if (r.status === 'fulfilled') routes[modes[i]] = r.value;
      else routeErrors[modes[i]] = r.reason instanceof Error ? r.reason.message : 'Unable to calculate route.';
    });
    const mode = routes[preferred] ? preferred : (modes.find((m) => routes[m]) ?? preferred);
    const route = routes[mode] ?? null;
    if (!route) {
      set({ phase: 'preview', routes, routeErrors, route: null, error: routeErrors[mode] ?? 'Unable to calculate a route.' });
      return;
    }
    indexRoute(route);
    set({ phase: 'preview', routes, routeErrors, mode, route, items: itemsFor(route), error: null });
  },

  selectMode(mode: TravelMode) {
    const route = state.routes[mode];
    if (!route) return;
    indexRoute(route);
    set({ mode, route, items: itemsFor(route) });
  },

  start() {
    if (!state.route || !state.target) return;
    lastReroute = 0;
    set({ phase: 'active', startedAt: Date.now(), progress: null, rerouting: false, warned: [] });
    persist(true);
    const first = state.route.steps[0];
    if (first) {
      speak('Starting your journey to {0}.', { 0: state.target.name });
      say(speakEnglish() ? first.instructionEn : first.instruction);
    }
  },

  /** Resumes a journey saved before the app was closed. */
  restore(): boolean {
    const saved = readStoredJourney(true);
    if (!saved || state.phase === 'active') return false;
    indexRoute(saved.route);
    set({
      ...idle,
      phase: 'active',
      target: saved.target,
      mode: saved.mode,
      route: saved.route,
      routes: { [saved.mode]: saved.route },
      items: saved.items,
      progress: saved.progress,
      startedAt: saved.startedAt,
      voice: saved.voice,
      warned: saved.warned ?? [],
    });
    return true;
  },

  /** Takes over what the background task did while the app was away. */
  syncFromStorage() {
    const saved = readStoredJourney(true);
    if (!saved) {
      // The background task saw the arrival and cleared the journey.
      if (state.phase === 'active') set({ phase: 'arrived' });
      return;
    }
    set({ progress: saved.progress, warned: saved.warned ?? state.warned });
  },

  /** Feed every navigation fix (foreground). */
  onFix(fix: NavFix) {
    if (state.phase !== 'active' || !state.route || !index) return;
    const prev = state.progress;
    const progress = advance(state.route, index, starts, fix, prev);

    // Voice: announce the coming manoeuvre at fixed distances.
    const upcoming = state.route.steps[progress.stepIndex + 1];
    if (upcoming && prev && prev.stepIndex === progress.stepIndex) {
      const thresholds = voiceThresholds(state.mode);
      const t = crossedThreshold(prev.toManeuver, progress.toManeuver, thresholds);
      if (t != null) say(spokenInstruction(upcoming, progress.toManeuver, t === thresholds[thresholds.length - 1], speakEnglish()));
    }

    if (progress.arrived) {
      set({ progress, phase: 'arrived' });
      storage.remove(StorageKeys.activeJourney);
      speak('You have arrived at {0}', { 0: state.target?.name ?? txEn('your destination') });
      emit({ type: 'arrived' });
      return;
    }
    const ahead = hazardsAhead(state.items, progress.along, hazardLookahead(state.mode), state.warned);
    set({ progress, warned: ahead.length ? [...state.warned, ...ahead.map((h) => h.id)] : state.warned });
    for (const h of ahead.slice(0, 1)) announceHazard(h, Math.max(0, h.along - progress.along), speak).catch(() => undefined);
    persist(ahead.length > 0);
    if (progress.offRoute && !prev?.offRoute) emit({ type: 'off-route' });
    if (progress.offRoute) journeyStore.reroute(fix).catch(() => undefined);
  },

  /** New route from where the traveller is now (throttled). */
  async reroute(from: LatLng) {
    if (state.rerouting || !state.target || Date.now() - lastReroute < REROUTE_MIN_INTERVAL_MS) return;
    lastReroute = Date.now();
    set({ rerouting: true });
    speak('Recalculating');
    try {
      const route = await fetchRoute(state.mode, from, state.target);
      if (state.phase !== 'active') return;
      indexRoute(route);
      set({ route, routes: { ...state.routes, [state.mode]: route }, items: itemsFor(route), progress: null, rerouting: false });
      persist(true);
      emit({ type: 'rerouted' });
    } catch {
      // Offline or service busy: keep the old route and try again later.
      set({ rerouting: false });
    }
  },

  setVoice(voice: boolean) {
    if (!voice) Speech.stop();
    set({ voice });
    persist(true);
  },

  /** Ends navigation and clears the saved journey. */
  stop() {
    planController?.abort();
    Speech.stop();
    storage.remove(StorageKeys.activeJourney);
    indexRoute(null);
    set({ ...idle, voice: state.voice });
  },
};

export function useJourney() {
  return useSyncExternalStore(journeyStore.subscribe, journeyStore.get);
}

export function routeIndex() {
  return index;
}
