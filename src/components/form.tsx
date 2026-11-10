import { ChevronRight } from 'lucide-react-native';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { I18nManager, Pressable, View, type TextInputProps } from 'react-native';
import Animated, { ReduceMotion, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { Text, TextInput } from '@/components/text';

import { haptics } from '@/lib/haptics';
import { flipX } from '@/lib/i18n';
import { EASE_IN_OUT, usePressScale } from '@/lib/motion';
import { colors, shadow } from '@/lib/theme';

export type FieldProps = TextInputProps & {
  label: string;
  /** Keep the label for screen readers only (the icon + placeholder show it, as on the sign-in screens). */
  hideLabel?: boolean;
  left?: ReactNode;
  error?: string | null;
  hint?: string;
  right?: ReactNode;
};

/** Labelled text input with error/hint text, sized for touch. */
export function TextField({ label, hideLabel, error, hint, left, right, multiline, onFocus, onBlur, ...props }: FieldProps) {
  const [focused, setFocused] = useState(false);
  return (
    <View className="gap-1.5">
      {hideLabel ? null : <Text className="text-sm font-medium text-muted-foreground">{label}</Text>}
      <View
        className={`flex-row items-center gap-3 px-5 ${multiline ? 'min-h-28 rounded-3xl py-3' : 'min-h-[52px] rounded-full'} ${
          error ? 'border-[1.5px] border-destructive bg-card' : focused ? 'border-[1.5px] border-primary bg-card' : 'border-[1.5px] border-transparent bg-primary-soft'
        }`}
      >
        {left}
        <TextInput
          accessibilityLabel={label}
          placeholderTextColor={colors.faint}
          className="flex-1 text-[15px] text-foreground"
          style={multiline ? { textAlignVertical: 'top', minHeight: 88 } : undefined}
          multiline={multiline}
          {...props}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
        />
        {right}
      </View>
      {error ? (
        <Text className="text-xs text-destructive" accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : hint ? (
        <Text className="text-xs text-muted-foreground">{hint}</Text>
      ) : null}
    </View>
  );
}

export function Chip({
  label,
  selected,
  onPress,
  icon,
  floating,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: ReactNode;
  /** White with a shadow, for chips laid over a map or photo. */
  floating?: boolean;
}) {
  const press = usePressScale(0.95);
  return (
    <Animated.View style={press.style}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ selected }}
        onPress={onPress}
        {...press.handlers}
        className={`min-h-10 flex-row items-center gap-1.5 rounded-full px-4 ${selected ? 'bg-inverse' : floating ? 'bg-card' : 'bg-primary-soft'}`}
        style={floating ? { boxShadow: shadow(0.12, 3, 10) } : undefined}
      >
        {icon}
        <Text className={`text-sm font-semibold ${selected ? 'text-white' : 'text-heading'}`}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

/** Segmented control for a small set of options. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  // The white indicator glides to the selected option (250 ms ease-in-out).
  const [width, setWidth] = useState(0);
  const segment = width ? (width - 8) / options.length : 0;
  const index = Math.max(0, options.findIndex((o) => o.value === value));
  const x = useSharedValue(0);
  const placed = useRef(false);
  useEffect(() => {
    if (!segment) return;
    const target = index * segment * (I18nManager.isRTL ? -1 : 1);
    if (!placed.current) {
      placed.current = true;
      x.set(target);
      return;
    }
    x.set(withTiming(target, { duration: 250, easing: EASE_IN_OUT, reduceMotion: ReduceMotion.System }));
  }, [index, segment, x]);
  const indicatorStyle = useAnimatedStyle(() => ({ transform: [{ translateX: x.get() }] }));

  return (
    <View className="flex-row rounded-full bg-primary-soft p-1" accessibilityRole="tablist" onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      {segment ? (
        <Animated.View
          pointerEvents="none"
          className="absolute rounded-full bg-card"
          style={[{ top: 4, bottom: 4, start: 4, width: segment, boxShadow: shadow(0.12, 1, 4) }, indicatorStyle]}
        />
      ) : null}
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => {
              if (o.value !== value) haptics.select();
              onChange(o.value);
            }}
            className={`min-h-10 flex-1 items-center justify-center rounded-full px-2 ${active && !segment ? 'bg-card shadow-sm' : ''}`}
          >
            <Text numberOfLines={1} className={`text-sm font-semibold ${active ? 'text-heading' : 'text-muted-foreground'}`}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** White card with a soft navy shadow (style tile). */
export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <View className={`rounded-3xl bg-card p-4 ${className ?? ''}`} style={{ boxShadow: shadow(0.08, 6, 20) }}>
      {children}
    </View>
  );
}

export function SectionHeader({ title, actionLabel, onAction }: { title: string; actionLabel?: string; onAction?: () => void }) {
  return (
    <View className="flex-row items-center justify-between">
      <Text className="font-display text-[22px] leading-7 text-heading">{title}</Text>
      {actionLabel && onAction ? (
        <Pressable accessibilityRole="button" onPress={onAction} hitSlop={10} className="min-h-10 flex-row items-center gap-0.5">
          <Text className="text-sm font-semibold text-accent">{actionLabel}</Text>
          <ChevronRight color={colors.accent} size={16} style={flipX} />
        </Pressable>
      ) : null}
    </View>
  );
}

export function ToggleRow({
  title,
  description,
  value,
  onChange,
}: {
  title: string;
  description?: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      onPress={() => onChange(!value)}
      className="min-h-14 flex-row items-center gap-3 py-2"
    >
      <View className="flex-1">
        <Text className="text-base text-foreground">{title}</Text>
        {description ? <Text className="text-xs text-muted-foreground">{description}</Text> : null}
      </View>
      <View className={`h-7 w-12 justify-center rounded-full px-0.5 ${value ? 'bg-primary' : 'bg-border-strong'}`}>
        <View className={`h-6 w-6 rounded-full bg-white ${value ? 'self-end' : 'self-start'}`} />
      </View>
    </Pressable>
  );
}
