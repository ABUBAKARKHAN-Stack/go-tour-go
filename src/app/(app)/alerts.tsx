import { ShieldCheck, TriangleAlert } from 'lucide-react-native';
import { FlatList, Pressable, RefreshControl, View } from 'react-native';
import { Text } from '@/components/text';

import { useState } from 'react';

import { AppButton } from '@/components/app-button';
import { Screen } from '@/components/screen';
import { EmptyState, ErrorState, LoadingState } from '@/components/states';
import { ALERT_LABELS, useRoadAlerts } from '@/features/alerts/api';
import { hazardCard } from '@/features/alerts/hazard-card-store';
import { ReportHazardSheet } from '@/features/alerts/report-hazard-sheet';
import { useAuth } from '@/features/auth/auth-provider';
import { useLastLocation } from '@/features/location/location-store';
import { timeAgo } from '@/features/safety/friend-locations';
import { distanceMeters, formatDistance } from '@/lib/geo';
import { colors, severityColors, shadow } from '@/lib/theme';
import { tx } from '@/lib/i18n';

export default function AlertsScreen() {
  const alerts = useRoadAlerts();
  const location = useLastLocation();
  const { userId } = useAuth();
  const [reporting, setReporting] = useState(false);

  return (
    <Screen
      back
      title={tx('Road & travel alerts')}
      subtitle={tx('Official alerts and traveller reports')}
      scroll={false}
      right={userId ? <AppButton label={tx('Report')} size="sm" variant="secondary" onPress={() => setReporting(true)} /> : undefined}
    >
      <ReportHazardSheet visible={reporting} onClose={() => setReporting(false)} />
      {alerts.isLoading ? (
        <LoadingState label={tx('Loading alerts...')} />
      ) : alerts.isError && !alerts.data ? (
        <ErrorState error={alerts.error} onRetry={alerts.refetch} />
      ) : (
        <FlatList
          data={alerts.data ?? []}
          keyExtractor={(a) => a.id}
          contentContainerClassName="gap-3 px-4 pb-8"
          refreshControl={<RefreshControl refreshing={alerts.isRefetching} onRefresh={() => void alerts.refetch()} tintColor={colors.primary} />}
          ListEmptyComponent={<EmptyState icon={ShieldCheck} title={tx('No active alerts')} message={tx('Roads look clear. Have a safe trip!')} />}
          renderItem={({ item: a }) => (
            <Pressable
              accessibilityRole="button"
              onPress={() => hazardCard.show(a.id, location ? distanceMeters(location, a) : a.radius_m + 1)}
              className="gap-2 rounded-[20px] border-s-4 bg-card p-4 active:opacity-90"
              style={{ borderColor: severityColors[a.severity], boxShadow: shadow(0.08, 6, 20) }}
            >
              <View className="flex-row items-center gap-2">
                <TriangleAlert color={severityColors[a.severity]} size={18} />
                <Text className="flex-1 text-base font-bold text-heading">{a.title}</Text>
                <View className="rounded-full px-2 py-0.5" style={{ backgroundColor: `${severityColors[a.severity]}33` }}>
                  <Text className="text-[11px] font-bold uppercase" style={{ color: severityColors[a.severity] }}>
                    {a.severity}
                  </Text>
                </View>
              </View>
              <Text className="text-xs text-muted-foreground">
                {[ALERT_LABELS[a.alert_type], a.city ?? a.region, timeAgo(a.starts_at)].filter(Boolean).join(' · ')}
                {location ? tx(' · {0} away', { 0: formatDistance(distanceMeters(location, a)) }) : ''}
              </Text>
              <Text className="text-sm text-foreground">{a.description}</Text>
              <Text className="text-[11px] text-muted-foreground">
                {a.source === 'traveller'
                  ? tx('Reported by travellers · {0} confirmed', { 0: a.confirmations ?? 0 })
                  : tx('Source: {0}', { 0: a.source })}
              </Text>
            </Pressable>
          )}
        />
      )}
    </Screen>
  );
}
