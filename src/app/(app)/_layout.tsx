import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { AppState } from 'react-native';

import { dataSyncStore, syncLocalData } from '@/features/data/sync';
import { HazardCardOverlay } from '@/features/alerts/hazard-card';
import { GuestGateOverlay } from '@/features/auth/guest-gate';
import { useInboxRealtime } from '@/features/inbox/api';
import { useJourneyEffects } from '@/features/journey/use-journey-effects';
import { LocationProvider } from '@/features/location/location-provider';
import { locationStore } from '@/features/location/location-store';
import { useNotificationRouting } from '@/features/notifications/use-notification-routing';
import { offlineDownloads } from '@/features/offline/downloads';
import { resumeSavedRouteDownloads } from '@/features/offline/saved-routes';
import { ProximityCardOverlay } from '@/features/proximity/proximity-card';
import { ProximityProvider } from '@/features/proximity/proximity-provider';
import { pushSharedLocation, reconcileSharing } from '@/features/safety/sharing';
import { colors } from '@/lib/theme';

function AppEffects() {
  useNotificationRouting();
  useInboxRealtime();
  useJourneyEffects();

  // Keep the offline copy of places and landmarks current: on start, then when
  // the app returns to the foreground at most every 6 hours (a version check
  // is one small request; data downloads only when the server's version moved).
  useEffect(() => {
    // Offline maps: continue downloads that were interrupted when the app closed.
    offlineDownloads.restore();
    resumeSavedRouteDownloads().catch(() => undefined);
  }, []);

  useEffect(() => {
    syncLocalData().catch(() => undefined);
    const sub = AppState.addEventListener('change', (next) => {
      const last = dataSyncStore.get().lastSyncAt ?? 0;
      if (next === 'active' && Date.now() - last > 6 * 60 * 60 * 1000) syncLocalData().catch(() => undefined);
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    reconcileSharing().catch(() => undefined);
    // Foreground location sharing piggybacks on the regular watcher (throttled).
    return locationStore.onFix((fix) => {
      if (!fix.simulated) pushSharedLocation(fix).catch(() => undefined);
    });
  }, []);

  return null;
}

export default function AppLayout() {
  return (
    <LocationProvider>
      <ProximityProvider>
        <AppEffects />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="journey/index" options={{ animation: 'slide_from_bottom' }} />
          <Stack.Screen name="journey/navigate" options={{ gestureEnabled: false, animation: 'fade' }} />
          <Stack.Screen name="scan" options={{ animation: 'slide_from_bottom' }} />
          <Stack.Screen name="lens" options={{ animation: 'slide_from_bottom' }} />
          <Stack.Screen name="post/new" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
          <Stack.Screen name="story/new" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
          <Stack.Screen name="story/[id]" options={{ presentation: 'fullScreenModal', animation: 'fade' }} />
          <Stack.Screen name="media/[id]" options={{ presentation: 'fullScreenModal', animation: 'fade' }} />
          <Stack.Screen name="review/new" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
          <Stack.Screen name="create-account" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        </Stack>
        <ProximityCardOverlay />
        <HazardCardOverlay />
        <GuestGateOverlay />
      </ProximityProvider>
    </LocationProvider>
  );
}
