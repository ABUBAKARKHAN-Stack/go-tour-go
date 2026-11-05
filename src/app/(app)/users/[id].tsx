import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { Check, Lock, MapPin, MessageCircle, UserMinus, UserPlus } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Alert, View } from 'react-native';
import { Text } from '@/components/text';

import { AppButton } from '@/components/app-button';
import { Avatar } from '@/components/avatar';
import { Card } from '@/components/form';
import { Screen } from '@/components/screen';
import { EmptyState, ErrorState, LoadingState } from '@/components/states';
import { useAuth } from '@/features/auth/auth-provider';
import { useFeed } from '@/features/community/api';
import { PostCard } from '@/features/community/post-card';
import { startConversation } from '@/features/messaging/api';
import { displayName, useFollowCounts, useFriendships, useProfile, useSocialActions } from '@/features/social/api';
import { errorMessage } from '@/lib/errors';
import { colors } from '@/lib/theme';
import { tx } from '@/lib/i18n';

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { userId } = useAuth();
  const profile = useProfile(id);
  const follows = useFollowCounts(id);
  const friendships = useFriendships();
  const actions = useSocialActions();
  const feed = useFeed({ authorId: id });
  const posts = useMemo(() => feed.data?.pages.flat() ?? [], [feed.data]);
  const [opening, setOpening] = useState(false);

  if (id === userId) return <Redirect href="/profile" />;

  const status = friendships.statusWith(id);
  const friendship = friendships.friendshipWith(id);
  const onError = (e: unknown) => Alert.alert(tx('Something went wrong'), errorMessage(e));

  const message = async () => {
    setOpening(true);
    try {
      const conversationId = await startConversation(id);
      router.push({ pathname: '/messages/[id]', params: { id: conversationId } });
    } catch (e) {
      onError(e);
    } finally {
      setOpening(false);
    }
  };

  return (
    <Screen back title={tx('Traveler')}>
      {profile.isLoading ? (
        <LoadingState variant="profile" />
      ) : profile.isError ? (
        <ErrorState error={profile.error} onRetry={profile.refetch} />
      ) : !profile.data ? (
        <EmptyState icon={Lock} title={tx('Profile is private')} message={tx('This traveler only shares their profile with friends.')} />
      ) : (
        <>
          <View className="items-center gap-2">
            <Avatar profile={profile.data} size={92} />
            <Text className="text-2xl font-bold text-foreground">{displayName(profile.data)}</Text>
            <Text className="text-sm text-muted-foreground">@{profile.data.username}</Text>
            {profile.data.home_city ? (
              <View className="flex-row items-center gap-1">
                <MapPin color={colors.primary} size={14} />
                <Text className="text-sm text-muted-foreground">{profile.data.home_city}</Text>
              </View>
            ) : null}
            {profile.data.bio ? <Text className="text-center text-sm text-foreground">{profile.data.bio}</Text> : null}
            <View className="flex-row gap-6 pt-2">
              <Text className="text-sm text-muted-foreground">
                <Text className="font-bold text-foreground">{follows.data?.followers ?? 0}</Text>{' '}{tx('followers')}
              </Text>
              <Text className="text-sm text-muted-foreground">
                <Text className="font-bold text-foreground">{follows.data?.following ?? 0}</Text>{' '}{tx('following')}
              </Text>
            </View>
          </View>

          <View className="flex-row gap-2">
            {status === 'friends' ? (
              <AppButton label={tx('Message')} icon={MessageCircle} variant="accent" loading={opening} onPress={message} className="flex-1" />
            ) : status === 'incoming' && friendship ? (
              <AppButton label={tx('Accept request')} icon={Check} variant="accent" onPress={() => actions.respond.mutate({ id: friendship.id, accept: true }, { onError })} className="flex-1" />
            ) : status === 'outgoing' ? (
              <AppButton label={tx('Request sent')} variant="secondary" disabled className="flex-1" />
            ) : (
              <AppButton
                label={tx('Add friend')}
                icon={UserPlus}
                variant="accent"
                disabled={!profile.data.allow_friend_requests}
                loading={actions.sendRequest.isPending}
                onPress={() => actions.sendRequest.mutate(id, { onError })}
                className="flex-1"
              />
            )}
            <AppButton
              label={follows.data?.isFollowing ? tx('Following') : tx('Follow')}
              variant={follows.data?.isFollowing ? 'secondary' : 'outline'}
              onPress={() => actions.toggleFollow.mutate({ target: id, follow: !follows.data?.isFollowing }, { onError })}
              className="flex-1"
            />
          </View>
          {status === 'friends' && friendship ? (
            <AppButton
              label={tx('Remove friend')}
              icon={UserMinus}
              variant="ghost"
              size="sm"
              onPress={() =>
                Alert.alert(tx('Remove friend?'), tx('They will no longer see your shared location or message you.'), [
                  { text: tx('Cancel'), style: 'cancel' },
                  { text: tx('Remove'), style: 'destructive', onPress: () => actions.remove.mutate(friendship.id, { onError }) },
                ])
              }
            />
          ) : null}
          {!profile.data.allow_friend_requests && status === 'none' ? (
            <Card>
              <Text className="text-sm text-muted-foreground">{tx('This traveler is not accepting friend requests.')}</Text>
            </Card>
          ) : null}

          <Text className="text-lg font-bold text-foreground">{tx('Posts')}</Text>
          {feed.isLoading ? (
            <LoadingState variant="feed" />
          ) : posts.length === 0 ? (
            <Text className="text-sm text-muted-foreground">{tx('No posts yet.')}</Text>
          ) : (
            posts.map((p) => <PostCard key={p.id} post={p} userId={userId} />)
          )}
        </>
      )}
    </Screen>
  );
}
