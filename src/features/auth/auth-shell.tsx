import { Image } from 'expo-image';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ArrowLeft } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, useWindowDimensions, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/text';
import { flipX, tx } from '@/lib/i18n';
import { colors } from '@/lib/theme';

type Props = {
  title: string;
  subtitle?: string;
  back?: boolean;
  /** Shorter hero for longer forms (sign up). */
  compact?: boolean;
  children: ReactNode;
  footer?: ReactNode;
};

const HERO = require('../../../assets/illustrations/auth-hero.jpg');

/**
 * Every auth screen (sign in, sign up, forgot and reset password, "check your
 * email") uses this shell, so they look and behave the same (Figma 02):
 * - a full-bleed photo of the Badshahi Mosque at sunset under the status bar,
 *   fading into the page, with the title on the fade;
 * - the page fits the screen without scrolling, and scrolls only when the
 *   keyboard needs room (no bounce or overscroll on short pages);
 * - the focused field is kept above the keyboard.
 */
export function AuthShell({ title, subtitle, back, compact, children, footer }: Props) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  // Figma: 300 pt of 915 (a third of the screen); shorter for longer forms.
  const heroHeight = Math.round(Math.min(compact ? 240 : 320, Math.max(compact ? 150 : 210, height * (compact ? 0.22 : 0.33))));

  return (
    <View className="flex-1 bg-background">
      <StatusBar style="light" />
      <KeyboardAwareScrollView
        bottomOffset={24}
        bounces={false}
        overScrollMode="never"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: insets.bottom + 16 }}
      >
        <View style={{ height: heroHeight }} className="overflow-hidden">
          <Image source={HERO} style={{ width, height: heroHeight }} contentFit="cover" contentPosition="top" accessible={false} />
          <View
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              height: Math.round(heroHeight * 0.47),
              experimental_backgroundImage: `linear-gradient(180deg, ${colors.background}00, ${colors.background}E6 70%, ${colors.background})`,
            }}
          />
          {back ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={tx('Go back')}
              hitSlop={8}
              onPress={() => (router.canGoBack() ? router.back() : router.replace('/sign-in'))}
              className="absolute left-5 h-11 w-11 items-center justify-center rounded-full bg-card"
              style={{ top: insets.top + 8, boxShadow: '0 2px 8px rgba(21,56,79,0.12)' }}
            >
              <ArrowLeft color={colors.foreground} size={20} style={flipX} />
            </Pressable>
          ) : null}
        </View>
        <View className="-mt-10 flex-1 gap-4 px-6">
          <View className="gap-2">
            <Text className="font-display text-[32px] leading-[38px] text-foreground">{title}</Text>
            {subtitle ? <Text className="text-[15px] leading-[21px] text-muted-foreground">{subtitle}</Text> : null}
          </View>
          {children}
        </View>
        {footer ? <View className="px-6 pt-6">{footer}</View> : null}
      </KeyboardAwareScrollView>
    </View>
  );
}

export function OrDivider() {
  return (
    <View className="flex-row items-center gap-3">
      <View className="h-px flex-1 bg-border" />
      <Text className="text-xs text-faint">{tx('or')}</Text>
      <View className="h-px flex-1 bg-border" />
    </View>
  );
}
