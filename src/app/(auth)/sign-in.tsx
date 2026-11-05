import { Link } from 'expo-router';
import { Eye, EyeOff, LogIn } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { AppButton } from '@/components/app-button';
import { TextField } from '@/components/form';
import { Screen } from '@/components/screen';
import { InlineError } from '@/components/states';
import { signIn, validateEmail } from '@/features/auth/api';
import { errorMessage } from '@/lib/errors';
import { colors } from '@/lib/theme';

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
    <Screen keyboard headerless contentClassName="flex-grow justify-center px-6 gap-5">
      <View className="gap-2 pt-10">
        <Text className="text-sm font-bold uppercase tracking-widest text-accent">GoTourGo</Text>
        <Text className="text-3xl font-extrabold text-foreground">Welcome back</Text>
        <Text className="text-base text-muted-foreground">Sign in to continue your journey.</Text>
      </View>

      {error ? <InlineError message={error} /> : null}

      <TextField
        label="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        textContentType="emailAddress"
        placeholder="you@example.com"
        error={emailError}
        returnKeyType="next"
      />
      <TextField
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry={!show}
        autoComplete="current-password"
        textContentType="password"
        placeholder="Your password"
        error={passwordError}
        returnKeyType="go"
        onSubmitEditing={submit}
        right={
          <Pressable accessibilityRole="button" accessibilityLabel={show ? 'Hide password' : 'Show password'} onPress={() => setShow((s) => !s)} hitSlop={10}>
            {show ? <EyeOff color={colors.mutedForeground} size={20} /> : <Eye color={colors.mutedForeground} size={20} />}
          </Pressable>
        }
      />

      <Link href="/forgot-password" asChild>
        <Pressable accessibilityRole="link" className="min-h-10 justify-center self-end">
          <Text className="text-sm font-semibold text-accent">Forgot password?</Text>
        </Pressable>
      </Link>

      <AppButton label="Sign in" icon={LogIn} onPress={submit} loading={loading} variant="accent" />

      <View className="flex-row items-center justify-center gap-1 pb-6">
        <Text className="text-sm text-muted-foreground">New to GoTourGo?</Text>
        <Link href="/sign-up" asChild>
          <Pressable accessibilityRole="link" className="min-h-10 justify-center">
            <Text className="text-sm font-semibold text-accent">Create an account</Text>
          </Pressable>
        </Link>
      </View>
    </Screen>
  );
}
