import { router } from 'expo-router';
import { MailCheck, UserPlus } from 'lucide-react-native';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { AppButton } from '@/components/app-button';
import { TextField } from '@/components/form';
import { Screen } from '@/components/screen';
import { EmptyState, InlineError } from '@/components/states';
import { signUp, validateEmail, validatePassword, validateUsername } from '@/features/auth/api';
import { errorMessage } from '@/lib/errors';

export default function SignUp() {
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [touched, setTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmSent, setConfirmSent] = useState(false);

  const errors = {
    fullName: touched && fullName.trim().length < 2 ? 'Enter your name.' : null,
    username: touched ? validateUsername(username) : null,
    email: touched && !validateEmail(email) ? 'Enter a valid email.' : null,
    password: touched ? validatePassword(password) : null,
  };
  const valid =
    fullName.trim().length >= 2 && !validateUsername(username) && validateEmail(email) && !validatePassword(password);

  const submit = async () => {
    setTouched(true);
    if (!valid) return;
    setLoading(true);
    setError(null);
    try {
      const { needsConfirmation } = await signUp({ email, password, fullName, username });
      if (needsConfirmation) setConfirmSent(true);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  if (confirmSent) {
    return (
      <Screen back title="Check your email">
        <EmptyState
          icon={MailCheck}
          title="Confirm your email"
          message={`We sent a confirmation link to ${email.trim()}. Open it on this phone, then sign in.`}
          actionLabel="Back to sign in"
          onAction={() => router.replace('/sign-in')}
        />
      </Screen>
    );
  }

  return (
    <Screen keyboard back title="Create account" contentClassName="px-6 gap-4">
      <Text className="text-base text-muted-foreground">Join GoTourGo to save places, plan trips and travel with friends.</Text>
      {error ? <InlineError message={error} /> : null}
      <TextField label="Full name" value={fullName} onChangeText={setFullName} autoComplete="name" placeholder="Ayesha Khan" error={errors.fullName} />
      <TextField
        label="Username"
        value={username}
        onChangeText={(t) => setUsername(t.toLowerCase())}
        autoCapitalize="none"
        autoComplete="username"
        placeholder="ayesha_travels"
        error={errors.username}
        hint="Friends find you by this name."
      />
      <TextField
        label="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        placeholder="you@example.com"
        error={errors.email}
      />
      <TextField
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="new-password"
        placeholder="At least 8 characters"
        error={errors.password}
      />
      <View className="pt-2">
        <AppButton label="Create account" icon={UserPlus} onPress={submit} loading={loading} variant="accent" />
      </View>
    </Screen>
  );
}
