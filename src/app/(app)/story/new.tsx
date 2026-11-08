import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Camera, ImagePlus, Send } from 'lucide-react-native';
import { useState } from 'react';
import { Controller } from 'react-hook-form';
import { ScrollView, View } from 'react-native';

import { AppButton } from '@/components/app-button';
import { Chip } from '@/components/form';
import { FormTextField } from '@/components/form-field';
import { Screen } from '@/components/screen';
import { InlineError } from '@/components/states';
import { useStoryActions } from '@/features/community/api';
import { storySchema } from '@/features/community/schemas';
import { useDestinationsByDistance } from '@/features/destinations/api';
import { haptics } from '@/lib/haptics';
import { serverError, useZodForm } from '@/lib/forms';
import { pickImage } from '@/lib/pick-image';
import { tx } from '@/lib/i18n';

/** Lightweight 24-hour travel story: one photo, caption and place. */
export default function NewStory() {
  const actions = useStoryActions();
  const { sorted } = useDestinationsByDistance();
  const [image, setImage] = useState<string | null>(null);
  const { control, handleSubmit, setError, formState } = useZodForm(storySchema, { defaultValues: { caption: '', destinationId: null } });

  const share = handleSubmit(({ caption, destinationId }) => {
    if (!image) return;
    const d = sorted.find((x) => x.id === destinationId);
    actions.create.mutate(
      { imageLocalUri: image, caption, destinationId, placeName: d?.name ?? null },
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
    <Screen back title={tx('New story')} subtitle={tx('Visible for 24 hours')} keyboard>
      {formState.errors.root?.message ? <InlineError message={formState.errors.root.message} /> : null}
      {image ? (
        <Image source={{ uri: image }} style={{ width: '100%', aspectRatio: 9 / 14, borderRadius: 24 }} contentFit="cover" />
      ) : (
        <View className="gap-2">
          <AppButton label={tx('Take photo')} icon={Camera} variant="secondary" onPress={async () => setImage(await pickImage('camera', [9, 16]))} />
          <AppButton label={tx('Choose from gallery')} icon={ImagePlus} variant="outline" onPress={async () => setImage(await pickImage('library', [9, 16]))} />
        </View>
      )}
      <FormTextField control={control} name="caption" label={tx('Caption')} maxLength={200} placeholder={tx('Sunset at the fort...')} />
      <Controller
        control={control}
        name="destinationId"
        render={({ field }) => (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
            {sorted.slice(0, 6).map((d) => (
              <Chip key={d.id} label={d.name} selected={field.value === d.id} onPress={() => field.onChange(field.value === d.id ? null : d.id)} />
            ))}
          </ScrollView>
        )}
      />
      <AppButton label={tx('Share story')} icon={Send} variant="accent" disabled={!image} loading={actions.create.isPending} onPress={share} />
    </Screen>
  );
}
