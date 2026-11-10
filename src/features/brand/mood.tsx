import { Image } from 'expo-image';
import { Heart, type LucideIcon } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { View, type ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { BrandLogo, SweepEdge, type SweepShape, type TileTone } from '@/components/brand';
import { Text } from '@/components/text';
import { FALLBACK_PHOTO, type HeroPhoto } from '@/features/brand/hero-photos';
import { isUrdu } from '@/lib/i18n';
import { colors, shadow } from '@/lib/theme';

/**
 * Pieces of the client design guide's "mood" (onboarding and sign-in): a
 * full-bleed photo with a misty top for the logo and a big curve where the
 * page sweeps up over it, a handwritten note, a floating card, the step pill,
 * the two-tone title and the handwritten title word.
 * Decorations are hidden from screen readers.
 */

export type HeaderKind = 'onboarding' | 'auth';

const SHAPE: Record<HeaderKind, SweepShape> = { onboarding: 'valley', auth: 'slope' };

/**
 * Photo height, status bar included (the photo runs under it, like the
 * mockups). One height for every onboarding step and one for every auth
 * screen, so the screens line up.
 */
export function photoHeight(kind: HeaderKind, windowHeight: number) {
  // Onboarding: the photo gets what the text below leaves (about 400 dp: step,
  // title, three lines, features, button), so tall phones get half a screen
  // of photo and small ones still fit the step without scrolling.
  if (kind === 'onboarding') return Math.round(Math.min(440, Math.max(240, windowHeight - 400)));
  return Math.round(Math.min(310, Math.max(240, windowHeight * 0.35)));
}

/** Height of the curved edge; it scales with the width so the curve keeps its shape. */
export function sweepHeight(kind: HeaderKind, width: number) {
  return Math.round(width * (kind === 'onboarding' ? 0.22 : 0.25));
}

/**
 * How far the content below may rise into the curve without touching the
 * photo: the start side is high, so a short line ("‹ Back", the step pill)
 * fits further up than a long title.
 */
export function sweepOverlap(kind: HeaderKind, width: number, shortFirstLine = false) {
  const h = sweepHeight(kind, width);
  if (kind === 'onboarding') return Math.round(h * 0.36);
  return Math.round(h * (shortFirstLine ? 0.55 : 0.22));
}

/** Full-bleed photo header: misty top (the logo reads on any photo) and the curved edge. Credits: Settings → Photo credits. */
export function PhotoHeader({
  photo,
  kind,
  width,
  height,
  topInset,
  children,
}: {
  photo: HeroPhoto;
  kind: HeaderKind;
  width: number;
  height: number;
  /** Status bar height: the photo runs under it and the logo sits below it. */
  topInset: number;
  children?: ReactNode;
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
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          height: topInset + 120,
          experimental_backgroundImage: 'linear-gradient(180deg, rgba(246,250,252,0.92), rgba(246,250,252,0.55) 60%, rgba(246,250,252,0))',
        }}
      />
      <View pointerEvents="none" className="absolute start-5" style={{ top: topInset + 8 }}>
        <BrandLogo height={52} />
      </View>
      {children}
      <View pointerEvents="none" className="absolute bottom-0 left-0 right-0">
        <SweepEdge width={width} height={sweepHeight(kind, width)} shape={SHAPE[kind]} mirrored={isUrdu} />
      </View>
    </View>
  );
}

/** Handwritten note with a hand-drawn underline and a small heart (design guide). */
export function HandNote({ lines, style, rotate = -8 }: { lines: string[]; style?: ViewStyle; rotate?: number }) {
  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      className="rounded-[22px] bg-white/80 px-4 pb-1.5 pt-2"
      style={[{ position: 'absolute', boxShadow: shadow(0.14, 4, 14), transform: [{ rotate: `${rotate}deg` }] }, style]}
    >
      {lines.map((l, i) => (
        <View key={i} className="flex-row items-center gap-1" style={{ marginStart: i * 18 }}>
          <Text className="font-script text-[24px] leading-[28px] text-heading">{l}</Text>
          {i === lines.length - 1 ? <Heart color={colors.heading} fill={colors.heading} size={14} /> : null}
        </View>
      ))}
      <Svg width={130} height={12} viewBox="0 0 150 14" style={{ marginStart: 20, marginTop: -2 }}>
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
      className="absolute flex-row items-center gap-2.5 rounded-[20px] bg-white px-3 py-2.5"
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

/**
 * The handwritten word after a title ("Ready to Explore?"), with the
 * hand-drawn swash under it. Caveat runs small, so 31 px matches 28 px Outfit.
 */
export function ScriptWord({ word }: { word: string }) {
  return (
    <View>
      <Text className="font-script text-[31px] leading-[34px] text-sky-strong">{word}</Text>
      <Swash style={{ marginTop: -5 }} />
    </View>
  );
}

/** Hand-drawn underline (design guide); stretches to its parent's width unless given one. */
export function Swash({ width = '100%', color = colors.skyStrong, style }: { width?: number | `${number}%`; color?: string; style?: ViewStyle }) {
  return (
    <Svg width={width} height={8} viewBox="0 0 100 8" preserveAspectRatio="none" style={style} pointerEvents="none">
      <Path d="M3 6 C30 1.5 70 0.5 97 3" stroke={color} strokeWidth={2.5} fill="none" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </Svg>
  );
}
