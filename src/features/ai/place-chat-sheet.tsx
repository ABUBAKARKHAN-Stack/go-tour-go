import { ArrowUp, X } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { FlatList, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Chip } from '@/components/form';
import { Sheet } from '@/components/sheet';
import { InlineError } from '@/components/states';
import { Text, TextInput } from '@/components/text';
import { ChatBubble, ReplySkeleton } from '@/features/ai/chat-bubbles';
import { useChat, useChatContext, type ChatMessage } from '@/features/ai/use-chat';
import { tx } from '@/lib/i18n';
import { brandGradient, colors } from '@/lib/theme';
import { AiQuota } from '@/features/ai/ai-quota';

type Place = { name: string; slug: string; city: string };

/** One-tap questions about the place. Labels are translated; the AI answers in the app language. */
export function placePrompts(p: Place) {
  return [
    { key: 'history', label: tx('History'), prompt: `Tell me the history of ${p.name} in ${p.city} and why it matters.` },
    { key: 'best-time', label: tx('Best time to visit'), prompt: `When is the best time to visit ${p.name}, and how long should I spend there?` },
    { key: 'food', label: tx('Food nearby'), prompt: `What local food should I try near ${p.name}, and where?` },
    { key: 'getting-there', label: tx('Getting there'), prompt: `How do I get to ${p.name} in ${p.city}, and what should I know before I go?` },
    { key: 'photos', label: tx('Photo spots'), prompt: `Where are the best photo spots at ${p.name}, and at what time of day?` },
    { key: 'customs', label: tx('Local customs'), prompt: `What local customs and dress etiquette should I respect at ${p.name}?` },
  ];
}

/**
 * "Chat with GoTourGo AI: <place>" (design guide): a sheet over the
 * destination page. Drag it down (or flick it) to close; the conversation
 * stays while the page is open, so reopening continues it. Opening with a
 * question (`request`) asks it straight away. Answers stream in.
 *
 * Drawn inside the page (inline sheet, not a Modal) so the input follows the
 * keyboard; render it last in the page so it sits on top.
 */
export function PlaceChatSheet({
  place,
  visible,
  request,
  onClose,
}: {
  place: Place;
  visible: boolean;
  /** A question to ask on open; a new `id` asks again. */
  request: { id: number; prompt: string | null };
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const chat = useChat(useChatContext(place.slug), `place:${place.slug}`);
  const [input, setInput] = useState('');
  const list = useRef<FlatList<ChatMessage>>(null);
  const handled = useRef(0);
  const prompts = placePrompts(place);

  // A question chosen on the page is asked when the sheet opens (once per request).
  useEffect(() => {
    if (!visible || !request.prompt || handled.current === request.id) return;
    handled.current = request.id;
    void chat.send(request.prompt);
  }, [visible, request, chat]);

  const busy = chat.status !== 'ready';
  const send = (text: string) => {
    if (!text.trim() || busy) return;
    setInput('');
    void chat.send(text);
  };
  const canSend = Boolean(input.trim()) && !busy;

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      inline
      height="88%"
      padded={false}
      header={
        <View className="flex-row items-start gap-3 px-5 pb-3">
          <Text accessibilityRole="header" className="flex-1 font-display text-[20px] leading-[26px] text-heading">
            {tx('Chat with GoTourGo AI:')} <Text className="font-display text-[20px] leading-[26px] text-sky-strong">{place.name}</Text>
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={tx('Close')}
            hitSlop={8}
            onPress={onClose}
            className="h-10 w-10 items-center justify-center rounded-full bg-primary-soft active:opacity-70"
          >
            <X color={colors.heading} size={18} />
          </Pressable>
        </View>
      }
    >
      <View className="flex-1">
        <View className="h-px bg-border" />
        <FlatList
          ref={list}
          data={chat.messages}
          keyExtractor={(m) => m.id}
          className="flex-1"
          contentContainerClassName="gap-3 px-4 py-4"
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => {
            if (chat.messages.length) list.current?.scrollToEnd({ animated: true });
          }}
          ListHeaderComponent={
            <View className="gap-3 pb-3">
              <ChatBubble
                role="assistant"
                content={tx('Ask me anything about **{0}**: its history, the best time to visit, food nearby or how to get there.', { 0: place.name })}
              />
              <Text className="px-1 text-center text-[11px] text-faint">{tx('AI can make mistakes; verify important details.')}</Text>
            </View>
          }
          renderItem={({ item }) => <ChatBubble role={item.role} content={item.content} />}
          ListFooterComponent={
            chat.status === 'waiting' || chat.error ? (
              <View className="gap-2 pt-3">
                {chat.status === 'waiting' ? <ReplySkeleton /> : null}
                {chat.error ? <InlineError message={chat.error} /> : null}
              </View>
            ) : undefined
          }
        />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" className="max-h-14 grow-0" contentContainerClassName="gap-2 px-4 py-2">
          {prompts.map((p) => (
            <Chip key={p.key} label={p.label} onPress={() => send(p.prompt)} />
          ))}
        </ScrollView>

        <AiQuota compact className="pb-1.5" />
        <View className="mx-4 min-h-[52px] flex-row items-end gap-2 rounded-[26px] border border-border-strong bg-card py-1.5 pe-1.5 ps-4" style={{ marginBottom: insets.bottom + 10 }}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder={tx('Ask anything about {0}...', { 0: place.name })}
            placeholderTextColor={colors.faint}
            multiline
            maxLength={1000}
            className="max-h-28 min-h-10 flex-1 py-2 text-[15px] text-foreground"
            accessibilityLabel={tx('Message')}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={tx('Send')}
            accessibilityState={{ disabled: !canSend }}
            disabled={!canSend}
            onPress={() => send(input)}
            className="h-10 w-10 items-center justify-center rounded-full"
            style={canSend ? { experimental_backgroundImage: brandGradient } : { backgroundColor: colors.muted }}
          >
            <ArrowUp color={canSend ? '#fff' : colors.faint} size={20} />
          </Pressable>
        </View>
      </View>
    </Sheet>
  );
}
