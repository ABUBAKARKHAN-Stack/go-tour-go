import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  ArrowUpDown,
  CircleDot,
  Clock,
  Globe,
  Landmark,
  MapPin,
  SearchX,
  ShieldCheck,
  X,
  type LucideIcon,
} from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, SectionList, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DestinationCard } from '@/components/destination-card';
import { Chip } from '@/components/form';
import { EmptyState, LoadingState } from '@/components/states';
import { Text, TextInput } from '@/components/text';
import { searchLocal } from '@/features/data/local-queries';
import { searchPhoton } from '@/features/data/photon';
import { useDataSync } from '@/features/data/sync';
import { useDestinationsByDistance, useRatings } from '@/features/destinations/api';
import { CATEGORY_ORDER, DESTINATION_CATEGORIES } from '@/features/destinations/categories';
import { navigateTo } from '@/features/routing/navigate';
import { formatDistance } from '@/lib/geo';
import { StorageKeys, useStorage } from '@/lib/storage';
import { supabase } from '@/lib/supabase';
import { colors } from '@/lib/theme';
import type { DestinationCategory } from '@/lib/types';

type Row =
  | { type: 'place'; id: string; name: string; subtitle: string; latitude: number; longitude: number; distance: number | null; online?: boolean }
  | { type: 'landmark'; id: string; name: string; subtitle: string; category: DestinationCategory; latitude: number; longitude: number; distance: number | null };

type Recent = { id: string; name: string; subtitle: string; latitude: number; longitude: number; landmarkId?: string };

const KIND_LABEL: Record<string, string> = {
  city: 'City',
  town: 'Town',
  village: 'Village',
  suburb: 'Area',
  borough: 'Area',
  quarter: 'Neighbourhood',
  neighbourhood: 'Neighbourhood',
  locality: 'Locality',
  hamlet: 'Village',
  university: 'University',
  college: 'College',
  hospital: 'Hospital',
  airport: 'Airport',
  railway_station: 'Railway station',
  bus_station: 'Bus station',
  mall: 'Shopping mall',
  stadium: 'Stadium',
};

function useDebounced<T>(value: T, ms: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

/**
 * "Plan a journey" search (design screen 07). Searches the phone's copy of
 * Pakistan's places and landmarks, so it works offline; streets and addresses
 * come from Photon when online and the local results are thin.
 */
export default function SearchScreen() {
  const params = useLocalSearchParams<{ q?: string; category?: DestinationCategory }>();
  const insets = useSafeAreaInsets();
  const [term, setTerm] = useState(params.q ?? '');
  const [category, setCategory] = useState<DestinationCategory | null>(params.category ?? null);
  const [recent, setRecent] = useStorage<Recent[]>(StorageKeys.recentSearches, []);
  const { sorted, location, isLoading } = useDestinationsByDistance();
  const ratings = useRatings();
  const sync = useDataSync();
  const q = useDebounced(term.trim(), 150);
  const slowQ = useDebounced(term.trim(), 450);
  const near = location ? { latitude: Math.round(location.latitude * 100) / 100, longitude: Math.round(location.longitude * 100) / 100 } : null;

  const local = useQuery({
    queryKey: ['search-local', q, sync.revision, near?.latitude, near?.longitude],
    enabled: q.length >= 2,
    queryFn: () => searchLocal(q, near),
    placeholderData: keepPreviousData,
    networkMode: 'always',
  });

  const localPlaces = local.data?.places.length ?? 0;
  const online = useQuery({
    queryKey: ['search-photon', slowQ, near?.latitude, near?.longitude],
    enabled: slowQ.length >= 3 && !local.isFetching && localPlaces < 5,
    queryFn: ({ signal }) => searchPhoton(slowQ, near, signal),
    staleTime: 1000 * 60 * 60,
    retry: false,
  });

  // Before the first sync has filled the phone's copy, ask the server.
  const remote = useQuery({
    queryKey: ['search-remote', q],
    enabled: q.length >= 2 && sync.counts.places === 0,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('search_places', {
        q,
        near_lat: near?.latitude ?? null,
        near_lng: near?.longitude ?? null,
        max_results: 20,
      });
      if (error) throw error;
      return data as { result_type: string; id: string; name: string; kind: string; area: string | null; latitude: number; longitude: number }[];
    },
    retry: false,
  });

  const sections = useMemo(() => {
    const places: Row[] = [];
    const landmarks: Row[] = [];
    const seen = new Set<string>();
    for (const p of local.data?.places ?? []) {
      seen.add(p.name.toLowerCase());
      places.push({
        type: 'place',
        id: p.id,
        name: p.name,
        subtitle: [KIND_LABEL[p.kind] ?? 'Place', p.district ?? p.province].filter(Boolean).join(' · '),
        latitude: p.latitude,
        longitude: p.longitude,
        distance: p.distance,
      });
    }
    for (const r of remote.data ?? []) {
      if (r.result_type === 'place' && !seen.has(r.name.toLowerCase())) {
        seen.add(r.name.toLowerCase());
        places.push({ type: 'place', id: r.id, name: r.name, subtitle: [KIND_LABEL[r.kind] ?? 'Place', r.area].filter(Boolean).join(' · '), latitude: r.latitude, longitude: r.longitude, distance: null });
      }
    }
    for (const o of online.data ?? []) {
      if (seen.has(o.name.toLowerCase())) continue;
      seen.add(o.name.toLowerCase());
      places.push({ type: 'place', id: o.id, name: o.name, subtitle: o.subtitle, latitude: o.latitude, longitude: o.longitude, distance: null, online: true });
    }
    for (const d of local.data?.landmarks ?? []) {
      landmarks.push({
        type: 'landmark',
        id: d.id,
        name: d.name,
        subtitle: `${DESTINATION_CATEGORIES[d.category].label} · ${d.city}`,
        category: d.category,
        latitude: d.latitude,
        longitude: d.longitude,
        distance: d.distance,
      });
    }
    return [
      { key: 'places', title: 'PLACES', data: places.slice(0, 12) },
      { key: 'landmarks', title: 'FAMOUS PLACES', data: landmarks.slice(0, 10) },
    ].filter((s) => s.data.length);
  }, [local.data, online.data, remote.data]);

  const remember = (r: Recent) => setRecent([r, ...recent.filter((x) => x.id !== r.id)].slice(0, 8));

  const choose = (row: Row) => {
    if (row.type === 'landmark') {
      remember({ id: row.id, name: row.name, subtitle: row.subtitle, latitude: row.latitude, longitude: row.longitude, landmarkId: row.id });
      router.push({ pathname: '/destination/[id]', params: { id: row.id } });
      return;
    }
    remember({ id: row.id, name: row.name, subtitle: row.subtitle, latitude: row.latitude, longitude: row.longitude });
    navigateTo({ id: `place:${row.id}`, name: row.name, latitude: row.latitude, longitude: row.longitude });
  };

  const openRecent = (r: Recent) => {
    if (r.landmarkId) router.push({ pathname: '/destination/[id]', params: { id: r.landmarkId } });
    else navigateTo({ id: `place:${r.id}`, name: r.name, latitude: r.latitude, longitude: r.longitude });
  };

  const browsing = q.length < 2;
  const browseList = category ? sorted.filter((d) => d.category === category).slice(0, 60) : [];
  const nearby = sorted.slice(0, 6);
  const searching = !browsing && (local.isFetching || remote.isFetching) && sections.length === 0;

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <View className="gap-4 px-5 pb-3 pt-2">
        <View className="flex-row items-center gap-3">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            hitSlop={8}
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
            className="h-11 w-11 items-center justify-center rounded-full border border-border bg-card"
          >
            <ArrowLeft color={colors.foreground} size={20} />
          </Pressable>
          <Text className="font-display text-2xl text-foreground">Plan a journey</Text>
        </View>

        <View className="flex-row items-center gap-3 rounded-3xl border border-border bg-card px-4 py-1">
          <View className="flex-1">
            <View className="min-h-14 flex-row items-center gap-3">
              <CircleDot color={colors.primary} size={20} />
              <View className="flex-1">
                <Text className="text-xs text-faint">From</Text>
                <Text numberOfLines={1} className="text-base font-semibold text-muted-foreground">
                  Your location
                </Text>
              </View>
            </View>
            <View className="h-px bg-border" />
            <View className="min-h-14 flex-row items-center gap-3">
              <MapPin color={colors.accent} size={20} />
              <View className="flex-1">
                <Text className="text-xs text-faint">To</Text>
                <TextInput
                  autoFocus={!params.category}
                  value={term}
                  onChangeText={setTerm}
                  placeholder="City, area, landmark or address"
                  placeholderTextColor={colors.faint}
                  className="p-0 text-base font-semibold text-foreground"
                  returnKeyType="search"
                  accessibilityLabel="Destination"
                />
              </View>
              {term ? (
                <Pressable accessibilityRole="button" accessibilityLabel="Clear" onPress={() => setTerm('')} hitSlop={10}>
                  <X color={colors.faint} size={18} />
                </Pressable>
              ) : null}
            </View>
          </View>
          <View className="h-10 w-10 items-center justify-center rounded-full bg-secondary opacity-40" accessibilityElementsHidden>
            <ArrowUpDown color={colors.foreground} size={18} />
          </View>
        </View>
      </View>

      {browsing ? (
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerClassName="gap-5 px-5" contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-5" contentContainerClassName="gap-2 px-5">
            <Chip label="All" selected={!category} onPress={() => setCategory(null)} />
            {CATEGORY_ORDER.map((c) => (
              <Chip key={c} label={DESTINATION_CATEGORIES[c].label} selected={category === c} onPress={() => setCategory(category === c ? null : c)} />
            ))}
          </ScrollView>

          {category ? (
            browseList.length ? (
              <View className="gap-2.5">
                {browseList.map((d) => (
                  <DestinationCard key={d.id} destination={d} distance={d.distance} rating={ratings.data?.get(d.id)?.average_rating} variant="row" />
                ))}
              </View>
            ) : isLoading ? (
              <LoadingState />
            ) : (
              <EmptyState icon={SearchX} title="Nothing here yet" message="No landmarks in this category have been added." />
            )
          ) : (
            <>
              {recent.length ? (
                <View className="gap-1">
                  <SectionTitle title="RECENT" action="Clear" onAction={() => setRecent([])} />
                  {recent.map((r) => (
                    <ResultRow key={r.id} icon={Clock} tint="muted" title={r.name} subtitle={r.subtitle} onPress={() => openRecent(r)} />
                  ))}
                </View>
              ) : null}
              {nearby.length ? (
                <View className="gap-1">
                  <SectionTitle title="FAMOUS PLACES NEAR YOU" />
                  {nearby.map((d) => (
                    <ResultRow
                      key={d.id}
                      icon={Landmark}
                      tint="primary"
                      title={d.name}
                      subtitle={`${DESTINATION_CATEGORIES[d.category].label} · ${d.city}`}
                      right={d.distance != null ? formatDistance(d.distance) : undefined}
                      onPress={() => router.push({ pathname: '/destination/[id]', params: { id: d.id } })}
                    />
                  ))}
                </View>
              ) : null}
              <OfflineNote places={sync.counts.places} />
            </>
          )}
        </ScrollView>
      ) : searching ? (
        <LoadingState label="Searching..." />
      ) : sections.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title="No matches"
          message={online.isFetching ? 'Still looking online...' : 'Try another spelling, or a nearby area or landmark.'}
        />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(r) => `${r.type}:${r.id}`}
          keyboardShouldPersistTaps="handled"
          stickySectionHeadersEnabled={false}
          contentContainerClassName="px-5"
          contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
          renderSectionHeader={({ section }) => <SectionTitle title={section.title} />}
          renderItem={({ item }) => (
            <ResultRow
              icon={item.type === 'landmark' ? Landmark : item.type === 'place' && item.online ? Globe : MapPin}
              tint={item.type === 'landmark' ? 'primary' : 'accent'}
              title={item.name}
              subtitle={item.subtitle}
              right={item.distance != null ? formatDistance(item.distance) : undefined}
              onPress={() => choose(item)}
            />
          )}
          ListFooterComponent={<OfflineNote places={sync.counts.places} />}
        />
      )}
    </View>
  );
}

function SectionTitle({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View className="flex-row items-center justify-between pb-1 pt-3">
      <Text className="text-[11px] font-bold tracking-[1.6px] text-faint">{title}</Text>
      {action ? (
        <Pressable accessibilityRole="button" onPress={onAction} hitSlop={8}>
          <Text className="text-xs font-semibold text-primary">{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function ResultRow({
  icon: Icon,
  tint,
  title,
  subtitle,
  right,
  onPress,
}: {
  icon: LucideIcon;
  tint: 'primary' | 'accent' | 'muted';
  title: string;
  subtitle?: string;
  right?: string;
  onPress: () => void;
}) {
  const box = tint === 'primary' ? 'bg-primary-soft' : tint === 'accent' ? 'bg-accent-soft' : 'bg-secondary';
  const color = tint === 'primary' ? colors.primary : tint === 'accent' ? colors.accent : colors.mutedForeground;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={[title, subtitle, right].filter(Boolean).join(', ')}
      onPress={onPress}
      className="min-h-14 flex-row items-center gap-3 py-2 active:opacity-70"
    >
      <View className={`h-10 w-10 items-center justify-center rounded-xl ${box}`}>
        <Icon color={color} size={19} />
      </View>
      <View className="flex-1">
        <Text numberOfLines={1} className="text-base font-semibold text-foreground">
          {title}
        </Text>
        {subtitle ? (
          <Text numberOfLines={1} className="text-xs text-faint">
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right ? <Text className="text-xs font-medium text-muted-foreground">{right}</Text> : null}
    </Pressable>
  );
}

function OfflineNote({ places }: { places: number }) {
  if (!places) return null;
  return (
    <View className="mt-4 flex-row items-center gap-2 rounded-2xl bg-muted px-3 py-2.5">
      <ShieldCheck color={colors.success} size={16} />
      <Text className="flex-1 text-xs text-muted-foreground">
        Search works offline across {places.toLocaleString()} places in Pakistan
      </Text>
    </View>
  );
}
