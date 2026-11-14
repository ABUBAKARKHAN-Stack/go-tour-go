import type { ReactNode } from 'react';
import { GestureDetector, usePanGesture, usePinchGesture, useSimultaneousGestures, useTapGesture } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

const MAX_SCALE = 5;
const DOUBLE_TAP_SCALE = 2.5;
const SETTLE = { duration: 300, dampingRatio: 1 } as const;

function clamp(v: number, min: number, max: number) {
  'worklet';
  return Math.min(max, Math.max(min, v));
}

/**
 * Pinch to zoom around the fingers, double-tap to zoom in where tapped (and
 * back out), drag to look around while zoomed, all on the UI thread.
 * `onZoomChange` says when it is zoomed in, so the screen around it can stop
 * paging or closing on a swipe meanwhile.
 */
export function Zoomable({
  width,
  height,
  children,
  onZoomChange,
}: {
  width: number;
  height: number;
  children: ReactNode;
  onZoomChange?: (zoomed: boolean) => void;
}) {
  const scale = useSharedValue(1);
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const startScale = useSharedValue(1);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);
  const origin = useSharedValue({ x: 0, y: 0 });
  // Panning the picture only makes sense zoomed in; otherwise swipes belong to the screen.
  const zoomed = useSharedValue(false);

  const report = (value: boolean) => onZoomChange?.(value);

  /** Keeps the zoomed picture covering the screen (no empty edges dragged in). */
  const settle = (s: number) => {
    'worklet';
    const maxX = (width * (s - 1)) / 2;
    const maxY = (height * (s - 1)) / 2;
    x.set(withSpring(clamp(x.get(), -maxX, maxX), SETTLE));
    y.set(withSpring(clamp(y.get(), -maxY, maxY), SETTLE));
    const isZoomed = s > 1.01;
    if (isZoomed !== zoomed.get()) {
      zoomed.set(isZoomed);
      scheduleOnRN(report, isZoomed);
    }
  };

  const pinch = usePinchGesture({
    // Activation carries the focal point (the first touch alone doesn't).
    onActivate: (e) => {
      'worklet';
      startScale.set(scale.get());
      startX.set(x.get());
      startY.set(y.get());
      origin.set({ x: e.focalX - width / 2, y: e.focalY - height / 2 });
    },
    onUpdate: (e) => {
      'worklet';
      const s = clamp(startScale.get() * e.scale, 0.8, MAX_SCALE);
      const k = s / startScale.get();
      // The point under the fingers stays under the fingers.
      const o = origin.get();
      x.set(o.x - (o.x - startX.get()) * k);
      y.set(o.y - (o.y - startY.get()) * k);
      scale.set(s);
    },
    onDeactivate: () => {
      'worklet';
      if (scale.get() < 1.05) {
        scale.set(withSpring(1, SETTLE));
        x.set(withSpring(0, SETTLE));
        y.set(withSpring(0, SETTLE));
        if (zoomed.get()) {
          zoomed.set(false);
          scheduleOnRN(report, false);
        }
        return;
      }
      settle(scale.get());
    },
  });

  const pan = usePanGesture({
    enabled: zoomed,
    onBegin: () => {
      'worklet';
      startX.set(x.get());
      startY.set(y.get());
    },
    onUpdate: (e) => {
      'worklet';
      x.set(startX.get() + e.translationX);
      y.set(startY.get() + e.translationY);
    },
    onDeactivate: () => {
      'worklet';
      settle(scale.get());
    },
  });

  const doubleTap = useTapGesture({
    numberOfTaps: 2,
    onActivate: (e) => {
      'worklet';
      if (scale.get() > 1.01) {
        scale.set(withSpring(1, SETTLE));
        x.set(withSpring(0, SETTLE));
        y.set(withSpring(0, SETTLE));
        zoomed.set(false);
        scheduleOnRN(report, false);
        return;
      }
      const s = DOUBLE_TAP_SCALE;
      const maxX = (width * (s - 1)) / 2;
      const maxY = (height * (s - 1)) / 2;
      // Zoom in on the tapped spot.
      scale.set(withSpring(s, SETTLE));
      x.set(withSpring(clamp(-(e.x - width / 2) * (s - 1), -maxX, maxX), SETTLE));
      y.set(withSpring(clamp(-(e.y - height / 2) * (s - 1), -maxY, maxY), SETTLE));
      zoomed.set(true);
      scheduleOnRN(report, true);
    },
  });

  const gesture = useSimultaneousGestures(pinch, pan, doubleTap);
  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: x.get() }, { translateY: y.get() }, { scale: scale.get() }],
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[{ width, height, alignItems: 'center', justifyContent: 'center' }, style]}>{children}</Animated.View>
    </GestureDetector>
  );
}
