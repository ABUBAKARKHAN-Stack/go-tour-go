import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ChevronLeft } from 'lucide-react-native';
import { useEffect, type ReactNode } from 'react';
import { Pressable, useWindowDimensions, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LeafSprig } from '@/components/brand';
import { Text } from '@/components/text';
import { HERO_PHOTOS, prefetchHeroPhotos, type HeroPhoto } from '@/features/brand/hero-photos';
import { BottomWaves, HandNote, PhotoHeader } from '@/features/brand/mood';
import { flipX, isUrdu, tx } from '@/lib/i18n';
import { colors } from '@/lib/theme';

type Props = {
  title: string;
  /** A word drawn in the handwritten accent after the title ("Ready to Explore?"). */
  scriptWord?: string;
  subtitle?: string;
  back?: boolean;
  /** Shorter photo for longer forms (sign up). */
  compact?: boolean;
  photo?: HeroPhoto;
  /** Handwritten note on the photo (two short lines). */
  note?: string[];
  children: ReactNode;
  footer?: ReactNode;
};

/**
 * Every auth screen (sign in, sign up, forgot and reset password, "check your
 * email") uses this shell, in the client design guide's style:
 * - a real Pakistan photo under the status bar with a misty top for the logo
 *   and tagline, a wave where the form rises over it, and an optional note;
 * - "‹ Back" as a link above the title, the title with an optional
 *   handwritten word, then the form;
 * - soft sky/sand waves and leaves at the bottom;
 * - the page scrolls only when the keyboard needs room; the focused field
 *   stays above the keyboard.
 */
export function AuthShell({ title, scriptWord, subtitle, back, compact, photo = HERO_PHOTOS.signIn, note, children, footer }: Props) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const photoHeight = Math.round(Math.min(compact ? 250 : 330, Math.max(compact ? 170 : 230, height * (compact ? 0.24 : 0.34))));

  useEffect(prefetchHeroPhotos, []);

  return (
    <View className="flex-1 bg-background">
      <StatusBar style="dark" />
      {/* Behind the form: decoration only. */}
      <BottomWaves width={width} height={92} />
      <KeyboardAwareScrollView
        bottomOffset={24}
        bounces={false}
        overScrollMode="never"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: insets.bottom + 96 }}
      >
        <View style={{ paddingTop: insets.top }}>
          <PhotoHeader photo={photo} width={width} height={photoHeight}>
            {note ? <HandNote lines={note} style={{ end: 16, top: photoHeight * 0.16 }} rotate={-7} /> : null}
          </PhotoHeader>
          <View pointerEvents="none" style={{ position: 'absolute', end: -8, top: insets.top + photoHeight - 70 }}>
            <LeafSprig size={58} opacity={0.45} mirrored />
          </View>
        </View>
        <View className="-mt-3 flex-1 gap-4 px-6">
          {back ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={tx('Go back')}
              hitSlop={8}
              onPress={() => (router.canGoBack() ? router.back() : router.replace('/sign-in'))}
              className="-mb-1 min-h-10 flex-row items-center gap-0.5 self-start"
            >
              <ChevronLeft color={colors.accent} size={20} style={flipX} />
              <Text className="text-[15px] font-semibold text-accent">{tx('Back')}</Text>
            </Pressable>
          ) : null}
          <View className="gap-2">
            <Text accessibilityRole="header" className="font-display text-[32px] leading-[38px] text-heading">
              {title}
              {scriptWord ? (
                isUrdu ? (
                  ` ${scriptWord}`
                ) : (
                  <Text className="font-script text-[42px] text-sky-strong">{` ${scriptWord}`}</Text>
                )
              ) : null}
            </Text>
            {subtitle ? <Text className="text-[15px] leading-[22px] text-muted-foreground">{subtitle}</Text> : null}
          </View>
          {children}
        </View>
        {footer ? <View className="px-6 pt-5">{footer}</View> : null}
      </KeyboardAwareScrollView>
    </View>
  );
}

export function OrDivider() {
  return (
    <View className="flex-row items-center gap-3">
      <View className="h-px flex-1 bg-border-strong" />
      <Text className="text-xs font-semibold text-faint">{tx('or').toUpperCase()}</Text>
      <View className="h-px flex-1 bg-border-strong" />
    </View>
  );
}

/** "Explore the world, one destination at a time." under the sign-in form (design guide). */
export function AuthTagline() {
  return (
    <View className="items-center gap-1 pt-2" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Text className="text-center font-script text-[22px] leading-[26px] text-heading">{tx('Explore the world, one destination at a time.')}</Text>
    </View>
  );
}
