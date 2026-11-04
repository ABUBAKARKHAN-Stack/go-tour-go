import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';

import { useLastLocation } from '@/features/location/location-store';
import { distanceMeters } from '@/lib/geo';
import { usePreferences, type ContentLocale } from '@/lib/preferences';
import { storage, StorageKeys } from '@/lib/storage';
import { supabase } from '@/lib/supabase';
import type { Destination, DestinationTranslation, RatingSummary } from '@/lib/types';

/** Compact landmark record used by the proximity engine and background task. */
export type Landmark = {
  id: string;
  name: string;
  shortDescription: string;
  category: Destination['category'];
  latitude: number;
  longitude: number;
  radius: number;
};

async function fetchDestinations(locale: ContentLocale): Promise<Destination[]> {
  const { data, error } = await supabase
    .from('destinations')
    .select('*')
    .order('popularity', { ascending: false })
    .limit(500);
  if (error) throw error;
  const rows = (data ?? []) as Destination[];
  if (locale === 'en') return rows;

  const { data: tr, error: trError } = await supabase
    .from('destination_translations')
    .select('*')
    .eq('locale', locale);
  if (trError) return rows; // fall back to English content
  const byId = new Map((tr as DestinationTranslation[]).map((t) => [t.destination_id, t]));
  return rows.map((d) => {
    const t = byId.get(d.id);
    if (!t) return d;
    return {
      ...d,
      name: t.name || d.name,
      short_description: t.short_description || d.short_description,
      description: t.description || d.description,
      history: t.history || d.history,
      significance: t.significance || d.significance,
      tips: t.tips || d.tips,
    };
  });
}

export function toLandmark(d: Destination): Landmark {
  return {
    id: d.id,
    name: d.name,
    shortDescription: d.short_description,
    category: d.category,
    latitude: d.latitude,
    longitude: d.longitude,
    radius: d.radius_m,
  };
}

/** All destinations in the selected content language (cached + persisted offline). */
export function useDestinations() {
  const [prefs] = usePreferences();
  const query = useQuery({
    queryKey: ['destinations', prefs.locale],
    queryFn: () => fetchDestinations(prefs.locale),
    staleTime: 1000 * 60 * 30,
  });

  // Mirror a compact landmark list for the background geofencing task, which
  // cannot use React Query.
  useEffect(() => {
    if (query.data?.length) storage.set(StorageKeys.landmarkCache, query.data.map(toLandmark));
  }, [query.data]);

  return query;
}

export function useDestination(id: string | undefined) {
  const list = useDestinations();
  const destination = useMemo(() => list.data?.find((d) => d.id === id || d.slug === id), [list.data, id]);
  return { ...list, destination };
}

export type DestinationWithDistance = Destination & { distance: number | null };

/** Destinations sorted by distance from the last known location (if any). */
export function useDestinationsByDistance() {
  const list = useDestinations();
  const location = useLastLocation();
  // Recompute only when the user moved meaningfully (~100 m grid), not on every fix.
  const latKey = location ? Math.round(location.latitude * 1000) : null;
  const lngKey = location ? Math.round(location.longitude * 1000) : null;
  const sorted = useMemo<DestinationWithDistance[]>(() => {
    const rows = list.data ?? [];
    if (latKey == null || lngKey == null) return rows.map((d) => ({ ...d, distance: null }));
    const here = { latitude: latKey / 1000, longitude: lngKey / 1000 };
    return rows
      .map((d) => ({ ...d, distance: distanceMeters(here, d) }))
      .sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));
  }, [list.data, latKey, lngKey]);
  return { ...list, sorted, location };
}

export function useRatings() {
  return useQuery({
    queryKey: ['ratings'],
    queryFn: async () => {
      const { data, error } = await supabase.from('destination_rating_summary').select('*');
      if (error) throw error;
      return new Map((data as RatingSummary[]).map((r) => [r.destination_id, r]));
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function searchDestinations(list: Destination[], term: string): Destination[] {
  const q = term.trim().toLowerCase();
  if (!q) return list;
  return list.filter(
    (d) =>
      d.name.toLowerCase().includes(q) ||
      d.city.toLowerCase().includes(q) ||
      d.region.toLowerCase().includes(q) ||
      d.category.includes(q) ||
      d.short_description.toLowerCase().includes(q),
  );
}
