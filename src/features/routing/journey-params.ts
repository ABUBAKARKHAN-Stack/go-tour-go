/**
 * Journey route params (pure, unit tested): the two ends of a journey, each
 * the traveller ("me") or a place, to and from URL params.
 */
export type Target = { id: string; name: string; latitude: number; longitude: number; subtitle?: string };
/** One end of a journey: the traveller ("Your location") or a place. */
export type JourneyEnd = 'me' | Target;

/** Journey preview route params (all strings, as in the URL). */
export type JourneyParams = {
  name?: string;
  lat?: string;
  lng?: string;
  id?: string;
  subtitle?: string;
  /** "1": the place above is the start and the route ends at your location. */
  reverse?: string;
  fromName?: string;
  fromLat?: string;
  fromLng?: string;
  fromId?: string;
  fromSubtitle?: string;
};

function placeParams(t: Target, prefix: '' | 'from'): Record<string, string> {
  const key = (k: string) => (prefix ? `${prefix}${k.charAt(0).toUpperCase()}${k.slice(1)}` : k);
  return {
    [key('name')]: t.name,
    [key('lat')]: String(t.latitude),
    [key('lng')]: String(t.longitude),
    [key('id')]: t.id,
    ...(t.subtitle ? { [key('subtitle')]: t.subtitle } : {}),
  };
}

/** Route params for a journey between two ends (at least one a place). */
export function journeyParams(from: JourneyEnd, to: JourneyEnd): Record<string, string> {
  if (to === 'me') return from === 'me' ? {} : { ...placeParams(from, ''), reverse: '1' };
  return from === 'me' ? placeParams(to, '') : { ...placeParams(to, ''), ...placeParams(from, 'from') };
}

function place(name?: string, lat?: string, lng?: string, id?: string, subtitle?: string): Target | null {
  const latitude = Number(lat);
  const longitude = Number(lng);
  if (!name || !lat || !lng || !Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  return { name, latitude, longitude, id: id ?? `pin:${latitude.toFixed(5)}, ${longitude.toFixed(5)}`, ...(subtitle ? { subtitle } : {}) };
}

/** One place from route params: the destination fields, or the `from*` ones. */
export function readPlace(p: JourneyParams, which: 'to' | 'from'): Target | null {
  return which === 'to' ? place(p.name, p.lat, p.lng, p.id, p.subtitle) : place(p.fromName, p.fromLat, p.fromLng, p.fromId, p.fromSubtitle);
}

/** Route params for a single place as the start (`from`) or the destination (`to`). */
export function placeOnly(t: Target, which: 'to' | 'from'): Record<string, string> {
  return placeParams(t, which === 'to' ? '' : 'from');
}

/** Reads the two ends back from journey route params (null: an end is missing). */
export function parseJourneyParams(p: JourneyParams): { from: JourneyEnd; to: JourneyEnd } | null {
  const main = place(p.name, p.lat, p.lng, p.id, p.subtitle);
  if (!main) return null;
  if (p.reverse === '1') return { from: main, to: 'me' };
  const from = place(p.fromName, p.fromLat, p.fromLng, p.fromId, p.fromSubtitle);
  return { from: from ?? 'me', to: main };
}
