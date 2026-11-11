import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Compass, MapPin, MessagesSquare, PenSquare, Pencil, Plus, Search, Users } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, ScrollView, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconButton } from '@/components/app-button';
import { BrandLogo } from '@/components/brand';
import { Chip } from '@/components/form';
import { Screen } from '@/components/screen';
import { EmptyState, ErrorState, LoadingState } from '@/components/states';
import { useTabBarSpace } from '@/components/tab-bar';
import { Text } from '@/components/text';
import { useAuth } from '@/features/auth/auth-provider';
import { useRequireAccount } from '@/features/auth/guest-gate';
import { useCommenterRatings, useFeed, useStories } from '@/features/community/api';
import { useUnreadConversations } from '@/features/inbox/api';
import { requestLocationPermission } from '@/features/location/location-provider';
import { useLastLocation } from '@/features/location/location-store';
import { usePressScale } from '@/lib/motion';
import { orderStoryAuthors, useSeenStories, type StoryGroup } from '@/features/community/story-seen';
import { PendingUploads } from '@/features/community/pending-uploads';
import { PostCard } from '@/features/community/post-card';
import { displayName, useFriendships, useMyFollowingIds } from '@/features/social/api';
import { brandGradient, colors, shadow } from '@/lib/theme';
import { tx } from '@/lib/i18n';

type FeedTab = 'all' | 'nearby' | 'following';

/** The Nearby feed: posts tagged within this distance of you. */
const NEARBY_KM = 50;

const FEED_TABS = [
  { value: 'all', label: tx('For you'), icon: Compass },
  { value: 'nearby', label: tx('Nearby'), icon: MapPin },
  { value: 'following', label: tx('Following'), icon: Users },
] as const;

export default function CommunityScreen() {
  const requireAccount = useRequireAccount();
  const insets = useSafeAreaInsets();
  const { userId } = useAuth();
  const [tab, setTab] = useState<FeedTab>('all');
  const here = useLastLocation();
  const unread = useUnreadConversations();
  const tabSpace = useTabBarSpace();
  const following = useMyFollowingIds();
  const friendships = useFriendships();
  // Following feed: people you follow, your friends and you.
  const circle = useMemo(() => {
    const ids = new Set(following.data ?? []);
    for (const f of friendships.friends) ids.add(f.profile.id);
    if (userId) ids.add(userId);
    return [...ids];
  }, [following.data, friendships.friends, userId]);
  const feed = useFeed(
    tab === 'following'
      ? { authorIds: circle }
      : tab === 'nearby'
        ? here
          ? { near: { latitude: here.latitude, longitude: here.longitude, km: NEARBY_KM } }
          : { authorIds: [] } // no location yet: empty, with a prompt below
        : undefined,
  );
  const stories = useStories();
  const isSeen = useSeenStories();
  const posts = useMemo(() => feed.data?.pages.flat() ?? [], [feed.data]);
  const commenterRatings = useCommenterRatings(posts);
  const groups = useMemo(() => orderStoryAuthors(stories.data ?? [], userId, isSeen), [stories.data, userId, isSeen]);
  const mine = groups.find((g) => g.authorId === userId);
  const others = groups.filter((g) => g.authorId !== userId);

  return (
    <Screen inTabs headerless scroll={false}>
      {/* Soft sky wash behind the header (design guide). */}
      <View
        pointerEvents="none"
        style={{ position: 'absolute', left: 0, right: 0, top: -insets.top, height: insets.top + 220, experimental_backgroundImage: 'linear-gradient(180deg, #DCEEF7, rgba(246,250,252,0))' }}
      />
      <View className="flex-row items-center gap-2 px-4 pb-2 pt-1">
        <View className="flex-1">
          <BrandLogo height={38} />
        </View>
        <IconButton icon={Search} label={tx('Search travellers and posts')} onPress={() => router.push('/community-search')} />
        <IconButton
          icon={MessagesSquare}
          label={unread.size ? tx('Messages, {0} unread', { 0: unread.size }) : tx('Messages')}
          badge={unread.size}
          onPress={() => router.push('/messages')}
        />
      </View>
      <FlatList
        data={posts}
        keyExtractor={(p) => p.id}
        contentContainerClassName="gap-4 px-4 pt-2"
        contentContainerStyle={{ paddingBottom: tabSpace + 64 }}
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
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-4" contentContainerClassName="gap-2 px-4">
              {FEED_TABS.map((t) => (
                <Chip
                  key={t.value}
                  label={t.label}
                  selected={tab === t.value}
                  icon={<t.icon size={15} color={tab === t.value ? colors.primaryForeground : colors.primary} />}
                  onPress={() => setTab(t.value)}
                />
              ))}
            </ScrollView>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-4" contentContainerClassName="gap-3 px-4">
              <OwnStoryBubble group={mine} />
              {others.map((g) => (
                <StoryBubble key={g.authorId} group={g} />
              ))}
            </ScrollView>
            <PendingUploads />
          </View>
        }
        ListEmptyComponent={
          feed.isLoading ? (
            <LoadingState variant="feed" label={tx('Loading posts...')} />
          ) : feed.isError ? (
            <ErrorState error={feed.error} onRetry={feed.refetch} />
          ) : tab === 'nearby' && !here ? (
            <EmptyState
              icon={MapPin}
              title={tx('See posts near you')}
              message={tx('Turn on location to see what travellers shared within {0} km.', { 0: NEARBY_KM })}
              actionLabel={tx('Turn on location')}
              onAction={() => void requestLocationPermission()}
            />
          ) : tab === 'nearby' ? (
            <EmptyState
              icon={MapPin}
              title={tx('No posts nearby yet')}
              message={tx('Nobody has posted within {0} km of you. Share the first one.', { 0: NEARBY_KM })}
              actionLabel={tx('Create post')}
              onAction={() => requireAccount(tx('post travel moments')) && router.push('/post/new')}
            />
          ) : tab === 'following' ? (
            <EmptyState
              icon={Users}
              title={tx('Nothing from your circle yet')}
              message={tx('Posts from people you follow and your friends appear here.')}
              actionLabel={tx('Find travellers')}
              onAction={() => router.push('/friends')}
            />
          ) : (
            <EmptyState icon={PenSquare} title={tx('No posts yet')} message={tx('Be the first to share a travel moment.')} actionLabel={tx('Create post')} onAction={() => requireAccount(tx('post travel moments')) && router.push('/post/new')} />
          )
        }
        ListFooterComponent={feed.isFetchingNextPage ? <ActivityIndicator color={colors.primary} /> : undefined}
        renderItem={({ item }) => (
          <PostCard
            post={item}
            userId={userId}
            commenterRating={item.destination_id && item.top_comment?.[0] ? commenterRatings[`${item.top_comment[0].author_id}:${item.destination_id}`] : undefined}
          />
        )}
      />
      <ComposeButton bottom={tabSpace - 8} />
    </Screen>
  );
}

/** Floating "new post" button above the tab bar. */
function ComposeButton({ bottom }: { bottom: number }) {
  const requireAccount = useRequireAccount();
  const press = usePressScale(0.94);
  return (
    <Animated.View style={[press.style, { position: 'absolute', end: 20, bottom }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={tx('Share a travel moment')}
        onPress={() => requireAccount(tx('post travel moments')) && router.push('/post/new')}
        {...press.handlers}
        className="h-14 w-14 items-center justify-center rounded-full"
        style={{ experimental_backgroundImage: brandGradient, boxShadow: shadow(0.3, 6, 16) }}
      >
        <Pencil color="#fff" size={22} />
      </Pressable>
    </Animated.View>
  );
}

/** Your bubble: your latest story with a + to add another, or a dashed + when you have none. */
function OwnStoryBubble({ group }: { group: StoryGroup | undefined }) {
  const requireAccount = useRequireAccount();
  return (
    <View className="w-20 items-center gap-1">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={group ? tx('View your story') : tx('Add story')}
        onPress={() => (group ? router.push({ pathname: '/story/[id]', params: { id: group.authorId } }) : requireAccount(tx('post stories')) && router.push('/story/new'))}
      >
        {group ? (
          <View className="h-[68px] w-[68px] overflow-hidden rounded-full border-[2.5px] border-border-strong bg-card p-0.5">
            <Image source={{ uri: group.latest.image_url }} style={{ width: '100%', height: '100%', borderRadius: 999 }} contentFit="cover" />
          </View>
        ) : (
          <View className="h-[68px] w-[68px] items-center justify-center rounded-full border-2 border-dashed border-primary bg-primary-soft">
            <Plus color={colors.primary} size={24} />
          </View>
        )}
      </Pressable>
      {group ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={tx('Add story')}
          hitSlop={8}
          onPress={() => requireAccount(tx('post stories')) && router.push('/story/new')}
          className="absolute end-0.5 top-12 h-6 w-6 items-center justify-center rounded-full border-2 border-background bg-primary"
        >
          <Plus color="#fff" size={13} strokeWidth={3} />
        </Pressable>
      ) : null}
      <Text className="text-xs font-medium text-heading">{tx('Your story')}</Text>
    </View>
  );
}

/** Someone else's stories: a sky ring while there is something new, grey once all are seen. */
function StoryBubble({ group }: { group: StoryGroup }) {
  // A story tagged at a place is labelled with the place (the name is in the accessibility label).
  const place = group.latest.place_name?.split(',')[0]?.trim() || null;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={place ? tx('Story by {0} at {1}', { 0: displayName(group.author), 1: place }) : tx('Story by {0}', { 0: displayName(group.author) })}
      accessibilityHint={group.allSeen ? undefined : tx('New')}
      onPress={() => router.push({ pathname: '/story/[id]', params: { id: group.authorId } })}
      className="w-20 items-center gap-1"
    >
      <View className={`h-[68px] w-[68px] overflow-hidden rounded-full border-[2.5px] bg-card p-0.5 ${group.allSeen ? 'border-border-strong' : 'border-sky-strong'}`}>
        <Image source={{ uri: group.latest.image_url }} style={{ width: '100%', height: '100%', borderRadius: 999 }} contentFit="cover" />
      </View>
      {place ? (
        <View className="absolute end-0.5 top-0 h-6 w-6 items-center justify-center rounded-full border-2 border-background bg-primary">
          <MapPin color="#fff" size={12} />
        </View>
      ) : null}
      <Text numberOfLines={1} className={`w-[72px] text-center text-xs ${group.allSeen ? 'text-muted-foreground' : 'font-semibold text-heading'}`}>
        {place ?? displayName(group.author)}
      </Text>
    </Pressable>
  );
}
