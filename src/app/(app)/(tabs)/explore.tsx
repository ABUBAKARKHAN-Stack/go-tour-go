import { router, useLocalSearchParams } from 'expo-router';
import {
  CircleDashed,
  Crosshair,
  Download,
  Info,
  Navigation,
  Search,
  TriangleAlert,
  Users,
} from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
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
import { useJourney } from '@/features/journey/journey-store';
import { useFriendLocations } from '@/features/safety/friend-locations';
import { useSharingSession, isSessionLive } from '@/features/safety/sharing';
import { useSimulator } from '@/features/proximity/simulator';
import { distanceMeters, formatDistance } from '@/lib/geo';
import { colors, severityColors } from '@/lib/theme';
import type { DestinationCategory, RoadAlert } from '@/lib/types';

const PAKISTAN_CENTER: [number, number] = [70.5, 30.5];

export default function ExploreScreen() {
  const insets = useSafeAreaInsets();
  const tabSpace = useTabBarSpace();
  const params = useLocalSearchParams<{ focus?: string }>();
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

  const [category, setCategory] = useState<DestinationCategory | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<RoadAlert | null>(null);
  const [showRadius, setShowRadius] = useState(true);
  const [showFriends, setShowFriends] = useState(true);
  const [mapError, setMapError] = useState(false);

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
        route={journeyActive ? journey.route : null}
        selectedId={selectedId}
        showRadius={showRadius}
        navigating={false}
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
            <Text className="text-base text-muted-foreground">Where to?</Text>
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
        {journeyActive && journey.target ? (
          <View className="flex-row items-center gap-3 rounded-3xl bg-primary p-3 pl-4" style={{ boxShadow: '0 6px 18px rgba(15,76,74,0.25)' }}>
            <Navigation color={colors.primaryForeground} size={20} />
            <View className="flex-1">
              <Text numberOfLines={1} className="text-base font-semibold text-white">
                Navigating to {journey.target.name}
              </Text>
              <Text className="text-xs text-white/80">
                {journey.progress ? `${formatDistance(journey.progress.remaining)} left` : 'Tap Resume to continue'}
              </Text>
            </View>
            <AppButton label="Resume" size="sm" variant="secondary" onPress={() => router.push('/journey/navigate')} />
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
                <AppButton label="Directions" size="sm" icon={Navigation} onPress={() => navigateTo(selected)} className="flex-1" />
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
