import { Image } from 'expo-image';
import { router } from 'expo-router';
import { ImagePlus, MapPin, Send, X } from 'lucide-react-native';
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
import { useDestinationsByDistance } from '@/features/destinations/api';
import { serverError, useZodForm } from '@/lib/forms';
import { chooseImageSource } from '@/lib/pick-image';
import { colors } from '@/lib/theme';
import { tx } from '@/lib/i18n';

export default function NewPostScreen() {
  const actions = useCommunityActions();
  const { sorted, location } = useDestinationsByDistance();
  const [image, setImage] = useState<string | null>(null);
  const { control, handleSubmit, setError, formState } = useZodForm(postSchema, { defaultValues: { body: '', destinationId: null } });

  // Suggest the closest destinations as tags.
  const suggestions = useMemo(() => sorted.slice(0, 6), [sorted]);

  const submit = handleSubmit(({ body, destinationId }) => {
    const d = sorted.find((x) => x.id === destinationId);
    actions.createPost.mutate(
      {
        body,
        imageLocalUri: image,
        destinationId,
        placeName: d?.name ?? null,
        latitude: d?.latitude ?? location?.latitude ?? null,
        longitude: d?.longitude ?? location?.longitude ?? null,
      },
      { onSuccess: () => router.back(), onError: (e) => setError('root', serverError(e)) },
    );
  });

  return (
    <Screen back title={tx('New post')} keyboard>
      {formState.errors.root?.message ? <InlineError message={formState.errors.root.message} /> : null}
      <FormTextField control={control} name="body" label={tx('What\'s happening?')} multiline maxLength={2000} placeholder={tx('Share a tip, a view or a great meal...')} />
      {image ? (
        <View>
          <Image source={{ uri: image }} style={{ width: '100%', aspectRatio: 4 / 3, borderRadius: 18 }} contentFit="cover" />
          <Pressable accessibilityLabel={tx('Remove photo')} onPress={() => setImage(null)} className="absolute right-2 top-2 h-10 w-10 items-center justify-center rounded-full bg-black/60">
            <X color="#fff" size={18} />
          </Pressable>
        </View>
      ) : (
        <AppButton label={tx('Add photo')} icon={ImagePlus} variant="outline" onPress={() => chooseImageSource(setImage)} />
      )}
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
