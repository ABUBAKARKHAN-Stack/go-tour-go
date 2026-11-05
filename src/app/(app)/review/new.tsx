import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { ImagePlus, Send, Trash2, X } from 'lucide-react-native';
import { useState } from 'react';
import { Controller } from 'react-hook-form';
import { Alert, Pressable, View } from 'react-native';
import { Text } from '@/components/text';

import { AppButton } from '@/components/app-button';
import { FormTextField } from '@/components/form-field';
import { RatingStars } from '@/components/rating-stars';
import { Screen } from '@/components/screen';
import { ErrorState, InlineError, LoadingState } from '@/components/states';
import { useAuth } from '@/features/auth/auth-provider';
import { useDestination } from '@/features/destinations/api';
import { useDeleteReview, useReviews, useSaveReview } from '@/features/reviews/api';
import { reviewSchema } from '@/features/reviews/schemas';
import { serverError, useZodForm } from '@/lib/forms';
import { chooseImageSource } from '@/lib/pick-image';
import { tx } from '@/lib/i18n';
import type { Review } from '@/lib/types';

/** Write or edit your single review for a destination (duplicates are prevented by the DB). */
export default function ReviewEditor() {
  const { destinationId } = useLocalSearchParams<{ destinationId: string }>();
  const { userId } = useAuth();
  const { destination } = useDestination(destinationId);
  const reviews = useReviews(destinationId);
  const existing = reviews.data?.find((r) => r.user_id === userId);
  const title = existing ? tx('Edit review') : tx('Write a review');

  if (reviews.isPending || reviews.isError) {
    return (
      <Screen back title={title} subtitle={destination?.name}>
        {reviews.isError ? <ErrorState error={reviews.error} onRetry={reviews.refetch} /> : <LoadingState />}
      </Screen>
    );
  }

  return (
    <Screen back title={title} subtitle={destination?.name} keyboard>
      <ReviewForm destinationId={destinationId} existing={existing} />
    </Screen>
  );
}

function ReviewForm({ destinationId, existing }: { destinationId: string; existing?: Review }) {
  const save = useSaveReview();
  const del = useDeleteReview();
  const [image, setImage] = useState<string | null>(null);
  const [existingImage, setExistingImage] = useState<string | null>(existing?.image_url ?? null);
  const { control, handleSubmit, setError, formState } = useZodForm(reviewSchema, {
    defaultValues: { rating: existing?.rating ?? 0, body: existing?.body ?? '' },
  });

  const submit = handleSubmit(({ rating, body }) =>
    save.mutate(
      { destinationId, rating, body, imageLocalUri: image, existingImage },
      { onSuccess: () => router.back(), onError: (e) => setError('root', serverError(e)) },
    ),
  );

  const preview = image ?? existingImage;

  return (
    <>
      {formState.errors.root?.message ? <InlineError message={formState.errors.root.message} /> : null}
      <Controller
        control={control}
        name="rating"
        render={({ field, fieldState }) => (
          <View className="items-center gap-2 py-2">
            <Text className="text-sm text-muted-foreground">{tx('Your rating')}</Text>
            <RatingStars value={field.value} size={34} onChange={field.onChange} />
            {fieldState.error?.message ? (
              <Text className="text-xs text-destructive" accessibilityLiveRegion="polite">
                {fieldState.error.message}
              </Text>
            ) : null}
          </View>
        )}
      />
      <FormTextField control={control} name="body" label={tx('Your experience')} multiline maxLength={2000} placeholder={tx('What did you love? Any tips for other travellers?')} />
      {preview ? (
        <View>
          <Image source={{ uri: preview }} style={{ width: '100%', aspectRatio: 4 / 3, borderRadius: 18 }} contentFit="cover" />
          <Pressable
            accessibilityLabel={tx('Remove photo')}
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
        <AppButton label={tx('Add photo (optional)')} icon={ImagePlus} variant="outline" onPress={() => chooseImageSource(setImage)} />
      )}
      <AppButton label={existing ? tx('Update review') : tx('Post review')} icon={Send} variant="accent" loading={save.isPending} onPress={submit} />
      {existing ? (
        <AppButton
          label={tx('Delete review')}
          icon={Trash2}
          variant="ghost"
          onPress={() =>
            Alert.alert(tx('Delete your review?'), undefined, [
              { text: tx('Cancel'), style: 'cancel' },
              { text: tx('Delete'), style: 'destructive', onPress: () => del.mutate({ id: existing.id, destinationId }, { onSuccess: () => router.back() }) },
            ])
          }
        />
      ) : null}
    </>
  );
}
