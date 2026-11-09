import { router } from 'expo-router';
import { Clock, ThumbsDown, ThumbsUp, TriangleAlert, Users, X } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton } from '@/components/app-button';
import { Text } from '@/components/text';
import { ALERT_LABELS, useRoadAlerts, useVoteHazard } from '@/features/alerts/api';
import { useAuth } from '@/features/auth/auth-provider';
import { journeyStore, useJourney } from '@/features/journey/journey-store';
import { getCurrentFix } from '@/features/location/location-provider';
import { useNow } from '@/features/safety/friend-locations';
import { errorMessage } from '@/lib/errors';
import { formatDistance, formatDuration } from '@/lib/geo';
import { tx } from '@/lib/i18n';
import { colors } from '@/lib/theme';

import { hazardCard, useHazardCard } from './hazard-card-store';

const SEVERITY_LABEL = { low: tx('Low'), medium: tx('Medium'), high: tx('High'), critical: tx('Critical') } as const;

/**
 * Hazard card (design screen 10) shown over any screen when a hazard is
 * coming up or the traveller is inside one. Travellers can confirm or clear
 * reports; during a journey "Find a way around" picks a route that avoids it.
 */
export function HazardCardOverlay() {
  const card = useHazardCard();
  const alerts = useRoadAlerts();
  const journey = useJourney();
  const { userId } = useAuth();
  const vote = useVoteHazard();
  const insets = useSafeAreaInsets();
  const [avoiding, setAvoiding] = useState(false);
  const [voted, setVoted] = useState<string | null>(null);
  const now = useNow(30_000);

  const alert = card.visible ? alerts.data?.find((a) => a.id === card.alertId) : undefined;
  if (!alert) return null;

  const traveller = alert.source === 'traveller';
  const canVote = traveller && Boolean(userId) && alert.reporter_id !== userId && voted !== alert.id;
  const here = card.distance <= alert.radius_m;
  const endsIn = alert.ends_at ? Math.max(0, (Date.parse(alert.ends_at) - now) / 1000) : null;

  const castVote = (stillThere: boolean) =>
    vote.mutate(
      { reportId: alert.id, stillThere },
      {
        onSuccess: () => setVoted(alert.id),
        onError: (e) => Alert.alert(tx('Could not send'), errorMessage(e)),
      },
    );

  const findWayAround = async () => {
    setAvoiding(true);
    const fix = await getCurrentFix();
    const ok = fix ? await journeyStore.avoid({ latitude: alert.latitude, longitude: alert.longitude, radius: alert.radius_m }, fix) : false;
    setAvoiding(false);
    if (ok) hazardCard.dismiss();
    else Alert.alert(tx('No way around found'), tx('None of the other routes avoid this hazard. Slow down and take care.'));
  };

  return (
    <Animated.View
      entering={FadeInDown.springify().damping(18)}
      exiting={FadeOutDown.duration(180)}
      className="absolute left-3 right-3 z-50"
      style={{ bottom: insets.bottom + 96 }}
      pointerEvents="box-none"
      accessibilityLiveRegion="polite"
    >
      <View className="overflow-hidden rounded-[28px] bg-card" style={{ boxShadow: '0 10px 28px rgba(21,56,79,0.18)' }}>
        <View className="flex-row items-center gap-2 bg-destructive-soft px-4 py-2.5">
          <TriangleAlert color={colors.destructive} size={18} />
          <Text className="flex-1 text-[11px] font-bold uppercase tracking-[1.6px] text-destructive">
            {here ? tx('Hazard here') : tx('Hazard ahead · {0}', { 0: formatDistance(card.distance) })}
          </Text>
          <Pressable accessibilityRole="button" accessibilityLabel={tx('Dismiss')} hitSlop={10} onPress={() => hazardCard.dismiss()}>
            <X color={colors.mutedForeground} size={18} />
          </Pressable>
        </View>

        <View className="gap-3 p-4">
          <View className="gap-1">
            {/* No line limit: long titles wrap instead of being cut off. */}
            <Text className="font-display text-[22px] leading-7 text-foreground">{alert.title}</Text>
            <Text className="text-sm leading-5 text-muted-foreground">{alert.description}</Text>
          </View>

          <View className="flex-row flex-wrap gap-2">
            <Pill tone="danger" label={tx('Severity: {0}', { 0: SEVERITY_LABEL[alert.severity] })} />
            {endsIn != null ? <Pill icon={<Clock color={colors.mutedForeground} size={13} />} label={tx('Ends in ~{0}', { 0: formatDuration(endsIn) })} /> : null}
            <Pill
              icon={<Users color={colors.mutedForeground} size={13} />}
              label={traveller ? tx('Reported by travellers · {0} confirmed', { 0: alert.confirmations ?? 0 }) : tx('Official alert · {0}', { 0: ALERT_LABELS[alert.alert_type] })}
            />
          </View>

          {canVote ? (
            <View className="flex-row items-center gap-2">
              <Text className="flex-1 text-sm text-foreground">{tx('Still there?')}</Text>
              <AppButton label={tx('Yes')} icon={ThumbsUp} size="sm" variant="secondary" loading={vote.isPending} onPress={() => castVote(true)} />
              <AppButton label={tx('Gone')} icon={ThumbsDown} size="sm" variant="secondary" disabled={vote.isPending} onPress={() => castVote(false)} />
            </View>
          ) : voted === alert.id ? (
            <Text className="text-xs text-success">{tx('Thanks, other travellers will see your update.')}</Text>
          ) : null}

          {journey.phase === 'active' ? (
            <AppButton label={tx('Find a way around')} loading={avoiding} onPress={findWayAround} />
          ) : (
            <AppButton
              label={tx('Show on map')}
              variant="secondary"
              onPress={() => {
                hazardCard.dismiss();
                router.navigate('/explore');
              }}
            />
          )}
        </View>
      </View>
    </Animated.View>
  );
}

function Pill({ label, icon, tone }: { label: string; icon?: React.ReactNode; tone?: 'danger' }) {
  return (
    <View className={`flex-row items-center gap-1.5 rounded-full px-3 py-1.5 ${tone === 'danger' ? 'bg-destructive-soft' : 'bg-secondary'}`}>
      {icon}
      <Text className={`text-xs font-semibold ${tone === 'danger' ? 'text-destructive' : 'text-muted-foreground'}`}>{label}</Text>
    </View>
  );
}
