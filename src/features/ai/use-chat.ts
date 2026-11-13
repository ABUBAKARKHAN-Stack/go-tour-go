import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo, useRef, useState } from 'react';

import { askAssistant, type ChatContext, type ChatTurn } from '@/features/ai/api';
import { useDestinationsByDistance } from '@/features/destinations/api';
import { describeWeather, type Weather } from '@/features/weather/api';
import { usePreferences } from '@/lib/preferences';

export type ChatMessage = ChatTurn & { id: string };

/**
 * Small, controlled context for the AI: the chosen AI language, the place in
 * focus, an approximate location label, the 5 nearest places and the weather
 * already in the cache. No extra API calls.
 */
export function useChatContext(destinationSlug?: string): ChatContext {
  const qc = useQueryClient();
  const [prefs] = usePreferences();
  const { sorted, location } = useDestinationsByDistance();
  const nearest = location ? sorted[0] : undefined;

  return useMemo<ChatContext>(() => {
    const weather =
      location && qc.getQueryData<Weather>(['weather', Math.round(location.latitude * 100) / 100, Math.round(location.longitude * 100) / 100]);
    return {
      locale: prefs.locale,
      destinationSlug,
      latitude: location?.latitude,
      longitude: location?.longitude,
      locationLabel: nearest && nearest.distance != null && nearest.distance < 30_000 ? `Near ${nearest.name}, ${nearest.city}` : undefined,
      weather: weather ? `${describeWeather(weather.code)}, ${Math.round(weather.temperature)}°C` : undefined,
      nearby: location ? sorted.slice(0, 5).map((d) => ({ name: d.name, category: d.category, distanceKm: (d.distance ?? 0) / 1000 })) : undefined,
    };
  }, [prefs.locale, destinationSlug, location, nearest, sorted, qc]);
}

/**
 * One conversation with the AI travel guide (the last 12 turns are sent).
 * States: ready -> waiting for a reply -> ready (or error). Each conversation
 * has a number; "New chat" starts a new one, so a reply still on its way for
 * the old conversation is dropped instead of appearing in the new one.
 */
export function useChat(context: ChatContext) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const conversation = useRef(0);
  // Set at once (state updates only show on the next render), so a quick double tap sends once.
  const waiting = useRef(false);

  const send = useCallback(
    async (text: string) => {
      const content = text.trim();
      if (!content || waiting.current) return false;
      const id = conversation.current;
      const next: ChatMessage[] = [...messages, { id: `${Date.now()}`, role: 'user', content }];
      waiting.current = true;
      setMessages(next);
      setError(null);
      setLoading(true);
      try {
        const reply = await askAssistant(next.map(({ role, content: c }) => ({ role, content: c })), context);
        if (id !== conversation.current) return true;
        setMessages((m) => [...m, { id: `${Date.now()}-a`, role: 'assistant', content: reply }]);
      } catch (e) {
        if (id !== conversation.current) return true;
        setError(e instanceof Error ? e.message : 'AI service unavailable.');
      } finally {
        if (id === conversation.current) {
          waiting.current = false;
          setLoading(false);
        }
      }
      return true;
    },
    [messages, context],
  );

  const reset = useCallback(() => {
    conversation.current += 1;
    waiting.current = false;
    setMessages([]);
    setError(null);
    setLoading(false);
  }, []);

  return { messages, loading, error, send, reset };
}
