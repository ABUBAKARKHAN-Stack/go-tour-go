import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { Avatar } from '@/components/avatar';
import { Text } from '@/components/text';
import { displayName } from '@/features/social/api';
import type { ProfileSummary } from '@/lib/types';
import { cardShadow } from '@/lib/theme';

/** A traveller in a list (friends, followers, search): opens their profile. */
export function PersonRow({ profile, right, subtitle }: { profile: ProfileSummary | null; right?: ReactNode; subtitle?: string }) {
  if (!profile) return null;
  return (
    <Pressable
      onPress={() => router.push({ pathname: '/users/[id]', params: { id: profile.id } })}
      className="min-h-16 flex-row items-center gap-3 rounded-[20px] bg-card p-3 active:bg-muted"
      style={cardShadow}
    >
      <Avatar profile={profile} size={44} />
      <View className="flex-1">
        <Text numberOfLines={2} className="text-base font-semibold text-heading">
          {displayName(profile)}
        </Text>
        <Text numberOfLines={1} className="text-xs text-muted-foreground">
          {subtitle ?? `@${profile.username}`}
        </Text>
      </View>
      {right}
    </Pressable>
  );
}
