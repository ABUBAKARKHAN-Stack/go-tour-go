import { router } from 'expo-router';
import { ChevronRight, MapPin, Star } from 'lucide-react-native';
import { memo } from 'react';
import { Pressable, View } from 'react-native';

import { DestinationImage } from '@/components/destination-image';
import { Text } from '@/components/text';
import { DESTINATION_CATEGORIES } from '@/features/destinations/categories';
import { formatDistance } from '@/lib/geo';
import { colors } from '@/lib/theme';
import type { DestinationSummary } from '@/lib/types';

type Props = {
  destination: DestinationSummary;
  distance?: number | null;
  rating?: number | null;
  variant?: 'tile' | 'row';
  right?: React.ReactNode;
};

function Rating({ value }: { value: number }) {
  return (
    <View className="flex-row items-center gap-1">
      <Star color={colors.rating} fill={colors.rating} size={13} />
      <Text className="text-xs font-semibold text-foreground">{value.toFixed(1)}</Text>
    </View>
  );
}

function DestinationCardBase({ destination: d, distance, rating, variant = 'tile', right }: Props) {
  const meta = DESTINATION_CATEGORIES[d.category];
  const open = () => router.push({ pathname: '/destination/[id]', params: { id: d.id } });
  const label = `${d.name}, ${meta.label}, ${d.city}${distance != null ? `, ${formatDistance(distance)} away` : ''}`;

  if (variant === 'row') {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={open}
        className="flex-row items-center gap-3 rounded-3xl border border-border bg-card p-2.5 active:opacity-80"
      >
        <DestinationImage uri={d.image_url} category={d.category} className="h-[76px] w-[76px] rounded-2xl" iconSize={26} recyclingKey={d.id} />
        <View className="flex-1 gap-0.5">
          <Text numberOfLines={1} className="text-[11px] font-bold uppercase tracking-[1.2px] text-accent">
            {meta.label}
          </Text>
          <Text numberOfLines={1} className="text-base font-semibold text-foreground">
            {d.name}
          </Text>
          <View className="flex-row items-center gap-2">
            <MapPin color={colors.faint} size={12} />
            <Text numberOfLines={1} className="shrink text-xs text-muted-foreground">
              {d.city}
              {distance != null ? ` · ${formatDistance(distance)}` : ''}
            </Text>
            {rating ? <Rating value={rating} /> : null}
          </View>
        </View>
        {right ?? <ChevronRight color={colors.faint} size={18} />}
      </Pressable>
    );
  }

  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={open} className="w-60 gap-2.5 active:opacity-85">
      <View className="overflow-hidden rounded-3xl">
        <DestinationImage uri={d.image_url} category={d.category} className="h-64 w-full" iconSize={44} recyclingKey={d.id} />
        <View className="absolute bottom-3 left-3 rounded-full bg-card px-2.5 py-1">
          <Text className="text-[10px] font-bold uppercase tracking-[1.2px] text-accent">{meta.label}</Text>
        </View>
      </View>
      <View className="gap-1 px-0.5">
        <Text numberOfLines={1} className="font-display text-xl text-foreground">
          {d.name}
        </Text>
        <View className="flex-row items-center gap-2">
          <Text numberOfLines={1} className="shrink text-xs text-muted-foreground">
            {d.city}
            {distance != null ? ` · ${formatDistance(distance)}` : ''}
          </Text>
          {rating ? <Rating value={rating} /> : null}
        </View>
      </View>
    </Pressable>
  );
}

export const DestinationCard = memo(DestinationCardBase);
