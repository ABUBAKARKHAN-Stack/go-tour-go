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

/** Where the "finish creating your account" email link lands (a guest converting). */
export const FINISH_ACCOUNT_REDIRECT = Linking.createURL('/finish-account');

/** Explore without an account: an anonymous sign-in (enable "Allow anonymous sign-ins" in Supabase). */
export async function signInAsGuest() {
  const { error } = await supabase.auth.signInAnonymously();
  if (error) {
    if (/anonymous.*disabled|not enabled/i.test(error.message)) {
      throw new Error(tx('Guest mode is not available right now. Create an account or sign in.'));
    }
    throw error;
  }
}

/**
 * A guest turns into a full account and keeps their saved places and trips
 * (the same user). Step 1: link the email; Supabase emails a confirmation
 * link. Step 2 (finishGuestUpgrade) sets the password after they tap it.
 */
export async function startGuestUpgrade(params: { email: string; fullName: string; username: string }) {
  const { error } = await supabase.auth.updateUser(
    { email: params.email.trim(), data: { full_name: params.fullName.trim(), username: params.username.trim().toLowerCase() } },
    { emailRedirectTo: FINISH_ACCOUNT_REDIRECT },
  );
  if (error) {
    if (/already (been )?registered|already exists|email.*(taken|in use)/i.test(error.message)) {
      throw new Error(tx('An account with this email already exists. Try signing in.'));
    }
    throw error;
  }
}

/** Confirms the email from the link (PKCE code, or token hash). */
export async function confirmEmailLink(params: { code?: string; tokenHash?: string }) {
  if (params.code) {
    const { error } = await supabase.auth.exchangeCodeForSession(params.code);
    if (error) throw error;
    return;
  }
  if (params.tokenHash) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: params.tokenHash, type: 'email_change' });
    if (error) throw error;
  }
}

/** Step 2: set the password, then put the chosen name and username on the profile. */
export async function finishGuestUpgrade(password: string) {
  const { data, error } = await supabase.auth.updateUser({ password });
  if (error) throw error;
  // A fresh token carries is_anonymous = false, which the profile rules check.
  await supabase.auth.refreshSession();
  const user = data.user;
  const meta = (user?.user_metadata ?? {}) as { full_name?: string; username?: string };
  if (!user) return;
  const patch: { full_name?: string; username?: string } = {};
  if (meta.full_name) patch.full_name = meta.full_name.slice(0, 80);
  if (meta.username && /^[a-z0-9_]{3,24}$/.test(meta.username)) patch.username = meta.username;
  if (Object.keys(patch).length) {
    const { error: profileError } = await supabase.from('profiles').update(patch).eq('id', user.id);
    // A taken username keeps the automatic one; they can change it in Edit profile.
    if (profileError && patch.username) await supabase.from('profiles').update({ full_name: patch.full_name }).eq('id', user.id);
  }
}
