import type { RealtimeChannel } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';

type ChangePayload<T> = { record?: T; old_record?: T; operation?: string };

/**
 * Subscribes to a private Broadcast topic fed by realtime.broadcast_changes()
 * triggers (see migrations). Access is authorized by RLS on realtime.messages.
 * Returns an unsubscribe function.
 */
export function subscribeToTopic<T>(
  topic: string,
  onChange: (record: T, operation: 'INSERT' | 'UPDATE' | 'DELETE', old?: T) => void,
): () => void {
  let channel: RealtimeChannel | null = null;
  let cancelled = false;

  (async () => {
    await supabase.realtime.setAuth(); // send the user's JWT for Realtime Authorization
    if (cancelled) return;
    channel = supabase.channel(topic, { config: { private: true } });
    for (const event of ['INSERT', 'UPDATE', 'DELETE'] as const) {
      channel.on('broadcast', { event }, (message) => {
        const payload = (message.payload ?? {}) as ChangePayload<T>;
        const record = payload.record ?? payload.old_record;
        if (record) onChange(record, event, payload.old_record);
      });
    }
    channel.subscribe();
  })().catch((e) => console.warn('realtime subscribe failed', topic, e));

  return () => {
    cancelled = true;
    if (channel) supabase.removeChannel(channel);
  };
}
