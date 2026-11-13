import { useLocalSearchParams, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  Camera,
  ChevronRight,
  Landmark,
  Mountain,
  History,
  MessageSquare,
  ScrollText,
  Send,
  SquarePen,
  Trash2,
  ShoppingBag,
  UtensilsCrossed,
  type LucideIcon,
} from 'lucide-react-native';
import { useRef, useState } from 'react';
import { Alert, FlatList, Pressable, View } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton, IconButton } from '@/components/app-button';
import { Sheet } from '@/components/sheet';
import { AppHeader } from '@/components/screen';
import { InlineError } from '@/components/states';
import { Text, TextInput } from '@/components/text';
import { AiQuota } from '@/features/ai/ai-quota';
import { AiBadge, ChatBubble, ReplySkeleton } from '@/features/ai/chat-bubbles';
import type { Conversation } from '@/features/ai/conversations';
import { useChat, useChatContext, type ChatMessage } from '@/features/ai/use-chat';
import { timeAgo } from '@/features/safety/friend-locations';
import { useAuth } from '@/features/auth/auth-provider';
import { useDestinationsByDistance } from '@/features/destinations/api';
import { flipX, tx } from '@/lib/i18n';
import { brandGradient, cardShadow, colors, shadow } from '@/lib/theme';

/**
 * Guides the AI can give for the place in focus or the traveller's area
 * (client brief 3.2 culture, 3.3 shopping, 3.4 food). Visual Lens is the
 * camera button next to the input.
 */
const GUIDES: { key: string; label: string; icon: LucideIcon; prompt: (area: string) => string }[] = [
  {
    key: 'explore',
    label: tx('Places to visit'),
    icon: Mountain,
    prompt: (area) => `What are the best places to visit in and around ${area}, including a few hidden gems? Keep it to the highlights.`,
  },
  {
    key: 'food',
    label: tx('Food to try'),
    icon: UtensilsCrossed,
    prompt: (area) =>
      `Be my food guide for ${area}: the famous foods and traditional dishes, what each one is, famous food streets and restaurants to try, and what this area is best known for.`,
  },
  {
    key: 'shopping',
    label: tx('What to buy'),
    icon: ShoppingBag,
    prompt: (area) =>
      `Be my shopping guide for ${area}: famous local products and specialities, traditional items and souvenirs worth buying, where to buy them, rough prices and how to bargain politely.`,
  },
  {
    key: 'culture',
    label: tx('Culture and etiquette'),
    icon: Landmark,
    prompt: (area) =>
      `Be my cultural guide for ${area}: local culture and traditions, traditional clothing, what to wear, etiquette and customs visitors should respect, and any local practices I should understand.`,
  },
  {
    key: 'history',
    label: tx('History'),
    icon: ScrollText,
    prompt: (area) => `What are the most important historical places in and around ${area}, and what is the story behind each?`,
  },
];

/**
 * AI travel guide: a plain header, the conversation, and the input above the
 * keyboard. Before the first question, a short greeting and a few guides to
 * start from. Answers stream in word by word; until the first words arrive,
 * a skeleton of the reply shows where it will appear.
 */
export default function AssistantScreen() {
  const params = useLocalSearchParams<{ destination?: string; q?: string }>();
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const { sorted, location } = useDestinationsByDistance();
  // The place the conversation is about (from a destination page, or an older conversation reopened).
  const [place, setPlace] = useState<string | null>(params.destination ?? null);
  const focused = place ? sorted.find((d) => d.slug === place) : undefined;
  const context = useChatContext(place ?? undefined);
  const chat = useChat(context, { place, placeName: focused?.name ?? null, resume: Boolean(params.destination) });
  const { messages, status, error } = chat;
  const [input, setInput] = useState(params.q ?? '');
  const [historyOpen, setHistoryOpen] = useState(false);
  const list = useRef<FlatList<ChatMessage>>(null);

  const openConversation = (c: Conversation) => {
    setHistoryOpen(false);
    setPlace(c.place);
    chat.open(c.id);
  };
  const startNew = () => {
    setHistoryOpen(false);
    chat.newChat();
  };

  const nearest = location ? sorted[0] : undefined;
  const area = focused ? `${focused.name}, ${focused.city}` : nearest?.city ?? context.locationLabel ?? 'Pakistan';
  const firstName = profile?.full_name?.split(' ')[0];
  const chatting = messages.length > 0;
  const busy = status !== 'ready';
  const canSend = Boolean(input.trim()) && !busy;

  const send = (text: string) => {
    if (!text.trim() || busy) return;
    setInput('');
    void chat.send(text);
  };

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <StatusBar style="dark" />
      <AppHeader
        back
        title={chat.conversation?.title ?? tx('AI travel guide')}
        subtitle={focused ? tx('About {0}', { 0: focused.name }) : (context.locationLabel ?? tx('Powered by Gemini'))}
        right={
          <View className="flex-row gap-1.5">
            {chat.history.length ? <IconButton icon={History} label={tx('Chat history')} onPress={() => setHistoryOpen(true)} /> : null}
            {chatting ? <IconButton icon={SquarePen} label={tx('New chat')} onPress={startNew} /> : null}
          </View>
        }
      />
      <KeyboardAvoidingView behavior="padding" className="flex-1">
        <FlatList
          ref={list}
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerClassName="grow gap-5 px-4 pb-4 pt-2"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          // Follow the answer as it is written.
          onContentSizeChange={() => {
            if (chatting) list.current?.scrollToEnd({ animated: true });
          }}
          ListEmptyComponent={
            <View className="gap-6 pt-4">
              <View className="items-center gap-2 px-4">
                <AiBadge size={56} />
                <Text accessibilityRole="header" className="text-center font-display text-[24px] leading-[30px] text-heading">
                  {firstName ? tx('Hello, {0}!', { 0: firstName }) : tx('Hello there!')}
                </Text>
                <Text className="text-center text-[15px] leading-[22px] text-muted-foreground">
                  {tx('Ask me about places, food, culture or routes. Guides below are for {0}.', { 0: area })}
                </Text>
              </View>
              {chat.history.length ? (
                <View className="gap-2">
                  <View className="flex-row items-center px-1">
                    <Text className="flex-1 text-xs font-semibold uppercase tracking-[1.2px] text-faint">{tx('Recent chats')}</Text>
                    {chat.history.length > 3 ? (
                      <Pressable accessibilityRole="button" hitSlop={8} onPress={() => setHistoryOpen(true)}>
                        <Text className="text-[13px] font-semibold text-accent">{tx('See all')}</Text>
                      </Pressable>
                    ) : null}
                  </View>
                  <View className="overflow-hidden rounded-[20px] bg-card" style={cardShadow}>
                    {chat.history.slice(0, 3).map((c, i) => (
                      <ConversationRow key={c.id} conversation={c} first={i === 0} onPress={() => openConversation(c)} />
                    ))}
                  </View>
                </View>
              ) : null}
              <View className="overflow-hidden rounded-[20px] bg-card" style={cardShadow}>
                {GUIDES.map((g, i) => (
                  <Pressable
                    key={g.key}
                    accessibilityRole="button"
                    onPress={() => send(g.prompt(area))}
                    className={`min-h-14 flex-row items-center gap-3 px-4 py-3 active:bg-muted ${i > 0 ? 'border-t border-border' : ''}`}
                  >
                    <View className="h-9 w-9 items-center justify-center rounded-full bg-primary-soft">
                      <g.icon color={colors.primary} size={18} />
                    </View>
                    <Text className="flex-1 text-[15px] font-semibold text-heading">{g.label}</Text>
                    <ChevronRight color={colors.faint} size={18} style={flipX} />
                  </Pressable>
                ))}
              </View>
              <Text className="px-4 text-center text-xs text-faint">{tx('AI can make mistakes; verify important details.')}</Text>
            </View>
          }
          renderItem={({ item }) => <ChatBubble role={item.role} content={item.content} />}
          ListFooterComponent={
            status === 'waiting' || error ? (
              <View className="gap-2">
                {status === 'waiting' ? <ReplySkeleton /> : null}
                {error ? <InlineError message={error} /> : null}
              </View>
            ) : undefined
          }
        />

        <View className="gap-1.5 bg-background px-4 pt-2" style={{ paddingBottom: insets.bottom + 10, boxShadow: shadow(0.06, -4, 14) }}>
          <AiQuota compact />
          <View className="flex-row items-end gap-2">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={tx('Visual Lens')}
              onPress={() => router.push('/lens')}
              className="h-12 w-12 items-center justify-center rounded-full bg-primary-soft active:opacity-70"
            >
              <Camera color={colors.primary} size={21} />
            </Pressable>
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder={tx('Type your travel question...')}
              placeholderTextColor={colors.faint}
              multiline
              maxLength={1000}
              className="max-h-32 min-h-12 flex-1 rounded-[24px] border border-border-strong bg-card px-4 py-3 text-[15px] text-foreground"
              accessibilityLabel={tx('Message')}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={tx('Send')}
              accessibilityState={{ disabled: !canSend }}
              disabled={!canSend}
              onPress={() => send(input)}
              className="h-12 w-12 items-center justify-center rounded-full"
              style={canSend ? { experimental_backgroundImage: brandGradient, boxShadow: shadow(0.22, 4, 10) } : { backgroundColor: colors.muted }}
            >
              <Send color={canSend ? '#fff' : colors.faint} size={20} style={flipX} />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>

      <Sheet
        visible={historyOpen}
        onClose={() => setHistoryOpen(false)}
        height="80%"
        padded={false}
        header={
          <View className="flex-row items-center gap-3 px-5 pb-3">
            <Text accessibilityRole="header" className="flex-1 font-display text-[22px] leading-7 text-heading">
              {tx('Chat history')}
            </Text>
            <AppButton label={tx('New chat')} icon={SquarePen} size="sm" variant="secondary" onPress={startNew} />
          </View>
        }
      >
        <FlatList
          data={chat.history}
          keyExtractor={(c) => c.id}
          contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}
          renderItem={({ item, index }) => {
            const today = isToday(item.updatedAt);
            const heading = index === 0 || isToday(chat.history[index - 1].updatedAt) !== today ? (today ? tx('Today') : tx('Earlier')) : null;
            return (
              <View>
                {heading ? <Text className="px-5 pb-1.5 pt-3 text-xs font-semibold uppercase tracking-[1.2px] text-faint">{heading}</Text> : null}
                <ConversationRow
                  conversation={item}
                  current={item.id === chat.conversationId}
                  onPress={() => openConversation(item)}
                  onDelete={() =>
                    Alert.alert(tx('Delete this chat?'), item.title, [
                      { text: tx('Cancel'), style: 'cancel' },
                      { text: tx('Delete'), style: 'destructive', onPress: () => chat.remove(item.id) },
                    ])
                  }
                />
              </View>
            );
          }}
        />
      </Sheet>
    </View>
  );
}

function isToday(at: number) {
  return new Date(at).toDateString() === new Date().toDateString();
}

/** A saved conversation: its title, what it is about, and when. */
function ConversationRow({
  conversation: c,
  onPress,
  onDelete,
  current,
  first = true,
}: {
  conversation: Conversation;
  onPress: () => void;
  onDelete?: () => void;
  current?: boolean;
  first?: boolean;
}) {
  const when = timeAgo(new Date(c.updatedAt).toISOString());
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: current }}
      onPress={onPress}
      onLongPress={onDelete}
      className={`min-h-14 flex-row items-center gap-3 px-4 py-2.5 active:bg-muted ${current ? 'bg-primary-soft' : ''} ${first ? '' : 'border-t border-border'}`}
    >
      <MessageSquare color={colors.primary} size={18} />
      <View className="flex-1 gap-0.5">
        <Text numberOfLines={2} className="text-[15px] font-medium text-heading">
          {c.title}
        </Text>
        <Text numberOfLines={1} className="text-xs text-muted-foreground">
          {c.placeName ? `${tx('About {0}', { 0: c.placeName })} · ${when}` : when}
        </Text>
      </View>
      {onDelete ? <IconButton icon={Trash2} label={tx('Delete')} onPress={onDelete} /> : null}
    </Pressable>
  );
}
