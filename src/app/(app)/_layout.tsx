import { Stack } from 'expo-router';
import { useEffect } from 'react';

import { useInboxRealtime } from '@/features/inbox/api';
import { LocationProvider } from '@/features/location/location-provider';
import { locationStore } from '@/features/location/location-store';
import { useNotificationRouting } from '@/features/notifications/use-notification-routing';
import { ProximityCardOverlay } from '@/features/proximity/proximity-card';
import { ProximityProvider } from '@/features/proximity/proximity-provider';
import { pushSharedLocation, reconcileSharing } from '@/features/safety/sharing';
import { colors } from '@/lib/theme';

function AppEffects() {
  useNotificationRouting();
  useInboxRealtime();

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
          <Stack.Screen name="scan" options={{ animation: 'slide_from_bottom' }} />
          <Stack.Screen name="lens" options={{ animation: 'slide_from_bottom' }} />
          <Stack.Screen name="post/new" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
          <Stack.Screen name="story/new" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
          <Stack.Screen name="story/[id]" options={{ presentation: 'fullScreenModal', animation: 'fade' }} />
          <Stack.Screen name="review/new" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        </Stack>
        <ProximityCardOverlay />
      </ProximityProvider>
    </LocationProvider>
  );
}
