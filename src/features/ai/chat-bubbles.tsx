import { Sparkles } from 'lucide-react-native';
import { View } from 'react-native';
import Animated, { useReducedMotion } from 'react-native-reanimated';
import Markdown from 'react-native-markdown-display';

import { Avatar } from '@/components/avatar';
import { Text } from '@/components/text';
import { useAuth } from '@/features/auth/auth-provider';
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

/** Chat bubbles from the design guide: the traveller's in navy on the right, the AI's in soft blue on the left. */
export function ChatBubble({ role, content }: { role: 'user' | 'assistant'; content: string }) {
  const { profile } = useAuth();
  if (role === 'user') {
    return (
      <View className="max-w-[88%] flex-row items-end gap-2 self-end">
        <View className="shrink rounded-[20px] rounded-br-md bg-inverse px-4 py-2.5">
          <Text selectable className="text-[15px] leading-[21px] text-white">
            {content}
          </Text>
        </View>
        <Avatar profile={profile} size={28} />
      </View>
    );
  }
  return (
    <View className="max-w-[94%] flex-row items-start gap-2 self-start">
      <AiBadge />
      <View className="shrink rounded-[20px] rounded-tl-md bg-primary-soft px-4 py-1">
        <Markdown style={chatMarkdownStyles}>{content}</Markdown>
      </View>
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
    <View className="max-w-[94%] flex-row items-start gap-2 self-start" accessibilityRole="progressbar" accessibilityLabel={tx('Writing an answer')}>
      <AiBadge />
      <Animated.View className="w-60 gap-2 rounded-[20px] rounded-tl-md bg-primary-soft px-4 py-3.5" style={pulse}>
        <View className="h-3 w-full rounded-full bg-white/80" />
        <View className="h-3 w-11/12 rounded-full bg-white/80" />
        <View className="h-3 w-3/5 rounded-full bg-white/80" />
      </Animated.View>
    </View>
  );
}
