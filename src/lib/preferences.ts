import type { TravelMode } from '@/features/routing/osrm';
import { storage, StorageKeys, useStorage } from '@/lib/storage';

/** App language: English and Urdu are fully supported (UI, content, right-to-left). */
export type ContentLocale = 'en' | 'ur';
/** The AI guide can also answer in Chinese and Arabic for visitors. */
export type AiLanguage = 'en' | 'ur' | 'zh' | 'ar';

export type Preferences = {
  /** App language: interface and destination content. */
  locale: ContentLocale;
  /** Language the AI guide and Visual Lens answer in. */
  aiLanguage: AiLanguage;
  /** Hours before the same landmark can notify again. */
  proximityCooldownHours: number;
  /** User opted in to background geofence notifications. */
  backgroundAlerts: boolean;
  /** Show the contextual card when the app is open. */
  inAppProximityCard: boolean;
  /** Notify about high/critical road alerts near the user. */
  roadAlertNotifications: boolean;
  travelMode: TravelMode;
};

export const defaultPreferences: Preferences = {
  locale: 'en',
  aiLanguage: 'en',
  proximityCooldownHours: 6,
  backgroundAlerts: false,
  inAppProximityCard: true,
  roadAlertNotifications: true,
  travelMode: 'driving',
};

export const LOCALES: { value: ContentLocale; label: string }[] = [
  { value: 'en', label: 'English' },
  { value: 'ur', label: 'اردو' },
];

export const AI_LANGUAGES: { value: AiLanguage; label: string }[] = [
  { value: 'en', label: 'English' },
  { value: 'ur', label: 'اردو' },
  { value: 'zh', label: '中文' },
  { value: 'ar', label: 'العربية' },
];

function normalise(stored: Partial<Preferences> & { locale?: string }): Preferences {
  const merged = { ...defaultPreferences, ...stored } as Preferences & { locale: string };
  // Chinese/Arabic used to be content languages; they now apply to the AI guide only.
  if (merged.locale !== 'en' && merged.locale !== 'ur') {
    return { ...merged, aiLanguage: (stored.aiLanguage ?? merged.locale) as AiLanguage, locale: 'en' };
  }
  return merged;
}

export function getPreferences(): Preferences {
  return normalise(storage.get<Partial<Preferences>>(StorageKeys.preferences, {}));
}

export function updatePreferences(patch: Partial<Preferences>) {
  storage.set(StorageKeys.preferences, { ...getPreferences(), ...patch });
}

export function usePreferences(): [Preferences, (patch: Partial<Preferences>) => void] {
  const [stored] = useStorage<Partial<Preferences>>(StorageKeys.preferences, {});
  return [normalise(stored), updatePreferences];
}
