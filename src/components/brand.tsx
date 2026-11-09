import type { LucideIcon } from 'lucide-react-native';
import { useId } from 'react';
import { View } from 'react-native';
import Svg, { Defs, G, LinearGradient, Path, Stop } from 'react-native-svg';

import { GO_GO, PIN, PLANE, TOUR } from '@/components/brand-paths';
import { Text } from '@/components/text';
import { colors } from '@/lib/theme';

type LogoTone = 'color' | 'white' | 'navy';

const SYMBOL = { w: 505, h: 481 };
const WORDMARK = { x: 434, y: 150, w: 1026, h: 162 };

function useTone(tone: LogoTone) {
  const id = `pin-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const solid = tone === 'white' ? '#FFFFFF' : colors.heading;
  return {
    id,
    defs:
      tone === 'color' ? (
        <Defs>
          <LinearGradient id={id} x1="1" y1="0" x2="0.1" y2="1">
            <Stop offset="0" stopColor="#1EB9EF" />
            <Stop offset="1" stopColor="#035591" />
          </LinearGradient>
        </Defs>
      ) : null,
    pin: tone === 'color' ? `url(#${id})` : solid,
    plane: tone === 'color' ? '#1C7DBF' : solid,
    go: tone === 'color' ? colors.heading : solid,
    tour: tone === 'color' ? colors.sky : solid,
  };
}

/** The pin + plane symbol. `size` is its height; the width follows the logo's proportions. */
export function BrandSymbol({ size = 40, tone = 'color' }: { size?: number; tone?: LogoTone }) {
  const t = useTone(tone);
  return (
    <Svg width={(size * SYMBOL.w) / SYMBOL.h} height={size} viewBox={`0 0 ${SYMBOL.w} ${SYMBOL.h}`} accessibilityElementsHidden importantForAccessibility="no">
      {t.defs}
      <Path d={PIN} fill={t.pin} fillRule="evenodd" />
      <Path d={PLANE} fill={t.plane} fillRule="evenodd" />
    </Svg>
  );
}

/**
 * Full logo (symbol + "GoTourGo"), horizontal or stacked. `height` is the
 * overall height. The wordmark is drawn from outlines, so it reads the same in
 * Urdu mode; the accessibility label carries the name.
 */
export function BrandLogo({ height = 40, tone = 'color', layout = 'horizontal' }: { height?: number; tone?: LogoTone; layout?: 'horizontal' | 'stacked' }) {
  const t = useTone(tone);
  if (layout === 'stacked') {
    const gap = 56;
    const W = WORDMARK.w;
    const H = SYMBOL.h + gap + WORDMARK.h;
    return (
      <View accessible accessibilityRole="image" accessibilityLabel="GoTourGo">
        <Svg width={(height * W) / H} height={height} viewBox={`0 0 ${W} ${H}`}>
          {t.defs}
          <G x={(W - SYMBOL.w) / 2}>
            <Path d={PIN} fill={t.pin} fillRule="evenodd" />
            <Path d={PLANE} fill={t.plane} fillRule="evenodd" />
          </G>
          <G x={-WORDMARK.x} y={SYMBOL.h + gap - WORDMARK.y}>
            <Path d={GO_GO} fill={t.go} fillRule="evenodd" />
            <Path d={TOUR} fill={t.tour} fillRule="evenodd" />
          </G>
        </Svg>
      </View>
    );
  }
  return (
    <View accessible accessibilityRole="image" accessibilityLabel="GoTourGo">
      <Svg width={(height * 1460) / SYMBOL.h} height={height} viewBox={`0 0 1460 ${SYMBOL.h}`}>
        {t.defs}
        <Path d={PIN} fill={t.pin} fillRule="evenodd" />
        <Path d={PLANE} fill={t.plane} fillRule="evenodd" />
        <Path d={GO_GO} fill={t.go} fillRule="evenodd" />
        <Path d={TOUR} fill={t.tour} fillRule="evenodd" />
      </Svg>
    </View>
  );
}

/**
 * The big curved edge where the page sweeps up over a photo (design guide).
 * Place it absolutely at the bottom of the photo; it is filled with the page
 * background. "valley" (onboarding) rises on both sides and dips right of
 * centre; "slope" (sign-in screens) is high at the start and falls to the
 * photo's bottom at the end, leaving the photo open on that side.
 * Shapes are in 0–1 units; Urdu mirrors them so the high side follows the text.
 */
const SWEEPS = {
  valley: 'M0 .42 C.22 .30 .40 1 .64 .96 C.82 .93 .90 .30 1 .06 L1 1 L0 1 Z',
  slope: 'M0 .06 C.25 0 .42 .38 .62 .66 C.78 .88 .90 .98 1 1 L0 1 Z',
} as const;
export type SweepShape = keyof typeof SWEEPS;

export function SweepEdge({ width, height, shape, mirrored = false }: { width: number; height: number; shape: SweepShape; mirrored?: boolean }) {
  return (
    <Svg
      width={width}
      height={height}
      viewBox="0 0 1 1"
      preserveAspectRatio="none"
      style={mirrored ? { transform: [{ scaleX: -1 }] } : undefined}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no"
    >
      <Path d={SWEEPS[shape]} fill={colors.background} />
    </Svg>
  );
}

export type TileTone = 'ice' | 'mint' | 'peach' | 'lemon' | 'sand';

const TILE_BG: Record<TileTone, string> = {
  ice: 'bg-primary-soft',
  mint: 'bg-mint',
  peach: 'bg-peach',
  lemon: 'bg-lemon',
  sand: 'bg-sand',
};

/** Rounded square (or circle) with a soft tint and an icon (category and feature tiles). */
export function IconTile({ icon: Icon, tone = 'ice', size = 56, label, round = false }: { icon: LucideIcon; tone?: TileTone; size?: number; label?: string; round?: boolean }) {
  return (
    <View className="items-center gap-1.5">
      <View className={`items-center justify-center ${round ? 'rounded-full' : 'rounded-[20px]'} ${TILE_BG[tone]}`} style={{ width: size, height: size }}>
        <Icon color={colors.primary} size={Math.round(size * 0.44)} strokeWidth={1.8} />
      </View>
      {label ? (
        <Text numberOfLines={2} className="text-center text-xs font-medium text-heading" style={{ maxWidth: size + 24 }}>
          {label}
        </Text>
      ) : null}
    </View>
  );
}
