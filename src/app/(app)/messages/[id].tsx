import { router, useLocalSearchParams } from 'expo-router';
import { Send } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, FlatList, Pressable, View } from 'react-native';
import { Text, TextInput } from '@/components/text';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/avatar';
import { AppHeader } from '@/components/screen';
import { ErrorState, LoadingState } from '@/components/states';
import { useAuth } from '@/features/auth/auth-provider';
import { otherParticipant, useConversations, useMarkConversationRead, useMessages, useSendMessage } from '@/features/messaging/api';
import { displayName } from '@/features/social/api';
import { errorMessage } from '@/lib/errors';
import { colors } from '@/lib/theme';
import { tx } from '@/lib/i18n';

function formatTime(iso: string) {
  const d = new Date(iso);
  const sameDay = d.toDateString() === new Date().toDateString();
  return sameDay
    ? d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
    : d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) + ' ' + d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { userId } = useAuth();
  const conversations = useConversations();
  const messages = useMessages(id);
  const send = useSendMessage(id);
  useMarkConversationRead(id, messages.data?.[0]?.id);
  const [text, setText] = useState('');

  const convo = conversations.data?.find((c) => c.id === id);
  const other = convo ? otherParticipant(convo, userId) : null;

  const submit = () => {
    const body = text.trim();
    if (!body) return;
    setText('');
    send.mutate(body, {
      onError: (e) => {
        setText(body);
        Alert.alert(tx('Message not sent'), errorMessage(e));
      },
    });
  };

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <AppHeader
        back
        title={displayName(other)}
        right={
          other ? (
            <Pressable accessibilityLabel={tx('View profile')} onPress={() => router.push({ pathname: '/users/[id]', params: { id: other.id } })}>
              <Avatar profile={other} size={40} />
            </Pressable>
          ) : undefined
        }
      />
      <KeyboardAvoidingView behavior="padding" className="flex-1">
        {messages.isLoading ? (
          <LoadingState label={tx('Loading messages...')} />
        ) : messages.isError ? (
          <ErrorState error={messages.error} onRetry={messages.refetch} />
        ) : (
          <FlatList
            inverted
            data={messages.data ?? []}
            keyExtractor={(m) => m.id}
            contentContainerClassName="gap-2 px-4 py-3"
            ListEmptyComponent={
              <View style={{ transform: [{ scaleY: -1 }] }} className="items-center py-10">
                <Text className="text-sm text-muted-foreground">{tx('No messages yet. Say hello!')}</Text>
              </View>
            }
            renderItem={({ item }) => {
              const mine = item.sender_id === userId;
              const pending = item.id.startsWith('temp-');
              return (
                <View className={`max-w-[80%] rounded-3xl px-4 py-2 ${mine ? 'self-end rounded-br-md bg-primary' : 'self-start rounded-bl-md bg-card'}`}>
                  <Text className={`text-[15px] ${mine ? 'text-primary-foreground' : 'text-foreground'}`}>{item.body}</Text>
                  <Text className={`mt-0.5 text-[10px] ${mine ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                    {pending ? tx('Sending...') : formatTime(item.created_at)}
                  </Text>
                </View>
              );
            }}
          />
        )}
        <View className="flex-row items-end gap-2 border-t border-border px-3 pt-2" style={{ paddingBottom: insets.bottom + 8 }}>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder={tx('Message')}
            placeholderTextColor={`${colors.mutedForeground}99`}
            multiline
            maxLength={2000}
            className="max-h-32 min-h-12 flex-1 rounded-3xl bg-input px-4 py-3 text-base text-foreground"
            accessibilityLabel={tx('Message')}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={tx('Send')}
            onPress={submit}
            disabled={!text.trim()}
            className={`h-12 w-12 items-center justify-center rounded-full ${text.trim() ? 'bg-accent' : 'bg-muted'}`}
          >
            <Send color={text.trim() ? colors.accentForeground : colors.mutedForeground} size={20} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
