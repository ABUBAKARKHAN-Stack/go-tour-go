import { router, useLocalSearchParams } from 'expo-router';
import { Camera } from 'lucide-react-native';
import { useMemo } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, View } from 'react-native';

import { AppButton } from '@/components/app-button';
import { Screen } from '@/components/screen';
import { EmptyState, ErrorState, LoadingState } from '@/components/states';
import { useAuth } from '@/features/auth/auth-provider';
import { useFeed } from '@/features/community/api';
import { PostCard } from '@/features/community/post-card';
import { tx } from '@/lib/i18n';
import { colors } from '@/lib/theme';

/** Every post tagged at one landmark, newest first (client brief 6.2). */
export default function PlacePostsScreen() {
  const { id, name } = useLocalSearchParams<{ id: string; name?: string }>();
  const { userId } = useAuth();
  const feed = useFeed({ destinationId: id });
  const posts = useMemo(() => feed.data?.pages.flat() ?? [], [feed.data]);
  const postHere = () => router.push({ pathname: '/post/new', params: { destination: id } });

  return (
    <Screen back title={tx('Traveller posts')} subtitle={name} scroll={false}>
      <FlatList
        data={posts}
        keyExtractor={(p) => p.id}
        contentContainerClassName="gap-4 pb-8"
        onEndReachedThreshold={0.4}
        onEndReached={() => feed.hasNextPage && !feed.isFetchingNextPage && feed.fetchNextPage()}
        refreshControl={<RefreshControl refreshing={feed.isRefetching && !feed.isFetchingNextPage} onRefresh={() => void feed.refetch()} tintColor={colors.primary} />}
        ListHeaderComponent={
          <View className="pb-1">
            <AppButton label={tx('Post from here')} icon={Camera} variant="secondary" onPress={postHere} />
          </View>
        }
        ListEmptyComponent={
          feed.isLoading ? (
            <LoadingState variant="feed" />
          ) : feed.isError ? (
            <ErrorState error={feed.error} onRetry={feed.refetch} />
          ) : (
            <EmptyState icon={Camera} title={tx('No posts here yet')} message={tx('Be the first to share a photo or tip from this place.')} actionLabel={tx('Post from here')} onAction={postHere} />
          )
        }
        ListFooterComponent={feed.isFetchingNextPage ? <ActivityIndicator color={colors.primary} /> : undefined}
        renderItem={({ item }) => <PostCard post={item} userId={userId} />}
      />
    </Screen>
  );
}
