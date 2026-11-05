import { router } from 'expo-router';
import { Mail, MailCheck } from 'lucide-react-native';
import { useState } from 'react';

import { AppButton } from '@/components/app-button';
import { FormTextField } from '@/components/form-field';
import { Screen } from '@/components/screen';
import { EmptyState, InlineError } from '@/components/states';
import { sendPasswordReset } from '@/features/auth/api';
import { AuthShell } from '@/features/auth/auth-shell';
import { forgotPasswordSchema } from '@/features/auth/schemas';
import { serverError, useZodForm } from '@/lib/forms';
import { colors } from '@/lib/theme';
import { tx } from '@/lib/i18n';

export default function ForgotPassword() {
  const [sent, setSent] = useState(false);
  const { control, handleSubmit, setError, formState } = useZodForm(forgotPasswordSchema, { defaultValues: { email: '' } });

  const submit = handleSubmit(async ({ email }) => {
    try {
      await sendPasswordReset(email);
      setSent(true);
    } catch (e) {
      setError('root', serverError(e));
    }
  });

  if (sent) {
    return (
      <Screen back title={tx('Reset password')}>
        <EmptyState
          icon={MailCheck}
          title={tx('Check your inbox')}
          message={tx('If an account exists for this email, you will receive a reset link. Open it on this phone to choose a new password.')}
          actionLabel={tx('Back to sign in')}
          onAction={() => router.replace('/sign-in')}
        />
      </Screen>
    );
  }

  return (
    <AuthShell back compact title={tx('Reset password')} subtitle={tx('Enter your email and we will send you a link to choose a new password.')}>
      {formState.errors.root?.message ? <InlineError message={formState.errors.root.message} /> : null}
      <FormTextField
        control={control}
        name="email"
        label={tx('Email')}
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
        placeholder="you@example.com"
        onSubmitEditing={() => submit()}
        left={<Mail color={colors.faint} size={20} />}
      />
      <AppButton label={tx('Send reset link')} onPress={submit} loading={formState.isSubmitting} />
    </AuthShell>
  );
}
