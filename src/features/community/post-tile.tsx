import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Layers, Play } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/text';
import { tx } from '@/lib/i18n';
import type { CommunityPost } from '@/lib/types';

/** A square in the grid: the first photo (or a video's poster), or the words of a text post. */
export function PostTile({ post, size }: { post: CommunityPost; size: number }) {
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
        <View className="absolute top-1.5" style={{ end: 6 }} pointerEvents="none">
          {video ? <Play color="#fff" fill="#fff" size={16} /> : <Layers color="#fff" size={16} />}
        </View>
      ) : null}
    </Pressable>
  );
}
