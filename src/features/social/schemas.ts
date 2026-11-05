import { z } from 'zod';

import { USERNAME } from '@/features/auth/schemas';
import { tx } from '@/lib/i18n';

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, { error: () => tx('Use {0} characters or fewer.', { 0: max }) })
    .transform((v) => v || null);

/** Edit profile. The current username is always accepted, even if it predates today's rules. */
export function profileSchema(currentUsername: string) {
  return z.object({
    fullName: optionalText(80),
    username: z
      .string()
      .trim()
      .toLowerCase()
      .refine((v) => v === currentUsername || USERNAME.test(v), { error: () => tx('3-24 characters: lowercase letters, numbers or _.') }),
    bio: optionalText(280),
    homeCity: optionalText(80),
    visibility: z.enum(['public', 'friends']),
    allowFriendRequests: z.boolean(),
  });
}
