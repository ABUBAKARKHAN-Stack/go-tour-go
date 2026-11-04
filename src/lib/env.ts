/**
 * Client-side configuration. Only EXPO_PUBLIC_* variables are inlined into the
 * bundle; they must be referenced statically (process.env.EXPO_PUBLIC_X) for
 * Expo to replace them at build time. Never put secrets here.
 */
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabasePublishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? '';
const mapStyleUrl =
  process.env.EXPO_PUBLIC_MAP_STYLE_URL || 'https://tiles.openfreemap.org/styles/liberty';

export const env = {
  supabaseUrl,
  supabasePublishableKey,
  mapStyleUrl,
} as const;

/** Names of required variables that are missing, for the setup screen. */
export const missingEnv: string[] = [
  !supabaseUrl && 'EXPO_PUBLIC_SUPABASE_URL',
  !supabasePublishableKey && 'EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
].filter((v): v is string => Boolean(v));

export const isBackendConfigured = missingEnv.length === 0;
