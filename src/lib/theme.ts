/**
 * Hex values of the design tokens in global.css, for native props that cannot
 * take a className (map paint, tab bar, icons, status bar). Keep in sync.
 */
export const colors = {
  background: '#160B2E',
  foreground: '#FCFFFF',
  primary: '#723CD6',
  primaryForeground: '#FCFFFF',
  accent: '#EDB158',
  accentForeground: '#160B2E',
  secondary: '#2C1852',
  card: '#201040',
  muted: '#2A1654',
  mutedForeground: '#DCD2F5',
  border: '#8C66D6',
  destructive: '#F43F5E',
  success: '#34D399',
  warning: '#F59E0B',
  info: '#38BDF8',
  route: '#EDB158',
  friend: '#38BDF8',
} as const;

export const severityColors = {
  low: '#38BDF8',
  medium: '#F59E0B',
  high: '#F97316',
  critical: '#F43F5E',
} as const;
