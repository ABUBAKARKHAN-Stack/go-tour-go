import { router } from 'expo-router';
import { ShieldCheck, TriangleAlert } from 'lucide-react-native';
import { FlatList, Pressable, RefreshControl, View } from 'react-native';
import { Text } from '@/components/text';

import { Screen } from '@/components/screen';
import { EmptyState, ErrorState, LoadingState } from '@/components/states';
import { ALERT_LABELS, useRoadAlerts } from '@/features/alerts/api';
import { useLastLocation } from '@/features/location/location-store';
import { timeAgo } from '@/features/safety/friend-locations';
import { distanceMeters, formatDistance } from '@/lib/geo';
import { colors, severityColors } from '@/lib/theme';
import { tx } from '@/lib/i18n';

export default function AlertsScreen() {
  const alerts = useRoadAlerts();
  const location = useLastLocation();

  return (
    <Screen back title={tx('Road & travel alerts')} subtitle={tx('Demo data for the FYP')} scroll={false}>
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
              onPress={() => router.navigate('/explore')}
              className="gap-2 rounded-3xl border bg-card p-4"
              style={{ borderColor: `${severityColors[a.severity]}88` }}
            >
              <View className="flex-row items-center gap-2">
                <TriangleAlert color={severityColors[a.severity]} size={18} />
                <Text className="flex-1 text-base font-bold text-foreground">{a.title}</Text>
                <View className="rounded-full px-2 py-0.5" style={{ backgroundColor: `${severityColors[a.severity]}33` }}>
                  <Text className="text-[11px] font-bold uppercase" style={{ color: severityColors[a.severity] }}>
                    {a.severity}
                  </Text>
                </View>
              </View>
              <Text className="text-xs text-muted-foreground">
                {ALERT_LABELS[a.alert_type]} · {a.city ?? a.region} · {timeAgo(a.starts_at)}
                {location ? tx(' · {0} away', { 0: formatDistance(distanceMeters(location, a)) }) : ''}
              </Text>
              <Text className="text-sm text-foreground">{a.description}</Text>
              <Text className="text-[11px] text-muted-foreground">{tx('Source: {0}', { 0: a.source })}</Text>
            </Pressable>
          )}
        />
      )}
    </Screen>
  );
}
