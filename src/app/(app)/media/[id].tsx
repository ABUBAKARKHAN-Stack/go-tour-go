import { router, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Play, X } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, useWindowDimensions, View } from 'react-native';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import Animated, { Extrapolation, interpolate, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import { Text } from '@/components/text';
import { Zoomable } from '@/components/zoomable';
import { usePost } from '@/features/community/api';
import { takeViewerPost, viewerItems, type ViewerItem } from '@/features/community/media-viewer';
import { displayName } from '@/features/social/api';
import { tx } from '@/lib/i18n';

/**
 * A post's photos and videos full screen on black: swipe sideways between
 * them, swipe down (or back) to close, pinch or double-tap to zoom (photos
 * and videos). A video plays only while it is the one on screen.
 */
export default function MediaViewer() {
  const { id, index } = useLocalSearchParams<{ id: string; index?: string }>();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const [handed] = useState(() => takeViewerPost(id));
  const fetched = usePost(handed ? undefined : id);
  const post = handed ?? fetched.data ?? null;
  const items = post ? viewerItems(post) : [];
  const start = Math.min(Math.max(0, Number(index) || 0), Math.max(0, items.length - 1));
  const [current, setCurrent] = useState(start);
  // While a photo or video is zoomed in, swipes move it instead of paging or closing.
  const [zoomed, setZoomed] = useState(false);

  // Swipe down to close: the photo follows the finger and the black fades.
  const y = useSharedValue(0);
  const close = () => (router.canGoBack() ? router.back() : router.replace('/community'));
  const pan = usePanGesture({
    enabled: !zoomed,
    activeOffsetY: [-14, 14],
    failOffsetX: [-18, 18],
    onUpdate: (e) => {
      'worklet';
      y.set(e.translationY);
    },
    onDeactivate: (e) => {
      'worklet';
      if (Math.abs(e.translationY) > 120 || Math.abs(e.velocityY) > 900) {
        scheduleOnRN(close);
      } else {
        y.set(withSpring(0, { duration: 300, dampingRatio: 0.85, velocity: e.velocityY }));
      }
    },
  });
  const pageStyle = useAnimatedStyle(() => ({ transform: [{ translateY: y.get() }] }));
  const backdropStyle = useAnimatedStyle(() => ({ opacity: interpolate(Math.abs(y.get()), [0, 300], [1, 0.35], Extrapolation.CLAMP) }));

  return (
    <View className="flex-1">
      <StatusBar style="light" />
      <Animated.View className="absolute inset-0 bg-black" style={backdropStyle} />
      {!post ? (
        <View className="flex-1 items-center justify-center">
          {fetched.isLoading ? <ActivityIndicator color="#fff" /> : <Text className="text-white">{tx('Post not found')}</Text>}
        </View>
      ) : (
        <GestureDetector gesture={pan}>
          <Animated.View className="flex-1" style={pageStyle}>
            <FlatList
              data={items}
              keyExtractor={(m) => m.key}
              horizontal
              pagingEnabled
              scrollEnabled={!zoomed}
              showsHorizontalScrollIndicator={false}
              initialScrollIndex={start}
              getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
              onMomentumScrollEnd={(e) => {
                setCurrent(Math.round(e.nativeEvent.contentOffset.x / width));
                setZoomed(false);
              }}
              renderItem={({ item, index: i }) => (
                <View style={{ width, height }} className="items-center justify-center overflow-hidden">
                  <Zoomable width={width} height={height} onZoomChange={setZoomed}>
                    <Page item={item} active={i === current} width={width} height={height} />
                  </Zoomable>
                </View>
              )}
            />
          </Animated.View>
        </GestureDetector>
      )}

      <View className="absolute left-0 right-0 top-0 flex-row items-center gap-3 px-3" style={{ paddingTop: insets.top + 6 }} pointerEvents="box-none">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={tx('Close')}
          onPress={close}
          hitSlop={8}
          className="h-11 w-11 items-center justify-center rounded-full bg-black/45 active:opacity-70"
        >
          <X color="#fff" size={22} />
        </Pressable>
        <Text numberOfLines={1} className="flex-1 text-[15px] font-semibold text-white">
          {post ? displayName(post.author) : ''}
        </Text>
        {items.length > 1 ? (
          <View className="rounded-full bg-black/45 px-3 py-1">
            <Text className="text-xs font-semibold text-white" style={{ fontVariant: ['tabular-nums'] }}>
              {current + 1} / {items.length}
            </Text>
          </View>
        ) : null}
      </View>

      {post?.body ? (
        <View className="absolute bottom-0 left-0 right-0 px-4 pt-6" style={{ paddingBottom: insets.bottom + 16, experimental_backgroundImage: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.65) 100%)' }} pointerEvents="none">
          <Text numberOfLines={3} className="text-sm leading-5 text-white">
            {post.body}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

function Page({ item, active, width, height }: { item: ViewerItem; active: boolean; width: number; height: number }) {
  if (item.type === 'image') {
    return <Image source={{ uri: item.url }} style={{ width, height }} contentFit="contain" cachePolicy="memory-disk" transition={150} accessibilityLabel={tx('Photo')} />;
  }
  // Only the video on screen gets a player; the others show their poster.
  return active ? (
    <ViewerVideo url={item.url} width={width} height={height} />
  ) : (
    <View style={{ width, height }} className="items-center justify-center">
      {item.poster ? <Image source={{ uri: item.poster }} style={{ position: 'absolute', width, height }} contentFit="contain" /> : null}
      <View className="h-16 w-16 items-center justify-center rounded-full bg-black/55">
        <Play color="#fff" fill="#fff" size={28} style={{ marginLeft: 4 }} />
      </View>
    </View>
  );
}

function ViewerVideo({ url, width, height }: { url: string; width: number; height: number }) {
  const player = useVideoPlayer({ uri: url, useCaching: true }, (p) => {
    p.loop = false;
    p.play();
  });
  return <VideoView player={player} style={{ width, height }} contentFit="contain" nativeControls />;
}
