import { FunctionsHttpError } from '@supabase/supabase-js';

import { useQuery } from '@tanstack/react-query';

import type { AiLanguage } from '@/lib/preferences';
import { queryClient } from '@/lib/query-client';
import type { DestinationTranslation } from '@/lib/types';
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
  locale?: AiLanguage;
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

export async function analyzeImage(imageBase64: string, opts: { question?: string; locale?: AiLanguage }): Promise<LensResult> {
  const res = await invoke<{ result: LensResult }>({
    mode: 'lens',
    image: imageBase64,
    mimeType: 'image/jpeg',
    question: opts.question,
    locale: opts.locale,
  });
  return res.result;
}
