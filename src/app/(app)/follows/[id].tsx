import { useLocalSearchParams } from 'expo-router';
import { Users } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, FlatList, View } from 'react-native';

import { AppButton } from '@/components/app-button';
import { Segmented } from '@/components/form';
import { PersonRow } from '@/components/person-row';
import { Screen } from '@/components/screen';
import { EmptyState, ErrorState, LoadingState } from '@/components/states';
import { Text } from '@/components/text';
import { useAuth } from '@/features/auth/auth-provider';
import {
  displayName,
  useFollowCounts,
  useFollowList,
  useMyFollowingIds,
  useProfile,
  useSocialActions,
  type FollowListKind,
} from '@/features/social/api';
import { errorMessage } from '@/lib/errors';
import { tx } from '@/lib/i18n';

/** Followers and following of a traveller (client brief 6.1), with Follow / Unfollow on each row. */
export default function FollowsScreen() {
  const params = useLocalSearchParams<{ id: string; tab?: string }>();
  const { userId } = useAuth();
  const [tab, setTab] = useState<FollowListKind>(params.tab === 'following' ? 'following' : 'followers');
  const profile = useProfile(params.id);
  const counts = useFollowCounts(params.id);
  const list = useFollowList(params.id, tab);
  const mine = useMyFollowingIds();
  const actions = useSocialActions();
  const following = new Set(mine.data ?? []);
  const isMe = params.id === userId;

  const toggle = (target: string, follow: boolean) =>
    actions.toggleFollow.mutate({ target, follow }, { onError: (e) => Alert.alert(tx('Something went wrong'), errorMessage(e)) });

  return (
    <Screen back title={isMe ? tx('Your network') : displayName(profile.data)} subtitle={profile.data ? `@${profile.data.username}` : undefined} scroll={false}>
      <Segmented
        value={tab}
        onChange={setTab}
        options={[
          { value: 'followers', label: tx('Followers ({0})', { 0: counts.data?.followers ?? 0 }) },
          { value: 'following', label: tx('Following ({0})', { 0: counts.data?.following ?? 0 }) },
        ]}
      />
      {list.isLoading ? (
        <LoadingState variant="list" />
      ) : list.isError ? (
        <ErrorState error={list.error} onRetry={list.refetch} />
      ) : (
        <FlatList
          data={list.data?.people ?? []}
          keyExtractor={(p) => p.id}
          contentContainerClassName="gap-2 pb-8"
          ListEmptyComponent={
            <EmptyState
              icon={Users}
              title={tab === 'followers' ? tx('No followers yet') : tx('Not following anyone yet')}
              message={
                tab === 'followers'
                  ? tx('Travellers who follow this profile appear here.')
                  : tx('Follow travellers from their profile to see their posts and trips.')
              }
            />
          }
          ListFooterComponent={
            list.data?.hidden ? (
              <Text className="pt-2 text-center text-xs text-faint">{tx('{0} private profiles are not shown.', { 0: list.data.hidden })}</Text>
            ) : undefined
          }
          renderItem={({ item }) => {
            if (!userId || item.id === userId) return <PersonRow profile={item} />;
            const isFollowing = following.has(item.id);
            return (
              <PersonRow
                profile={item}
                right={
                  <View>
                    <AppButton
                      label={isFollowing ? tx('Following') : tab === 'followers' && isMe ? tx('Follow back') : tx('Follow')}
                      size="sm"
                      variant={isFollowing ? 'secondary' : 'outline'}
                      onPress={() => toggle(item.id, !isFollowing)}
                    />
                  </View>
                }
              />
            );
          }}
        />
      )}
    </Screen>
  );
}
