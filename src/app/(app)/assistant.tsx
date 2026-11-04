import { useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { RotateCcw, Send, Sparkles } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, TextInput, View } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import Markdown from 'react-native-markdown-display';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/screen';
import { IconButton } from '@/components/app-button';
import { InlineError } from '@/components/states';
import { askAssistant, type ChatContext, type ChatTurn } from '@/features/ai/api';
import { useDestinationsByDistance } from '@/features/destinations/api';
import { describeWeather, type Weather } from '@/features/weather/api';
import { usePreferences } from '@/lib/preferences';
import { colors } from '@/lib/theme';

type Msg = ChatTurn & { id: string };

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
      locale: prefs.locale,
      destinationSlug: params.destination,
      latitude: location?.latitude,
      longitude: location?.longitude,
      locationLabel: nearest && nearest.distance != null && nearest.distance < 30_000 ? `Near ${nearest.name}, ${nearest.city}` : undefined,
      weather: weather ? `${describeWeather(weather.code)}, ${Math.round(weather.temperature)}°C` : undefined,
      nearby: location
        ? sorted.slice(0, 5).map((d) => ({ name: d.name, category: d.category, distanceKm: (d.distance ?? 0) / 1000 }))
        : undefined,
    };
  }, [prefs.locale, params.destination, location, nearest, sorted, qc]);

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
        title="AI travel guide"
        subtitle={focused ? `About ${focused.name}` : context.locationLabel ?? 'Powered by Gemini'}
        right={messages.length ? <IconButton icon={RotateCcw} label="New chat" onPress={() => setMessages([])} /> : undefined}
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
                  <Sparkles color={colors.accent} size={26} />
                </View>
                <Text className="text-center text-base font-semibold text-foreground">Ask about places, culture, food or travel tips</Text>
                <Text className="text-center text-xs text-muted-foreground">
                  Answers use your approximate location and GoTourGo destination data. AI can make mistakes; verify important details.
                </Text>
              </View>
              <View className="gap-2">
                {suggestions.map((s) => (
                  <Pressable key={s} onPress={() => send(s)} className="min-h-11 justify-center rounded-2xl border border-border/30 bg-card px-4 py-2">
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
                  <ActivityIndicator color={colors.accent} size="small" />
                  <Text className="text-sm text-muted-foreground">Thinking...</Text>
                </View>
              ) : null}
              {error ? <InlineError message={error} /> : null}
            </View>
          }
        />
        <View className="flex-row items-end gap-2 border-t border-border/20 px-3 pt-2" style={{ paddingBottom: insets.bottom + 8 }}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Ask your travel question..."
            placeholderTextColor={`${colors.mutedForeground}99`}
            multiline
            maxLength={1000}
            className="max-h-32 min-h-12 flex-1 rounded-3xl bg-input px-4 py-3 text-base text-foreground"
            accessibilityLabel="Message"
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Send"
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
