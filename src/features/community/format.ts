/** 950 → "950", 12_480 → "12.5K", 1_200_000 → "1.2M" (like/comment/share counts). */
export function formatCount(n: number): string {
  if (n < 1000) return String(n);
  const [v, unit] = n < 1_000_000 ? [n / 1000, 'K'] : [n / 1_000_000, 'M'];
  return `${v >= 100 ? Math.round(v) : v.toFixed(1).replace(/\.0$/, '')}${unit}`;
}
