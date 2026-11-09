/**
 * Hex values of the design tokens in global.css, for native props that cannot
 * take a className (map paint, tab bar, icons, status bar). Keep in sync.
 */
export const colors = {
  background: '#F6FAFC',
  foreground: '#15384F',
  card: '#FFFFFF',
  primary: '#19709B',
  primaryForeground: '#FFFFFF',
  primaryPressed: '#135A7D',
  primarySoft: '#E8F2F9',
  /** End colour of the primary button gradient (white text 4.6:1). */
  primaryGradientEnd: '#2381B6',
  accent: '#1672AE',
  accentForeground: '#FFFFFF',
  accentSoft: '#E1F0FA',
  secondary: '#EEF5FA',
  muted: '#EEF4F8',
  mutedForeground: '#4E6B7D',
  faint: '#6B8394',
  border: '#DCE8F0',
  borderStrong: '#C3D6E2',
  destructive: '#B4382F',
  destructiveSoft: '#F8E2DF',
  success: '#2F7D5B',
  warning: '#C98A1B',
  rating: '#F2A93B',
  info: '#1672AE',
  inverse: '#1A5372',
  heading: '#1A5372',
  sky: '#2E9FD9',
  sand: '#EFE0C9',
  mint: '#E4F4EE',
  peach: '#FCEBDD',
  lemon: '#FDF3DC',
  route: '#19709B',
  routeCasing: '#FFFFFF',
  friend: '#2E9FD9',
  /** Shadow tint (navy) for boxShadow strings. */
  shadow: '21, 56, 79',
} as const;

/** Soft navy shadow, e.g. shadow(0.1, 8, 24) → "0 8px 24px rgba(21, 56, 79, 0.1)". */
export const shadow = (alpha: number, y = 4, blur = 14) => `0 ${y}px ${blur}px rgba(${colors.shadow}, ${alpha})`;

/** CSS gradient for the primary button and other branded fills. */
export const brandGradient = 'linear-gradient(90deg, #19709B, #2381B6)';

export const severityColors = {
  low: '#1672AE',
  medium: '#C98A1B',
  high: '#C8643B',
  critical: '#B4382F',
} as const;

export const fonts = {
  display: 'Outfit_700Bold',
  displaySemi: 'Outfit_600SemiBold',
  script: 'Caveat_700Bold',
  regular: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semibold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
  urdu: 'NotoNastaliqUrdu_400Regular',
  urduBold: 'NotoNastaliqUrdu_700Bold',
} as const;
