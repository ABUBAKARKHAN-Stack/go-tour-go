import { useEffect, useState, type ReactNode } from 'react';
import { BackHandler, Modal, Pressable, StyleSheet, useWindowDimensions, View, type DimensionValue } from 'react-native';
import { GestureDetector, GestureHandlerRootView, usePanGesture } from 'react-native-gesture-handler';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import Animated, {
  cancelAnimation,
  Easing,
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import { tx } from '@/lib/i18n';

/**
 * Bottom sheet that behaves like a phone's: it follows the finger, a flick or
 * a long enough drag down closes it, a short one springs it back; the dimmed
 * backdrop fades with it, and tapping the backdrop or Android back closes it.
 *
 * Drag from the handle and `header` (title row, close button); with
 * `dragAnywhere`, from the whole sheet (only for sheets without a scrolling
 * list, which would fight the drag).
 *
 * `inline` draws it inside the screen instead of in a Modal, so a text input
 * in it follows the keyboard (the AI chat); render it last in the screen.
 */
export function Sheet({
  visible,
  onClose,
  header,
  children,
  dragAnywhere = false,
  height,
  inline = false,
  padded = true,
}: {
  visible: boolean;
  onClose: () => void;
  /** Title row and actions; part of the drag zone. */
  header?: ReactNode;
  children?: ReactNode;
  dragAnywhere?: boolean;
  /** A fixed height (e.g. '88%'); by default the sheet fits its content. */
  height?: DimensionValue;
  inline?: boolean;
  /** Horizontal padding and the safe-area gap at the bottom. */
  padded?: boolean;
}) {
  const insets = useSafeAreaInsets();
  const { height: screen } = useWindowDimensions();
  const reduced = useReducedMotion();
  // Stays mounted while the closing animation plays.
  const [mounted, setMounted] = useState(visible);
  const y = useSharedValue(screen);
  const sheetHeight = useSharedValue(screen * 0.6);
  const start = useSharedValue(0);

  if (visible && !mounted) setMounted(true);

  useEffect(() => {
    if (!mounted) return;
    if (visible) {
      y.set(withTiming(0, { duration: reduced ? 0 : 300, easing: SHEET_EASE }));
    } else {
      // Closed from outside (a button, the backdrop): slide away, then unmount.
      y.set(withTiming(sheetHeight.get() + 40, { duration: reduced ? 0 : 220, easing: SHEET_EASE }, (done) => {
        if (done) scheduleOnRN(setMounted, false);
      }));
    }
  }, [visible, mounted, reduced, y, sheetHeight]);

  // Dragged away: it is already off screen, so unmount and tell the owner in one go.
  const dismissed = () => {
    setMounted(false);
    onClose();
  };

  // Inline sheets handle Android back themselves (a Modal has onRequestClose).
  useEffect(() => {
    if (!inline || !visible) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose();
      return true;
    });
    return () => sub.remove();
  }, [inline, visible, onClose]);

  const pan = usePanGesture({
    activeOffsetY: [-8, 8],
    failOffsetX: [-24, 24],
    onBegin: () => {
      'worklet';
      // Grab it where it is, even mid-animation.
      cancelAnimation(y);
      start.set(y.get());
    },
    onUpdate: (e) => {
      'worklet';
      const next = start.get() + e.translationY;
      // Down follows the finger; up past the top resists.
      y.set(next >= 0 ? next : rubberband(next, sheetHeight.get()));
    },
    onDeactivate: (e) => {
      'worklet';
      const h = sheetHeight.get();
      // Where a flick was heading decides, so a quick short swipe closes it.
      const projected = y.get() + project(e.velocityY);
      if (projected > h * 0.4) {
        y.set(withSpring(h + 40, { duration: 300, dampingRatio: 1, velocity: e.velocityY, overshootClamping: true }, (done) => {
          if (done) scheduleOnRN(dismissed);
        }));
      } else {
        y.set(withSpring(0, { duration: 300, dampingRatio: 0.8, velocity: e.velocityY }));
      }
    },
    onFinalize: (e) => {
      'worklet';
      // Touched but never dragged (a tap on the handle): settle where it belongs.
      if (e.canceled && y.get() !== 0 && y.get() < sheetHeight.get()) y.set(withSpring(0, { duration: 300, dampingRatio: 1 }));
    },
  });

  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: y.get() }] }));
  const backdropStyle = useAnimatedStyle(() => ({
    opacity: interpolate(y.get(), [0, sheetHeight.get()], [1, 0], Extrapolation.CLAMP),
  }));

  if (!mounted) return null;

  const grip = (
    <View className={padded ? 'px-6' : undefined}>
      <View className="items-center pb-2 pt-3" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <View className="h-1 w-10 rounded-full bg-border-strong" />
      </View>
      {header}
    </View>
  );

  const sheet = dragAnywhere ? (
    <GestureDetector gesture={pan}>
      <Animated.View
        onLayout={(e) => sheetHeight.set(e.nativeEvent.layout.height)}
        className="rounded-t-[28px] bg-background"
        style={[{ height, maxHeight: screen - insets.top - 24, paddingBottom: padded ? insets.bottom + 16 : 0 }, sheetStyle]}
      >
        {grip}
        <View className={padded ? 'gap-4 px-6 pt-2' : undefined} style={height ? { flex: 1 } : undefined}>
          {children}
        </View>
      </Animated.View>
    </GestureDetector>
  ) : (
    <Animated.View
      onLayout={(e) => sheetHeight.set(e.nativeEvent.layout.height)}
      className="rounded-t-[28px] bg-background"
      style={[{ height, maxHeight: screen - insets.top - 24, paddingBottom: padded ? insets.bottom + 16 : 0 }, sheetStyle]}
    >
      <GestureDetector gesture={pan}>
        <View collapsable={false}>{grip}</View>
      </GestureDetector>
      <View className={padded ? 'px-6 pt-2' : undefined} style={height ? { flex: 1 } : undefined}>
        {children}
      </View>
    </Animated.View>
  );
  const content = (
    <View style={StyleSheet.absoluteFill} className="justify-end">
      <Animated.View style={[StyleSheet.absoluteFill, backdropStyle]}>
        <Pressable style={StyleSheet.absoluteFill} className="bg-black/40" onPress={onClose} accessibilityRole="button" accessibilityLabel={tx('Close')} />
      </Animated.View>
      {inline ? (
        <KeyboardAvoidingView behavior="padding" className="justify-end" style={height ? { height: '100%' } : undefined}>
          {sheet}
        </KeyboardAvoidingView>
      ) : (
        sheet
      )}
    </View>
  );

  if (inline) return content;
  return (
    <Modal visible transparent animationType="none" statusBarTranslucent navigationBarTranslucent onRequestClose={onClose}>
      {/* A Modal is its own window on Android: gestures need their own root there. */}
      <GestureHandlerRootView style={{ flex: 1 }}>{content}</GestureHandlerRootView>
    </Modal>
  );
}

const SHEET_EASE = Easing.bezier(0.32, 0.72, 0, 1);

/** Where a flick would come to rest if it kept decelerating (Apple's decay form). */
function project(velocity: number, decelerationRate = 0.998) {
  'worklet';
  return ((velocity / 1000) * decelerationRate) / (1 - decelerationRate);
}

/** Past an edge, the further you pull the less it follows. */
function rubberband(overshoot: number, dimension: number, constant = 0.55) {
  'worklet';
  return (overshoot * dimension * constant) / (dimension + constant * Math.abs(overshoot));
}
