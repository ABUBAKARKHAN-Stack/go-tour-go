import { AlertTriangle, Inbox, type LucideIcon } from 'lucide-react-native';
import { ActivityIndicator, Text, View } from 'react-native';

import { AppButton } from '@/components/app-button';
import { errorMessage } from '@/lib/errors';
import { colors } from '@/lib/theme';

export function LoadingState({ label = 'Loading...' }: { label?: string }) {
  return (
    <View className="items-center justify-center gap-3 py-12" accessibilityLiveRegion="polite">
      <ActivityIndicator color={colors.accent} />
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
      <View className="h-14 w-14 items-center justify-center rounded-full bg-secondary">
        <Icon color={colors.accent} size={26} />
      </View>
      <Text className="text-center text-base font-semibold text-foreground">{title}</Text>
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
      <View className="h-14 w-14 items-center justify-center rounded-full bg-secondary">
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
    <View className="flex-row items-center gap-2 rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2">
      <AlertTriangle color={colors.destructive} size={16} />
      <Text className="flex-1 text-sm text-foreground">{message}</Text>
    </View>
  );
}
