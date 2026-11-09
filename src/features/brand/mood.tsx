import { Image } from 'expo-image';
import { Heart, type LucideIcon } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { View, type ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { BrandLogo, WaveEdge, type TileTone } from '@/components/brand';
import { Text } from '@/components/text';
import { FALLBACK_PHOTO, type HeroPhoto } from '@/features/brand/hero-photos';
import { isUrdu, tx } from '@/lib/i18n';
import { colors, shadow } from '@/lib/theme';

/**
 * Pieces of the client design guide's "mood" (onboarding and sign-in): a
 * full-bleed photo with a misty top for the logo and a wave where the page
 * rises over it, a handwritten note, a floating glass card and the step pill.
 * Decorations are hidden from screen readers.
 */

/**
 * One photo height for every onboarding step and auth screen, so they line up:
 * about a third of the screen, 220–300 dp.
 */
export function heroHeight(windowHeight: number) {
  return Math.round(Math.min(300, Math.max(220, windowHeight * 0.32)));
}

/** Photo header: misty top (logo stays readable on any photo), wave edge, small credit. */
export function PhotoHeader({
  photo,
  width,
  height,
  children,
  logo = true,
}: {
  photo: HeroPhoto;
  width: number;
  height: number;
  children?: ReactNode;
  logo?: boolean;
}) {
  return (
    <View style={{ width, height }} className="overflow-hidden">
      <Image
        source={{ uri: photo.uri }}
        placeholder={FALLBACK_PHOTO}
        placeholderContentFit="cover"
        style={{ width, height }}
        contentFit="cover"
        cachePolicy="disk"
        transition={250}
        accessible={false}
      />
      {/* Misty sky at the top, like the mockups, so the coloured logo reads on any photo. */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          height: height * 0.42,
          experimental_backgroundImage: 'linear-gradient(180deg, rgba(246,250,252,0.92), rgba(246,250,252,0.55) 55%, rgba(246,250,252,0))',
        }}
      />
      {logo ? (
        <View pointerEvents="none" className="absolute start-5" style={{ top: 14 }}>
          <BrandLogo height={32} />
        </View>
      ) : null}
      {children}
      <View pointerEvents="none" className="absolute bottom-0 left-0 right-0">
        <WaveEdge width={width} height={56} />
      </View>
      <Text
        className="absolute text-[9px] text-white/80"
        style={{ end: 12, bottom: 58, textShadowColor: 'rgba(0,0,0,0.5)', textShadowRadius: 3 }}
        accessibilityLabel={tx('Photo: {0} by {1}, Wikimedia Commons', { 0: photo.place, 1: photo.credit })}
      >
        {photo.credit} · Wikimedia Commons
      </Text>
    </View>
  );
}

/** Handwritten note with a hand-drawn underline and a small heart (design guide). */
export function HandNote({ lines, style, rotate = -8 }: { lines: string[]; style?: ViewStyle; rotate?: number }) {
  return (
    <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[{ position: 'absolute', transform: [{ rotate: `${rotate}deg` }] }, style]}>
      {lines.map((l, i) => (
        <View key={i} className="flex-row items-center gap-1" style={{ marginStart: i * 18 }}>
          <Text className="font-script text-[24px] leading-[28px] text-heading">{l}</Text>
          {i === lines.length - 1 ? <Heart color={colors.heading} fill={colors.heading} size={14} /> : null}
        </View>
      ))}
      <Svg width={150} height={14} viewBox="0 0 150 14" style={{ marginStart: 24, marginTop: -2 }}>
        <Path d="M2 12 C40 2 100 1 148 5" stroke={colors.heading} strokeWidth={2} fill="none" strokeLinecap="round" />
      </Svg>
    </View>
  );
}

const CARD_TILE: Record<TileTone, string> = { ice: 'bg-primary-soft', mint: 'bg-mint', peach: 'bg-peach', lemon: 'bg-lemon', sand: 'bg-sand' };

/** Floating glass card over the photo, showing a real app feature (decorative preview). */
export function FloatingCard({
  icon: Icon,
  title,
  text,
  tone = 'ice',
  iconColor = colors.primary,
  style,
  rotate = -3,
}: {
  icon: LucideIcon;
  title: string;
  text: string;
  tone?: TileTone;
  iconColor?: string;
  style?: ViewStyle;
  rotate?: number;
}) {
  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      className="absolute flex-row items-center gap-2.5 rounded-[20px] bg-white/95 px-3 py-2.5"
      style={[{ maxWidth: 230, boxShadow: shadow(0.16, 6, 18), transform: [{ rotate: `${rotate}deg` }] }, style]}
    >
      <View className={`h-10 w-10 items-center justify-center rounded-2xl ${CARD_TILE[tone]}`}>
        <Icon color={iconColor} size={20} />
      </View>
      <View className="shrink gap-0.5">
        <Text numberOfLines={1} className="text-[13px] font-bold text-heading">
          {title}
        </Text>
        <Text numberOfLines={2} className="text-[11px] leading-[15px] text-muted-foreground">
          {text}
        </Text>
      </View>
    </View>
  );
}

export function StepPill({ label }: { label: string }) {
  return (
    <View className="self-start rounded-full bg-primary-soft px-3.5 py-1.5">
      <Text className="text-[13px] font-semibold text-heading">{label}</Text>
    </View>
  );
}

/**
 * Headline in two tones (navy, then sky), like "Discover / Amazing Places".
 * Urdu keeps one tone: Nastaliq needs its own line height and doesn't need the split.
 */
export function TwoToneTitle({ first, second, size = 28 }: { first: string; second: string; size?: number }) {
  const lh = Math.round(size * 1.15);
  if (isUrdu) {
    return (
      <Text accessibilityRole="header" className="font-display text-heading" style={{ fontSize: size }}>
        {first} {second}
      </Text>
    );
  }
  return (
    <Text accessibilityRole="header" className="font-display text-heading" style={{ fontSize: size, lineHeight: lh }}>
      {first}
      {'\n'}
      <Text className="font-display text-sky-strong" style={{ fontSize: size, lineHeight: lh }}>
        {second}
      </Text>
    </Text>
  );
}
