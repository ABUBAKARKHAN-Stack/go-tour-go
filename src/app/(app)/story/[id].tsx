import { Image } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';
import { router, useLocalSearchParams } from 'expo-router';
import { MapPin, Trash2, X } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/avatar';
import { Text } from '@/components/text';
import { useAuth } from '@/features/auth/auth-provider';
import { useStories, useStoryActions } from '@/features/community/api';
import { markStorySeen, orderStoryAuthors, useSeenStories } from '@/features/community/story-seen';
import { timeAgo } from '@/features/safety/friend-locations';
import { displayName } from '@/features/social/api';
import { tx } from '@/lib/i18n';

const STORY_MS = 6000;
const MAX_VIDEO_MS = 60_000;

/** How long a story stays up: a photo 6 s, a video its own length (at most 60 s). */
function storyLength(s: { video_url?: string | null; video_duration_ms?: number | null }) {
  if (!s.video_url) return STORY_MS;
  return Math.min(MAX_VIDEO_MS, Math.max(STORY_MS / 2, s.video_duration_ms ?? STORY_MS * 2));
}
const FILL = { from: { width: '0%' }, to: { width: '100%' } } as const;

/**
 * Story viewer (route param = author id). Tap right / left to move, hold to
 * pause, X to close. After an author's last story it continues with the next
 * author in the strip's order, like other story apps.
 */
export default function StoryViewer() {
  const { id: authorId } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { userId } = useAuth();
  const stories = useStories();
  const actions = useStoryActions();
  const isSeen = useSeenStories();

  // Author order is fixed when the viewer opens, so marking stories seen
  // doesn't reshuffle where "next" goes.
  const [order] = useState(() => orderStoryAuthors(stories.data ?? [], userId, isSeen).map((g) => g.authorId));
  const items = useMemo(
    () => (stories.data ?? []).filter((s) => s.author_id === authorId).sort((a, b) => a.created_at.localeCompare(b.created_at)),
    [stories.data, authorId],
  );

  // Start at this author's first unseen story (or the first one).
  const [start] = useState(() => Math.max(0, items.findIndex((s) => !isSeen(s.id))));
  const [position, setPosition] = useState({ authorId, index: start });
  if (position.authorId !== authorId) {
    // Moved on to another author (router.setParams): start at their first unseen story.
    setPosition({ authorId, index: Math.max(0, items.findIndex((s) => !isSeen(s.id))) });
  }
  const index = Math.min(position.index, Math.max(0, items.length - 1));
  const story = items[index];
  const length = story ? storyLength(story) : STORY_MS;

  const [paused, setPaused] = useState(false);
  const remaining = useRef(STORY_MS);
  const startedAt = useRef(0);

  const goNext = () => {
    if (index < items.length - 1) return setPosition({ authorId, index: index + 1 });
    const next = order[order.indexOf(authorId) + 1];
    if (next && (stories.data ?? []).some((s) => s.author_id === next)) router.setParams({ id: next });
    else router.back();
  };
  const goPrev = () => {
    if (index > 0) return setPosition({ authorId, index: index - 1 });
    const prev = order[order.indexOf(authorId) - 1];
    if (prev) router.setParams({ id: prev });
  };

  // A new story: mark it seen and reset its timer.
  useEffect(() => {
    if (!story) return;
    markStorySeen(story);
    remaining.current = storyLength(story);
  }, [story]);

  // Advance when the time runs out; holding pauses and keeps what was left.
  const next = useRef(goNext);
  useEffect(() => {
    next.current = goNext;
  });
  useEffect(() => {
    if (!story || paused) return;
    startedAt.current = Date.now();
    const t = setTimeout(() => next.current(), remaining.current);
    return () => {
      clearTimeout(t);
      remaining.current = Math.max(0, remaining.current - (Date.now() - startedAt.current));
    };
  }, [story, paused]);

  if (!story) {
    return (
      <View className="flex-1 items-center justify-center bg-black">
        <Text className="text-white">{tx('This story has expired.')}</Text>
        <Pressable onPress={() => router.back()} className="mt-4 min-h-11 justify-center px-4">
          <Text className="text-accent">{tx('Close')}</Text>
        </Pressable>
      </View>
    );
  }

  const remove = () => {
    setPaused(true);
    Alert.alert(tx('Delete story?'), undefined, [
      { text: tx('Cancel'), style: 'cancel', onPress: () => setPaused(false) },
      { text: tx('Delete'), style: 'destructive', onPress: () => actions.remove.mutate(story.id, { onSuccess: () => router.back() }) },
    ]);
  };

  const hold = { onLongPress: () => setPaused(true), onPressOut: () => setPaused(false), delayLongPress: 180 };

  return (
    <View className="flex-1 bg-black">
      {story.video_url ? (
        <StoryVideo key={story.id} url={story.video_url} poster={story.image_url} paused={paused} />
      ) : (
        <Image source={{ uri: story.image_url }} style={{ flex: 1 }} contentFit="contain" transition={150} />
      )}
      <View className="absolute inset-0 flex-row">
        <Pressable accessibilityLabel={tx('Previous')} className="w-1/3" onPress={goPrev} {...hold} />
        <Pressable accessibilityLabel={tx('Next')} className="flex-1" onPress={goNext} {...hold} />
      </View>
      <View className="absolute left-0 right-0 gap-3 px-3" style={{ top: insets.top + 6, opacity: paused ? 0 : 1 }} pointerEvents="box-none">
        <View className="flex-row gap-1">
          {items.map((s, i) => (
            <View key={s.id} className="h-1 flex-1 overflow-hidden rounded-full bg-white/30">
              {i < index ? <View className="h-full w-full bg-white" /> : null}
              {i === index ? (
                // Childless, absolutely positioned fill: animating its width re-lays-out nothing else.
                <Animated.View
                  key={s.id}
                  className="absolute bottom-0 left-0 top-0 bg-white"
                  style={{
                    animationName: FILL,
                    animationDuration: length,
                    animationTimingFunction: 'linear',
                    animationFillMode: 'forwards',
                    animationPlayState: paused ? 'paused' : 'running',
                  }}
                />
              ) : null}
            </View>
          ))}
        </View>
        <View className="flex-row items-center gap-2">
          <Pressable
            accessibilityRole="button"
            onPress={() => router.replace({ pathname: '/users/[id]', params: { id: story.author_id } })}
            className="flex-1 flex-row items-center gap-2"
          >
            <Avatar profile={story.author} size={34} />
            <View className="flex-1">
              <Text className="text-sm font-semibold text-white">{story.author_id === userId ? tx('Your story') : displayName(story.author)}</Text>
              <Text className="text-xs text-white/70">{timeAgo(story.created_at)}</Text>
            </View>
          </Pressable>
          {story.author_id === userId ? (
            <Pressable accessibilityLabel={tx('Delete story')} onPress={remove} className="h-11 w-11 items-center justify-center">
              <Trash2 color="#fff" size={20} />
            </Pressable>
          ) : null}
          <Pressable accessibilityLabel={tx('Close')} onPress={() => router.back()} className="h-11 w-11 items-center justify-center">
            <X color="#fff" size={24} />
          </Pressable>
        </View>
      </View>
      {story.caption || story.place_name ? (
        <View
          pointerEvents="box-none"
          className="absolute left-0 right-0 gap-1 bg-black/50 px-4 py-3"
          style={{ bottom: 0, paddingBottom: insets.bottom + 12, opacity: paused ? 0 : 1 }}
        >
          {story.caption ? <Text className="text-base text-white">{story.caption}</Text> : null}
          {story.place_name ? (
            <Pressable
              disabled={!story.destination_id}
              onPress={() => story.destination_id && router.replace({ pathname: '/destination/[id]', params: { id: story.destination_id } })}
              className="flex-row items-center gap-1 self-start"
            >
              <MapPin color="#EDB158" size={14} />
              <Text className="text-sm text-accent">{story.place_name}</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

/** A video story: plays with sound from the start, pauses while the story is held. */
function StoryVideo({ url, poster, paused }: { url: string; poster: string; paused: boolean }) {
  const player = useVideoPlayer({ uri: url, useCaching: true }, (p) => {
    p.loop = false;
    p.play();
  });
  useEffect(() => {
    if (paused) player.pause();
    else player.play();
  }, [paused, player]);
  return (
    <View style={{ flex: 1 }}>
      <Image source={{ uri: poster }} style={{ position: 'absolute', inset: 0 }} contentFit="contain" />
      <VideoView player={player} style={{ flex: 1 }} contentFit="contain" nativeControls={false} />
    </View>
  );
}
