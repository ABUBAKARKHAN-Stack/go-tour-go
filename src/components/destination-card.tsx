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
import { colors, shadow } from '@/lib/theme';
import type { DestinationSummary } from '@/lib/types';
import { flipX, tx } from '@/lib/i18n';

type Props = {
  destination: DestinationSummary;
  distance?: number | null;
  rating?: number | null;
  /**
   * tile: photo on top, white body (rails of places);
   * photo: name over the photo (grids);
   * row: thumbnail and text (lists).
   */
  variant?: 'tile' | 'photo' | 'row';
  /** Tile and photo width; the photo height follows it. */
  width?: number;
  right?: React.ReactNode;
};

const CARD_SHADOW = { boxShadow: shadow(0.08, 6, 20) };

function Rating({ value }: { value: number }) {
  return (
    <View className="flex-row items-center gap-1 self-start rounded-full bg-lemon px-2 py-0.5">
      <Star color={colors.rating} fill={colors.rating} size={12} />
      <Text className="text-xs font-semibold text-heading" style={{ fontVariant: ['tabular-nums'] }}>
        {value.toFixed(1)}
      </Text>
    </View>
  );
}

/** Round save button on the photo, filled when saved. */
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
      className="absolute top-2.5 h-9 w-9 items-center justify-center rounded-full bg-white/90 active:opacity-70" style={{ end: 10 }}
    >
      <Bookmark color={isSaved ? colors.accent : colors.heading} fill={isSaved ? colors.accent : 'transparent'} size={17} />
    </Pressable>
  );
}

function DestinationCardBase({ destination: d, distance, rating, variant = 'tile', width = 220, right }: Props) {
  const press = usePressScale();
  const meta = DESTINATION_CATEGORIES[d.category];
  const open = () => router.push({ pathname: '/destination/[id]', params: { id: d.id } });
  const where = `${d.city}${distance != null ? ` · ${formatDistance(distance)}` : ''}`;
  const label = `${d.name}, ${meta.label}, ${d.city}${distance != null ? `, ${formatDistance(distance)} away` : ''}`;

  if (variant === 'row') {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={open}
        className="flex-row items-center gap-3 rounded-[20px] bg-card p-2.5 active:bg-muted"
        style={CARD_SHADOW}
      >
        <DestinationImage uri={d.image_url} category={d.category} className="h-[76px] w-[76px] rounded-2xl" iconSize={26} recyclingKey={d.id} />
        <View className="flex-1 gap-0.5">
          <Text numberOfLines={1} className="text-[11px] font-bold uppercase tracking-[1.2px] text-accent">
            {meta.label}
          </Text>
          <Text numberOfLines={2} className="text-base font-semibold text-heading">
            {d.name}
          </Text>
          <View className="flex-row items-center gap-2">
            <MapPin color={colors.faint} size={12} />
            <Text numberOfLines={2} className="shrink text-xs text-muted-foreground">
              {where}
            </Text>
            {rating ? <Rating value={rating} /> : null}
          </View>
        </View>
        {right ?? <ChevronRight color={colors.faint} size={18} style={flipX} />}
      </Pressable>
    );
  }

  if (variant === 'photo') {
    return (
      <Animated.View style={[press.style, { width }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={label}
          onPress={open}
          {...press.handlers}
          pressRetentionOffset={16}
          className="rounded-[20px]"
          style={{ height: Math.round(width * 1.1), boxShadow: shadow(0.12, 6, 16) }}
        >
          <View className="flex-1 overflow-hidden rounded-[20px]">
            <DestinationImage uri={d.image_url} category={d.category} style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }} iconSize={30} recyclingKey={d.id} />
            <View
              pointerEvents="none"
              className="absolute bottom-0 left-0 right-0 h-[62%]"
              style={{ experimental_backgroundImage: 'linear-gradient(180deg, rgba(21,56,79,0), rgba(21,56,79,0.82))' }}
            />
            <View className="absolute bottom-0 left-0 right-0 gap-0.5 p-2.5">
              <View className="flex-row gap-1">
                <MapPin color="#fff" size={12} style={{ marginTop: 2 }} />
                <Text numberOfLines={2} className="flex-1 text-[13px] font-bold leading-[17px] text-white">
                  {d.name}
                </Text>
              </View>
              <Text numberOfLines={1} className="text-[11px] text-white/80" style={{ paddingStart: 16 }}>
                {d.city}
              </Text>
            </View>
          </View>
        </Pressable>
      </Animated.View>
    );
  }

  const Icon = meta.icon;
  return (
    <Animated.View style={[press.style, { width }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={open}
        {...press.handlers}
        pressRetentionOffset={16}
        className="rounded-[20px] bg-card"
        style={CARD_SHADOW}
      >
        <View className="overflow-hidden rounded-t-[20px]">
          <DestinationImage uri={d.image_url} category={d.category} className="w-full" style={{ height: Math.round(width * 0.62) }} iconSize={40} recyclingKey={d.id} />
          <View className="absolute top-2.5 h-8 w-8 items-center justify-center rounded-full bg-inverse/85" style={{ start: 10 }}>
            <Icon color="#fff" size={15} />
          </View>
          <SaveButton id={d.id} name={d.name} />
        </View>
        <View className="gap-1 px-3 pb-3 pt-2.5">
          <View className="flex-row items-center gap-1.5">
            <MapPin color={colors.primary} size={14} />
            <Text numberOfLines={2} className={`shrink font-semibold text-heading ${width < 180 ? 'text-[14px]' : 'text-[15px]'}`}>
              {d.name}
            </Text>
          </View>
          <Text numberOfLines={1} className="text-xs text-muted-foreground" style={{ paddingStart: 20 }}>
            {where}
          </Text>
          {/* Same height with or without a rating, so cards in a rail line up. */}
          <View className="min-h-[22px] justify-end">{rating ? <Rating value={rating} /> : null}</View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

export const DestinationCard = memo(DestinationCardBase);
