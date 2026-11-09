import { Link, router } from 'expo-router';
import { ArrowRight, Eye, EyeOff, Lock, Mail } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable } from 'react-native';
import { Text } from '@/components/text';

import { AppButton } from '@/components/app-button';
import { FormTextField } from '@/components/form-field';
import { InlineError } from '@/components/states';
import { signIn } from '@/features/auth/api';
import { AuthShell, OrDivider } from '@/features/auth/auth-shell';
import { signInSchema } from '@/features/auth/schemas';
import { serverError, useZodForm } from '@/lib/forms';
import { colors } from '@/lib/theme';
import { tx } from '@/lib/i18n';

export default function SignIn() {
  const [show, setShow] = useState(false);
  const { control, handleSubmit, setError, setFocus, formState } = useZodForm(signInSchema, { defaultValues: { email: '', password: '' } });

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
        <Pressable accessibilityRole="link" className="-my-1 min-h-9 justify-center self-end">
          <Text className="text-sm font-semibold text-primary">{tx('Forgot password?')}</Text>
        </Pressable>
      </Link>

      <AppButton label={tx('Sign in')} trailingIcon={ArrowRight} onPress={submit} loading={formState.isSubmitting} />
      <OrDivider />
      <AppButton label={tx('Create an account')} variant="outline" onPress={() => router.push('/sign-up')} />
    </AuthShell>
  );
}
