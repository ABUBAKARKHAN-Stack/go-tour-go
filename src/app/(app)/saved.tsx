import { router } from 'expo-router';
import { Bookmark, BookmarkX } from 'lucide-react-native';
import { useMemo } from 'react';
import { FlatList, RefreshControl } from 'react-native';

import { IconButton } from '@/components/app-button';
import { DestinationCard } from '@/components/destination-card';
import { Screen } from '@/components/screen';
import { EmptyState, ErrorState, LoadingState } from '@/components/states';
import { useDestinationsByDistance } from '@/features/destinations/api';
import { useSavedIds, useToggleSaved } from '@/features/saved/api';
import { colors } from '@/lib/theme';
import { tx } from '@/lib/i18n';

export default function SavedScreen() {
  const saved = useSavedIds();
  const toggle = useToggleSaved();
  const { sorted } = useDestinationsByDistance();
  const places = useMemo(() => {
    const byId = new Map(sorted.map((d) => [d.id, d]));
    return (saved.data ?? []).map((id) => byId.get(id)).filter((d): d is NonNullable<typeof d> => Boolean(d));
  }, [saved.data, sorted]);

  return (
    <Screen back title={tx('Saved places')} scroll={false}>
      {saved.isLoading ? (
        <LoadingState label={tx('Loading saved places...')} />
      ) : saved.isError && !saved.data ? (
        <ErrorState error={saved.error} onRetry={saved.refetch} />
      ) : (
        <FlatList
          data={places}
          keyExtractor={(d) => d.id}
          contentContainerClassName="gap-3 px-4 pb-8"
          refreshControl={<RefreshControl refreshing={saved.isRefetching} onRefresh={() => void saved.refetch()} tintColor={colors.primary} />}
          ListEmptyComponent={
            <EmptyState
              icon={Bookmark}
              title={tx('No saved places yet')}
              message={tx('Bookmark destinations to find them quickly, even offline.')}
              actionLabel={tx('Explore destinations')}
              onAction={() => router.push('/search')}
            />
          }
          renderItem={({ item }) => (
            <DestinationCard
              destination={item}
              distance={item.distance}
              variant="row"
              right={<IconButton icon={BookmarkX} label={tx('Unsave {0}', { 0: item.name })} onPress={() => toggle.mutate({ destinationId: item.id, save: false })} />}
            />
          )}
        />
      )}
    </Screen>
  );
}
