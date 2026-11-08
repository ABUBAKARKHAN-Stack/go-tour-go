import { Image } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Camera, Clapperboard, Images, Play, Plus, X } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, View } from 'react-native';

import { AppButton } from '@/components/app-button';
import { Text } from '@/components/text';
import { formatDuration } from '@/features/community/format';
import { captureWithCamera, MAX_MEDIA, pickFromGallery } from '@/features/community/media-picker';
import type { DraftMedia } from '@/features/community/upload-plan';
import { haptics } from '@/lib/haptics';
import { tx } from '@/lib/i18n';
import { colors } from '@/lib/theme';

type Props = {
  media: DraftMedia[];
  onChange: (media: DraftMedia[]) => void;
  /** Preview shape: 4:3 for posts, 9:16 for stories. */
  aspect: number;
};

/**
 * Instagram-style media editor: a large preview of the selected item, and a
 * row of thumbnails (tap to preview, × to remove, + to add more, up to 10).
 */
export function MediaStrip({ media, onChange, aspect }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const current = media.find((m) => m.key === selected) ?? media[0];
  const room = MAX_MEDIA - media.length;

  const add = async (source: 'gallery' | 'photo' | 'video') => {
    setBusy(true);
    try {
      const picked = source === 'gallery' ? await pickFromGallery(room) : await captureWithCamera(source);
      if (picked.length) {
        onChange([...media, ...picked].slice(0, MAX_MEDIA));
        setSelected(picked[0].key);
        haptics.select();
      }
    } finally {
      setBusy(false);
    }
  };

  const chooseSource = () =>
    Alert.alert(tx('Add photos or videos'), tx('Up to {0} items', { 0: MAX_MEDIA }), [
      { text: tx('Gallery'), onPress: () => void add('gallery') },
      { text: tx('Take photo'), onPress: () => void add('photo') },
      { text: tx('Record video'), onPress: () => void add('video') },
    ]);

  const remove = (key: string) => {
    onChange(media.filter((m) => m.key !== key));
    if (selected === key) setSelected(null);
  };

  if (media.length === 0) {
    return (
      <View className="gap-2">
        <AppButton label={tx('Choose photos or videos')} icon={Images} variant="secondary" loading={busy} onPress={() => void add('gallery')} />
        <View className="flex-row gap-2">
          <View className="flex-1">
            <AppButton label={tx('Take photo')} icon={Camera} variant="outline" size="sm" disabled={busy} onPress={() => void add('photo')} />
          </View>
          <View className="flex-1">
            <AppButton label={tx('Record video')} icon={Clapperboard} variant="outline" size="sm" disabled={busy} onPress={() => void add('video')} />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View className="gap-2">
      <View style={{ width: '100%', aspectRatio: aspect, borderRadius: 18, overflow: 'hidden' }} className="bg-black">
        {current?.type === 'video' ? (
          <VideoPreview key={current.key} uri={current.uri} />
        ) : current ? (
          <Image source={{ uri: current.uri }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
        ) : null}
        {media.length > 1 ? (
          <View className="absolute right-3 top-3 rounded-full bg-black/60 px-2.5 py-1">
            <Text className="text-xs font-semibold text-white">
              {media.indexOf(current!) + 1}/{media.length}
            </Text>
          </View>
        ) : null}
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2 py-1">
        {media.map((m, i) => {
          const active = m.key === current?.key;
          const thumb = m.type === 'video' ? m.posterUri : m.uri;
          return (
            <Pressable
              key={m.key}
              accessibilityRole="button"
              accessibilityLabel={m.type === 'video' ? tx('Video {0}', { 0: i + 1 }) : tx('Photo {0}', { 0: i + 1 })}
              accessibilityState={{ selected: active }}
              onPress={() => setSelected(m.key)}
              className={`h-20 w-20 overflow-hidden rounded-xl border-2 ${active ? 'border-primary' : 'border-transparent'}`}
            >
              {thumb ? (
                <Image source={{ uri: thumb }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
              ) : (
                <View className="flex-1 items-center justify-center bg-inverse">
                  <Play color="#fff" size={18} />
                </View>
              )}
              {m.type === 'video' ? (
                <View className="absolute bottom-1 left-1 rounded bg-black/60 px-1">
                  <Text className="text-[10px] font-semibold text-white">{m.durationMs ? formatDuration(m.durationMs) : tx('Video')}</Text>
                </View>
              ) : null}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={tx('Remove')}
                hitSlop={6}
                onPress={() => remove(m.key)}
                className="absolute right-1 top-1 h-6 w-6 items-center justify-center rounded-full bg-black/60"
              >
                <X color="#fff" size={13} />
              </Pressable>
            </Pressable>
          );
        })}
        {room > 0 ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={tx('Add photos or videos')}
            onPress={chooseSource}
            disabled={busy}
            className="h-20 w-20 items-center justify-center rounded-xl border-2 border-dashed border-border bg-card"
          >
            {busy ? <ActivityIndicator color={colors.primary} /> : <Plus color={colors.primary} size={24} />}
          </Pressable>
        ) : null}
      </ScrollView>
      {room === 0 ? <Text className="text-xs text-muted-foreground">{tx('Up to {0} items', { 0: MAX_MEDIA })}</Text> : null}
    </View>
  );
}

/** Silent looping preview of a chosen clip. */
function VideoPreview({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri, (p) => {
    p.muted = true;
    p.loop = true;
    p.play();
  });
  return <VideoView player={player} style={{ width: '100%', height: '100%' }} contentFit="cover" nativeControls={false} />;
}

