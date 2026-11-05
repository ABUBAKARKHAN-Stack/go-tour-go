import { Image } from 'expo-image';
import { router } from 'expo-router';
import { MessagesSquare, PenSquare, Plus, Users } from 'lucide-react-native';
import { useMemo } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { Text } from '@/components/text';

import { AppButton, IconButton } from '@/components/app-button';
import { Screen } from '@/components/screen';
import { EmptyState, ErrorState, LoadingState } from '@/components/states';
import { useAuth } from '@/features/auth/auth-provider';
import { useFeed, useStories } from '@/features/community/api';
import { PostCard } from '@/features/community/post-card';
import { displayName } from '@/features/social/api';
import { colors } from '@/lib/theme';
import type { Story } from '@/lib/types';

export default function CommunityScreen() {
  const { userId } = useAuth();
  const feed = useFeed();
  const stories = useStories();
  const posts = useMemo(() => feed.data?.pages.flat() ?? [], [feed.data]);

  // One bubble per author (latest story first).
  const storyAuthors = useMemo(() => {
    const seen = new Map<string, Story>();
    for (const s of stories.data ?? []) if (!seen.has(s.author_id)) seen.set(s.author_id, s);
    return [...seen.values()];
  }, [stories.data]);

  return (
    <Screen
      inTabs
      title="Community"
      subtitle="Travel stories from fellow explorers"
      scroll={false}
      right={
        <View className="flex-row gap-2">
          <IconButton icon={Users} label="Friends" onPress={() => router.push('/friends')} />
          <IconButton icon={MessagesSquare} label="Messages" onPress={() => router.push('/messages')} />
        </View>
      }
    >
      <FlatList
        data={posts}
        keyExtractor={(p) => p.id}
        contentContainerClassName="gap-4 px-4 pb-6"
        onEndReachedThreshold={0.4}
        onEndReached={() => feed.hasNextPage && !feed.isFetchingNextPage && feed.fetchNextPage()}
        refreshControl={
          <RefreshControl
            refreshing={feed.isRefetching && !feed.isFetchingNextPage}
            onRefresh={() => {
              feed.refetch();
              stories.refetch();
            }}
            tintColor={colors.primary}
          />
        }
        ListHeaderComponent={
          <View className="gap-4">
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-3">
              <Pressable accessibilityRole="button" accessibilityLabel="Add story" onPress={() => router.push('/story/new')} className="w-20 items-center gap-1">
                <View className="h-16 w-16 items-center justify-center rounded-full border-2 border-dashed border-accent bg-secondary">
                  <Plus color={colors.primary} size={24} />
                </View>
                <Text className="text-xs text-foreground">Your story</Text>
              </Pressable>
              {storyAuthors.map((s) => (
                <Pressable
                  key={s.id}
                  accessibilityRole="button"
                  accessibilityLabel={`Story by ${displayName(s.author)}`}
                  onPress={() => router.push({ pathname: '/story/[id]', params: { id: s.author_id } })}
                  className="w-20 items-center gap-1"
                >
                  <View className="h-16 w-16 overflow-hidden rounded-full border-2 border-accent p-0.5">
                    <Image source={{ uri: s.image_url }} style={{ width: '100%', height: '100%', borderRadius: 999 }} contentFit="cover" />
                  </View>
                  <Text numberOfLines={1} className="w-16 text-center text-xs text-foreground">
                    {s.author_id === userId ? 'You' : displayName(s.author)}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
            <AppButton label="Share a travel moment" icon={PenSquare} variant="secondary" onPress={() => router.push('/post/new')} />
          </View>
        }
        ListEmptyComponent={
          feed.isLoading ? (
            <LoadingState label="Loading posts..." />
          ) : feed.isError ? (
            <ErrorState error={feed.error} onRetry={feed.refetch} />
          ) : (
            <EmptyState icon={PenSquare} title="No posts yet" message="Be the first to share a travel moment." actionLabel="Create post" onAction={() => router.push('/post/new')} />
          )
        }
        ListFooterComponent={feed.isFetchingNextPage ? <ActivityIndicator color={colors.primary} /> : undefined}
        renderItem={({ item }) => <PostCard post={item} userId={userId} />}
      />
    </Screen>
  );
}
