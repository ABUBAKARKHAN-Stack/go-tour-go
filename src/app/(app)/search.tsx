import { useLocalSearchParams } from 'expo-router';
import { Search, SearchX, X } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, TextInput, View } from 'react-native';

import { DestinationCard } from '@/components/destination-card';
import { Chip } from '@/components/form';
import { Screen } from '@/components/screen';
import { EmptyState, ErrorState, LoadingState } from '@/components/states';
import { searchDestinations, useDestinationsByDistance, useRatings } from '@/features/destinations/api';
import { CATEGORY_ORDER, DESTINATION_CATEGORIES } from '@/features/destinations/categories';
import { colors } from '@/lib/theme';
import type { DestinationCategory } from '@/lib/types';

export default function SearchScreen() {
  const params = useLocalSearchParams<{ q?: string; category?: DestinationCategory }>();
  const [term, setTerm] = useState(params.q ?? '');
  const [category, setCategory] = useState<DestinationCategory | null>(params.category ?? null);
  const { sorted, isLoading, isError, error, refetch } = useDestinationsByDistance();
  const ratings = useRatings();

  const results = useMemo(
    () => searchDestinations(sorted, term).filter((d) => !category || d.category === category) as typeof sorted,
    [sorted, term, category],
  );

  return (
    <Screen back title="Search" scroll={false} keyboard>
      <View className="px-4 pb-2">
        <View className="min-h-12 flex-row items-center gap-2 rounded-2xl border border-border/40 bg-input px-4">
          <Search color={colors.mutedForeground} size={18} />
          <TextInput
            autoFocus={!params.category}
            value={term}
            onChangeText={setTerm}
            placeholder="Places, cities, food, history..."
            placeholderTextColor={`${colors.mutedForeground}99`}
            className="flex-1 text-base text-foreground"
            returnKeyType="search"
            accessibilityLabel="Search destinations"
          />
          {term ? (
            <Pressable accessibilityRole="button" accessibilityLabel="Clear search" onPress={() => setTerm('')} hitSlop={10}>
              <X color={colors.mutedForeground} size={18} />
            </Pressable>
          ) : null}
        </View>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="max-h-14 grow-0" contentContainerClassName="gap-2 px-4 pb-2">
        <Chip label="All" selected={!category} onPress={() => setCategory(null)} />
        {CATEGORY_ORDER.map((c) => (
          <Chip key={c} label={DESTINATION_CATEGORIES[c].label} selected={category === c} onPress={() => setCategory(category === c ? null : c)} />
        ))}
      </ScrollView>

      {isLoading && sorted.length === 0 ? (
        <LoadingState label="Loading destinations..." />
      ) : isError && sorted.length === 0 ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : (
        <FlatList
          data={results}
          keyExtractor={(d) => d.id}
          keyboardShouldPersistTaps="handled"
          contentContainerClassName="gap-3 px-4 pb-8"
          initialNumToRender={8}
          renderItem={({ item }) => (
            <DestinationCard destination={item} distance={item.distance} rating={ratings.data?.get(item.id)?.average_rating} variant="row" />
          )}
          ListEmptyComponent={
            <EmptyState
              icon={SearchX}
              title="No results"
              message="Try a different name, city or category."
              actionLabel={term || category ? 'Clear filters' : undefined}
              onAction={() => {
                setTerm('');
                setCategory(null);
              }}
            />
          }
        />
      )}
    </Screen>
  );
}
