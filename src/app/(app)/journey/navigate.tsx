import { useKeepAwake } from 'expo-keep-awake';
import { router, useLocalSearchParams } from 'expo-router';
import {
  ArrowUp,
  ArrowUpLeft,
  ArrowUpRight,
  CornerUpLeft,
  CornerUpRight,
  Flag,
  Landmark,
  LocateFixed,
  RefreshCw,
  Route as RouteIcon,
  RotateCw,
  TriangleAlert,
  Undo2,
  Volume2,
  VolumeX,
  X,
  type LucideIcon,
} from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton } from '@/components/app-button';
import { Text } from '@/components/text';
import { ReportHazardSheet } from '@/features/alerts/report-hazard-sheet';
import { JourneyMap } from '@/features/journey/journey-map';
import { journeyStore, routeIndex, speak, useJourney } from '@/features/journey/journey-store';
import { arrivalClock, formatEta } from '@/features/journey/navigation';
import { useLastLocation } from '@/features/location/location-store';
import { useProximityCard } from '@/features/proximity/proximity-store';
import { useTripActions, useTrips } from '@/features/trips/api';
import { simulator, useSimulator } from '@/features/proximity/simulator';
import type { RouteStep } from '@/features/routing/osrm';
import { formatDistance } from '@/lib/geo';
import { colors } from '@/lib/theme';
import { tx } from '@/lib/i18n';

function ManeuverIcon({ step }: { step: RouteStep | undefined }) {
  const props = { color: '#FFFFFF', size: 40, strokeWidth: 2.4 };
  if (!step) return <ArrowUp {...props} />;
  if (step.type === 'arrive') return <Flag {...props} />;
  if (step.type === 'roundabout' || step.type === 'rotary' || step.type === 'roundabout turn') return <RotateCw {...props} />;
  switch (step.modifier) {
    case 'uturn':
      return <Undo2 {...props} />;
    case 'right':
    case 'sharp right':
      return <CornerUpRight {...props} />;
    case 'left':
    case 'sharp left':
      return <CornerUpLeft {...props} />;
    case 'slight right':
      return <ArrowUpRight {...props} />;
    case 'slight left':
      return <ArrowUpLeft {...props} />;
    default:
      return <ArrowUp {...props} />;
  }
}

/**
 * Active navigation (design screen 09): next manoeuvre, what is coming up on
 * the route, time left, voice guidance, re-routing and arrival.
 */
export default function JourneyNavigate() {
  useKeepAwake();
  const params = useLocalSearchParams<{ background?: string }>();
  const insets = useSafeAreaInsets();
  const journey = useJourney();
  const fix = useLastLocation();
  const proximity = useProximityCard();
  const [overview, setOverview] = useState(false);
  const sim = useSimulator();
  const [reporting, setReporting] = useState(false);
  const trips = useTrips();
  const tripActions = useTripActions();
  const spokenFor = useRef<string | null>(null);

  // Say the landmark name when the "You're near" card appears during a journey.
  const nearId = proximity.visible ? proximity.hits[0]?.id : null;
  useEffect(() => {
    if (!nearId || spokenFor.current === nearId) return;
    spokenFor.current = nearId;
    const item = journeyStore.get().items.find((i) => i.id === nearId);
    if (item) speak("You're near {0}", { 0: item.name });
  }, [nearId]);

  const { route, progress, phase } = journey;
  if (phase === 'idle' || !route) {
    return (
      <View className="flex-1 items-center justify-center gap-4 bg-background px-8">
        <Text className="text-center font-display text-2xl text-foreground">{tx('No journey in progress')}</Text>
        <AppButton label={tx('Plan a journey')} onPress={() => router.replace('/search')} />
      </View>
    );
  }

  const stepIndex = progress?.stepIndex ?? 0;
  const next = route.steps[stepIndex + 1] ?? route.steps[stepIndex];
  const then = route.steps[stepIndex + 2];
  const along = progress?.along ?? 0;
  const upcoming = journey.items.find((i) => i.along + i.radius >= along);
  const remaining = progress?.remaining ?? route.distance;
  const eta = progress?.etaSeconds ?? route.duration;

  const end = () =>
    Alert.alert(tx('End journey?'), tx('Stop navigating to {0}?', { 0: journey.target?.name ?? 'your destination' }), [
      { text: tx('Keep going'), style: 'cancel' },
      {
        text: tx('End'),
        style: 'destructive',
        onPress: () => {
          simulator.stop();
          journeyStore.stop();
          router.replace('/');
        },
      },
    ]);

  if (phase === 'arrived') {
    const tripItem = trips.data?.find((t) => t.destination_id === journey.target?.id);
    return (
      <View className="flex-1 bg-background">
        <JourneyMap route={route} index={routeIndex()} items={journey.items} progress={progress} fix={fix} follow={false} padding={{ top: insets.top + 24, bottom: 300 }} />
        <View className="absolute bottom-0 left-0 right-0 gap-4 rounded-t-[28px] bg-card px-6 pt-6" style={{ paddingBottom: insets.bottom + 16 }}>
          <View className="h-12 w-12 items-center justify-center rounded-full bg-success-soft">
            <Flag color={colors.success} size={22} />
          </View>
          <View className="gap-1">
            <Text className="text-[11px] font-bold uppercase tracking-[1.6px] text-success">{tx('You have arrived')}</Text>
            <Text className="font-display text-[30px] leading-9 text-foreground">{journey.target?.name}</Text>
            <Text className="text-sm text-muted-foreground">{tx('{0} landmarks were on your way. Explore what is around you now.', { 0: journey.items.filter((i) => i.kind === 'landmark').length })}</Text>
          </View>
          {tripItem && tripItem.status !== 'visited' ? (
            <AppButton
              label={tx('Mark as visited in my trip')}
              variant="outline"
              loading={tripActions.setStatusForDestination.isPending}
              onPress={() => tripActions.setStatusForDestination.mutate({ destinationId: tripItem.destination_id, status: 'visited' })}
            />
          ) : null}
          <View className="flex-row gap-2">
            <AppButton
              label={tx('Explore nearby')}
              variant="secondary"
              className="flex-1"
              onPress={() => {
                journeyStore.stop();
                router.replace('/explore');
              }}
            />
            <AppButton
              label={tx('Done')}
              className="flex-1"
              onPress={() => {
                journeyStore.stop();
                router.replace('/');
              }}
            />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <JourneyMap
        route={route}
        index={routeIndex()}
        items={journey.items}
        progress={progress}
        fix={fix}
        follow={!overview}
        padding={{ top: insets.top + 190, bottom: insets.bottom + 120 }}
      />

      <View className="absolute left-3 right-3 overflow-hidden rounded-3xl bg-primary" style={{ top: insets.top + 8, boxShadow: '0 8px 24px rgba(15,76,74,0.30)' }}>
        <View className="flex-row items-center gap-4 px-4 py-4">
          <ManeuverIcon step={next} />
          <View className="flex-1">
            <Text className="font-display text-[30px] leading-9 text-white">{formatDistance(progress?.toManeuver ?? route.steps[0]?.distance ?? 0)}</Text>
            <Text numberOfLines={2} className="text-base text-white">
              {next?.instruction ?? tx('Follow the route')}
            </Text>
          </View>
        </View>
        {journey.rerouting || progress?.offRoute ? (
          <View className="flex-row items-center gap-2 bg-accent px-4 py-2">
            <RefreshCw color="#FFFFFF" size={14} />
            <Text className="text-xs font-semibold text-white">{journey.rerouting ? tx('Off route · finding a new route…') : tx('Off route · will recalculate when online')}</Text>
          </View>
        ) : then ? (
          <View className="bg-primary-pressed px-4 py-2">
            <Text numberOfLines={1} className="text-xs font-semibold text-white">{tx('Then {0}', { 0: then.instruction.charAt(0).toLowerCase() + then.instruction.slice(1) })}</Text>
          </View>
        ) : null}
      </View>

      <View className="absolute left-4 gap-2" style={{ top: insets.top + 196 }}>
        {upcoming ? (
          <View
            className={`flex-row items-center gap-2 self-start rounded-full px-3 py-2 ${upcoming.kind === 'hazard' ? 'bg-destructive-soft' : 'bg-card'}`}
            style={{ boxShadow: '0 2px 8px rgba(21,56,79,0.10)' }}
          >
            {upcoming.kind === 'hazard' ? <TriangleAlert color={colors.destructive} size={15} /> : <Landmark color={colors.accent} size={15} />}
            <Text className="text-xs font-semibold text-foreground">
              {upcoming.name} {upcoming.along > along ? tx('ahead · {0}', { 0: formatDistance(upcoming.along - along) }) : 'nearby'}
            </Text>
          </View>
        ) : null}
        {sim.running ? (
          <Pressable onPress={() => simulator.stop()} className="self-start rounded-full bg-info px-3 py-1.5">
            <Text className="text-[11px] font-semibold text-white">{tx('Simulated drive · tap to stop')}</Text>
          </Pressable>
        ) : null}
        {params.background === '0' ? (
          <View className="self-start rounded-full bg-card px-3 py-1.5">
            <Text className="text-[11px] text-muted-foreground">{tx('Alerts only while GoTourGo is open')}</Text>
          </View>
        ) : null}
      </View>

      <View className="absolute right-4 gap-2" style={{ bottom: insets.bottom + 140 }}>
        <MapButton
          icon={journey.voice ? Volume2 : VolumeX}
          label={journey.voice ? tx('Mute voice') : tx('Turn voice on')}
          onPress={() => journeyStore.setVoice(!journey.voice)}
        />
        <MapButton icon={overview ? LocateFixed : RouteIcon} label={overview ? tx('Follow me') : tx('Show whole route')} onPress={() => setOverview((v) => !v)} />
        <MapButton icon={TriangleAlert} label={tx('Report hazard')} onPress={() => setReporting(true)} />
      </View>

      <View
        className="absolute bottom-0 left-0 right-0 flex-row items-center gap-4 rounded-t-[28px] bg-card px-6 pt-5"
        style={{ paddingBottom: insets.bottom + 18, boxShadow: '0 -8px 24px rgba(21,56,79,0.10)' }}
      >
        <Pressable accessibilityRole="button" accessibilityLabel={tx('End journey')} onPress={end} className="h-13 w-13 items-center justify-center rounded-full bg-destructive-soft" style={{ height: 52, width: 52 }}>
          <X color={colors.destructive} size={22} />
        </Pressable>
        <View className="flex-1 items-center">
          <Text className="font-display text-[26px] text-success">{formatEta(eta)}</Text>
          <Text className="text-xs text-faint">{tx('{0} · {1} arrival', { 0: formatDistance(remaining), 1: arrivalClock(eta) })}</Text>
        </View>
        <View style={{ width: 52 }} />
      </View>
      <ReportHazardSheet visible={reporting} onClose={() => setReporting(false)} />
    </View>
  );
}

function MapButton({ icon: Icon, label, onPress }: { icon: LucideIcon; label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      className="h-12 w-12 items-center justify-center rounded-full bg-card"
      style={{ boxShadow: '0 2px 8px rgba(21,56,79,0.12)' }}
    >
      <Icon color={colors.foreground} size={20} />
    </Pressable>
  );
}
