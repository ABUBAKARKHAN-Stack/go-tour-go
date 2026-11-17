import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, ArrowUpDown, Bike, Car, CircleDot, ListOrdered, MapPin, Pencil, CheckCircle2, CloudDownload, Footprints, Landmark, MapPinOff, Route as RouteIcon, TriangleAlert, type LucideIcon } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton, IconButton } from '@/components/app-button';
import { useIsOnline } from '@/components/offline-banner';
import { EmptyState } from '@/components/states';
import { Text } from '@/components/text';
import type { AltRoute } from '@/features/journey/alternatives';
import { isOnRoute, type JourneyItem } from '@/features/journey/journey-items';
import { JourneyMap } from '@/features/journey/journey-map';
import { journeyStore, routeIndex, useJourney } from '@/features/journey/journey-store';
import { hasBackgroundLocation, startJourneyUpdates } from '@/features/journey/journey-task';
import { arrivalClock, formatEta } from '@/features/journey/navigation';
import { getCurrentFix, requestBackgroundPermission, requestLocationPermission } from '@/features/location/location-provider';
import { useLastLocation, useLocationState } from '@/features/location/location-store';
import { requestNotificationPermission } from '@/features/notifications/local-notifications';
import { saveRouteOffline, useSavedRoutes } from '@/features/offline/saved-routes';
import { journeyParams, navigateTo, parseJourneyParams, type JourneyParams } from '@/features/routing/navigate';
import type { TravelMode } from '@/features/routing/osrm';
import { distanceMeters, formatDistance } from '@/lib/geo';
import { usePreferences } from '@/lib/preferences';
import { colors } from '@/lib/theme';
import { haptics } from '@/lib/haptics';
import { flipX, tx } from '@/lib/i18n';

const MODES: { mode: TravelMode; label: string; icon: LucideIcon }[] = [
  { mode: 'driving', label: tx('Drive'), icon: Car },
  { mode: 'cycling', label: tx('Bike'), icon: Bike },
  { mode: 'walking', label: tx('Walk'), icon: Footprints },
];

/** The road the route spends longest on, for "via …". */
function mainRoad(steps: { name: string | null; distance: number }[]) {
  const totals = new Map<string, number>();
  for (const s of steps) if (s.name) totals.set(s.name, (totals.get(s.name) ?? 0) + s.distance);
  let best: string | null = null;
  let max = 0;
  totals.forEach((d, name) => {
    if (d > max) {
      max = d;
      best = name;
    }
  });
  return best;
}

/**
 * Route preview (design screen 08): routes for each travel mode, time and
 * distance, and the landmarks and hazards on the way, then "Start journey".
 */
/** The traveller's own position as a route end (a reversed journey). */
const YOUR_LOCATION = tx('Your location');
/** How close to the start of a flipped route you need to be to start it. */
const START_RADIUS_M = 300;

export default function JourneyPreview() {
  // Either end can be you or a place: `reverse=1` ends the route at your location; `from*` starts it at a place.
  const params = useLocalSearchParams<JourneyParams>();
  const ends = useMemo(
    () => parseJourneyParams(params),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [params.name, params.lat, params.lng, params.id, params.subtitle, params.reverse, params.fromName, params.fromLat, params.fromLng, params.fromId, params.fromSubtitle],
  );
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const [prefs, setPrefs] = usePreferences();
  const journey = useJourney();
  const location = useLastLocation();
  const locationState = useLocationState();
  const [starting, setStarting] = useState(false);
  const online = useIsOnline();
  const [savedRoutes] = useSavedRoutes();

  const from = ends?.from ?? 'me';
  const to = ends?.to ?? 'me';
  /** The place the journey is about (for names, saving offline, the background notice). */
  const place = to !== 'me' ? to : from !== 'me' ? from : null;
  const usesMe = from === 'me' || to === 'me';
  const fromLabel = from === 'me' ? YOUR_LOCATION : from.name;
  const toLabel = to === 'me' ? YOUR_LOCATION : to.name;

  /** Plans the route; ends that are "you" use a fresh location fix. */
  const planNow = async () => {
    if (!ends) return;
    const fix = usesMe ? await getCurrentFix() : null;
    if (usesMe && !fix) return;
    const end = (e: typeof from) => (e === 'me' ? { name: YOUR_LOCATION, latitude: fix!.latitude, longitude: fix!.longitude } : e);
    journeyStore.plan(end(to), end(from), prefs.travelMode);
  };

  // Plan once per pair of ends (and again if location becomes available).
  const hasFix = Boolean(location);
  useEffect(() => {
    if (!ends) return;
    const current = journeyStore.get();
    if (current.phase === 'active') return;
    const sameEnd = (e: typeof from, got: { name: string; latitude: number; longitude: number } | null) =>
      Boolean(got) && (e === 'me' ? got!.name === YOUR_LOCATION : got!.name !== YOUR_LOCATION && got!.latitude === e.latitude && got!.longitude === e.longitude);
    const same =
      sameEnd(ends.to, current.target) && sameEnd(ends.from, current.origin) && (current.phase === 'preview' || current.phase === 'planning');
    if (same) return;
    let cancelled = false;
    const fixP = usesMe ? getCurrentFix() : Promise.resolve(null);
    fixP.then((fix) => {
      if (cancelled || (usesMe && !fix)) return;
      const end = (e: typeof from) => (e === 'me' ? { name: YOUR_LOCATION, latitude: fix!.latitude, longitude: fix!.longitude } : e);
      journeyStore.plan(end(ends.to), end(ends.from), prefs.travelMode);
    });
    return () => {
      cancelled = true;
    };
  }, [ends, usesMe, hasFix, prefs.travelMode]);

  const sheetHeight = Math.min(height * 0.56, 520);
  const route = journey.route;
  const landmarks = journey.items.filter((i) => i.kind === 'landmark');
  const hazards = journey.items.filter((i) => i.kind === 'hazard');
  const via = route ? mainRoad(route.steps) : null;

  const savedEntry =
    route && journey.target
      ? savedRoutes.find(
          (r) =>
            r.route.mode === route.mode &&
            Math.abs(r.target.latitude - journey.target!.latitude) < 1e-5 &&
            Math.abs(r.target.longitude - journey.target!.longitude) < 1e-5,
        )
      : undefined;

  const saveOffline = async () => {
    if (!route || !journey.target) return;
    if (savedEntry) {
      router.push('/offline-maps');
      return;
    }
    const saved = await saveRouteOffline(journey.target, route, { online });
    Alert.alert(
      tx('Route saved offline'),
      saved.map === 'covered'
        ? tx('Your downloaded map covers this route, so the journey and map work without internet.')
        : saved.map === 'packs'
          ? tx('The map along the route is downloading now. You can follow it in Offline maps.')
          : tx('The route is saved. Download a map for this area in Offline maps so the map shows too.'),
    );
  };

  // A route that starts at a place: guidance follows you, so starting needs you there; otherwise preview it.
  const awayFromStart = from !== 'me' && location ? distanceMeters(location, from) : null;
  const canStart = from === 'me' || (awayFromStart != null && awayFromStart <= START_RADIUS_M);

  const start = async () => {
    if (!route) return;
    setStarting(true);
    try {
      await requestNotificationPermission();
      let backgroundAllowed = await hasBackgroundLocation();
      if (!backgroundAllowed) {
        const allow = await new Promise<boolean>((resolve) =>
          Alert.alert(
            tx('Alerts with the screen off'),
            tx('To announce landmarks and hazards while your phone is locked or GoTourGo is in the background, Android needs location access "All the time". Location is only used while a journey or alerts are on.'),
            [
              { text: tx('Only while open'), style: 'cancel', onPress: () => resolve(false) },
              { text: tx('Allow'), onPress: () => resolve(true) },
            ],
          ),
        );
        if (allow) backgroundAllowed = await requestBackgroundPermission();
      }
      // Save the journey first: the background task reads it on its first update.
      journeyStore.start();
      const background = backgroundAllowed ? await startJourneyUpdates(journey.target?.name ?? toLabel) : 'no-permission';
      router.replace({ pathname: '/journey/navigate', params: { background: background === 'started' ? '1' : '0' } });
    } finally {
      setStarting(false);
    }
  };

  // Tapping the route bar goes back to planning, with both ends filled in.
  const editRoute = () => {
    if (journeyStore.get().phase !== 'active') journeyStore.stop();
    router.replace({ pathname: '/search', params: { q: place?.name ?? '', ...journeyParams(from, to) } });
  };

  // Swap start and destination (either can be you or a place).
  const swap = () => {
    haptics.select();
    router.setParams({
      name: undefined, lat: undefined, lng: undefined, id: undefined, subtitle: undefined, fromName: undefined, fromLat: undefined, fromLng: undefined, fromId: undefined, fromSubtitle: undefined,
      reverse: '0',
      ...journeyParams(to, from),
    });
  };

  const back = () => {
    if (journeyStore.get().phase !== 'active') journeyStore.stop();
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  if (!ends) {
    return (
      <View className="flex-1 justify-center bg-background" style={{ paddingTop: insets.top }}>
        <EmptyState title={tx('Destination missing')} message={tx('Choose a place to plan a journey.')} actionLabel={tx('Search places')} onAction={() => router.replace('/search')} />
      </View>
    );
  }

  const needsLocation = usesMe && (locationState.permission !== 'granted' || locationState.servicesEnabled === false);

  return (
    <View className="flex-1 bg-background">
      <JourneyMap
        route={route}
        index={routeIndex()}
        items={journey.items}
        progress={null}
        fix={location}
        follow={false}
        padding={{ top: insets.top + 84, bottom: sheetHeight }}
        alternatives={journey.alternatives}
        onSelectRoute={(alt) => {
          haptics.select();
          journeyStore.selectRoute(alt);
        }}
      />

      <View className="absolute left-4 right-4 flex-row items-center gap-3 rounded-[20px] bg-card px-3 py-2.5" style={{ top: insets.top + 8, boxShadow: '0 4px 14px rgba(21,56,79,0.10)' }}>
        <Pressable accessibilityRole="button" accessibilityLabel={tx('Go back')} onPress={back} hitSlop={8} className="h-10 w-10 items-center justify-center rounded-full bg-primary-soft">
          <ArrowLeft color={colors.foreground} size={20} style={flipX} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityHint={tx('Change the route')}
          onPress={editRoute}
          className="flex-1 flex-row items-center gap-2 active:opacity-70"
        >
          {/* Start and destination on their own lines, in full (wrapping, never cut off). */}
          <View className="flex-1 gap-1">
            <View className="flex-row items-start gap-2">
              <CircleDot color={colors.primary} size={14} style={{ marginTop: 3 }} />
              <Text className="flex-1 text-sm font-semibold text-heading">{fromLabel}</Text>
            </View>
            <View className="flex-row items-start gap-2">
              <MapPin color={colors.accent} size={14} style={{ marginTop: 3 }} />
              <Text className="flex-1 text-sm font-semibold text-heading">{toLabel}</Text>
            </View>
            <Text className="text-xs text-faint">{via ? tx('Via {0}', { 0: via }) : place?.subtitle ?? tx('Planning your route')}</Text>
          </View>
          <Pencil color={colors.faint} size={16} />
        </Pressable>
        {/* Flip the route: from the place to you, or back. */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={tx('Swap start and destination')}
          onPress={swap}
          hitSlop={6}
          className="h-10 w-10 items-center justify-center rounded-full bg-primary-soft active:opacity-70"
        >
          <ArrowUpDown color={colors.primary} size={18} />
        </Pressable>
      </View>

      <View
        className="absolute bottom-0 left-0 right-0 rounded-t-[28px] bg-background"
        style={{ height: sheetHeight, boxShadow: '0 -8px 24px rgba(21,56,79,0.10)' }}
      >
        <View className="items-center pb-1 pt-3">
          <View className="h-1 w-10 rounded-full bg-border-strong" />
        </View>
        <ScrollView contentContainerClassName="gap-4 px-6 pt-2" contentContainerStyle={{ paddingBottom: 16 }}>
          {needsLocation ? (
            <View className="gap-3">
              <View className="flex-row items-center gap-3">
                <MapPinOff color={colors.accent} size={22} />
                <Text className="flex-1 text-base text-foreground">{tx('Turn on location to plan a route from where you are.')}</Text>
              </View>
              <AppButton label={tx('Enable location')} onPress={() => requestLocationPermission()} />
            </View>
          ) : (
            <>
              <View className="flex-row gap-2">
                {MODES.map(({ mode, label, icon: Icon }) => {
                  const r = journey.routes[mode];
                  const selected = journey.mode === mode && Boolean(r);
                  const disabled = journey.phase !== 'planning' && !r;
                  return (
                    <Pressable
                      key={mode}
                      accessibilityRole="button"
                      accessibilityState={{ selected, disabled }}
                      accessibilityLabel={`${label}${r ? `, ${formatEta(r.duration)}` : ''}`}
                      disabled={!r}
                      onPress={() => {
                        journeyStore.selectMode(mode);
                        setPrefs({ travelMode: mode });
                      }}
                      className={`min-h-10 flex-row items-center gap-1.5 rounded-full px-3.5 ${selected ? 'bg-primary' : 'bg-primary-soft'} ${disabled ? 'opacity-40' : ''}`}
                    >
                      <Icon color={selected ? colors.primaryForeground : colors.mutedForeground} size={16} />
                      <Text className={`text-sm font-semibold ${selected ? 'text-white' : 'text-muted-foreground'}`}>
                        {r ? formatEta(r.duration) : journey.phase === 'planning' ? '…' : label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {journey.phase === 'planning' ? (
                <View className="gap-2 py-2">
                  <Text className="font-display text-[28px] text-foreground">{tx('Finding the best route…')}</Text>
                  <Text className="text-sm text-muted-foreground">{tx('Looking for landmarks and road alerts on the way.')}</Text>
                </View>
              ) : !route ? (
                <View className="gap-3 py-2">
                  <Text className="font-display text-2xl text-heading">{tx('No route found')}</Text>
                  <Text className="text-sm text-muted-foreground">{journey.error ?? tx('Check your internet connection and try again.')}</Text>
                  <AppButton
                    label={tx('Try again')}
                    variant="secondary"
                    onPress={planNow}
                  />
                </View>
              ) : (
                <>
                  <View className="gap-1">
                    <Text className="font-display text-[30px] leading-9 text-foreground">
                      {formatEta(route.duration)} · {formatDistance(route.distance)}
                    </Text>
                    <Text className="text-sm text-muted-foreground">{tx('Arrive {0} {1}', { 0: arrivalClock(route.duration), 1: landmarks.length || hazards.length
                        ? tx(' · {0} landmark{1}{2} on your way', { 0: landmarks.length, 1: landmarks.length === 1 ? '' : 's', 2: hazards.length ? ` and ${hazards.length} alert${hazards.length === 1 ? '' : 's'}` : '' })
                        : '' })}</Text>
                  </View>

                  {journey.alternatives.length ? (
                    // Other ways to go, like map apps: also grey on the map, tap either to switch.
                    <View>
                      <Text className="pb-1 text-[11px] font-bold tracking-[1.6px] text-faint">{tx('OTHER ROUTES')}</Text>
                      {journey.alternatives.map((alt) => (
                        <AltRow
                          key={`${alt.route.createdAt}-${alt.route.distance}`}
                          alt={alt}
                          onPress={() => {
                            haptics.select();
                            journeyStore.selectRoute(alt);
                          }}
                        />
                      ))}
                    </View>
                  ) : null}

                  {journey.items.length ? (
                    <View>
                      <Text className="pb-1 text-[11px] font-bold tracking-[1.6px] text-faint">{tx('ON YOUR WAY')}</Text>
                      {journey.items.slice(0, 12).map((item) => (
                        <ItemRow key={item.id} item={item} />
                      ))}
                      {journey.items.length > 12 ? (
                        <Text className="pt-1 text-xs text-faint">{tx('+{0} more along the route', { 0: journey.items.length - 12 })}</Text>
                      ) : null}
                    </View>
                  ) : (
                    <Text className="text-sm text-muted-foreground">
                      {tx('No famous landmarks or road alerts on this route. Landmarks near you will still be announced as you travel.')}
                    </Text>
                  )}
                </>
              )}
            </>
          )}
        </ScrollView>
        <View className="border-t border-border px-6 pt-3" style={{ paddingBottom: insets.bottom + 12 }}>
          {!canStart && awayFromStart != null ? (
            // Like map apps: a route that starts elsewhere can be previewed; guidance needs you at the start.
            <View className="flex-row flex-wrap items-center gap-x-1.5 pb-2.5">
              <Text className="text-sm text-muted-foreground">{tx('Starts {0} from you.', { 0: formatDistance(awayFromStart) })}</Text>
              <Pressable accessibilityRole="button" hitSlop={8} onPress={() => navigateTo(from, { replace: true })}>
                <Text className="text-sm font-semibold text-accent">{tx('Directions to the start')}</Text>
              </Pressable>
            </View>
          ) : null}
          <View className="flex-row items-center gap-2">
            <IconButton
              icon={savedEntry ? CheckCircle2 : CloudDownload}
              label={savedEntry ? tx('Saved offline') : tx('Save offline')}
              active={Boolean(savedEntry)}
              onPress={() => route && journey.phase === 'preview' && saveOffline()}
            />
            <AppButton
              label={tx('Preview')}
              icon={ListOrdered}
              variant={canStart ? 'secondary' : 'primary'}
              disabled={!route || journey.phase !== 'preview'}
              onPress={() => router.push('/journey/steps')}
              className={canStart ? undefined : 'flex-1'}
            />
            {canStart ? (
              <AppButton label={tx('Start journey')} onPress={start} loading={starting} disabled={!route || journey.phase !== 'preview'} className="flex-1" />
            ) : null}
          </View>
        </View>
      </View>
    </View>
  );
}

function AltRow({ alt, onPress }: { alt: AltRoute; onPress: () => void }) {
  const road = mainRoad(alt.route.steps);
  const mins = Math.round(Math.abs(alt.delta) / 60);
  const diff = mins < 1 ? tx('Same time') : alt.delta > 0 ? tx('{0} slower', { 0: formatEta(alt.delta) }) : tx('{0} faster', { 0: formatEta(-alt.delta) });
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${formatEta(alt.route.duration)}, ${formatDistance(alt.route.distance)}, ${diff}`}
      accessibilityHint={tx('Use this route')}
      onPress={onPress}
      className="min-h-14 flex-row items-center gap-3 py-2 active:opacity-70"
    >
      <View className="h-10 w-10 items-center justify-center rounded-xl bg-muted">
        <RouteIcon color={colors.mutedForeground} size={18} />
      </View>
      <View className="flex-1">
        <Text className="text-base font-semibold text-heading">
          {formatEta(alt.route.duration)} · {formatDistance(alt.route.distance)}
        </Text>
        <Text className="text-xs text-faint">{road ? tx('Via {0}', { 0: road }) : tx('Another way')}</Text>
      </View>
      <Text className={`text-xs font-semibold ${alt.delta < -30 ? 'text-success' : 'text-muted-foreground'}`}>{diff}</Text>
    </Pressable>
  );
}

function ItemRow({ item }: { item: JourneyItem }) {
  const hazard = item.kind === 'hazard';
  const where = `${formatDistance(item.along)} in · ${isOnRoute(item) ? 'on route' : `${formatDistance(item.offRoute)} off route`}`;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${item.name}, ${where}`}
      disabled={hazard}
      onPress={() => router.push({ pathname: '/destination/[id]', params: { id: item.id } })}
      className="min-h-14 flex-row items-center gap-3 py-2"
    >
      <View className={`h-10 w-10 items-center justify-center rounded-xl ${hazard ? 'bg-destructive-soft' : 'bg-primary-soft'}`}>
        {hazard ? <TriangleAlert color={colors.destructive} size={18} /> : <Landmark color={colors.primary} size={18} />}
      </View>
      <View className="flex-1">
        <Text className="text-base font-semibold text-heading">
          {item.name}
        </Text>
        <Text className="text-xs text-faint">
          {where}
        </Text>
      </View>
      <Text className={`text-xs font-semibold ${hazard ? 'text-destructive' : 'text-primary'}`}>
        {hazard ? (item.severity === 'critical' ? tx('Critical') : item.severity === 'high' ? tx('High') : tx('Caution')) : tx('Alert on')}
      </Text>
    </Pressable>
  );
}
