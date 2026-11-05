import { useNetworkState } from 'expo-network';
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

export function OfflineBanner() {
  const online = useIsOnline();
  if (online) return null;
  return (
    <View className="mx-4 mb-2 flex-row items-center gap-2 rounded-xl bg-muted px-3 py-2" accessibilityRole="alert">
      <WifiOff color={colors.primary} size={16} />
      <Text className="flex-1 text-xs text-muted-foreground">
        {tx('No internet connection. Showing saved data; some actions need a connection.')}
      </Text>
    </View>
  );
}
