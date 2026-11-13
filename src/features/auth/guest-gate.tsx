import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { UserPlus } from 'lucide-react-native';
import { useCallback, useEffect, useState, useSyncExternalStore, type ReactNode } from 'react';
import { Alert, View } from 'react-native';

import { AppButton } from '@/components/app-button';
import { Screen } from '@/components/screen';
import { Sheet } from '@/components/sheet';
import { EmptyState } from '@/components/states';
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

/** The prompt itself; rendered once in the signed-in layout. */
export function GuestGateOverlay() {
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

  // Keep the last reason on screen while the sheet slides away.
  const [shownWhy, setShownWhy] = useState(why);
  if (why && why !== shownWhy) setShownWhy(why);
  if (!isGuest) return null;

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
    <Sheet visible={Boolean(why)} onClose={guestGate.close} dragAnywhere>
      <View className="items-center gap-3">
        <View className="h-16 w-16 items-center justify-center rounded-full bg-primary-soft">
          <UserPlus color={colors.primary} size={28} />
        </View>
        <Text accessibilityRole="header" className="text-center font-display text-2xl text-heading">
          {tx('Create a free account')}
        </Text>
        <Text className="text-center text-[15px] leading-[22px] text-muted-foreground">
          {tx('You need an account to {0}. Your saved places and trips come with you.', { 0: shownWhy ?? '' })}
        </Text>
      </View>
      <View className="gap-2 pt-1">
        <AppButton label={tx('Create account')} icon={UserPlus} onPress={createAccount} />
        <AppButton label={tx('I already have an account')} variant="secondary" onPress={signIn} />
        <AppButton label={tx('Not now')} variant="ghost" onPress={guestGate.close} />
      </View>
    </Sheet>
  );
}

/**
 * Whole screens that only make sense with an account (messages, friends,
 * edit profile, new post / story / review). A guest who reaches one, from a
 * link or a notification, sees why and the way to an account instead.
 */
export function AccountRequired({ reason, children }: { reason: string; children: ReactNode }) {
  const { isGuest } = useAuth();
  if (!isGuest) return <>{children}</>;
  return (
    <Screen back title={tx('Create a free account')}>
      <EmptyState
        icon={UserPlus}
        title={tx('This needs an account')}
        message={tx('You need an account to {0}. Your saved places and trips come with you.', { 0: reason })}
        actionLabel={tx('Create account')}
        onAction={() => router.replace('/create-account')}
      />
    </Screen>
  );
}
