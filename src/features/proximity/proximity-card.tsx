import { router } from 'expo-router';
import { BookOpen, MapPin, Navigation, X } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, useWindowDimensions, View } from 'react-native';
import { Text } from '@/components/text';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton } from '@/components/app-button';
import { DestinationImage } from '@/components/destination-image';
import { useDestinationDetail, useDestinations } from '@/features/destinations/api';
import { DESTINATION_CATEGORIES } from '@/features/destinations/categories';
import { proximityCard, useProximityCard } from '@/features/proximity/proximity-store';
import { navigateTo } from '@/features/routing/navigate';
import { distanceMeters, formatDistance } from '@/lib/geo';
import { colors } from '@/lib/theme';
import type { DestinationSummary } from '@/lib/types';
import { tx } from '@/lib/i18n';

/**
 * Contextual landmark card shown over any screen when the user enters a
 * landmark's radius while the app is open. Supports several landmarks at once
 * (overlapping radii) with a horizontal pager.
 */
export function ProximityCardOverlay() {
  const card = useProximityCard();
  const { data } = useDestinations();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [page, setPage] = useState(0);

  const items = useMemo(() => {
    const byId = new Map((data ?? []).map((d) => [d.id, d]));
    return card.hits
      .map((h) => ({ hit: h, destination: byId.get(h.id) }))
      .filter((x): x is { hit: typeof x.hit; destination: DestinationSummary } => Boolean(x.destination));
  }, [card.hits, data]);

  if (!card.visible || items.length === 0) return null;
  const cardWidth = width - 24;

  return (
    <Animated.View
      entering={FadeInDown.springify().damping(18)}
      exiting={FadeOutDown.duration(180)}
      className="absolute left-0 right-0 z-50"
      style={{ bottom: insets.bottom + 72 }}
      pointerEvents="box-none"
      accessibilityViewIsModal={false}
      accessibilityLiveRegion="polite"
    >
      <FlatList
        data={items}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(x) => x.destination.id}
        onMomentumScrollEnd={(e) => setPage(Math.round(e.nativeEvent.contentOffset.x / width))}
        renderItem={({ item }) => (
          <View style={{ width }} className="px-3">
            <LandmarkCard destination={item.destination} distance={item.hit.distance} width={cardWidth} others={items} />
          </View>
        )}
      />
      {items.length > 1 ? (
        <View className="mt-2 flex-row justify-center gap-1.5">
          {items.map((x, i) => (
            <View key={x.destination.id} className={`h-1.5 rounded-full ${i === page ? 'w-5 bg-accent' : 'w-1.5 bg-muted-foreground/50'}`} />
          ))}
        </View>
      ) : null}
    </Animated.View>
  );
}

function LandmarkCard({
  destination: d,
  distance,
  others,
}: {
  destination: DestinationSummary;
  distance: number;
  width: number;
  others: { destination: DestinationSummary }[];
}) {
  const meta = DESTINATION_CATEGORIES[d.category];
  const { data } = useDestinations();
  // "Why it matters" comes from the full record (cached once viewed or fetched online).
  const significance = useDestinationDetail(d.id).destination?.significance;
  const nearbyAttractions = useMemo(
    () =>
      (data ?? [])
        .filter((x) => x.id !== d.id)
        .map((x) => ({ x, dist: distanceMeters(d, x) }))
        .filter((x) => x.dist < 5000)
        .sort((a, b) => a.dist - b.dist)
        .slice(0, 3),
    [data, d],
  );

  const learnMore = () => {
    proximityCard.dismiss();
    router.push({ pathname: '/destination/[id]', params: { id: d.id } });
  };
  const navigate = () => {
    proximityCard.dismiss();
    navigateTo(d);
  };

  return (
    <View className="overflow-hidden rounded-3xl border border-border bg-card shadow-lg">
      <View className="flex-row">
        <DestinationImage uri={d.image_url} category={d.category} className="h-28 w-28" recyclingKey={d.id} />
        <View className="flex-1 gap-1 p-3">
          <View className="flex-row items-center justify-between gap-2">
            <Text className="text-xs font-bold uppercase tracking-wider text-accent">{tx('You\'re near')}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={tx('Dismiss')}
              hitSlop={12}
              onPress={() => proximityCard.dismiss()}
              className="h-8 w-8 items-center justify-center rounded-full bg-secondary"
            >
              <X color={colors.foreground} size={16} />
            </Pressable>
          </View>
          <Text numberOfLines={1} className="text-lg font-bold text-foreground">
            {d.name}
          </Text>
          <View className="flex-row items-center gap-1">
            <MapPin color={colors.primary} size={12} />
            <Text className="text-xs text-muted-foreground">{tx('{0} away · {1} · {2}', { 0: formatDistance(distance), 1: meta.label, 2: d.city })}</Text>
          </View>
          <Text numberOfLines={2} className="text-xs text-foreground">
            {d.short_description}
          </Text>
        </View>
      </View>
      <View className="gap-3 px-3 pb-3">
        {significance ? (
          <Text numberOfLines={2} className="text-xs text-muted-foreground">
            <Text className="font-semibold text-foreground">{tx('Why it matters:')}{' '}</Text>
            {significance}
          </Text>
        ) : null}
        {nearbyAttractions.length ? (
          <Text numberOfLines={1} className="text-xs text-muted-foreground">
            <Text className="font-semibold text-foreground">{tx('Nearby:')}{' '}</Text>
            {nearbyAttractions.map((n) => `${n.x.name} (${formatDistance(n.dist)})`).join(' · ')}
          </Text>
        ) : null}
        {others.length > 1 ? (
          <Text className="text-xs text-accent">{tx('Swipe for {0} more nearby landmark{1}', { 0: others.length - 1, 1: others.length > 2 ? 's' : '' })}</Text>
        ) : null}
        <View className="flex-row gap-2">
          <AppButton label={tx('Learn more')} icon={BookOpen} variant="secondary" onPress={learnMore} className="flex-1" />
          <AppButton label={tx('Navigate')} icon={Navigation} variant="accent" onPress={navigate} className="flex-1" />
        </View>
      </View>
    </View>
  );
}
