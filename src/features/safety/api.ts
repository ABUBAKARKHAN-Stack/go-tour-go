import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Linking, Share } from 'react-native';

import { useAuth } from '@/features/auth/auth-provider';
import { supabase } from '@/lib/supabase';
import type { TrustedContact } from '@/lib/types';

import { isValidPhone, normalizePhone, whatsappLink } from './phone-helpers';

export { isValidPhone, mapsLink, normalizePhone, sosMessage, whatsappLink } from './phone-helpers';

export function useTrustedContacts() {
  const { userId } = useAuth();
  return useQuery({
    queryKey: ['trusted-contacts', userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await supabase.from('trusted_contacts').select('*').order('created_at');
      if (error) throw error;
      return data as TrustedContact[];
    },
  });
}

export function useContactActions() {
  const qc = useQueryClient();
  const { userId } = useAuth();
  const invalidate = () => qc.invalidateQueries({ queryKey: ['trusted-contacts'] });
  return {
    save: useMutation({
      mutationFn: async (c: { id?: string; name: string; phone: string; relationship?: string }) => {
        const phone = normalizePhone(c.phone);
        if (!c.name.trim()) throw new Error('Enter a name.');
        if (!isValidPhone(phone)) throw new Error('Enter a valid phone number with country code, e.g. +923001234567.');
        const row = { user_id: userId, name: c.name.trim(), phone, relationship: c.relationship?.trim() || null };
        const { error } = c.id
          ? await supabase.from('trusted_contacts').update(row).eq('id', c.id)
          : await supabase.from('trusted_contacts').insert(row);
        if (error) throw error;
      },
      onSuccess: invalidate,
    }),
    remove: useMutation({
      mutationFn: async (id: string) => {
        const { error } = await supabase.from('trusted_contacts').delete().eq('id', id);
        if (error) throw error;
      },
      onSuccess: invalidate,
    }),
  };
}

export async function openWhatsApp(phone: string, text: string): Promise<boolean> {
  try {
    await Linking.openURL(whatsappLink(phone, text));
    return true;
  } catch {
    // Fallback: system share sheet (SMS, other messengers).
    await Share.share({ message: text });
    return false;
  }
}

export async function logSosEvent(input: { latitude: number | null; longitude: number | null; accuracy: number | null; message: string; contacts: number }) {
  const { data } = await supabase.auth.getSession();
  const userId = data.session?.user.id;
  if (!userId) return;
  await supabase.from('sos_events').insert({
    user_id: userId,
    latitude: input.latitude,
    longitude: input.longitude,
    accuracy: input.accuracy,
    message: input.message.slice(0, 500),
    contacts_notified: input.contacts,
  });
}
