import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HeroScene } from '@/components/illustrations';
import { Text } from '@/components/text';
import { colors } from '@/lib/theme';

type Props = {
  title: string;
  subtitle?: string;
  back?: boolean;
  /** Shorter hero for longer forms. */
  compact?: boolean;
  children: ReactNode;
  footer?: ReactNode;
};

/** Auth screens from the redesign: illustrated hero fading into the form. */
export function AuthShell({ title, subtitle, back, compact, children, footer }: Props) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const heroHeight = compact ? 170 : 270;

  return (
    <KeyboardAvoidingView className="flex-1 bg-background" behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1, paddingBottom: insets.bottom + 16 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ height: heroHeight + insets.top }} className="overflow-hidden">
          <View style={{ position: 'absolute', bottom: 0 }}>
            <HeroScene width={width} height={heroHeight + insets.top} />
          </View>
          <View
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              height: 96,
              experimental_backgroundImage: `linear-gradient(180deg, ${colors.background}00, ${colors.background})`,
            }}
          />
          {back ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Go back"
              hitSlop={8}
              onPress={() => (router.canGoBack() ? router.back() : router.replace('/sign-in'))}
              className="absolute left-5 h-11 w-11 items-center justify-center rounded-full bg-card/90"
              style={{ top: insets.top + 8 }}
            >
              <ArrowLeft color={colors.foreground} size={20} />
            </Pressable>
          ) : null}
        </View>
        <View className="-mt-6 flex-1 gap-4 px-6">
          <View className="gap-1.5">
            <Text className="font-display text-[34px] leading-10 text-foreground">{title}</Text>
            {subtitle ? <Text className="text-base text-muted-foreground">{subtitle}</Text> : null}
          </View>
          {children}
        </View>
        {footer ? <View className="px-6 pt-6">{footer}</View> : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export function OrDivider() {
  return (
    <View className="flex-row items-center gap-3">
      <View className="h-px flex-1 bg-border" />
      <Text className="text-xs text-faint">or</Text>
      <View className="h-px flex-1 bg-border" />
    </View>
  );
}
