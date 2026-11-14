import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, ArrowUpDown, Bike, Pencil, Car, CheckCircle2, CloudDownload, Footprints, Landmark, MapPinOff, TriangleAlert, type LucideIcon } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton } from '@/components/app-button';
import { useIsOnline } from '@/components/offline-banner';
import { EmptyState } from '@/components/states';
import { Text } from '@/components/text';
import { isOnRoute, type JourneyItem } from '@/features/journey/journey-items';
import { JourneyMap } from '@/features/journey/journey-map';
import { journeyStore, routeIndex, useJourney } from '@/features/journey/journey-store';
import { hasBackgroundLocation, startJourneyUpdates } from '@/features/journey/journey-task';
import { arrivalClock, formatEta } from '@/features/journey/navigation';
import { getCurrentFix, requestBackgroundPermission, requestLocationPermission } from '@/features/location/location-provider';
import { useLastLocation, useLocationState } from '@/features/location/location-store';
import { requestNotificationPermission } from '@/features/notifications/local-notifications';
import { saveRouteOffline, useSavedRoutes } from '@/features/offline/saved-routes';
import type { TravelMode } from '@/features/routing/osrm';
import { formatDistance } from '@/lib/geo';
import { usePreferences } from '@/lib/preferences';
import { colors } from '@/lib/theme';
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

export default function JourneyPreview() {
  // `reverse=1`: the place is where the route starts and it ends at your location (From/To swapped).
  const params = useLocalSearchParams<{ name: string; lat: string; lng: string; id?: string; subtitle?: string; reverse?: string }>();
  const reverse = params.reverse === '1';
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const [prefs, setPrefs] = usePreferences();
  const journey = useJourney();
  const location = useLastLocation();
  const locationState = useLocationState();
  const [starting, setStarting] = useState(false);
  const online = useIsOnline();
  const [savedRoutes] = useSavedRoutes();

  const target = useMemo(
    () => ({
      name: params.name ?? 'Destination',
      latitude: Number(params.lat),
      longitude: Number(params.lng),
      id: params.id,
      subtitle: params.subtitle,
    }),
    [params.name, params.lat, params.lng, params.id, params.subtitle],
  );
  const validTarget = Number.isFinite(target.latitude) && Number.isFinite(target.longitude);

  // Plan once per destination (and again if location becomes available).
  const hasFix = Boolean(location);
  useEffect(() => {
    if (!validTarget) return;
    const current = journeyStore.get();
    if (current.phase === 'active') return;
    const planned = reverse ? current.origin : current.target;
    const same =
      planned &&
      planned.latitude === target.latitude &&
      planned.longitude === target.longitude &&
      (reverse ? current.target?.name === YOUR_LOCATION : current.target?.name !== YOUR_LOCATION) &&
      (current.phase === 'preview' || current.phase === 'planning');
    if (same) return;
    let cancelled = false;
    getCurrentFix().then((fix) => {
      if (cancelled || !fix) return;
      if (reverse) journeyStore.plan({ name: YOUR_LOCATION, latitude: fix.latitude, longitude: fix.longitude }, target, prefs.travelMode);
      else journeyStore.plan(target, fix, prefs.travelMode);
    });
    return () => {
      cancelled = true;
    };
  }, [target, validTarget, hasFix, prefs.travelMode, reverse]);

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
      const background = backgroundAllowed ? await startJourneyUpdates(target.name) : 'no-permission';
      router.replace({ pathname: '/journey/navigate', params: { background: background === 'started' ? '1' : '0' } });
    } finally {
      setStarting(false);
    }
  };

  // Tapping the route bar goes back to planning, with this destination filled in.
  const editRoute = () => {
    if (journeyStore.get().phase !== 'active') journeyStore.stop();
    router.replace({ pathname: '/search', params: { q: target.name, ...(reverse ? { reverse: '1' } : {}) } });
  };

  const back = () => {
    if (journeyStore.get().phase !== 'active') journeyStore.stop();
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  if (!validTarget) {
    return (
      <View className="flex-1 justify-center bg-background" style={{ paddingTop: insets.top }}>
        <EmptyState title={tx('Destination missing')} message={tx('Choose a place to plan a journey.')} actionLabel={tx('Search places')} onAction={() => router.replace('/search')} />
      </View>
    );
  }

  const needsLocation = locationState.permission !== 'granted' || locationState.servicesEnabled === false;

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
          <View className="flex-1">
            <Text numberOfLines={2} className="text-base font-semibold text-heading">
              {reverse ? tx('{0} → Your location', { 0: target.name }) : tx('Your location → {0}', { 0: target.name })}
            </Text>
            <Text numberOfLines={2} className="text-xs text-faint">
              {via ? tx('Fastest route · via {0}', { 0: via }) : target.subtitle ?? tx('Planning your route')}
            </Text>
          </View>
          <Pencil color={colors.faint} size={16} />
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
                    onPress={async () => {
                      const fix = await getCurrentFix();
                      if (fix) journeyStore.plan(target, fix, prefs.travelMode);
                    }}
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
          <View className="flex-row gap-2">
            <AppButton
              label={savedEntry ? tx('Saved') : tx('Save offline')}
              icon={savedEntry ? CheckCircle2 : CloudDownload}
              variant="secondary"
              onPress={saveOffline}
              disabled={!route || journey.phase !== 'preview'}
            />
            {reverse ? (
              // Turn-by-turn follows you from where you are, so this direction is a preview.
              <AppButton
                label={tx('Navigate from my location')}
                icon={ArrowUpDown}
                onPress={() => router.setParams({ reverse: undefined })}
                className="flex-1"
              />
            ) : (
              <AppButton label={tx('Start journey')} onPress={start} loading={starting} disabled={!route || journey.phase !== 'preview'} className="flex-1" />
            )}
          </View>
        </View>
      </View>
    </View>
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
        <Text numberOfLines={2} className="text-base font-semibold text-heading">
          {item.name}
        </Text>
        <Text numberOfLines={2} className="text-xs text-faint">
          {where}
        </Text>
      </View>
      <Text className={`text-xs font-semibold ${hazard ? 'text-destructive' : 'text-primary'}`}>
        {hazard ? (item.severity === 'critical' ? tx('Critical') : item.severity === 'high' ? tx('High') : tx('Caution')) : tx('Alert on')}
      </Text>
    </Pressable>
  );
}
