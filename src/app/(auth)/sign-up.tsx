import { router } from 'expo-router';
import { AtSign, CheckCircle2, Lock, Mail, MailCheck, UserRound, XCircle } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { useWatch } from 'react-hook-form';
import { ActivityIndicator, View } from 'react-native';

import { AppButton } from '@/components/app-button';
import { FormTextField } from '@/components/form-field';
import { InlineError } from '@/components/states';
import { Text } from '@/components/text';
import { signUp } from '@/features/auth/api';
import { AuthShell } from '@/features/auth/auth-shell';
import { signUpSchema } from '@/features/auth/schemas';
import { useUsernameAvailability, type UsernameStatus } from '@/features/auth/use-username-availability';
import { suggestUsername } from '@/features/auth/username';
import { serverError, useZodForm } from '@/lib/forms';
import { tx } from '@/lib/i18n';
import { colors } from '@/lib/theme';

const MAX_ATTEMPTS = 8;

export default function SignUp() {
  const [confirmSent, setConfirmSent] = useState<string | null>(null);
  // The username follows the full name until the traveller edits it.
  const [edited, setEdited] = useState(false);
  const { control, handleSubmit, setError, setFocus, setValue, formState } = useZodForm(signUpSchema, {
    defaultValues: { fullName: '', username: '', email: '', password: '' },
  });
  const fullName = useWatch({ control, name: 'fullName' });
  const username = useWatch({ control, name: 'username' });
  const status = useUsernameAvailability(username);

  // An auto-filled name that is taken moves on to ayesha_khan2, ayesha_khan3…
  // (the form is an external store, so this effect only updates it).
  useEffect(() => {
    if (edited || status !== 'taken') return;
    let attempt = 0;
    while (attempt < MAX_ATTEMPTS && suggestUsername(fullName, attempt) !== username) attempt++;
    if (attempt >= MAX_ATTEMPTS) return;
    setValue('username', suggestUsername(fullName, attempt + 1), { shouldValidate: true });
  }, [edited, status, fullName, username, setValue]);

  const submit = handleSubmit(async (values) => {
    if (status === 'taken') {
      setError('username', { type: 'taken', message: tx('That username is taken. Try another.') });
      return;
    }
    try {
      const { needsConfirmation } = await signUp(values);
      if (needsConfirmation) setConfirmSent(values.email);
    } catch (e) {
      setError('root', serverError(e));
    }
  });

  if (confirmSent) {
    return (
      <AuthShell back compact title={tx('Check your email')} subtitle={tx('We sent a confirmation link to {0}. Open it on this phone, then sign in.', { 0: confirmSent })}>
        <View className="flex-row items-center gap-3 rounded-2xl bg-primary-soft p-4">
          <MailCheck color={colors.primary} size={22} />
          <Text className="flex-1 text-sm text-foreground">{tx('Did not get it? Check your spam folder, or sign up again in a few minutes.')}</Text>
        </View>
        <AppButton label={tx('Back to sign in')} onPress={() => router.replace('/sign-in')} />
      </AuthShell>
    );
  }

  return (
    <AuthShell back compact title={tx('Create your account')} subtitle={tx('Save places, plan journeys and travel with friends.')}>
      {formState.errors.root?.message ? <InlineError message={formState.errors.root.message} /> : null}
      <FormTextField
        control={control}
        name="fullName"
        label={tx('Full name')}
        autoComplete="name"
        placeholder={tx('Ayesha Khan')}
        returnKeyType="next"
        onSubmitEditing={() => setFocus('email')}
        onValueChange={(name) => {
          if (edited) return;
          setValue('username', suggestUsername(name), { shouldValidate: Boolean(formState.touchedFields.username) });
        }}
        left={<UserRound color={colors.faint} size={20} />}
      />
      <FormTextField
        control={control}
        name="username"
        label={tx('Username')}
        transform={(t) => t.toLowerCase().replace(/\s+/g, '_')}
        onValueChange={() => setEdited(true)}
        autoCapitalize="none"
        autoComplete="username"
        placeholder="ayesha_travels"
        returnKeyType="next"
        onSubmitEditing={() => setFocus('email')}
        errorOverride={status === 'taken' && edited ? tx('That username is taken. Try another.') : null}
        hint={usernameHint(status, username, edited)}
        left={<AtSign color={colors.faint} size={20} />}
        right={<StatusIcon status={status} />}
      />
      <FormTextField
        control={control}
        name="email"
        label={tx('Email')}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        placeholder="you@example.com"
        returnKeyType="next"
        onSubmitEditing={() => setFocus('password')}
        left={<Mail color={colors.faint} size={20} />}
      />
      <FormTextField
        control={control}
        name="password"
        label={tx('Password')}
        secureTextEntry
        autoComplete="new-password"
        placeholder={tx('At least 8 characters')}
        returnKeyType="go"
        onSubmitEditing={() => submit()}
        left={<Lock color={colors.faint} size={20} />}
      />
      <View className="pt-2">
        <AppButton label={tx('Create account')} onPress={submit} loading={formState.isSubmitting} />
      </View>
      <AppButton label={tx('I already have an account')} variant="ghost" onPress={() => (router.canGoBack() ? router.back() : router.replace('/sign-in'))} />
    </AuthShell>
  );
}

function usernameHint(status: UsernameStatus, username: string, edited: boolean) {
  switch (status) {
    case 'checking':
      return tx('Checking @{0}…', { 0: username });
    case 'available':
      return edited ? tx('@{0} is available.', { 0: username }) : tx('@{0} is available. You can change it.', { 0: username });
    case 'taken':
      return tx('Finding a free username…');
    case 'unknown':
      return tx('Could not check right now; we will check when you sign up.');
    default:
      return tx('Friends find you by this name. Filled in from your name.');
  }
}

function StatusIcon({ status }: { status: UsernameStatus }) {
  if (status === 'checking') return <ActivityIndicator size="small" color={colors.faint} />;
  if (status === 'available') return <CheckCircle2 color={colors.success} size={20} accessibilityLabel={tx('Available')} />;
  if (status === 'taken') return <XCircle color={colors.destructive} size={20} accessibilityLabel={tx('Taken')} />;
  return null;
}
