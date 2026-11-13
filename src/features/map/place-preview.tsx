import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Bookmark, Clock, Navigation, Star } from 'lucide-react-native';
import { View } from 'react-native';

import { AppButton } from '@/components/app-button';
import { DestinationImage } from '@/components/destination-image';
import { useIsOnline } from '@/components/offline-banner';
import { Text } from '@/components/text';
import { useRatings } from '@/features/destinations/api';
import { DESTINATION_CATEGORIES } from '@/features/destinations/categories';
import { fetchRoute, type TravelMode } from '@/features/routing/osrm';
import { navigateTo } from '@/features/routing/navigate';
import { distanceMeters, formatDistance, formatDuration, type LatLng } from '@/lib/geo';
import { tx } from '@/lib/i18n';
import { usePreferences } from '@/lib/preferences';
import { colors, shadow } from '@/lib/theme';
import type { DestinationSummary } from '@/lib/types';

/** Rough speeds for a straight-line estimate when no route can be fetched (offline). */
const FALLBACK_KMH: Record<TravelMode, number> = { driving: 40, cycling: 14, walking: 4.5 };
/** Roads are longer than the straight line between two points. */
const DETOUR = 1.3;

const MODE_LABEL: Record<TravelMode, string> = {
  driving: tx('by car'),
  cycling: tx('by bike'),
  walking: tx('on foot'),
};

/**
 * Travel time to a place from where the traveller is: the real route time
 * when online, otherwise an "about" estimate from the straight-line distance.
 * Fetched once per selection (rounded position), never per GPS fix.
 */
function useTravelTime(from: LatLng | null, to: DestinationSummary, mode: TravelMode) {
  const online = useIsOnline();
  // ~1 km grid so small GPS movements reuse the cached answer.
  const cell = from ? `${from.latitude.toFixed(2)},${from.longitude.toFixed(2)}` : null;
  const route = useQuery({
    queryKey: ['travel-time', to.id, mode, cell],
    enabled: Boolean(from) && online,
    queryFn: ({ signal }) => fetchRoute(mode, from!, { latitude: to.latitude, longitude: to.longitude, id: to.id, name: to.name }, signal),
    staleTime: 1000 * 60 * 15,
    retry: 0,
  });
  if (!from) return null;
  if (route.data) return { seconds: route.data.duration, estimate: false };
  if (route.isLoading) return 'loading' as const;
  const meters = distanceMeters(from, to) * DETOUR;
  return { seconds: (meters / 1000 / FALLBACK_KMH[mode]) * 3600, estimate: true };
}

/** Card for the landmark tapped on the Explore map (Figma 04): rating, distance, travel time, actions. */
export function PlacePreview({ place, location, saved }: { place: DestinationSummary; location: LatLng | null; saved: boolean }) {
  const ratings = useRatings();
  const [prefs] = usePreferences();
  const rating = ratings.data?.[place.id];
  const time = useTravelTime(location, place, prefs.travelMode);

  return (
    <View className="flex-row gap-3 rounded-[20px] bg-card p-3" style={{ boxShadow: shadow(0.14, 6, 20) }}>
      <DestinationImage uri={place.image_url} category={place.category} className="h-24 w-24 rounded-2xl" recyclingKey={place.id} />
      <View className="flex-1 gap-1">
        <View className="flex-row items-center gap-1.5">
          <Text numberOfLines={2} className="shrink text-base font-bold text-heading">
            {place.name}
          </Text>
          {saved ? <Bookmark color={colors.accent} fill={colors.accent} size={14} accessibilityLabel={tx('Saved')} /> : null}
        </View>
        <Text numberOfLines={2} className="text-xs text-muted-foreground">
          {DESTINATION_CATEGORIES[place.category].label} · {place.city}
          {location ? ` · ${formatDistance(distanceMeters(location, place))}` : ''}
        </Text>
        <View className="flex-row flex-wrap items-center gap-x-3 gap-y-0.5">
          {rating ? (
            <View className="flex-row items-center gap-1">
              <Star color={colors.rating} fill={colors.rating} size={13} />
              <Text className="text-xs font-semibold text-heading">
                {rating.average_rating.toFixed(1)} <Text className="text-xs font-normal text-muted-foreground">({rating.review_count})</Text>
              </Text>
            </View>
          ) : (
            <Text className="text-xs text-faint">{tx('No ratings yet')}</Text>
          )}
          {time ? (
            <View className="flex-row items-center gap-1">
              <Clock color={colors.mutedForeground} size={13} />
              <Text className="text-xs text-muted-foreground">
                {time === 'loading'
                  ? tx('Working out travel time…')
                  : time.estimate
                    ? tx('About {0} {1}', { 0: formatDuration(time.seconds), 1: MODE_LABEL[prefs.travelMode] })
                    : tx('{0} {1}', { 0: formatDuration(time.seconds), 1: MODE_LABEL[prefs.travelMode] })}
              </Text>
            </View>
          ) : null}
        </View>
        <Text numberOfLines={3} className="text-xs text-foreground">
          {place.short_description}
        </Text>
        <View className="mt-1 flex-row gap-2">
          <AppButton
            label={tx('Details')}
            size="sm"
            variant="secondary"
            onPress={() => router.push({ pathname: '/destination/[id]', params: { id: place.id } })}
            className="flex-1"
          />
          <AppButton label={tx('Directions')} size="sm" icon={Navigation} onPress={() => navigateTo(place)} className="flex-1" />
        </View>
      </View>
    </View>
  );
}
