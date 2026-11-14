import { Image } from 'expo-image';
import { useState } from 'react';
import { FlatList, Pressable, View } from 'react-native';

import { Text } from '@/components/text';
import { PostVideo } from '@/features/community/post-video';
import { tx } from '@/lib/i18n';
import type { PostMedia } from '@/lib/types';

/**
 * Several photos/videos in one post: swipe sideways, with a "2/5" counter and
 * dots. Videos keep their tap-to-play poster; tapping a photo opens it full screen.
 */
export function MediaCarousel({ media, postId, onPhotoPress }: { media: PostMedia[]; postId: string; onPhotoPress?: (index: number) => void }) {
  const [width, setWidth] = useState(0);
  const [index, setIndex] = useState(0);
  return (
    <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)} style={{ width: '100%' }}>
      {width ? (
        <FlatList
          data={media}
          keyExtractor={(m) => m.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          nestedScrollEnabled
          onMomentumScrollEnd={(e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
          style={{ borderRadius: 18 }}
          renderItem={({ item, index: i }) => (
            <View style={{ width }}>
              {item.type === 'video' ? (
                <PostVideo url={item.url} poster={item.poster_url} durationMs={item.duration_ms} postId={`${postId}-${i}`} />
              ) : (
                <Pressable accessibilityRole="imagebutton" accessibilityLabel={tx('Photo {0} of {1}', { 0: i + 1, 1: media.length })} accessibilityHint={tx('Opens full screen')} onPress={() => onPhotoPress?.(i)}>
                  <Image source={{ uri: item.url }} style={{ width: '100%', aspectRatio: 4 / 3, borderRadius: 18 }} contentFit="cover" cachePolicy="memory-disk" recyclingKey={item.id} />
                </Pressable>
              )}
            </View>
          )}
        />
      ) : (
        <View style={{ width: '100%', aspectRatio: 4 / 3 }} />
      )}
      <View pointerEvents="none" className="absolute right-3 top-3 rounded-full bg-black/60 px-2.5 py-1">
        <Text className="text-xs font-semibold text-white">
          {index + 1}/{media.length}
        </Text>
      </View>
      <View className="mt-2 flex-row justify-center gap-1.5">
        {media.map((m, i) => (
          <View key={m.id} className={`h-1.5 rounded-full ${i === index ? 'w-4 bg-primary' : 'w-1.5 bg-border'}`} />
        ))}
      </View>
    </View>
  );
}
