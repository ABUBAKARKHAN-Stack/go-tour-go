import { Image } from 'expo-image';
import { View } from 'react-native';
import { Text } from '@/components/text';

import type { ProfileSummary } from '@/lib/types';

export function Avatar({ profile, size = 40 }: { profile: Pick<ProfileSummary, 'avatar_url' | 'full_name' | 'username'> | null | undefined; size?: number }) {
  const initials = (profile?.full_name || profile?.username || '?')
    .split(/\s+/)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  return (
    <View className="items-center justify-center overflow-hidden rounded-full bg-primary-soft" style={{ width: size, height: size }}>
      {profile?.avatar_url ? (
        <Image source={{ uri: profile.avatar_url }} style={{ width: size, height: size }} contentFit="cover" cachePolicy="memory-disk" />
      ) : (
        <Text className="font-bold text-primary" style={{ fontSize: size * 0.38 }}>
          {initials}
        </Text>
      )}
    </View>
  );
}
