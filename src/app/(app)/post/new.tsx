import { router, useLocalSearchParams } from 'expo-router';
import { Send } from 'lucide-react-native';
import { useState } from 'react';

import { AppButton } from '@/components/app-button';
import { FormTextField } from '@/components/form-field';
import { Screen } from '@/components/screen';
import { InlineError } from '@/components/states';
import { useAuth } from '@/features/auth/auth-provider';
import { MediaStrip } from '@/features/community/media-strip';
import { PlaceField } from '@/features/community/place-picker';
import { postSchema } from '@/features/community/schemas';
import type { DraftMedia, PlaceTag } from '@/features/community/upload-plan';
import { startUpload } from '@/features/community/upload-queue';
import { useDestinations } from '@/features/destinations/api';
import { useZodForm } from '@/lib/forms';
import { tx } from '@/lib/i18n';
import { AccountRequired } from '@/features/auth/guest-gate';

/**
 * New post, Instagram style: up to 10 photos and videos, a caption and any
 * place. "Share" hands the post to the upload queue and closes at once; the
 * Community feed shows its progress.
 */
function NewPostScreenContent() {
  const params = useLocalSearchParams<{ destination?: string }>();
  const { userId } = useAuth();
  const all = useDestinations();
  const [media, setMedia] = useState<DraftMedia[]>([]);
  // "Post from here" on a destination page arrives with that place tagged.
  const preset = params.destination ? all.data?.find((d) => d.id === params.destination) : undefined;
  const [placeChoice, setPlaceChoice] = useState<PlaceTag | null | undefined>(undefined);
  const place: PlaceTag | null =
    placeChoice !== undefined ? placeChoice : preset ? { destinationId: preset.id, name: preset.name, latitude: preset.latitude, longitude: preset.longitude } : null;

  const { control, handleSubmit, setValue, formState } = useZodForm(postSchema, { defaultValues: { body: '', hasMedia: false } });

  const changeMedia = (next: DraftMedia[]) => {
    setMedia(next);
    setValue('hasMedia', next.length > 0, { shouldValidate: formState.isSubmitted });
  };

  const submit = handleSubmit(({ body }) => {
    if (!userId) return;
    startUpload({ kind: 'post', userId, media, caption: body, place });
    router.back();
  });

  return (
    <Screen back title={tx('New post')} keyboard>
      {formState.errors.root?.message ? <InlineError message={formState.errors.root.message} /> : null}
      <MediaStrip media={media} onChange={changeMedia} aspect={4 / 3} />
      <FormTextField
        control={control}
        name="body"
        label={media.length ? tx('Caption (optional)') : tx("What's happening?")}
        multiline
        maxLength={2000}
        placeholder={tx('Share a tip, a view or a great meal...')}
      />
      <PlaceField value={place} onChange={setPlaceChoice} />
      <AppButton label={tx('Share')} icon={Send} variant="accent" onPress={submit} />
    </Screen>
  );
}

/** Needs an account; guests see why instead (guest mode). */
export default function NewPostScreen() {
  return (
    <AccountRequired reason={tx('post travel moments')}>
      <NewPostScreenContent />
    </AccountRequired>
  );
}
