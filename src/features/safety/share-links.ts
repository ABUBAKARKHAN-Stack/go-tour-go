import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import { storage, useStorage } from '@/lib/storage';

import { isValidPhone, normalizePhone } from './phone-helpers';

/**
 * Links that show where a traveller is: SOS links (go-tour-go.expo.app/sos?t=…)
 * and live-location links (/live?t=…). With GoTourGo installed they open the
 * in-app screen (Android App Links); without it, a small web page. Links last
 * at most 24 hours and can be ended early by the sender.
 */
export const SHARE_SITE = 'https://go-tour-go.expo.app';

export type ShareKind = 'sos' | 'live';

export type SharedLocation = {
  kind: ShareKind;
  status: 'active' | 'expired' | 'ended';
  name: string;
  avatar_url: string | null;
  created_at: string;
  expires_at: string;
  ended_at: string | null;
  is_owner: boolean | null;
  live?: boolean;
  latitude?: number | null;
  longitude?: number | null;
  accuracy?: number | null;
  located_at?: string;
  phone?: string | null;
};

export function shareUrl(kind: ShareKind, token: string) {
  return `${SHARE_SITE}/${kind}?t=${token}`;
}

/** Valid link tokens are 32 hex characters. */
export function isShareToken(token: unknown): token is string {
  return typeof token === 'string' && /^[0-9a-f]{32}$/.test(token);
}

const OWN_PHONE_KEY = 'gtg.safety.ownPhone';

/** The traveller's own number, shown on their SOS link so people can call them. Stored on this phone only. */
export function useOwnPhone() {
  return useStorage<string>(OWN_PHONE_KEY, '');
}

function ownPhone() {
  const phone = normalizePhone(storage.get<string>(OWN_PHONE_KEY, ''));
  return isValidPhone(phone) ? phone : null;
}

export async function createShareLink(input: {
  kind: ShareKind;
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  message?: string;
  contacts?: number;
  expiresAt?: number | null;
}): Promise<string | null> {
  const { data: session } = await supabase.auth.getSession();
  const userId = session.session?.user.id;
  if (!userId) return null;
  const { data, error } = await supabase
    .from('sos_events')
    .insert({
      user_id: userId,
      kind: input.kind,
      latitude: input.latitude,
      longitude: input.longitude,
      accuracy: input.accuracy,
      message: (input.message ?? '').slice(0, 500),
      contacts_notified: input.contacts ?? 0,
      phone: ownPhone(),
      ...(input.expiresAt ? { expires_at: new Date(input.expiresAt).toISOString() } : {}),
    })
    .select('token')
    .single();
  if (error) throw error;
  return (data as { token: string }).token;
}

export async function endShareLink(token: string) {
  const { error } = await supabase.rpc('end_shared_location', { p_token: token });
  if (error) throw error;
}

export async function endLiveLinks() {
  await supabase.rpc('end_my_live_links');
}

export async function fetchSharedLocation(token: string): Promise<SharedLocation | null> {
  const { data, error } = await supabase.rpc('get_shared_location', { p_token: token });
  if (error) throw error;
  return (data as SharedLocation | null) ?? null;
}

/** Polls every 20 s while the link is active. */
export function useSharedLocation(token: string | undefined) {
  return useQuery({
    queryKey: ['shared-location', token],
    queryFn: () => fetchSharedLocation(token!),
    enabled: isShareToken(token),
    refetchInterval: (q) => (q.state.data?.status === 'active' ? 20_000 : false),
  });
}
