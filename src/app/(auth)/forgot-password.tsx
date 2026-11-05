import { router } from 'expo-router';
import { Mail, MailCheck } from 'lucide-react-native';
import { useState } from 'react';

import { AppButton } from '@/components/app-button';
import { TextField } from '@/components/form';
import { Screen } from '@/components/screen';
import { EmptyState, InlineError } from '@/components/states';
import { sendPasswordReset, validateEmail } from '@/features/auth/api';
import { AuthShell } from '@/features/auth/auth-shell';
import { colors } from '@/lib/theme';
import { errorMessage } from '@/lib/errors';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!validateEmail(email)) {
      setError('Enter a valid email.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await sendPasswordReset(email);
      setSent(true);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <Screen back title="Reset password">
        <EmptyState
          icon={MailCheck}
          title="Check your inbox"
          message="If an account exists for this email, you will receive a reset link. Open it on this phone to choose a new password."
          actionLabel="Back to sign in"
          onAction={() => router.replace('/sign-in')}
        />
      </Screen>
    );
  }

  return (
    <AuthShell back compact title="Reset password" subtitle="Enter your email and we will send you a link to choose a new password.">
      {error ? <InlineError message={error} /> : null}
      <TextField
        label="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
        placeholder="you@example.com"
        onSubmitEditing={submit}
        left={<Mail color={colors.faint} size={20} />}
      />
      <AppButton label="Send reset link" onPress={submit} loading={loading} />
    </AuthShell>
  );
}
