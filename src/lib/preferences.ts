import type { TravelMode } from '@/features/routing/osrm';
import { storage, StorageKeys, useStorage } from '@/lib/storage';

/**
 * App language: English or Urdu, for everything (UI, content, right-to-left,
 * voice guidance and the AI guide's answers). There is no separate AI language.
 */
export type ContentLocale = 'en' | 'ur';

export type Preferences = {
  /** App language: interface, destination content, voice and AI answers. */
  locale: ContentLocale;
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

function normalise(stored: Partial<Preferences> & { locale?: string; aiLanguage?: string }): Preferences {
  // Older versions also stored a separate AI language (and Chinese/Arabic); both are gone.
  const { aiLanguage: _old, ...rest } = stored;
  const merged = { ...defaultPreferences, ...rest } as Preferences & { locale: string };
  if (merged.locale !== 'en' && merged.locale !== 'ur') return { ...merged, locale: 'en' };
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
