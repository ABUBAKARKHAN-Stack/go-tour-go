import { FunctionsHttpError } from '@supabase/supabase-js';

import type { ContentLocale } from '@/lib/preferences';
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

async function invoke<T>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke('ai', { body });
  if (error) {
    if (error instanceof FunctionsHttpError) {
      const payload = await error.context.json().catch(() => null);
      throw new Error(payload?.error ?? 'AI service unavailable.');
    }
    throw new Error('AI service unavailable. Check your connection and try again.');
  }
  return data as T;
}

export async function askAssistant(messages: ChatTurn[], context: ChatContext): Promise<string> {
  const res = await invoke<{ text: string }>({ mode: 'chat', messages: messages.slice(-12), context });
  return res.text;
}

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
