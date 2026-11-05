/**
 * Bun test preload. The app's translation helper (src/lib/i18n.ts) loads React
 * Native, which Bun cannot run; pure modules under test only need its
 * English pass-through, so it is replaced here.
 */
import { mock } from 'bun:test';

mock.module('@/lib/i18n', () => ({
  language: 'en',
  isUrdu: false,
  flipX: undefined,
  changeLanguage: async () => undefined,
  txEn: (text: string, vars?: Record<string, string | number | null | undefined>) =>
    vars ? text.replace(/\{(\w+)\}/g, (_: string, k: string) => String(vars[k] ?? '')) : text,
  tx: (text: string, vars?: Record<string, string | number | null | undefined>) =>
    vars ? text.replace(/\{(\w+)\}/g, (_: string, k: string) => String(vars[k] ?? '')) : text,
}));
