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
