import { useState } from 'react';
import type { ViewStyle } from 'react-native';
import { cubicBezier, Easing, FadeInDown, ReduceMotion, useReducedMotion, type CSSStyle } from 'react-native-reanimated';

/**
 * Motion vocabulary for the app (see the expo-animation skill):
 * - press feedback: scale 0.97 in 120 ms, ease-out, on press-in;
 * - moving indicators (tab pill, segmented control): 250 ms ease-in-out;
 * - entrances: 250 ms fade + 12 pt rise, ease-out, 40 ms stagger, only for
 *   content the traveller asked for and is waiting on;
 * - tab switches don't animate the screen (tabs are peers, not a hierarchy).
 * Everything honours the system Reduce Motion setting.
 */
export const CSS_EASE_OUT = cubicBezier(0.23, 1, 0.32, 1);
export const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);
export const EASE_IN_OUT = Easing.bezier(0.77, 0, 0.175, 1);

/**
 * Press feedback for a button-like element: spread `handlers` on the Pressable
 * and put `style` on the view that should shrink (the Pressable's wrapper).
 */
export function usePressScale(scale = 0.97) {
  const [pressed, setPressed] = useState(false);
  const reduced = useReducedMotion();
  const style: CSSStyle<ViewStyle> = {
    transform: [{ scale: pressed && !reduced ? scale : 1 }],
    opacity: pressed && reduced ? 0.85 : 1,
    transitionProperty: ['transform', 'opacity'],
    transitionDuration: 120,
    transitionTimingFunction: CSS_EASE_OUT,
  };
  return {
    style,
    handlers: { onPressIn: () => setPressed(true), onPressOut: () => setPressed(false) },
  };
}

/** Staggered entrance for the n-th block of content that just loaded. */
export function enterAt(index: number) {
  return FadeInDown.duration(250)
    .delay(Math.min(index, 8) * 40)
    .easing(EASE_OUT)
    .withInitialValues({ opacity: 0, transform: [{ translateY: 12 }] })
    .reduceMotion(ReduceMotion.System);
}
