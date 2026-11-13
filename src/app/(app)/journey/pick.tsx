import { router } from 'expo-router';
import { ArrowLeft, Crosshair, MapPin, Navigation } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton, IconButton } from '@/components/app-button';
import { ErrorState } from '@/components/states';
import { Text } from '@/components/text';
import { COUNTRY } from '@/constants/app.constants';
import { useRoadAlerts } from '@/features/alerts/api';
import { useDestinations } from '@/features/destinations/api';
import { getCurrentFix } from '@/features/location/location-provider';
import { useLastLocation, useLocationState } from '@/features/location/location-store';
import { useSpotName } from '@/features/map/spot-name';
import { TravelMap, type TravelMapHandle } from '@/features/map/travel-map';
import { navigateTo } from '@/features/routing/navigate';
import { distanceMeters, formatDistance } from '@/lib/geo';
import { tx } from '@/lib/i18n';
import { colors, shadow } from '@/lib/theme';

/**
 * "Choose on map" for a journey: move the map until the pin in the middle is
 * on the destination (or tap a landmark to jump to it), then "Directions to
 * here". The card names the spot from the phone's own data, so it works
 * offline too.
 */
export default function PickDestination() {
  const insets = useSafeAreaInsets();
  const map = useRef<TravelMapHandle>(null);
  const location = useLastLocation();
  const locationState = useLocationState();
  const destinations = useDestinations();
  const alerts = useRoadAlerts();
  const [mapError, setMapError] = useState(false);
  const [initial] = useState(() =>
    location
      ? { center: [location.longitude, location.latitude] as [number, number], zoom: 14 }
      : { center: COUNTRY.center, zoom: 5 },
  );
  const [center, setCenter] = useState({ latitude: initial.center[1], longitude: initial.center[0] });
  const spot = useSpotName(center);
  const distance = location ? distanceMeters(location, center) : null;
  const tooClose = distance != null && distance < 50;

  const locateMe = async () => {
    const fix = await getCurrentFix();
    if (fix) map.current?.flyTo(fix.longitude, fix.latitude, 15);
  };

  const go = () => {
    if (!spot.data) return;
    navigateTo({ id: spot.data.id, name: spot.data.name, subtitle: spot.data.subtitle, ...center }, { replace: true });
  };

  if (mapError) {
    return (
      <View className="flex-1 justify-center bg-background" style={{ paddingTop: insets.top }}>
        <ErrorState title={tx('Unable to load map data')} error="Check your connection, or download an offline map region first." onRetry={() => setMapError(false)} />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <TravelMap
        ref={map}
        destinations={destinations.data ?? []}
        alerts={alerts.data ?? []}
        friends={[]}
        route={null}
        selectedId={null}
        showRadius={false}
        navigating={false}
        simulatedFix={null}
        showUser={locationState.permission === 'granted'}
        initialCenter={initial.center}
        initialZoom={initial.zoom}
        // Tapping a landmark brings it under the pin.
        onSelectDestination={(id) => {
          const d = destinations.data?.find((x) => x.id === id);
          if (d) map.current?.flyTo(d.longitude, d.latitude, 15);
        }}
        onSelectAlert={() => undefined}
        onMapPress={() => undefined}
        onCenterChange={setCenter}
        onLoadError={() => setMapError(true)}
      />

      {/* The pin marks the map's centre; its point sits exactly on the spot. */}
      <View pointerEvents="none" className="absolute inset-0 items-center justify-center">
        <View style={{ transform: [{ translateY: -20 }] }}>
          <MapPin color={colors.accent} fill={colors.card} size={42} />
        </View>
      </View>

      <View className="absolute left-0 right-0 top-0 flex-row items-center gap-3 px-4" style={{ paddingTop: insets.top + 8 }} pointerEvents="box-none">
        <IconButton icon={ArrowLeft} flip label={tx('Go back')} onPress={() => (router.canGoBack() ? router.back() : router.replace('/search'))} />
        <View className="flex-1 rounded-full bg-card px-4 py-2.5" style={{ boxShadow: shadow(0.12, 6, 18) }}>
          <Text className="text-sm font-semibold text-heading">{tx('Move the map to your destination')}</Text>
        </View>
      </View>

      <View className="absolute end-4 gap-2" style={{ bottom: insets.bottom + 200 }}>
        {locationState.permission === 'granted' ? <IconButton icon={Crosshair} label={tx('Show my location')} onPress={locateMe} /> : null}
      </View>

      <View className="absolute bottom-0 left-0 right-0 gap-3 rounded-t-[28px] bg-card px-5 pt-5" style={{ paddingBottom: insets.bottom + 16, boxShadow: shadow(0.16, -6, 24) }}>
        <View className="flex-row items-start gap-3">
          <View className="h-11 w-11 items-center justify-center rounded-full bg-peach">
            <MapPin color={colors.accent} size={20} />
          </View>
          <View className="flex-1 gap-0.5">
            <Text accessibilityLiveRegion="polite" className="font-display text-xl leading-7 text-heading">
              {spot.data?.name ?? tx('Dropped pin')}
            </Text>
            <Text className="text-sm text-muted-foreground" style={{ fontVariant: ['tabular-nums'] }}>
              {[spot.data?.subtitle, distance != null ? tx('{0} away', { 0: formatDistance(distance) }) : null].filter(Boolean).join(' · ')}
            </Text>
          </View>
        </View>
        <AppButton
          label={tooClose ? tx('You are already here') : tx('Directions to here')}
          icon={Navigation}
          disabled={!spot.data || tooClose}
          onPress={go}
        />
      </View>
    </View>
  );
}
