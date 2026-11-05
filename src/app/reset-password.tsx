import { router, useLocalSearchParams } from 'expo-router';
import { KeyRound } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Text } from '@/components/text';

import { AppButton } from '@/components/app-button';
import { TextField } from '@/components/form';
import { Screen } from '@/components/screen';
import { InlineError, LoadingState } from '@/components/states';
import { exchangeRecoveryCode, updatePassword, validatePassword } from '@/features/auth/api';
import { errorMessage } from '@/lib/errors';
import { tx } from '@/lib/i18n';

/** Opened from the password-reset email (gotourgodevelopment://reset-password?code=...). */
export default function ResetPassword() {
  const { code, error_description } = useLocalSearchParams<{ code?: string; error_description?: string }>();
  const [ready, setReady] = useState(!code);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(error_description ?? null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!code) return;
    exchangeRecoveryCode(code)
      .catch((e) => setError(errorMessage(e, 'This reset link is invalid or has expired.')))
      .finally(() => setReady(true));
  }, [code]);

  const submit = async () => {
    const invalid = validatePassword(password);
    if (invalid) {
      setError(invalid);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await updatePassword(password);
      setDone(true);
    } catch (e) {
      setError(errorMessage(e, 'Open the reset link from your email again.'));
    } finally {
      setLoading(false);
    }
  };

  if (!ready) {
    return (
      <Screen title={tx('Reset password')}>
        <LoadingState label={tx('Verifying link...')} />
      </Screen>
    );
  }

  return (
    <Screen keyboard title={tx('Choose a new password')} contentClassName="px-6 gap-4">
      {done ? (
        <>
          <Text className="text-base text-foreground">{tx('Your password has been updated.')}</Text>
          <AppButton label={tx('Continue')} variant="accent" onPress={() => router.replace('/')} />
        </>
      ) : (
        <>
          {error ? <InlineError message={error} /> : null}
          <TextField label={tx('New password')} value={password} onChangeText={setPassword} secureTextEntry autoComplete="new-password" placeholder={tx('At least 8 characters')} />
          <AppButton label={tx('Update password')} icon={KeyRound} onPress={submit} loading={loading} variant="accent" />
        </>
      )}
    </Screen>
  );
}
