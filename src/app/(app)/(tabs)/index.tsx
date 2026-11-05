import { router } from 'expo-router';
import {
  Bell,
  Bookmark,
  Download,
  MapPinned,
  Navigation,
  ScanEye,
  ScanLine,
  Search,
  ShieldAlert,
  SlidersHorizontal,
  Sparkles,
  TriangleAlert,
  Users,
  type LucideIcon,
} from 'lucide-react-native';
import { useMemo } from 'react';
import { Pressable, RefreshControl, ScrollView, View } from 'react-native';

import { Avatar } from '@/components/avatar';
import { IconButton } from '@/components/app-button';
import { DestinationCard } from '@/components/destination-card';
import { DestinationImage } from '@/components/destination-image';
import { Card, Chip, SectionHeader } from '@/components/form';
import { Screen } from '@/components/screen';
import { ErrorState, LoadingState } from '@/components/states';
import { Text } from '@/components/text';
import { WeatherCard } from '@/components/weather-card';
import { ALERT_LABELS, useRoadAlerts } from '@/features/alerts/api';
import { useAuth } from '@/features/auth/auth-provider';
import { useDestinationsByDistance, useRatings } from '@/features/destinations/api';
import { CATEGORY_ORDER, DESTINATION_CATEGORIES } from '@/features/destinations/categories';
import { useUnreadCount } from '@/features/inbox/api';
import { LocationStatusCard } from '@/features/location/location-status-card';
import { useProximityCard } from '@/features/proximity/proximity-store';
import { navigateTo } from '@/features/routing/navigate';
import { useSavedIds } from '@/features/saved/api';
import { TRIP_STATUSES, useTrips } from '@/features/trips/api';
import { useWeather } from '@/features/weather/api';
import { formatDistance } from '@/lib/geo';
import { colors, severityColors } from '@/lib/theme';
import { tx } from '@/lib/i18n';

const SHORTCUTS: { label: string; icon: LucideIcon; href: string }[] = [
  { label: tx('Nearby'), icon: MapPinned, href: '/nearby' },
  { label: tx('AI guide'), icon: Sparkles, href: '/assistant' },
  { label: tx('Lens'), icon: ScanEye, href: '/lens' },
  { label: tx('Scan'), icon: ScanLine, href: '/scan' },
  { label: tx('Safety'), icon: ShieldAlert, href: '/safety' },
  { label: tx('Friends'), icon: Users, href: '/friends' },
  { label: tx('Offline'), icon: Download, href: '/offline-maps' },
  { label: tx('Saved'), icon: Bookmark, href: '/saved' },
];

const WEEKDAYS = [tx('SUNDAY'), tx('MONDAY'), tx('TUESDAY'), tx('WEDNESDAY'), tx('THURSDAY'), tx('FRIDAY'), tx('SATURDAY')];
/** Within this distance the nearest landmark's city names "where you are". */
const CITY_RADIUS_M = 40_000;
/** The highlighted card shows the closest landmark within this distance. */
const SPOTLIGHT_RADIUS_M = 5_000;

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? tx('Good morning') : h < 17 ? tx('Good afternoon') : tx('Good evening');
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
  const weather = useWeather(location);

  const near = location ? sorted.slice(0, 8) : [];
  const popular = useMemo(() => [...sorted].sort((a, b) => b.popularity - a.popularity).slice(0, 8), [sorted]);
  const savedPlaces = useMemo(() => sorted.filter((d) => saved.data?.includes(d.id)).slice(0, 8), [sorted, saved.data]);
  const current = (trips.data ?? []).filter((t) => t.status === 'in_progress');
  const upcoming = (trips.data ?? []).filter((t) => t.status === 'todo');
  const byId = useMemo(() => new Map(sorted.map((d) => [d.id, d])), [sorted]);
  const urgent = (alerts.data ?? []).filter((a) => a.severity === 'critical' || a.severity === 'high').slice(0, 2);

  const insideId = proximity.inside[0]?.id;
  const spotlight =
    (insideId ? sorted.find((d) => d.id === insideId) : undefined) ??
    (near[0]?.distance != null && near[0].distance <= SPOTLIGHT_RADIUS_M ? near[0] : undefined);
  const city = near[0]?.distance != null && near[0].distance <= CITY_RADIUS_M ? near[0].city : null;
  const context = [WEEKDAYS[new Date().getDay()], weather.data ? `${Math.round(weather.data.temperature)}°` : null, city?.toUpperCase()]
    .filter(Boolean)
    .join(' · ');
  const firstName = profile?.full_name?.split(' ')[0] ?? tx('traveller');

  return (
    <Screen
      inTabs
      headerless
      contentClassName="px-5 gap-6 pt-3"
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          tintColor={colors.primary}
          onRefresh={() => {
            refetch();
            alerts.refetch();
            trips.refetch();
          }}
        />
      }
    >
      <View className="flex-row items-start gap-3">
        <View className="flex-1 gap-1">
          <Text className="text-[11px] font-bold tracking-[1.6px] text-faint">{context}</Text>
          <Text className="font-display text-[32px] leading-[38px] text-foreground">
            {greeting()},{'\n'}
            {firstName}
          </Text>
        </View>
        <View className="flex-row items-center gap-2 pt-1">
          <IconButton icon={Bell} label={tx('Notifications')} badge={unread} onPress={() => router.push('/notifications')} />
          <Pressable accessibilityRole="button" accessibilityLabel={tx('Your profile')} onPress={() => router.navigate('/profile')}>
            <Avatar profile={profile} size={44} />
          </Pressable>
        </View>
      </View>

      <Pressable
        accessibilityRole="search"
        accessibilityLabel={tx('Search places and plan a journey')}
        onPress={() => router.push('/search')}
        className="min-h-14 flex-row items-center gap-3 rounded-full border border-border bg-card pl-5 pr-2"
        style={{ boxShadow: '0 2px 8px rgba(28, 26, 23, 0.05)' }}
      >
        <Search color={colors.faint} size={20} />
        <Text className="flex-1 text-base text-faint">{tx('Where to next?')}</Text>
        <View className="h-10 w-10 items-center justify-center rounded-full bg-primary-soft">
          <SlidersHorizontal color={colors.primary} size={18} />
        </View>
      </Pressable>

      {spotlight ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${insideId ? "You're near" : 'Closest landmark'}: ${spotlight.name}`}
          onPress={() => router.push({ pathname: '/destination/[id]', params: { id: spotlight.id } })}
          className="flex-row items-center gap-3 rounded-3xl bg-accent-soft p-3"
        >
          <DestinationImage uri={spotlight.image_url} category={spotlight.category} className="h-16 w-16 rounded-2xl" iconSize={24} recyclingKey={spotlight.id} />
          <View className="flex-1 gap-0.5">
            <Text className="text-[11px] font-bold uppercase tracking-[1.4px] text-accent">
              {insideId ? tx('You\'re near') : tx('Closest landmark')}
              {spotlight.distance != null ? ` · ${formatDistance(spotlight.distance)}` : ''}
            </Text>
            <Text numberOfLines={1} className="text-base font-semibold text-foreground">
              {spotlight.name}
            </Text>
            <Text numberOfLines={1} className="text-xs text-muted-foreground">
              {spotlight.short_description}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={tx('Navigate to {0}', { 0: spotlight.name })}
            hitSlop={6}
            onPress={() => navigateTo(spotlight)}
            className="h-11 w-11 items-center justify-center rounded-full bg-primary"
          >
            <Navigation color={colors.primaryForeground} size={18} />
          </Pressable>
        </Pressable>
      ) : null}

      <LocationStatusCard />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-5" contentContainerClassName="gap-2 px-5">
        <Chip label={tx('All')} selected onPress={() => router.push('/search')} />
        {CATEGORY_ORDER.map((c) => (
          <Chip key={c} label={DESTINATION_CATEGORIES[c].label} onPress={() => router.push({ pathname: '/search', params: { category: c } })} />
        ))}
      </ScrollView>

      {urgent.length ? (
        <View className="gap-2">
          <SectionHeader title={tx('Travel alerts')} actionLabel={tx('See all')} onAction={() => router.push('/alerts')} />
          {urgent.map((a) => (
            <Pressable key={a.id} onPress={() => router.push('/alerts')} className="flex-row items-center gap-3 rounded-2xl bg-destructive-soft p-3">
              <View className="h-10 w-10 items-center justify-center rounded-xl bg-card">
                <TriangleAlert color={severityColors[a.severity]} size={18} />
              </View>
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

      {isLoading && sorted.length === 0 ? (
        <LoadingState label={tx('Loading destinations...')} />
      ) : isError && sorted.length === 0 ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : (
        <>
          {near.length ? (
            <View className="gap-3">
              <SectionHeader title={tx('Near you')} actionLabel={tx('See map')} onAction={() => router.navigate('/explore')} />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-5" contentContainerClassName="gap-4 px-5">
                {near.map((d) => (
                  <DestinationCard key={d.id} destination={d} distance={d.distance} rating={ratings.data?.[d.id]?.average_rating} />
                ))}
              </ScrollView>
              {near[0]?.distance != null && near[0].distance > 50_000 ? (
                <Text className="text-xs text-muted-foreground">{tx('The closest GoTourGo destination is {0} away.', { 0: formatDistance(near[0].distance) })}</Text>
              ) : null}
            </View>
          ) : null}

          {current.length || upcoming.length ? (
            <Card className="gap-2">
              <SectionHeader title={tx('Your trip')} actionLabel={tx('Open')} onAction={() => router.navigate('/trips')} />
              {[...current, ...upcoming].slice(0, 3).map((t) => {
                const d = byId.get(t.destination_id);
                if (!d) return null;
                return (
                  <Pressable
                    key={t.id}
                    onPress={() => router.push({ pathname: '/destination/[id]', params: { id: d.id } })}
                    className="min-h-11 flex-row items-center gap-3"
                  >
                    <View className={`h-2.5 w-2.5 rounded-full ${t.status === 'in_progress' ? 'bg-accent' : 'bg-border-strong'}`} />
                    <Text numberOfLines={1} className="flex-1 text-sm font-medium text-foreground">
                      {d.name}
                    </Text>
                    <Text className="text-xs text-faint">{TRIP_STATUSES.find((s) => s.value === t.status)?.label}</Text>
                  </Pressable>
                );
              })}
            </Card>
          ) : null}

          <View className="gap-3">
            <SectionHeader title={tx('Explore more')} />
            <View className="flex-row flex-wrap justify-between gap-y-3">
              {SHORTCUTS.map((s) => (
                <Pressable
                  key={s.label}
                  accessibilityRole="button"
                  accessibilityLabel={s.label}
                  onPress={() => router.push(s.href as never)}
                  className="w-[23%] items-center gap-2 rounded-2xl border border-border bg-card py-3 active:opacity-70"
                >
                  <View className="h-10 w-10 items-center justify-center rounded-full bg-primary-soft">
                    <s.icon color={colors.primary} size={19} />
                  </View>
                  <Text numberOfLines={1} className="text-xs font-medium text-foreground">
                    {s.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <WeatherCard point={location} title={tx('Weather where you are')} />

          <View className="gap-3">
            <SectionHeader title={tx('Popular in Pakistan')} actionLabel={tx('See all')} onAction={() => router.push('/search')} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-5" contentContainerClassName="gap-4 px-5">
              {popular.map((d) => (
                <DestinationCard key={d.id} destination={d} distance={d.distance} rating={ratings.data?.[d.id]?.average_rating} />
              ))}
            </ScrollView>
          </View>

          {savedPlaces.length ? (
            <View className="gap-3">
              <SectionHeader title={tx('Saved places')} actionLabel={tx('See all')} onAction={() => router.push('/saved')} />
              <View className="gap-2.5">
                {savedPlaces.slice(0, 3).map((d) => (
                  <DestinationCard key={d.id} variant="row" destination={d} distance={d.distance} />
                ))}
              </View>
            </View>
          ) : null}
        </>
      )}
    </Screen>
  );
}
