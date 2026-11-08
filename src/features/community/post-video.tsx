import { Image } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Play, Video } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/text';
import { formatDuration } from '@/features/community/format';
import { tx } from '@/lib/i18n';

const FRAME = { width: '100%', aspectRatio: 4 / 3, borderRadius: 18, overflow: 'hidden' } as const;

/**
 * A post's video. Nothing loads until the traveller taps play (a feed of
 * auto-playing videos would cost data and battery); then it plays inline with
 * the system controls and a full-screen button. Scrolling it away unmounts
 * the player and frees it.
 */
export function PostVideo({ url, poster, durationMs, postId }: { url: string; poster: string | null; durationMs: number | null; postId: string }) {
  const [playing, setPlaying] = useState(false);
  if (playing) return <InlinePlayer url={url} />;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={durationMs ? tx('Play video, {0}', { 0: formatDuration(durationMs) }) : tx('Play video')}
      onPress={() => setPlaying(true)}
      style={FRAME}
      className="items-center justify-center bg-inverse"
    >
      {poster ? (
        <Image source={{ uri: poster }} style={{ position: 'absolute', inset: 0 }} contentFit="cover" cachePolicy="memory-disk" recyclingKey={postId} />
      ) : (
        <Video color="rgba(255,255,255,0.35)" size={40} style={{ position: 'absolute', top: 16, left: 16 }} />
      )}
      <View className="h-16 w-16 items-center justify-center rounded-full bg-black/55">
        <Play color="#fff" fill="#fff" size={28} style={{ marginLeft: 4 }} />
      </View>
      {durationMs ? (
        <View className="absolute bottom-3 right-3 rounded-md bg-black/60 px-2 py-0.5">
          <Text className="text-xs font-semibold text-white">{formatDuration(durationMs)}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

function InlinePlayer({ url }: { url: string }) {
  // Cached so replaying (or the same post on another screen) doesn't download again.
  const player = useVideoPlayer({ uri: url, useCaching: true }, (p) => {
    p.loop = false;
    p.play();
  });
  return (
    <View style={FRAME} className="bg-black">
      <VideoView player={player} style={{ width: '100%', height: '100%' }} contentFit="contain" nativeControls fullscreenOptions={{ enable: true }} />
    </View>
  );
}
