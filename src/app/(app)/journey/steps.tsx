import { router } from 'expo-router';
import { ArrowLeft, ChevronLeft, ChevronRight, Landmark, Maximize2, Navigation, Route as RouteIcon, TriangleAlert } from 'lucide-react-native';
import { useMemo, useRef, useState } from 'react';
import { Alert, FlatList, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton, IconButton } from '@/components/app-button';
import { Sheet } from '@/components/sheet';
import { EmptyState } from '@/components/states';
import { Text } from '@/components/text';
import { JourneyMap } from '@/features/journey/journey-map';
import { useLastLocation } from '@/features/location/location-store';
import { AltRouteRow } from '@/features/journey/alt-route-row';
import type { AltRoute } from '@/features/journey/alternatives';
import { journeyStore, routeIndex, useJourney } from '@/features/journey/journey-store';
import { ManeuverIcon } from '@/features/journey/maneuver-icon';
import { formatEta, stepStarts } from '@/features/journey/navigation';
import { buildRouteIndex, pointAlong, projectEarliest } from '@/features/journey/route-geometry';
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
  const fix = useLastLocation();
  const route = journey.route;
  const list = useRef<FlatList<number>>(null);
  // During a journey: open at the next turn, show where you are, and mark the turns already behind.
  const active = journey.phase === 'active';
  const doneUpTo = active ? (journey.progress?.stepIndex ?? 0) : -1;
  const [current, setCurrent] = useState(() =>
    active ? Math.min(Math.max(0, (journey.route?.steps.length ?? 1) - 1), (journey.progress?.stepIndex ?? 0) + 1) : 0,
  );
  const [startAt] = useState(current);
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

  // Other ways to go, here too: see them on the map and in a list (with their landmarks), and switch.
  const [routesOpen, setRoutesOpen] = useState(false);
  const switchTo = (alt: AltRoute) => {
    haptics.select();
    setRoutesOpen(false);
    if (journeyStore.selectRoute(alt) !== 'switched') {
      Alert.alert(tx('Too late for that route'), tx('Its turn-off is already behind you.'));
      return;
    }
    // Start the new route's turns where you are now (navigating) or at its first turn.
    let next = 0;
    if (active && fix) {
      const along = projectEarliest(buildRouteIndex(alt.route.coordinates), fix, 60).along;
      const at = stepStarts(alt.route.steps).filter((st) => st <= along + 5).length - 1;
      next = Math.min(alt.route.steps.length - 1, Math.max(0, at) + 1);
    }
    setCurrent(next);
    setFocused(false); // the whole new route in view
    requestAnimationFrame(() => list.current?.scrollToOffset({ offset: next * width, animated: false }));
  };

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
        progress={active ? journey.progress : null}
        fix={active ? fix : null}
        follow={false}
        focus={focus}
        padding={{ top: insets.top + 72, bottom: CARD_AREA + (active ? 60 : 0) + insets.bottom }}
        alternatives={journey.alternatives}
        onSelectRoute={switchTo}
      />

      <View className="absolute left-4 right-4 flex-row items-center gap-3 rounded-[20px] bg-card px-3 py-2.5" style={{ top: insets.top + 8, ...cardShadow }}>
        <IconButton icon={ArrowLeft} flip label={tx('Go back')} onPress={() => router.back()} />
        <View className="flex-1">
          <Text className="text-base font-semibold text-heading">{active ? tx('Upcoming turns') : tx('Route preview')}</Text>
          <Text className="text-xs text-faint">{journey.target ? tx('To {0}', { 0: journey.target.name }) : ''}</Text>
        </View>
        {journey.alternatives.length ? (
          <IconButton icon={RouteIcon} label={tx('Other routes')} badge={journey.alternatives.length} onPress={() => setRoutesOpen(true)} />
        ) : null}
        <IconButton icon={Maximize2} label={tx('Whole route')} active={!focused} onPress={() => setFocused(false)} />
      </View>

      <Sheet
        visible={routesOpen}
        onClose={() => setRoutesOpen(false)}
        header={
          <View className="pb-2">
            <Text accessibilityRole="header" className="font-display text-[22px] leading-7 text-heading">
              {tx('Other routes')}
            </Text>
            <Text className="text-xs text-faint">
              {tx('Now: {0} · {1}', { 0: formatEta(route.duration), 1: formatDistance(route.distance) })}
            </Text>
          </View>
        }
      >
        {journey.alternatives.map((alt) => (
          <AltRouteRow key={alt.id} alt={alt} main={route} mainItems={journey.items} onPress={() => switchTo(alt)} />
        ))}
      </Sheet>

      <View className="absolute bottom-0 left-0 right-0 gap-3 pt-3" style={{ paddingBottom: insets.bottom + 12 }}>
        <FlatList
          ref={list}
          data={steps.map((_, i) => i)}
          keyExtractor={(i) => String(i)}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          initialScrollIndex={startAt}
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
            const done = i <= doneUpTo;
            // The next turn while navigating: how far it is from where you are now.
            const ahead = active && i === doneUpTo + 1 && journey.progress ? journey.progress.toManeuver : null;
            return (
              <View style={{ width }} className="px-4">
                <View className="gap-3 rounded-[24px] bg-card p-4" style={[cardShadow, done ? { opacity: 0.6 } : null]}>
                  <View className="flex-row items-start gap-3">
                    <View className="h-12 w-12 items-center justify-center rounded-2xl bg-primary">
                      <ManeuverIcon step={step} size={26} />
                    </View>
                    <View className="flex-1 gap-0.5">
                      <Text className="text-[11px] font-bold uppercase tracking-[1.4px] text-faint">
                        {done
                          ? tx('Step {0} of {1} · done', { 0: i + 1, 1: steps.length })
                          : ahead != null
                            ? tx('Next · in {0}', { 0: formatDistance(ahead) })
                            : tx('Step {0} of {1}', { 0: i + 1, 1: steps.length })}
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
        {active ? (
          // Guidance keeps running underneath; this goes straight back to it.
          <View className="px-4">
            <AppButton label={tx('Back to navigation')} icon={Navigation} onPress={() => (router.canGoBack() ? router.back() : router.replace('/journey/navigate'))} />
          </View>
        ) : null}
      </View>
    </View>
  );
}

