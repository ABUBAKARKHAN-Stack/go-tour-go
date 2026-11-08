import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { Clapperboard, ImagePlus, MapPin, Send, X } from 'lucide-react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useMemo, useState } from 'react';
import { Controller } from 'react-hook-form';
import { Pressable, ScrollView, View } from 'react-native';
import { Text } from '@/components/text';

import { AppButton } from '@/components/app-button';
import { Chip } from '@/components/form';
import { FormTextField } from '@/components/form-field';
import { Screen } from '@/components/screen';
import { InlineError } from '@/components/states';
import { useCommunityActions } from '@/features/community/api';
import { postSchema } from '@/features/community/schemas';
import { useDestinations, useDestinationsByDistance } from '@/features/destinations/api';
import { serverError, useZodForm } from '@/lib/forms';
import { haptics } from '@/lib/haptics';
import { chooseImageSource, chooseVideoSource, type PickedVideo } from '@/lib/pick-image';
import { formatDuration } from '@/features/community/format';
import { colors } from '@/lib/theme';
import { tx } from '@/lib/i18n';

export default function NewPostScreen() {
  const params = useLocalSearchParams<{ destination?: string }>();
  const actions = useCommunityActions();
  const { sorted, location } = useDestinationsByDistance();
  const all = useDestinations();
  // "Post from here" on a destination page arrives with that place tagged.
  const preset = params.destination ? all.data?.find((d) => d.id === params.destination) : undefined;
  const [image, setImage] = useState<string | null>(null);
  const [video, setVideo] = useState<PickedVideo | null>(null);
  const { control, handleSubmit, setError, formState } = useZodForm(postSchema, { defaultValues: { body: '', destinationId: params.destination ?? null } });

  // Suggest the closest destinations as tags (the preset place first).
  const suggestions = useMemo(() => {
    const near = sorted.slice(0, 6);
    return preset ? [preset, ...near.filter((d) => d.id !== preset.id)] : near;
  }, [sorted, preset]);

  const submit = handleSubmit(({ body, destinationId }) => {
    const d = suggestions.find((x) => x.id === destinationId) ?? sorted.find((x) => x.id === destinationId);
    actions.createPost.mutate(
      {
        body,
        imageLocalUri: video ? null : image,
        video,
        destinationId,
        placeName: d?.name ?? null,
        latitude: d?.latitude ?? location?.latitude ?? null,
        longitude: d?.longitude ?? location?.longitude ?? null,
      },
      {
        onSuccess: () => {
          haptics.success();
          router.back();
        },
        onError: (e) => {
          haptics.error();
          setError('root', serverError(e));
        },
      },
    );
  });

  return (
    <Screen back title={tx('New post')} keyboard>
      {formState.errors.root?.message ? <InlineError message={formState.errors.root.message} /> : null}
      <FormTextField control={control} name="body" label={tx('What\'s happening?')} multiline maxLength={2000} placeholder={tx('Share a tip, a view or a great meal...')} />
      {video ? (
        <View>
          <VideoPreview uri={video.uri} />
          {video.durationMs ? (
            <View className="absolute bottom-2 left-2 rounded-md bg-black/60 px-2 py-0.5">
              <Text className="text-xs font-semibold text-white">{formatDuration(video.durationMs)}</Text>
            </View>
          ) : null}
          <Pressable accessibilityLabel={tx('Remove video')} onPress={() => setVideo(null)} className="absolute right-2 top-2 h-10 w-10 items-center justify-center rounded-full bg-black/60">
            <X color="#fff" size={18} />
          </Pressable>
        </View>
      ) : image ? (
        <View>
          <Image source={{ uri: image }} style={{ width: '100%', aspectRatio: 4 / 3, borderRadius: 18 }} contentFit="cover" />
          <Pressable accessibilityLabel={tx('Remove photo')} onPress={() => setImage(null)} className="absolute right-2 top-2 h-10 w-10 items-center justify-center rounded-full bg-black/60">
            <X color="#fff" size={18} />
          </Pressable>
        </View>
      ) : (
        <View className="flex-row gap-2">
          <View className="flex-1">
            <AppButton label={tx('Add photo')} icon={ImagePlus} variant="outline" onPress={() => chooseImageSource(setImage)} />
          </View>
          <View className="flex-1">
            <AppButton label={tx('Add video')} icon={Clapperboard} variant="outline" onPress={() => chooseVideoSource(setVideo)} />
          </View>
        </View>
      )}
      {video && actions.createPost.isPending ? <Text className="text-xs text-muted-foreground">{tx('Uploading the video can take a minute on mobile data.')}</Text> : null}
      <View className="gap-2">
        <View className="flex-row items-center gap-1">
          <MapPin color={colors.primary} size={14} />
          <Text className="text-sm font-medium text-foreground">{tx('Tag a place {0}', { 0: location ? tx('(nearest first)') : '' })}</Text>
        </View>
        <Controller
          control={control}
          name="destinationId"
          render={({ field }) => (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
              {suggestions.map((d) => (
                <Chip key={d.id} label={d.name} selected={field.value === d.id} onPress={() => field.onChange(field.value === d.id ? null : d.id)} />
              ))}
            </ScrollView>
          )}
        />
      </View>
      <AppButton label={tx('Post')} icon={Send} variant="accent" loading={actions.createPost.isPending} onPress={submit} />
    </Screen>
  );
}

/** Silent looping preview of the chosen clip. */
function VideoPreview({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri, (p) => {
    p.muted = true;
    p.loop = true;
    p.play();
  });
  return (
    <View style={{ width: '100%', aspectRatio: 4 / 3, borderRadius: 18, overflow: 'hidden' }} className="bg-black">
      <VideoView player={player} style={{ width: '100%', height: '100%' }} contentFit="cover" nativeControls={false} />
    </View>
  );
}
