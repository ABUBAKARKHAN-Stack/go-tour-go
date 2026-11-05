import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { ImagePlus, Send, Trash2, X } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { Text } from '@/components/text';

import { AppButton } from '@/components/app-button';
import { TextField } from '@/components/form';
import { RatingStars } from '@/components/rating-stars';
import { Screen } from '@/components/screen';
import { InlineError } from '@/components/states';
import { useAuth } from '@/features/auth/auth-provider';
import { useDestination } from '@/features/destinations/api';
import { useDeleteReview, useReviews, useSaveReview } from '@/features/reviews/api';
import { errorMessage } from '@/lib/errors';
import { chooseImageSource } from '@/lib/pick-image';

/** Write or edit your single review for a destination (duplicates are prevented by the DB). */
export default function ReviewEditor() {
  const { destinationId } = useLocalSearchParams<{ destinationId: string }>();
  const { userId } = useAuth();
  const { destination } = useDestination(destinationId);
  const reviews = useReviews(destinationId);
  const existing = reviews.data?.find((r) => r.user_id === userId);
  const save = useSaveReview();
  const del = useDeleteReview();

  const [initialized, setInitialized] = useState(false);
  const [rating, setRating] = useState(0);
  const [body, setBody] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [existingImage, setExistingImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!initialized && reviews.isSuccess) {
    setInitialized(true);
    if (existing) {
      setRating(existing.rating);
      setBody(existing.body);
      setExistingImage(existing.image_url);
    }
  }

  const submit = () => {
    if (rating < 1) {
      setError('Choose a star rating.');
      return;
    }
    setError(null);
    save.mutate(
      { destinationId, rating, body, imageLocalUri: image, existingImage },
      { onSuccess: () => router.back(), onError: (e) => setError(errorMessage(e)) },
    );
  };

  const preview = image ?? existingImage;

  return (
    <Screen back title={existing ? 'Edit review' : 'Write a review'} subtitle={destination?.name} keyboard>
      {error ? <InlineError message={error} /> : null}
      <View className="items-center gap-2 py-2">
        <Text className="text-sm text-muted-foreground">Your rating</Text>
        <RatingStars value={rating} size={34} onChange={setRating} />
      </View>
      <TextField label="Your experience" value={body} onChangeText={setBody} multiline maxLength={2000} placeholder="What did you love? Any tips for other travellers?" />
      {preview ? (
        <View>
          <Image source={{ uri: preview }} style={{ width: '100%', aspectRatio: 4 / 3, borderRadius: 18 }} contentFit="cover" />
          <Pressable
            accessibilityLabel="Remove photo"
            onPress={() => {
              setImage(null);
              setExistingImage(null);
            }}
            className="absolute right-2 top-2 h-10 w-10 items-center justify-center rounded-full bg-black/60"
          >
            <X color="#fff" size={18} />
          </Pressable>
        </View>
      ) : (
        <AppButton label="Add photo (optional)" icon={ImagePlus} variant="outline" onPress={() => chooseImageSource(setImage)} />
      )}
      <AppButton label={existing ? 'Update review' : 'Post review'} icon={Send} variant="accent" loading={save.isPending} onPress={submit} />
      {existing ? (
        <AppButton
          label="Delete review"
          icon={Trash2}
          variant="ghost"
          onPress={() =>
            Alert.alert('Delete your review?', undefined, [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Delete', style: 'destructive', onPress: () => del.mutate({ id: existing.id, destinationId }, { onSuccess: () => router.back() }) },
            ])
          }
        />
      ) : null}
    </Screen>
  );
}
