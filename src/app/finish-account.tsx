import { router, useLocalSearchParams } from 'expo-router';
import { KeyRound, Lock } from 'lucide-react-native';
import { useEffect, useState } from 'react';

import { AppButton } from '@/components/app-button';
import { FormTextField } from '@/components/form-field';
import { InlineError, LoadingState } from '@/components/states';
import { confirmEmailLink, finishGuestUpgrade } from '@/features/auth/api';
import { AuthShell } from '@/features/auth/auth-shell';
import { useAuth } from '@/features/auth/auth-provider';
import { resetPasswordSchema } from '@/features/auth/schemas';
import { errorMessage } from '@/lib/errors';
import { serverError, useZodForm } from '@/lib/forms';
import { tx } from '@/lib/i18n';
import { colors } from '@/lib/theme';

/**
 * Opened from the email a guest gets when creating their account
 * (gotourgo://finish-account?code=...): confirms the email, then the guest
 * chooses a password and the account is complete (same user, nothing lost).
 */
export default function FinishAccount() {
  const params = useLocalSearchParams<{ code?: string; token_hash?: string; error_description?: string }>();
  const { refreshProfile } = useAuth();
  const hasLink = Boolean(params.code || params.token_hash);
  const [ready, setReady] = useState(!hasLink);
  const [linkError, setLinkError] = useState<string | null>(params.error_description ?? null);
  const [done, setDone] = useState(false);
  const { control, handleSubmit, setError, formState } = useZodForm(resetPasswordSchema, { defaultValues: { password: '' } });

  useEffect(() => {
    if (!hasLink) return;
    confirmEmailLink({ code: params.code, tokenHash: params.token_hash })
      .catch((e) => setLinkError(errorMessage(e, tx('This link is invalid or has expired. Create your account again from the app.'))))
      .finally(() => setReady(true));
  }, [hasLink, params.code, params.token_hash]);

  const submit = handleSubmit(async ({ password }) => {
    try {
      await finishGuestUpgrade(password);
      await refreshProfile();
      setDone(true);
    } catch (e) {
      setError('root', serverError(e, tx('Open the link from your email again.')));
    }
  });
  const error = formState.errors.root?.message ?? linkError;

  if (!ready) {
    return (
      <AuthShell title={tx('Create your account')} subtitle={tx('Verifying link...')}>
        <LoadingState variant="spinner" label={tx('Verifying link...')} />
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title={done ? tx('Welcome to GoTourGo') : tx('Choose a password')}
      subtitle={done ? tx('Your account is ready. Your saved places and trips are still here.') : tx('Use at least 8 characters with letters and numbers.')}
    >
      {done ? (
        <AppButton label={tx('Continue')} onPress={() => router.replace('/')} />
      ) : (
        <>
          {error ? <InlineError message={error} /> : null}
          <FormTextField
            hideLabel
            control={control}
            name="password"
            label={tx('Password')}
            secureTextEntry
            autoComplete="new-password"
            placeholder={tx('Password (at least 8 characters)')}
            returnKeyType="go"
            onSubmitEditing={() => submit()}
            left={<Lock color={colors.primary} size={20} />}
          />
          <AppButton label={tx('Finish creating account')} icon={KeyRound} onPress={submit} loading={formState.isSubmitting} />
        </>
      )}
    </AuthShell>
  );
}
