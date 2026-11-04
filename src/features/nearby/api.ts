import { useQuery } from '@tanstack/react-query';

import { distanceMeters } from '@/lib/geo';
import { supabase } from '@/lib/supabase';
import type { NearbyService, ServiceCategory } from '@/lib/types';

/**
 * Nearby services: live OpenStreetMap data from the free Overpass API, with
 * the seeded `nearby_services` table as a fallback when Overpass is slow,
 * rate-limited or offline. Results are cached per ~1 km cell for 15 minutes.
 */
const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';

const OSM_FILTERS: Record<ServiceCategory, string> = {
  restaurant: 'nwr["amenity"~"^(restaurant|cafe|fast_food)$"]',
  hotel: 'nwr["tourism"~"^(hotel|guest_house|hostel)$"]',
  hospital: 'nwr["amenity"~"^(hospital|clinic)$"]',
  police: 'nwr["amenity"="police"]',
  fuel: 'nwr["amenity"="fuel"]',
  atm: 'nwr["amenity"~"^(atm|bank)$"]',
  pharmacy: 'nwr["amenity"="pharmacy"]',
  shopping: 'nwr["shop"~"^(mall|supermarket|department_store)$"]',
  attraction: 'nwr["tourism"~"^(attraction|museum|viewpoint)$"]',
};

export function buildOverpassQuery(category: ServiceCategory, lat: number, lng: number, radius: number) {
  return `[out:json][timeout:15];${OSM_FILTERS[category]}(around:${radius},${lat},${lng});out center 40;`;
}

type OsmElement = {
  id: number;
  type: string;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};

async function fromOverpass(category: ServiceCategory, lat: number, lng: number, radius: number): Promise<NearbyService[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);
  try {
    const res = await fetch(OVERPASS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'GoTourGo-FYP/1.0' },
      body: `data=${encodeURIComponent(buildOverpassQuery(category, lat, lng, radius))}`,
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`Overpass ${res.status}`);
    const json = (await res.json()) as { elements?: OsmElement[] };
    return (json.elements ?? [])
      .map((e) => {
        const la = e.lat ?? e.center?.lat;
        const lo = e.lon ?? e.center?.lon;
        if (la == null || lo == null) return null;
        const t = e.tags ?? {};
        return {
          id: `osm-${e.type}-${e.id}`,
          name: t['name:en'] || t.name || t.brand || defaultName(category),
          category,
          city: t['addr:city'] ?? '',
          latitude: la,
          longitude: lo,
          address: [t['addr:street'], t['addr:city']].filter(Boolean).join(', ') || null,
          phone: t.phone || t['contact:phone'] || null,
          rating: null,
          source: 'osm' as const,
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);
  } finally {
    clearTimeout(timeout);
  }
}

function defaultName(c: ServiceCategory) {
  return { restaurant: 'Restaurant', hotel: 'Hotel', hospital: 'Hospital', police: 'Police station', fuel: 'Fuel station', atm: 'ATM', pharmacy: 'Pharmacy', shopping: 'Shopping', attraction: 'Attraction' }[c];
}

async function fromSeed(category: ServiceCategory): Promise<NearbyService[]> {
  const { data, error } = await supabase.from('nearby_services').select('*').eq('category', category).limit(200);
  if (error) throw error;
  return (data ?? []).map((d) => ({ ...(d as Omit<NearbyService, 'source'>), source: 'seed' as const }));
}

export function useNearbyServices(category: ServiceCategory, point: { latitude: number; longitude: number } | null, radius = 3000) {
  const lat = point ? Math.round(point.latitude * 100) / 100 : null;
  const lng = point ? Math.round(point.longitude * 100) / 100 : null;
  return useQuery({
    queryKey: ['nearby', category, lat, lng, radius],
    enabled: lat != null && lng != null,
    staleTime: 15 * 60_000,
    retry: 0,
    queryFn: async () => {
      let items: NearbyService[] = [];
      let source: 'osm' | 'seed' = 'osm';
      try {
        items = await fromOverpass(category, lat!, lng!, radius);
      } catch {
        items = [];
      }
      if (items.length === 0) {
        source = 'seed';
        items = (await fromSeed(category)).filter((s) => distanceMeters(point!, s) <= Math.max(radius, 15_000));
      }
      const withDistance = items
        .map((s) => ({ ...s, distance: distanceMeters(point!, s) }))
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 40);
      return { items: withDistance, source };
    },
  });
}
