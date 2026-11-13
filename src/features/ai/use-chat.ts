import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { AiAborted, streamAssistant, type ChatContext, type ChatTurn } from '@/features/ai/api';
import { useAuth } from '@/features/auth/auth-provider';
import { storage } from '@/lib/storage';
import { useDestinationsByDistance } from '@/features/destinations/api';
import { describeWeather, type Weather } from '@/features/weather/api';
import { usePreferences } from '@/lib/preferences';

export type ChatMessage = ChatTurn & { id: string };

/**
 * Small, controlled context for the AI: the app language, the place in
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

/** Messages kept per conversation on the phone. */
const KEEP_MESSAGES = 40;

/** Where a conversation is saved: per account and per thread ("guide", "place:<slug>"). */
function chatKey(userId: string, thread: string) {
  return `gtg.ai.chat.${userId}.${thread}`;
}

/**
 * One conversation with the AI travel guide (the last 12 turns are sent).
 * States: ready -> waiting (asked, no words yet) -> streaming (the answer is
 * being written into the last message) -> ready, or error. "New chat" aborts
 * the answer in progress and starts an empty conversation.
 *
 * The conversation is saved on the phone (per account and `thread`), so
 * leaving the screen or closing the app keeps it; it is saved when a
 * question is asked and when an answer is complete, not on every word.
 */
export type ChatStatus = 'ready' | 'waiting' | 'streaming';

export function useChat(context: ChatContext, thread: string) {
  const { userId } = useAuth();
  const key = userId ? chatKey(userId, thread) : null;
  const [messages, setMessages] = useState<ChatMessage[]>(() => (key ? storage.get<ChatMessage[]>(key, []) : []));
  const [loadedKey, setLoadedKey] = useState(key);
  // Another account or thread: show its own saved conversation.
  if (key !== loadedKey) {
    setLoadedKey(key);
    setMessages(key ? storage.get<ChatMessage[]>(key, []) : []);
  }
  const save = useCallback(
    (list: ChatMessage[]) => {
      if (key) storage.set(key, list.slice(-KEEP_MESSAGES));
    },
    [key],
  );
  const [status, setStatus] = useState<ChatStatus>('ready');
  const [error, setError] = useState<string | null>(null);
  // The answer in progress; set at once, so a quick double tap sends once.
  const current = useRef<AbortController | null>(null);

  const send = useCallback(
    async (text: string) => {
      const content = text.trim();
      if (!content || current.current) return false;
      const controller = new AbortController();
      current.current = controller;
      const replyId = `${Date.now()}-a`;
      const next: ChatMessage[] = [...messages, { id: `${Date.now()}`, role: 'user', content }];
      setMessages(next);
      save(next);
      setError(null);
      setStatus('waiting');
      let started = false;
      let answer = '';
      try {
        await streamAssistant(
          next.map(({ role, content: c }) => ({ role, content: c })),
          context,
          (piece) => {
            if (controller.signal.aborted) return;
            answer += piece;
            if (!started) {
              started = true;
              setStatus('streaming');
              setMessages((m) => [...m, { id: replyId, role: 'assistant', content: piece }]);
            } else {
              setMessages((m) => m.map((msg) => (msg.id === replyId ? { ...msg, content: msg.content + piece } : msg)));
            }
          },
          controller.signal,
        );
        if (!controller.signal.aborted) save([...next, { id: replyId, role: 'assistant', content: answer }]);
      } catch (e) {
        if (e instanceof AiAborted || controller.signal.aborted) return true;
        setError(e instanceof Error ? e.message : 'AI service unavailable.');
      } finally {
        if (current.current === controller) {
          current.current = null;
          setStatus('ready');
        }
      }
      return true;
    },
    [messages, context, save],
  );

  const reset = useCallback(() => {
    current.current?.abort();
    current.current = null;
    if (key) storage.remove(key);
    setMessages([]);
    setError(null);
    setStatus('ready');
  }, [key]);

  // Leaving the screen stops an answer still being written.
  useEffect(() => () => current.current?.abort(), []);

  return { messages, status, loading: status !== 'ready', error, send, reset };
}
