import { router, useLocalSearchParams } from 'expo-router';
import {
  Car,
  CircleDashed,
  Crosshair,
  Download,
  ExternalLink,
  Footprints,
  Info,
  Navigation,
  Search,
  TriangleAlert,
  Users,
  X,
} from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, View } from 'react-native';
import { Text } from '@/components/text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton, IconButton } from '@/components/app-button';
import { DestinationImage } from '@/components/destination-image';
import { Chip } from '@/components/form';
import { OfflineBanner } from '@/components/offline-banner';
import { ErrorState } from '@/components/states';
import { ALERT_LABELS, useRoadAlerts } from '@/features/alerts/api';
import { useTabBarSpace } from '@/components/tab-bar';
import { useAuth } from '@/features/auth/auth-provider';
import { useDestinations } from '@/features/destinations/api';
import { CATEGORY_ORDER, DESTINATION_CATEGORIES } from '@/features/destinations/categories';
import { getCurrentFix, requestLocationPermission } from '@/features/location/location-provider';
import { useLastLocation, useLocationState } from '@/features/location/location-store';
import { LocationStatusCard } from '@/features/location/location-status-card';
import { TravelMap, type TravelMapHandle } from '@/features/map/travel-map';
import { navigateTo } from '@/features/routing/navigate';
import { googleMapsDirectionsUrl } from '@/features/routing/osrm';
import { routeStore, useRouteState } from '@/features/routing/route-store';
import { useFriendLocations } from '@/features/safety/friend-locations';
import { useSharingSession, isSessionLive } from '@/features/safety/sharing';
import { useSimulator } from '@/features/proximity/simulator';
import { useTripActions } from '@/features/trips/api';
import { distanceMeters, distanceToLine, formatDistance, formatDuration, remainingRouteDistance } from '@/lib/geo';
import { usePreferences } from '@/lib/preferences';
import { colors, severityColors } from '@/lib/theme';
import type { DestinationCategory, RoadAlert } from '@/lib/types';

const PAKISTAN_CENTER: [number, number] = [70.5, 30.5];
const OFF_ROUTE_METERS = 150;

export default function ExploreScreen() {
  const insets = useSafeAreaInsets();
  const tabSpace = useTabBarSpace();
  const params = useLocalSearchParams<{ focus?: string }>();
  const map = useRef<TravelMapHandle>(null);
  const { userId } = useAuth();
  const [prefs, setPrefs] = usePreferences();

  const destinations = useDestinations();
  const alerts = useRoadAlerts();
  const friends = useFriendLocations();
  const location = useLastLocation();
  const locationState = useLocationState();
  const sim = useSimulator();
  const sharing = useSharingSession();
  const routeState = useRouteState();
  const tripActions = useTripActions();

  const [category, setCategory] = useState<DestinationCategory | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<RoadAlert | null>(null);
  const [showRadius, setShowRadius] = useState(true);
  const [showFriends, setShowFriends] = useState(true);
  const [mapError, setMapError] = useState(false);
  const arrivedFor = useRef<string | null>(null);

  // Initial camera: user's position if already known, else all of Pakistan.
  const [initial] = useState(() =>
    location
      ? { center: [location.longitude, location.latitude] as [number, number], zoom: 13 }
      : { center: PAKISTAN_CENTER, zoom: 4.8 },
  );

  const visible = useMemo(
    () => (destinations.data ?? []).filter((d) => !category || d.category === category),
    [destinations.data, category],
  );
  const selected = useMemo(() => destinations.data?.find((d) => d.id === selectedId) ?? null, [destinations.data, selectedId]);

  // Restore the last route when opening the map offline without one.
  useEffect(() => {
    if (!routeStore.get().route) routeStore.restoreLast();
  }, []);

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

  // Fit the camera to a newly calculated route.
  const routeKey = routeState.route?.createdAt;
  useEffect(() => {
    if (routeState.route && !routeState.navigating) map.current?.fitRoute(routeState.route);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeKey]);

  useEffect(() => {
    if (routeState.error) Alert.alert('Route unavailable', routeState.error);
  }, [routeState.error]);

  // Follow the simulated position (real GPS uses native camera tracking).
  useEffect(() => {
    if (location?.simulated) map.current?.flyTo(location.longitude, location.latitude, 14);
  }, [location]);

  const navInfo = useMemo(() => {
    const r = routeState.route;
    if (!r || !location) return null;
    const remaining = remainingRouteDistance(location, r.coordinates);
    const offRoute = distanceToLine(location, r.coordinates) > OFF_ROUTE_METERS;
    const toTarget = distanceMeters(location, r.to);
    const eta = r.distance > 0 ? (r.duration * remaining) / r.distance : 0;
    return { remaining, offRoute, toTarget, eta };
  }, [routeState.route, location]);

  // Arrival detection while navigating.
  useEffect(() => {
    const r = routeState.route;
    if (!routeState.navigating || !r || !navInfo) return;
    const dest = destinations.data?.find((d) => d.id === r.to.id);
    const threshold = Math.min(150, dest ? dest.radius_m / 2 : 100);
    if (navInfo.toTarget <= threshold && arrivedFor.current !== r.to.id) {
      arrivedFor.current = r.to.id ?? null;
      routeStore.stopNavigation();
      Alert.alert(`You have arrived at ${r.to.name ?? 'your destination'}`, 'Mark it as visited in your trip?', [
        { text: 'Not now', style: 'cancel' },
        {
          text: 'Mark visited',
          onPress: () => r.to.id && tripActions.setStatusForDestination.mutate({ destinationId: r.to.id, status: 'visited' }),
        },
      ]);
    }
  }, [navInfo, routeState.navigating, routeState.route, destinations.data, tripActions.setStatusForDestination]);

  const locateMe = useCallback(async () => {
    if (locationState.permission !== 'granted') {
      const ok = await requestLocationPermission();
      if (!ok) return;
    }
    const fix = await getCurrentFix();
    if (fix) map.current?.flyTo(fix.longitude, fix.latitude, 15);
  }, [locationState.permission]);

  const recalc = async () => {
    const r = routeState.route;
    const fix = location ?? (await getCurrentFix());
    if (r && fix) routeStore.request(fix, r.to, prefs.travelMode);
  };

  const switchMode = (mode: 'driving' | 'walking') => {
    setPrefs({ travelMode: mode });
    const r = routeState.route;
    if (r && location) routeStore.request(location, r.to, mode);
  };

  if (mapError) {
    return (
      <View className="flex-1 justify-center bg-background" style={{ paddingTop: insets.top }}>
        <ErrorState title="Unable to load map data" error="Check your connection, or download an offline map region first." onRetry={() => setMapError(false)} />
      </View>
    );
  }

  const showFriendMarkers = showFriends && Boolean(userId);
  const sharingLive = isSessionLive(sharing);

  return (
    <View className="flex-1 bg-background">
      <TravelMap
        ref={map}
        destinations={visible}
        alerts={alerts.data ?? []}
        friends={showFriendMarkers ? friends.locations : []}
        route={routeState.route}
        selectedId={selectedId}
        showRadius={showRadius}
        navigating={routeState.navigating}
        simulatedFix={location?.simulated ? location : null}
        showUser={locationState.permission === 'granted'}
        initialCenter={initial.center}
        initialZoom={initial.zoom}
        onSelectDestination={(id) => {
          setSelectedAlert(null);
          setSelectedId(id);
        }}
        onSelectAlert={(id) => {
          setSelectedId(null);
          setSelectedAlert(alerts.data?.find((a) => a.id === id) ?? null);
        }}
        onMapPress={() => {
          setSelectedId(null);
          setSelectedAlert(null);
        }}
        onLoadError={() => setMapError(true)}
      />

      {/* Top overlay: search, filters, status */}
      <View className="absolute left-0 right-0 top-0 gap-2" style={{ paddingTop: insets.top + 8 }} pointerEvents="box-none">
        <View className="flex-row items-center gap-2 px-3">
          <Pressable
            accessibilityRole="search"
            onPress={() => router.push('/search')}
            className="min-h-12 flex-1 flex-row items-center gap-2 rounded-2xl border border-border bg-card px-4"
          >
            <Search color={colors.mutedForeground} size={18} />
            <Text className="text-base text-muted-foreground">Search destinations</Text>
          </Pressable>
          <IconButton icon={Download} label="Offline maps" onPress={() => router.push('/offline-maps')} />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2 px-3">
          <Chip label="All" selected={!category} onPress={() => setCategory(null)} />
          {CATEGORY_ORDER.map((c) => (
            <Chip key={c} label={DESTINATION_CATEGORIES[c].label} selected={category === c} onPress={() => setCategory(category === c ? null : c)} />
          ))}
        </ScrollView>
        <OfflineBanner />
        <View className="gap-2 px-3">
          {sim.running ? (
            <View className="flex-row items-center gap-2 rounded-2xl bg-info/20 px-3 py-2">
              <Info color={colors.info} size={16} />
              <Text className="flex-1 text-xs text-foreground">
                Simulating journey to {sim.targetName} ({sim.step}/{sim.total})
              </Text>
            </View>
          ) : null}
          {sharingLive ? (
            <Pressable onPress={() => router.push('/safety')} className="flex-row items-center gap-2 rounded-2xl bg-success/20 px-3 py-2">
              <View className="h-2 w-2 rounded-full bg-success" />
              <Text className="flex-1 text-xs text-foreground">Sharing your live location with friends. Tap to manage.</Text>
            </Pressable>
          ) : null}
          {destinations.isError && !destinations.data ? (
            <View className="rounded-2xl bg-card px-3 py-2">
              <Text className="text-xs text-destructive">Unable to load destinations. Pull down on Home to retry.</Text>
            </View>
          ) : null}
          <LocationStatusCard compact />
        </View>
      </View>

      {/* Right-side controls */}
      <View className="absolute right-3 gap-2" style={{ top: insets.top + 190 }}>
        <IconButton icon={Crosshair} label="Show my location" onPress={locateMe} />
        <IconButton icon={CircleDashed} label="Toggle geofence radius" active={showRadius} onPress={() => setShowRadius((v) => !v)} />
        {userId ? (
          <IconButton icon={Users} label="Toggle friends on map" active={showFriends} onPress={() => setShowFriends((v) => !v)} />
        ) : null}
      </View>

      {/* Bottom panel: route > selection > alert */}
      <View className="absolute left-3 right-3 gap-2" style={{ bottom: tabSpace - 12 }}>
        {routeState.route || routeState.loading ? (
          <View className="gap-3 rounded-3xl border border-border bg-card p-4">
            {routeState.loading ? (
              <Text className="text-sm text-muted-foreground">Calculating route to {routeState.target?.name ?? 'destination'}...</Text>
            ) : routeState.route ? (
              <>
                <View className="flex-row items-start justify-between gap-2">
                  <View className="flex-1">
                    <Text numberOfLines={1} className="text-base font-bold text-foreground">
                      {routeState.route.to.name ?? 'Destination'}
                    </Text>
                    <Text className="text-sm text-accent">
                      {routeState.navigating && navInfo
                        ? `${formatDistance(navInfo.remaining)} left · ${formatDuration(navInfo.eta)}`
                        : `${formatDistance(routeState.route.distance)} · ${formatDuration(routeState.route.duration)}`}
                    </Text>
                    {routeState.offline ? (
                      <Text className="text-xs text-muted-foreground">Saved route (offline). Recalculate when online.</Text>
                    ) : null}
                  </View>
                  <IconButton icon={X} label="Clear route" onPress={() => routeStore.clear()} />
                </View>
                {routeState.navigating && navInfo?.offRoute ? (
                  <Pressable onPress={recalc} className="flex-row items-center gap-2 rounded-2xl bg-warning/20 px-3 py-2">
                    <TriangleAlert color={colors.warning} size={16} />
                    <Text className="flex-1 text-xs text-foreground">You seem to be off the route. Tap to recalculate.</Text>
                  </Pressable>
                ) : null}
                {routeState.navigating && routeState.route.steps[0] ? (
                  <Text numberOfLines={1} className="text-xs text-muted-foreground">
                    Next: {routeState.route.steps.find((s) => s.distance > 0)?.instruction ?? routeState.route.steps[0].instruction}
                  </Text>
                ) : null}
                <View className="flex-row gap-2">
                  <Chip label="Drive" icon={<Car size={14} color={prefs.travelMode === 'driving' ? colors.accentForeground : colors.foreground} />} selected={prefs.travelMode === 'driving'} onPress={() => switchMode('driving')} />
                  <Chip label="Walk" icon={<Footprints size={14} color={prefs.travelMode === 'walking' ? colors.accentForeground : colors.foreground} />} selected={prefs.travelMode === 'walking'} onPress={() => switchMode('walking')} />
                </View>
                <View className="flex-row gap-2">
                  {routeState.navigating ? (
                    <AppButton label="Stop" variant="secondary" onPress={() => routeStore.stopNavigation()} className="flex-1" />
                  ) : (
                    <AppButton label="Start" icon={Navigation} variant="accent" onPress={() => routeStore.startNavigation()} className="flex-1" />
                  )}
                  <AppButton
                    label="Google Maps"
                    icon={ExternalLink}
                    variant="outline"
                    onPress={() => Linking.openURL(googleMapsDirectionsUrl(routeState.route!.to, prefs.travelMode))}
                    className="flex-1"
                  />
                </View>
              </>
            ) : null}
          </View>
        ) : selected ? (
          <View className="flex-row gap-3 rounded-3xl border border-border bg-card p-3">
            <DestinationImage uri={selected.image_url} category={selected.category} className="h-24 w-24 rounded-2xl" recyclingKey={selected.id} />
            <View className="flex-1 gap-1">
              <Text numberOfLines={1} className="text-base font-bold text-foreground">
                {selected.name}
              </Text>
              <Text numberOfLines={1} className="text-xs text-muted-foreground">
                {DESTINATION_CATEGORIES[selected.category].label} · {selected.city}
                {location ? ` · ${formatDistance(distanceMeters(location, selected))}` : ''}
              </Text>
              <Text numberOfLines={2} className="text-xs text-foreground">
                {selected.short_description}
              </Text>
              <View className="mt-1 flex-row gap-2">
                <AppButton label="Details" size="sm" variant="secondary" onPress={() => router.push({ pathname: '/destination/[id]', params: { id: selected.id } })} className="flex-1" />
                <AppButton label="Navigate" size="sm" icon={Navigation} variant="accent" onPress={() => navigateTo(selected)} className="flex-1" />
              </View>
            </View>
          </View>
        ) : selectedAlert ? (
          <View className="gap-2 rounded-3xl border bg-card p-4" style={{ borderColor: severityColors[selectedAlert.severity] }}>
            <View className="flex-row items-center gap-2">
              <TriangleAlert color={severityColors[selectedAlert.severity]} size={18} />
              <Text className="flex-1 text-base font-bold text-foreground">{selectedAlert.title}</Text>
            </View>
            <Text className="text-xs font-semibold uppercase" style={{ color: severityColors[selectedAlert.severity] }}>
              {selectedAlert.severity} · {ALERT_LABELS[selectedAlert.alert_type]}
            </Text>
            <Text className="text-sm text-muted-foreground">{selectedAlert.description}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}
