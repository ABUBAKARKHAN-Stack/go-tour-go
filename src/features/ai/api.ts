import { FunctionsHttpError } from '@supabase/supabase-js';
import { fetch as streamingFetch } from 'expo/fetch';

import { useQuery } from '@tanstack/react-query';

import type { ContentLocale } from '@/lib/preferences';
import { queryClient } from '@/lib/query-client';
import type { DestinationTranslation } from '@/lib/types';
import { env } from '@/lib/env';
import { supabase } from '@/lib/supabase';

/**
 * Calls the `ai` Supabase Edge Function. The Gemini key lives only on the
 * server; requests carry the user's JWT and are rate-limited per user/day.
 */
export type ChatTurn = { role: 'user' | 'assistant'; content: string };

export type ChatContext = {
  locationLabel?: string;
  latitude?: number;
  longitude?: number;
  nearby?: { name: string; category?: string; distanceKm?: number }[];
  destinationSlug?: string;
  weather?: string;
  locale?: ContentLocale;
};

export type LensResult = {
  kind: 'landmark' | 'sign' | 'food' | 'object' | 'scene' | 'unknown';
  title: string;
  summary: string;
  matched_slug: string | null;
  confidence: 'high' | 'medium' | 'low';
  detected_text: string | null;
  translated_text: string | null;
  tips: string[];
};

/** Today's AI questions: used and allowed (guests get fewer). Resets daily (00:00 UTC, 5 am in Pakistan). */
export type AiUsage = { used: number; limit: number; guest: boolean };

const USAGE_KEY = ['ai-usage'] as const;

function rememberUsage(usage: unknown) {
  const u = usage as AiUsage | undefined;
  if (u && typeof u.used === 'number' && typeof u.limit === 'number') queryClient.setQueryData(USAGE_KEY, u);
}

async function invoke<T>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke('ai', { body });
  if (error) {
    if (error instanceof FunctionsHttpError) {
      const payload = await error.context.json().catch(() => null);
      rememberUsage(payload?.usage);
      throw new Error(payload?.error ?? 'AI service unavailable.');
    }
    throw new Error('AI service unavailable. Check your connection and try again.');
  }
  rememberUsage((data as { usage?: unknown } | null)?.usage);
  return data as T;
}

/** How many AI questions are left today; refreshed by every answer. */
export function useAiUsage() {
  return useQuery({
    queryKey: USAGE_KEY,
    queryFn: async () => (await invoke<{ usage: AiUsage }>({ mode: 'usage' })).usage,
    staleTime: 60_000,
    retry: 0,
  });
}

/** Urdu guide for a landmark: stored translation, or made once by the AI service and stored for everyone. */
export async function translateDestination(destinationId: string): Promise<DestinationTranslation | null> {
  const res = await invoke<{ translation: DestinationTranslation | null }>({ mode: 'translate', destinationId, locale: 'ur' });
  return res.translation;
}

export async function askAssistant(messages: ChatTurn[], context: ChatContext): Promise<string> {
  const res = await invoke<{ text: string }>({ mode: 'chat', messages: messages.slice(-12), context });
  return res.text;
}

/** The answer was stopped on purpose (New chat, screen closed). */
export class AiAborted extends Error {}

/**
 * Streams the AI guide's answer: `onText` gets each new piece as it is
 * written, so the reply appears word by word. Resolves when the answer is
 * complete; rejects with the server's message (or AiAborted).
 */
export async function streamAssistant(
  messages: ChatTurn[],
  context: ChatContext,
  onText: (text: string) => void,
  signal?: AbortSignal,
): Promise<void> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error('Sign in to use the AI assistant.');

  let res: Response;
  try {
    // expo/fetch streams the response body (React Native's own fetch waits for the whole reply).
    res = (await streamingFetch(`${env.supabaseUrl}/functions/v1/ai`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: env.supabasePublishableKey,
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
      },
      body: JSON.stringify({ mode: 'chat', stream: true, messages: messages.slice(-12), context }),
      signal,
    })) as unknown as Response;
  } catch {
    if (signal?.aborted) throw new AiAborted();
    throw new Error('AI service unavailable. Check your connection and try again.');
  }
  if (!res.ok || !res.body) {
    const payload = (await res.json().catch(() => null)) as { error?: string; usage?: unknown } | null;
    rememberUsage(payload?.usage);
    throw new Error(payload?.error ?? 'AI service unavailable.');
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let end: number;
      while ((end = buffer.indexOf('\n\n')) >= 0) {
        const block = buffer.slice(0, end);
        buffer = buffer.slice(end + 2);
        for (const line of block.split('\n')) {
          if (!line.startsWith('data:')) continue;
          const event = JSON.parse(line.slice(5)) as { type: string; text?: string; error?: string; usage?: unknown };
          if (event.type === 'delta' && event.text) onText(event.text);
          else if (event.type === 'done') rememberUsage(event.usage);
          else if (event.type === 'error') {
            rememberUsage(event.usage);
            throw new AiServerError(event.error ?? 'AI service unavailable.');
          }
        }
      }
    }
  } catch (e) {
    if (signal?.aborted) throw new AiAborted();
    if (e instanceof AiServerError) throw e;
    throw new Error('The answer was cut off. Check your connection and ask again.');
  }
}

/** An error the AI service reported (shown as it is). */
class AiServerError extends Error {}

export async function analyzeImage(imageBase64: string, opts: { question?: string; locale?: ContentLocale }): Promise<LensResult> {
  const res = await invoke<{ result: LensResult }>({
    mode: 'lens',
    image: imageBase64,
    mimeType: 'image/jpeg',
    question: opts.question,
    locale: opts.locale,
  });
  return res.result;
}
