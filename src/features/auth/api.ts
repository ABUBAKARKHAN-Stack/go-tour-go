import * as Linking from 'expo-linking';

import { supabase } from '@/lib/supabase';
import { tx } from '@/lib/i18n';

export const RESET_PASSWORD_REDIRECT = Linking.createURL('/reset-password');

export async function signIn(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
  if (error) {
    if (/invalid login credentials/i.test(error.message)) {
      throw new Error(tx('Incorrect email or password.'));
    }
    if (/email not confirmed/i.test(error.message)) {
      throw new Error(tx('Please confirm your email first. Check your inbox for the link.'));
    }
    throw error;
  }
}

export async function signUp(params: { email: string; password: string; fullName: string; username: string }) {
  const { data, error } = await supabase.auth.signUp({
    email: params.email.trim(),
    password: params.password,
    options: {
      data: { full_name: params.fullName.trim(), username: params.username.trim().toLowerCase() },
      emailRedirectTo: Linking.createURL('/'),
    },
  });
  if (error) {
    if (/already registered|already exists/i.test(error.message)) {
      throw new Error(tx('An account with this email already exists. Try signing in.'));
    }
    throw error;
  }
  // With email confirmation enabled, Supabase returns a user with no identities
  // for an existing address (to prevent enumeration) and no session.
  if (data.user && data.user.identities?.length === 0) {
    throw new Error(tx('An account with this email already exists. Try signing in.'));
  }
  return { needsConfirmation: !data.session };
}

export async function sendPasswordReset(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: RESET_PASSWORD_REDIRECT,
  });
  if (error) throw error;
}

/** Exchanges the PKCE code from the reset link for a recovery session. */
export async function exchangeRecoveryCode(code: string) {
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) throw error;
}

export async function updatePassword(password: string) {
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw error;
}

export async function signOut() {
  await supabase.auth.signOut();
}
