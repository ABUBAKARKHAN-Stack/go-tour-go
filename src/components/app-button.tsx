import type { LucideIcon } from 'lucide-react-native';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { Text } from '@/components/text';

import { colors } from '@/lib/theme';
import { flipX } from '@/lib/i18n';

type Variant = 'primary' | 'accent' | 'secondary' | 'outline' | 'ghost' | 'destructive';

const containerClass: Record<Variant, string> = {
  primary: 'bg-primary active:bg-primary-pressed',
  accent: 'bg-accent',
  secondary: 'border border-border-strong bg-card',
  outline: 'border border-border-strong bg-transparent',
  ghost: 'bg-transparent',
  destructive: 'bg-destructive',
};

const textClass: Record<Variant, string> = {
  primary: 'text-primary-foreground',
  accent: 'text-accent-foreground',
  secondary: 'text-foreground',
  outline: 'text-foreground',
  ghost: 'text-primary',
  destructive: 'text-white',
};

const iconColor: Record<Variant, string> = {
  primary: colors.primaryForeground,
  accent: colors.accentForeground,
  secondary: colors.foreground,
  outline: colors.foreground,
  ghost: colors.primary,
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
 * Pill shaped, matching the Button component in the Figma design.
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
      className={`${size === 'md' ? 'min-h-14 px-6' : 'min-h-11 px-4'} flex-row items-center justify-center gap-2 rounded-full active:opacity-85 ${containerClass[variant]} ${isDisabled ? 'opacity-50' : ''} ${className ?? ''}`}
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
  flip,
}: {
  icon: LucideIcon;
  label: string;
  onPress?: () => void;
  active?: boolean;
  badge?: number;
  /** Mirror the icon in right-to-left (back arrows, chevrons). */
  flip?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      onPress={onPress}
      className={`h-11 w-11 items-center justify-center rounded-full active:opacity-80 ${active ? 'bg-primary' : 'border border-border bg-card'}`}
    >
      <Icon color={active ? colors.primaryForeground : colors.foreground} size={20} style={flip ? flipX : undefined} />
      {badge ? (
        <View className="absolute -right-0.5 -top-0.5 min-w-5 items-center rounded-full border-2 border-card bg-accent px-1">
          <Text className="text-[10px] font-bold text-white">{badge > 9 ? '9+' : badge}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}
