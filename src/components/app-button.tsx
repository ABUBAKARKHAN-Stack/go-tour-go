import type { LucideIcon } from 'lucide-react-native';
import { ActivityIndicator, Pressable, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { Text } from '@/components/text';
import { usePressScale } from '@/lib/motion';
import { brandGradient, colors, shadow } from '@/lib/theme';
import { flipX } from '@/lib/i18n';

/** Primary and accent buttons share the brand gradient (ocean → deeper sky) with a soft navy glow. */
const GRADIENT_STYLE = { experimental_backgroundImage: brandGradient, boxShadow: shadow(0.22, 6, 14) } as const;

type Variant = 'primary' | 'accent' | 'secondary' | 'outline' | 'ghost' | 'destructive';

const containerClass: Record<Variant, string> = {
  primary: 'bg-primary',
  accent: 'bg-primary',
  secondary: 'border border-border bg-card',
  outline: 'border-[1.5px] border-border-strong bg-transparent',
  ghost: 'bg-transparent',
  destructive: 'bg-destructive',
};

const textClass: Record<Variant, string> = {
  primary: 'text-primary-foreground',
  accent: 'text-primary-foreground',
  secondary: 'text-heading',
  outline: 'text-primary',
  ghost: 'text-primary',
  destructive: 'text-white',
};

const iconColor: Record<Variant, string> = {
  primary: colors.primaryForeground,
  accent: colors.primaryForeground,
  secondary: colors.heading,
  outline: colors.primary,
  ghost: colors.primary,
  destructive: '#FFFFFF',
};

type Props = {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  icon?: LucideIcon;
  /** Icon after the label (e.g. a forward arrow), mirrored in right-to-left. */
  trailingIcon?: LucideIcon;
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
  trailingIcon: Trailing,
  loading,
  disabled,
  size = 'md',
  className,
  accessibilityHint,
  onLongPress,
  delayLongPress,
}: Props) {
  const isDisabled = disabled || loading;
  const press = usePressScale();
  // The wrapper takes layout classes (flex-1, margins) and shrinks on press-in.
  return (
    <Animated.View className={className} style={press.style}>
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={delayLongPress}
      {...press.handlers}
      pressRetentionOffset={16}
      className={`${size === 'md' ? 'min-h-14 px-6' : 'min-h-11 px-4'} flex-row items-center justify-center gap-2 rounded-full ${containerClass[variant]} ${isDisabled ? 'opacity-50' : ''}`}
      style={variant === 'primary' || variant === 'accent' ? GRADIENT_STYLE : undefined}
    >
      {loading ? (
        <ActivityIndicator color={iconColor[variant]} size="small" />
      ) : Icon ? (
        <Icon color={iconColor[variant]} size={size === 'md' ? 18 : 16} />
      ) : null}
      <Text className={`${size === 'md' ? 'text-base' : 'text-sm'} font-semibold ${textClass[variant]}`}>{label}</Text>
      {Trailing && !loading ? <Trailing color={iconColor[variant]} size={size === 'md' ? 18 : 16} style={flipX} /> : null}
    </Pressable>
    </Animated.View>
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
  const press = usePressScale(0.94);
  return (
    <Animated.View style={press.style}>
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      pressRetentionOffset={16}
      onPress={onPress}
      {...press.handlers}
      className={`h-11 w-11 items-center justify-center rounded-full ${active ? 'bg-primary' : 'bg-card'}`}
      style={{ boxShadow: shadow(active ? 0.2 : 0.1, 3, 10) }}
    >
      <Icon color={active ? colors.primaryForeground : colors.heading} size={20} style={flip ? flipX : undefined} />
      {badge ? (
        <View className="absolute -right-0.5 -top-0.5 min-w-5 items-center rounded-full border-2 border-card bg-accent px-1">
          <Text className="text-[10px] font-bold text-white">{badge > 9 ? '9+' : badge}</Text>
        </View>
      ) : null}
    </Pressable>
    </Animated.View>
  );
}
