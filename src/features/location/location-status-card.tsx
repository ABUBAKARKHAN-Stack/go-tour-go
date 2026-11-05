import { LocateFixed, MapPinOff, Settings } from 'lucide-react-native';
import { Linking, View } from 'react-native';
import { Text } from '@/components/text';

import { AppButton } from '@/components/app-button';
import {
  openLocationSettings,
  requestLocationPermission,
  startWatching,
} from '@/features/location/location-provider';
import { useLocationState } from '@/features/location/location-store';
import { requestNotificationPermission } from '@/features/notifications/local-notifications';
import { colors } from '@/lib/theme';

/**
 * Explains and resolves every location state: not yet asked, denied,
 * services off, unavailable/GPS error. Renders nothing when location works.
 */
export function LocationStatusCard({ compact }: { compact?: boolean }) {
  const s = useLocationState();
  if (s.simulating) return null;

  let title = '';
  let message = '';
  let action: { label: string; onPress: () => void; icon: typeof LocateFixed } | null = null;

  if (s.permission === 'unknown') return null;
  if (s.permission === 'undetermined') {
    title = 'Turn on location';
    message = 'GoTourGo uses your location to show nearby landmarks, alert you when you arrive and calculate routes.';
    action = {
      label: 'Allow location',
      // After location, ask for notifications so landmark arrival alerts can be shown.
      onPress: async () => {
        if (await requestLocationPermission()) await requestNotificationPermission();
      },
      icon: LocateFixed,
    };
  } else if (s.permission === 'denied') {
    title = 'Location permission denied';
    message = 'Enable location for GoTourGo in Settings to see where you are and get landmark alerts.';
    action = { label: 'Open settings', onPress: () => Linking.openSettings(), icon: Settings };
  } else if (s.servicesEnabled === false) {
    title = 'Location services are off';
    message = 'Turn on your device location (GPS) to find nearby places.';
    action = { label: 'Turn on location', onPress: openLocationSettings, icon: Settings };
  } else if (s.status === 'error') {
    title = 'Location unavailable';
    message = s.error ?? 'We could not get a GPS fix. Move to an open area and try again.';
    action = { label: 'Try again', onPress: startWatching, icon: LocateFixed };
  } else if (s.status === 'locating' && !s.fix && !compact) {
    title = 'Finding your location...';
    message = 'This can take a moment the first time or indoors.';
  } else {
    return null;
  }

  return (
    <View className="gap-2 rounded-3xl border border-border bg-card p-4" accessibilityRole="alert">
      <View className="flex-row items-center gap-2">
        <MapPinOff color={colors.primary} size={18} />
        <Text className="flex-1 text-base font-semibold text-foreground">{title}</Text>
      </View>
      <Text className="text-sm text-muted-foreground">{message}</Text>
      {action ? <AppButton label={action.label} icon={action.icon} onPress={action.onPress} size="sm" variant="secondary" /> : null}
    </View>
  );
}
