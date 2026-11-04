// Background tasks must be defined at module scope, before anything renders.
import '@/features/proximity/geofence-task';
import '@/features/safety/sharing';

import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { SplashScreen, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaListener } from 'react-native-safe-area-context';
import { Uniwind } from 'uniwind';

import { GluestackUIProvider } from '@/components/ui/gluestack-ui-provider';
import { AuthProvider, useAuth } from '@/features/auth/auth-provider';
import { configureNotifications } from '@/features/notifications/local-notifications';
import { SetupRequired } from '@/features/auth/setup-required';
import { isBackendConfigured } from '@/lib/env';
import { persistOptions, queryClient } from '@/lib/query-client';
import { StorageKeys, useStorage } from '@/lib/storage';
import { colors } from '@/lib/theme';
import '@/global.css';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

export default function RootLayout() {
  useEffect(() => {
    configureNotifications();
  }, []);

  return (
    <SafeAreaListener onChange={({ insets }) => Uniwind.updateInsets(insets)}>
      <GluestackUIProvider mode="light">
        <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.background }}>
          <KeyboardProvider>
            <StatusBar style="light" />
            <PersistQueryClientProvider client={queryClient} persistOptions={persistOptions}>
              {isBackendConfigured ? (
                <AuthProvider>
                  <RootNavigator />
                </AuthProvider>
              ) : (
                <SplashHider>
                  <SetupRequired />
                </SplashHider>
              )}
            </PersistQueryClientProvider>
          </KeyboardProvider>
        </GestureHandlerRootView>
      </GluestackUIProvider>
    </SafeAreaListener>
  );
}

function SplashHider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    SplashScreen.hideAsync().catch(() => undefined);
  }, []);
  return children;
}

/**
 * Route guards: onboarding -> auth -> app. Rendering waits for the persisted
 * session to be verified so the wrong screen never flashes on cold start.
 */
function RootNavigator() {
  const { loading, userId } = useAuth();
  const [onboarded] = useStorage(StorageKeys.onboardingDone, false);

  useEffect(() => {
    if (!loading) SplashScreen.hideAsync().catch(() => undefined);
  }, [loading]);

  if (loading) return null;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: 'fade_from_bottom',
      }}
    >
      <Stack.Protected guard={!onboarded}>
        <Stack.Screen name="onboarding" />
      </Stack.Protected>
      <Stack.Protected guard={onboarded && !userId}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
      <Stack.Protected guard={onboarded && Boolean(userId)}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
      {/* Reachable from the password-reset email deep link in any state. */}
      <Stack.Screen name="reset-password" />
    </Stack>
  );
}
