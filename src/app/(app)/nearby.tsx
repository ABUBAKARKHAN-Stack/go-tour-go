import { useLocalSearchParams } from 'expo-router';
import { MapPinned, Navigation, Phone, Star } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { FlatList, Linking, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';

import { Chip } from '@/components/form';
import { Screen } from '@/components/screen';
import { EmptyState, ErrorState, LoadingState } from '@/components/states';
import { SERVICE_CATEGORIES } from '@/features/destinations/categories';
import { useLastLocation } from '@/features/location/location-store';
import { LocationStatusCard } from '@/features/location/location-status-card';
import { useNearbyServices } from '@/features/nearby/api';
import { navigateTo } from '@/features/routing/navigate';
import { formatDistance } from '@/lib/geo';
import { colors } from '@/lib/theme';
import type { ServiceCategory } from '@/lib/types';

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
    <Screen back title="Nearby" subtitle={params.name ? `Around ${params.name}` : 'Around you'} scroll={false}>
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
        <LoadingState label={`Finding ${meta.label.toLowerCase()} nearby...`} />
      ) : query.isError ? (
        <ErrorState error={query.error} onRetry={query.refetch} />
      ) : (
        <FlatList
          data={query.data?.items ?? []}
          keyExtractor={(s) => s.id}
          contentContainerClassName="gap-3 px-4 pb-8"
          refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={() => void query.refetch()} tintColor={colors.accent} />}
          ListHeaderComponent={
            query.data?.source === 'seed' ? (
              <Text className="pb-1 text-xs text-muted-foreground">Live map data unavailable; showing GoTourGo&apos;s saved list.</Text>
            ) : (
              <Text className="pb-1 text-xs text-muted-foreground">Data © OpenStreetMap contributors</Text>
            )
          }
          ListEmptyComponent={
            <EmptyState icon={MapPinned} title={`No ${meta.label.toLowerCase()} found nearby`} message="Try another category or move to a different area." />
          }
          renderItem={({ item }) => {
            const Icon = SERVICE_CATEGORIES[item.category].icon;
            return (
              <View className="flex-row items-center gap-3 rounded-3xl border border-border/20 bg-card p-3">
                <View className="h-11 w-11 items-center justify-center rounded-2xl bg-secondary">
                  <Icon color={SERVICE_CATEGORIES[item.category].color} size={20} />
                </View>
                <View className="flex-1">
                  <Text numberOfLines={1} className="text-base font-semibold text-foreground">
                    {item.name}
                  </Text>
                  <View className="flex-row items-center gap-2">
                    <Text className="text-xs text-accent">{formatDistance(item.distance)}</Text>
                    {item.rating ? (
                      <View className="flex-row items-center gap-0.5">
                        <Star size={11} color={colors.accent} fill={colors.accent} />
                        <Text className="text-xs text-muted-foreground">{item.rating.toFixed(1)}</Text>
                      </View>
                    ) : null}
                    {item.address ? (
                      <Text numberOfLines={1} className="flex-1 text-xs text-muted-foreground">
                        {item.address}
                      </Text>
                    ) : null}
                  </View>
                </View>
                {item.phone ? (
                  <Pressable accessibilityRole="button" accessibilityLabel={`Call ${item.name}`} onPress={() => Linking.openURL(`tel:${item.phone}`)} className="h-11 w-11 items-center justify-center rounded-full bg-secondary">
                    <Phone color={colors.foreground} size={18} />
                  </Pressable>
                ) : null}
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Navigate to ${item.name}`}
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
