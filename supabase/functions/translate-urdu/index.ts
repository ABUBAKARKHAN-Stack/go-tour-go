// Machine Urdu drafts for landmarks (owner-run job, never called by the app).
// Start batches from SQL (limit, offset), several side by side:
//   select private.start_urdu_job(8, 0), private.start_urdu_job(8, 8);
// or unattended every two minutes via pg_cron job 'urdu-translation' (private.urdu_cron_tick).
// The database sends a single-use token; this function checks it, takes one
// batch from public.urdu_translation_queue, asks Gemini for Urdu and writes it
// with public.apply_machine_urdu (empty fields only, labelled
// machine_translated, no landmark lock). Repeat until the queue is empty.
// Progress: select * from private.urdu_job_log order by id desc;
// See docs/LANDMARKS-IMPORT.md.
// Secrets: GEMINI_API_KEY (required), GEMINI_TRANSLATE_MODEL (optional; default
// gemini-flash-latest). When Gemini is busy (503) the batch is logged and the
// next scheduled run retries. Flash-Lite is not used: it looped and invented text.
// Deployed with verify_jwt = false: the single-use token is the authentication.
import { createClient } from 'npm:@supabase/supabase-js@2';

const MODELS = [Deno.env.get('GEMINI_TRANSLATE_MODEL') ?? 'gemini-flash-latest'];
const FIELDS = ['name', 'short_description', 'description', 'history', 'significance', 'culture', 'local_customs', 'food', 'shopping', 'tips'];

const PROMPT = `You translate travel-guide text about places in Pakistan from English into Urdu for a mobile app.
Rules:
- Write natural, clear Modern Standard Urdu in Urdu script (as read in Pakistan), not Hindi and not Roman Urdu.
- Translate meaning faithfully. Do not add, remove or invent facts. Keep numbers, dates and units.
- Place and person names: use the established Urdu spelling if there is one (e.g. Badshahi Mosque -> بادشاہی مسجد, Lahore -> لاہور), otherwise write the name in Urdu script.
- Keep each field's length close to the English. Plain text only, no markdown.
Input is a JSON array of items {id, fields}. Return JSON {"items":[{"id":..., "fields":{...}}]} with exactly the same ids and the same field keys, every value translated.`;

// Structured output: Gemini must return exactly this shape (no truncated JSON).
const SCHEMA = {
  type: 'OBJECT',
  properties: {
    items: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          id: { type: 'STRING' },
          fields: { type: 'OBJECT', properties: Object.fromEntries(FIELDS.map((f) => [f, { type: 'STRING' }])) },
        },
        required: ['id', 'fields'],
      },
    },
  },
  required: ['items'],
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405);
  let body: { token?: string; limit?: number; offset?: number };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'bad json' }, 400);
  }
  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false },
  });

  const { data: ok, error: tokenError } = await admin.rpc('consume_job_token', { p_token: body.token ?? '' });
  if (tokenError || !ok) return json({ error: 'unauthorized' }, 401);

  const key = Deno.env.get('GEMINI_API_KEY');
  if (!key) return json({ error: 'GEMINI_API_KEY is not set' }, 500);

  const limit = body.limit ?? 6;
  const log = (asked: number, translated: number, note: string) =>
    admin.rpc('log_urdu_job', { p_asked: asked, p_translated: translated, p_runs_left: body.offset ?? 0, p_note: note });

  const { data: queue, error: queueError } = await admin.rpc('urdu_translation_queue', {
    p_limit: limit,
    p_offset: body.offset ?? 0,
  });
  if (queueError) return json({ error: queueError.message }, 500);
  // Keep each request small enough for the model to answer in full (long
  // hand-written guides are several sections each): at most ~2,000 characters
  // of English, always at least one landmark.
  const all = (queue ?? []) as { id: string; fields: Record<string, string> }[];
  const items: typeof all = [];
  let chars = 0;
  for (const it of all) {
    const size = Object.values(it.fields).join('').length;
    if (items.length && chars + size > 2000) break;
    items.push(it);
    chars += size;
  }
  if (!items.length) {
    await log(0, 0, 'done: queue empty');
    return json({ translated: 0, done: true });
  }

  // Output budget sized to the input (Urdu is about as long as the English),
  // so a model that starts repeating itself stops early instead of running on.
  const maxOutputTokens = Math.min(8192, 800 + chars * 2);
  let res: Response | null = null;
  let model = MODELS[0];
  for (const m of MODELS) {
    model = m;
    res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: PROMPT }] },
        contents: [{ role: 'user', parts: [{ text: JSON.stringify(items) }] }],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: 'application/json',
          responseSchema: SCHEMA,
          maxOutputTokens,
          // Plain translation needs no reasoning; thinking would also eat the output budget.
          thinkingConfig: { thinkingBudget: 0 },
        },
      }),
    });
    if (res.status !== 503 && res.status !== 429) break; // busy: try the next model
  }
  if (!res || !res.ok) {
    const detail = res ? (await res.text()).slice(0, 300) : 'no response';
    await log(items.length, 0, `gemini ${res?.status} (${model}): ${detail}`);
    return json({ error: `gemini ${res?.status}`, detail }, 502);
  }
  const out = await res.json();
  const finish: string = out?.candidates?.[0]?.finishReason ?? '';
  const text: string = out?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? '').join('') ?? '';
  let parsed: { items?: { id: string; fields: Record<string, string> }[] };
  try {
    parsed = JSON.parse(text);
  } catch {
    await log(items.length, 0, `non-JSON (${model}, finish ${finish}, ${text.length} chars): ${text.slice(-100)}`);
    return json({ error: 'gemini returned non-JSON', detail: text.slice(0, 300) }, 502);
  }

  const wanted = new Map(items.map((i) => [i.id, i.fields]));
  let translated = 0;
  const errors: string[] = [];
  for (const item of parsed.items ?? []) {
    const asked = wanted.get(item.id);
    if (!asked || !item.fields) continue;
    // Keep only fields that were asked for and contain Urdu script.
    const fields: Record<string, string> = {};
    for (const k of Object.keys(asked)) {
      const v = item.fields[k];
      if (FIELDS.includes(k) && typeof v === 'string' && /[؀-ۿ]/.test(v)) fields[k] = v.trim();
    }
    if (!Object.keys(fields).length) continue;
    const { error } = await admin.rpc('apply_machine_urdu', { p_id: item.id, p_fields: fields });
    if (error) errors.push(`${item.id}: ${error.message}`);
    else translated++;
  }
  await log(items.length, translated, errors.length ? errors.join('; ') : `ok (${model})`);
  return json({ asked: items.length, translated, errors });
});
