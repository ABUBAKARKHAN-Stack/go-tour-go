import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { AiAborted, streamAssistant, type ChatContext } from '@/features/ai/api';
import { conversations, useConversations, type ChatMessage } from '@/features/ai/conversations';
import { useAuth } from '@/features/auth/auth-provider';
import { useDestinationsByDistance } from '@/features/destinations/api';
import { describeWeather, type Weather } from '@/features/weather/api';
import { usePreferences } from '@/lib/preferences';

export type { ChatMessage } from '@/features/ai/conversations';

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

/**
 * The AI conversation on screen, saved in the conversation history (see
 * conversations.ts). States: ready -> waiting (asked, no words yet) ->
 * streaming (the answer is being written into the last message) -> ready,
 * or error. It is saved when a question is asked and when an answer is
 * complete, not on every word.
 *
 * `place`: the destination new conversations are about (null for the general
 * guide). With `resume`, it opens the latest conversation about that place.
 */
export type ChatStatus = 'ready' | 'waiting' | 'streaming';

export function useChat(context: ChatContext, opts: { place: string | null; placeName?: string | null; resume?: boolean }) {
  const { userId } = useAuth();
  const place = opts.place;
  const placeName = opts.placeName ?? null;
  const history = useConversations(userId);
  const startId = () => (userId && opts.resume && place ? (conversations.latestFor(userId, place)?.id ?? null) : null);
  const [conversationId, setConversationId] = useState<string | null>(startId);
  const [messages, setMessages] = useState<ChatMessage[]>(() => (userId && conversationId ? (conversations.get(userId, conversationId)?.messages ?? []) : []));
  const [status, setStatus] = useState<ChatStatus>('ready');
  const [error, setError] = useState<string | null>(null);
  // The answer in progress; set at once, so a quick double tap sends once.
  const current = useRef<AbortController | null>(null);
  // The conversation an answer belongs to (it can change while one streams).
  const conversationRef = useRef<string | null>(conversationId);

  const show = useCallback(
    (id: string | null) => {
      current.current?.abort();
      current.current = null;
      conversationRef.current = id;
      setConversationId(id);
      setMessages(id && userId ? (conversations.get(userId, id)?.messages ?? []) : []);
      setError(null);
      setStatus('ready');
    },
    [userId],
  );

  // A chat saved by the previous version becomes a conversation, once; open it if this screen resumes.
  useEffect(() => {
    if (!userId) return;
    conversations.migrate(userId, place ? `place:${place}` : 'guide', place, placeName);
    if (opts.resume && place && !conversationRef.current) {
      const latest = conversations.latestFor(userId, place);
      // After this render: the migrated chat opens like any saved one.
      if (latest) setTimeout(() => show(latest.id), 0);
    }
    // Once per account and place.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, place]);

  const save = useCallback(
    (list: ChatMessage[]) => {
      if (!userId) return;
      const id = conversations.save(userId, conversationRef.current, list, place, placeName);
      if (id !== conversationRef.current) {
        conversationRef.current = id;
        setConversationId(id);
      }
    },
    [userId, place, placeName],
  );

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

  /** A blank conversation (the current one stays in the history). */
  const newChat = useCallback(() => show(null), [show]);

  const remove = useCallback(
    (id: string) => {
      if (!userId) return;
      conversations.remove(userId, id);
      if (id === conversationRef.current) show(null);
    },
    [userId, show],
  );

  // Leaving the screen stops an answer still being written.
  useEffect(() => () => current.current?.abort(), []);

  return {
    conversationId,
    conversation: history.find((c) => c.id === conversationId) ?? null,
    history,
    messages,
    status,
    loading: status !== 'ready',
    error,
    send,
    open: show,
    newChat,
    remove,
  };
}
