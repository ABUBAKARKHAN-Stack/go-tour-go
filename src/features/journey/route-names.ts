/**
 * The road a route is "via" (pure, unit tested). Map data in Pakistan often
 * names roads only in Urdu script; in English the app prefers a road with a
 * Latin name when the route has a sizeable one. For an alternative route it
 * names the road that makes it different, not the one it shares.
 */
import { hasArabicScript } from '@/features/data/search-text';

type Named = { name: string | null; distance: number };

/** Below this share of the longest road, a Latin-named road is not "the" road. */
const LATIN_SHARE = 0.25;

function totals(steps: Named[]) {
  const t = new Map<string, number>();
  for (const s of steps) if (s.name) t.set(s.name, (t.get(s.name) ?? 0) + s.distance);
  return t;
}

export function viaRoad(steps: Named[], opts: { exclude?: Named[]; urdu?: boolean } = {}): string | null {
  const all = totals(steps);
  const skip = new Set((opts.exclude ?? []).map((s) => s.name).filter(Boolean) as string[]);
  // Prefer roads the other route doesn't use; if every road is shared, any road will do.
  const own = [...all.entries()].filter(([name]) => !skip.has(name));
  const pool = own.length ? own : [...all.entries()];
  if (!pool.length) return null;
  pool.sort((a, b) => b[1] - a[1]);
  const [best] = pool;
  const inScript = pool.find(([name]) => hasArabicScript(name) === Boolean(opts.urdu));
  return inScript && inScript[1] >= best[1] * LATIN_SHARE ? inScript[0] : best[0];
}
