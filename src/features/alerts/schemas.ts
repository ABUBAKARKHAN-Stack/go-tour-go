import { z } from 'zod';

import { tx } from '@/lib/i18n';
import type { HazardType } from '@/lib/types';

const HAZARD_TYPES = ['flood', 'accident', 'road_works', 'closure', 'blockade', 'landslide', 'fog', 'snow', 'other'] as const satisfies readonly HazardType[];

export const hazardReportSchema = z.object({
  // Starts empty (null); submitting without a choice shows the message.
  hazardType: z
    .enum(HAZARD_TYPES)
    .nullable()
    .pipe(z.enum(HAZARD_TYPES, { error: () => tx('Choose what you saw.') })),
  severity: z.enum(['low', 'medium', 'high']),
  note: z
    .string()
    .trim()
    .max(280, { error: () => tx('Use {0} characters or fewer.', { 0: 280 }) }),
});
