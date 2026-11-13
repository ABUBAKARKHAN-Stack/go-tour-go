import { router, useLocalSearchParams } from 'expo-router';
import {
  Bookmark,
  ChevronDown,
  CircleDashed,
  Crosshair,
  Download,
  Info,
  MapPin,
  Navigation,
  Search,
  TriangleAlert,
  Users,
  X,
} from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, useWindowDimensions, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeOut, FadeOutDown, LinearTransition, ReduceMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton, IconButton } from '@/components/app-button';
import { Sheet } from '@/components/sheet';
import { DestinationCard } from '@/components/destination-card';
import { Chip } from '@/components/form';
import { OfflineBanner } from '@/components/offline-banner';
import { ErrorState } from '@/components/states';
import { useRoadAlerts } from '@/features/alerts/api';
import { hazardCard, useHazardCard } from '@/features/alerts/hazard-card-store';
import { ReportHazardSheet } from '@/features/alerts/report-hazard-sheet';
import { useTabBarSpace } from '@/components/tab-bar';
import { useAuth } from '@/features/auth/auth-provider';
import { Text } from '@/components/text';
import { useDestinations, useRatings } from '@/features/destinations/api';
import { CATEGORY_ORDER, DESTINATION_CATEGORIES } from '@/features/destinations/categories';
import { getCurrentFix, requestLocationPermission } from '@/features/location/location-provider';
import { useLastLocation, useLocationState } from '@/features/location/location-store';
import { LocationStatusCard } from '@/features/location/location-status-card';
import { validHeading } from '@/features/map/nav-arrow';
import { PlacePreview } from '@/features/map/place-preview';
import { useSpotName } from '@/features/map/spot-name';
import { TravelMap, type TravelMapHandle } from '@/features/map/travel-map';
import { navigateTo } from '@/features/routing/navigate';
import { useJourney } from '@/features/journey/journey-store';
import { useSavedIds } from '@/features/saved/api';
import { useFriendLocations } from '@/features/safety/friend-locations';
import { useSharingSession, isSessionLive } from '@/features/safety/sharing';
import { bearingTo } from '@/features/proximity/heading';
import { useProximityCard } from '@/features/proximity/proximity-store';
import { useSimulator } from '@/features/proximity/simulator';
import { distanceMeters, formatDistance } from '@/lib/geo';
import { CSS_EASE_OUT, EASE_OUT } from '@/lib/motion';
import { storage, StorageKeys, useStorage } from '@/lib/storage';
import { colors, shadow } from '@/lib/theme';
import type { DestinationCategory } from '@/lib/types';
import { tx } from '@/lib/i18n';
import { COUNTRY } from '@/constants/app.constants';

// Panel motion: the height follows Hide / Show, the cards fade; it slides away for an alert card.
const PANEL_LAYOUT = LinearTransition.duration(240).easing(EASE_OUT).reduceMotion(ReduceMotion.System);
const PANEL_IN = FadeInDown.duration(220).easing(EASE_OUT).reduceMotion(ReduceMotion.System);
const PANEL_OUT = FadeOutDown.duration(160).reduceMotion(ReduceMotion.System);
const CARDS_IN = FadeIn.duration(200).delay(60).reduceMotion(ReduceMotion.System);
const CARDS_OUT = FadeOut.duration(120).reduceMotion(ReduceMotion.System);

const PAKISTAN_CENTER = COUNTRY.center;

export default function ExploreScreen() {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const tabSpace = useTabBarSpace();
  const params = useLocalSearchParams<{ focus?: string; alert?: string; at?: string }>();
  const map = useRef<TravelMapHandle>(null);
  const { userId } = useAuth();

  const destinations = useDestinations();
  const alerts = useRoadAlerts();
  const friends = useFriendLocations();
  const location = useLastLocation();
  const locationState = useLocationState();
  const sim = useSimulator();
  const sharing = useSharingSession();
  const journey = useJourney();
  const journeyActive = journey.phase === 'active';

  const saved = useSavedIds();
  const savedSet = useMemo(() => new Set(saved.data ?? []), [saved.data]);
  const [savedOnly, setSavedOnly] = useState(false);
  const [category, setCategory] = useState<DestinationCategory | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reporting, setReporting] = useState(false);
  /*
   * Reporting a hazard: the sheet (`reporting`), and where. `reportPoint` null
   * means "at my location"; a long-press or "Choose on map" sets a spot.
   * While `picking`, the sheet steps aside and a pin in the middle of the map
   * marks the spot until "Use this spot".
   */
  const [reportPoint, setReportPoint] = useState<{ latitude: number; longitude: number } | null>(null);
  const [picking, setPicking] = useState(false);
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null);
  const [showRadius, setShowRadius] = useState(true);
  const [showFriends, setShowFriends] = useState(true);
  const [mapError, setMapError] = useState(false);
  const ratings = useRatings();
  const proximityVisible = useProximityCard().visible;
  const hazardVisible = useHazardCard().visible;
  // Starts open on tall phones; on short ones it would sit under the map buttons.
  const [nearbyOpen] = useStorage(StorageKeys.exploreNearbyOpen, height >= 720);

  // Initial camera: user's position if already known, else all of Pakistan.
  const [initial] = useState(() =>
    location
      ? { center: [location.longitude, location.latitude] as [number, number], zoom: 13 }
      : { center: PAKISTAN_CENTER, zoom: 4.8 },
  );

  const visible = useMemo(
    () => (destinations.data ?? []).filter((d) => (!category || d.category === category) && (!savedOnly || savedSet.has(d.id))),
    [destinations.data, category, savedOnly, savedSet],
  );
  const selected = useMemo(() => destinations.data?.find((d) => d.id === selectedId) ?? null, [destinations.data, selectedId]);
  // "Popular places nearby": the closest of the places on the map, or the most popular without a location.
  const nearby = useMemo(() => {
    const list = location
      ? visible.map((d) => ({ d, dist: distanceMeters(location, d) as number | null })).sort((a, b) => (a.dist ?? 0) - (b.dist ?? 0))
      : [...visible].sort((a, b) => b.popularity - a.popularity).map((d) => ({ d, dist: null as number | null }));
    return list.slice(0, 10);
  }, [visible, location]);

  // ?focus=<id> from details/search: select during render, move the camera in an effect.
  const [handledFocus, setHandledFocus] = useState<string | undefined>(undefined);
  if (params.focus && params.focus !== handledFocus && destinations.data) {
    setHandledFocus(params.focus);
    setSelectedId(params.focus);
  }
  useEffect(() => {
    const d = handledFocus ? destinations.data?.find((x) => x.id === handledFocus) : undefined;
    if (d) map.current?.flyTo(d.longitude, d.latitude, 14);
  }, [handledFocus, destinations.data]);

  // ?alert=<id>&at=<time> from a hazard card's "Show on map": outline it and fly there.
  const alertRequest = params.alert ? `${params.alert}:${params.at ?? ''}` : undefined;
  const [handledAlert, setHandledAlert] = useState<string | undefined>(undefined);
  if (alertRequest && alertRequest !== handledAlert && alerts.data) {
    setHandledAlert(alertRequest);
    setSelectedId(null);
    setSelectedAlertId(params.alert ?? null);
  }
  useEffect(() => {
    const id = handledAlert?.split(':')[0];
    const a = id ? alerts.data?.find((x) => x.id === id) : undefined;
    // Zoom out far enough to see its whole warning area.
    if (a) map.current?.flyTo(a.longitude, a.latitude, Math.max(7, Math.min(15, 14 - Math.log2(Math.max(a.radius_m, 250) / 500))));
  }, [handledAlert, alerts.data]);

  // A long-pressed spot: directions to it, or a hazard report there.
  const [spot, setSpot] = useState<{ latitude: number; longitude: number } | null>(null);
  const [shownSpot, setShownSpot] = useState(spot);
  if (spot && spot !== shownSpot) setShownSpot(spot);
  const spotName = useSpotName(shownSpot);

  const startReport = (point: { latitude: number; longitude: number } | null) => {
    setReportPoint(point);
    setPicking(false);
    setReporting(true);
  };
  const confirmPickedSpot = async () => {
    const center = await map.current?.getCenter();
    if (center) startReport({ longitude: center[0], latitude: center[1] });
  };
  const cancelPicking = () => {
    setPicking(false);
    setReporting(true);
  };

  // Follow the simulated position (real GPS uses native camera tracking).
  useEffect(() => {
    if (location?.simulated) map.current?.flyTo(location.longitude, location.latitude, 14);
  }, [location]);

  const locateMe = useCallback(async () => {
    if (locationState.permission !== 'granted') {
      const ok = await requestLocationPermission();
      if (!ok) return;
    }
    const fix = await getCurrentFix();
    if (fix) map.current?.flyTo(fix.longitude, fix.latitude, 15);
  }, [locationState.permission]);

  if (mapError) {
    return (
      <View className="flex-1 justify-center bg-background" style={{ paddingTop: insets.top }}>
        <ErrorState title={tx('Unable to load map data')} error="Check your connection, or download an offline map region first." onRetry={() => setMapError(false)} />
      </View>
    );
  }

  const showFriendMarkers = showFriends && Boolean(userId);
  const alertCardUp = proximityVisible || hazardVisible;
  // During a journey you are an arrow pointing along the route (the route's
  // direction where you are, else your GPS course, else towards the destination).
  const arrow =
    journeyActive && journey.route && location
      ? {
          longitude: location.longitude,
          latitude: location.latitude,
          bearing: journey.progress?.bearing ?? validHeading(location.heading) ?? bearingTo(location, journey.route.to),
        }
      : null;
  const sharingLive = isSessionLive(sharing);

  return (
    <View className="flex-1 bg-background">
      <TravelMap
        ref={map}
        destinations={visible}
        savedIds={savedSet}
        alerts={alerts.data ?? []}
        friends={showFriendMarkers ? friends.locations : []}
        route={journeyActive ? journey.route : null}
        selectedId={selectedId}
        showRadius={showRadius}
        navigating={false}
        simulatedFix={location?.simulated ? location : null}
        showUser={locationState.permission === 'granted'}
        arrow={arrow}
        initialCenter={initial.center}
        initialZoom={initial.zoom}
        onSelectDestination={(id) => {
          setSelectedId(id);
        }}
        selectedAlertId={selectedAlertId}
        pickedPoint={spot ?? (reporting && reportPoint ? reportPoint : null)}
        onLongPress={!picking ? (p) => setSpot(p) : undefined}
        onSelectAlert={(id) => {
          setSelectedId(null);
          setSelectedAlertId(id);
          const a = alerts.data?.find((x) => x.id === id);
          if (a) hazardCard.show(a.id, location ? distanceMeters(location, a) : a.radius_m + 1);
        }}
        onMapPress={() => {
          setSelectedId(null);
          setSelectedAlertId(null);
        }}
        onLoadError={() => setMapError(true)}
      />

      {/* Top overlay: search, filters, status */}
      <View className="absolute left-0 right-0 top-0 gap-2" style={{ paddingTop: insets.top + 8 }} pointerEvents="box-none">
        <View
          className="mx-3 min-h-[52px] flex-row items-center gap-3 rounded-full bg-card"
          style={{ paddingEnd: 6, paddingStart: 16, boxShadow: shadow(0.12, 6, 18) }}
        >
          <Pressable accessibilityRole="search" onPress={() => router.push('/search')} className="min-h-12 flex-1 flex-row items-center gap-3 active:opacity-70">
            <Search color={colors.heading} size={20} />
            <Text numberOfLines={1} className="flex-1 text-[15px] text-faint">
              {tx('Search places, cities or attractions')}
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={tx('Offline maps')}
            onPress={() => router.push('/offline-maps')}
            className="h-10 w-10 items-center justify-center rounded-full bg-primary-soft active:opacity-70"
          >
            <Download color={colors.primary} size={18} />
          </Pressable>
        </View>
        {/* Vertical padding keeps the chips' shadows from being clipped. */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-my-1.5" contentContainerClassName="gap-2 px-3 py-1.5">
          <Chip floating label={tx('All')} selected={!category && !savedOnly} onPress={() => { setCategory(null); setSavedOnly(false); }} />
          {userId ? (
            <Chip
              floating
              label={savedSet.size ? tx('Saved ({0})', { 0: savedSet.size }) : tx('Saved')}
              icon={<Bookmark size={15} color={savedOnly ? colors.primaryForeground : colors.primary} fill={savedOnly ? colors.primaryForeground : 'transparent'} />}
              selected={savedOnly}
              onPress={() => setSavedOnly((v) => !v)}
            />
          ) : null}
          {CATEGORY_ORDER.map((c) => {
            const Icon = DESTINATION_CATEGORIES[c].icon;
            return (
              <Chip
                floating
                key={c}
                label={DESTINATION_CATEGORIES[c].label}
                icon={<Icon size={15} color={category === c ? colors.primaryForeground : colors.primary} />}
                selected={category === c}
                onPress={() => setCategory(category === c ? null : c)}
              />
            );
          })}
        </ScrollView>
        <OfflineBanner />
        <View className="gap-2 px-3">
          {sim.running ? (
            <View className="flex-row items-center gap-2 rounded-2xl bg-info/20 px-3 py-2">
              <Info color={colors.info} size={16} />
              <Text className="flex-1 text-xs text-foreground">{tx('Simulating journey to {0} ({1}/{2})', { 0: sim.targetName, 1: sim.step, 2: sim.total })}</Text>
            </View>
          ) : null}
          {sharingLive ? (
            <Pressable onPress={() => router.push('/safety')} className="flex-row items-center gap-2 rounded-2xl bg-success/20 px-3 py-2">
              <View className="h-2 w-2 rounded-full bg-success" />
              <Text className="flex-1 text-xs text-foreground">{tx('Sharing your live location with friends. Tap to manage.')}</Text>
            </Pressable>
          ) : null}
          {destinations.isError && !destinations.data ? (
            <View className="rounded-2xl bg-card px-3 py-2">
              <Text className="text-xs text-destructive">{tx('Unable to load destinations. Pull down on Home to retry.')}</Text>
            </View>
          ) : null}
          <LocationStatusCard compact />
        </View>
      </View>

      {/* Right-side controls */}
      <View className="absolute gap-2" style={{ end: 12, top: insets.top + 196 }}>
        <IconButton icon={Crosshair} label={tx('Show my location')} onPress={locateMe} />
        {userId ? <IconButton icon={TriangleAlert} label={tx('Report hazard')} onPress={() => startReport(null)} /> : null}
        <IconButton icon={CircleDashed} label={tx('Toggle geofence radius')} active={showRadius} onPress={() => setShowRadius((v) => !v)} />
        {userId ? (
          <IconButton icon={Users} label={tx('Toggle friends on map')} active={showFriends} onPress={() => setShowFriends((v) => !v)} />
        ) : null}
      </View>

      {/* Bottom: active journey > tapped place > popular places nearby. */}
      <View className="absolute left-3 right-3 gap-2" style={{ bottom: tabSpace - 12 }} pointerEvents={picking ? 'none' : 'box-none'}>
        {picking ? null : journeyActive && journey.target ? (
          <View className="flex-row items-center gap-3 rounded-[20px] bg-primary p-3" style={{ paddingStart: 16, boxShadow: shadow(0.25, 6, 18) }}>
            <Navigation color={colors.primaryForeground} size={20} />
            <View className="flex-1">
              <Text numberOfLines={2} className="text-base font-semibold text-white">{tx('Navigating to {0}', { 0: journey.target.name })}</Text>
              <Text className="text-xs text-white/80">
                {journey.progress ? tx('{0} left', { 0: formatDistance(journey.progress.remaining) }) : tx('Tap Resume to continue')}
              </Text>
            </View>
            <AppButton label={tx('Resume')} size="sm" variant="secondary" onPress={() => router.push('/journey/navigate')} />
          </View>
        ) : selected ? (
          <PlacePreview place={selected} location={location} saved={savedSet.has(selected.id)} />
        ) : nearby.length && !alertCardUp ? (
          // Steps aside while a landmark or hazard card is up (they share the bottom of the screen).
          <Animated.View
            entering={PANEL_IN}
            exiting={PANEL_OUT}
            layout={PANEL_LAYOUT}
            className="overflow-hidden rounded-[28px] bg-background pt-1.5"
            style={{ boxShadow: shadow(0.14, 6, 24) }}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ expanded: nearbyOpen }}
              onPress={() => storage.set(StorageKeys.exploreNearbyOpen, !nearbyOpen)}
              className="min-h-11 flex-row items-center justify-between px-4 active:opacity-70"
            >
              <Text className="font-display text-[17px] leading-6 text-heading">{location ? tx('Popular places nearby') : tx('Popular destinations')}</Text>
              <View className="flex-row items-center gap-1">
                <Text className="text-[13px] font-semibold text-accent">{nearbyOpen ? tx('Hide') : tx('Show')}</Text>
                <Animated.View style={{ transform: [{ rotate: nearbyOpen ? '0deg' : '180deg' }], transitionProperty: 'transform', transitionDuration: 220, transitionTimingFunction: CSS_EASE_OUT }}>
                  <ChevronDown color={colors.accent} size={16} />
                </Animated.View>
              </View>
            </Pressable>
            {nearbyOpen ? (
              <Animated.View entering={CARDS_IN} exiting={CARDS_OUT}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-3 px-4 pb-4 pt-1.5">
                  {nearby.map(({ d, dist }) => (
                    <DestinationCard key={d.id} destination={d} distance={dist} rating={ratings.data?.[d.id]?.average_rating} width={156} />
                  ))}
                </ScrollView>
              </Animated.View>
            ) : null}
          </Animated.View>
        ) : null}
      </View>
      {picking ? (
        <>
          {/* The pin marks the map's centre: move the map under it. */}
          <View pointerEvents="none" className="absolute inset-0 items-center justify-center">
            <View style={{ transform: [{ translateY: -18 }] }}>
              <MapPin color={colors.destructive} fill={colors.card} size={40} />
            </View>
          </View>
          <View className="absolute left-3 right-3 gap-3 rounded-[28px] bg-card p-4" style={{ bottom: tabSpace - 12, boxShadow: shadow(0.18, 8, 24) }}>
            <View className="flex-row items-start gap-3">
              <Text className="flex-1 text-sm text-foreground">{tx('Move the map until the pin is on the hazard.')}</Text>
              <Pressable accessibilityRole="button" accessibilityLabel={tx('Cancel')} hitSlop={10} onPress={cancelPicking}>
                <X color={colors.mutedForeground} size={18} />
              </Pressable>
            </View>
            <AppButton label={tx('Use this spot')} icon={MapPin} onPress={confirmPickedSpot} />
          </View>
        </>
      ) : null}
      <Sheet
        visible={Boolean(spot)}
        onClose={() => setSpot(null)}
        dragAnywhere
        header={
          <View className="flex-row items-start gap-3 pb-1">
            <View className="h-11 w-11 items-center justify-center rounded-full bg-peach">
              <MapPin color={colors.accent} size={20} />
            </View>
            <View className="flex-1 gap-0.5">
              <Text accessibilityRole="header" className="font-display text-xl leading-7 text-heading">
                {spotName.data?.name ?? tx('Dropped pin')}
              </Text>
              <Text className="text-sm text-muted-foreground" style={{ fontVariant: ['tabular-nums'] }}>
                {[spotName.data?.subtitle, location && shownSpot ? tx('{0} away', { 0: formatDistance(distanceMeters(location, shownSpot)) }) : null]
                  .filter(Boolean)
                  .join(' · ')}
              </Text>
            </View>
          </View>
        }
      >
        <AppButton
          label={tx('Directions to here')}
          icon={Navigation}
          disabled={!spotName.data || !shownSpot}
          onPress={() => {
            if (!spotName.data || !shownSpot) return;
            setSpot(null);
            navigateTo({ id: spotName.data.id, name: spotName.data.name, subtitle: spotName.data.subtitle, ...shownSpot });
          }}
        />
        <AppButton
          label={tx('Report a hazard here')}
          icon={TriangleAlert}
          variant="secondary"
          onPress={() => {
            const p = shownSpot;
            setSpot(null);
            startReport(p);
          }}
        />
      </Sheet>
      <ReportHazardSheet
        visible={reporting && !picking}
        point={reportPoint}
        onPickOnMap={() => {
          setReporting(false);
          setPicking(true);
        }}
        onUseMyLocation={() => setReportPoint(null)}
        onClose={() => {
          setReporting(false);
          setReportPoint(null);
        }}
      />
    </View>
  );
}
