import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { useAuth } from '@/features/auth/auth-provider';
import { CHANNELS, notifyNow } from '@/features/notifications/local-notifications';
import { subscribeToTopic } from '@/lib/realtime';
import { supabase } from '@/lib/supabase';
import type { AppNotification } from '@/lib/types';

export function useInbox() {
  const { userId } = useAuth();
  return useQuery({
    queryKey: ['inbox', userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as AppNotification[];
    },
  });
}

export function useUnreadCount() {
  const { data } = useInbox();
  return (data ?? []).filter((n) => !n.read_at).length;
}

/** Conversations with unread messages (for the Messages badge). */
export function useUnreadConversations() {
  const { data } = useInbox();
  const ids = new Set(
    (data ?? []).filter((n) => n.type === 'message' && !n.read_at).map((n) => String((n.data as { conversation_id?: string } | null)?.conversation_id ?? '')),
  );
  ids.delete('');
  return ids;
}

export function useMarkAllRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc('mark_notifications_read');
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['inbox'] }),
  });
}

const channelFor = (type: string) => (type === 'sos' ? CHANNELS.safety : CHANNELS.social);

/**
 * Listens to the user's private notifications topic while the app process is
 * alive: refreshes the feed and related queries, and raises a local
 * notification (FCM remote push is out of the MVP scope).
 */
export function useInboxRealtime() {
  const { userId } = useAuth();
  const qc = useQueryClient();
  useEffect(() => {
    if (!userId) return;
    return subscribeToTopic<AppNotification>(`notifications:${userId}`, (n, op) => {
      if (op !== 'INSERT') return;
      qc.invalidateQueries({ queryKey: ['inbox'] });
      if (n.type === 'friend_request' || n.type === 'friend_accepted') qc.invalidateQueries({ queryKey: ['friends'] });
      if (n.type === 'message') qc.invalidateQueries({ queryKey: ['conversations'] });
      notifyNow({
        title: n.title,
        body: n.body,
        channel: channelFor(n.type),
        data: { type: n.type, ...n.data },
      });
    });
  }, [userId, qc]);
}
