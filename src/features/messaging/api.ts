import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { useAuth } from '@/features/auth/auth-provider';
import { subscribeToTopic } from '@/lib/realtime';
import { supabase } from '@/lib/supabase';
import type { Conversation, Message, ProfileSummary } from '@/lib/types';

const PROFILE = 'id, username, full_name, avatar_url';

export function useConversations() {
  const { userId } = useAuth();
  return useQuery({
    queryKey: ['conversations', userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('conversations')
        .select(`*, a:profiles!conversations_user_a_fkey(${PROFILE}), b:profiles!conversations_user_b_fkey(${PROFILE})`)
        .order('last_message_at', { ascending: false, nullsFirst: false })
        .limit(50);
      if (error) throw error;
      return data as Conversation[];
    },
  });
}

export function otherParticipant(c: Conversation, userId: string | null): ProfileSummary | null {
  return c.user_a === userId ? c.b : c.a;
}

export function useMessages(conversationId: string | undefined) {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ['messages', conversationId],
    enabled: Boolean(conversationId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId!)
        .order('created_at', { ascending: false })
        .limit(60);
      if (error) throw error;
      return data as Message[]; // newest first (for an inverted list)
    },
  });

  // Realtime: new messages arrive via the private conversation topic.
  useEffect(() => {
    if (!conversationId) return;
    return subscribeToTopic<Message>(`conversation:${conversationId}`, (msg, op) => {
      if (op !== 'INSERT') return;
      qc.setQueryData<Message[]>(['messages', conversationId], (old = []) =>
        old.some((m) => m.id === msg.id) ? old : [msg, ...old.filter((m) => !m.id.startsWith('temp-'))],
      );
      qc.invalidateQueries({ queryKey: ['conversations'] });
    });
  }, [conversationId, qc]);

  return query;
}

/**
 * While a chat is open, its message notifications count as read (the badge on
 * Community and the list dot clear). Re-runs when new messages arrive.
 */
export function useMarkConversationRead(conversationId: string | undefined, newestId: string | undefined) {
  const qc = useQueryClient();
  useEffect(() => {
    if (!conversationId) return;
    supabase
      .rpc('mark_conversation_read', { p_conversation_id: conversationId })
      .then(({ error }) => {
        if (!error) qc.invalidateQueries({ queryKey: ['inbox'] });
      });
  }, [conversationId, newestId, qc]);
}

export function useSendMessage(conversationId: string) {
  const qc = useQueryClient();
  const { userId } = useAuth();
  const key = ['messages', conversationId];
  return useMutation({
    mutationFn: async (body: string) => {
      const { data, error } = await supabase
        .from('messages')
        .insert({ conversation_id: conversationId, sender_id: userId, body: body.trim() })
        .select()
        .single();
      if (error) throw error;
      return data as Message;
    },
    onMutate: async (body) => {
      const temp: Message = {
        id: `temp-${Date.now()}`,
        conversation_id: conversationId,
        sender_id: userId!,
        body: body.trim(),
        created_at: new Date().toISOString(),
      };
      qc.setQueryData<Message[]>(key, (old = []) => [temp, ...old]);
      return { tempId: temp.id };
    },
    onSuccess: (msg, _v, ctx) => {
      qc.setQueryData<Message[]>(key, (old = []) => {
        const withoutTemp = old.filter((m) => m.id !== ctx?.tempId);
        return withoutTemp.some((m) => m.id === msg.id) ? withoutTemp : [msg, ...withoutTemp];
      });
      qc.invalidateQueries({ queryKey: ['conversations'] });
    },
    onError: (_e, _v, ctx) => {
      qc.setQueryData<Message[]>(key, (old = []) => old.filter((m) => m.id !== ctx?.tempId));
    },
  });
}

export async function startConversation(otherUserId: string): Promise<string> {
  const { data, error } = await supabase.rpc('start_conversation', { other: otherUserId });
  if (error) throw error;
  return data as string;
}
