/**
 * Search normalisation for Pakistani place names, which are romanised many
 * ways: "Qayyumabad" / "Qayumabad", "Gulshan-e-Iqbal" / "Gulshan Iqbal",
 * "Saddar" / "Sadar". Names and queries are reduced to the same "squashed"
 * form: lower case, no accents, no izafat "e", no spaces, doubled letters
 * collapsed. Pure functions so they can be unit tested.
 */
const ARABIC = /[؀-ۿ]/;

export function hasArabicScript(text: string) {
  return ARABIC.test(text);
}

export function squash(text: string): string {
  const words = text
    .normalize('NFKD')
    // Combining marks: Latin accents, and Urdu marks such as the madda in "آ".
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9؀-ۿ]+/g, ' ')
    .trim()
    .split(' ')
    .filter((w) => w && w !== 'e' && w !== 'i' && w !== 'o');
  return words.join('').replace(/([a-z])\1+/g, '$1');
}

/** LIKE pattern (with backslash escapes) matching the squashed query anywhere. */
export function likePattern(squashed: string) {
  return `%${squashed.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
}

/**
 * Relevance: exact name beats prefix beats substring, then importance, then
 * nearness (up to 60 points off for far away results).
 */
export function scoreMatch(nameSquashed: string, query: string, rank: number, distanceM: number | null) {
  const match = nameSquashed === query ? 300 : nameSquashed.startsWith(query) ? 200 : 100;
  const far = distanceM == null ? 0 : Math.min(60, distanceM / 10_000);
  return match + rank - far;
}
