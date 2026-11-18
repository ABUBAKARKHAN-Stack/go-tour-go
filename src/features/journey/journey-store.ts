import * as Speech from 'expo-speech';
import { useSyncExternalStore } from 'react';

import type { Landmark } from '@/features/destinations/api';
import type { Route, TravelMode } from '@/features/routing/osrm';
import { getRoutes } from '@/features/routing/routes';
import { distanceMeters, type LatLng } from '@/lib/geo';
import { isUrdu, tx, txEn } from '@/lib/i18n';

import { storage, StorageKeys } from '@/lib/storage';
import type { RoadAlert } from '@/lib/types';

import { hazardCore, hazardLookahead, hazardsAhead, journeyItems, routeAvoiding, type JourneyItem } from './journey-items';
import { hazardCard } from '@/features/alerts/hazard-card-store';
import { CHANNELS, notifyNow } from '@/features/notifications/local-notifications';
import { formatDistance } from '@/lib/geo';
import { alternativesAhead, pickAlternatives, type AltRoute } from './alternatives';
import { advance, crossedThreshold, spokenParts, stepStarts, voiceThresholds, wrongWayNeedsReroute, type NavFix, type NavProgress, type SpokenPart } from './navigation';
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
  /** Where the route starts: the traveller ("Your location") or a chosen place. */
  origin: JourneyTarget | null;
  mode: TravelMode;
  routes: Partial<Record<TravelMode, Route>>;
  /** Other ways to go for the selected travel mode (grey on the map, tap to switch). */
  alternatives: AltRoute[];
  routeErrors: Partial<Record<TravelMode, string>>;
  route: Route | null;
  items: JourneyItem[];
  progress: NavProgress | null;
  rerouting: boolean;
  /** The last attempt to find a new route failed; another follows shortly. */
  rerouteFailed: boolean;
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
/** After a failed attempt, try again sooner. */
const REROUTE_RETRY_MS = 10_000;
const PERSIST_INTERVAL_MS = 10_000;

const idle: JourneyState = {
  phase: 'idle',
  target: null,
  origin: null,
  mode: 'driving',
  routes: {},
  alternatives: [],
  routeErrors: {},
  route: null,
  items: [],
  progress: null,
  rerouting: false,
  rerouteFailed: false,
  voice: true,
  startedAt: null,
  warned: [],
  error: null,
};

let state: JourneyState = idle;
let index: RouteIndex | null = null;
let starts: number[] = [];
let lastReroute = 0;
let rerouteWait = REROUTE_MIN_INTERVAL_MS;
/** Routes found per travel mode while planning (the first is the best). */
let planned: Partial<Record<TravelMode, Route[]>> = {};
/** Travel modes whose alternatives were already asked for in this plan. */
let askedAlternatives = new Set<TravelMode>();
let lastPersist = 0;
let planController: AbortController | null = null;
/**
 * New-route requests while navigating (automatic re-route, "find a way
 * around"). Each one gets a number; a reply is used only while its number is
 * still the latest, so a slow reply can't replace a newer route or land on a
 * different journey. Starting, stopping or planning a journey also bumps it.
 */
let routeRequest = 0;
let routeController: AbortController | null = null;
/** A "find a way around" request is running: automatic re-routes wait. */
let avoiding = false;

function newRouteRequest() {
  routeController?.abort();
  routeController = new AbortController();
  routeRequest += 1;
  return { id: routeRequest, signal: routeController.signal };
}

/** Drops any route request still on its way (new journey, or journey ended). */
function cancelRouteRequests() {
  routeController?.abort();
  routeController = null;
  routeRequest += 1;
  avoiding = false;
}
let context: { landmarks: Landmark[]; alerts: RoadAlert[] } = { landmarks: [], alerts: [] };
const listeners = new Set<() => void>();
const eventListeners = new Set<(e: JourneyEvent) => void>();

export type AvoidResult = 'switched' | 'none' | 'unavailable';

export type JourneyEvent = { type: 'arrived' } | { type: 'rerouted' } | { type: 'off-route' } | { type: 'wrong-way' };

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

/** The alternatives worth showing next to `route` (from the same request). */
function alternativesFor(route: Route | null, candidates: Route[]): AltRoute[] {
  if (!route || !index) return [];
  return pickAlternatives(route, index, candidates);
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

let lastSaid = { text: '', at: 0 };

/**
 * Speaks in the voice language. Phrases queue (Android speaks them in turn)
 * instead of cutting each other off; `now` interrupts for what can't wait
 * (a turn right here, arrival). The same phrase twice within 8 s is said once.
 */
function say(what: string | SpokenPart[], now = false) {
  const parts = typeof what === 'string' ? [{ text: what, english: speakEnglish() }] : what;
  const text = parts.map((p) => p.text).join(' ');
  if (!state.voice || !text) return;
  const at = Date.now();
  if (text === lastSaid.text && at - lastSaid.at < 8000) return;
  lastSaid = { text, at };
  if (now) Speech.stop();
  // Parts queue back to back, each in its own voice (an English road name inside an Urdu sentence).
  for (const p of parts) Speech.speak(p.text, { language: p.english ? 'en-US' : 'ur-PK', rate: 0.98 });
}

/** Speaks a phrase (English source text with placeholders) in the voice language. */
export function speak(phrase: string, vars?: Record<string, string | number | null | undefined>, now = false) {
  say(speakEnglish() ? txEn(phrase, vars) : tx(phrase, vars), now);
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
    itemsCache = new WeakMap();
    if (state.route && (state.phase === 'preview' || state.phase === 'active')) {
      set({ items: itemsFor(state.route) });
    }
  },

  /**
   * Calculates routes for every sensible travel mode, in parallel; the
   * preferred mode also gets alternative routes. `origin` is the traveller
   * or any chosen place (planning a trip that starts somewhere else).
   */
  async plan(target: JourneyTarget, origin: LatLng | JourneyTarget, preferred: TravelMode) {
    planController?.abort();
    cancelRouteRequests();
    planController = new AbortController();
    const signal = planController.signal;
    const crowKm = distanceMeters(origin, target) / 1000;
    const modes = MODES.filter((m) => crowKm <= MODE_MAX_KM[m]);
    const start: JourneyTarget = { name: 'name' in origin ? origin.name : tx('Your location'), ...origin };
    planned = {};
    askedAlternatives = new Set([preferred]);
    set({ ...idle, voice: state.voice, phase: 'planning', target, origin: start, mode: preferred });

    const results = await Promise.allSettled(
      modes.map((m) => getRoutes(m, origin, target, { signal, alternatives: m === preferred })),
    );
    if (signal.aborted) return;
    const routes: JourneyState['routes'] = {};
    const routeErrors: JourneyState['routeErrors'] = {};
    results.forEach((r, i) => {
      if (r.status === 'fulfilled') {
        routes[modes[i]] = r.value[0];
        planned[modes[i]] = r.value;
      } else routeErrors[modes[i]] = r.reason instanceof Error ? r.reason.message : 'Unable to calculate route.';
    });
    const mode = routes[preferred] ? preferred : (modes.find((m) => routes[m]) ?? preferred);
    const route = routes[mode] ?? null;
    if (!route) {
      set({ phase: 'preview', routes, routeErrors, route: null, error: routeErrors[mode] ?? 'Unable to calculate a route.' });
      return;
    }
    indexRoute(route);
    set({ phase: 'preview', routes, routeErrors, mode, route, alternatives: alternativesFor(route, planned[mode] ?? []), items: itemsFor(route), error: null });
    if (mode !== preferred) journeyStore.loadAlternatives(mode).catch(() => undefined);
  },

  selectMode(mode: TravelMode) {
    const route = state.routes[mode];
    if (!route) return;
    indexRoute(route);
    set({ mode, route, alternatives: alternativesFor(route, planned[mode] ?? []), items: itemsFor(route) });
    journeyStore.loadAlternatives(mode).catch(() => undefined);
  },

  /** Asks for the other ways to go in a travel mode (once, while planning). */
  async loadAlternatives(mode: TravelMode) {
    if (state.phase !== 'preview' || !state.origin || !state.target || askedAlternatives.has(mode)) return;
    askedAlternatives.add(mode);
    const signal = planController?.signal;
    const target = state.target;
    const routes = await getRoutes(mode, state.origin, target, { signal, alternatives: true });
    if (signal?.aborted || state.target !== target || state.phase !== 'preview') return;
    const main = state.routes[mode];
    if (!main) return;
    planned[mode] = [main, ...routes];
    if (state.mode === mode) set({ alternatives: alternativesFor(main, routes) });
  },

  /**
   * Switches to one of the alternative routes (tapped on the map or in the
   * list), while planning or during the journey. The route being left
   * becomes an alternative in its place.
   */
  selectRoute(alt: AltRoute) {
    const current = state.route;
    if (!current || !state.alternatives.includes(alt)) return;
    // A re-route still on its way must not replace the route just chosen.
    if (state.phase === 'active') cancelRouteRequests();
    const route = alt.route;
    indexRoute(route);
    // The route being left stays on the map as an alternative, so you can switch back
    // (during a journey, until its turn-off is behind you).
    const others = [current, ...state.alternatives.filter((a) => a !== alt).map((a) => a.route)];
    const alternatives = alternativesFor(route, others);
    if (state.phase !== 'active') planned[state.mode] = [route, ...others];
    set({
      route,
      routes: { ...state.routes, [state.mode]: route },
      alternatives,
      items: itemsFor(route),
      progress: state.phase === 'active' ? null : state.progress,
      rerouting: false,
      rerouteFailed: false,
    });
    if (state.phase === 'active') {
      persist(true);
      speak('Switched to the other route');
      emit({ type: 'rerouted' });
    }
  },

  /**
   * Shows a trip saved for offline use in the preview, without asking the
   * routing server: every travel mode that was saved, each with its other
   * routes, so mode and route can both be switched with no signal.
   * `modes` lists each mode's routes, the main one first.
   */
  loadSaved(target: JourneyTarget, modes: Partial<Record<TravelMode, Route[]>>, preferred: TravelMode, origin?: JourneyTarget) {
    if (state.phase === 'active') return;
    const available = MODES.filter((m) => modes[m]?.length);
    const mode = modes[preferred]?.length ? preferred : available[0];
    if (!mode) return;
    planController?.abort();
    cancelRouteRequests();
    const routes: JourneyState['routes'] = {};
    for (const m of available) routes[m] = modes[m]![0];
    const route = routes[mode]!;
    indexRoute(route);
    planned = Object.fromEntries(available.map((m) => [m, modes[m]!]));
    askedAlternatives = new Set(MODES);
    set({
      ...idle,
      voice: state.voice,
      phase: 'preview',
      target,
      origin: origin ?? { name: tx('Your location'), ...route.from },
      mode,
      routes,
      route,
      alternatives: alternativesFor(route, modes[mode]!),
      items: itemsFor(route),
      error: null,
    });
  },

  /** While planning: asks for the other routes of every travel mode (before saving the trip offline). */
  async loadAllAlternatives() {
    await Promise.allSettled(MODES.filter((m) => state.routes[m]).map((m) => journeyStore.loadAlternatives(m)));
  },

  /**
   * Every route planned, by travel mode, the main one first; alternatives
   * carry the stretch where they differ (only that needs extra offline map).
   */
  routesToSave(): Partial<Record<TravelMode, { route: Route; segment?: [number, number][] }[]>> {
    const out: Partial<Record<TravelMode, { route: Route; segment?: [number, number][] }[]>> = {};
    for (const m of MODES) {
      const main = state.routes[m];
      if (!main) continue;
      const alts = m === state.mode ? state.alternatives : pickAlternatives(main, buildRouteIndex(main.coordinates), planned[m] ?? []);
      out[m] = [{ route: main }, ...alts.map((a) => ({ route: a.route, segment: a.segment }))];
    }
    return out;
  },

  start() {
    if (!state.route || !state.target) return;
    cancelRouteRequests();
    lastReroute = 0;
    rerouteWait = REROUTE_MIN_INTERVAL_MS;
    // The alternatives from planning stay on the map until their turn-off is behind.
    set({ phase: 'active', startedAt: Date.now(), progress: null, rerouting: false, rerouteFailed: false, warned: [] });
    persist(true);
    const first = state.route.steps[0];
    if (first) {
      speak('Starting your journey to {0}.', { 0: state.target.name }, true);
      say(spokenParts(first, 0, true, speakEnglish()));
    }
  },

  /** Resumes a journey saved before the app was closed. */
  restore(): boolean {
    const saved = readStoredJourney(true);
    if (!saved || state.phase === 'active') return false;
    cancelRouteRequests();
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
      if (t != null) {
        const last = t === thresholds[thresholds.length - 1];
        say(spokenParts(upcoming, progress.toManeuver, last, speakEnglish()), last);
      }
    }

    if (progress.arrived) {
      set({ progress, phase: 'arrived' });
      storage.remove(StorageKeys.activeJourney);
      speak('You have arrived at {0}', { 0: state.target?.name ?? txEn('your destination') }, true);
      emit({ type: 'arrived' });
      return;
    }
    const ahead = hazardsAhead(state.items, progress.along, hazardLookahead(state.mode), state.warned);
    const alternatives = alternativesAhead(state.alternatives, progress.along);
    set({
      progress,
      alternatives,
      warned: ahead.length ? [...state.warned, ...ahead.map((h) => h.id)] : state.warned,
    });
    for (const h of ahead.slice(0, 1)) {
      announceHazard(h, Math.max(0, h.along - progress.along), speak).catch(() => undefined);
      hazardCard.show(h.id.replace(/^alert:/, ''), Math.max(0, h.along - progress.along));
    }
    persist(ahead.length > 0);
    if (progress.offRoute && !prev?.offRoute) emit({ type: 'off-route' });
    // Going back along the route: warn at once, then plan from here if it goes on.
    if (progress.wrongWay && !prev?.wrongWay) {
      emit({ type: 'wrong-way' });
      speak("You're going the wrong way. Make a U-turn when it is safe.", undefined, true);
    }
    if (progress.offRoute || wrongWayNeedsReroute(progress, fix.timestamp)) {
      journeyStore.reroute(fix, progress.heading).catch(() => undefined);
    }
  },

  /**
   * New route from where the traveller is now, starting in the direction
   * they are going (a U-turn when that is the way). The first try is
   * immediate; after that at most every 20 s, or 10 s after a failure.
   * Alternatives come back with it.
   */
  async reroute(from: LatLng, heading: number | null = null) {
    if (avoiding || state.rerouting || !state.target || Date.now() - lastReroute < rerouteWait) return;
    lastReroute = Date.now();
    const { id, signal } = newRouteRequest();
    const target = state.target;
    set({ rerouting: true });
    speak('Recalculating');
    try {
      const routes = await getRoutes(state.mode, from, target, { signal, heading, alternatives: true });
      if (id !== routeRequest || state.phase !== 'active') return;
      const route = routes[0];
      indexRoute(route);
      rerouteWait = REROUTE_MIN_INTERVAL_MS;
      set({
        route,
        routes: { ...state.routes, [state.mode]: route },
        alternatives: alternativesFor(route, routes),
        items: itemsFor(route),
        progress: null,
        rerouting: false,
        rerouteFailed: false,
      });
      persist(true);
      emit({ type: 'rerouted' });
    } catch {
      // Offline or service busy: keep the old route and try again shortly.
      if (id === routeRequest && state.phase === 'active') {
        rerouteWait = REROUTE_RETRY_MS;
        set({ rerouteFailed: true });
      }
    } finally {
      if (id === routeRequest && state.rerouting) set({ rerouting: false });
    }
  },

  /**
   * Switches to the fastest alternative route that stays clear of a hazard.
   * "none": no alternative misses it; "unavailable": the routing service
   * could not be reached (or the journey ended meanwhile).
   * Takes over from an automatic re-route still on its way.
   */
  async avoid(hazard: LatLng & { radius: number }, from: LatLng): Promise<AvoidResult> {
    if (state.phase !== 'active' || !state.target) return 'unavailable';
    const { id, signal } = newRouteRequest();
    avoiding = true;
    if (state.rerouting) set({ rerouting: false });
    try {
      // Valhalla routes around the hazard's core; OSRM's alternatives are checked against it.
      const core = { latitude: hazard.latitude, longitude: hazard.longitude, radius: hazardCore(hazard.radius) };
      const routes = await getRoutes(state.mode, from, state.target, { signal, alternatives: true, avoid: [core] });
      if (id !== routeRequest || state.phase !== 'active') return 'unavailable';
      const route = routeAvoiding(routes, hazard);
      if (!route) return 'none';
      indexRoute(route);
      set({
        route,
        routes: { ...state.routes, [state.mode]: route },
        alternatives: alternativesFor(route, routes.filter((r) => r !== route && routeAvoiding([r], hazard))),
        items: itemsFor(route),
        progress: null,
      });
      persist(true);
      speak('Taking a route around the hazard');
      emit({ type: 'rerouted' });
      return 'switched';
    } catch {
      return 'unavailable';
    } finally {
      if (id === routeRequest) avoiding = false;
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
    cancelRouteRequests();
    Speech.stop();
    storage.remove(StorageKeys.activeJourney);
    indexRoute(null);
    planned = {};
    askedAlternatives = new Set();
    set({ ...idle, voice: state.voice });
  },
};

export function useJourney() {
  return useSyncExternalStore(journeyStore.subscribe, journeyStore.get);
}

export function routeIndex() {
  return index;
}

let itemsCache = new WeakMap<Route, JourneyItem[]>();

/** Landmarks and hazards along any route (e.g. an alternative), worked out once per route. */
export function itemsAlong(route: Route): JourneyItem[] {
  let items = itemsCache.get(route);
  if (!items) {
    items = journeyItems(buildRouteIndex(route.coordinates), context.landmarks, context.alerts);
    itemsCache.set(route, items);
  }
  return items;
}
