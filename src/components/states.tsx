import { AlertTriangle, Inbox, type LucideIcon } from 'lucide-react-native';
import { ActivityIndicator, View } from 'react-native';
import { Text } from '@/components/text';

import { AppButton } from '@/components/app-button';
import { errorMessage } from '@/lib/errors';
import { colors } from '@/lib/theme';

export function LoadingState({ label = 'Loading...' }: { label?: string }) {
  return (
    <View className="items-center justify-center gap-3 py-12" accessibilityLiveRegion="polite">
      <ActivityIndicator color={colors.primary} />
      <Text className="text-sm text-muted-foreground">{label}</Text>
    </View>
  );
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
      <Text className="text-center font-display text-xl text-foreground">{title}</Text>
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
  return (
    <View className="items-center justify-center gap-3 px-6 py-12" accessibilityRole="alert">
      <View className="h-16 w-16 items-center justify-center rounded-full bg-destructive-soft">
        <AlertTriangle color={colors.destructive} size={26} />
      </View>
      <Text className="text-center text-base font-semibold text-foreground">{title}</Text>
      <Text className="text-center text-sm text-muted-foreground">{errorMessage(error)}</Text>
      {onRetry ? <AppButton label="Try again" onPress={onRetry} variant="secondary" /> : null}
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
