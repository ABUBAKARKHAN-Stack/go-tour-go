import { Image } from 'expo-image';
import { router } from 'expo-router';
import { MessagesSquare, PenSquare, Plus, Users } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { Text } from '@/components/text';

import { AppButton, IconButton } from '@/components/app-button';
import { Segmented } from '@/components/form';
import { Screen } from '@/components/screen';
import { EmptyState, ErrorState, LoadingState } from '@/components/states';
import { useAuth } from '@/features/auth/auth-provider';
import { useFeed, useStories } from '@/features/community/api';
import { orderStoryAuthors, useSeenStories, type StoryGroup } from '@/features/community/story-seen';
import { PostCard } from '@/features/community/post-card';
import { displayName, useFriendships, useMyFollowingIds } from '@/features/social/api';
import { colors } from '@/lib/theme';
import { tx } from '@/lib/i18n';

type FeedTab = 'all' | 'following';

export default function CommunityScreen() {
  const { userId } = useAuth();
  const [tab, setTab] = useState<FeedTab>('all');
  const following = useMyFollowingIds();
  const friendships = useFriendships();
  // Following feed: people you follow, your friends and you.
  const circle = useMemo(() => {
    const ids = new Set(following.data ?? []);
    for (const f of friendships.friends) ids.add(f.profile.id);
    if (userId) ids.add(userId);
    return [...ids];
  }, [following.data, friendships.friends, userId]);
  const feed = useFeed(tab === 'following' ? { authorIds: circle } : undefined);
  const stories = useStories();
  const isSeen = useSeenStories();
  const posts = useMemo(() => feed.data?.pages.flat() ?? [], [feed.data]);
  const groups = useMemo(() => orderStoryAuthors(stories.data ?? [], userId, isSeen), [stories.data, userId, isSeen]);
  const mine = groups.find((g) => g.authorId === userId);
  const others = groups.filter((g) => g.authorId !== userId);

  return (
    <Screen
      inTabs
      title={tx('Community')}
      subtitle={tx('Travel stories from fellow explorers')}
      scroll={false}
      right={
        <View className="flex-row gap-2">
          <IconButton icon={Users} label={tx('Friends')} onPress={() => router.push('/friends')} />
          <IconButton icon={MessagesSquare} label={tx('Messages')} onPress={() => router.push('/messages')} />
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
              <OwnStoryBubble group={mine} />
              {others.map((g) => (
                <StoryBubble key={g.authorId} group={g} />
              ))}
            </ScrollView>
            <AppButton label={tx('Share a travel moment')} icon={PenSquare} variant="secondary" onPress={() => router.push('/post/new')} />
            <Segmented
              value={tab}
              onChange={setTab}
              options={[
                { value: 'all', label: tx('All travellers') },
                { value: 'following', label: tx('Following') },
              ]}
            />
          </View>
        }
        ListEmptyComponent={
          feed.isLoading ? (
            <LoadingState variant="feed" label={tx('Loading posts...')} />
          ) : feed.isError ? (
            <ErrorState error={feed.error} onRetry={feed.refetch} />
          ) : tab === 'following' ? (
            <EmptyState
              icon={Users}
              title={tx('Nothing from your circle yet')}
              message={tx('Posts from people you follow and your friends appear here.')}
              actionLabel={tx('Find travellers')}
              onAction={() => router.push('/friends')}
            />
          ) : (
            <EmptyState icon={PenSquare} title={tx('No posts yet')} message={tx('Be the first to share a travel moment.')} actionLabel={tx('Create post')} onAction={() => router.push('/post/new')} />
          )
        }
        ListFooterComponent={feed.isFetchingNextPage ? <ActivityIndicator color={colors.primary} /> : undefined}
        renderItem={({ item }) => <PostCard post={item} userId={userId} />}
      />
    </Screen>
  );
}

/** Your bubble: your latest story with a + to add another, or a dashed + when you have none. */
function OwnStoryBubble({ group }: { group: StoryGroup | undefined }) {
  return (
    <View className="w-20 items-center gap-1">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={group ? tx('View your story') : tx('Add story')}
        onPress={() => (group ? router.push({ pathname: '/story/[id]', params: { id: group.authorId } }) : router.push('/story/new'))}
      >
        {group ? (
          <View className="h-16 w-16 overflow-hidden rounded-full border-2 border-border p-0.5">
            <Image source={{ uri: group.latest.image_url }} style={{ width: '100%', height: '100%', borderRadius: 999 }} contentFit="cover" />
          </View>
        ) : (
          <View className="h-16 w-16 items-center justify-center rounded-full border-2 border-dashed border-accent bg-secondary">
            <Plus color={colors.primary} size={24} />
          </View>
        )}
      </Pressable>
      {group ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={tx('Add story')}
          hitSlop={8}
          onPress={() => router.push('/story/new')}
          className="absolute right-1 top-11 h-6 w-6 items-center justify-center rounded-full border-2 border-background bg-accent"
        >
          <Plus color={colors.accentForeground} size={13} strokeWidth={3} />
        </Pressable>
      ) : null}
      <Text className="text-xs text-foreground">{tx('Your story')}</Text>
    </View>
  );
}

/** Someone else's stories: terracotta ring while there is something new, grey once all are seen. */
function StoryBubble({ group }: { group: StoryGroup }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={tx('Story by {0}', { 0: displayName(group.author) })}
      accessibilityHint={group.allSeen ? undefined : tx('New')}
      onPress={() => router.push({ pathname: '/story/[id]', params: { id: group.authorId } })}
      className="w-20 items-center gap-1"
    >
      <View className={`h-16 w-16 overflow-hidden rounded-full border-2 p-0.5 ${group.allSeen ? 'border-border' : 'border-accent'}`}>
        <Image source={{ uri: group.latest.image_url }} style={{ width: '100%', height: '100%', borderRadius: 999 }} contentFit="cover" />
      </View>
      <Text numberOfLines={1} className={`w-16 text-center text-xs ${group.allSeen ? 'text-muted-foreground' : 'font-semibold text-foreground'}`}>
        {displayName(group.author)}
      </Text>
    </Pressable>
  );
}
