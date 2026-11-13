import { hasArabicScript, likePattern, scoreMatch, squash } from '@/features/data/search-text';
import { distanceMeters } from '@/lib/geo';
import { localDb } from '@/lib/local-db';
import type { DestinationCategory, DestinationSummary, Place } from '@/lib/types';

type DestinationRow = Omit<DestinationSummary, 'is_landmark' | 'featured'> & { is_landmark: number; featured: number };

function toSummary(r: DestinationRow): DestinationSummary {
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    name_ur: r.name_ur,
    category: r.category as DestinationCategory,
    city: r.city,
    region: r.region,
    latitude: r.latitude,
    longitude: r.longitude,
    radius_m: r.radius_m,
    short_description: r.short_description,
    image_url: r.image_url,
    is_landmark: r.is_landmark === 1,
    popularity: r.popularity,
    featured: r.featured === 1,
    source: r.source,
  };
}

const DESTINATION_SELECT =
  'SELECT id,slug,name,name_ur,category,city,region,latitude,longitude,radius_m,short_description,image_url,is_landmark,popularity,featured,source FROM destinations';

/** Every landmark on the phone, featured and most popular first. */
export async function readLocalDestinations(): Promise<DestinationSummary[]> {
  const rows = await localDb().getAllAsync<DestinationRow>(`${DESTINATION_SELECT} ORDER BY featured DESC, popularity DESC`);
  return rows.map(toSummary);
}

export type PlaceResult = Place & { distance: number | null; score: number };
export type LandmarkResult = DestinationSummary & { distance: number | null; score: number };

type Point = { latitude: number; longitude: number } | null | undefined;

/** Offline search over the phone's places and landmarks. */
export async function searchLocal(text: string, near: Point, limit = 20): Promise<{ places: PlaceResult[]; landmarks: LandmarkResult[] }> {
  const term = text.trim();
  const q = squash(term);
  if (q.length < 2) return { places: [], landmarks: [] };
  const db = localDb();
  const pattern = likePattern(q);
  const urdu = hasArabicScript(term) ? `%${term}%` : null;

  const placeRows = await db.getAllAsync<Place & { name_norm: string }>(
    `SELECT id,name,name_norm,name_ur,kind,district,province,latitude,longitude,rank FROM places
      WHERE name_norm LIKE ? ESCAPE '\\' ${urdu ? 'OR name_ur LIKE ?' : ''} LIMIT 300`,
    urdu ? [pattern, urdu] : [pattern],
  );
  const landmarkRows = await db.getAllAsync<DestinationRow & { name_norm: string }>(
    `SELECT id,slug,name,name_norm,name_ur,category,city,region,latitude,longitude,radius_m,short_description,image_url,is_landmark,popularity,featured,source
       FROM destinations WHERE name_norm LIKE ? ESCAPE '\\' ${urdu ? 'OR name_ur LIKE ?' : ''} LIMIT 200`,
    urdu ? [pattern, urdu] : [pattern],
  );

  const dist = (lat: number, lng: number) => (near ? distanceMeters(near, { latitude: lat, longitude: lng }) : null);

  const places = placeRows
    .map(({ name_norm, ...p }) => {
      const distance = dist(p.latitude, p.longitude);
      return { ...p, distance, score: scoreMatch(name_norm, q, p.rank, distance) };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  const landmarks = landmarkRows
    .map(({ name_norm, ...r }) => {
      const d = toSummary(r);
      const distance = dist(d.latitude, d.longitude);
      return { ...d, distance, score: scoreMatch(name_norm, q, d.popularity + (d.featured ? 20 : 0), distance) };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return { places, landmarks };
}

/** What a spot on the map is called: a landmark there, else the nearest named place. */
export type SpotName =
  | { kind: 'landmark'; id: string; name: string; subtitle: string }
  | { kind: 'place'; name: string; subtitle: string; distance: number }
  | { kind: 'none' };

/**
 * Names a picked spot from the phone's own copy of places and landmarks (no
 * network): a landmark whose area it is in, else the nearest place within
 * 5 km ("Near Gulberg, Lahore").
 */
export async function nameSpot(point: { latitude: number; longitude: number }): Promise<SpotName> {
  const db = localDb();
  // About 5 km around the point (a degree of latitude is ~111 km).
  const dLat = 0.05;
  const dLng = 0.05 / Math.max(0.2, Math.cos((point.latitude * Math.PI) / 180));
  const box = [point.latitude - dLat, point.latitude + dLat, point.longitude - dLng, point.longitude + dLng];

  const landmarks = await db.getAllAsync<{ id: string; name: string; city: string; latitude: number; longitude: number; radius_m: number }>(
    'SELECT id,name,city,latitude,longitude,radius_m FROM destinations WHERE latitude BETWEEN ? AND ? AND longitude BETWEEN ? AND ?',
    box,
  );
  const inside = landmarks
    .map((l) => ({ l, d: distanceMeters(point, l) }))
    .filter(({ l, d }) => d <= Math.min(l.radius_m, 500))
    .sort((a, b) => a.d - b.d)[0];
  if (inside) return { kind: 'landmark', id: inside.l.id, name: inside.l.name, subtitle: inside.l.city };

  const places = await db.getAllAsync<Place>(
    'SELECT id,name,name_ur,kind,district,province,latitude,longitude,rank FROM places WHERE latitude BETWEEN ? AND ? AND longitude BETWEEN ? AND ?',
    box,
  );
  const nearest = places.map((p) => ({ p, d: distanceMeters(point, p) })).sort((a, b) => a.d - b.d)[0];
  if (!nearest || nearest.d > 5000) return { kind: 'none' };
  const area = [nearest.p.district, nearest.p.province].filter((x) => x && x !== nearest.p.name).join(', ');
  return { kind: 'place', name: nearest.p.name, subtitle: area, distance: nearest.d };
}
