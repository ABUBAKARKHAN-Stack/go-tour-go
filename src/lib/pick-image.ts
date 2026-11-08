import * as ImagePicker from 'expo-image-picker';
import { Alert, Linking } from 'react-native';

import { tx } from '@/lib/i18n';

/**
 * Picks a photo from the camera or the system photo picker. The Android photo
 * picker needs no storage permission; the camera permission is requested only
 * when the user chooses the camera.
 */
export async function pickImage(source: 'camera' | 'library', aspect?: [number, number]): Promise<string | null> {
  if (source === 'camera') {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Camera permission needed', 'Allow camera access to take a photo.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open settings', onPress: () => Linking.openSettings() },
      ]);
      return null;
    }
  }
  const options: ImagePicker.ImagePickerOptions = {
    mediaTypes: ['images'],
    quality: 0.85,
    allowsEditing: Boolean(aspect),
    aspect,
  };
  const res = source === 'camera' ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
  if (res.canceled || !res.assets?.[0]) return null;
  return res.assets[0].uri;
}

export function chooseImageSource(onPick: (uri: string) => void, aspect?: [number, number]) {
  Alert.alert('Add photo', undefined, [
    { text: 'Camera', onPress: async () => { const uri = await pickImage('camera', aspect); if (uri) onPick(uri); } },
    { text: 'Gallery', onPress: async () => { const uri = await pickImage('library', aspect); if (uri) onPick(uri); } },
    { text: 'Cancel', style: 'cancel' },
  ]);
}

/** Limits for video posts: short clips that upload on mobile data (bucket max is 50 MB). */
export const VIDEO_MAX_SECONDS = 60;
export const VIDEO_MAX_BYTES = 50 * 1024 * 1024;

export type PickedVideo = { uri: string; mimeType: string; durationMs: number | null; fileSize: number | null };

/**
 * Picks or records a short video. The gallery cannot enforce a length on
 * Android, so the length and size are checked here and an over-long clip is
 * refused with a message.
 */
export async function pickVideo(source: 'camera' | 'library'): Promise<PickedVideo | null> {
  if (source === 'camera') {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(tx('Camera permission needed'), tx('Allow camera access to record a video.'), [
        { text: tx('Cancel'), style: 'cancel' },
        { text: tx('Open settings'), onPress: () => Linking.openSettings() },
      ]);
      return null;
    }
  }
  const options: ImagePicker.ImagePickerOptions = {
    mediaTypes: ['videos'],
    videoMaxDuration: VIDEO_MAX_SECONDS,
    videoQuality: ImagePicker.UIImagePickerControllerQualityType.Medium,
  };
  const res = source === 'camera' ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
  const asset = res.canceled ? null : res.assets?.[0];
  if (!asset) return null;
  const durationMs = asset.duration ?? null;
  if (durationMs != null && durationMs > (VIDEO_MAX_SECONDS + 1) * 1000) {
    Alert.alert(tx('Video too long'), tx('Choose a clip of up to {0} seconds.', { 0: VIDEO_MAX_SECONDS }));
    return null;
  }
  if (asset.fileSize != null && asset.fileSize > VIDEO_MAX_BYTES) {
    Alert.alert(tx('Video too large'), tx('Choose a clip under {0} MB, or record a shorter one.', { 0: 50 }));
    return null;
  }
  return { uri: asset.uri, mimeType: asset.mimeType ?? 'video/mp4', durationMs, fileSize: asset.fileSize ?? null };
}

/** Record or choose a video for a post. */
export function chooseVideoSource(onPick: (video: PickedVideo) => void) {
  Alert.alert(tx('Add video'), tx('Up to {0} seconds', { 0: VIDEO_MAX_SECONDS }), [
    { text: tx('Record'), onPress: async () => { const v = await pickVideo('camera'); if (v) onPick(v); } },
    { text: tx('Gallery'), onPress: async () => { const v = await pickVideo('library'); if (v) onPick(v); } },
    { text: tx('Cancel'), style: 'cancel' },
  ]);
}
