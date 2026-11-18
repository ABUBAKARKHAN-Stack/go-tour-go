import { Landmark, Route as RouteIcon } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/text';
import { formatDistance } from '@/lib/geo';
import { isUrdu, tx } from '@/lib/i18n';
import { colors } from '@/lib/theme';

import type { AltRoute } from './alternatives';
import type { JourneyItem } from './journey-items';
import { itemsAlong } from './journey-store';
import { formatEta } from './navigation';
import { viaRoad } from './route-names';
import type { Route } from '@/features/routing/osrm';

/** "3 min slower", "2 min faster" or "Same time". */
export function altDifference(delta: number) {
  const mins = Math.round(Math.abs(delta) / 60);
  return mins < 1 ? tx('Same time') : delta > 0 ? tx('{0} slower', { 0: formatEta(delta) }) : tx('{0} faster', { 0: formatEta(-delta) });
}

/**
 * Another way to go: time and distance, the road that makes it different,
 * how much slower or faster it is, and the landmarks it passes that the
 * chosen route doesn't. Tap to take it.
 */
export function AltRouteRow({ alt, main, mainItems, onPress }: { alt: AltRoute; main: Route; mainItems: JourneyItem[]; onPress: () => void }) {
  const road = viaRoad(alt.route.steps, { exclude: main.steps, urdu: isUrdu });
  const diff = altDifference(alt.delta);
  const onMain = new Set(mainItems.map((i) => i.id));
  const extra = itemsAlong(alt.route).filter((i) => i.kind === 'landmark' && !onMain.has(i.id));
  const names = extra.slice(0, 2).map((i) => i.name).join(', ') + (extra.length > 2 ? tx(' +{0} more', { 0: extra.length - 2 }) : '');
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={[formatEta(alt.route.duration), formatDistance(alt.route.distance), diff, extra.length ? tx('Also passes {0}', { 0: names }) : null].filter(Boolean).join(', ')}
      accessibilityHint={tx('Use this route')}
      onPress={onPress}
      className="min-h-14 flex-row items-center gap-3 py-2 active:opacity-70"
    >
      <View className="h-10 w-10 items-center justify-center rounded-xl bg-muted">
        <RouteIcon color={colors.mutedForeground} size={18} />
      </View>
      <View className="flex-1 gap-0.5">
        <View className="flex-row flex-wrap items-baseline justify-between gap-x-2">
          <Text className="text-base font-semibold text-heading">
            {formatEta(alt.route.duration)} · {formatDistance(alt.route.distance)}
          </Text>
          <Text className={`text-xs font-semibold ${alt.delta < -30 ? 'text-success' : 'text-muted-foreground'}`}>{diff}</Text>
        </View>
        <Text className="text-xs text-faint">{road ? tx('Via {0}', { 0: road }) : tx('Another way')}</Text>
        {extra.length ? (
          <View className="flex-row items-start gap-1.5">
            <Landmark color={colors.primary} size={13} style={{ marginTop: 2 }} />
            <Text className="flex-1 text-xs text-foreground">{tx('Also passes {0}', { 0: names })}</Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}
