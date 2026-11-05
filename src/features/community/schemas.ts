import { z } from 'zod';

import { tx } from '@/lib/i18n';

export const postSchema = z.object({
  body: z
    .string()
    .trim()
    .min(1, { error: () => tx('Write something to share.') })
    .max(2000, { error: () => tx('Use {0} characters or fewer.', { 0: 2000 }) }),
  destinationId: z.string().nullable(),
});

export const storySchema = z.object({
  caption: z
    .string()
    .trim()
    .max(200, { error: () => tx('Use {0} characters or fewer.', { 0: 200 }) }),
  destinationId: z.string().nullable(),
});
