import { useLocalSearchParams } from 'expo-router';
import { MapPinned, Navigation, Phone, Star } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { FlatList, Linking, Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { Text } from '@/components/text';

import { Chip } from '@/components/form';
import { Screen } from '@/components/screen';
import { EmptyState, ErrorState, LoadingState } from '@/components/states';
import { SERVICE_CATEGORIES } from '@/features/destinations/categories';
import { useLastLocation } from '@/features/location/location-store';
import { LocationStatusCard } from '@/features/location/location-status-card';
import { useNearbyServices } from '@/features/nearby/api';
import { navigateTo } from '@/features/routing/navigate';
import { formatDistance } from '@/lib/geo';
import { cardShadow, colors } from '@/lib/theme';
import type { ServiceCategory } from '@/lib/types';
import { tx } from '@/lib/i18n';

const ORDER: ServiceCategory[] = ['restaurant', 'hotel', 'hospital', 'police', 'pharmacy', 'fuel', 'atm', 'shopping', 'attraction'];

export default function NearbyScreen() {
  const params = useLocalSearchParams<{ lat?: string; lng?: string; name?: string; category?: ServiceCategory }>();
  const location = useLastLocation();
  const [category, setCategory] = useState<ServiceCategory>(params.category ?? 'restaurant');

  const point = useMemo(() => {
    if (params.lat && params.lng) return { latitude: Number(params.lat), longitude: Number(params.lng) };
    return location ? { latitude: location.latitude, longitude: location.longitude } : null;
  }, [params.lat, params.lng, location]);

  const query = useNearbyServices(category, point);
  const meta = SERVICE_CATEGORIES[category];

  return (
    <Screen back title={tx('Nearby')} subtitle={params.name ? tx('Around {0}', { 0: params.name }) : tx('Around you')} scroll={false}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="max-h-14 grow-0" contentContainerClassName="gap-2 px-4 pb-2">
        {ORDER.map((c) => (
          <Chip key={c} label={SERVICE_CATEGORIES[c].label} selected={c === category} onPress={() => setCategory(c)} />
        ))}
      </ScrollView>

      {!point ? (
        <View className="px-4">
          <LocationStatusCard />
        </View>
      ) : query.isLoading ? (
        <LoadingState label={tx('Finding {0} nearby...', { 0: meta.label.toLowerCase() })} />
      ) : query.isError ? (
        <ErrorState error={query.error} onRetry={query.refetch} />
      ) : (
        <FlatList
          data={query.data?.items ?? []}
          keyExtractor={(s) => s.id}
          contentContainerClassName="gap-3 px-4 pb-8"
          refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={() => void query.refetch()} tintColor={colors.primary} />}
          ListHeaderComponent={
            query.data?.source === 'seed' ? (
              <Text className="pb-1 text-xs text-muted-foreground">{tx('Live map data unavailable; showing GoTourGo\'s saved list.')}</Text>
            ) : (
              <Text className="pb-1 text-xs text-muted-foreground">{tx('Data © OpenStreetMap contributors')}</Text>
            )
          }
          ListEmptyComponent={
            <EmptyState icon={MapPinned} title={tx('No {0} found nearby', { 0: meta.label.toLowerCase() })} message={tx('Try another category or move to a different area.')} />
          }
          renderItem={({ item }) => {
            const Icon = SERVICE_CATEGORIES[item.category].icon;
            return (
              <View className="flex-row items-center gap-3 rounded-[20px] bg-card p-3" style={cardShadow}>
                <View className="h-11 w-11 items-center justify-center rounded-2xl bg-primary-soft">
                  <Icon color={SERVICE_CATEGORIES[item.category].color} size={20} />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-semibold text-heading">
                    {item.name}
                  </Text>
                  <View className="flex-row items-center gap-2">
                    <Text className="text-xs text-accent">{formatDistance(item.distance)}</Text>
                    {item.rating ? (
                      <View className="flex-row items-center gap-0.5">
                        <Star size={11} color={colors.primary} fill={colors.accent} />
                        <Text className="text-xs text-muted-foreground">{item.rating.toFixed(1)}</Text>
                      </View>
                    ) : null}
                    {item.address ? (
                      <Text className="flex-1 text-xs text-muted-foreground">
                        {item.address}
                      </Text>
                    ) : null}
                  </View>
                </View>
                {item.phone ? (
                  <Pressable accessibilityRole="button" accessibilityLabel={tx('Call {0}', { 0: item.name })} onPress={() => Linking.openURL(`tel:${item.phone}`)} className="h-11 w-11 items-center justify-center rounded-full bg-primary-soft">
                    <Phone color={colors.foreground} size={18} />
                  </Pressable>
                ) : null}
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={tx('Navigate to {0}', { 0: item.name })}
                  onPress={() => navigateTo({ id: item.id, name: item.name, latitude: item.latitude, longitude: item.longitude })}
                  className="h-11 w-11 items-center justify-center rounded-full bg-accent"
                >
                  <Navigation color={colors.accentForeground} size={18} />
                </Pressable>
              </View>
            );
          }}
        />
      )}
    </Screen>
  );
}
