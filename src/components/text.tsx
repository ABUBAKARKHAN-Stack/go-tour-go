import { Text as RNText, TextInput as RNTextInput, type TextInputProps, type TextProps } from 'react-native';

import { fonts } from '@/lib/theme';

/**
 * Android picks a font file per family name, and `fontWeight` on a custom
 * family falls back to a synthetic or system font. So weight utilities in
 * className are mapped to the matching Plus Jakarta Sans file here, and
 * `font-display` selects Fraunces for editorial headings.
 */
export function fontFamilyFor(className?: string): string {
  if (!className) return fonts.regular;
  if (className.includes('font-display')) return fonts.display;
  if (/\bfont-(bold|extrabold|black)\b/.test(className)) return fonts.bold;
  if (/\bfont-semibold\b/.test(className)) return fonts.semibold;
  if (/\bfont-medium\b/.test(className)) return fonts.medium;
  return fonts.regular;
}

export function Text({ className, style, ...rest }: TextProps) {
  return <RNText className={className} style={[{ fontFamily: fontFamilyFor(className), fontWeight: 'normal' }, style]} {...rest} />;
}

export function TextInput({ className, style, ...rest }: TextInputProps) {
  return <RNTextInput className={className} style={[{ fontFamily: fontFamilyFor(className), fontWeight: 'normal' }, style]} {...rest} />;
}
