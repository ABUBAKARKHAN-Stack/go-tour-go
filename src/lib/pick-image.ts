import * as ImagePicker from 'expo-image-picker';
import { Alert, Linking } from 'react-native';

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
