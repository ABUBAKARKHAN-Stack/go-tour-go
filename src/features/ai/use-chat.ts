import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';

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
      locale: prefs.aiLanguage,
      destinationSlug,
      latitude: location?.latitude,
      longitude: location?.longitude,
      locationLabel: nearest && nearest.distance != null && nearest.distance < 30_000 ? `Near ${nearest.name}, ${nearest.city}` : undefined,
      weather: weather ? `${describeWeather(weather.code)}, ${Math.round(weather.temperature)}°C` : undefined,
      nearby: location ? sorted.slice(0, 5).map((d) => ({ name: d.name, category: d.category, distanceKm: (d.distance ?? 0) / 1000 })) : undefined,
    };
  }, [prefs.aiLanguage, destinationSlug, location, nearest, sorted, qc]);
}

/** One conversation with the AI travel guide (the last 12 turns are sent). */
export function useChat(context: ChatContext) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = useCallback(
    async (text: string) => {
      const content = text.trim();
      if (!content || loading) return false;
      const next: ChatMessage[] = [...messages, { id: `${Date.now()}`, role: 'user', content }];
      setMessages(next);
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
      return true;
    },
    [messages, loading, context],
  );

  const reset = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return { messages, loading, error, send, reset };
}
