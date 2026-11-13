import { router, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import {
  ArrowLeft,
  Check,
  Grid3x3,
  Layers,
  Lock,
  MapPin,
  MessageCircle,
  Pencil,
  Play,
  Plus,
  Settings,
  UserMinus,
  UserPlus,
} from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton, IconButton } from '@/components/app-button';
import { Avatar } from '@/components/avatar';
import { Skeleton } from '@/components/skeleton';
import { EmptyState, ErrorState } from '@/components/states';
import { Text } from '@/components/text';
import { useAuth } from '@/features/auth/auth-provider';
import { useRequireAccount } from '@/features/auth/guest-gate';
import { formatCount, useAuthorPostCount, useFeed, useStories } from '@/features/community/api';
import { useSeenStories } from '@/features/community/story-seen';
import { startConversation } from '@/features/messaging/api';
import { displayName, useFollowCounts, useFriendships, useProfile, useSocialActions } from '@/features/social/api';
import { errorMessage } from '@/lib/errors';
import { tx } from '@/lib/i18n';
import { brandGradient, colors } from '@/lib/theme';
import type { CommunityPost } from '@/lib/types';

type Tab = 'posts' | 'places';
const GAP = 2;

/**
 * A traveller's community profile, laid out like the photo apps people know:
 * avatar (ringed when they have a story) beside Posts · Followers · Following,
 * then name, city and bio, the actions, and a grid of their posts (or the
 * places they posted from). Your own profile opens here too, with Edit
 * instead of Follow.
 */
export default function UserProfileScreen() {
  const requireAccount = useRequireAccount();
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { userId } = useAuth();
  const me = id === userId;
  const profile = useProfile(id);
  const follows = useFollowCounts(id);
  const postCount = useAuthorPostCount(id);
  const friendships = useFriendships();
  const actions = useSocialActions();
  const feed = useFeed({ authorId: id });
  const stories = useStories();
  const isSeen = useSeenStories();
  const posts = useMemo(() => feed.data?.pages.flat() ?? [], [feed.data]);
  const [tab, setTab] = useState<Tab>('posts');
  const [opening, setOpening] = useState(false);

  const theirStories = (stories.data ?? []).filter((s) => s.author_id === id);
  const unseenStory = theirStories.some((s) => !isSeen(s.id));

  // The places they posted from, most posts first.
  const places = useMemo(() => {
    const byKey = new Map<string, { key: string; name: string; subtitle: string; destinationId: string | null; count: number }>();
    for (const p of posts) {
      const name = p.destination?.name ?? p.place_name;
      if (!name) continue;
      const key = p.destination_id ?? name;
      const entry = byKey.get(key) ?? { key, name, subtitle: p.destination?.city ?? '', destinationId: p.destination_id, count: 0 };
      entry.count += 1;
      byKey.set(key, entry);
    }
    return [...byKey.values()].sort((a, b) => b.count - a.count);
  }, [posts]);

  const status = friendships.statusWith(id);
  const friendship = friendships.friendshipWith(id);
  const onError = (e: unknown) => Alert.alert(tx('Something went wrong'), errorMessage(e));

  const message = async () => {
    setOpening(true);
    try {
      const conversationId = await startConversation(id);
      router.push({ pathname: '/messages/[id]', params: { id: conversationId } });
    } catch (e) {
      onError(e);
    } finally {
      setOpening(false);
    }
  };

  const p = profile.data;
  const tile = (width - GAP * 2) / 3;

  const header = p ? (
    <View className="gap-4 pb-3">
      <View className="flex-row items-center gap-5 px-4">
        <Pressable
          accessibilityRole={theirStories.length ? 'button' : undefined}
          accessibilityLabel={theirStories.length ? tx('Open story') : undefined}
          disabled={!theirStories.length}
          onPress={() => router.push({ pathname: '/story/[id]', params: { id } })}
          className="rounded-full p-[3px]"
          style={theirStories.length ? (unseenStory ? { experimental_backgroundImage: brandGradient } : { backgroundColor: colors.border }) : undefined}
        >
          <View className="rounded-full border-[3px] border-background">
            <Avatar profile={p} size={84} />
          </View>
        </Pressable>
        <View className="flex-1 flex-row justify-between">
          <Stat value={postCount.data ?? posts.length} label={tx('Posts')} />
          <Stat value={follows.data?.followers ?? 0} label={tx('Followers')} onPress={() => router.push({ pathname: '/follows/[id]', params: { id, tab: 'followers' } })} />
          <Stat value={follows.data?.following ?? 0} label={tx('Following')} onPress={() => router.push({ pathname: '/follows/[id]', params: { id, tab: 'following' } })} />
        </View>
      </View>

      <View className="gap-1 px-4">
        <Text className="text-base font-bold text-heading">{displayName(p)}</Text>
        {p.home_city ? (
          <View className="flex-row items-center gap-1">
            <MapPin color={colors.mutedForeground} size={13} />
            <Text className="text-sm text-muted-foreground">{p.home_city}</Text>
          </View>
        ) : null}
        {p.bio ? <Text className="text-sm leading-5 text-foreground">{p.bio}</Text> : null}
      </View>

      <View className="flex-row gap-2 px-4">
        {me ? (
          <>
            <AppButton label={tx('Edit profile')} icon={Pencil} size="sm" variant="secondary" onPress={() => router.push('/profile/edit')} className="flex-1" />
            <AppButton label={tx('New post')} icon={Plus} size="sm" variant="secondary" onPress={() => router.push('/post/new')} className="flex-1" />
          </>
        ) : (
          <>
            <AppButton
              label={follows.data?.isFollowing ? tx('Following') : tx('Follow')}
              size="sm"
              variant={follows.data?.isFollowing ? 'secondary' : 'primary'}
              onPress={() => requireAccount(tx('follow travellers')) && actions.toggleFollow.mutate({ target: id, follow: !follows.data?.isFollowing }, { onError })}
              className="flex-1"
            />
            {status === 'friends' ? (
              <AppButton label={tx('Message')} icon={MessageCircle} size="sm" variant="secondary" loading={opening} onPress={message} className="flex-1" />
            ) : status === 'incoming' && friendship ? (
              <AppButton
                label={tx('Accept request')}
                icon={Check}
                size="sm"
                variant="secondary"
                onPress={() => requireAccount(tx('add friends')) && actions.respond.mutate({ id: friendship.id, accept: true }, { onError })}
                className="flex-1"
              />
            ) : status === 'outgoing' ? (
              <AppButton label={tx('Request sent')} size="sm" variant="secondary" disabled className="flex-1" />
            ) : p.allow_friend_requests ? (
              <AppButton
                label={tx('Add friend')}
                icon={UserPlus}
                size="sm"
                variant="secondary"
                loading={actions.sendRequest.isPending}
                onPress={() => requireAccount(tx('add friends')) && actions.sendRequest.mutate(id, { onError })}
                className="flex-1"
              />
            ) : null}
            {status === 'friends' && friendship ? (
              <IconButton
                icon={UserMinus}
                label={tx('Remove friend')}
                onPress={() =>
                  Alert.alert(tx('Remove friend?'), tx('They will no longer see your shared location or message you.'), [
                    { text: tx('Cancel'), style: 'cancel' },
                    { text: tx('Remove'), style: 'destructive', onPress: () => actions.remove.mutate(friendship.id, { onError }) },
                  ])
                }
              />
            ) : null}
          </>
        )}
      </View>

      <View className="flex-row border-b border-border" accessibilityRole="tablist">
        <TabButton active={tab === 'posts'} icon={Grid3x3} label={tx('Posts')} onPress={() => setTab('posts')} />
        <TabButton active={tab === 'places'} icon={MapPin} label={tx('Places')} onPress={() => setTab('places')} />
      </View>
    </View>
  ) : undefined;

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center gap-2 px-2 pb-2 pt-1">
        <IconButton icon={ArrowLeft} flip label={tx('Go back')} onPress={() => (router.canGoBack() ? router.back() : router.replace('/community'))} />
        <Text accessibilityRole="header" className="flex-1 text-lg font-bold text-heading">
          {p ? `@${p.username}` : tx('Traveler')}
        </Text>
        {me ? <IconButton icon={Settings} label={tx('Settings')} onPress={() => router.push('/settings')} /> : null}
      </View>

      {profile.isLoading ? (
        <Skeleton variant="profile" label={tx('Loading...')} />
      ) : profile.isError ? (
        <ErrorState error={profile.error} onRetry={profile.refetch} />
      ) : !p ? (
        <EmptyState icon={Lock} title={tx('Profile is private')} message={tx('This traveler only shares their profile with friends.')} />
      ) : tab === 'posts' ? (
        <FlatList
          key="posts"
          data={posts}
          keyExtractor={(post) => post.id}
          numColumns={3}
          columnWrapperStyle={{ gap: GAP }}
          contentContainerStyle={{ gap: GAP, paddingBottom: insets.bottom + 24 }}
          ListHeaderComponent={header}
          onEndReached={() => feed.hasNextPage && !feed.isFetchingNextPage && feed.fetchNextPage()}
          onEndReachedThreshold={0.6}
          renderItem={({ item }) => <PostTile post={item} size={tile} />}
          ListEmptyComponent={
            feed.isLoading ? (
              <Skeleton variant="cards" label={tx('Loading...')} />
            ) : (
              <EmptyState
                icon={Grid3x3}
                title={me ? tx('Share your first travel moment') : tx('No posts yet')}
                message={me ? tx('Your posts appear here as a grid.') : tx('When they post, it will show here.')}
                actionLabel={me ? tx('New post') : undefined}
                onAction={me ? () => router.push('/post/new') : undefined}
              />
            )
          }
        />
      ) : (
        <FlatList
          key="places"
          data={places}
          keyExtractor={(pl) => pl.key}
          contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
          ListHeaderComponent={header}
          renderItem={({ item }) => (
            <Pressable
              accessibilityRole={item.destinationId ? 'button' : undefined}
              disabled={!item.destinationId}
              onPress={() => item.destinationId && router.push({ pathname: '/destination/[id]', params: { id: item.destinationId } })}
              className="min-h-14 flex-row items-center gap-3 px-4 py-2.5 active:bg-muted"
            >
              <View className="h-10 w-10 items-center justify-center rounded-full bg-primary-soft">
                <MapPin color={colors.primary} size={18} />
              </View>
              <View className="flex-1">
                <Text className="text-[15px] font-semibold text-heading">{item.name}</Text>
                {item.subtitle ? <Text className="text-xs text-muted-foreground">{item.subtitle}</Text> : null}
              </View>
              <Text className="text-xs text-muted-foreground">{item.count === 1 ? tx('1 post') : tx('{0} posts', { 0: item.count })}</Text>
            </Pressable>
          )}
          ListEmptyComponent={<EmptyState icon={MapPin} title={tx('No places yet')} message={tx('Places tagged in posts appear here.')} />}
        />
      )}
    </View>
  );
}

function Stat({ value, label, onPress }: { value: number; label: string; onPress?: () => void }) {
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={`${value} ${label}`}
      disabled={!onPress}
      onPress={onPress}
      hitSlop={6}
      className="min-w-16 items-center rounded-xl py-1 active:bg-muted"
    >
      <Text className="text-lg font-bold text-heading" style={{ fontVariant: ['tabular-nums'] }}>
        {formatCount(value)}
      </Text>
      <Text className="text-[13px] text-muted-foreground">{label}</Text>
    </Pressable>
  );
}

function TabButton({ active, icon: Icon, label, onPress }: { active: boolean; icon: typeof Grid3x3; label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      accessibilityLabel={label}
      onPress={onPress}
      className={`min-h-12 flex-1 items-center justify-center border-b-2 ${active ? 'border-heading' : 'border-transparent'}`}
    >
      <Icon color={active ? colors.heading : colors.faint} size={22} />
    </Pressable>
  );
}

/** A square in the grid: the first photo (or a video's poster), or the words of a text post. */
function PostTile({ post, size }: { post: CommunityPost; size: number }) {
  const media = post.media ?? [];
  const first = media[0];
  const thumb = first ? (first.type === 'video' ? first.poster_url : first.url) : post.image_url;
  const video = first ? first.type === 'video' : Boolean(post.video_url);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={post.body || tx('Post')}
      onPress={() => router.push({ pathname: '/post/[id]', params: { id: post.id } })}
      style={{ width: size, height: size }}
      className="overflow-hidden bg-muted active:opacity-80"
    >
      {thumb ? (
        <Image source={{ uri: thumb }} recyclingKey={post.id} contentFit="cover" transition={150} style={{ width: '100%', height: '100%' }} />
      ) : (
        <View className="flex-1 justify-center bg-primary-soft p-2.5">
          <Text numberOfLines={5} className="text-[13px] leading-[18px] text-heading">
            {post.body}
          </Text>
        </View>
      )}
      {media.length > 1 || video ? (
        <View className="absolute end-1.5 top-1.5" pointerEvents="none">
          {video ? <Play color="#fff" fill="#fff" size={16} /> : <Layers color="#fff" size={16} />}
        </View>
      ) : null}
    </Pressable>
  );
}
