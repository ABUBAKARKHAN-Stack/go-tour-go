/** 950 → "950", 12_480 → "12.5K", 1_200_000 → "1.2M" (like/comment/share counts). */
export function formatCount(n: number): string {
  if (n < 1000) return String(n);
  const [v, unit] = n < 1_000_000 ? [n / 1000, 'K'] : [n / 1_000_000, 'M'];
  return `${v >= 100 ? Math.round(v) : v.toFixed(1).replace(/\.0$/, '')}${unit}`;
}

/** Video length: 42_000 → "0:42", 61_000 → "1:01". */
export function formatDuration(ms: number): string {
  const total = Math.round(ms / 1000);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}
