import { z } from 'zod';

import { tx } from '@/lib/i18n';

export const tripItemSchema = z.object({
  status: z.enum(['todo', 'in_progress', 'visited']),
  plannedDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable(),
  notes: z
    .string()
    .trim()
    .max(1000, { error: () => tx('Use {0} characters or fewer.', { 0: 1000 }) })
    .transform((v) => v || null),
});
