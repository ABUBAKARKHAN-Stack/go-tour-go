import { router } from 'expo-router';
import { ArrowRight, AtSign, CheckCircle2, Mail, MailCheck, UserRound, XCircle } from 'lucide-react-native';
import { useState } from 'react';
import { useWatch } from 'react-hook-form';
import { ActivityIndicator, View } from 'react-native';

import { AppButton } from '@/components/app-button';
import { FormTextField } from '@/components/form-field';
import { InlineError } from '@/components/states';
import { Text } from '@/components/text';
import { startGuestUpgrade } from '@/features/auth/api';
import { AuthShell } from '@/features/auth/auth-shell';
import { useAuth } from '@/features/auth/auth-provider';
import { guestUpgradeSchema } from '@/features/auth/schemas';
import { useUsernameAvailability } from '@/features/auth/use-username-availability';
import { HERO_PHOTOS } from '@/features/brand/hero-photos';
import { serverError, useZodForm } from '@/lib/forms';
import { tx } from '@/lib/i18n';
import { colors } from '@/lib/theme';

/**
 * A guest creates their account and keeps what they saved (same user, an
 * email is linked to it). Step 1 here; the email link opens /finish-account
 * to choose a password.
 */
export default function CreateAccount() {
  const { isGuest } = useAuth();
  const [sentTo, setSentTo] = useState<string | null>(null);
  const { control, handleSubmit, setError, setFocus, formState } = useZodForm(guestUpgradeSchema, {
    defaultValues: { fullName: '', username: '', email: '' },
  });
  const username = useWatch({ control, name: 'username' });
  const status = useUsernameAvailability(username);

  const submit = handleSubmit(async (values) => {
    if (status === 'taken') {
      setError('username', { type: 'taken', message: tx('That username is taken. Try another.') });
      return;
    }
    try {
      await startGuestUpgrade(values);
      setSentTo(values.email.trim());
    } catch (e) {
      setError('root', serverError(e));
    }
  });

  if (!isGuest) {
    return (
      <AuthShell back title={tx('You have an account')} subtitle={tx('You are already signed in.')}>
        <AppButton label={tx('Continue')} onPress={() => router.replace('/')} />
      </AuthShell>
    );
  }

  if (sentTo) {
    return (
      <AuthShell back title={tx('Check your email')} subtitle={tx('We sent a link to {0}. Open it on this phone to choose your password.', { 0: sentTo })}>
        <View className="flex-row items-center gap-3 rounded-2xl bg-primary-soft p-4">
          <MailCheck color={colors.primary} size={22} />
          <Text className="flex-1 text-sm text-foreground">{tx('Keep exploring meanwhile; your saved places and trips stay with you.')}</Text>
        </View>
        <AppButton label={tx('Back to the app')} onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} />
      </AuthShell>
    );
  }

  return (
    <AuthShell back photo={HERO_PHOTOS.signUp} title={tx('Create your account')} subtitle={tx('Keep your saved places and trips, and join the community.')}>
      {formState.errors.root?.message ? <InlineError message={formState.errors.root.message} /> : null}
      <FormTextField
        hideLabel
        control={control}
        name="fullName"
        label={tx('Full name')}
        autoComplete="name"
        placeholder={tx('Full name')}
        returnKeyType="next"
        onSubmitEditing={() => setFocus('username')}
        left={<UserRound color={colors.primary} size={20} />}
      />
      <FormTextField
        hideLabel
        control={control}
        name="username"
        label={tx('Username')}
        transform={(t) => t.toLowerCase().replace(/\s+/g, '_')}
        autoCapitalize="none"
        autoComplete="username"
        placeholder={tx('Username')}
        returnKeyType="next"
        onSubmitEditing={() => setFocus('email')}
        left={<AtSign color={colors.primary} size={20} />}
        right={
          status === 'checking' ? (
            <ActivityIndicator size="small" color={colors.faint} />
          ) : status === 'available' ? (
            <CheckCircle2 color={colors.success} size={20} accessibilityLabel={tx('Available')} />
          ) : status === 'taken' ? (
            <XCircle color={colors.destructive} size={20} accessibilityLabel={tx('Taken')} />
          ) : null
        }
      />
      <FormTextField
        hideLabel
        control={control}
        name="email"
        label={tx('Email')}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        placeholder={tx('Email address')}
        returnKeyType="go"
        onSubmitEditing={() => submit()}
        left={<Mail color={colors.primary} size={20} />}
      />
      <View className="pt-1">
        <AppButton label={tx('Send link')} trailingIcon={ArrowRight} onPress={submit} loading={formState.isSubmitting} />
      </View>
      <Text className="text-center text-xs text-faint">{tx('You choose your password after opening the link in the email.')}</Text>
    </AuthShell>
  );
}
