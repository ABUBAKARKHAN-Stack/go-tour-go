import { router } from 'expo-router';
import { Send } from 'lucide-react-native';
import { useState } from 'react';
import { Alert } from 'react-native';

import { AppButton } from '@/components/app-button';
import { FormTextField } from '@/components/form-field';
import { Screen } from '@/components/screen';
import { useAuth } from '@/features/auth/auth-provider';
import { MediaStrip } from '@/features/community/media-strip';
import { PlaceField } from '@/features/community/place-picker';
import { storySchema } from '@/features/community/schemas';
import type { DraftMedia, PlaceTag } from '@/features/community/upload-plan';
import { startUpload } from '@/features/community/upload-queue';
import { useZodForm } from '@/lib/forms';
import { tx } from '@/lib/i18n';

/**
 * 24-hour story: one or more photos and videos (each becomes a story, in the
 * order chosen), a caption and a place. Uploads in the background like posts.
 */
export default function NewStory() {
  const { userId } = useAuth();
  const [media, setMedia] = useState<DraftMedia[]>([]);
  const [place, setPlace] = useState<PlaceTag | null>(null);
  const { control, handleSubmit } = useZodForm(storySchema, { defaultValues: { caption: '' } });

  const share = handleSubmit(({ caption }) => {
    if (!userId) return;
    if (media.length === 0) {
      Alert.alert(tx('Add a photo or video'), tx('A story needs at least one photo or video.'));
      return;
    }
    startUpload({ kind: 'story', userId, media, caption, place });
    router.back();
  });

  return (
    <Screen back title={tx('New story')} subtitle={tx('Visible for 24 hours')} keyboard>
      <MediaStrip media={media} onChange={setMedia} aspect={9 / 14} />
      <FormTextField control={control} name="caption" label={tx('Caption')} maxLength={200} placeholder={tx('Sunset at the fort...')} />
      <PlaceField value={place} onChange={setPlace} />
      <AppButton label={media.length > 1 ? tx('Share {0} stories', { 0: media.length }) : tx('Share story')} icon={Send} variant="accent" onPress={share} />
    </Screen>
  );
}
