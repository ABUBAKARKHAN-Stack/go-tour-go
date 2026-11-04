import { router } from 'expo-router';
import { Alert } from 'react-native';

import { getCurrentFix } from '@/features/location/location-provider';
import { locationStore } from '@/features/location/location-store';
import { routeStore } from '@/features/routing/route-store';
import { getPreferences } from '@/lib/preferences';

type Target = { id: string; name: string; latitude: number; longitude: number };

/**
 * One-tap navigation from anywhere (details screen, proximity card,
 * notification action): computes the route from the current location and
 * opens the map with it drawn. The user never has to search again.
 */
export async function navigateTo(target: Target) {
  router.navigate('/explore');
  const fix = locationStore.get().fix ?? (await getCurrentFix());
  if (!fix) {
    Alert.alert('Location needed', 'Turn on location so GoTourGo can calculate a route from where you are.');
    return;
  }
  await routeStore.request(fix, target, getPreferences().travelMode);
}
