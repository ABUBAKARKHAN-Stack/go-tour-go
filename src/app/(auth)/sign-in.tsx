import { Link, router } from 'expo-router';
import { ArrowRight, Compass, Eye, EyeOff, Lock, Mail } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';

import { AppButton } from '@/components/app-button';
import { FormTextField } from '@/components/form-field';
import { InlineError } from '@/components/states';
import { Text } from '@/components/text';
import { signIn, signInAsGuest } from '@/features/auth/api';
import { AuthShell, AuthSwitch } from '@/features/auth/auth-shell';
import { signInSchema } from '@/features/auth/schemas';
import { serverError, useZodForm } from '@/lib/forms';
import { colors } from '@/lib/theme';
import { tx } from '@/lib/i18n';

export default function SignIn() {
  const [show, setShow] = useState(false);
  const { control, handleSubmit, setError, setFocus, formState } = useZodForm(signInSchema, { defaultValues: { email: '', password: '' } });

  const [guestBusy, setGuestBusy] = useState(false);
  // Explore without an account; the root navigator opens the app once the guest session arrives.
  const continueAsGuest = async () => {
    setGuestBusy(true);
    try {
      await signInAsGuest();
    } catch (e) {
      setError('root', serverError(e));
    } finally {
      setGuestBusy(false);
    }
  };

  const submit = handleSubmit(async ({ email, password }) => {
    try {
      await signIn(email, password);
      // The root navigator switches to the app once the session arrives.
    } catch (e) {
      setError('root', serverError(e));
    }
  });

  return (
    <AuthShell
      title={tx('Ready to')}
      scriptWord={tx('Explore?')}
      subtitle={tx('Your next adventure starts here.')}
      note={[tx('Good trips,'), tx('better stories')]}
      footer={<Text className="text-center text-xs text-faint">{tx('By continuing you agree to our Terms and Privacy Policy.')}</Text>}
    >
      {formState.errors.root?.message ? <InlineError message={formState.errors.root.message} /> : null}

      <FormTextField
        hideLabel
        control={control}
        name="email"
        label={tx('Email')}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        textContentType="emailAddress"
        placeholder={tx('Email address')}
        returnKeyType="next"
        onSubmitEditing={() => setFocus('password')}
        left={<Mail color={colors.primary} size={20} />}
      />
      <FormTextField
        hideLabel
        control={control}
        name="password"
        label={tx('Password')}
        secureTextEntry={!show}
        autoComplete="current-password"
        textContentType="password"
        placeholder={tx('Password')}
        returnKeyType="go"
        onSubmitEditing={() => submit()}
        left={<Lock color={colors.primary} size={20} />}
        right={
          <Pressable accessibilityRole="button" accessibilityLabel={show ? tx('Hide password') : tx('Show password')} onPress={() => setShow((s) => !s)} hitSlop={10}>
            {show ? <EyeOff color={colors.faint} size={20} /> : <Eye color={colors.faint} size={20} />}
          </Pressable>
        }
      />

      <Link href="/forgot-password" asChild>
        <Pressable accessibilityRole="link" hitSlop={6} className="-my-1 min-h-9 justify-center self-end active:opacity-60">
          <Text className="text-sm font-semibold text-accent">{tx('Forgot password?')}</Text>
        </Pressable>
      </Link>

      <View className="pt-1">
        <AppButton label={tx('Sign in')} trailingIcon={ArrowRight} onPress={submit} loading={formState.isSubmitting} />
      </View>
      <AuthSwitch prompt={tx("Don't have an account?")} action={tx('Sign up')} onPress={() => router.push('/sign-up')} />
      <Pressable
        accessibilityRole="button"
        accessibilityHint={tx('Explore, save places and plan trips without an account')}
        accessibilityState={{ busy: guestBusy }}
        disabled={guestBusy}
        onPress={continueAsGuest}
        hitSlop={6}
        className="-mt-2 min-h-11 flex-row items-center justify-center gap-1.5 active:opacity-60"
      >
        {guestBusy ? <ActivityIndicator size="small" color={colors.accent} /> : <Compass color={colors.accent} size={16} />}
        <Text className="text-sm font-semibold text-accent">{tx('Continue as guest')}</Text>
      </Pressable>
    </AuthShell>
  );
}
