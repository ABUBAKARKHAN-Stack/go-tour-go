import * as Updates from 'expo-updates';
import { DevSettings, I18nManager } from 'react-native';

import { ur } from '@/i18n/ur';
import { getPreferences, updatePreferences, type ContentLocale } from '@/lib/preferences';

/**
 * Interface translation. Strings are written in English in the code and
 * looked up by that English text (gettext style), so screens stay readable
 * and a missing translation simply shows English.
 *
 * The language is fixed for each run of the app: switching restarts the app,
 * which right-to-left layout needs anyway. That also lets constants call tx()
 * when their module loads.
 */
export const language: ContentLocale = getPreferences().locale;
export const isUrdu = language === 'ur';

// Keep the layout direction in step with the language (applies after a restart).
if (I18nManager.isRTL !== isUrdu) {
  I18nManager.allowRTL(isUrdu);
  I18nManager.forceRTL(isUrdu);
}

const table: Record<string, string> = isUrdu ? ur : {};

/**
 * Translates `text`. Placeholders like {0} or {name} are filled from `vars`.
 * Digits stay Western (1, 2, 3), as is usual in Pakistani apps.
 */
export function tx(text: string, vars?: Record<string, string | number | null | undefined>): string {
  const out = table[text] ?? text;
  if (!vars) return out;
  return out.replace(/\{(\w+)\}/g, (_, key: string) => String(vars[key] ?? ''));
}

/** English with placeholders filled (for the English voice fallback). */
export function txEn(text: string, vars?: Record<string, string | number | null | undefined>): string {
  return vars ? text.replace(/\{(\w+)\}/g, (_, key: string) => String(vars[key] ?? '')) : text;
}

/** Saves the new language and restarts the app so text and direction update. */
export async function changeLanguage(next: ContentLocale) {
  if (next === language) return;
  updatePreferences({ locale: next });
  const rtl = next === 'ur';
  I18nManager.allowRTL(rtl);
  I18nManager.forceRTL(rtl);
  try {
    await Updates.reloadAsync();
  } catch {
    // Development builds without expo-updates control.
    DevSettings.reload();
  }
}

/** Flip arrows and chevrons that point "forward" or "back" in right-to-left. */
export const flipX = isUrdu ? { transform: [{ scaleX: -1 }] } : undefined;
