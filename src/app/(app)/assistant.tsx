import { useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { Landmark, RotateCcw, Send, ShoppingBag, Sparkles, UtensilsCrossed, type LucideIcon } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, ScrollView, View } from 'react-native';
import { Text, TextInput } from '@/components/text';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import Markdown from 'react-native-markdown-display';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/screen';
import { IconButton } from '@/components/app-button';
import { Chip } from '@/components/form';
import { InlineError } from '@/components/states';
import { askAssistant, type ChatContext, type ChatTurn } from '@/features/ai/api';
import { useDestinationsByDistance } from '@/features/destinations/api';
import { describeWeather, type Weather } from '@/features/weather/api';
import { usePreferences } from '@/lib/preferences';
import { colors } from '@/lib/theme';
import { tx } from '@/lib/i18n';

type Msg = ChatTurn & { id: string };

/**
 * One-tap guides from the client brief (3.2 culture, 3.3 shopping and
 * souvenirs, 3.4 food). Each asks the AI about the place in focus or the
 * traveller's area; the answer comes in the chosen AI language.
 */
const GUIDES: { key: string; label: string; icon: LucideIcon; prompt: (area: string) => string }[] = [
  {
    key: 'culture',
    label: tx('Culture & etiquette'),
    icon: Landmark,
    prompt: (area) =>
      `Be my cultural guide for ${area}: local culture and traditions, traditional clothing, what to wear, etiquette and customs visitors should respect, and any local practices I should understand.`,
  },
  {
    key: 'shopping',
    label: tx('Shopping & souvenirs'),
    icon: ShoppingBag,
    prompt: (area) =>
      `Be my shopping guide for ${area}: famous local products and specialities, traditional items and souvenirs worth buying, where to buy them, rough prices and how to bargain politely.`,
  },
  {
    key: 'food',
    label: tx('Food guide'),
    icon: UtensilsCrossed,
    prompt: (area) =>
      `Be my food guide for ${area}: the famous foods and traditional dishes, what each one is, famous food streets and restaurants to try, and what this area is best known for.`,
  },
];

const markdownStyles = {
  body: { color: colors.foreground, fontSize: 15, lineHeight: 22 },
  bullet_list: { marginVertical: 4 },
  strong: { fontWeight: '700' as const, color: colors.foreground },
  link: { color: colors.accent },
  code_inline: { backgroundColor: colors.muted, color: colors.accent },
};

export default function AssistantScreen() {
  const params = useLocalSearchParams<{ destination?: string; q?: string }>();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const [prefs] = usePreferences();
  const { sorted, location } = useDestinationsByDistance();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState(params.q ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const list = useRef<FlatList<Msg>>(null);

  const focused = params.destination ? sorted.find((d) => d.slug === params.destination) : undefined;
  const nearest = location ? sorted[0] : undefined;

  /** Small, controlled context: location label, 5 nearest places, weather from cache. No extra API calls. */
  const context = useMemo<ChatContext>(() => {
    const weather =
      location &&
      qc.getQueryData<Weather>(['weather', Math.round(location.latitude * 100) / 100, Math.round(location.longitude * 100) / 100]);
    return {
      locale: prefs.aiLanguage,
      destinationSlug: params.destination,
      latitude: location?.latitude,
      longitude: location?.longitude,
      locationLabel: nearest && nearest.distance != null && nearest.distance < 30_000 ? `Near ${nearest.name}, ${nearest.city}` : undefined,
      weather: weather ? `${describeWeather(weather.code)}, ${Math.round(weather.temperature)}°C` : undefined,
      nearby: location
        ? sorted.slice(0, 5).map((d) => ({ name: d.name, category: d.category, distanceKm: (d.distance ?? 0) / 1000 }))
        : undefined,
    };
  }, [prefs.aiLanguage, params.destination, location, nearest, sorted, qc]);

  const area = focused ? `${focused.name}, ${focused.city}` : nearest?.city ?? context.locationLabel ?? 'Pakistan';

  const suggestions = useMemo(() => {
    const place = focused?.name ?? nearest?.name ?? 'Badshahi Mosque';
    return [
      `What should I see near ${place}?`,
      `Tell me the history of ${place}`,
      'What local food should I try here?',
      'What should I wear when visiting a mosque?',
      'Is it a good day to travel to Murree?',
    ];
  }, [focused, nearest]);

  const send = useCallback(
    async (text: string) => {
      const content = text.trim();
      if (!content || loading) return;
      const next: Msg[] = [...messages, { id: `${Date.now()}`, role: 'user', content }];
      setMessages(next);
      setInput('');
      setError(null);
      setLoading(true);
      try {
        const reply = await askAssistant(next.map(({ role, content: c }) => ({ role, content: c })), context);
        setMessages((m) => [...m, { id: `${Date.now()}-a`, role: 'assistant', content: reply }]);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'AI service unavailable.');
      } finally {
        setLoading(false);
      }
    },
    [messages, loading, context],
  );

  useEffect(() => {
    if (messages.length) setTimeout(() => list.current?.scrollToEnd({ animated: true }), 50);
  }, [messages.length, loading]);

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <AppHeader
        back
        title={tx('AI travel guide')}
        subtitle={focused ? tx('About {0}', { 0: focused.name }) : context.locationLabel ?? tx('Powered by Gemini')}
        right={messages.length ? <IconButton icon={RotateCcw} label={tx('New chat')} onPress={() => setMessages([])} /> : undefined}
      />
      <KeyboardAvoidingView behavior="padding" className="flex-1" keyboardVerticalOffset={0}>
        <FlatList
          ref={list}
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerClassName="gap-3 px-4 pb-4"
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <View className="gap-4 pt-6">
              <View className="items-center gap-2">
                <View className="h-14 w-14 items-center justify-center rounded-full bg-secondary">
                  <Sparkles color={colors.primary} size={26} />
                </View>
                <Text className="text-center text-base font-semibold text-foreground">{tx('Ask about places, culture, food or travel tips')}</Text>
                <Text className="text-center text-xs text-muted-foreground">
                  {tx('Answers use your approximate location and GoTourGo destination data. AI can make mistakes; verify important details.')}
                </Text>
              </View>
              <View className="flex-row gap-2">
                {GUIDES.map((g) => (
                  <Pressable
                    key={g.key}
                    accessibilityRole="button"
                    accessibilityLabel={tx('{0} for {1}', { 0: g.label, 1: area })}
                    onPress={() => send(g.prompt(area))}
                    className="flex-1 items-center gap-2 rounded-2xl border border-border bg-card px-2 py-3 active:bg-muted"
                  >
                    <View className="h-10 w-10 items-center justify-center rounded-full bg-primary-soft">
                      <g.icon color={colors.primary} size={19} />
                    </View>
                    <Text numberOfLines={2} className="text-center text-xs font-semibold text-foreground">
                      {g.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <Text className="text-center text-xs text-faint">{tx('Guides for {0}', { 0: area })}</Text>
              <View className="gap-2">
                {suggestions.map((s) => (
                  <Pressable key={s} onPress={() => send(s)} className="min-h-11 justify-center rounded-2xl border border-border bg-card px-4 py-2">
                    <Text className="text-sm text-foreground">{s}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          }
          renderItem={({ item }) =>
            item.role === 'user' ? (
              <View className="max-w-[85%] self-end rounded-3xl rounded-br-md bg-primary px-4 py-3">
                <Text className="text-[15px] text-primary-foreground">{item.content}</Text>
              </View>
            ) : (
              <View className="max-w-[92%] self-start rounded-3xl rounded-bl-md bg-card px-4 py-2">
                <Markdown style={markdownStyles}>{item.content}</Markdown>
              </View>
            )
          }
          ListFooterComponent={
            <View className="gap-2 pt-2">
              {loading ? (
                <View className="flex-row items-center gap-2 self-start rounded-3xl bg-card px-4 py-3">
                  <ActivityIndicator color={colors.primary} size="small" />
                  <Text className="text-sm text-muted-foreground">{tx('Thinking...')}</Text>
                </View>
              ) : null}
              {error ? <InlineError message={error} /> : null}
            </View>
          }
        />
        {messages.length ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" className="max-h-12 grow-0" contentContainerClassName="gap-2 px-3 py-1.5">
            {GUIDES.map((g) => (
              <Chip key={g.key} label={g.label} icon={<g.icon size={14} color={colors.foreground} />} onPress={() => (loading ? undefined : send(g.prompt(area)))} />
            ))}
          </ScrollView>
        ) : null}
        <View className="flex-row items-end gap-2 border-t border-border px-3 pt-2" style={{ paddingBottom: insets.bottom + 8 }}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder={tx('Ask your travel question...')}
            placeholderTextColor={`${colors.mutedForeground}99`}
            multiline
            maxLength={1000}
            className="max-h-32 min-h-12 flex-1 rounded-3xl bg-input px-4 py-3 text-base text-foreground"
            accessibilityLabel={tx('Message')}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={tx('Send')}
            disabled={!input.trim() || loading}
            onPress={() => send(input)}
            className={`h-12 w-12 items-center justify-center rounded-full ${input.trim() && !loading ? 'bg-accent' : 'bg-muted'}`}
          >
            <Send color={input.trim() && !loading ? colors.accentForeground : colors.mutedForeground} size={20} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
