/**
 * Hex values of the design tokens in global.css, for native props that cannot
 * take a className (map paint, tab bar, icons, status bar). Keep in sync.
 */
export const colors = {
  background: '#FBF8F3',
  foreground: '#1C1A17',
  card: '#FFFFFF',
  primary: '#0F4C4A',
  primaryForeground: '#FFFFFF',
  primaryPressed: '#0B3A38',
  primarySoft: '#DCEBE8',
  accent: '#C8643B',
  accentForeground: '#FFFFFF',
  accentSoft: '#F6E3D9',
  secondary: '#F3EDE4',
  muted: '#F5EFE6',
  mutedForeground: '#5E574D',
  faint: '#8A8174',
  border: '#EAE1D3',
  borderStrong: '#D9CCB8',
  destructive: '#B4382F',
  destructiveSoft: '#F8E2DF',
  success: '#2F7D5B',
  warning: '#C98A1B',
  rating: '#E3A94B',
  info: '#2F6FA3',
  inverse: '#1C1A17',
  route: '#0F4C4A',
  routeCasing: '#FFFFFF',
  friend: '#2F6FA3',
} as const;

export const severityColors = {
  low: '#2F6FA3',
  medium: '#C98A1B',
  high: '#C8643B',
  critical: '#B4382F',
} as const;

export const fonts = {
  display: 'Fraunces_600SemiBold',
  regular: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semibold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
  urdu: 'NotoNastaliqUrdu_400Regular',
  urduBold: 'NotoNastaliqUrdu_700Bold',
} as const;
