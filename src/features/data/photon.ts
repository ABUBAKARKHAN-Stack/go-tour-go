import { tx } from '@/lib/i18n';
import { COUNTRY, SERVICES } from '@/constants/app.constants';
/**
 * Online fallback for streets and addresses that are not in the local place
 * list, using Photon (photon.komoot.io, OpenStreetMap data, free and keyless).
 * Called only after the user pauses typing and only when the local results
 * are thin, to stay well inside its fair-use limits.
 */
const PHOTON_URL = SERVICES.photon;
const PAKISTAN_BBOX = COUNTRY.bbox.join(',');

export type OnlinePlace = {
  id: string;
  name: string;
  subtitle: string;
  kind: string;
  latitude: number;
  longitude: number;
};

type PhotonFeature = {
  geometry: { coordinates: [number, number] };
  properties: {
    osm_type?: string;
    osm_id?: number;
    osm_value?: string;
    name?: string;
    street?: string;
    housenumber?: string;
    district?: string;
    locality?: string;
    city?: string;
    county?: string;
    state?: string;
    countrycode?: string;
  };
};

export function parsePhoton(json: { features?: PhotonFeature[] }): OnlinePlace[] {
  const seen = new Set<string>();
  const out: OnlinePlace[] = [];
  for (const f of json.features ?? []) {
    const p = f.properties ?? {};
    if (p.countrycode && p.countrycode.toUpperCase() !== 'PK') continue;
    const name = p.name || [p.housenumber, p.street].filter(Boolean).join(' ');
    if (!name) continue;
    const id = `photon:${p.osm_type ?? 'x'}${p.osm_id ?? out.length}`;
    if (seen.has(id)) continue;
    seen.add(id);
    const area = [p.street && p.name ? p.street : null, p.district ?? p.locality, p.city ?? p.county, p.state]
      .filter((x, i, all) => x && all.indexOf(x) === i)
      .join(', ');
    out.push({
      id,
      name,
      subtitle: area,
      kind: p.osm_value ?? 'place',
      latitude: f.geometry.coordinates[1],
      longitude: f.geometry.coordinates[0],
    });
  }
  return out;
}

export async function searchPhoton(
  q: string,
  near: { latitude: number; longitude: number } | null,
  signal?: AbortSignal,
): Promise<OnlinePlace[]> {
  const params = new URLSearchParams({ q, limit: '8', lang: 'en', bbox: PAKISTAN_BBOX });
  if (near) {
    params.set('lat', near.latitude.toFixed(4));
    params.set('lon', near.longitude.toFixed(4));
  }
  const res = await fetch(`${PHOTON_URL}?${params.toString()}`, { signal, headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(tx('Address search unavailable ({0}).', { 0: res.status }));
  return parsePhoton(await res.json());
}
