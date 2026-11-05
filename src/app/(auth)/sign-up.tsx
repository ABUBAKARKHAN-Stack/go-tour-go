import { router } from 'expo-router';
import { AtSign, Lock, Mail, MailCheck, UserRound } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';

import { AppButton } from '@/components/app-button';
import { FormTextField } from '@/components/form-field';
import { Screen } from '@/components/screen';
import { EmptyState, InlineError } from '@/components/states';
import { signUp } from '@/features/auth/api';
import { AuthShell } from '@/features/auth/auth-shell';
import { signUpSchema } from '@/features/auth/schemas';
import { serverError, useZodForm } from '@/lib/forms';
import { colors } from '@/lib/theme';
import { tx } from '@/lib/i18n';

export default function SignUp() {
  const [confirmSent, setConfirmSent] = useState<string | null>(null);
  const { control, handleSubmit, setError, setFocus, formState } = useZodForm(signUpSchema, {
    defaultValues: { fullName: '', username: '', email: '', password: '' },
  });

  const submit = handleSubmit(async (values) => {
    try {
      const { needsConfirmation } = await signUp(values);
      if (needsConfirmation) setConfirmSent(values.email);
    } catch (e) {
      setError('root', serverError(e));
    }
  });

  if (confirmSent) {
    return (
      <Screen back title={tx('Check your email')}>
        <EmptyState
          icon={MailCheck}
          title={tx('Confirm your email')}
          message={tx('We sent a confirmation link to {0}. Open it on this phone, then sign in.', { 0: confirmSent })}
          actionLabel={tx('Back to sign in')}
          onAction={() => router.replace('/sign-in')}
        />
      </Screen>
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
        onSubmitEditing={() => setFocus('username')}
        left={<UserRound color={colors.faint} size={20} />}
      />
      <FormTextField
        control={control}
        name="username"
        label={tx('Username')}
        transform={(t) => t.toLowerCase()}
        autoCapitalize="none"
        autoComplete="username"
        placeholder="ayesha_travels"
        returnKeyType="next"
        onSubmitEditing={() => setFocus('email')}
        hint={tx('Friends find you by this name.')}
        left={<AtSign color={colors.faint} size={20} />}
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
    </AuthShell>
  );
}
