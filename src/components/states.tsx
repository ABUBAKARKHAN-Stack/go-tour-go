import { useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Inbox, WifiOff, type LucideIcon } from 'lucide-react-native';
import { ActivityIndicator, View } from 'react-native';
import { Text } from '@/components/text';

import { AppButton } from '@/components/app-button';
import { useIsOnline } from '@/components/offline-banner';
import { Skeleton } from '@/components/skeleton';
import { errorMessage } from '@/lib/errors';
import { colors } from '@/lib/theme';
import { tx } from '@/lib/i18n';

export type LoadingVariant = 'spinner' | 'list' | 'cards' | 'feed' | 'profile' | 'detail';

/**
 * Loading placeholder. Screens pass the variant that matches what will appear
 * (a skeleton of rows, cards, posts...), so content replaces shapes in place
 * instead of jumping in under a spinner. "spinner" is for actions in progress
 * (searching, analysing a photo).
 */
export function LoadingState({
  label,
  variant = 'list',
  offlineAware = variant !== 'spinner',
}: {
  label?: string;
  variant?: LoadingVariant;
  /**
   * Waiting for the server while offline would never end (the request waits
   * for the connection), so say so instead. On by default except for
   * "spinner", which is also used for work done on the phone.
   */
  offlineAware?: boolean;
}) {
  const online = useIsOnline();
  if (offlineAware && !online) return <OfflineState />;
  const text = label ?? tx('Loading...');
  if (variant === 'spinner') {
    return (
      <View className="items-center justify-center gap-3 py-12" accessibilityLiveRegion="polite">
        <ActivityIndicator color={colors.primary} />
        <Text className="text-sm text-muted-foreground">{text}</Text>
      </View>
    );
  }
  return <Skeleton variant={variant} label={text} />;
}

export function EmptyState({
  title,
  message,
  icon: Icon = Inbox,
  actionLabel,
  onAction,
}: {
  title: string;
  message?: string;
  icon?: LucideIcon;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View className="items-center justify-center gap-3 px-6 py-12">
      <View className="h-16 w-16 items-center justify-center rounded-full bg-primary-soft">
        <Icon color={colors.primary} size={28} />
      </View>
      <Text className="text-center font-display text-xl text-heading">{title}</Text>
      {message ? <Text className="text-center text-sm text-muted-foreground">{message}</Text> : null}
      {actionLabel && onAction ? <AppButton label={actionLabel} onPress={onAction} variant="secondary" /> : null}
    </View>
  );
}

export function ErrorState({
  error,
  title = 'Unable to load',
  onRetry,
}: {
  error?: unknown;
  title?: string;
  onRetry?: () => void;
}) {
  const online = useIsOnline();
  // Offline, the reason is always the connection: say that plainly.
  if (!online) return <OfflineState onRetry={onRetry} />;
  return (
    <View className="items-center justify-center gap-3 px-6 py-12" accessibilityRole="alert">
      <View className="h-16 w-16 items-center justify-center rounded-full bg-destructive-soft">
        <AlertTriangle color={colors.destructive} size={26} />
      </View>
      <Text className="text-center text-base font-semibold text-heading">{tx(title)}</Text>
      <Text className="text-center text-sm text-muted-foreground">{errorMessage(error)}</Text>
      {onRetry ? <AppButton label={tx('Try again')} onPress={onRetry} variant="secondary" /> : null}
    </View>
  );
}

/**
 * Shown instead of loading or an error while there is no internet: what is
 * needed, and that it loads by itself once the connection is back ("Try
 * again" asks right away).
 */
export function OfflineState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  const queryClient = useQueryClient();
  const retry = onRetry ?? (() => void queryClient.refetchQueries({ type: 'active' }));
  return (
    <View className="items-center justify-center gap-3 px-6 py-12" accessibilityRole="alert">
      <View className="h-16 w-16 items-center justify-center rounded-full bg-muted">
        <WifiOff color={colors.mutedForeground} size={26} />
      </View>
      <Text className="text-center text-base font-semibold text-heading">{tx("You're offline")}</Text>
      <Text className="text-center text-sm text-muted-foreground">
        {message ?? tx('Connect to the internet to see this. It loads by itself when you are back online.')}
      </Text>
      <AppButton label={tx('Try again')} onPress={retry} variant="secondary" />
    </View>
  );
}

/** Inline, non-blocking error shown above cached content. */
export function InlineError({ message }: { message: string }) {
  return (
    <View className="flex-row items-center gap-2 rounded-xl bg-destructive-soft px-3 py-2">
      <AlertTriangle color={colors.destructive} size={16} />
      <Text className="flex-1 text-sm text-foreground">{message}</Text>
    </View>
  );
}
