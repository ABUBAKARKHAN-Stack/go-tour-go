import { File } from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';

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
