import * as ImagePicker from 'expo-image-picker';
import { Alert, Linking } from 'react-native';

import type { DraftMedia } from '@/features/community/upload-plan';
import { tx } from '@/lib/i18n';
import { VIDEO_MAX_BYTES, VIDEO_MAX_SECONDS } from '@/lib/pick-image';
import { makeVideoPoster } from '@/lib/upload';

export const MAX_MEDIA = 10;

let seq = 0;
const newKey = () => `m${Date.now()}-${seq++}`;

async function cameraAllowed() {
  const perm = await ImagePicker.requestCameraPermissionsAsync();
  if (perm.granted) return true;
  Alert.alert(tx('Camera permission needed'), tx('Allow camera access to take photos and videos.'), [
    { text: tx('Cancel'), style: 'cancel' },
    { text: tx('Open settings'), onPress: () => Linking.openSettings() },
  ]);
  return false;
}

/**
 * Turns picked assets into drafts: videos over the length or size limit are
 * left out (with one message saying how many), and each video gets a poster frame.
 */
async function toDrafts(assets: ImagePicker.ImagePickerAsset[]): Promise<DraftMedia[]> {
  let skipped = 0;
  const out: DraftMedia[] = [];
  for (const a of assets) {
    const isVideo = a.type === 'video' || a.type === 'pairedVideo';
    if (isVideo) {
      const tooLong = a.duration != null && a.duration > (VIDEO_MAX_SECONDS + 1) * 1000;
      const tooBig = a.fileSize != null && a.fileSize > VIDEO_MAX_BYTES;
      if (tooLong || tooBig) {
        skipped++;
        continue;
      }
      out.push({ key: newKey(), type: 'video', uri: a.uri, mimeType: a.mimeType ?? 'video/mp4', durationMs: a.duration ?? null, posterUri: await makeVideoPoster(a.uri) });
    } else {
      out.push({ key: newKey(), type: 'image', uri: a.uri, mimeType: a.mimeType ?? 'image/jpeg', durationMs: null, posterUri: null });
    }
  }
  if (skipped) {
    Alert.alert(
      tx('Some videos were left out'),
      tx('{0} video(s) were longer than {1} seconds or larger than {2} MB.', { 0: skipped, 1: VIDEO_MAX_SECONDS, 2: 50 }),
    );
  }
  return out;
}

/** Several photos and videos from the gallery, in the order tapped. */
export async function pickFromGallery(room: number): Promise<DraftMedia[]> {
  if (room <= 0) return [];
  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images', 'videos'],
    allowsMultipleSelection: room > 1,
    selectionLimit: room,
    orderedSelection: true,
    quality: 0.9,
    videoMaxDuration: VIDEO_MAX_SECONDS,
  });
  if (res.canceled || !res.assets?.length) return [];
  return toDrafts(res.assets.slice(0, room));
}

/** One photo or one video from the camera. */
export async function captureWithCamera(kind: 'photo' | 'video'): Promise<DraftMedia[]> {
  if (!(await cameraAllowed())) return [];
  const res = await ImagePicker.launchCameraAsync(
    kind === 'photo'
      ? { mediaTypes: ['images'], quality: 0.9 }
      : { mediaTypes: ['videos'], videoMaxDuration: VIDEO_MAX_SECONDS, videoQuality: ImagePicker.UIImagePickerControllerQualityType.Medium },
  );
  if (res.canceled || !res.assets?.length) return [];
  return toDrafts(res.assets);
}
