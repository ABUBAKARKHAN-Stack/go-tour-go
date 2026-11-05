import { router } from 'expo-router';
import { AtSign, Lock, Mail, MailCheck, UserRound } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';

import { AppButton } from '@/components/app-button';
import { TextField } from '@/components/form';
import { Screen } from '@/components/screen';
import { EmptyState, InlineError } from '@/components/states';
import { signUp, validateEmail, validatePassword, validateUsername } from '@/features/auth/api';
import { AuthShell } from '@/features/auth/auth-shell';
import { colors } from '@/lib/theme';
import { errorMessage } from '@/lib/errors';
import { tx } from '@/lib/i18n';

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
      <Screen back title={tx('Check your email')}>
        <EmptyState
          icon={MailCheck}
          title={tx('Confirm your email')}
          message={tx('We sent a confirmation link to {0}. Open it on this phone, then sign in.', { 0: email.trim() })}
          actionLabel={tx('Back to sign in')}
          onAction={() => router.replace('/sign-in')}
        />
      </Screen>
    );
  }

  return (
    <AuthShell back compact title={tx('Create your account')} subtitle={tx('Save places, plan journeys and travel with friends.')}>
      {error ? <InlineError message={error} /> : null}
      <TextField label={tx('Full name')} value={fullName} onChangeText={setFullName} autoComplete="name" placeholder={tx('Ayesha Khan')} error={errors.fullName} left={<UserRound color={colors.faint} size={20} />} />
      <TextField
        label={tx('Username')}
        value={username}
        onChangeText={(t) => setUsername(t.toLowerCase())}
        autoCapitalize="none"
        autoComplete="username"
        placeholder="ayesha_travels"
        error={errors.username}
        hint={tx('Friends find you by this name.')}
        left={<AtSign color={colors.faint} size={20} />}
      />
      <TextField
        label={tx('Email')}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        placeholder="you@example.com"
        error={errors.email}
        left={<Mail color={colors.faint} size={20} />}
      />
      <TextField
        label={tx('Password')}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="new-password"
        placeholder={tx('At least 8 characters')}
        error={errors.password}
        left={<Lock color={colors.faint} size={20} />}
      />
      <View className="pt-2">
        <AppButton label={tx('Create account')} onPress={submit} loading={loading} />
      </View>
    </AuthShell>
  );
}
