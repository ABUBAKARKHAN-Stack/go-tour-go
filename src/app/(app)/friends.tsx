import { router } from 'expo-router';
import { Check, Search, UserPlus, Users, X } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { Text, TextInput } from '@/components/text';

import { AppButton, IconButton } from '@/components/app-button';
import { Avatar } from '@/components/avatar';
import { Segmented } from '@/components/form';
import { Screen } from '@/components/screen';
import { EmptyState, ErrorState, LoadingState } from '@/components/states';
import { displayName, useFriendships, useSocialActions, useUserSearch } from '@/features/social/api';
import { errorMessage } from '@/lib/errors';
import { colors } from '@/lib/theme';
import type { ProfileSummary } from '@/lib/types';
import { tx } from '@/lib/i18n';

type Tab = 'friends' | 'requests' | 'find';

function PersonRow({ profile, right, subtitle }: { profile: ProfileSummary | null; right?: React.ReactNode; subtitle?: string }) {
  if (!profile) return null;
  return (
    <Pressable
      onPress={() => router.push({ pathname: '/users/[id]', params: { id: profile.id } })}
      className="min-h-16 flex-row items-center gap-3 rounded-2xl bg-card p-3"
    >
      <Avatar profile={profile} size={44} />
      <View className="flex-1">
        <Text numberOfLines={1} className="text-base font-semibold text-foreground">
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

export default function FriendsScreen() {
  const [tab, setTab] = useState<Tab>('friends');
  const [term, setTerm] = useState('');
  const friendships = useFriendships();
  const search = useUserSearch(term);
  const actions = useSocialActions();

  const onError = (e: unknown) => Alert.alert(tx('Something went wrong'), errorMessage(e));

  return (
    <Screen back title={tx('Friends')} subtitle={tx('Only accepted friends can see your shared location')}>
      <Segmented<Tab>
        value={tab}
        onChange={setTab}
        options={[
          { value: 'friends', label: tx('Friends ({0})', { 0: friendships.friends.length }) },
          { value: 'requests', label: tx('Requests{0}', { 0: friendships.incoming.length ? ` (${friendships.incoming.length})` : '' }) },
          { value: 'find', label: tx('Find') },
        ]}
      />

      {friendships.isLoading ? (
        <LoadingState />
      ) : friendships.isError && !friendships.data ? (
        <ErrorState error={friendships.error} onRetry={friendships.refetch} />
      ) : tab === 'friends' ? (
        friendships.friends.length === 0 ? (
          <EmptyState icon={Users} title={tx('No friends yet')} message={tx('Find travellers by username and send a request.')} actionLabel={tx('Find people')} onAction={() => setTab('find')} />
        ) : (
          <View className="gap-2">
            {friendships.friends.map(({ profile }) => (
              <PersonRow key={profile.id} profile={profile} />
            ))}
          </View>
        )
      ) : tab === 'requests' ? (
        <View className="gap-4">
          <Text className="text-sm font-semibold text-foreground">{tx('Received')}</Text>
          {friendships.incoming.length === 0 ? (
            <Text className="text-sm text-muted-foreground">{tx('No pending requests.')}</Text>
          ) : (
            friendships.incoming.map((f) => (
              <PersonRow
                key={f.id}
                profile={f.requester}
                subtitle={tx('Wants to be friends')}
                right={
                  <View className="flex-row gap-2">
                    <IconButton icon={X} label={tx('Decline')} onPress={() => actions.respond.mutate({ id: f.id, accept: false }, { onError })} />
                    <IconButton icon={Check} label={tx('Accept')} active onPress={() => actions.respond.mutate({ id: f.id, accept: true }, { onError })} />
                  </View>
                }
              />
            ))
          )}
          <Text className="text-sm font-semibold text-foreground">{tx('Sent')}</Text>
          {friendships.outgoing.length === 0 ? (
            <Text className="text-sm text-muted-foreground">{tx('No sent requests.')}</Text>
          ) : (
            friendships.outgoing.map((f) => (
              <PersonRow
                key={f.id}
                profile={f.addressee}
                subtitle={tx('Request sent')}
                right={<AppButton label={tx('Cancel')} size="sm" variant="outline" onPress={() => actions.remove.mutate(f.id, { onError })} />}
              />
            ))
          )}
        </View>
      ) : (
        <View className="gap-3">
          <View className="min-h-12 flex-row items-center gap-2 rounded-2xl border border-border bg-input px-4">
            <Search color={colors.mutedForeground} size={18} />
            <TextInput
              autoFocus
              value={term}
              onChangeText={setTerm}
              autoCapitalize="none"
              placeholder={tx('Search by username or name')}
              placeholderTextColor={`${colors.mutedForeground}99`}
              className="flex-1 text-base text-foreground"
            />
          </View>
          {term.trim().length < 2 ? (
            <Text className="text-sm text-muted-foreground">{tx('Type at least 2 characters.')}</Text>
          ) : search.isLoading ? (
            <LoadingState variant="spinner" label={tx('Searching...')} />
          ) : search.isError ? (
            <ErrorState error={search.error} onRetry={search.refetch} />
          ) : (search.data ?? []).length === 0 ? (
            <EmptyState title={tx('No travellers found')} message={tx('Check the spelling or try their full name.')} />
          ) : (
            search.data!.map((p) => {
              const status = friendships.statusWith(p.id);
              return (
                <PersonRow
                  key={p.id}
                  profile={p}
                  subtitle={p.home_city ? `@${p.username} · ${p.home_city}` : `@${p.username}`}
                  right={
                    status === 'none' ? (
                      <IconButton icon={UserPlus} label={tx('Add {0}', { 0: p.username })} active onPress={() => actions.sendRequest.mutate(p.id, { onError })} />
                    ) : (
                      <Text className="text-xs text-muted-foreground">{status === 'friends' ? tx('Friends') : status === 'outgoing' ? tx('Requested') : tx('Wants to connect')}</Text>
                    )
                  }
                />
              );
            })
          )}
        </View>
      )}
    </Screen>
  );
}
