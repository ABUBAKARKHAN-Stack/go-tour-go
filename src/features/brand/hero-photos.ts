import { Image } from 'expo-image';

/**
 * Real Pakistan photos for onboarding and the sign-in screens (Wikimedia
 * Commons, credited on screen as their licences require). They load on the
 * phone and stay in the disk cache; while loading or offline the bundled
 * Badshahi Mosque photo shows instead (FALLBACK).
 */
export type HeroPhoto = { uri: string; credit: string; place: string };

const commons = (path: string) => `https://upload.wikimedia.org/wikipedia/commons/thumb/${path}`;

export const HERO_PHOTOS = {
  discover: { uri: commons('a/a9/Upper_kachura.jpg/1280px-Upper_kachura.jpg'), credit: 'Adil Riaz', place: 'Upper Kachura Lake, Skardu' },
  companion: {
    uri: commons('e/ed/Lake_Saiful_Malook_naran_08.jpg/1280px-Lake_Saiful_Malook_naran_08.jpg'),
    credit: 'Faizan Farooq572',
    place: 'Lake Saiful Muluk, Naran',
  },
  connect: {
    uri: commons('2/21/Nanga_parbat%2C_fairy_medow%2C_Pak_by_gul791.jpg/1280px-Nanga_parbat%2C_fairy_medow%2C_Pak_by_gul791.jpg'),
    credit: 'Atif Gulzar',
    place: 'Nanga Parbat from Fairy Meadows',
  },
  signIn: {
    uri: commons('b/bd/Ali_Mujtaba_WLM2015_FAISAL_MOSQUE_m_10.jpg/1280px-Ali_Mujtaba_WLM2015_FAISAL_MOSQUE_m_10.jpg'),
    credit: 'Ali Mujtaba',
    place: 'Faisal Mosque, Islamabad',
  },
  signUp: { uri: commons('4/41/Saiful_muluk_during_June.JPG/1280px-Saiful_muluk_during_June.JPG'), credit: 'Almazi', place: 'Lake Saiful Muluk in June' },
} satisfies Record<string, HeroPhoto>;

export const FALLBACK_PHOTO = require('../../../assets/illustrations/auth-hero.jpg');

/** Warms the cache so swiping onboarding or opening sign-in shows photos at once. */
export function prefetchHeroPhotos() {
  Image.prefetch(Object.values(HERO_PHOTOS).map((p) => p.uri), 'disk').catch(() => undefined);
}
