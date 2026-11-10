import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { colors } from '@/lib/theme';

/**
 * The traveller during a journey: a navigation arrow (blue with a white
 * outline) pointing the way they are heading, like in turn-by-turn apps.
 * `rotation` is degrees clockwise on screen: the heading minus the map's
 * bearing (0 when the map already turns with the traveller).
 */
export function NavArrow({ rotation = 0, size = 44 }: { rotation?: number; size?: number }) {
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ width: size, height: size, transform: [{ rotate: `${Math.round(rotation)}deg` }] }}
    >
      <Svg width={size} height={size} viewBox="0 0 48 48">
        {/* Soft shadow under the arrow so it stands out on any map. */}
        <Path d="M24 7 L39 41 L24 33 L9 41 Z" fill="rgba(21,56,79,0.28)" transform="translate(0 2)" />
        <Path d="M24 5 L39 39 L24 31 L9 39 Z" fill={colors.primary} stroke="#FFFFFF" strokeWidth={3.5} strokeLinejoin="round" />
      </Svg>
    </View>
  );
}

/** A usable compass heading, or null (GPS reports -1 or nothing while standing still). */
export function validHeading(h: number | null | undefined): number | null {
  return h != null && Number.isFinite(h) && h >= 0 ? h : null;
}
