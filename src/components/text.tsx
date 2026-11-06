import type { ReactNode } from 'react';
import { StyleSheet, Text as RNText, TextInput as RNTextInput, type TextInputProps, type TextProps, type TextStyle } from 'react-native';
import { useResolveClassNames } from 'uniwind';

import { isUrdu } from '@/lib/i18n';
import { fonts } from '@/lib/theme';

/**
 * Android picks a font file per family name, and `fontWeight` on a custom
 * family falls back to a synthetic or system font. So weight utilities in
 * className are mapped to the matching Plus Jakarta Sans file here, and
 * `font-display` selects Fraunces for editorial headings.
 *
 * Urdu text uses Noto Nastaliq Urdu (when the app is in Urdu), which needs
 * much taller lines than Latin text or its letters are clipped.
 */
export function fontFamilyFor(className?: string): string {
  if (!className) return fonts.regular;
  if (className.includes('font-display')) return fonts.display;
  if (/\bfont-(bold|extrabold|black)\b/.test(className)) return fonts.bold;
  if (/\bfont-semibold\b/.test(className)) return fonts.semibold;
  if (/\bfont-medium\b/.test(className)) return fonts.medium;
  return fonts.regular;
}

const ARABIC_SCRIPT = /[؀-ۿ]/;
const URDU_LINE_HEIGHT = 1.9;

function hasUrdu(children: ReactNode): boolean {
  if (typeof children === 'string') return ARABIC_SCRIPT.test(children);
  if (Array.isArray(children)) return children.some(hasUrdu);
  return false;
}

function UrduText({ className, style, ...rest }: TextProps) {
  const resolved = useResolveClassNames(className ?? '') as TextStyle;
  const flat = (StyleSheet.flatten(style) ?? {}) as TextStyle;
  const fontSize = flat.fontSize ?? resolved.fontSize ?? 14;
  const bold = className ? /\bfont-(semibold|bold|extrabold|black|display)\b/.test(className) : false;
  return (
    <RNText
      className={className}
      style={[
        style,
        { fontFamily: bold ? fonts.urduBold : fonts.urdu, fontWeight: 'normal', lineHeight: Math.round(fontSize * URDU_LINE_HEIGHT), letterSpacing: 0 },
      ]}
      {...rest}
    />
  );
}

export function Text(props: TextProps) {
  if (isUrdu && hasUrdu(props.children)) return <UrduText {...props} />;
  const { className, style, ...rest } = props;
  return <RNText className={className} style={[{ fontFamily: fontFamilyFor(className), fontWeight: 'normal' }, style]} {...rest} />;
}

export type TextInputRef = React.ComponentRef<typeof RNTextInput>;

export function TextInput({ className, style, ref, ...rest }: TextInputProps & { ref?: React.Ref<TextInputRef> }) {
  return <RNTextInput ref={ref} className={className} style={[{ fontFamily: fontFamilyFor(className), fontWeight: 'normal' }, style]} {...rest} />;
}
