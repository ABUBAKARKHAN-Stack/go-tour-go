import { z } from 'zod';

import { tx } from '@/lib/i18n';

/** A caption is optional when the post has photos or videos (like Instagram). */
export const postSchema = z
  .object({
    body: z
      .string()
      .trim()
      .max(2000, { error: () => tx('Use {0} characters or fewer.', { 0: 2000 }) }),
    hasMedia: z.boolean(),
  })
  .refine((v) => v.body.length > 0 || v.hasMedia, { path: ['body'], error: () => tx('Add a photo or video, or write something.') });

export const storySchema = z.object({
  caption: z
    .string()
    .trim()
    .max(200, { error: () => tx('Use {0} characters or fewer.', { 0: 200 }) }),
});
