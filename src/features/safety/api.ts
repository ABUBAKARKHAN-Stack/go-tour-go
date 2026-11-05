import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Linking, Share } from 'react-native';

import { useAuth } from '@/features/auth/auth-provider';
import { supabase } from '@/lib/supabase';
import type { TrustedContact } from '@/lib/types';

import { tx } from '@/lib/i18n';

import { isValidPhone, normalizePhone, whatsappLink } from './phone-helpers';

export { isValidPhone, normalizePhone, osmLink, sosMessage, whatsappLink } from './phone-helpers';

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
        if (!c.name.trim()) throw new Error(tx('Enter a name.'));
        if (!isValidPhone(phone)) throw new Error(tx('Enter a valid phone number with country code, e.g. +923001234567.'));
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
