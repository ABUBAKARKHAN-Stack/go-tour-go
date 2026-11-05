import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Camera, ImagePlus, Send } from 'lucide-react-native';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';

import { AppButton } from '@/components/app-button';
import { Chip, TextField } from '@/components/form';
import { Screen } from '@/components/screen';
import { InlineError } from '@/components/states';
import { useStoryActions } from '@/features/community/api';
import { useDestinationsByDistance } from '@/features/destinations/api';
import { errorMessage } from '@/lib/errors';
import { pickImage } from '@/lib/pick-image';
import { tx } from '@/lib/i18n';

/** Lightweight 24-hour travel story: one photo, caption and place. */
export default function NewStory() {
  const actions = useStoryActions();
  const { sorted } = useDestinationsByDistance();
  const [image, setImage] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [destinationId, setDestinationId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const share = () => {
    if (!image) return;
    const d = sorted.find((x) => x.id === destinationId);
    actions.create.mutate(
      { imageLocalUri: image, caption, destinationId, placeName: d?.name ?? null },
      { onSuccess: () => router.back(), onError: (e) => setError(errorMessage(e)) },
    );
  };

  return (
    <Screen back title={tx('New story')} subtitle={tx('Visible for 24 hours')} keyboard>
      {error ? <InlineError message={error} /> : null}
      {image ? (
        <Image source={{ uri: image }} style={{ width: '100%', aspectRatio: 9 / 14, borderRadius: 24 }} contentFit="cover" />
      ) : (
        <View className="gap-2">
          <AppButton label={tx('Take photo')} icon={Camera} variant="secondary" onPress={async () => setImage(await pickImage('camera', [9, 16]))} />
          <AppButton label={tx('Choose from gallery')} icon={ImagePlus} variant="outline" onPress={async () => setImage(await pickImage('library', [9, 16]))} />
        </View>
      )}
      <TextField label={tx('Caption')} value={caption} onChangeText={setCaption} maxLength={200} placeholder={tx('Sunset at the fort...')} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
        {sorted.slice(0, 6).map((d) => (
          <Chip key={d.id} label={d.name} selected={destinationId === d.id} onPress={() => setDestinationId(destinationId === d.id ? null : d.id)} />
        ))}
      </ScrollView>
      <AppButton label={tx('Share story')} icon={Send} variant="accent" disabled={!image} loading={actions.create.isPending} onPress={share} />
    </Screen>
  );
}
