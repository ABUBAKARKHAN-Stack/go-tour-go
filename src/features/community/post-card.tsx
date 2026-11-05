import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Heart, MapPin, MessageCircle, Trash2 } from 'lucide-react-native';
import { memo } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { Text } from '@/components/text';

import { Avatar } from '@/components/avatar';
import { useCommunityActions } from '@/features/community/api';
import { timeAgo } from '@/features/safety/friend-locations';
import { displayName } from '@/features/social/api';
import { colors } from '@/lib/theme';
import type { CommunityPost } from '@/lib/types';

function PostCardBase({ post, userId, detail }: { post: CommunityPost; userId: string | null; detail?: boolean }) {
  const actions = useCommunityActions();
  const liked = post.my_like.length > 0;
  const likes = post.likes[0]?.count ?? 0;
  const comments = post.comments[0]?.count ?? 0;
  const mine = post.author_id === userId;
  const place = post.destination?.name ?? post.place_name;

  const remove = () =>
    Alert.alert('Delete post?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => actions.deletePost.mutate(post.id, { onSuccess: () => detail && router.back() }),
      },
    ]);

  return (
    <View className="gap-3 rounded-3xl border border-border bg-card p-4">
      <View className="flex-row items-center gap-3">
        <Pressable onPress={() => router.push({ pathname: '/users/[id]', params: { id: post.author_id } })}>
          <Avatar profile={post.author} size={40} />
        </Pressable>
        <View className="flex-1">
          <Text className="text-sm font-semibold text-foreground">{displayName(post.author)}</Text>
          <Text className="text-xs text-muted-foreground">{timeAgo(post.created_at)}</Text>
        </View>
        {mine ? (
          <Pressable accessibilityRole="button" accessibilityLabel="Delete post" onPress={remove} hitSlop={10} className="h-10 w-10 items-center justify-center">
            <Trash2 color={colors.mutedForeground} size={18} />
          </Pressable>
        ) : null}
      </View>

      <Pressable disabled={detail} onPress={() => router.push({ pathname: '/post/[id]', params: { id: post.id } })} className="gap-3">
        <Text className="text-[15px] leading-6 text-foreground" numberOfLines={detail ? undefined : 6}>
          {post.body}
        </Text>
        {post.image_url ? (
          <Image source={{ uri: post.image_url }} style={{ width: '100%', aspectRatio: 4 / 3, borderRadius: 18 }} contentFit="cover" cachePolicy="memory-disk" recyclingKey={post.id} />
        ) : null}
      </Pressable>

      {place ? (
        <Pressable
          disabled={!post.destination}
          onPress={() => post.destination && router.push({ pathname: '/destination/[id]', params: { id: post.destination.id } })}
          className="flex-row items-center gap-1"
        >
          <MapPin color={colors.primary} size={14} />
          <Text className="text-xs font-medium text-primary">
            {place}
            {post.destination?.city ? `, ${post.destination.city}` : ''}
          </Text>
        </Pressable>
      ) : null}

      <View className="flex-row items-center gap-6">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={liked ? 'Unlike' : 'Like'}
          accessibilityState={{ selected: liked }}
          onPress={() => actions.toggleLike.mutate({ postId: post.id, like: !liked })}
          className="min-h-10 flex-row items-center gap-1.5"
        >
          <Heart size={20} color={liked ? colors.destructive : colors.mutedForeground} fill={liked ? colors.destructive : 'transparent'} />
          <Text className="text-sm text-muted-foreground">{likes}</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Comments"
          onPress={() => router.push({ pathname: '/post/[id]', params: { id: post.id } })}
          className="min-h-10 flex-row items-center gap-1.5"
        >
          <MessageCircle size={20} color={colors.mutedForeground} />
          <Text className="text-sm text-muted-foreground">{comments}</Text>
        </Pressable>
      </View>
    </View>
  );
}

export const PostCard = memo(PostCardBase);
