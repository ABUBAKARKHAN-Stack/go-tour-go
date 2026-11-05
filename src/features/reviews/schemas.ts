import { z } from 'zod';

import { tx } from '@/lib/i18n';

export const reviewSchema = z.object({
  rating: z
    .number()
    .int()
    .min(1, { error: () => tx('Choose a star rating.') })
    .max(5),
  body: z
    .string()
    .trim()
    .max(2000, { error: () => tx('Use {0} characters or fewer.', { 0: 2000 }) }),
});
