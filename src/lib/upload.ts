import { File } from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import { createVideoPlayer } from 'expo-video';

import { supabase } from '@/lib/supabase';

/** Resizes to max 1280 px JPEG (keeps uploads small on mobile data). */
export async function compressImage(uri: string, maxSize = 1280, base64 = false) {
  const context = ImageManipulator.ImageManipulator.manipulate(uri);
  context.resize({ width: maxSize });
  const image = await context.renderAsync();
  const result = await image.saveAsync({ compress: 0.7, format: ImageManipulator.SaveFormat.JPEG, base64 });
  return result;
}

/**
 * Uploads an image to a public bucket under "<userId>/..." (required by the
 * storage RLS policies) and returns its public URL.
 */
export async function uploadImage(bucket: string, userId: string, uri: string): Promise<string> {
  const compressed = await compressImage(uri);
  const bytes = await new File(compressed.uri).arrayBuffer();
  const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
  const { error } = await supabase.storage.from(bucket).upload(path, bytes, {
    contentType: 'image/jpeg',
    upsert: false,
  });
  if (error) throw error;
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

/**
 * A poster frame (JPEG file) from a local video, shown in the feed before the
 * video plays. Returns null if the frame cannot be read; the post then shows
 * a plain play tile.
 */
export async function makeVideoPoster(videoUri: string): Promise<string | null> {
  const player = createVideoPlayer(videoUri);
  try {
    if (player.status !== 'readyToPlay') {
      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('timeout')), 8000);
        const sub = player.addListener('statusChange', ({ status }) => {
          if (status === 'readyToPlay' || status === 'error') {
            clearTimeout(timer);
            sub.remove();
            if (status === 'readyToPlay') resolve();
            else reject(new Error('video could not be read'));
          }
        });
      });
    }
    const [frame] = await player.generateThumbnailsAsync(0.5, { maxWidth: 1280 });
    if (!frame) return null;
    const image = await ImageManipulator.ImageManipulator.manipulate(frame).renderAsync();
    const saved = await image.saveAsync({ compress: 0.75, format: ImageManipulator.SaveFormat.JPEG });
    return saved.uri;
  } catch {
    return null;
  } finally {
    player.release();
  }
}
