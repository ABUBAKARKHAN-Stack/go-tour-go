import { Sparkles } from 'lucide-react-native';
import { View } from 'react-native';
import Animated, { useReducedMotion } from 'react-native-reanimated';
import Markdown from 'react-native-markdown-display';

import { Text } from '@/components/text';
import { tx } from '@/lib/i18n';
import { colors } from '@/lib/theme';

export const chatMarkdownStyles = {
  body: { color: colors.foreground, fontSize: 15, lineHeight: 22 },
  bullet_list: { marginVertical: 4 },
  strong: { fontWeight: '700' as const, color: colors.heading },
  link: { color: colors.accent },
  code_inline: { backgroundColor: colors.muted, color: colors.accent },
};

/** The AI's round badge (a sparkle on mint; no mascot). */
export function AiBadge({ size = 32 }: { size?: number }) {
  return (
    <View className="items-center justify-center rounded-full bg-mint" style={{ width: size, height: size }} accessibilityElementsHidden importantForAccessibility="no">
      <Sparkles color={colors.primary} size={Math.round(size * 0.5)} />
    </View>
  );
}

/**
 * A message, laid out like the AI apps people use: the traveller's in a soft
 * bubble on the right; the AI's as full-width text under a small label, so
 * long answers read like a page rather than a cramped bubble.
 */
export function ChatBubble({ role, content }: { role: 'user' | 'assistant'; content: string }) {
  if (role === 'user') {
    return (
      <View className="max-w-[85%] self-end rounded-[22px] rounded-br-md bg-primary-soft px-4 py-2.5">
        <Text selectable className="text-[15px] leading-[22px] text-heading">
          {content}
        </Text>
      </View>
    );
  }
  return (
    <View className="gap-1.5 self-stretch">
      <AiLabel />
      <Markdown style={chatMarkdownStyles}>{content}</Markdown>
    </View>
  );
}

/** "GoTourGo AI" above an answer. */
function AiLabel() {
  return (
    <View className="flex-row items-center gap-2">
      <AiBadge size={24} />
      <Text className="text-[13px] font-semibold text-heading">{tx('GoTourGo AI')}</Text>
    </View>
  );
}

/**
 * Where the AI's answer is about to appear: its bubble with soft placeholder
 * lines (pulsing gently, still with Reduce Motion), replaced by the words as
 * they stream in.
 */
export function ReplySkeleton() {
  const reduced = useReducedMotion();
  const pulse = reduced
    ? undefined
    : ({
        animationName: { from: { opacity: 1 }, to: { opacity: 0.4 } },
        animationDuration: 800,
        animationIterationCount: 'infinite',
        animationDirection: 'alternate',
        animationTimingFunction: 'ease-in-out',
      } as const);
  return (
    <View className="gap-2 self-stretch" accessibilityRole="progressbar" accessibilityLabel={tx('Writing an answer')}>
      <AiLabel />
      <Animated.View className="gap-2.5 pt-1" style={pulse}>
        <View className="h-3 w-full rounded-full bg-muted" />
        <View className="h-3 w-11/12 rounded-full bg-muted" />
        <View className="h-3 w-3/5 rounded-full bg-muted" />
      </Animated.View>
    </View>
  );
}
