import { useLocalSearchParams } from 'expo-router';
import { Send, Trash2 } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, FlatList, Pressable, View } from 'react-native';
import { Text, TextInput } from '@/components/text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/avatar';
import { Screen } from '@/components/screen';
import { EmptyState, ErrorState, LoadingState } from '@/components/states';
import { useAuth } from '@/features/auth/auth-provider';
import { useCommunityActions, useComments, usePost } from '@/features/community/api';
import { PostCard } from '@/features/community/post-card';
import { timeAgo } from '@/features/safety/friend-locations';
import { displayName } from '@/features/social/api';
import { errorMessage } from '@/lib/errors';
import { colors } from '@/lib/theme';

export default function PostDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { userId } = useAuth();
  const post = usePost(id);
  const comments = useComments(id);
  const actions = useCommunityActions();
  const [text, setText] = useState('');

  const send = () => {
    if (!text.trim()) return;
    actions.addComment.mutate(
      { postId: id, body: text },
      { onSuccess: () => setText(''), onError: (e) => Alert.alert('Could not comment', errorMessage(e)) },
    );
  };

  return (
    <Screen back title="Post" scroll={false} keyboard>
      {post.isLoading ? (
        <LoadingState />
      ) : post.isError ? (
        <ErrorState error={post.error} onRetry={post.refetch} />
      ) : !post.data ? (
        <EmptyState title="Post not found" message="It may have been deleted." />
      ) : (
        <>
          <FlatList
            data={comments.data ?? []}
            keyExtractor={(c) => c.id}
            contentContainerClassName="gap-3 px-4 pb-4"
            ListHeaderComponent={
              <View className="gap-3 pb-1">
                <PostCard post={post.data} userId={userId} detail />
                <Text className="text-base font-bold text-foreground">Comments</Text>
              </View>
            }
            ListEmptyComponent={comments.isLoading ? <LoadingState /> : <Text className="text-sm text-muted-foreground">No comments yet. Start the conversation.</Text>}
            renderItem={({ item }) => {
              const canDelete = item.author_id === userId || post.data?.author_id === userId;
              return (
                <View className="flex-row gap-3">
                  <Avatar profile={item.author} size={32} />
                  <View className="flex-1 rounded-2xl bg-card px-3 py-2">
                    <View className="flex-row items-center justify-between">
                      <Text className="text-xs font-semibold text-foreground">{displayName(item.author)}</Text>
                      <Text className="text-[11px] text-muted-foreground">{timeAgo(item.created_at)}</Text>
                    </View>
                    <Text className="text-sm text-foreground">{item.body}</Text>
                  </View>
                  {canDelete ? (
                    <Pressable accessibilityLabel="Delete comment" hitSlop={8} onPress={() => actions.deleteComment.mutate({ id: item.id, postId: id })} className="h-8 w-8 items-center justify-center">
                      <Trash2 color={colors.mutedForeground} size={14} />
                    </Pressable>
                  ) : null}
                </View>
              );
            }}
          />
          <View className="flex-row items-end gap-2 border-t border-border px-3 pt-2" style={{ paddingBottom: insets.bottom + 8 }}>
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder="Add a comment..."
              placeholderTextColor={`${colors.mutedForeground}99`}
              multiline
              maxLength={500}
              className="max-h-28 min-h-12 flex-1 rounded-3xl bg-input px-4 py-3 text-base text-foreground"
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Send comment"
              onPress={send}
              disabled={!text.trim() || actions.addComment.isPending}
              className={`h-12 w-12 items-center justify-center rounded-full ${text.trim() ? 'bg-accent' : 'bg-muted'}`}
            >
              <Send color={text.trim() ? colors.accentForeground : colors.mutedForeground} size={18} />
            </Pressable>
          </View>
        </>
      )}
    </Screen>
  );
}
