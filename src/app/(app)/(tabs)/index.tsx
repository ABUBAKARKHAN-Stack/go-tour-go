import { router } from 'expo-router';
import {
  Bell,
  Bookmark,
  Compass,
  Download,
  MapPin,
  MapPinned,
  ScanEye,
  ScanLine,
  Search,
  ShieldAlert,
  Sparkles,
  TriangleAlert,
  Users,
  type LucideIcon,
} from 'lucide-react-native';
import { useMemo } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';

import { IconButton } from '@/components/app-button';
import { DestinationCard } from '@/components/destination-card';
import { Card, SectionHeader } from '@/components/form';
import { Screen } from '@/components/screen';
import { ErrorState, LoadingState } from '@/components/states';
import { WeatherCard } from '@/components/weather-card';
import { ALERT_LABELS, useRoadAlerts } from '@/features/alerts/api';
import { useAuth } from '@/features/auth/auth-provider';
import { useDestinationsByDistance, useRatings } from '@/features/destinations/api';
import { CATEGORY_ORDER, DESTINATION_CATEGORIES } from '@/features/destinations/categories';
import { useUnreadCount } from '@/features/inbox/api';
import { LocationStatusCard } from '@/features/location/location-status-card';
import { useProximityCard } from '@/features/proximity/proximity-store';
import { useSavedIds } from '@/features/saved/api';
import { TRIP_STATUSES, useTrips } from '@/features/trips/api';
import { formatDistance } from '@/lib/geo';
import { colors, severityColors } from '@/lib/theme';

const SHORTCUTS: { label: string; icon: LucideIcon; href: string }[] = [
  { label: 'Map', icon: Compass, href: '/explore' },
  { label: 'Nearby', icon: MapPinned, href: '/nearby' },
  { label: 'AI Guide', icon: Sparkles, href: '/assistant' },
  { label: 'Lens', icon: ScanEye, href: '/lens' },
  { label: 'Scan', icon: ScanLine, href: '/scan' },
  { label: 'Safety', icon: ShieldAlert, href: '/safety' },
  { label: 'Friends', icon: Users, href: '/friends' },
  { label: 'Offline', icon: Download, href: '/offline-maps' },
];

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

export default function Home() {
  const { profile } = useAuth();
  const { sorted, location, isLoading, isError, error, refetch, isRefetching } = useDestinationsByDistance();
  const ratings = useRatings();
  const alerts = useRoadAlerts();
  const trips = useTrips();
  const saved = useSavedIds();
  const unread = useUnreadCount();
  const proximity = useProximityCard();

  const near = location ? sorted.slice(0, 8) : [];
  const popular = useMemo(() => [...sorted].sort((a, b) => b.popularity - a.popularity).slice(0, 8), [sorted]);
  const savedPlaces = useMemo(() => sorted.filter((d) => saved.data?.includes(d.id)).slice(0, 8), [sorted, saved.data]);
  const current = (trips.data ?? []).filter((t) => t.status === 'in_progress');
  const upcoming = (trips.data ?? []).filter((t) => t.status === 'todo');
  const byId = useMemo(() => new Map(sorted.map((d) => [d.id, d])), [sorted]);
  const insideNames = proximity.inside.map((h) => byId.get(h.id)?.name).filter(Boolean);
  const urgent = (alerts.data ?? []).filter((a) => a.severity === 'critical' || a.severity === 'high').slice(0, 2);

  return (
    <Screen
      inTabs
      headerless
      contentClassName="px-4 gap-5 pt-2"
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          tintColor={colors.accent}
          onRefresh={() => {
            refetch();
            alerts.refetch();
            trips.refetch();
          }}
        />
      }
    >
      <View className="flex-row items-center gap-3 pt-2">
        <View className="flex-1">
          <Text className="text-sm text-muted-foreground">{greeting()},</Text>
          <Text numberOfLines={1} className="text-2xl font-extrabold text-foreground">
            {profile?.full_name?.split(' ')[0] ?? 'Traveler'}
          </Text>
        </View>
        <IconButton icon={Bell} label="Notifications" badge={unread} onPress={() => router.push('/notifications')} />
      </View>

      <Pressable
        accessibilityRole="search"
        onPress={() => router.push('/search')}
        className="min-h-12 flex-row items-center gap-2 rounded-2xl border border-border/30 bg-card px-4"
      >
        <Search color={colors.mutedForeground} size={18} />
        <Text className="text-base text-muted-foreground">Where to next?</Text>
      </Pressable>

      {insideNames.length ? (
        <Pressable
          onPress={() => router.push({ pathname: '/destination/[id]', params: { id: proximity.inside[0].id } })}
          className="flex-row items-center gap-3 rounded-3xl border border-accent/50 bg-accent/15 p-4"
        >
          <MapPin color={colors.accent} size={20} />
          <View className="flex-1">
            <Text className="text-xs font-bold uppercase text-accent">You&apos;re near</Text>
            <Text numberOfLines={1} className="text-base font-semibold text-foreground">
              {insideNames.join(' · ')}
            </Text>
          </View>
        </Pressable>
      ) : null}

      <LocationStatusCard />

      <View className="flex-row flex-wrap justify-between gap-y-3">
        {SHORTCUTS.map((s) => (
          <Pressable
            key={s.label}
            accessibilityRole="button"
            accessibilityLabel={s.label}
            onPress={() => router.push(s.href as never)}
            className="w-[23%] items-center gap-1.5 active:opacity-70"
          >
            <View className="h-14 w-14 items-center justify-center rounded-2xl bg-secondary">
              <s.icon color={colors.accent} size={22} />
            </View>
            <Text numberOfLines={1} className="text-xs text-foreground">
              {s.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {urgent.length ? (
        <View className="gap-2">
          <SectionHeader title="Travel alerts" actionLabel="See all" onAction={() => router.push('/alerts')} />
          {urgent.map((a) => (
            <Pressable key={a.id} onPress={() => router.push('/alerts')} className="flex-row items-center gap-3 rounded-2xl bg-card p-3" style={{ borderLeftWidth: 4, borderLeftColor: severityColors[a.severity] }}>
              <TriangleAlert color={severityColors[a.severity]} size={18} />
              <View className="flex-1">
                <Text numberOfLines={1} className="text-sm font-semibold text-foreground">
                  {a.title}
                </Text>
                <Text className="text-xs text-muted-foreground">
                  {ALERT_LABELS[a.alert_type]} · {a.city ?? a.region}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>
      ) : null}

      <WeatherCard point={location} title="Weather where you are" />

      {current.length || upcoming.length ? (
        <Card className="gap-2">
          <SectionHeader title="Your trip" actionLabel="Open" onAction={() => router.navigate('/trips')} />
          {[...current, ...upcoming].slice(0, 3).map((t) => {
            const d = byId.get(t.destination_id);
            if (!d) return null;
            return (
              <Pressable key={t.id} onPress={() => router.push({ pathname: '/destination/[id]', params: { id: d.id } })} className="min-h-11 flex-row items-center gap-2">
                <View className={`h-2.5 w-2.5 rounded-full ${t.status === 'in_progress' ? 'bg-accent' : 'bg-muted-foreground'}`} />
                <Text numberOfLines={1} className="flex-1 text-sm text-foreground">
                  {d.name}
                </Text>
                <Text className="text-xs text-muted-foreground">{TRIP_STATUSES.find((s) => s.value === t.status)?.label}</Text>
              </Pressable>
            );
          })}
        </Card>
      ) : null}

      <View className="gap-3">
        <SectionHeader title="Categories" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-3">
          {CATEGORY_ORDER.map((c) => {
            const meta = DESTINATION_CATEGORIES[c];
            return (
              <Pressable
                key={c}
                onPress={() => router.push({ pathname: '/search', params: { category: c } })}
                className="w-24 items-center gap-2 rounded-2xl bg-card py-3"
              >
                <meta.icon color={meta.color} size={22} />
                <Text className="text-xs text-foreground">{meta.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {isLoading && sorted.length === 0 ? (
        <LoadingState label="Loading destinations..." />
      ) : isError && sorted.length === 0 ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : (
        <>
          {near.length ? (
            <View className="gap-3">
              <SectionHeader title="Near you" actionLabel="Map" onAction={() => router.navigate('/explore')} />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-3">
                {near.map((d) => (
                  <DestinationCard key={d.id} destination={d} distance={d.distance} />
                ))}
              </ScrollView>
              {near[0]?.distance != null && near[0].distance > 50_000 ? (
                <Text className="text-xs text-muted-foreground">
                  The closest GoTourGo destination is {formatDistance(near[0].distance)} away.
                </Text>
              ) : null}
            </View>
          ) : null}

          <View className="gap-3">
            <SectionHeader title="Popular destinations" actionLabel="See all" onAction={() => router.push('/search')} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-3">
              {popular.map((d) => (
                <DestinationCard key={d.id} destination={d} distance={d.distance} rating={ratings.data?.get(d.id)?.average_rating} />
              ))}
            </ScrollView>
          </View>

          <View className="gap-3">
            <SectionHeader title="Saved places" actionLabel={savedPlaces.length ? 'See all' : undefined} onAction={() => router.push('/saved')} />
            {savedPlaces.length ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-3">
                {savedPlaces.map((d) => (
                  <DestinationCard key={d.id} destination={d} distance={d.distance} />
                ))}
              </ScrollView>
            ) : (
              <Card className="flex-row items-center gap-3">
                <Bookmark color={colors.accent} size={18} />
                <Text className="flex-1 text-sm text-muted-foreground">No saved places yet. Tap the bookmark on any destination.</Text>
              </Card>
            )}
          </View>
        </>
      )}
    </Screen>
  );
}
