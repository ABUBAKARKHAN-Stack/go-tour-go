import type { TravelMode } from '@/features/routing/osrm';
import { storage, StorageKeys, useStorage } from '@/lib/storage';

export type ContentLocale = 'en' | 'ur' | 'zh' | 'ar';

export type Preferences = {
  /** Language for destination content (names, descriptions, AI answers). */
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
  { value: 'ur', label: 'اردو (Urdu)' },
  { value: 'zh', label: '中文 (Chinese)' },
  { value: 'ar', label: 'العربية (Arabic)' },
];

export function getPreferences(): Preferences {
  return { ...defaultPreferences, ...storage.get<Partial<Preferences>>(StorageKeys.preferences, {}) };
}

export function updatePreferences(patch: Partial<Preferences>) {
  storage.set(StorageKeys.preferences, { ...getPreferences(), ...patch });
}

export function usePreferences(): [Preferences, (patch: Partial<Preferences>) => void] {
  const [stored] = useStorage<Partial<Preferences>>(StorageKeys.preferences, {});
  return [{ ...defaultPreferences, ...stored }, updatePreferences];
}
