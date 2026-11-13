import { router } from 'expo-router';
import { Sparkles } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/text';
import { useAiUsage } from '@/features/ai/api';
import { tx } from '@/lib/i18n';
import { brandGradient, colors } from '@/lib/theme';

/**
 * "7 of 10 AI questions left today", always visible where the AI is used
 * (AI guide, place chat, Lens). Shown only once the server has told us the
 * numbers, so it never guesses (offline it stays hidden).
 */
export function AiQuota({ className, compact = false }: { className?: string; compact?: boolean }) {
  const { data } = useAiUsage();
  if (!data || !data.limit) return null;
  const left = Math.max(0, data.limit - data.used);
  const low = left <= Math.max(1, Math.round(data.limit * 0.2));
  const label =
    left === 0
      ? tx('No AI questions left today. More tomorrow.')
      : tx('{0} of {1} AI questions left today', { 0: left, 1: data.limit });

  // Slim line for chat screens: the same facts, without the card.
  if (compact) {
    return (
      <View accessible accessibilityLabel={label} accessibilityLiveRegion="polite" className={`flex-row items-center justify-center gap-1.5 ${className ?? ''}`}>
        <Sparkles color={low ? colors.destructive : colors.faint} size={12} />
        <Text className={`text-[12px] ${low ? 'font-semibold text-destructive' : 'text-faint'}`} style={{ fontVariant: ['tabular-nums'] }}>
          {label}
        </Text>
        {data.guest ? (
          <Pressable accessibilityRole="link" hitSlop={8} onPress={() => router.push('/create-account')} className="active:opacity-60">
            <Text className="text-[12px] font-semibold text-accent">{tx('Get more')}</Text>
          </Pressable>
        ) : null}
      </View>
    );
  }

  return (
    <View
      accessible
      accessibilityLabel={label}
      accessibilityLiveRegion="polite"
      className={`gap-1.5 rounded-2xl px-3 py-2 ${low ? 'bg-peach' : 'bg-primary-soft'} ${className ?? ''}`}
    >
      <View className="flex-row items-center gap-1.5">
        <Sparkles color={low ? colors.destructive : colors.primary} size={14} />
        <Text className="flex-1 text-[12px] font-semibold text-heading" style={{ fontVariant: ['tabular-nums'] }}>
          {label}
        </Text>
        {data.guest ? (
          <Pressable accessibilityRole="link" hitSlop={8} onPress={() => router.push('/create-account')} className="active:opacity-60">
            <Text className="text-[12px] font-semibold text-accent">{tx('Get more')}</Text>
          </Pressable>
        ) : null}
      </View>
      <View className="h-1.5 overflow-hidden rounded-full bg-white/80">
        <View
          className="h-full rounded-full"
          style={{
            width: `${Math.round((left / data.limit) * 100)}%`,
            ...(low ? { backgroundColor: colors.destructive } : { experimental_backgroundImage: brandGradient }),
          }}
        />
      </View>
      {data.guest ? <Text className="text-[11px] text-muted-foreground">{tx('Guests get {0} a day. A free account gets more.', { 0: data.limit })}</Text> : null}
    </View>
  );
}
