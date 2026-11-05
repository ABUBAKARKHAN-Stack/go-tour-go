import { router } from 'expo-router';
import { Bookmark, ChevronRight, MapPin, Star } from 'lucide-react-native';
import { memo } from 'react';
import { Pressable, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { DestinationImage } from '@/components/destination-image';
import { Text } from '@/components/text';
import { useAuth } from '@/features/auth/auth-provider';
import { DESTINATION_CATEGORIES } from '@/features/destinations/categories';
import { useSavedIds, useToggleSaved } from '@/features/saved/api';
import { formatDistance } from '@/lib/geo';
import { usePressScale } from '@/lib/motion';
import { colors } from '@/lib/theme';
import type { DestinationSummary } from '@/lib/types';
import { flipX, tx } from '@/lib/i18n';

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

/** Figma 03: white rounded button on the photo, filled when saved. */
function SaveButton({ id, name }: { id: string; name: string }) {
  const { userId } = useAuth();
  const saved = useSavedIds();
  const toggle = useToggleSaved();
  if (!userId) return null;
  const isSaved = saved.data?.includes(id) ?? false;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={isSaved ? tx('Remove {0} from saved', { 0: name }) : tx('Save {0}', { 0: name })}
      accessibilityState={{ selected: isSaved }}
      hitSlop={8}
      onPress={() => toggle.mutate({ destinationId: id, save: !isSaved })}
      className="absolute right-3 top-3 h-10 w-10 items-center justify-center rounded-xl bg-card"
      style={{ boxShadow: '0 2px 6px rgba(28,26,23,0.15)' }}
    >
      <Bookmark color={isSaved ? colors.accent : colors.foreground} fill={isSaved ? colors.accent : 'transparent'} size={18} />
    </Pressable>
  );
}

function DestinationCardBase({ destination: d, distance, rating, variant = 'tile', right }: Props) {
  const press = usePressScale();
  const meta = DESTINATION_CATEGORIES[d.category];
  const open = () => router.push({ pathname: '/destination/[id]', params: { id: d.id } });
  const label = `${d.name}, ${meta.label}, ${d.city}${distance != null ? `, ${formatDistance(distance)} away` : ''}`;

  if (variant === 'row') {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={open}
        className="flex-row items-center gap-3 rounded-3xl border border-border bg-card p-2.5 active:bg-muted"
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
        {right ?? <ChevronRight color={colors.faint} size={18} style={flipX} />}
      </Pressable>
    );
  }

  return (
    <Animated.View className="w-60" style={press.style}>
      <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={open} {...press.handlers} pressRetentionOffset={16} className="gap-2.5">
        <View className="overflow-hidden rounded-3xl">
          <DestinationImage uri={d.image_url} category={d.category} className="h-64 w-full" iconSize={44} recyclingKey={d.id} />
          <View className="absolute bottom-3 left-3 rounded-full bg-card px-2.5 py-1">
            <Text className="text-[10px] font-bold uppercase tracking-[1.2px] text-accent">{meta.label}</Text>
          </View>
          <SaveButton id={d.id} name={d.name} />
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
    </Animated.View>
  );
}

export const DestinationCard = memo(DestinationCardBase);
