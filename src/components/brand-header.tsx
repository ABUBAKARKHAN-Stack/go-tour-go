import { Image } from 'expo-image';
import { router } from 'expo-router';
import { ArrowLeft, type LucideIcon } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconButton } from '@/components/app-button';
import { BrandLogo } from '@/components/brand';
import { Text } from '@/components/text';
import { FALLBACK_PHOTO, HERO_PHOTOS } from '@/features/brand/hero-photos';
import { isUrdu, tx } from '@/lib/i18n';
import { colors } from '@/lib/theme';

// The photo shows on the far side and fades into the page under the text.
const SIDE_FADE = `linear-gradient(${isUrdu ? 270 : 90}deg, rgb(246,250,252) 30%, rgba(246,250,252,0.55) 62%, rgba(246,250,252,0) 100%)`;
const BOTTOM_FADE = 'linear-gradient(180deg, rgba(246,250,252,0) 45%, rgb(246,250,252))';

/**
 * Page header from the design guide (Saved, Trips...): a band of photo that
 * fades into the page, the logo with an optional back button and actions,
 * then a big title with an icon and a subtitle. Runs under the status bar;
 * use it as `Screen`'s `hero`.
 */
export function BrandHeader({
  title,
  icon: Icon,
  iconFilled,
  subtitle,
  back,
  right,
  children,
}: {
  title: string;
  icon?: LucideIcon;
  /** Fill the icon (heart, bookmark); outline icons stay outlined. */
  iconFilled?: boolean;
  subtitle?: string;
  back?: boolean;
  right?: ReactNode;
  /** Shown under the subtitle (filters, tabs). */
  children?: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View>
      <View style={[StyleSheet.absoluteFill, { bottom: undefined, height: insets.top + 150 }]} pointerEvents="none">
        <Image
          source={{ uri: HERO_PHOTOS.discover.uri }}
          placeholder={FALLBACK_PHOTO}
          placeholderContentFit="cover"
          contentFit="cover"
          cachePolicy="disk"
          transition={250}
          accessible={false}
          style={StyleSheet.absoluteFill}
        />
        <View style={[StyleSheet.absoluteFill, { experimental_backgroundImage: SIDE_FADE }]} />
        <View style={[StyleSheet.absoluteFill, { experimental_backgroundImage: BOTTOM_FADE }]} />
      </View>
      <View className="gap-3 px-4 pb-3" style={{ paddingTop: insets.top + 8 }}>
        <View className="flex-row items-center gap-3">
          {back ? <IconButton icon={ArrowLeft} flip label={tx('Go back')} onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} /> : null}
          <View className="flex-1">
            <BrandLogo height={36} />
          </View>
          {right}
        </View>
        <View className="gap-0.5">
          <View className="flex-row items-center gap-2.5">
            {Icon ? <Icon color={colors.primary} fill={iconFilled ? colors.primary : 'transparent'} size={28} /> : null}
            <Text accessibilityRole="header" numberOfLines={2} className="shrink font-display text-[32px] leading-[38px] text-heading">
              {title}
            </Text>
          </View>
          {subtitle ? (
            <Text numberOfLines={2} className="text-sm text-muted-foreground">
              {subtitle}
            </Text>
          ) : null}
        </View>
        {children}
      </View>
    </View>
  );
}
