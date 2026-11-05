import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';

import { translateDestination } from '@/features/ai/api';
import { readLocalDestinations } from '@/features/data/local-queries';
import { useDataSync } from '@/features/data/sync';
import { useLastLocation } from '@/features/location/location-store';
import { distanceMeters } from '@/lib/geo';
import { usePreferences, type ContentLocale } from '@/lib/preferences';
import { storage, StorageKeys } from '@/lib/storage';
import { supabase } from '@/lib/supabase';
import type { Destination, DestinationSummary, DestinationTranslation, RatingSummary } from '@/lib/types';

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

const SUMMARY_COLUMNS =
  'id,slug,name,name_ur,category,city,region,latitude,longitude,radius_m,short_description,image_url,is_landmark,popularity,featured,source';

/**
 * Translations are few (curated landmarks only), so they are fetched whole and
 * cached. Query data is saved to the phone as JSON, so it must be plain
 * objects and arrays: a Map would come back as {} after a restart.
 */
function useTranslations(locale: ContentLocale) {
  return useQuery({
    queryKey: ['destinations', 'translations', locale],
    enabled: locale !== 'en',
    queryFn: async () => {
      const { data, error } = await supabase.from('destination_translations').select('*').eq('locale', locale);
      if (error) throw error;
      return Object.fromEntries((data as DestinationTranslation[]).map((t) => [t.destination_id, t])) as Record<string, DestinationTranslation>;
    },
    staleTime: 1000 * 60 * 60,
  });
}

function localise<T extends DestinationSummary>(d: T, locale: ContentLocale, t: DestinationTranslation | undefined): T {
  if (locale === 'en') return d;
  const name = t?.name || (locale === 'ur' ? d.name_ur : null) || d.name;
  return { ...d, name, short_description: t?.short_description || d.short_description };
}

/**
 * Landmarks from the phone's local copy (see features/data/sync.ts), so the
 * map and alerts work offline. Until the first sync finishes, the most
 * popular landmarks are read straight from Supabase.
 */
async function loadSummaries(): Promise<DestinationSummary[]> {
  const local = await readLocalDestinations();
  if (local.length) return local;
  const { data, error } = await supabase
    .from('destinations')
    .select(SUMMARY_COLUMNS)
    .eq('active', true)
    .order('featured', { ascending: false })
    .order('popularity', { ascending: false })
    .limit(1000);
  if (error) throw error;
  return (data ?? []) as unknown as DestinationSummary[];
}

export function toLandmark(d: DestinationSummary): Landmark {
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

/** All landmarks in the selected content language. */
export function useDestinations() {
  const [prefs] = usePreferences();
  const { revision } = useDataSync();
  const translations = useTranslations(prefs.locale);
  const query = useQuery({
    queryKey: ['local-destinations', revision],
    queryFn: loadSummaries,
    staleTime: Infinity,
  });

  const data = useMemo(() => {
    if (!query.data) return undefined;
    if (prefs.locale === 'en') return query.data;
    const map = translations.data;
    return query.data.map((d) => localise(d, prefs.locale, map?.[d.id]));
  }, [query.data, prefs.locale, translations.data]);

  // Mirror a compact landmark list for the background geofencing task, which
  // cannot use React Query.
  useEffect(() => {
    if (data?.length) storage.set(StorageKeys.landmarkCache, data.map(toLandmark));
  }, [data]);

  return { ...query, data };
}

/** Summary of one landmark (from the local list). */
export function useDestination(id: string | undefined) {
  const list = useDestinations();
  const destination = useMemo(() => list.data?.find((d) => d.id === id || d.slug === id), [list.data, id]);
  return { ...list, destination };
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Full landmark record for the details screen. Fetched online and kept in the
 * persisted cache, so a landmark viewed once stays readable offline; before
 * that, the local summary is shown.
 */
export function useDestinationDetail(id: string | undefined) {
  const [prefs] = usePreferences();
  const { destination: summary } = useDestination(id);
  const translations = useTranslations(prefs.locale);
  const query = useQuery({
    queryKey: ['destinations', 'detail', id, prefs.locale],
    enabled: Boolean(id),
    queryFn: async (): Promise<Destination> => {
      const { data, error } = await supabase
        .from('destinations')
        .select('*')
        .eq(UUID.test(id!) ? 'id' : 'slug', id!)
        .single();
      if (error) throw error;
      const d = data as Destination;
      if (prefs.locale === 'en') return d;
      const { data: t } = await supabase
        .from('destination_translations')
        .select('*')
        .eq('destination_id', d.id)
        .eq('locale', prefs.locale)
        .maybeSingle();
      let tr = t as DestinationTranslation | null;
      // Urdu guide missing sections: ask for a translation (made once, then stored for everyone).
      const missing = (['description', 'history', 'significance', 'tips'] as const).some((f) => d[f] && !tr?.[f]);
      if (prefs.locale === 'ur' && missing) {
        tr = (await translateDestination(d.id).catch(() => null)) ?? tr;
      }
      return {
        ...localise(d, prefs.locale, tr ?? undefined),
        description: tr?.description || d.description,
        history: tr?.history || d.history,
        culture: tr?.culture || d.culture,
        significance: tr?.significance || d.significance,
        local_customs: tr?.local_customs || d.local_customs,
        food: tr?.food || d.food,
        shopping: tr?.shopping || d.shopping,
        tips: tr?.tips || d.tips,
        machine_translated: Boolean(tr?.machine_translated),
      };
    },
    staleTime: 1000 * 60 * 60,
  });

  const fallback = useMemo<Destination | undefined>(() => {
    if (!summary) return undefined;
    const t = translations.data?.[summary.id];
    return {
      ...summary,
      description: t?.description || summary.short_description,
      history: t?.history ?? null,
      culture: null,
      significance: t?.significance ?? null,
      local_customs: null,
      food: null,
      shopping: null,
      tips: t?.tips ?? null,
      opening_hours: null,
      entry_fee: null,
      best_time: null,
      wikipedia_url: null,
      image_credit: null,
      image_license: null,
      image_page_url: null,
    };
  }, [summary, translations.data]);

  return { ...query, destination: query.data ?? fallback, isFallback: !query.data && Boolean(fallback) };
}

export type DestinationWithDistance = DestinationSummary & { distance: number | null };

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
      // Plain object, not a Map: the cache is saved as JSON (see useTranslations).
      return Object.fromEntries((data as RatingSummary[]).map((r) => [r.destination_id, r])) as Record<string, RatingSummary>;
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function searchDestinations<T extends DestinationSummary>(list: T[], term: string): T[] {
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
