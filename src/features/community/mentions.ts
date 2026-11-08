/** A piece of comment/post text: plain, or an @mention of a username. */
export type TextPart = { text: string; username?: string };

// Usernames are 3–24 of a–z, 0–9 and "_" (USERNAME in auth/schemas.ts). A
// mention starts the text or follows a non-word character, so emails don't match.
const MENTION = /(^|[^A-Za-z0-9_@.])@([A-Za-z0-9_]{3,24})(?![A-Za-z0-9_])/g;

/** Splits text into plain parts and @mentions (username lowercased). Pure. */
export function splitMentions(text: string): TextPart[] {
  const parts: TextPart[] = [];
  let last = 0;
  for (const m of text.matchAll(MENTION)) {
    const start = (m.index ?? 0) + m[1].length;
    if (start > last) parts.push({ text: text.slice(last, start) });
    parts.push({ text: `@${m[2]}`, username: m[2].toLowerCase() });
    last = start + m[2].length + 1;
  }
  if (last < text.length) parts.push({ text: text.slice(last) });
  return parts;
}
