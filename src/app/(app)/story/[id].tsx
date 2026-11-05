import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { MapPin, Trash2, X } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { Text } from '@/components/text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/avatar';
import { useAuth } from '@/features/auth/auth-provider';
import { useStories, useStoryActions } from '@/features/community/api';
import { timeAgo } from '@/features/safety/friend-locations';
import { displayName } from '@/features/social/api';
import { tx } from '@/lib/i18n';

const STORY_MS = 6000;

/** Story viewer for one author (route param = author id). Tap left/right to move. */
export default function StoryViewer() {
  const { id: authorId } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { userId } = useAuth();
  const stories = useStories();
  const actions = useStoryActions();
  const items = useMemo(
    () => (stories.data ?? []).filter((s) => s.author_id === authorId).sort((a, b) => a.created_at.localeCompare(b.created_at)),
    [stories.data, authorId],
  );
  const [index, setIndex] = useState(0);
  const story = items[index];

  useEffect(() => {
    if (!story) return;
    const t = setTimeout(() => (index < items.length - 1 ? setIndex(index + 1) : router.back()), STORY_MS);
    return () => clearTimeout(t);
  }, [index, items.length, story]);

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

  const remove = () =>
    Alert.alert(tx('Delete story?'), undefined, [
      { text: tx('Cancel'), style: 'cancel' },
      { text: tx('Delete'), style: 'destructive', onPress: () => actions.remove.mutate(story.id, { onSuccess: () => router.back() }) },
    ]);

  return (
    <View className="flex-1 bg-black">
      <Image source={{ uri: story.image_url }} style={{ flex: 1 }} contentFit="contain" />
      <View className="absolute inset-0 flex-row">
        <Pressable accessibilityLabel={tx('Previous')} className="flex-1" onPress={() => setIndex(Math.max(0, index - 1))} />
        <Pressable accessibilityLabel={tx('Next')} className="flex-1" onPress={() => (index < items.length - 1 ? setIndex(index + 1) : router.back())} />
      </View>
      <View className="absolute left-0 right-0 gap-3 px-3" style={{ top: insets.top + 6 }}>
        <View className="flex-row gap-1">
          {items.map((s, i) => (
            <View key={s.id} className={`h-1 flex-1 rounded-full ${i <= index ? 'bg-white' : 'bg-white/30'}`} />
          ))}
        </View>
        <View className="flex-row items-center gap-2">
          <Avatar profile={story.author} size={34} />
          <View className="flex-1">
            <Text className="text-sm font-semibold text-white">{displayName(story.author)}</Text>
            <Text className="text-xs text-white/70">{timeAgo(story.created_at)}</Text>
          </View>
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
        <View className="absolute left-0 right-0 gap-1 bg-black/50 px-4 py-3" style={{ bottom: 0, paddingBottom: insets.bottom + 12 }}>
          {story.caption ? <Text className="text-base text-white">{story.caption}</Text> : null}
          {story.place_name ? (
            <View className="flex-row items-center gap-1">
              <MapPin color="#EDB158" size={14} />
              <Text className="text-sm text-accent">{story.place_name}</Text>
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
