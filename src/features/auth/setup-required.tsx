import { Settings } from 'lucide-react-native';
import { View } from 'react-native';
import { Text } from '@/components/text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { missingEnv } from '@/lib/env';
import { colors } from '@/lib/theme';
import { tx } from '@/lib/i18n';

/** Shown instead of crashing when the build was made without Supabase env vars. */
export function SetupRequired() {
  const insets = useSafeAreaInsets();
  return (
    <View className="flex-1 items-center justify-center gap-4 bg-background px-6" style={{ paddingTop: insets.top }}>
      <View className="h-16 w-16 items-center justify-center rounded-full bg-secondary">
        <Settings color={colors.primary} size={30} />
      </View>
      <Text className="text-center text-xl font-bold text-foreground">{tx('Backend not configured')}</Text>
      <Text className="text-center text-sm text-muted-foreground">
        {tx('This build is missing required environment variables. Add them to .env.local (local) or the EAS environment (cloud builds) and rebuild:')}
      </Text>
      {missingEnv.map((name) => (
        <Text key={name} className="rounded-lg bg-muted px-3 py-1 font-mono text-xs text-accent">
          {name}
        </Text>
      ))}
    </View>
  );
}
