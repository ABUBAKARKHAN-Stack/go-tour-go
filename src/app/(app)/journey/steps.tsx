import { router } from 'expo-router';
import { ArrowLeft, ChevronLeft, ChevronRight, Landmark, Maximize2, TriangleAlert } from 'lucide-react-native';
import { useMemo, useRef, useState } from 'react';
import { FlatList, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton, IconButton } from '@/components/app-button';
import { EmptyState } from '@/components/states';
import { Text } from '@/components/text';
import { JourneyMap } from '@/features/journey/journey-map';
import { routeIndex, useJourney } from '@/features/journey/journey-store';
import { ManeuverIcon } from '@/features/journey/maneuver-icon';
import { stepStarts } from '@/features/journey/navigation';
import { buildRouteIndex, pointAlong } from '@/features/journey/route-geometry';
import { formatDistance } from '@/lib/geo';
import { haptics } from '@/lib/haptics';
import { tx } from '@/lib/i18n';
import { cardShadow, colors } from '@/lib/theme';

const CARD_AREA = 250;

/**
 * Route preview, turn by turn (like the step preview in map apps): swipe the
 * cards or tap the arrows and the map flies to each turn, tilted to face
 * along the road. Works before starting, and for routes that start
 * somewhere else.
 */
export default function RouteSteps() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const journey = useJourney();
  const route = journey.route;
  const list = useRef<FlatList<number>>(null);
  const [current, setCurrent] = useState(0);
  // Null: the whole route in view.
  const [focused, setFocused] = useState(true);

  const index = useMemo(() => (route ? (routeIndex() ?? buildRouteIndex(route.coordinates)) : null), [route]);
  const starts = useMemo(() => (route ? stepStarts(route.steps) : []), [route]);
  const steps = useMemo(() => route?.steps ?? [], [route]);

  // Each turn's spot and the direction of the road just after it (just before, for the last).
  const focus = useMemo(() => {
    if (!route || !index || !focused) return null;
    const along = starts[current] ?? 0;
    const last = current >= steps.length - 1;
    const at = pointAlong(index, last ? Math.max(0, index.total - 5) : along + 2);
    const loc = steps[current]?.location;
    return { longitude: loc?.[0] ?? at.longitude, latitude: loc?.[1] ?? at.latitude, bearing: at.bearing };
  }, [route, index, focused, starts, current, steps]);

  const go = (i: number) => {
    const next = Math.max(0, Math.min(steps.length - 1, i));
    if (next === current) return;
    haptics.select();
    setCurrent(next);
    setFocused(true);
    list.current?.scrollToIndex({ index: next, animated: true });
  };

  if (!route || !index) {
    return (
      <View className="flex-1 justify-center bg-background" style={{ paddingTop: insets.top }}>
        <EmptyState title={tx('No route to preview')} message={tx('Plan a journey first.')} actionLabel={tx('Plan a journey')} onAction={() => router.replace('/search')} />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <JourneyMap
        route={route}
        index={index}
        items={journey.items}
        progress={null}
        fix={null}
        follow={false}
        focus={focus}
        padding={{ top: insets.top + 72, bottom: CARD_AREA + insets.bottom }}
      />

      <View className="absolute left-4 right-4 flex-row items-center gap-3 rounded-[20px] bg-card px-3 py-2.5" style={{ top: insets.top + 8, ...cardShadow }}>
        <IconButton icon={ArrowLeft} flip label={tx('Go back')} onPress={() => router.back()} />
        <View className="flex-1">
          <Text className="text-base font-semibold text-heading">{tx('Route preview')}</Text>
          <Text className="text-xs text-faint">{journey.target ? tx('To {0}', { 0: journey.target.name }) : ''}</Text>
        </View>
        <IconButton icon={Maximize2} label={tx('Whole route')} active={!focused} onPress={() => setFocused(false)} />
      </View>

      <View className="absolute bottom-0 left-0 right-0 gap-3 pt-3" style={{ paddingBottom: insets.bottom + 12 }}>
        <FlatList
          ref={list}
          data={steps.map((_, i) => i)}
          keyExtractor={(i) => String(i)}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
          onMomentumScrollEnd={(e) => {
            const i = Math.round(e.nativeEvent.contentOffset.x / width);
            if (i !== current) haptics.select();
            setCurrent(i);
            setFocused(true);
          }}
          renderItem={({ item: i }) => {
            const step = steps[i];
            const from = starts[i] ?? 0;
            const to = starts[i + 1] ?? index.total;
            // What lies on this stretch of road.
            const onStretch = journey.items.filter((it) => it.along >= from && it.along < to).slice(0, 3);
            return (
              <View style={{ width }} className="px-4">
                <View className="gap-3 rounded-[24px] bg-card p-4" style={cardShadow}>
                  <View className="flex-row items-start gap-3">
                    <View className="h-12 w-12 items-center justify-center rounded-2xl bg-primary">
                      <ManeuverIcon step={step} size={26} />
                    </View>
                    <View className="flex-1 gap-0.5">
                      <Text className="text-[11px] font-bold uppercase tracking-[1.4px] text-faint">
                        {tx('Step {0} of {1}', { 0: i + 1, 1: steps.length })}
                      </Text>
                      <Text className="text-[17px] font-semibold leading-6 text-heading">{step.instruction}</Text>
                      {step.distance > 0 && step.type !== 'arrive' ? (
                        <Text className="text-sm text-muted-foreground">{tx('Then {0}', { 0: formatDistance(step.distance) })}</Text>
                      ) : null}
                    </View>
                  </View>
                  {onStretch.length ? (
                    <View className="gap-1.5 border-t border-border pt-2.5">
                      {onStretch.map((it) => (
                        <View key={it.id} className="flex-row items-center gap-2">
                          {it.kind === 'hazard' ? <TriangleAlert color={colors.destructive} size={15} /> : <Landmark color={colors.primary} size={15} />}
                          <Text className="flex-1 text-sm text-foreground">{it.name}</Text>
                        </View>
                      ))}
                    </View>
                  ) : null}
                </View>
              </View>
            );
          }}
        />
        <View className="flex-row items-center gap-2 px-4">
          <AppButton label={tx('Previous')} icon={ChevronLeft} variant="secondary" size="sm" disabled={current === 0} onPress={() => go(current - 1)} className="flex-1" />
          <AppButton label={tx('Next')} icon={ChevronRight} variant="secondary" size="sm" disabled={current >= steps.length - 1} onPress={() => go(current + 1)} className="flex-1" />
        </View>
      </View>
    </View>
  );
}

