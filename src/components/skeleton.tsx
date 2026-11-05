import { View } from 'react-native';
import Animated, { useReducedMotion } from 'react-native-reanimated';

type Variant = 'list' | 'cards' | 'feed' | 'profile' | 'detail';

/** Pulse for the whole skeleton at once (one animation, not one per block). */
const PULSE = { from: { opacity: 1 }, to: { opacity: 0.45 } };

function Block({ className }: { className: string }) {
  return <View className={`rounded-xl bg-muted ${className}`} />;
}

function Row() {
  return (
    <View className="flex-row items-center gap-3 rounded-3xl border border-border bg-card p-2.5">
      <Block className="h-16 w-16 rounded-2xl" />
      <View className="flex-1 gap-2">
        <Block className="h-4 w-3/5" />
        <Block className="h-3 w-2/5" />
      </View>
    </View>
  );
}

function Tile() {
  return (
    <View className="w-60 gap-2.5">
      <Block className="h-64 w-full rounded-3xl" />
      <Block className="h-5 w-3/4" />
      <Block className="h-3 w-1/2" />
    </View>
  );
}

function Post() {
  return (
    <View className="gap-3 rounded-3xl border border-border bg-card p-4">
      <View className="flex-row items-center gap-3">
        <Block className="h-10 w-10 rounded-full" />
        <View className="flex-1 gap-2">
          <Block className="h-3.5 w-1/3" />
          <Block className="h-3 w-1/4" />
        </View>
      </View>
      <Block className="h-3.5 w-full" />
      <Block className="h-3.5 w-4/5" />
      <Block className="h-44 w-full rounded-2xl" />
    </View>
  );
}

/**
 * Skeleton placeholders shaped like the content that is loading. Pulses gently
 * (900 ms, alternating); static when Reduce Motion is on.
 */
export function Skeleton({ variant, label }: { variant: Variant; label: string }) {
  const reduced = useReducedMotion();
  const pulse = reduced
    ? null
    : ({
        animationName: PULSE,
        animationDuration: 900,
        animationIterationCount: 'infinite',
        animationDirection: 'alternate',
        animationTimingFunction: 'ease-in-out',
      } as const);
  return (
    <Animated.View accessibilityRole="progressbar" accessibilityLabel={label} className="gap-3 py-2" style={pulse ?? undefined}>
      {variant === 'cards' ? (
        <View className="flex-row gap-4 overflow-hidden">
          <Tile />
          <Tile />
        </View>
      ) : variant === 'feed' ? (
        <>
          <Post />
          <Post />
        </>
      ) : variant === 'profile' ? (
        <>
          <View className="items-center gap-3 py-4">
            <Block className="h-24 w-24 rounded-full" />
            <Block className="h-5 w-40" />
            <Block className="h-3 w-24" />
          </View>
          <Row />
          <Row />
        </>
      ) : variant === 'detail' ? (
        <>
          <Block className="h-72 w-full rounded-none" />
          <View className="gap-3 px-6">
            <Block className="h-3 w-1/3" />
            <Block className="h-8 w-3/4" />
            <Block className="h-3 w-1/2" />
            <View className="flex-row gap-2 pt-2">
              <Block className="h-14 flex-1 rounded-full" />
              <Block className="h-14 w-14 rounded-2xl" />
              <Block className="h-14 w-14 rounded-2xl" />
            </View>
            <Block className="mt-2 h-12 w-full rounded-full" />
            <Block className="h-3.5 w-full" />
            <Block className="h-3.5 w-11/12" />
            <Block className="h-3.5 w-4/5" />
          </View>
        </>
      ) : (
        <>
          <Row />
          <Row />
          <Row />
          <Row />
        </>
      )}
    </Animated.View>
  );
}
