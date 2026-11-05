import { router } from 'expo-router';
import { MessagesSquare, Users } from 'lucide-react-native';
import { FlatList, Pressable, RefreshControl, Text, View } from 'react-native';

import { Avatar } from '@/components/avatar';
import { Screen } from '@/components/screen';
import { EmptyState, ErrorState, LoadingState } from '@/components/states';
import { useAuth } from '@/features/auth/auth-provider';
import { otherParticipant, useConversations } from '@/features/messaging/api';
import { timeAgo } from '@/features/safety/friend-locations';
import { displayName } from '@/features/social/api';
import { colors } from '@/lib/theme';

export default function ConversationsScreen() {
  const { userId } = useAuth();
  const q = useConversations();

  return (
    <Screen back title="Messages" scroll={false}>
      {q.isLoading ? (
        <LoadingState label="Loading conversations..." />
      ) : q.isError && !q.data ? (
        <ErrorState error={q.error} onRetry={q.refetch} />
      ) : (
        <FlatList
          data={q.data ?? []}
          keyExtractor={(c) => c.id}
          contentContainerClassName="gap-2 px-4 pb-8"
          refreshControl={<RefreshControl refreshing={q.isRefetching} onRefresh={() => void q.refetch()} tintColor={colors.accent} />}
          ListEmptyComponent={
            <EmptyState
              icon={MessagesSquare}
              title="No conversations yet"
              message="You can message accepted friends. Open a friend's profile to start chatting."
              actionLabel="Find friends"
              onAction={() => router.push('/friends')}
            />
          }
          renderItem={({ item }) => {
            const other = otherParticipant(item, userId);
            return (
              <Pressable
                onPress={() => router.push({ pathname: '/messages/[id]', params: { id: item.id } })}
                className="min-h-16 flex-row items-center gap-3 rounded-2xl bg-card p-3"
              >
                <Avatar profile={other} size={46} />
                <View className="flex-1">
                  <View className="flex-row items-center justify-between gap-2">
                    <Text numberOfLines={1} className="flex-1 text-base font-semibold text-foreground">
                      {displayName(other)}
                    </Text>
                    {item.last_message_at ? <Text className="text-xs text-muted-foreground">{timeAgo(item.last_message_at)}</Text> : null}
                  </View>
                  <Text numberOfLines={1} className="text-sm text-muted-foreground">
                    {item.last_message_preview ?? 'Say hello 👋'}
                  </Text>
                </View>
              </Pressable>
            );
          }}
          ListFooterComponent={
            q.data?.length ? (
              <Pressable onPress={() => router.push('/friends')} className="min-h-12 flex-row items-center justify-center gap-2">
                <Users color={colors.accent} size={16} />
                <Text className="text-sm text-accent">Message another friend</Text>
              </Pressable>
            ) : undefined
          }
        />
      )}
    </Screen>
  );
}
