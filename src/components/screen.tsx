import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View, type ScrollViewProps } from 'react-native';
import { Text } from '@/components/text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { OfflineBanner } from '@/components/offline-banner';
import { useTabBarSpace } from '@/components/tab-bar';
import { colors, shadow } from '@/lib/theme';
import { flipX, tx } from '@/lib/i18n';

type HeaderProps = {
  title?: string;
  subtitle?: string;
  back?: boolean;
  right?: ReactNode;
};

export function AppHeader({ title, subtitle, back, right }: HeaderProps) {
  return (
    <View className="flex-row items-center gap-3 px-4 pb-3 pt-2">
      {back ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={tx('Go back')}
          hitSlop={8}
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
          className="h-11 w-11 items-center justify-center rounded-full bg-card"
          style={{ boxShadow: shadow(0.1, 3, 10) }}
        >
          <ArrowLeft color={colors.heading} size={22} style={flipX} />
        </Pressable>
      ) : null}
      <View className="flex-1">
        {title ? (
          <Text className="font-display text-[26px] leading-8 text-heading">
            {title}
          </Text>
        ) : null}
        {subtitle ? (
          <Text className="text-sm text-muted-foreground">
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right}
    </View>
  );
}

type ScreenProps = HeaderProps & {
  children: ReactNode;
  /** Wrap content in a ScrollView (default true). */
  scroll?: boolean;
  /** Avoid the keyboard (forms, chat). */
  keyboard?: boolean;
  /** Skip bottom inset when a tab bar already handles it. */
  inTabs?: boolean;
  /** Hide the header row entirely. */
  headerless?: boolean;
  contentClassName?: string;
  refreshControl?: ScrollViewProps['refreshControl'];
  footer?: ReactNode;
  /** Full-bleed header that runs under the status bar (e.g. BrandHeader); replaces the header row. */
  hero?: ReactNode;
};

/** Standard screen scaffold: safe areas, header, offline banner, scroll and keyboard handling. */
export function Screen({
  children,
  scroll = true,
  keyboard,
  inTabs,
  headerless,
  contentClassName,
  refreshControl,
  footer,
  hero,
  ...header
}: ScreenProps) {
  const insets = useSafeAreaInsets();
  const tabSpace = useTabBarSpace();
  const bottom = inTabs ? tabSpace : insets.bottom + 16;

  const body = scroll ? (
    <ScrollView
      className="flex-1"
      contentContainerClassName={contentClassName ?? 'px-4 gap-4'}
      contentContainerStyle={{ paddingBottom: bottom }}
      keyboardShouldPersistTaps="handled"
      refreshControl={refreshControl}
    >
      {children}
    </ScrollView>
  ) : (
    <View className={contentClassName ?? 'flex-1'} style={{ paddingBottom: footer ? 0 : inTabs ? tabSpace : insets.bottom }}>
      {children}
    </View>
  );

  const content = (
    <View className="flex-1 bg-background" style={hero ? undefined : { paddingTop: insets.top }}>
      {hero ?? (headerless ? null : <AppHeader {...header} />)}
      <OfflineBanner />
      {body}
      {footer ? (
        <View className="border-t border-border bg-background px-4 pt-3" style={{ paddingBottom: insets.bottom + 12 }}>
          {footer}
        </View>
      ) : null}
    </View>
  );

  if (!keyboard) return content;
  return (
    <KeyboardAvoidingView className="flex-1 bg-background" behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      {content}
    </KeyboardAvoidingView>
  );
}
