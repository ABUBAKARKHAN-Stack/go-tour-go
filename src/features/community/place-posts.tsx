import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Camera, Heart, MessageCircle } from 'lucide-react-native';
import { useMemo } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { AppButton } from '@/components/app-button';
import { Avatar } from '@/components/avatar';
import { SectionHeader } from '@/components/form';
import { Text } from '@/components/text';
import { useFeed, usePlacePostCount } from '@/features/community/api';
import { displayName } from '@/features/social/api';
import { tx } from '@/lib/i18n';
import { colors } from '@/lib/theme';
import type { CommunityPost } from '@/lib/types';
import { useRequireAccount } from '@/features/auth/guest-gate';

const TILE = 148;

/**
 * "Traveller posts" on a destination page (client brief 6.2: see what others
 * shared at this place). Latest posts as tiles, See all, and Post from here.
 */
export function PlacePostsSection({ destinationId, name }: { destinationId: string; name: string }) {
  const feed = useFeed({ destinationId });
  const requireAccount = useRequireAccount();
  const count = usePlacePostCount(destinationId);
  const posts = useMemo(() => (feed.data?.pages[0] ?? []).slice(0, 8), [feed.data]);
  const total = count.data ?? posts.length;
  const postHere = () => requireAccount(tx('post travel moments')) && router.push({ pathname: '/post/new', params: { destination: destinationId } });

  return (
    <View className="gap-3">
      <SectionHeader
        title={total ? tx('Traveller posts ({0})', { 0: total }) : tx('Traveller posts')}
        actionLabel={total ? tx('See all') : undefined}
        onAction={total ? () => router.push({ pathname: '/place-posts/[id]', params: { id: destinationId, name } }) : undefined}
      />
      {posts.length ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-3">
          {posts.map((p) => (
            <PostTile key={p.id} post={p} />
          ))}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={tx('Post from here')}
            onPress={postHere}
            style={{ width: TILE, height: TILE }}
            className="items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border active:bg-muted"
          >
            <Camera color={colors.primary} size={22} />
            <Text className="px-3 text-center text-xs font-semibold text-primary">{tx('Post from here')}</Text>
          </Pressable>
        </ScrollView>
      ) : feed.isLoading ? null : (
        <View className="items-center gap-2 rounded-2xl border border-dashed border-border px-4 py-5">
          <Camera color={colors.mutedForeground} size={22} />
          <Text className="text-center text-sm text-muted-foreground">{tx('No one has posted from {0} yet. Share what you see.', { 0: name })}</Text>
          <AppButton label={tx('Post from here')} size="sm" variant="secondary" onPress={postHere} />
        </View>
      )}
    </View>
  );
}

function PostTile({ post }: { post: CommunityPost }) {
  const likes = post.likes[0]?.count ?? 0;
  const comments = post.comments[0]?.count ?? 0;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={tx('Post by {0}', { 0: displayName(post.author) })}
      onPress={() => router.push({ pathname: '/post/[id]', params: { id: post.id } })}
      style={{ width: TILE, height: TILE }}
      className="overflow-hidden rounded-[20px] bg-card active:opacity-90"
    >
      {post.image_url ? (
        <Image source={{ uri: post.image_url }} style={{ position: 'absolute', inset: 0 }} contentFit="cover" recyclingKey={post.id} cachePolicy="memory-disk" />
      ) : (
        <View className="flex-1 bg-primary-soft p-3">
          <Text numberOfLines={5} className="text-sm leading-5 text-foreground">
            {post.body}
          </Text>
        </View>
      )}
      <View
        className="absolute bottom-0 left-0 right-0 flex-row items-center gap-1.5 px-2 pb-2 pt-6"
        style={{ experimental_backgroundImage: post.image_url ? 'linear-gradient(180deg, rgba(21,56,79,0), rgba(21,56,79,0.78))' : undefined }}
      >
        <Avatar profile={post.author} size={20} />
        <View className="flex-1" />
        <Heart size={12} color={post.image_url ? '#fff' : colors.mutedForeground} />
        <Text className={`text-[11px] ${post.image_url ? 'text-white' : 'text-muted-foreground'}`}>{likes}</Text>
        <MessageCircle size={12} color={post.image_url ? '#fff' : colors.mutedForeground} />
        <Text className={`text-[11px] ${post.image_url ? 'text-white' : 'text-muted-foreground'}`}>{comments}</Text>
      </View>
    </Pressable>
  );
}
