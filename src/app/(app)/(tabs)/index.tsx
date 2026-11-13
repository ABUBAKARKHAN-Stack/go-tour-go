import { Image } from 'expo-image';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  Bell,
  Bookmark,
  ChevronRight,
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
import { Pressable, RefreshControl, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconButton } from '@/components/app-button';
import { Avatar } from '@/components/avatar';
import { BrandLogo, IconTile, type TileTone } from '@/components/brand';
import { DestinationCard } from '@/components/destination-card';
import { DestinationImage } from '@/components/destination-image';
import { Card, SectionHeader } from '@/components/form';
import { OfflineBanner } from '@/components/offline-banner';
import { ErrorState, LoadingState } from '@/components/states';
import { useTabBarSpace } from '@/components/tab-bar';
import { Text } from '@/components/text';
import { WeatherCard } from '@/components/weather-card';
import { ALERT_LABELS, useRoadAlerts } from '@/features/alerts/api';
import { useAuth } from '@/features/auth/auth-provider';
import { FALLBACK_PHOTO, HERO_PHOTOS } from '@/features/brand/hero-photos';
import { Swash } from '@/features/brand/mood';
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
import { flipX, isUrdu, tx } from '@/lib/i18n';
import { enterAt, usePressScale } from '@/lib/motion';
import { brandGradient, colors, severityColors, shadow } from '@/lib/theme';
import type { DestinationCategory } from '@/lib/types';

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
/** Within this distance the highlighted card says "You're near" instead of "Closest landmark". */
const NEAR_RADIUS_M = 5_000;

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? tx('Good morning') : h < 17 ? tx('Good afternoon') : tx('Good evening');
}

export default function Home() {
  const { profile } = useAuth();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const tabSpace = useTabBarSpace();
  const { sorted, location, isLoading, isError, error, refetch, isRefetching } = useDestinationsByDistance();
  const ratings = useRatings();
  const alerts = useRoadAlerts();
  const trips = useTrips();
  const saved = useSavedIds();
  const unread = useUnreadCount();
  const proximity = useProximityCard();
  const weather = useWeather(location);
  const searchPress = usePressScale(0.98);

  const near = location ? sorted.slice(0, 8) : [];
  const popular = useMemo(() => [...sorted].sort((a, b) => b.popularity - a.popularity).slice(0, 6), [sorted]);
  const savedPlaces = useMemo(() => sorted.filter((d) => saved.data?.includes(d.id)).slice(0, 8), [sorted, saved.data]);
  const current = (trips.data ?? []).filter((t) => t.status === 'in_progress');
  const upcoming = (trips.data ?? []).filter((t) => t.status === 'todo');
  const byId = useMemo(() => new Map(sorted.map((d) => [d.id, d])), [sorted]);
  const urgent = (alerts.data ?? []).filter((a) => a.severity === 'critical' || a.severity === 'high').slice(0, 2);

  const insideId = proximity.inside[0]?.id;
  const spotlight =
    (insideId ? sorted.find((d) => d.id === insideId) : undefined) ??
    (near[0]?.distance != null && near[0].distance <= CITY_RADIUS_M ? near[0] : undefined);
  const spotlightLabel = insideId || (spotlight?.distance != null && spotlight.distance <= NEAR_RADIUS_M) ? tx("You're near") : tx('Closest landmark');
  const city = near[0]?.distance != null && near[0].distance <= CITY_RADIUS_M ? near[0].city : null;
  const context = [WEEKDAYS[new Date().getDay()], weather.data ? `${Math.round(weather.data.temperature)}°` : null, city].filter(Boolean).join(' · ');
  const firstName = profile?.full_name?.split(' ')[0] ?? tx('traveller');

  // Photo hero: about 40% of the screen, status bar included.
  const heroH = Math.round(Math.min(380, Math.max(300, height * 0.42)));
  // Three photo cards per row, 12 dp apart, inside 20 dp page margins.
  const gridW = Math.floor((width - 40 - 24) / 3);

  return (
    <View className="flex-1 bg-background">
      <StatusBar style="dark" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: tabSpace }}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            tintColor={colors.primary}
            colors={[colors.primary]}
            progressViewOffset={insets.top}
            onRefresh={() => {
              refetch();
              alerts.refetch();
              trips.refetch();
            }}
          />
        }
      >
        {/* Hero: photo with a misty side for the title, fading into the page. */}
        <View style={{ height: heroH }}>
          <Image
            source={{ uri: HERO_PHOTOS.signUp.uri }}
            placeholder={FALLBACK_PHOTO}
            placeholderContentFit="cover"
            contentFit="cover"
            cachePolicy="disk"
            transition={250}
            accessible={false}
            style={StyleSheet.absoluteFill}
          />
          <View pointerEvents="none" style={[StyleSheet.absoluteFill, { experimental_backgroundImage: SIDE_MIST }]} />
          <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: 0, height: insets.top + 96, experimental_backgroundImage: TOP_MIST }} />
          <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '42%', experimental_backgroundImage: BOTTOM_FADE }} />

          <View className="px-5" style={{ paddingTop: insets.top + 8 }}>
            <View className="flex-row items-center gap-2">
              <View className="flex-1">
                <BrandLogo height={44} />
              </View>
              <IconButton icon={Bell} label={tx('Notifications')} badge={unread} onPress={() => router.push('/notifications')} />
              <Pressable accessibilityRole="button" accessibilityLabel={tx('Your profile')} onPress={() => router.navigate('/profile')} className="rounded-full border-2 border-white active:opacity-80">
                <Avatar profile={profile} size={42} />
              </Pressable>
            </View>
            <View className="mt-5 self-start">
              <Text accessibilityRole="header" className="font-display text-[40px] text-sky-strong" style={isUrdu ? undefined : { lineHeight: 44 }}>
                {tx('Explore')}
              </Text>
              <Text className="font-display text-[40px] text-heading" style={isUrdu ? undefined : { lineHeight: 44 }}>
                {tx('Pakistan')}
              </Text>
              <Swash width={150} style={{ marginTop: 2 }} />
            </View>
            <Text className="mt-3 text-[15px] font-semibold text-heading">
              {greeting()}, {firstName}
            </Text>
            {context ? <Text className="text-[13px] text-muted-foreground">{context}</Text> : null}
          </View>
        </View>

        <View className="gap-6 px-5" style={{ marginTop: -28 }}>
          <Animated.View style={searchPress.style}>
            <Pressable
              accessibilityRole="search"
              accessibilityLabel={tx('Search places and plan a journey')}
              onPress={() => router.push('/search')}
              {...searchPress.handlers}
              className="min-h-14 flex-row items-center gap-3 rounded-full bg-card"
              style={{ paddingEnd: 6, paddingStart: 20, boxShadow: shadow(0.12, 8, 24) }}
            >
              <Search color={colors.heading} size={20} />
              <Text numberOfLines={1} className="flex-1 text-[15px] text-faint">
                {tx('Where do you want to go?')}
              </Text>
              <View className="h-11 w-11 items-center justify-center rounded-full" style={{ experimental_backgroundImage: brandGradient }}>
                <SlidersHorizontal color="#fff" size={18} />
              </View>
            </Pressable>
          </Animated.View>

          <OfflineBanner />

          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-5" contentContainerClassName="gap-3 px-5">
            {CATEGORY_ORDER.map((c) => (
              <CategoryTile key={c} category={c} />
            ))}
          </ScrollView>

          {spotlight ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${spotlightLabel}: ${spotlight.name}`}
              onPress={() => router.push({ pathname: '/destination/[id]', params: { id: spotlight.id } })}
              className="flex-row items-center gap-3 rounded-[20px] bg-card p-3 active:bg-muted"
              style={{ boxShadow: shadow(0.08, 6, 20) }}
            >
              <DestinationImage uri={spotlight.image_url} category={spotlight.category} className="h-16 w-16 rounded-2xl" iconSize={24} recyclingKey={spotlight.id} />
              <View className="flex-1 gap-0.5">
                <Text className="text-[11px] font-bold uppercase tracking-[1.4px] text-accent">
                  {spotlightLabel}
                  {spotlight.distance != null ? ` · ${formatDistance(spotlight.distance)}` : ''}
                </Text>
                <Text numberOfLines={2} className="text-base font-semibold text-heading">
                  {spotlight.name}
                </Text>
                <Text numberOfLines={2} className="text-xs text-muted-foreground">
                  {spotlight.short_description}
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={tx('Navigate to {0}', { 0: spotlight.name })}
                hitSlop={6}
                onPress={() => navigateTo(spotlight)}
                className="h-11 w-11 items-center justify-center rounded-full active:opacity-80"
                style={{ experimental_backgroundImage: brandGradient }}
              >
                <Navigation color="#fff" size={18} />
              </Pressable>
            </Pressable>
          ) : null}

          <LocationStatusCard />

          {isLoading && sorted.length === 0 ? (
            <LoadingState variant="cards" label={tx('Loading destinations...')} />
          ) : isError && sorted.length === 0 ? (
            <ErrorState error={error} onRetry={refetch} />
          ) : (
            <>
              {near.length ? (
                <Animated.View entering={enterAt(0)} className="gap-3">
                  <SectionHeader title={tx('Near you')} actionLabel={tx('See map')} onAction={() => router.navigate('/explore')} />
                  {/* Vertical padding keeps the cards' shadows from being clipped. */}
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-5 -my-3" contentContainerClassName="gap-3 px-5 py-3">
                    {near.map((d) => (
                      <DestinationCard key={d.id} destination={d} distance={d.distance} rating={ratings.data?.[d.id]?.average_rating} width={200} />
                    ))}
                  </ScrollView>
                  {near[0]?.distance != null && near[0].distance > 50_000 ? (
                    <Text className="text-xs text-muted-foreground">{tx('The closest GoTourGo destination is {0} away.', { 0: formatDistance(near[0].distance) })}</Text>
                  ) : null}
                </Animated.View>
              ) : null}

              {urgent.length ? (
                <Animated.View entering={enterAt(1)} className="gap-2">
                  <SectionHeader title={tx('Travel alerts')} actionLabel={tx('See all')} onAction={() => router.push('/alerts')} />
                  {urgent.map((a) => (
                    <Pressable
                      key={a.id}
                      onPress={() => router.push('/alerts')}
                      className="flex-row items-center gap-3 rounded-[20px] bg-card p-3 active:bg-muted"
                      style={{ boxShadow: shadow(0.08, 6, 20) }}
                    >
                      <View className="h-11 w-11 items-center justify-center rounded-2xl bg-destructive-soft">
                        <TriangleAlert color={severityColors[a.severity]} size={19} />
                      </View>
                      <View className="flex-1">
                        <Text numberOfLines={2} className="text-sm font-semibold text-heading">
                          {a.title}
                        </Text>
                        <Text className="text-xs text-muted-foreground">
                          {ALERT_LABELS[a.alert_type]} · {a.city ?? a.region}
                        </Text>
                      </View>
                      <ChevronRight color={colors.faint} size={18} style={flipX} />
                    </Pressable>
                  ))}
                </Animated.View>
              ) : null}

              {popular.length ? (
                <Animated.View entering={enterAt(2)} className="gap-3">
                  <SectionHeader title={tx('Popular destinations')} actionLabel={tx('See all')} onAction={() => router.push('/search')} />
                  <View className="flex-row flex-wrap gap-3">
                    {popular.map((d) => (
                      <DestinationCard key={d.id} variant="photo" destination={d} width={gridW} />
                    ))}
                  </View>
                </Animated.View>
              ) : null}

              {current.length || upcoming.length ? (
                <Animated.View entering={enterAt(3)}>
                  <Card className="gap-2">
                    <SectionHeader title={tx('Your trip')} actionLabel={tx('Open')} onAction={() => router.navigate('/trips')} />
                    {[...current, ...upcoming].slice(0, 3).map((t) => {
                      const d = byId.get(t.destination_id);
                      if (!d) return null;
                      return (
                        <Pressable
                          key={t.id}
                          onPress={() => router.push({ pathname: '/destination/[id]', params: { id: d.id } })}
                          className="min-h-11 flex-row items-center gap-3 active:opacity-70"
                        >
                          <View className={`h-2.5 w-2.5 rounded-full ${t.status === 'in_progress' ? 'bg-accent' : 'bg-border-strong'}`} />
                          <Text numberOfLines={2} className="flex-1 text-sm font-medium text-heading">
                            {d.name}
                          </Text>
                          <Text className="text-xs text-faint">{TRIP_STATUSES.find((s) => s.value === t.status)?.label}</Text>
                        </Pressable>
                      );
                    })}
                  </Card>
                </Animated.View>
              ) : null}

              <Animated.View entering={enterAt(4)} className="gap-3">
                <SectionHeader title={tx('Explore more')} />
                <View className="flex-row flex-wrap gap-y-4">
                  {SHORTCUTS.map((s, i) => (
                    <Pressable
                      key={s.label}
                      accessibilityRole="button"
                      accessibilityLabel={s.label}
                      onPress={() => router.push(s.href as never)}
                      className="w-1/4 items-center active:opacity-70"
                    >
                      <IconTile round icon={s.icon} tone={SHORTCUT_TONES[i % SHORTCUT_TONES.length]} size={52} label={s.label} />
                    </Pressable>
                  ))}
                </View>
              </Animated.View>

              <WeatherCard point={location} title={tx('Weather where you are')} />

              {savedPlaces.length ? (
                <Animated.View entering={enterAt(5)} className="gap-3">
                  <SectionHeader title={tx('Saved places')} actionLabel={tx('See all')} onAction={() => router.push({ pathname: '/saved', params: { tab: 'places' } })} />
                  <View className="gap-2.5">
                    {savedPlaces.slice(0, 3).map((d) => (
                      <DestinationCard key={d.id} variant="row" destination={d} distance={d.distance} />
                    ))}
                  </View>
                </Animated.View>
              ) : null}
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const SHORTCUT_TONES: TileTone[] = ['ice', 'peach', 'mint', 'lemon'];

// The misty side follows the text: left in English, right in Urdu.
const SIDE_MIST = `linear-gradient(${isUrdu ? 270 : 90}deg, rgba(246,250,252,0.95) 0%, rgba(246,250,252,0.72) 42%, rgba(246,250,252,0) 72%)`;
const TOP_MIST = 'linear-gradient(180deg, rgba(246,250,252,0.85), rgba(246,250,252,0))';
const BOTTOM_FADE = 'linear-gradient(180deg, rgba(246,250,252,0), rgb(246,250,252))';

/** Category tile: tinted rounded square and label; opens search filtered to it. */
function CategoryTile({ category }: { category: DestinationCategory }) {
  const meta = DESTINATION_CATEGORIES[category];
  const press = usePressScale(0.95);
  return (
    <Animated.View style={press.style}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={meta.label}
        onPress={() => router.push({ pathname: '/search', params: { category } })}
        {...press.handlers}
      >
        <IconTile icon={meta.icon} tone={meta.tone} size={64} label={meta.label} />
      </Pressable>
    </Animated.View>
  );
}
