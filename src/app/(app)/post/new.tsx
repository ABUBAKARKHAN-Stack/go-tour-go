import { Image } from 'expo-image';
import { router } from 'expo-router';
import { ImagePlus, MapPin, Send, X } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Text } from '@/components/text';

import { AppButton } from '@/components/app-button';
import { Chip, TextField } from '@/components/form';
import { Screen } from '@/components/screen';
import { InlineError } from '@/components/states';
import { useCommunityActions } from '@/features/community/api';
import { useDestinationsByDistance } from '@/features/destinations/api';
import { errorMessage } from '@/lib/errors';
import { chooseImageSource } from '@/lib/pick-image';
import { colors } from '@/lib/theme';

export default function NewPostScreen() {
  const actions = useCommunityActions();
  const { sorted, location } = useDestinationsByDistance();
  const [body, setBody] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [destinationId, setDestinationId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Suggest the closest destinations as tags (the first is preselected when very close).
  const suggestions = useMemo(() => sorted.slice(0, 6), [sorted]);

  const submit = () => {
    setError(null);
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
      { onSuccess: () => router.back(), onError: (e) => setError(errorMessage(e)) },
    );
  };

  return (
    <Screen back title="New post" keyboard>
      {error ? <InlineError message={error} /> : null}
      <TextField label="What's happening?" value={body} onChangeText={setBody} multiline maxLength={2000} placeholder="Share a tip, a view or a great meal..." />
      {image ? (
        <View>
          <Image source={{ uri: image }} style={{ width: '100%', aspectRatio: 4 / 3, borderRadius: 18 }} contentFit="cover" />
          <Pressable accessibilityLabel="Remove photo" onPress={() => setImage(null)} className="absolute right-2 top-2 h-10 w-10 items-center justify-center rounded-full bg-black/60">
            <X color="#fff" size={18} />
          </Pressable>
        </View>
      ) : (
        <AppButton label="Add photo" icon={ImagePlus} variant="outline" onPress={() => chooseImageSource(setImage)} />
      )}
      <View className="gap-2">
        <View className="flex-row items-center gap-1">
          <MapPin color={colors.primary} size={14} />
          <Text className="text-sm font-medium text-foreground">Tag a place {location ? '(nearest first)' : ''}</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
          {suggestions.map((d) => (
            <Chip key={d.id} label={d.name} selected={destinationId === d.id} onPress={() => setDestinationId(destinationId === d.id ? null : d.id)} />
          ))}
        </ScrollView>
      </View>
      <AppButton label="Post" icon={Send} variant="accent" loading={actions.createPost.isPending} disabled={!body.trim()} onPress={submit} />
    </Screen>
  );
}
