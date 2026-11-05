import { router, useLocalSearchParams } from 'expo-router';
import { KeyRound, Lock } from 'lucide-react-native';
import { useEffect, useState } from 'react';

import { AppButton } from '@/components/app-button';
import { FormTextField } from '@/components/form-field';
import { InlineError, LoadingState } from '@/components/states';
import { exchangeRecoveryCode, updatePassword } from '@/features/auth/api';
import { AuthShell } from '@/features/auth/auth-shell';
import { resetPasswordSchema } from '@/features/auth/schemas';
import { errorMessage } from '@/lib/errors';
import { serverError, useZodForm } from '@/lib/forms';
import { tx } from '@/lib/i18n';
import { colors } from '@/lib/theme';

/** Opened from the password-reset email (gotourgodevelopment://reset-password?code=...). */
export default function ResetPassword() {
  const { code, error_description } = useLocalSearchParams<{ code?: string; error_description?: string }>();
  const [ready, setReady] = useState(!code);
  const [linkError, setLinkError] = useState<string | null>(error_description ?? null);
  const [done, setDone] = useState(false);
  const { control, handleSubmit, setError, formState } = useZodForm(resetPasswordSchema, { defaultValues: { password: '' } });

  useEffect(() => {
    if (!code) return;
    exchangeRecoveryCode(code)
      .catch((e) => setLinkError(errorMessage(e, tx('This reset link is invalid or has expired.'))))
      .finally(() => setReady(true));
  }, [code]);

  const submit = handleSubmit(async ({ password }) => {
    try {
      await updatePassword(password);
      setDone(true);
    } catch (e) {
      setError('root', serverError(e, tx('Open the reset link from your email again.')));
    }
  });
  const error = formState.errors.root?.message ?? linkError;

  if (!ready) {
    return (
      <AuthShell compact title={tx('Reset password')} subtitle={tx('Verifying link...')}>
        <LoadingState label={tx('Verifying link...')} />
      </AuthShell>
    );
  }

  return (
    <AuthShell
      compact
      title={done ? tx('Password updated') : tx('Choose a new password')}
      subtitle={done ? tx('Your password has been updated.') : tx('Use at least 8 characters with letters and numbers.')}
    >
      {done ? (
        <AppButton label={tx('Continue')} onPress={() => router.replace('/')} />
      ) : (
        <>
          {error ? <InlineError message={error} /> : null}
          <FormTextField
            control={control}
            name="password"
            label={tx('New password')}
            secureTextEntry
            autoComplete="new-password"
            placeholder={tx('At least 8 characters')}
            returnKeyType="go"
            onSubmitEditing={() => submit()}
            left={<Lock color={colors.faint} size={20} />}
          />
          <AppButton label={tx('Update password')} icon={KeyRound} onPress={submit} loading={formState.isSubmitting} />
        </>
      )}
    </AuthShell>
  );
}
