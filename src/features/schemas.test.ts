import { expect, test } from 'bun:test';

import { hazardReportSchema } from '@/features/alerts/schemas';
import { signInSchema, signUpSchema } from '@/features/auth/schemas';
import { postSchema } from '@/features/community/schemas';
import { reviewSchema } from '@/features/reviews/schemas';
import { contactSchema } from '@/features/safety/schemas';
import { profileSchema } from '@/features/social/schemas';
import { tripItemSchema } from '@/features/trips/schemas';

const firstError = (r: { success: boolean; error?: { issues: { path: PropertyKey[]; message: string }[] } }) =>
  r.success ? null : r.error!.issues.map((i) => `${i.path.join('.')}: ${i.message}`)[0];

test('sign-in trims the email and needs a password', () => {
  expect(signInSchema.parse({ email: ' a@b.pk ', password: 'x' }).email).toBe('a@b.pk');
  expect(firstError(signInSchema.safeParse({ email: 'nope', password: 'x' }))).toBe('email: Enter a valid email.');
  expect(firstError(signInSchema.safeParse({ email: 'a@b.pk', password: '' }))).toBe('password: Enter your password.');
});

test('sign-up checks name, username and password rules', () => {
  const ok = signUpSchema.parse({ fullName: ' Ayesha Khan ', username: 'Ayesha_1', email: 'a@b.pk', password: 'travel2026' });
  expect(ok).toEqual({ fullName: 'Ayesha Khan', username: 'ayesha_1', email: 'a@b.pk', password: 'travel2026' });
  expect(firstError(signUpSchema.safeParse({ ...ok, password: 'short1' }))).toBe('password: Use at least 8 characters.');
  expect(firstError(signUpSchema.safeParse({ ...ok, password: 'onlyletters' }))).toBe('password: Use letters and numbers.');
  expect(firstError(signUpSchema.safeParse({ ...ok, username: 'a b' }))).toContain('username:');
  expect(firstError(signUpSchema.safeParse({ ...ok, fullName: 'A' }))).toBe('fullName: Enter your name.');
});

test('profile keeps an old username but checks a new one', () => {
  const schema = profileSchema('Old-Name');
  const base = { fullName: '', username: 'Old-Name', bio: '  ', homeCity: 'Lahore', visibility: 'public' as const, allowFriendRequests: true };
  expect(schema.safeParse(base).success).toBe(false); // lower-cased, so no longer the stored name
  const kept = profileSchema('old_name').parse({ ...base, username: 'old_name' });
  expect(kept.fullName).toBeNull();
  expect(kept.bio).toBeNull();
  expect(firstError(schema.safeParse({ ...base, username: 'x' }))).toContain('username:');
});

test('trusted contact normalises local numbers', () => {
  expect(contactSchema.parse({ name: 'Ammi', phone: '0300 1234567', relationship: '' }).phone).toBe('+923001234567');
  expect(firstError(contactSchema.safeParse({ name: 'Ammi', phone: '12', relationship: '' }))).toContain('phone:');
  expect(firstError(contactSchema.safeParse({ name: ' ', phone: '+923001234567', relationship: '' }))).toBe('name: Enter a name.');
});

test('review needs stars; post needs text; trip notes empty to null', () => {
  expect(firstError(reviewSchema.safeParse({ rating: 0, body: '' }))).toBe('rating: Choose a star rating.');
  expect(firstError(postSchema.safeParse({ body: '   ', destinationId: null }))).toBe('body: Write something to share.');
  expect(tripItemSchema.parse({ status: 'todo', plannedDate: '2026-12-01', notes: ' ' }).notes).toBeNull();
  expect(tripItemSchema.safeParse({ status: 'todo', plannedDate: '1 Dec', notes: '' }).success).toBe(false);
});

test('hazard report needs a type', () => {
  expect(firstError(hazardReportSchema.safeParse({ hazardType: null, severity: 'medium', note: '' }))).toBe('hazardType: Choose what you saw.');
  expect(hazardReportSchema.parse({ hazardType: 'flood', severity: 'high', note: ' deep ' })).toEqual({ hazardType: 'flood', severity: 'high', note: 'deep' });
});
