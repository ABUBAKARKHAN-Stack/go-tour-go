import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { UserPlus } from 'lucide-react-native';
import { useCallback, useEffect, useSyncExternalStore } from 'react';
import { Alert, Modal, Pressable, StyleSheet, View } from 'react-native';
import Animated, { Easing, ReduceMotion, SlideInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton } from '@/components/app-button';
import { Text } from '@/components/text';
import { signOut } from '@/features/auth/api';
import { useAuth } from '@/features/auth/auth-provider';
import { haptics } from '@/lib/haptics';
import { tx } from '@/lib/i18n';
import { colors } from '@/lib/theme';

/**
 * Guests (anonymous sign-ins) can explore, save places and plan trips, but
 * posting, liking, reviewing, following, messaging, live sharing and hazard
 * reports need an account. The database enforces it (guest_mode migration);
 * this is the friendly side: "Create a free account to …".
 */
let reason: string | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export const guestGate = {
  open(why: string) {
    reason = why;
    emit();
  },
  close() {
    reason = null;
    emit();
  },
  get: () => reason,
  subscribe(l: () => void) {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  },
};

/**
 * Returns a check for actions that need an account: true for members; for
 * guests it opens the prompt and returns false.
 *   if (!requireAccount(tx('post travel moments'))) return;
 */
export function useRequireAccount() {
  const { isGuest } = useAuth();
  return useCallback(
    (why: string) => {
      if (!isGuest) return true;
      haptics.select();
      guestGate.open(why);
      return false;
    },
    [isGuest],
  );
}

/** A write the guest rules refused (RLS or the guest check in an RPC). */
function isGuestRefusal(error: unknown) {
  const e = error as { code?: string; message?: string } | null;
  return e?.code === '42501' || /row-level security|create a free account/i.test(e?.message ?? '');
}

const SHEET_IN = SlideInDown.duration(280).easing(Easing.bezier(0.32, 0.72, 0, 1)).reduceMotion(ReduceMotion.System);

/** The prompt itself; rendered once in the signed-in layout. */
export function GuestGateOverlay() {
  const insets = useSafeAreaInsets();
  const { isGuest } = useAuth();
  const qc = useQueryClient();
  const why = useSyncExternalStore(guestGate.subscribe, guestGate.get);

  // Safety net: if a guest reaches a blocked action the UI did not gate, show the prompt instead of an error.
  useEffect(() => {
    if (!isGuest) return;
    return qc.getMutationCache().subscribe((event) => {
      if (event.type === 'updated' && event.mutation.state.status === 'error' && isGuestRefusal(event.mutation.state.error)) {
        guestGate.open(tx('do that'));
      }
    });
  }, [isGuest, qc]);

  if (!isGuest || !why) return null;

  const createAccount = () => {
    guestGate.close();
    router.push('/create-account');
  };
  const signIn = () =>
    Alert.alert(tx('Sign in to another account?'), tx('Your guest saved places and trips stay with the guest profile and will not move to that account.'), [
      { text: tx('Cancel'), style: 'cancel' },
      {
        text: tx('Sign in'),
        onPress: async () => {
          guestGate.close();
          await signOut();
        },
      },
    ]);

  return (
    <Modal visible transparent animationType="fade" onRequestClose={guestGate.close} statusBarTranslucent>
      <View className="flex-1 justify-end">
        <Pressable style={StyleSheet.absoluteFill} className="bg-black/40" onPress={guestGate.close} accessibilityRole="button" accessibilityLabel={tx('Not now')} />
        <Animated.View entering={SHEET_IN} className="gap-4 rounded-t-[28px] bg-background px-6 pt-3" style={{ paddingBottom: insets.bottom + 16 }}>
          <View className="items-center">
            <View className="h-1 w-10 rounded-full bg-border-strong" />
          </View>
          <View className="items-center gap-3 pt-2">
            <View className="h-16 w-16 items-center justify-center rounded-full bg-primary-soft">
              <UserPlus color={colors.primary} size={28} />
            </View>
            <Text accessibilityRole="header" className="text-center font-display text-2xl text-heading">
              {tx('Create a free account')}
            </Text>
            <Text className="text-center text-[15px] leading-[22px] text-muted-foreground">
              {tx('You need an account to {0}. Your saved places and trips come with you.', { 0: why })}
            </Text>
          </View>
          <View className="gap-2 pt-1">
            <AppButton label={tx('Create account')} icon={UserPlus} onPress={createAccount} />
            <AppButton label={tx('I already have an account')} variant="secondary" onPress={signIn} />
            <AppButton label={tx('Not now')} variant="ghost" onPress={guestGate.close} />
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
