import { isUrdu } from '@/lib/i18n';

/**
 * Fonts are loaded at runtime (useFonts) rather than embedded with the expo-font
 * config plugin, so they ship in over-the-air updates without a new build.
 * Only the weights the design uses are bundled; the Urdu Nastaliq font (about
 * 1 MB) loads only when the app language is Urdu.
 */
const latin = {
  Outfit_600SemiBold: require('@expo-google-fonts/outfit/600SemiBold/Outfit_600SemiBold.ttf'),
  Outfit_700Bold: require('@expo-google-fonts/outfit/700Bold/Outfit_700Bold.ttf'),
  Caveat_700Bold: require('@expo-google-fonts/caveat/700Bold/Caveat_700Bold.ttf'),
  PlusJakartaSans_400Regular: require('@expo-google-fonts/plus-jakarta-sans/400Regular/PlusJakartaSans_400Regular.ttf'),
  PlusJakartaSans_500Medium: require('@expo-google-fonts/plus-jakarta-sans/500Medium/PlusJakartaSans_500Medium.ttf'),
  PlusJakartaSans_600SemiBold: require('@expo-google-fonts/plus-jakarta-sans/600SemiBold/PlusJakartaSans_600SemiBold.ttf'),
  PlusJakartaSans_700Bold: require('@expo-google-fonts/plus-jakarta-sans/700Bold/PlusJakartaSans_700Bold.ttf'),
};

const urdu = {
  NotoNastaliqUrdu_400Regular: require('@expo-google-fonts/noto-nastaliq-urdu/400Regular/NotoNastaliqUrdu_400Regular.ttf'),
  NotoNastaliqUrdu_700Bold: require('@expo-google-fonts/noto-nastaliq-urdu/700Bold/NotoNastaliqUrdu_700Bold.ttf'),
};

export const fontAssets = isUrdu ? { ...latin, ...urdu } : latin;
