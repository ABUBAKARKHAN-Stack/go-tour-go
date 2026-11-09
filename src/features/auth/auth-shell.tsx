import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ChevronLeft } from 'lucide-react-native';
import { useEffect, type ReactNode } from 'react';
import { Pressable, useWindowDimensions, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/text';
import { HERO_PHOTOS, prefetchHeroPhotos, type HeroPhoto } from '@/features/brand/hero-photos';
import { HandNote, heroHeight, PhotoHeader } from '@/features/brand/mood';
import { flipX, isUrdu, tx } from '@/lib/i18n';
import { colors } from '@/lib/theme';

type Props = {
  title: string;
  /** A word drawn in the handwritten accent after the title ("Ready to Explore?"). */
  scriptWord?: string;
  subtitle?: string;
  back?: boolean;
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
 *   handwritten word, then the form (labels hidden: icon + placeholder);
 * - the same photo height as onboarding on every screen; the page fits a
 *   normal phone and scrolls only when the keyboard needs room, keeping the
 *   focused field above the keyboard.
 */
export function AuthShell({ title, scriptWord, subtitle, back, photo = HERO_PHOTOS.signIn, note, children, footer }: Props) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const photoHeight = heroHeight(height);

  useEffect(prefetchHeroPhotos, []);

  return (
    <View className="flex-1 bg-background">
      <StatusBar style="dark" />
      <KeyboardAwareScrollView
        bottomOffset={24}
        bounces={false}
        overScrollMode="never"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: insets.bottom + 16 }}
      >
        <View style={{ paddingTop: insets.top }}>
          <PhotoHeader photo={photo} width={width} height={photoHeight}>
            {note ? <HandNote lines={note} style={{ end: 16, top: photoHeight * 0.3 }} rotate={-7} /> : null}
          </PhotoHeader>
        </View>
        <View className="-mt-4 flex-1 gap-2.5 px-6">
          {back ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={tx('Go back')}
              hitSlop={8}
              onPress={() => (router.canGoBack() ? router.back() : router.replace('/sign-in'))}
              className="-mb-1 min-h-9 flex-row items-center gap-0.5 self-start"
            >
              <ChevronLeft color={colors.accent} size={20} style={flipX} />
              <Text className="text-[15px] font-semibold text-accent">{tx('Back')}</Text>
            </Pressable>
          ) : null}
          <View className="gap-1 pb-1">
            <Text accessibilityRole="header" className="font-display text-[28px] leading-[34px] text-heading">
              {title}
              {scriptWord ? (
                isUrdu ? (
                  ` ${scriptWord}`
                ) : (
                  <Text className="font-script text-[36px] text-sky-strong">{` ${scriptWord}`}</Text>
                )
              ) : null}
            </Text>
            {subtitle ? <Text className="text-[14px] leading-[20px] text-muted-foreground">{subtitle}</Text> : null}
          </View>
          {children}
        </View>
        {footer ? <View className="px-6 pt-4">{footer}</View> : null}
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
