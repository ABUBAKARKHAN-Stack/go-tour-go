import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ChevronLeft } from 'lucide-react-native';
import { useEffect, type ReactNode } from 'react';
import { Pressable, useWindowDimensions, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/text';
import { HERO_PHOTOS, prefetchHeroPhotos, type HeroPhoto } from '@/features/brand/hero-photos';
import { HandNote, PhotoHeader, photoHeight, ScriptWord, sweepOverlap } from '@/features/brand/mood';
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
 * - a real Pakistan photo running under the status bar, a misty top for the
 *   logo, the curve where the page sweeps up over it, and an optional note;
 * - "‹ Back" tucked into the high side of the curve, the title with an
 *   optional handwritten word, then the form (labels hidden: icon + placeholder);
 * - the same photo height on every auth screen; the page fits a normal phone
 *   and scrolls only when the keyboard needs room, keeping the focused field
 *   above the keyboard.
 */
export function AuthShell({ title, scriptWord, subtitle, back, photo = HERO_PHOTOS.signIn, note, children, footer }: Props) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const photoH = photoHeight('auth', height);

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
        <PhotoHeader kind="auth" photo={photo} width={width} height={photoH} topInset={insets.top}>
          {note ? <HandNote lines={note} style={{ end: 16, top: insets.top + (photoH - insets.top) * 0.3 }} rotate={-7} /> : null}
        </PhotoHeader>
        <View className="flex-1 gap-2 px-6" style={{ marginTop: -sweepOverlap('auth', width, back) }}>
          {back ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={tx('Go back')}
              hitSlop={8}
              onPress={() => (router.canGoBack() ? router.back() : router.replace('/sign-in'))}
              className="min-h-9 flex-row items-center gap-0.5 self-start active:opacity-60"
            >
              <ChevronLeft color={colors.accent} size={20} style={flipX} />
              <Text className="text-[15px] font-semibold text-accent">{tx('Back')}</Text>
            </Pressable>
          ) : null}
          <View className="gap-1 pb-2">
            {scriptWord && !isUrdu ? (
              <View accessible accessibilityRole="header" accessibilityLabel={`${title} ${scriptWord}`} className="flex-row flex-wrap items-end gap-x-2">
                <Text className="font-display text-[28px] leading-[34px] text-heading">{title}</Text>
                <ScriptWord word={scriptWord} />
              </View>
            ) : (
              <Text accessibilityRole="header" className="font-display text-[28px] leading-[34px] text-heading">
                {scriptWord ? `${title} ${scriptWord}` : title}
              </Text>
            )}
            {subtitle ? <Text className="text-[14px] leading-[20px] text-muted-foreground">{subtitle}</Text> : null}
          </View>
          {children}
        </View>
        {footer ? <View className="px-6 pt-4">{footer}</View> : null}
      </KeyboardAwareScrollView>
    </View>
  );
}

/** "Don't have an account? Sign up": a quiet text line linking the two auth screens. */
export function AuthSwitch({ prompt, action, onPress }: { prompt: string; action: string; onPress: () => void }) {
  return (
    <View className="flex-row flex-wrap items-center justify-center gap-x-1.5">
      <Text className="text-sm text-muted-foreground">{prompt}</Text>
      <Pressable accessibilityRole="link" hitSlop={10} onPress={onPress} className="min-h-11 justify-center active:opacity-60">
        <Text className="text-sm font-bold text-accent">{action}</Text>
      </Pressable>
    </View>
  );
}

/** "OR" between signing in and continuing as a guest. */
export function OrDivider() {
  return (
    <View className="flex-row items-center gap-3 py-0.5" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View className="h-px flex-1 bg-border-strong" />
      <Text className="text-xs font-semibold text-faint">{tx('or').toUpperCase()}</Text>
      <View className="h-px flex-1 bg-border-strong" />
    </View>
  );
}
