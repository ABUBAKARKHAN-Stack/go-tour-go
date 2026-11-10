import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  ArrowLeft,
  Camera,
  ChevronRight,
  CloudSun,
  Compass,
  Landmark,
  MapPinned,
  Mountain,
  RotateCcw,
  ScanEye,
  ScrollText,
  Send,
  ShoppingBag,
  Sparkles,
  UtensilsCrossed,
  type LucideIcon,
} from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Pressable, ScrollView, useWindowDimensions, View } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconButton } from '@/components/app-button';
import type { TileTone } from '@/components/brand';
import { Chip } from '@/components/form';
import { AppHeader } from '@/components/screen';
import { InlineError } from '@/components/states';
import { Text, TextInput } from '@/components/text';
import { ChatBubble, ThinkingBubble } from '@/features/ai/chat-bubbles';
import { useChat, useChatContext, type ChatMessage } from '@/features/ai/use-chat';
import { useAuth } from '@/features/auth/auth-provider';
import { HERO_PHOTOS } from '@/features/brand/hero-photos';
import { HandNote, PhotoHeader, photoHeight } from '@/features/brand/mood';
import { useDestinationsByDistance } from '@/features/destinations/api';
import { flipX, tx } from '@/lib/i18n';
import { usePressScale } from '@/lib/motion';
import { brandGradient, colors, shadow } from '@/lib/theme';

/**
 * Quick travel options (design guide). Most ask the AI about the place in
 * focus or the traveller's area (client brief 3.2 culture, 3.3 shopping,
 * 3.4 food); weather and road alerts, routes and Lens open the app's own
 * screens, which have live data the AI doesn't.
 */
type Option = {
  key: string;
  label: string;
  hint: string;
  icon: LucideIcon;
  tone: TileTone;
} & ({ prompt: (area: string) => string } | { href: string });

const OPTIONS: Option[] = [
  {
    key: 'explore',
    label: tx('Explore places'),
    hint: tx('Top spots and hidden gems'),
    icon: Mountain,
    tone: 'ice',
    prompt: (area) => `What are the best places to visit in and around ${area}, including a few hidden gems? Keep it to the highlights.`,
  },
  {
    key: 'food',
    label: tx('Food guide'),
    hint: tx('Local dishes and food streets'),
    icon: UtensilsCrossed,
    tone: 'peach',
    prompt: (area) =>
      `Be my food guide for ${area}: the famous foods and traditional dishes, what each one is, famous food streets and restaurants to try, and what this area is best known for.`,
  },
  {
    key: 'shopping',
    label: tx('Shopping guide'),
    hint: tx('Markets and souvenirs'),
    icon: ShoppingBag,
    tone: 'lemon',
    prompt: (area) =>
      `Be my shopping guide for ${area}: famous local products and specialities, traditional items and souvenirs worth buying, where to buy them, rough prices and how to bargain politely.`,
  },
  {
    key: 'culture',
    label: tx('Cultural guide'),
    hint: tx('Traditions and etiquette'),
    icon: Landmark,
    tone: 'mint',
    prompt: (area) =>
      `Be my cultural guide for ${area}: local culture and traditions, traditional clothing, what to wear, etiquette and customs visitors should respect, and any local practices I should understand.`,
  },
  {
    key: 'history',
    label: tx('Historical places'),
    hint: tx('History and landmarks'),
    icon: ScrollText,
    tone: 'sand',
    prompt: (area) => `What are the most important historical places in and around ${area}, and what is the story behind each?`,
  },
  { key: 'alerts', label: tx('Weather & road alerts'), hint: tx('Live conditions'), icon: CloudSun, tone: 'ice', href: '/alerts' },
  { key: 'routes', label: tx('Routes & directions'), hint: tx('Plan a journey'), icon: MapPinned, tone: 'peach', href: '/search' },
  { key: 'lens', label: tx('Visual Lens'), hint: tx('Know what is in a photo'), icon: ScanEye, tone: 'mint', href: '/lens' },
];

const TONE_BG: Record<TileTone, string> = { ice: 'bg-primary-soft', mint: 'bg-mint', peach: 'bg-peach', lemon: 'bg-lemon', sand: 'bg-sand' };

/**
 * AI travel guide. Before the first question: photo header, greeting, quick
 * options and popular questions (design guide). Once chatting: a compact
 * header, the conversation and the input pinned above the keyboard.
 */
export default function AssistantScreen() {
  const params = useLocalSearchParams<{ destination?: string; q?: string }>();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const { profile } = useAuth();
  const { sorted, location } = useDestinationsByDistance();
  const context = useChatContext(params.destination);
  const chat = useChat(context);
  const { messages, loading, error } = chat;
  const [input, setInput] = useState(params.q ?? '');
  const list = useRef<FlatList<ChatMessage>>(null);

  const focused = params.destination ? sorted.find((d) => d.slug === params.destination) : undefined;
  const nearest = location ? sorted[0] : undefined;
  const area = focused ? `${focused.name}, ${focused.city}` : nearest?.city ?? context.locationLabel ?? 'Pakistan';
  const firstName = profile?.full_name?.split(' ')[0];
  const chatting = messages.length > 0;

  const questions = useMemo(() => {
    const place = focused?.name ?? nearest?.name ?? 'Badshahi Mosque';
    return [
      `What should I see near ${place}?`,
      `Tell me the history of ${place}`,
      'What local food should I try here?',
      'What should I wear when visiting a mosque?',
      'Is it a good day to travel to Murree?',
    ];
  }, [focused, nearest]);

  const send = async (text: string) => {
    if (text.trim() && !loading) setInput('');
    await chat.send(text);
  };
  const pick = (o: Option) => {
    if ('href' in o) router.push(o.href as never);
    else if (!loading) void send(o.prompt(area));
  };
  const canSend = Boolean(input.trim()) && !loading;

  useEffect(() => {
    if (messages.length) setTimeout(() => list.current?.scrollToEnd({ animated: true }), 50);
  }, [messages.length, loading]);

  return (
    <View className="flex-1 bg-background" style={chatting ? { paddingTop: insets.top } : undefined}>
      <StatusBar style="dark" />
      {chatting ? (
        <AppHeader
          back
          title={tx('AI travel guide')}
          subtitle={focused ? tx('About {0}', { 0: focused.name }) : context.locationLabel ?? tx('Powered by Gemini')}
          right={<IconButton icon={RotateCcw} label={tx('New chat')} onPress={chat.reset} />}
        />
      ) : null}
      <KeyboardAvoidingView behavior="padding" className="flex-1" keyboardVerticalOffset={0}>
        <FlatList
          ref={list}
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerClassName={chatting ? 'gap-3 px-4 pb-4 pt-2' : 'pb-4'}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View>
              <PhotoHeader
                kind="auth"
                photo={HERO_PHOTOS.companion}
                width={width}
                height={photoHeight('auth', height)}
                topInset={insets.top}
                leading={<IconButton icon={ArrowLeft} flip label={tx('Go back')} onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} />}
              >
                <HandNote lines={[tx('Your AI travel'), tx('assistant')]} style={{ end: 16, top: insets.top + 70 }} rotate={-7} />
              </PhotoHeader>

              <View className="mx-4 -mt-16 gap-1.5 rounded-[28px] bg-card p-5" style={{ boxShadow: shadow(0.1, 8, 24) }}>
                <Text accessibilityRole="header" className="font-display text-[26px] leading-[32px] text-heading">
                  {firstName ? tx('Hello, {0}!', { 0: firstName }) : tx('Hello there!')}
                </Text>
                <Text className="text-base font-semibold text-heading">{tx("I'm your AI travel assistant.")}</Text>
                <Text className="text-sm leading-5 text-muted-foreground">{tx('Ask me anything about your trip, from places and food to routes, weather and culture.')}</Text>
              </View>

              <View className="gap-3 px-4 pt-6">
                <View className="flex-row items-start gap-2.5">
                  <Compass color={colors.primary} size={24} style={{ marginTop: 2 }} />
                  <View className="flex-1">
                    <Text className="font-display text-xl text-heading">{tx('Quick travel options')}</Text>
                    <Text className="text-[13px] text-muted-foreground">{tx('Tap an option or type your question. Guides are for {0}.', { 0: area })}</Text>
                  </View>
                </View>
                <View className="flex-row flex-wrap justify-between gap-y-3">
                  {OPTIONS.map((o) => (
                    <OptionCard key={o.key} option={o} onPress={() => pick(o)} />
                  ))}
                </View>
              </View>

              <View className="gap-3 pt-6">
                <View className="flex-row items-center gap-2 px-4">
                  <Sparkles color={colors.primary} size={20} />
                  <Text className="font-display text-xl text-heading">{tx('Popular questions')}</Text>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerClassName="gap-2 px-4">
                  {questions.map((q) => (
                    <Chip key={q} label={q} onPress={() => send(q)} />
                  ))}
                </ScrollView>
                <Text className="px-4 text-center text-xs text-faint">
                  {tx('Answers use your approximate location and GoTourGo destination data. AI can make mistakes; verify important details.')}
                </Text>
              </View>
            </View>
          }
          renderItem={({ item }) => <ChatBubble role={item.role} content={item.content} />}
          ListFooterComponent={
            <View className={`gap-2 pt-2 ${chatting ? '' : 'px-4'}`}>
              {loading ? <ThinkingBubble /> : null}
              {error ? <InlineError message={error} /> : null}
            </View>
          }
        />

        {chatting ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" className="max-h-14 grow-0" contentContainerClassName="gap-2 px-4 py-2">
            {OPTIONS.filter((o) => 'prompt' in o).map((o) => (
              <Chip key={o.key} label={o.label} icon={<o.icon size={15} color={colors.primary} />} onPress={() => pick(o)} />
            ))}
          </ScrollView>
        ) : null}

        <View className="flex-row items-end gap-2 bg-background px-4 pt-2" style={{ paddingBottom: insets.bottom + 10, boxShadow: shadow(0.06, -4, 14) }}>
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
      </KeyboardAvoidingView>
    </View>
  );
}

/** A quick option (design guide): tinted card with a white icon disc, then the title and a short hint. */
function OptionCard({ option: o, onPress }: { option: Option; onPress: () => void }) {
  const press = usePressScale();
  return (
    <Animated.View style={[press.style, { width: '48.5%' }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${o.label}. ${o.hint}`}
        onPress={onPress}
        {...press.handlers}
        className={`min-h-[116px] gap-2 rounded-[20px] p-3.5 ${TONE_BG[o.tone]}`}
      >
        <View className="h-10 w-10 items-center justify-center rounded-full bg-white">
          <o.icon color={colors.primary} size={20} />
        </View>
        <View className="flex-row items-end gap-1">
          <View className="flex-1 gap-0.5">
            <Text numberOfLines={2} className="text-sm font-semibold leading-[18px] text-heading">
              {o.label}
            </Text>
            <Text numberOfLines={2} className="text-xs leading-4 text-muted-foreground">
              {o.hint}
            </Text>
          </View>
          <ChevronRight color={colors.primary} size={16} style={flipX} />
        </View>
      </Pressable>
    </Animated.View>
  );
}
