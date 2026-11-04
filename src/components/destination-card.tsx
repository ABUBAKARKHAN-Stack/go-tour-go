import { router } from 'expo-router';
import { MapPin, Star } from 'lucide-react-native';
import { memo } from 'react';
import { Pressable, Text, View } from 'react-native';

import { DestinationImage } from '@/components/destination-image';
import { DESTINATION_CATEGORIES } from '@/features/destinations/categories';
import { formatDistance } from '@/lib/geo';
import { colors } from '@/lib/theme';
import type { Destination } from '@/lib/types';

type Props = {
  destination: Destination;
  distance?: number | null;
  rating?: number | null;
  variant?: 'tile' | 'row';
  right?: React.ReactNode;
};

function DestinationCardBase({ destination: d, distance, rating, variant = 'tile', right }: Props) {
  const meta = DESTINATION_CATEGORIES[d.category];
  const open = () => router.push({ pathname: '/destination/[id]', params: { id: d.id } });

  if (variant === 'row') {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${d.name}, ${meta.label}, ${d.city}`}
        onPress={open}
        className="flex-row items-center gap-3 rounded-3xl border border-border/20 bg-card p-3 active:opacity-80"
      >
        <DestinationImage uri={d.image_url} category={d.category} className="h-20 w-20 rounded-2xl" iconSize={28} recyclingKey={d.id} />
        <View className="flex-1 gap-1">
          <Text numberOfLines={1} className="text-base font-semibold text-foreground">
            {d.name}
          </Text>
          <Text numberOfLines={1} className="text-xs text-muted-foreground">
            {meta.label} · {d.city}
          </Text>
          <Text numberOfLines={2} className="text-xs text-muted-foreground">
            {d.short_description}
          </Text>
          <View className="flex-row items-center gap-3">
            {distance != null ? (
              <View className="flex-row items-center gap-1">
                <MapPin color={colors.accent} size={12} />
                <Text className="text-xs font-medium text-accent">{formatDistance(distance)}</Text>
              </View>
            ) : null}
            {rating ? (
              <View className="flex-row items-center gap-1">
                <Star color={colors.accent} fill={colors.accent} size={12} />
                <Text className="text-xs text-foreground">{rating.toFixed(1)}</Text>
              </View>
            ) : null}
          </View>
        </View>
        {right}
      </Pressable>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${d.name}, ${meta.label}, ${d.city}`}
      onPress={open}
      className="w-60 overflow-hidden rounded-3xl border border-border/20 bg-card active:opacity-80"
    >
      <DestinationImage uri={d.image_url} category={d.category} className="h-32 w-full" recyclingKey={d.id} />
      <View className="gap-1 p-3">
        <Text numberOfLines={1} className="text-base font-semibold text-foreground">
          {d.name}
        </Text>
        <Text numberOfLines={1} className="text-xs text-muted-foreground">
          {meta.label} · {d.city}
        </Text>
        {distance != null ? (
          <View className="flex-row items-center gap-1">
            <MapPin color={colors.accent} size={12} />
            <Text className="text-xs font-medium text-accent">{formatDistance(distance)} away</Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

export const DestinationCard = memo(DestinationCardBase);
