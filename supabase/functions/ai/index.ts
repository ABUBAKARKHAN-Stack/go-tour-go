// GoTourGo AI Edge Function (Deno).
//
// Keeps the Gemini API key server-side. Two modes:
//   - "chat": travel assistant grounded with the user's location context and,
//     when given, the selected destination's facts from the database.
//   - "lens": image analysis (landmark / sign / text) matched against the
//     seeded landmark list, returned as structured JSON.
//
// Secrets: GEMINI_API_KEY (required), GEMINI_MODEL, AI_DAILY_LIMIT (optional).
// Deploy:  supabase functions deploy ai
import { withSupabase } from 'npm:@supabase/server@1';

type ChatTurn = { role: 'user' | 'assistant'; content: string };

type NearbyContext = { name: string; category?: string; distanceKm?: number };

type ChatRequest = {
  mode: 'chat';
  messages: ChatTurn[];
  context?: {
    locationLabel?: string;
    latitude?: number;
    longitude?: number;
    nearby?: NearbyContext[];
    destinationSlug?: string;
    weather?: string;
    locale?: string;
  };
};

type LensRequest = {
  mode: 'lens';
  image: string; // base64 (no data: prefix)
  mimeType?: string;
  question?: string;
  locale?: string;
};

type GeminiPart = { text?: string; inline_data?: { mime_type: string; data: string } };

const MODEL = Deno.env.get('GEMINI_MODEL') ?? 'gemini-flash-latest';
const DAILY_LIMIT = Number(Deno.env.get('AI_DAILY_LIMIT') ?? '50');
const MAX_IMAGE_BASE64 = 2_000_000; // ~1.5 MB image
const MAX_TURNS = 12;
const MAX_TURN_CHARS = 2000;

const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  ur: 'Urdu',
  ar: 'Arabic',
  zh: 'Chinese',
};

const CHAT_SYSTEM = `You are GoTourGo, a friendly travel companion for visitors in Pakistan.
Rules:
- Only help with travel: destinations, history, culture, food, customs, safety, transport, weather and trip tips.
- Be concise: at most ~150 words unless the user asks for more. Use short bullet lists where helpful.
- Prefer facts given in the CONTEXT block. If something is not in the context and you are unsure, say so instead of guessing.
- Never invent opening hours, prices or phone numbers; suggest checking locally.
- For emergencies, tell the user to call Rescue 1122 or Police 15 in Pakistan. You are not an emergency service.
- Politely decline unrelated requests.`;

function json(body: unknown, status = 200) {
  return Response.json(body, { status });
}

function languageName(locale?: string) {
  return LANGUAGE_NAMES[(locale ?? 'en').slice(0, 2)] ?? 'English';
}

async function callGemini(body: Record<string, unknown>): Promise<string> {
  const key = Deno.env.get('GEMINI_API_KEY');
  if (!key) throw new HttpError(503, 'AI service is not configured.');

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30_000),
    },
  );

  if (res.status === 429) throw new HttpError(429, 'The AI service is busy. Try again in a minute.');
  if (!res.ok) {
    console.error('Gemini error', res.status, await res.text());
    throw new HttpError(502, 'AI service unavailable.');
  }
  const data = await res.json();
  const parts: GeminiPart[] = data?.candidates?.[0]?.content?.parts ?? [];
  const text = parts.map((p) => p.text ?? '').join('').trim();
  if (!text) throw new HttpError(502, 'The AI service returned an empty answer.');
  return text;
}

class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export default {
  fetch: withSupabase({ auth: 'user' }, async (req, ctx) => {
    try {
      if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
      const userId = ctx.userClaims?.id;
      if (!userId) return json({ error: 'Sign in to use the AI assistant.' }, 401);

      const payload = (await req.json()) as ChatRequest | LensRequest;

      // Per-user daily quota (service role only; clients cannot touch ai_usage).
      const { data: used, error: quotaError } = await ctx.supabaseAdmin.rpc('increment_ai_usage', {
        uid: userId,
      });
      if (quotaError) {
        console.error('quota error', quotaError);
        return json({ error: 'AI service unavailable.' }, 503);
      }
      if (typeof used === 'number' && used > DAILY_LIMIT) {
        return json({ error: `Daily AI limit reached (${DAILY_LIMIT}). Try again tomorrow.` }, 429);
      }

      if (payload.mode === 'chat') return json(await handleChat(payload, ctx.supabase));
      if (payload.mode === 'lens') return json(await handleLens(payload, ctx.supabase));
      return json({ error: 'Unknown mode' }, 400);
    } catch (error) {
      if (error instanceof HttpError) return json({ error: error.message }, error.status);
      console.error(error);
      return json({ error: 'AI service unavailable.' }, 500);
    }
  }),
};

// deno-lint-ignore no-explicit-any
type Db = any;

async function handleChat(payload: ChatRequest, supabase: Db) {
  const turns = (payload.messages ?? [])
    .filter((m) => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .slice(-MAX_TURNS)
    .map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content.slice(0, MAX_TURN_CHARS) }],
    }));
  if (turns.length === 0 || turns[turns.length - 1].role !== 'user') {
    throw new HttpError(400, 'Ask a question first.');
  }

  const c = payload.context ?? {};
  const lines: string[] = [];
  if (c.locationLabel) lines.push(`User location: ${c.locationLabel}`);
  if (typeof c.latitude === 'number' && typeof c.longitude === 'number') {
    lines.push(`Coordinates: ${c.latitude.toFixed(4)}, ${c.longitude.toFixed(4)}`);
  }
  if (c.weather) lines.push(`Current weather: ${c.weather}`);
  if (c.nearby?.length) {
    lines.push('Nearby GoTourGo destinations (closest first):');
    for (const n of c.nearby.slice(0, 8)) {
      const dist = typeof n.distanceKm === 'number' ? ` - ${n.distanceKm.toFixed(1)} km` : '';
      lines.push(`- ${n.name}${n.category ? ` (${n.category})` : ''}${dist}`);
    }
  }
  if (c.destinationSlug) {
    const { data } = await supabase
      .from('destinations')
      .select('name, city, category, short_description, history, significance, local_customs, food, shopping, tips, opening_hours, entry_fee, best_time')
      .eq('slug', c.destinationSlug)
      .maybeSingle();
    if (data) {
      lines.push(`Selected destination: ${data.name} (${data.category}, ${data.city})`);
      for (const [k, v] of Object.entries(data)) {
        if (v && !['name', 'city', 'category'].includes(k)) lines.push(`${k}: ${v}`);
      }
    }
  }

  const system = `${CHAT_SYSTEM}\n- Reply in ${languageName(c.locale)}.\n\nCONTEXT:\n${lines.join('\n') || 'No location context available.'}`;

  const text = await callGemini({
    system_instruction: { parts: [{ text: system }] },
    contents: turns,
    generationConfig: { temperature: 0.6, maxOutputTokens: 600 },
  });
  return { text };
}

async function handleLens(payload: LensRequest, supabase: Db) {
  if (!payload.image || payload.image.length > MAX_IMAGE_BASE64) {
    throw new HttpError(400, 'Image missing or too large.');
  }
  const mimeType = ['image/jpeg', 'image/png', 'image/webp'].includes(payload.mimeType ?? '')
    ? payload.mimeType!
    : 'image/jpeg';

  const { data: landmarks } = await supabase
    .from('destinations')
    .select('slug, name, city')
    .limit(200);
  const list = (landmarks ?? [])
    .map((l: { slug: string; name: string; city: string }) => `${l.slug}: ${l.name} (${l.city})`)
    .join('\n');

  const prompt = `You are the GoTourGo Visual Lens for travellers in Pakistan.
Look at the photo and answer in ${languageName(payload.locale)}.
${payload.question ? `The traveller asks: "${payload.question.slice(0, 300)}"` : ''}
If the photo shows one of these known landmarks, set matched_slug to its slug, otherwise null:
${list}
If there is visible text (a sign, menu, notice), transcribe it and translate it.
Respond ONLY with JSON matching:
{"kind":"landmark|sign|food|object|scene|unknown","title":string,"summary":string,"matched_slug":string|null,"confidence":"high|medium|low","detected_text":string|null,"translated_text":string|null,"tips":string[]}
Keep summary under 80 words and at most 3 tips. Say clearly when you are not sure.`;

  const text = await callGemini({
    contents: [
      {
        role: 'user',
        parts: [{ text: prompt }, { inline_data: { mime_type: mimeType, data: payload.image } }],
      },
    ],
    generationConfig: { temperature: 0.3, maxOutputTokens: 700, responseMimeType: 'application/json' },
  });

  try {
    const result = JSON.parse(text.replace(/^```(json)?|```$/g, '').trim());
    const known = new Set((landmarks ?? []).map((l: { slug: string }) => l.slug));
    if (result.matched_slug && !known.has(result.matched_slug)) result.matched_slug = null;
    return { result };
  } catch {
    return {
      result: {
        kind: 'unknown',
        title: 'Result',
        summary: text.slice(0, 600),
        matched_slug: null,
        confidence: 'low',
        detected_text: null,
        translated_text: null,
        tips: [],
      },
    };
  }
}
