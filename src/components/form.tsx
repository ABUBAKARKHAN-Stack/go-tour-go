import { useState, type ReactNode } from 'react';
import { Pressable, Text, TextInput, View, type TextInputProps } from 'react-native';

import { colors } from '@/lib/theme';

type FieldProps = TextInputProps & {
  label: string;
  error?: string | null;
  hint?: string;
  right?: ReactNode;
};

/** Labelled text input with error/hint text, sized for touch. */
export function TextField({ label, error, hint, right, multiline, ...props }: FieldProps) {
  const [focused, setFocused] = useState(false);
  return (
    <View className="gap-1.5">
      <Text className="text-sm font-medium text-foreground">{label}</Text>
      <View
        className={`flex-row items-center rounded-2xl border bg-input px-4 ${multiline ? 'min-h-28 py-3' : 'min-h-12'} ${
          error ? 'border-destructive' : focused ? 'border-accent' : 'border-border/50'
        }`}
      >
        <TextInput
          accessibilityLabel={label}
          placeholderTextColor={`${colors.mutedForeground}99`}
          className="flex-1 text-base text-foreground"
          style={multiline ? { textAlignVertical: 'top', minHeight: 88 } : undefined}
          multiline={multiline}
          onFocus={(e) => {
            setFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            props.onBlur?.(e);
          }}
          {...props}
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
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: ReactNode;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      className={`min-h-10 flex-row items-center gap-1.5 rounded-full border px-4 ${
        selected ? 'border-accent bg-accent' : 'border-border/40 bg-secondary'
      }`}
    >
      {icon}
      <Text className={`text-sm font-medium ${selected ? 'text-accent-foreground' : 'text-foreground'}`}>{label}</Text>
    </Pressable>
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
  return (
    <View className="flex-row rounded-2xl bg-secondary p-1" accessibilityRole="tablist">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(o.value)}
            className={`min-h-10 flex-1 items-center justify-center rounded-xl px-2 ${active ? 'bg-primary' : ''}`}
          >
            <Text numberOfLines={1} className={`text-sm font-semibold ${active ? 'text-primary-foreground' : 'text-muted-foreground'}`}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <View className={`rounded-3xl border border-border/25 bg-card p-4 ${className ?? ''}`}>{children}</View>;
}

export function SectionHeader({ title, actionLabel, onAction }: { title: string; actionLabel?: string; onAction?: () => void }) {
  return (
    <View className="flex-row items-center justify-between">
      <Text className="text-lg font-bold text-foreground">{title}</Text>
      {actionLabel && onAction ? (
        <Pressable accessibilityRole="button" onPress={onAction} hitSlop={10} className="min-h-10 justify-center">
          <Text className="text-sm font-semibold text-accent">{actionLabel}</Text>
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
      <View className={`h-7 w-12 justify-center rounded-full px-0.5 ${value ? 'bg-accent' : 'bg-muted'}`}>
        <View className={`h-6 w-6 rounded-full ${value ? 'self-end bg-accent-foreground' : 'self-start bg-muted-foreground'}`} />
      </View>
    </Pressable>
  );
}
