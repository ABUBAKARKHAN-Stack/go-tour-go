import { router, useLocalSearchParams } from 'expo-router';
import { Bookmark, BookmarkX } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, View } from 'react-native';

import { IconButton } from '@/components/app-button';
import { DestinationCard } from '@/components/destination-card';
import { Segmented } from '@/components/form';
import { useAuth } from '@/features/auth/auth-provider';
import { useFeed } from '@/features/community/api';
import { PostCard } from '@/features/community/post-card';
import { Screen } from '@/components/screen';
import { EmptyState, ErrorState, LoadingState } from '@/components/states';
import { useDestinationsByDistance } from '@/features/destinations/api';
import { useSavedIds, useToggleSaved } from '@/features/saved/api';
import { colors } from '@/lib/theme';
import { tx } from '@/lib/i18n';

type Tab = 'places' | 'posts';

export default function SavedScreen() {
  const params = useLocalSearchParams<{ tab?: string }>();
  const [tab, setTab] = useState<Tab>(params.tab === 'posts' ? 'posts' : 'places');
  return (
    <Screen back title={tx('Saved')} scroll={false}>
      <View className="px-4 pb-3">
        <Segmented<Tab>
          value={tab}
          onChange={setTab}
          options={[
            { value: 'places', label: tx('Places') },
            { value: 'posts', label: tx('Posts') },
          ]}
        />
      </View>
      {tab === 'places' ? <SavedPlaces /> : <SavedPosts />}
    </Screen>
  );
}

/** Bookmarked community posts, newest saved first. */
function SavedPosts() {
  const { userId } = useAuth();
  const feed = useFeed({ saved: true });
  const posts = useMemo(() => feed.data?.pages.flat() ?? [], [feed.data]);
  if (feed.isLoading) return <LoadingState variant="feed" label={tx('Loading saved posts...')} />;
  if (feed.isError && !feed.data) return <ErrorState error={feed.error} onRetry={feed.refetch} />;
  return (
    <FlatList
      data={posts}
      keyExtractor={(p) => p.id}
      contentContainerClassName="gap-4 px-4 pb-8"
      onEndReachedThreshold={0.4}
      onEndReached={() => feed.hasNextPage && !feed.isFetchingNextPage && feed.fetchNextPage()}
      refreshControl={<RefreshControl refreshing={feed.isRefetching && !feed.isFetchingNextPage} onRefresh={() => void feed.refetch()} tintColor={colors.primary} />}
      ListEmptyComponent={
        <EmptyState
          icon={Bookmark}
          title={tx('No saved posts yet')}
          message={tx('Tap the bookmark on a post to keep it here.')}
          actionLabel={tx('Open Community')}
          onAction={() => router.navigate('/community')}
        />
      }
      ListFooterComponent={feed.isFetchingNextPage ? <ActivityIndicator color={colors.primary} /> : undefined}
      renderItem={({ item }) => <PostCard post={item} userId={userId} />}
    />
  );
}

function SavedPlaces() {
  const saved = useSavedIds();
  const toggle = useToggleSaved();
  const { sorted } = useDestinationsByDistance();
  const places = useMemo(() => {
    const byId = new Map(sorted.map((d) => [d.id, d]));
    return (saved.data ?? []).map((id) => byId.get(id)).filter((d): d is NonNullable<typeof d> => Boolean(d));
  }, [saved.data, sorted]);

  return (
    <>
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
    </>
  );
}
