import { z } from 'zod';

import { tx } from '@/lib/i18n';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const USERNAME = /^[a-z0-9_]{3,24}$/;

export const emailField = z
  .string()
  .trim()
  .regex(EMAIL, { error: () => tx('Enter a valid email.') });

export const newPasswordField = z
  .string()
  .min(8, { error: () => tx('Use at least 8 characters.') })
  .regex(/^(?=.*\d)(?=.*[a-zA-Z])/, { error: () => tx('Use letters and numbers.') })
  .max(72, { error: () => tx('Use {0} characters or fewer.', { 0: 72 }) });

export const usernameField = z
  .string()
  .trim()
  .toLowerCase()
  .regex(USERNAME, { error: () => tx('3-24 characters: lowercase letters, numbers or _.') });

export const fullNameField = z
  .string()
  .trim()
  .min(2, { error: () => tx('Enter your name.') })
  .max(80, { error: () => tx('Use {0} characters or fewer.', { 0: 80 }) });

export const signInSchema = z.object({
  email: emailField,
  password: z.string().min(1, { error: () => tx('Enter your password.') }),
});

export const signUpSchema = z.object({
  fullName: fullNameField,
  username: usernameField,
  email: emailField,
  password: newPasswordField,
});

export const forgotPasswordSchema = z.object({ email: emailField });

export const resetPasswordSchema = z.object({ password: newPasswordField });

/** A guest creating an account: the password comes after they confirm the email. */
export const guestUpgradeSchema = z.object({
  fullName: fullNameField,
  username: usernameField,
  email: emailField,
});
