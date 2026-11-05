import { router } from 'expo-router';
import { Mail, MailCheck } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';

import { AppButton } from '@/components/app-button';
import { FormTextField } from '@/components/form-field';
import { InlineError } from '@/components/states';
import { Text } from '@/components/text';
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
      <AuthShell back compact title={tx('Check your inbox')} subtitle={tx('If an account exists for this email, you will receive a reset link. Open it on this phone to choose a new password.')}>
        <View className="flex-row items-center gap-3 rounded-2xl bg-primary-soft p-4">
          <MailCheck color={colors.primary} size={22} />
          <Text className="flex-1 text-sm text-foreground">{tx('Did not get it? Check your spam folder, or try again in a few minutes.')}</Text>
        </View>
        <AppButton label={tx('Back to sign in')} onPress={() => router.replace('/sign-in')} />
      </AuthShell>
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
