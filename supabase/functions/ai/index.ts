// GoTourGo AI Edge Function (Deno).
//
// Keeps the Gemini API key server-side. Three modes:
//   - "chat": travel assistant grounded with the user's location context and,
//     when given, the selected destination's facts from the database.
//   - "lens": image analysis (landmark / sign / text) matched against the
//     seeded landmark list, returned as structured JSON.
//   - "translate": Urdu translation of a landmark guide, made once and stored
//     in destination_translations (marked machine_translated) for everyone.
//
// Secrets: GEMINI_API_KEY (required), GEMINI_MODEL, GEMINI_FALLBACK_MODEL,
//          AI_DAILY_LIMIT, AI_DAILY_LIMIT_GUEST (optional).
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

type TranslateRequest = {
  mode: 'translate';
  destinationId: string;
  locale: 'ur';
};

/** Today's AI use, so the app can show "7 of 10 questions left today". */
type UsageRequest = { mode: 'usage' };
type Usage = { used: number; limit: number; guest: boolean };

type GeminiPart = { text?: string; inline_data?: { mime_type: string; data: string } };

/**
 * Gemini models, tried in order. `-latest` names follow Google's newest Flash
 * models; when the first is slow or busy the lighter one answers instead.
 * Set GEMINI_MODEL / GEMINI_FALLBACK_MODEL to pin exact versions.
 */
const MODEL = Deno.env.get('GEMINI_MODEL') ?? 'gemini-flash-latest';
const FALLBACK_MODEL = Deno.env.get('GEMINI_FALLBACK_MODEL') ?? 'gemini-flash-lite-latest';
/** The whole answer must arrive within this (the app waits for it). */
const TOTAL_BUDGET_MS = 50_000;
/** The first model gets this long before the fallback is asked. */
const FIRST_TRY_MS = 22_000;
/**
 * Short thinking keeps answers quick: newer models read thinkingLevel, 2.5
 * models thinkingBudget. A model that rejects one gets the next (remembered
 * while this instance runs).
 */
const THINKING: (Record<string, unknown> | null)[] = [{ thinkingLevel: 'low' }, { thinkingBudget: 0 }, null];
const thinkingChoice = new Map<string, number>();
const DAILY_LIMIT = Number(Deno.env.get('AI_DAILY_LIMIT') ?? '50');
/** Guests (anonymous sign-ins) get a smaller daily allowance. */
const GUEST_DAILY_LIMIT = Number(Deno.env.get('AI_DAILY_LIMIT_GUEST') ?? '10');
const MAX_IMAGE_BASE64 = 2_000_000; // ~1.5 MB image
const MAX_TURNS = 12;
const MAX_TURN_CHARS = 2000;

const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  ur: 'Urdu',
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

  const started = Date.now();
  const models = [...new Set([MODEL, FALLBACK_MODEL])];
  let lastError: unknown = null;
  for (const [i, model] of models.entries()) {
    const left = TOTAL_BUDGET_MS - (Date.now() - started);
    if (left < 4000) break;
    const budget = i === 0 && models.length > 1 ? Math.min(FIRST_TRY_MS, left) : left;
    try {
      return await callModel(key, model, body, budget);
    } catch (error) {
      lastError = error;
      console.error('Gemini attempt failed', model, `${Date.now() - started}ms`, error instanceof Error ? error.message : error);
    }
  }
  // Timeouts carry timing details for the log only; the traveller gets a plain message.
  if (lastError instanceof HttpError && lastError.status !== 504) throw lastError;
  throw new HttpError(504, 'The AI service is slow right now. Please try again in a moment.');
}

/** One model, within `budgetMs`; tries the next thinking setting if the model rejects one. */
async function callModel(key: string, model: string, body: Record<string, unknown>, budgetMs: number): Promise<string> {
  const deadline = Date.now() + budgetMs;
  for (let t = thinkingChoice.get(model) ?? 0; t < THINKING.length; t++) {
    const thinking = THINKING[t];
    const generationConfig = { ...((body.generationConfig as Record<string, unknown>) ?? {}), ...(thinking ? { thinkingConfig: thinking } : {}) };
    const left = deadline - Date.now();
    if (left < 1000) break;
    const startedAt = Date.now();
    let res: Response;
    try {
      res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
        body: JSON.stringify({ ...body, generationConfig }),
        signal: AbortSignal.timeout(left),
      });
    } catch (error) {
      const timedOut = error instanceof DOMException && (error.name === 'TimeoutError' || error.name === 'AbortError');
      throw new HttpError(504, timedOut ? `Timed out after ${Date.now() - startedAt}ms` : 'Could not reach the AI service.');
    }

    if (res.status === 400 || res.status === 404) {
      const text = await res.text();
      // This model doesn't take this thinking setting: try the next one.
      if (res.status === 400 && thinking && /thinking/i.test(text)) continue;
      console.error('Gemini rejected the request', model, res.status, text.slice(0, 500));
      throw new HttpError(502, 'AI service unavailable.');
    }
    if (res.status === 429) throw new HttpError(429, 'The AI service is busy. Try again in a minute.');
    if (!res.ok) {
      console.error('Gemini error', model, res.status, (await res.text()).slice(0, 500));
      throw new HttpError(502, 'AI service unavailable.');
    }
    thinkingChoice.set(model, t);
    const data = await res.json();
    const candidate = data?.candidates?.[0];
    const parts: GeminiPart[] = candidate?.content?.parts ?? [];
    const text = parts
      .filter((p) => !(p as { thought?: boolean }).thought)
      .map((p) => p.text ?? '')
      .join('')
      .trim();
    console.log('Gemini answered', model, `${Date.now() - startedAt}ms`, candidate?.finishReason ?? '');
    if (!text) throw new HttpError(502, 'The AI service returned an empty answer.');
    return text;
  }
  throw new HttpError(504, 'Timed out');
}

class HttpError extends Error {
  constructor(public status: number, message: string, public usage?: Usage) {
    super(message);
  }
}

export default {
  fetch: withSupabase({ auth: 'user' }, async (req, ctx) => {
    try {
      if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
      const userId = ctx.userClaims?.id;
      if (!userId) return json({ error: 'Sign in to use the AI assistant.' }, 401);

      const payload = (await req.json()) as ChatRequest | LensRequest | TranslateRequest | UsageRequest;
      const guest = (ctx.jwtClaims as Record<string, unknown> | null)?.is_anonymous === true;

      // Reading the allowance is free.
      if (payload.mode === 'usage') return json({ usage: await readUsage(ctx.supabaseAdmin, userId, guest) });

      // Translations already stored are free; only a new translation uses quota.
      if (payload.mode === 'translate') return json(await handleTranslate(payload, ctx.supabaseAdmin, userId, guest));

      if (payload.mode !== 'chat' && payload.mode !== 'lens') return json({ error: 'Unknown mode' }, 400);
      const usage = await consumeQuota(ctx.supabaseAdmin, userId, guest);
      try {
        const answer = payload.mode === 'chat' ? await handleChat(payload, ctx.supabase) : await handleLens(payload, ctx.supabase);
        return json({ ...answer, usage });
      } catch (error) {
        // No answer, so the question is not counted.
        const refunded = await refundQuota(ctx.supabaseAdmin, userId, usage);
        if (error instanceof HttpError) throw new HttpError(error.status, error.message, refunded);
        throw error;
      }
    } catch (error) {
      if (error instanceof HttpError) return json({ error: error.message, ...(error.usage ? { usage: error.usage } : {}) }, error.status);
      console.error(error);
      return json({ error: 'AI service unavailable.' }, 500);
    }
  }),
};

// deno-lint-ignore no-explicit-any
type Db = any;

/** Per-user daily quota (service role only; clients cannot touch ai_usage). */
async function consumeQuota(admin: Db, userId: string, guest: boolean): Promise<Usage> {
  const { data: used, error } = await admin.rpc('increment_ai_usage', { uid: userId });
  if (error) {
    console.error('quota error', error);
    throw new HttpError(503, 'AI service unavailable.');
  }
  const limit = limitFor(guest);
  const count = typeof used === 'number' ? used : 0;
  if (count > limit) {
    throw new HttpError(
      429,
      guest
        ? `Guests can ask ${limit} questions a day. Create a free account for more, or try again tomorrow.`
        : `Daily AI limit reached (${limit}). Try again tomorrow.`,
      { used: limit, limit, guest },
    );
  }
  return { used: count, limit, guest };
}

/** Gives back a question whose answer failed (best effort). */
async function refundQuota(admin: Db, userId: string, usage: Usage): Promise<Usage> {
  const used = Math.max(0, usage.used - 1);
  const { error } = await admin
    .from('ai_usage')
    .update({ request_count: used })
    .eq('user_id', userId)
    .eq('day', new Date().toISOString().slice(0, 10));
  if (error) {
    console.error('quota refund', error);
    return usage;
  }
  return { ...usage, used };
}

function limitFor(guest: boolean) {
  return guest ? GUEST_DAILY_LIMIT : DAILY_LIMIT;
}

/** Questions used today (the same UTC day increment_ai_usage counts). */
async function readUsage(admin: Db, userId: string, guest: boolean): Promise<Usage> {
  const limit = limitFor(guest);
  const { data, error } = await admin
    .from('ai_usage')
    .select('request_count')
    .eq('user_id', userId)
    .eq('day', new Date().toISOString().slice(0, 10))
    .maybeSingle();
  if (error) console.error('usage read', error);
  return { used: Math.min(data?.request_count ?? 0, limit), limit, guest };
}

const GUIDE_FIELDS = [
  'short_description',
  'description',
  'history',
  'culture',
  'significance',
  'local_customs',
  'food',
  'shopping',
  'tips',
] as const;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Urdu guide for a landmark: returns the stored translation, filling any
 * missing sections once with Gemini. Human/sourced text is never replaced.
 */
async function handleTranslate(payload: TranslateRequest, admin: Db, userId: string, guest: boolean) {
  if (payload.locale !== 'ur' || !UUID.test(payload.destinationId ?? '')) throw new HttpError(400, 'Invalid request.');

  const { data: d, error } = await admin
    .from('destinations')
    .select(`id, name, name_ur, ${GUIDE_FIELDS.join(', ')}`)
    .eq('id', payload.destinationId)
    .maybeSingle();
  if (error || !d) throw new HttpError(404, 'Destination not found.');

  const { data: existing } = await admin
    .from('destination_translations')
    .select('*')
    .eq('destination_id', d.id)
    .eq('locale', 'ur')
    .maybeSingle();

  const source: Record<string, string> = {};
  for (const f of GUIDE_FIELDS) {
    const text = typeof d[f] === 'string' ? d[f].trim() : '';
    if (text && !existing?.[f]) source[f] = text.slice(0, 2500);
  }
  const needName = !existing?.name && !d.name_ur;
  if (needName) source.name = d.name;
  if (Object.keys(source).length === 0) return { translation: existing };

  await consumeQuota(admin, userId, guest);
  const text = await callGemini({
    system_instruction: {
      parts: [
        {
          text: `Translate the values of this JSON object from English into natural, clear Urdu (اردو) for a travel guide app in Pakistan.
- Keep the same keys. Return only the JSON object.
- Use the common Urdu spelling for place and people names; keep numbers and years as digits.
- Do not add or remove facts.`,
        },
      ],
    },
    contents: [{ role: 'user', parts: [{ text: JSON.stringify(source) }] }],
    generationConfig: { temperature: 0.2, maxOutputTokens: 4000, responseMimeType: 'application/json' },
  });

  let out: Record<string, unknown>;
  try {
    out = JSON.parse(text);
  } catch {
    throw new HttpError(502, 'Translation failed. Try again later.');
  }

  const row: Record<string, unknown> = {
    destination_id: d.id,
    locale: 'ur',
    name: existing?.name ?? d.name_ur ?? (typeof out.name === 'string' && out.name.trim() ? out.name.trim() : d.name),
    machine_translated: true,
    updated_at: new Date().toISOString(),
  };
  for (const f of GUIDE_FIELDS) {
    const machine = typeof out[f] === 'string' && (out[f] as string).trim() ? (out[f] as string).trim() : null;
    row[f] = existing?.[f] ?? machine;
  }

  const { data: saved, error: saveError } = await admin
    .from('destination_translations')
    .upsert(row, { onConflict: 'destination_id,locale' })
    .select('*')
    .single();
  if (saveError) {
    console.error('save translation', saveError);
    return { translation: row };
  }
  return { translation: saved };
}

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
    generationConfig: { temperature: 0.6, maxOutputTokens: 1200 },
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
    generationConfig: { temperature: 0.3, maxOutputTokens: 1200, responseMimeType: 'application/json' },
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
