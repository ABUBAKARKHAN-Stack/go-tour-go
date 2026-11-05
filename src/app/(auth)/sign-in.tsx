import { Link, router } from 'expo-router';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable } from 'react-native';
import { Text } from '@/components/text';

import { AppButton } from '@/components/app-button';
import { TextField } from '@/components/form';
import { InlineError } from '@/components/states';
import { signIn, validateEmail } from '@/features/auth/api';
import { AuthShell, OrDivider } from '@/features/auth/auth-shell';
import { errorMessage } from '@/lib/errors';
import { colors } from '@/lib/theme';
import { tx } from '@/lib/i18n';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  const emailError = touched && !validateEmail(email) ? 'Enter a valid email.' : null;
  const passwordError = touched && password.length === 0 ? 'Enter your password.' : null;

  const submit = async () => {
    setTouched(true);
    if (!validateEmail(email) || !password) return;
    setLoading(true);
    setError(null);
    try {
      await signIn(email, password);
      // The root navigator switches to the app once the session arrives.
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title={tx('Welcome back')}
      subtitle={tx('Sign in to pick up where your journey left off.')}
      footer={<Text className="text-center text-xs text-faint">{tx('By continuing you agree to our Terms and Privacy Policy.')}</Text>}
    >
      {error ? <InlineError message={error} /> : null}

      <TextField
        label={tx('Email')}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        textContentType="emailAddress"
        placeholder="you@example.com"
        error={emailError}
        returnKeyType="next"
        left={<Mail color={colors.faint} size={20} />}
      />
      <TextField
        label={tx('Password')}
        value={password}
        onChangeText={setPassword}
        secureTextEntry={!show}
        autoComplete="current-password"
        textContentType="password"
        placeholder={tx('Your password')}
        error={passwordError}
        returnKeyType="go"
        onSubmitEditing={submit}
        left={<Lock color={colors.faint} size={20} />}
        right={
          <Pressable accessibilityRole="button" accessibilityLabel={show ? tx('Hide password') : tx('Show password')} onPress={() => setShow((s) => !s)} hitSlop={10}>
            {show ? <EyeOff color={colors.faint} size={20} /> : <Eye color={colors.faint} size={20} />}
          </Pressable>
        }
      />

      <Link href="/forgot-password" asChild>
        <Pressable accessibilityRole="link" className="-mt-1 min-h-10 justify-center self-end">
          <Text className="text-sm font-semibold text-primary">{tx('Forgot password?')}</Text>
        </Pressable>
      </Link>

      <AppButton label={tx('Sign in')} onPress={submit} loading={loading} />
      <OrDivider />
      <AppButton label={tx('Create an account')} variant="secondary" onPress={() => router.push('/sign-up')} />
    </AuthShell>
  );
}
