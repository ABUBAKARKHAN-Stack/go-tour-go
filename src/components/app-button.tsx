import type { LucideIcon } from 'lucide-react-native';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { colors } from '@/lib/theme';

type Variant = 'primary' | 'accent' | 'secondary' | 'outline' | 'ghost' | 'destructive';

const containerClass: Record<Variant, string> = {
  primary: 'bg-primary',
  accent: 'bg-accent',
  secondary: 'bg-secondary',
  outline: 'border border-border bg-transparent',
  ghost: 'bg-transparent',
  destructive: 'bg-destructive',
};

const textClass: Record<Variant, string> = {
  primary: 'text-primary-foreground',
  accent: 'text-accent-foreground',
  secondary: 'text-secondary-foreground',
  outline: 'text-foreground',
  ghost: 'text-accent',
  destructive: 'text-white',
};

const iconColor: Record<Variant, string> = {
  primary: colors.primaryForeground,
  accent: colors.accentForeground,
  secondary: colors.accent,
  outline: colors.foreground,
  ghost: colors.accent,
  destructive: '#FFFFFF',
};

type Props = {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  icon?: LucideIcon;
  loading?: boolean;
  disabled?: boolean;
  size?: 'md' | 'sm';
  className?: string;
  accessibilityHint?: string;
  onLongPress?: () => void;
  delayLongPress?: number;
};

/**
 * App button with a 48dp minimum touch target, loading and disabled states.
 * Uses the same semantic tokens as the gluestack kit.
 */
export function AppButton({
  label,
  onPress,
  variant = 'primary',
  icon: Icon,
  loading,
  disabled,
  size = 'md',
  className,
  accessibilityHint,
  onLongPress,
  delayLongPress,
}: Props) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={delayLongPress}
      className={`${size === 'md' ? 'min-h-12 px-5' : 'min-h-10 px-4'} flex-row items-center justify-center gap-2 rounded-2xl active:opacity-80 ${containerClass[variant]} ${isDisabled ? 'opacity-50' : ''} ${className ?? ''}`}
    >
      {loading ? (
        <ActivityIndicator color={iconColor[variant]} size="small" />
      ) : Icon ? (
        <Icon color={iconColor[variant]} size={size === 'md' ? 18 : 16} />
      ) : null}
      <Text className={`${size === 'md' ? 'text-base' : 'text-sm'} font-semibold ${textClass[variant]}`}>{label}</Text>
    </Pressable>
  );
}

/** Round icon-only button (44dp). */
export function IconButton({
  icon: Icon,
  label,
  onPress,
  active,
  badge,
}: {
  icon: LucideIcon;
  label: string;
  onPress?: () => void;
  active?: boolean;
  badge?: number;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      onPress={onPress}
      className={`h-11 w-11 items-center justify-center rounded-full active:opacity-80 ${active ? 'bg-accent' : 'bg-secondary'}`}
    >
      <Icon color={active ? colors.accentForeground : colors.foreground} size={20} />
      {badge ? (
        <View className="absolute -right-0.5 -top-0.5 min-w-5 items-center rounded-full bg-destructive px-1">
          <Text className="text-[10px] font-bold text-white">{badge > 9 ? '9+' : badge}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}
