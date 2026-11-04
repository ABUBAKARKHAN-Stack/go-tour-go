import { router } from 'expo-router';
import { Bell, CheckCheck, MapPin, MessageCircle, ShieldAlert, UserPlus } from 'lucide-react-native';
import { useEffect } from 'react';
import { FlatList, Linking, Pressable, RefreshControl, Text, View } from 'react-native';

import { IconButton } from '@/components/app-button';
import { Screen } from '@/components/screen';
import { EmptyState, ErrorState, LoadingState } from '@/components/states';
import { useInbox, useMarkAllRead, useUnreadCount } from '@/features/inbox/api';
import { timeAgo } from '@/features/safety/friend-locations';
import { colors } from '@/lib/theme';
import type { AppNotification } from '@/lib/types';

const ICONS = { friend_request: UserPlus, friend_accepted: UserPlus, message: MessageCircle, sos: ShieldAlert } as const;

function open(n: AppNotification) {
  const d = n.data ?? {};
  if (n.type === 'message' && d.conversation_id) router.push({ pathname: '/messages/[id]', params: { id: String(d.conversation_id) } });
  else if (n.type === 'friend_request' || n.type === 'friend_accepted') router.push('/friends');
  else if (n.type === 'sos' && d.latitude != null) Linking.openURL(`https://maps.google.com/?q=${d.latitude},${d.longitude}`);
}

export default function NotificationsScreen() {
  const inbox = useInbox();
  const unread = useUnreadCount();
  const markAll = useMarkAllRead();

  // Mark as read shortly after opening the screen.
  useEffect(() => {
    if (unread > 0) {
      const t = setTimeout(() => markAll.mutate(), 1500);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unread > 0]);

  return (
    <Screen back title="Notifications" scroll={false} right={<IconButton icon={CheckCheck} label="Mark all read" onPress={() => markAll.mutate()} />}>
      {inbox.isLoading ? (
        <LoadingState />
      ) : inbox.isError && !inbox.data ? (
        <ErrorState error={inbox.error} onRetry={inbox.refetch} />
      ) : (
        <FlatList
          data={inbox.data ?? []}
          keyExtractor={(n) => n.id}
          contentContainerClassName="gap-2 px-4 pb-8"
          refreshControl={<RefreshControl refreshing={inbox.isRefetching} onRefresh={() => void inbox.refetch()} tintColor={colors.accent} />}
          ListEmptyComponent={<EmptyState icon={Bell} title="You're all caught up" message="Friend requests, messages and safety alerts appear here." />}
          renderItem={({ item }) => {
            const Icon = ICONS[item.type as keyof typeof ICONS] ?? Bell;
            const sos = item.type === 'sos';
            return (
              <Pressable onPress={() => open(item)} className={`flex-row gap-3 rounded-2xl p-3 ${item.read_at ? 'bg-card' : 'bg-secondary'}`}>
                <View className={`h-10 w-10 items-center justify-center rounded-full ${sos ? 'bg-destructive/20' : 'bg-muted'}`}>
                  <Icon color={sos ? colors.destructive : colors.accent} size={18} />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-foreground">{item.title}</Text>
                  <Text className="text-sm text-muted-foreground">{item.body}</Text>
                  {sos && item.data?.latitude != null ? (
                    <View className="flex-row items-center gap-1 pt-1">
                      <MapPin color={colors.accent} size={12} />
                      <Text className="text-xs text-accent">Open their location</Text>
                    </View>
                  ) : null}
                  <Text className="pt-1 text-[11px] text-muted-foreground">{timeAgo(item.created_at)}</Text>
                </View>
                {!item.read_at ? <View className="h-2.5 w-2.5 rounded-full bg-accent" /> : null}
              </Pressable>
            );
          }}
        />
      )}
    </Screen>
  );
}
