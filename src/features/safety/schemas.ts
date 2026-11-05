import { z } from 'zod';

import { tx } from '@/lib/i18n';

import { isValidPhone, normalizePhone } from './phone-helpers';

export const contactSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { error: () => tx('Enter a name.') })
    .max(60, { error: () => tx('Use {0} characters or fewer.', { 0: 60 }) }),
  phone: z
    .string()
    .trim()
    .refine((v) => isValidPhone(normalizePhone(v)), { error: () => tx('Enter a valid phone number with country code, e.g. +923001234567.') })
    .transform(normalizePhone),
  relationship: z
    .string()
    .trim()
    .max(40, { error: () => tx('Use {0} characters or fewer.', { 0: 40 }) }),
});
