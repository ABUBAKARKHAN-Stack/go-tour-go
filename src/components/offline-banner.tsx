import { useNetworkState } from 'expo-network';
import { useEffect, useSyncExternalStore } from 'react';
import { WifiOff } from 'lucide-react-native';
import { View } from 'react-native';
import { Text } from '@/components/text';

import { colors } from '@/lib/theme';
import { tx } from '@/lib/i18n';

export function useIsOnline() {
  const state = useNetworkState();
  // Unknown state (undefined) is treated as online to avoid false alarms.
  return state.isConnected !== false && state.isInternetReachable !== false;
}

/**
 * Full "You're offline" cards on screen right now. While one shows, the top
 * banner stays hidden, so a screen never says it twice.
 */
let offlineCards = 0;
const cardListeners = new Set<() => void>();
const subscribeCards = (l: () => void) => {
  cardListeners.add(l);
  return () => {
    cardListeners.delete(l);
  };
};

/** Called by the full offline card while it is on screen. */
export function useRegisterOfflineCard() {
  useEffect(() => {
    offlineCards += 1;
    cardListeners.forEach((l) => l());
    return () => {
      offlineCards -= 1;
      cardListeners.forEach((l) => l());
    };
  }, []);
}

export function OfflineBanner({ message }: { message?: string } = {}) {
  const online = useIsOnline();
  const cardShown = useSyncExternalStore(subscribeCards, () => offlineCards > 0);
  if (online || cardShown) return null;
  return (
    <View className="mx-4 mb-2 flex-row items-center gap-2 rounded-xl bg-muted px-3 py-2" accessibilityRole="alert">
      <WifiOff color={colors.primary} size={16} />
      <Text className="flex-1 text-xs text-muted-foreground">
        {message ?? tx('No internet connection. Showing saved data; some actions need a connection.')}
      </Text>
    </View>
  );
}
