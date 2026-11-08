import { File } from 'expo-file-system';
import * as LegacyFileSystem from 'expo-file-system/legacy';

import { env } from '@/lib/env';
import { supabase } from '@/lib/supabase';

/** Size of a local file in bytes (0 if unknown), for upload progress. */
export function localFileSize(uri: string): number {
  try {
    return new File(uri).size ?? 0;
  } catch {
    return 0;
  }
}

/**
 * Uploads a local file to "<userId>/…" in a public bucket and reports bytes as
 * they go. The file is streamed by the native upload task (not read into
 * memory), to a signed upload URL, so large videos don't stall the app.
 * Returns the public URL.
 */
export async function uploadWithProgress(
  bucket: string,
  userId: string,
  uri: string,
  contentType: string,
  extension: string,
  onProgress: (sentBytes: number) => void,
): Promise<string> {
  const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`;
  const { data, error } = await supabase.storage.from(bucket).createSignedUploadUrl(path);
  if (error || !data) throw error ?? new Error('Could not start the upload.');
  const task = LegacyFileSystem.createUploadTask(
    data.signedUrl,
    uri,
    {
      httpMethod: 'PUT',
      uploadType: LegacyFileSystem.FileSystemUploadType.BINARY_CONTENT,
      headers: { 'content-type': contentType, 'x-upsert': 'false', 'cache-control': 'max-age=3600', apikey: env.supabasePublishableKey },
    },
    (p) => onProgress(p.totalBytesSent),
  );
  const result = await task.uploadAsync();
  if (!result || result.status >= 300) {
    let message = `Upload failed (${result?.status ?? 'no response'}).`;
    try {
      message = (JSON.parse(result?.body ?? '') as { message?: string }).message ?? message;
    } catch {
      // keep the status message
    }
    throw new Error(message);
  }
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}
