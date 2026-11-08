import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Bookmark, ChevronRight, Heart, MapPin, MessageCircle, MoreVertical, Share2, Star } from 'lucide-react-native';
import { memo, useRef, useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import Animated, { useReducedMotion } from 'react-native-reanimated';
import { Text } from '@/components/text';

import { Avatar } from '@/components/avatar';
import { formatCount, useCommunityActions } from '@/features/community/api';
import { PostVideo } from '@/features/community/post-video';
import { useRatings } from '@/features/destinations/api';
import { timeAgo } from '@/features/safety/friend-locations';
import { displayName } from '@/features/social/api';
import { haptics } from '@/lib/haptics';
import { CSS_EASE_OUT } from '@/lib/motion';
import { colors } from '@/lib/theme';
import type { CommunityPost } from '@/lib/types';
import { flipX, tx } from '@/lib/i18n';

const DOUBLE_TAP_MS = 260;

/** Big heart over the photo after a double-tap (rare, user-caused: the delight tier). */
const HEART_BURST = {
  from: { opacity: 0, transform: [{ scale: 0.6 }] },
  '25%': { opacity: 1, transform: [{ scale: 1.1 }] },
  '45%': { opacity: 1, transform: [{ scale: 1 }] },
  to: { opacity: 0, transform: [{ scale: 1 }] },
};
/** Small pop on the like button when it turns on. */
const LIKE_POP = {
  from: { transform: [{ scale: 0.8 }] },
  '50%': { transform: [{ scale: 1.2 }] },
  to: { transform: [{ scale: 1 }] },
};

type Props = {
  post: CommunityPost;
  userId: string | null;
  detail?: boolean;
  /** Stars the top commenter gave this landmark, if they reviewed it. */
  commenterRating?: number;
};

function PostCardBase({ post, userId, detail, commenterRating }: Props) {
  const actions = useCommunityActions();
  const ratings = useRatings();
  const liked = post.my_like.length > 0;
  const saved = (post.my_save?.length ?? 0) > 0;
  const likes = post.likes[0]?.count ?? 0;
  const comments = post.comments[0]?.count ?? 0;
  const shares = post.shares?.[0]?.count ?? 0;
  const placeRating = post.destination_id ? ratings.data?.[post.destination_id] : undefined;
  const topComment = detail ? undefined : post.top_comment?.[0];
  const mine = post.author_id === userId;
  const place = post.destination?.name ?? post.place_name;
  const reduced = useReducedMotion();
  const [burst, setBurst] = useState(0);
  // Bumped only when the traveller likes, so loading a liked post doesn't pop.
  const [pops, setPops] = useState(0);
  const lastTap = useRef(0);
  const singleTap = useRef<ReturnType<typeof setTimeout> | null>(null);

  const open = () => router.push({ pathname: '/post/[id]', params: { id: post.id } });
  const like = (value: boolean) => {
    if (value) setPops((n) => n + 1);
    if (value) haptics.on();
    else haptics.off();
    actions.toggleLike.mutate({ postId: post.id, like: value });
  };

  // Photo: double-tap likes (never unlikes); a single tap opens the post, after
  // waiting just long enough to tell the two apart.
  const onPhotoPress = () => {
    const now = Date.now();
    if (now - lastTap.current < DOUBLE_TAP_MS) {
      if (singleTap.current) clearTimeout(singleTap.current);
      lastTap.current = 0;
      setBurst((b) => b + 1);
      if (!liked) like(true);
      return;
    }
    lastTap.current = now;
    if (detail) return;
    singleTap.current = setTimeout(open, DOUBLE_TAP_MS);
  };

  const openPlace = () => post.destination && router.push({ pathname: '/destination/[id]', params: { id: post.destination.id } });

  const menu = () =>
    Alert.alert(tx('Post'), undefined, [
      { text: tx('Share'), onPress: () => actions.sharePost.mutate(post) },
      { text: tx('Delete post'), style: 'destructive', onPress: remove },
      { text: tx('Cancel'), style: 'cancel' },
    ]);

  const remove = () =>
    Alert.alert(tx('Delete post?'), tx('This cannot be undone.'), [
      { text: tx('Cancel'), style: 'cancel' },
      {
        text: tx('Delete'),
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
          <Text numberOfLines={1} className="text-sm font-semibold text-foreground">
            {displayName(post.author)}
          </Text>
          <View className="flex-row items-center gap-1">
            {place ? (
              <Pressable disabled={!post.destination} onPress={openPlace} hitSlop={4} className="shrink flex-row items-center gap-1">
                <MapPin color={colors.primary} size={12} />
                <Text numberOfLines={1} className="shrink text-xs font-medium text-primary">
                  {place}
                  {post.destination?.city ? `, ${post.destination.city}` : ''}
                </Text>
              </Pressable>
            ) : null}
            <Text className="text-xs text-muted-foreground">{place ? `· ${timeAgo(post.created_at)}` : timeAgo(post.created_at)}</Text>
          </View>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={saved ? tx('Remove from saved') : tx('Save post')}
          accessibilityState={{ selected: saved }}
          onPress={() => {
            if (saved) haptics.off();
            else haptics.on();
            actions.toggleSave.mutate({ postId: post.id, save: !saved });
          }}
          hitSlop={8}
          className="h-10 w-9 items-center justify-center"
        >
          <Bookmark size={20} color={saved ? colors.primary : colors.mutedForeground} fill={saved ? colors.primary : 'transparent'} />
        </Pressable>
        {mine ? (
          <Pressable accessibilityRole="button" accessibilityLabel={tx('More options')} onPress={menu} hitSlop={8} className="h-10 w-8 items-center justify-center">
            <MoreVertical color={colors.mutedForeground} size={20} />
          </Pressable>
        ) : null}
      </View>

      <Pressable disabled={detail} onPress={open}>
        <Text className="text-[15px] leading-6 text-foreground" numberOfLines={detail ? undefined : 6}>
          {post.body}
        </Text>
      </Pressable>
      {post.video_url ? (
        <PostVideo url={post.video_url} poster={post.image_url} durationMs={post.video_duration_ms} postId={post.id} />
      ) : post.image_url ? (
        <Pressable
          accessibilityRole="imagebutton"
          accessibilityLabel={tx('Photo. Double-tap to like.')}
          accessibilityActions={[{ name: 'activate' }, { name: 'longpress', label: tx('Like') }]}
          onAccessibilityAction={(e) => (e.nativeEvent.actionName === 'longpress' ? like(true) : open())}
          onPress={onPhotoPress}
        >
          <Image source={{ uri: post.image_url }} style={{ width: '100%', aspectRatio: 4 / 3, borderRadius: 18 }} contentFit="cover" cachePolicy="memory-disk" recyclingKey={post.id} />
          {burst ? (
            <View pointerEvents="none" className="absolute inset-0 items-center justify-center">
              <Animated.View
                key={burst}
                style={{
                  opacity: 0,
                  animationName: reduced ? { from: { opacity: 0 }, '30%': { opacity: 1 }, to: { opacity: 0 } } : HEART_BURST,
                  animationDuration: 800,
                  animationTimingFunction: CSS_EASE_OUT,
                  animationFillMode: 'forwards',
                }}
              >
                <Heart size={88} color="#fff" fill="#fff" />
              </Animated.View>
            </View>
          ) : null}
        </Pressable>
      ) : null}

      <View className="flex-row items-center gap-5">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={liked ? tx('Unlike') : tx('Like')}
          accessibilityState={{ selected: liked }}
          onPress={() => like(!liked)}
          hitSlop={6}
          className="min-h-10 flex-row items-center gap-1.5"
        >
          <Animated.View
            key={pops}
            style={liked && pops > 0 && !reduced ? { animationName: LIKE_POP, animationDuration: 300, animationTimingFunction: CSS_EASE_OUT } : undefined}
          >
            <Heart size={20} color={liked ? colors.destructive : colors.mutedForeground} fill={liked ? colors.destructive : 'transparent'} />
          </Animated.View>
          <Text className="text-sm text-muted-foreground">{formatCount(likes)}</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={tx('Comments')}
          onPress={open}
          hitSlop={6}
          className="min-h-10 flex-row items-center gap-1.5"
        >
          <MessageCircle size={20} color={colors.mutedForeground} />
          <Text className="text-sm text-muted-foreground">{formatCount(comments)}</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={tx('Share')}
          onPress={() => actions.sharePost.mutate(post)}
          hitSlop={6}
          className="min-h-10 flex-row items-center gap-1.5"
        >
          <Share2 size={19} color={colors.mutedForeground} />
          {shares > 0 ? <Text className="text-sm text-muted-foreground">{formatCount(shares)}</Text> : null}
        </Pressable>
        <View className="flex-1" />
        {placeRating && placeRating.review_count > 0 ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={tx('{0} rating from {1} reviews', { 0: placeRating.average_rating.toFixed(1), 1: placeRating.review_count })}
            onPress={openPlace}
            className="min-h-9 flex-row items-center gap-1 rounded-xl bg-secondary px-2.5"
          >
            <Star size={14} color={colors.primary} />
            <Text className="text-sm font-semibold text-primary">{Number(placeRating.average_rating).toFixed(1)}</Text>
          </Pressable>
        ) : null}
      </View>

      {topComment ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={tx('Comment by {0}: {1}', { 0: displayName(topComment.author), 1: topComment.body })}
          onPress={open}
          className="flex-row items-center gap-3 rounded-2xl bg-secondary p-3"
        >
          <Avatar profile={topComment.author} size={32} />
          <View className="flex-1 gap-0.5">
            <View className="flex-row items-center gap-2">
              <Text numberOfLines={1} className="shrink text-sm font-semibold text-foreground">
                {displayName(topComment.author)}
              </Text>
              {commenterRating ? (
                <View className="flex-row items-center gap-0.5 rounded-md bg-card px-1.5 py-0.5">
                  <Star size={11} color={colors.primary} fill={colors.primary} />
                  <Text className="text-xs font-semibold text-primary">{commenterRating.toFixed(1)}</Text>
                </View>
              ) : null}
            </View>
            <Text numberOfLines={1} className="text-sm text-muted-foreground">
              {topComment.body}
            </Text>
          </View>
          <ChevronRight size={18} color={colors.mutedForeground} style={flipX} />
        </Pressable>
      ) : null}
    </View>
  );
}

export const PostCard = memo(PostCardBase);
