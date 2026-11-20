import { onlineManager, useQueryClient } from '@tanstack/react-query';
import { CloudOff, Wifi, WifiOff, type LucideIcon } from 'lucide-react-native';
import { useEffect, useSyncExternalStore } from 'react';
import { View } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/text';
import { tx } from '@/lib/i18n';
import { colors, shadow } from '@/lib/theme';

/**
 * Short notices at the top of the screen that never block taps: the
 * connection coming back, and actions waiting for it. One at a time; a new
 * one replaces the old.
 */
type Toast = { id: number; text: string; icon: 'offline' | 'online' | 'queued' };

let current: Toast | null = null;
let seq = 0;
let timer: ReturnType<typeof setTimeout> | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export const toast = {
  show(text: string, icon: Toast['icon'], ms = 3500) {
    seq += 1;
    current = { id: seq, text, icon };
    emit();
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      current = null;
      emit();
    }, ms);
  },
  get: () => current,
  subscribe(l: () => void) {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  },
};

const ICONS: Record<Toast['icon'], LucideIcon> = { offline: WifiOff, online: Wifi, queued: CloudOff };

/** Shows notices, and raises them for connection changes and actions waiting for the connection. */
export function ToastHost() {
  const insets = useSafeAreaInsets();
  const current = useSyncExternalStore(toast.subscribe, toast.get);
  const queryClient = useQueryClient();

  // Connection back (the same signal the data layer uses). Losing it isn't announced
  // here: each screen already says so (its banner, or the "You're offline" card).
  useEffect(() => {
    let wasOnline = onlineManager.isOnline();
    return onlineManager.subscribe((online) => {
      if (online === wasOnline) return;
      wasOnline = online;
      if (online) toast.show(tx('Back online'), 'online', 2500);
    });
  }, []);

  // An action (like, save, comment, post...) made offline waits and is sent when the connection is back.
  useEffect(() => {
    let lastShown = 0;
    return queryClient.getMutationCache().subscribe((event) => {
      if (event.type !== 'updated' || event.action.type !== 'pause') return;
      const now = Date.now();
      if (now - lastShown < 4000) return;
      lastShown = now;
      toast.show(tx("You're offline. This will go through when you're back online."), 'queued', 4500);
    });
  }, [queryClient]);

  if (!current) return null;
  const Icon = ICONS[current.icon];
  return (
    <View pointerEvents="none" className="absolute left-0 right-0 items-center px-4" style={{ top: insets.top + 8 }}>
      <Animated.View
        key={current.id}
        entering={FadeInUp.duration(220)}
        exiting={FadeOutUp.duration(180)}
        accessibilityRole="alert"
        accessibilityLiveRegion="polite"
        className="max-w-[420px] flex-row items-center gap-2 rounded-full bg-foreground px-4 py-2.5"
        style={{ boxShadow: shadow(0.25, 6, 16) }}
      >
        <Icon color={current.icon === 'online' ? colors.success : '#FFFFFF'} size={16} />
        <Text className="shrink text-[13px] font-semibold text-white">{current.text}</Text>
      </Animated.View>
    </View>
  );
}
