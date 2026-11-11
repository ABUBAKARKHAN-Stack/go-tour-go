import { router } from 'expo-router';
import { MessagesSquare, Users } from 'lucide-react-native';
import { FlatList, Pressable, RefreshControl, View } from 'react-native';
import { Text } from '@/components/text';

import { Avatar } from '@/components/avatar';
import { Screen } from '@/components/screen';
import { EmptyState, ErrorState, LoadingState } from '@/components/states';
import { useAuth } from '@/features/auth/auth-provider';
import { useUnreadConversations } from '@/features/inbox/api';
import { otherParticipant, useConversations } from '@/features/messaging/api';
import { timeAgo } from '@/features/safety/friend-locations';
import { displayName } from '@/features/social/api';
import { cardShadow, colors } from '@/lib/theme';
import { tx } from '@/lib/i18n';
import { AccountRequired } from '@/features/auth/guest-gate';

function ConversationsScreenContent() {
  const { userId } = useAuth();
  const q = useConversations();
  const unread = useUnreadConversations();

  return (
    <Screen back title={tx('Messages')} scroll={false}>
      {q.isLoading ? (
        <LoadingState label={tx('Loading conversations...')} />
      ) : q.isError && !q.data ? (
        <ErrorState error={q.error} onRetry={q.refetch} />
      ) : (
        <FlatList
          data={q.data ?? []}
          keyExtractor={(c) => c.id}
          contentContainerClassName="gap-2 px-4 pb-8"
          refreshControl={<RefreshControl refreshing={q.isRefetching} onRefresh={() => void q.refetch()} tintColor={colors.primary} />}
          ListEmptyComponent={
            <EmptyState
              icon={MessagesSquare}
              title={tx('No conversations yet')}
              message={tx('You can message accepted friends. Open a friend\'s profile to start chatting.')}
              actionLabel={tx('Find friends')}
              onAction={() => router.push('/friends')}
            />
          }
          renderItem={({ item }) => {
            const other = otherParticipant(item, userId);
            const isUnread = unread.has(item.id);
            return (
              <Pressable
                onPress={() => router.push({ pathname: '/messages/[id]', params: { id: item.id } })}
                className="min-h-16 flex-row items-center gap-3 rounded-[20px] bg-card p-3 active:bg-muted"
                style={cardShadow}
              >
                <Avatar profile={other} size={46} />
                <View className="flex-1">
                  <View className="flex-row items-center justify-between gap-2">
                    <Text numberOfLines={1} className={`flex-1 text-base text-foreground ${isUnread ? 'font-bold' : 'font-semibold'}`}>
                      {displayName(other)}
                    </Text>
                    {isUnread ? <View accessibilityLabel={tx('Unread')} className="h-2.5 w-2.5 rounded-full bg-accent" /> : null}
                    {item.last_message_at ? <Text className="text-xs text-muted-foreground">{timeAgo(item.last_message_at)}</Text> : null}
                  </View>
                  <Text numberOfLines={1} className={`text-sm ${isUnread ? 'font-semibold text-heading' : 'text-muted-foreground'}`}>
                    {item.last_message_preview ?? tx('Say hello 👋')}
                  </Text>
                </View>
              </Pressable>
            );
          }}
          ListFooterComponent={
            q.data?.length ? (
              <Pressable onPress={() => router.push('/friends')} className="min-h-12 flex-row items-center justify-center gap-2">
                <Users color={colors.primary} size={16} />
                <Text className="text-sm text-accent">{tx('Message another friend')}</Text>
              </Pressable>
            ) : undefined
          }
        />
      )}
    </Screen>
  );
}

/** Needs an account; guests see why instead (guest mode). */
export default function ConversationsScreen() {
  return (
    <AccountRequired reason={tx('send messages')}>
      <ConversationsScreenContent />
    </AccountRequired>
  );
}
