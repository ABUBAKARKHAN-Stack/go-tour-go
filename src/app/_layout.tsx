// Background tasks must be defined at module scope, before anything renders.
import '@/features/proximity/geofence-task';
import '@/features/safety/sharing';
import '@/features/journey/journey-task';

import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { useFonts } from 'expo-font';
import { SplashScreen, Stack, type ErrorBoundaryProps } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Share, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaListener } from 'react-native-safe-area-context';
import { Uniwind } from 'uniwind';

import { AuthProvider, useAuth } from '@/features/auth/auth-provider';
import { configureNotifications } from '@/features/notifications/local-notifications';
import { SetupRequired } from '@/features/auth/setup-required';
import { crashReport, installGlobalErrorHandler, recordError } from '@/lib/crash-log';
import { isBackendConfigured } from '@/lib/env';
import { fontAssets } from '@/lib/fonts';
import { persistOptions, queryClient } from '@/lib/query-client';
import { StorageKeys, useStorage } from '@/lib/storage';
import { colors } from '@/lib/theme';
import '@/global.css';

SplashScreen.preventAutoHideAsync().catch(() => undefined);
installGlobalErrorHandler();

/**
 * Shown instead of closing the app when a screen throws while rendering. The
 * error is saved (Settings → Demo tools → Last error) and can be shared.
 * Kept free of app providers and fonts, since those may be what failed.
 */
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  const [at] = useState(() => Date.now());
  useEffect(() => {
    recordError(error, 'screen', true);
    SplashScreen.hideAsync().catch(() => undefined);
  }, [error]);
  const report = crashReport({ message: error.message, stack: error.stack ?? null, at, fatal: true, where: 'screen' });
  return (
    <View style={{ flex: 1, backgroundColor: '#FBF8F3', padding: 24, paddingTop: 72, gap: 16 }}>
      <Text style={{ fontSize: 26, fontWeight: '700', color: '#1C1A17' }}>Something went wrong</Text>
      <Text style={{ fontSize: 15, color: '#6B6459' }}>GoTourGo hit an error. Please share the details below with the developer, then try again.</Text>
      <ScrollView style={{ maxHeight: 260, borderRadius: 16, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E8E1D6' }} contentContainerStyle={{ padding: 12 }}>
        <Text selectable style={{ fontSize: 12, color: '#1C1A17' }}>
          {report}
        </Text>
      </ScrollView>
      <Pressable accessibilityRole="button" onPress={() => Share.share({ message: report })} style={{ minHeight: 52, borderRadius: 999, backgroundColor: '#DCEBE8', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 16, fontWeight: '700', color: '#0F4C4A' }}>Share error details</Text>
      </Pressable>
      <Pressable accessibilityRole="button" onPress={retry} style={{ minHeight: 52, borderRadius: 999, backgroundColor: '#0F4C4A', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 16, fontWeight: '700', color: '#FFFFFF' }}>Try again</Text>
      </Pressable>
    </View>
  );
}

export default function RootLayout() {
  // A font that fails to load falls back to the system font rather than blocking the app.
  const [fontsLoaded, fontError] = useFonts(fontAssets);

  useEffect(() => {
    configureNotifications();
  }, []);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaListener onChange={({ insets }) => Uniwind.updateInsets(insets)}>
      <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.background }}>
        <KeyboardProvider>
          <StatusBar style="dark" />
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
      {/*
        Every guard needs an explicit redirectTo. Without one, expo-router falls
        back to the first unguarded route's URL; for the (auth) group that is
        "/(auth)", which has no index screen and renders "Unmatched route"
        (seen after finishing onboarding and after signing out).
      */}
      <Stack.Protected guard={!onboarded} redirectTo={userId ? '/' : '/sign-in'}>
        <Stack.Screen name="onboarding" />
      </Stack.Protected>
      <Stack.Protected guard={onboarded && !userId} redirectTo={onboarded ? '/' : '/onboarding'}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
      <Stack.Protected guard={onboarded && Boolean(userId)} redirectTo={onboarded ? '/sign-in' : '/onboarding'}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
      {/* Reachable from the password-reset email deep link in any state. */}
      <Stack.Screen name="reset-password" />
    </Stack>
  );
}
