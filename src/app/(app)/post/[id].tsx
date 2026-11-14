import { useLocalSearchParams } from 'expo-router';
import { CornerDownRight, Send, X } from 'lucide-react-native';
import { useMemo, useRef, useState } from 'react';
import { Alert, FlatList, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/avatar';
import { Screen } from '@/components/screen';
import { EmptyState, ErrorState, LoadingState } from '@/components/states';
import { Text, TextInput, type TextInputRef } from '@/components/text';
import { useAuth } from '@/features/auth/auth-provider';
import { useCommunityActions, useComments, usePost } from '@/features/community/api';
import { MentionText } from '@/features/community/mention-text';
import { PostCard } from '@/features/community/post-card';
import { timeAgo } from '@/features/safety/friend-locations';
import { displayName } from '@/features/social/api';
import { errorMessage } from '@/lib/errors';
import { tx } from '@/lib/i18n';
import { brandGradient, colors } from '@/lib/theme';
import type { PostComment } from '@/lib/types';
import { useRequireAccount } from '@/features/auth/guest-gate';

export default function PostDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { userId } = useAuth();
  const post = usePost(id);
  const comments = useComments(id);
  const actions = useCommunityActions();
  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState<PostComment | null>(null);
  const requireAccount = useRequireAccount();
  const list = useRef<FlatList<{ comment: PostComment; replies: PostComment[] }>>(null);
  const input = useRef<TextInputRef>(null);
  const count = comments.data?.length ?? post.data?.comments[0]?.count ?? 0;
  // Top comments in order, each with its replies (one level, oldest first).
  const threads = useMemo(() => {
    const all = comments.data ?? [];
    const ids = new Set(all.map((c) => c.id));
    const replies = new Map<string, PostComment[]>();
    const tops: PostComment[] = [];
    for (const c of all) {
      if (c.parent_id && ids.has(c.parent_id)) replies.set(c.parent_id, [...(replies.get(c.parent_id) ?? []), c]);
      else tops.push(c);
    }
    return tops.map((c) => ({ comment: c, replies: replies.get(c.id) ?? [] }));
  }, [comments.data]);
  // Threads showing all their replies (longer threads start folded).
  const [open, setOpen] = useState<Set<string>>(new Set());

  const send = () => {
    const body = text.trim();
    if (!body) return;
    if (!requireAccount(tx('comment on posts'))) return;
    setText('');
    setReplyTo(null);
    // Replies hang under the top comment (a reply to a reply joins the same thread).
    const parentId = replyTo ? (replyTo.parent_id ?? replyTo.id) : null;
    if (parentId) setOpen((o) => new Set(o).add(parentId));
    actions.addComment.mutate(
      { postId: id, body, tempId: `pending-${Date.now()}`, parentId },
      {
        onError: (e) => {
          setText(body);
          Alert.alert(tx('Could not comment'), errorMessage(e));
        },
      },
    );
    if (!parentId) setTimeout(() => list.current?.scrollToEnd({ animated: true }), 80);
  };

  const reply = (c: PostComment) => {
    setReplyTo(c);
    const handle = c.author?.username ? `@${c.author.username} ` : '';
    if (handle && !text.startsWith(handle)) setText(handle + text);
    input.current?.focus();
  };

  const remove = (c: PostComment) =>
    Alert.alert(tx('Delete comment?'), c.body.length > 80 ? `${c.body.slice(0, 80)}…` : c.body, [
      { text: tx('Cancel'), style: 'cancel' },
      { text: tx('Delete'), style: 'destructive', onPress: () => actions.deleteComment.mutate({ id: c.id, postId: id }) },
    ]);

  return (
    <Screen back title={tx('Post')} scroll={false} keyboard>
      {post.isLoading ? (
        <LoadingState variant="feed" />
      ) : post.isError ? (
        <ErrorState error={post.error} onRetry={post.refetch} />
      ) : !post.data ? (
        <EmptyState title={tx('Post not found')} message={tx('It may have been deleted.')} />
      ) : (
        <>
          <FlatList
            ref={list}
            data={threads}
            keyExtractor={(t) => t.comment.id}
            keyboardShouldPersistTaps="handled"
            contentContainerClassName="gap-3 px-4 pb-4"
            ListHeaderComponent={
              <View className="gap-3 pb-1">
                <PostCard post={post.data} userId={userId} detail />
                <Text className="text-base font-bold text-heading">{count ? tx('Comments ({0})', { 0: count }) : tx('Comments')}</Text>
              </View>
            }
            ListEmptyComponent={
              comments.isLoading ? (
                <LoadingState variant="list" />
              ) : (
                <Text className="text-sm text-muted-foreground">{tx('No comments yet. Start the conversation.')}</Text>
              )
            }
            renderItem={({ item: thread }) => {
              const folded = thread.replies.length > 2 && !open.has(thread.comment.id);
              const shown = folded ? thread.replies.slice(-1) : thread.replies;
              return (
                <View className="gap-2.5">
                  <CommentRow comment={thread.comment} postAuthorId={post.data?.author_id} userId={userId} onReply={reply} onDelete={remove} />
                  {thread.replies.length ? (
                    // Replies sit indented under the comment, with a thread line.
                    <View className="gap-2.5 border-border" style={{ marginStart: 44, borderStartWidth: 2, paddingStart: 10 }}>
                      {folded ? (
                        <Pressable accessibilityRole="button" hitSlop={8} onPress={() => setOpen((o) => new Set(o).add(thread.comment.id))} className="min-h-8 justify-center">
                          <Text className="text-xs font-semibold text-muted-foreground">
                            {tx('View {0} more replies', { 0: thread.replies.length - shown.length })}
                          </Text>
                        </Pressable>
                      ) : null}
                      {shown.map((r) => (
                        <CommentRow key={r.id} comment={r} postAuthorId={post.data?.author_id} userId={userId} onReply={reply} onDelete={remove} small />
                      ))}
                    </View>
                  ) : null}
                </View>
              );
            }}
          />
          {replyTo ? (
            <View className="flex-row items-center gap-2 border-t border-border bg-card px-4 py-2">
              <CornerDownRight color={colors.mutedForeground} size={14} />
              <Text numberOfLines={1} className="flex-1 text-xs text-muted-foreground">
                {tx('Replying to {0}', { 0: displayName(replyTo.author) })}
              </Text>
              <Pressable accessibilityLabel={tx('Cancel reply')} hitSlop={10} onPress={() => setReplyTo(null)}>
                <X color={colors.mutedForeground} size={16} />
              </Pressable>
            </View>
          ) : null}
          <View className="flex-row items-end gap-2 border-t border-border px-3 pt-2" style={{ paddingBottom: insets.bottom + 8 }}>
            <TextInput
              ref={input}
              value={text}
              onChangeText={setText}
              placeholder={tx('Add a comment...')}
              placeholderTextColor={`${colors.mutedForeground}99`}
              multiline
              maxLength={500}
              className="max-h-28 min-h-12 flex-1 rounded-[24px] border border-border-strong bg-card px-4 py-3 text-base text-foreground"
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={tx('Send comment')}
              onPress={send}
              disabled={!text.trim()}
              className="h-12 w-12 items-center justify-center rounded-full"
              style={text.trim() ? { experimental_backgroundImage: brandGradient } : { backgroundColor: colors.muted }}
            >
              <Send color={text.trim() ? colors.accentForeground : colors.mutedForeground} size={18} />
            </Pressable>
          </View>
        </>
      )}
    </Screen>
  );
}

/** One comment (or a reply, `small`): avatar, name, text, then time, Reply and Delete. */
function CommentRow({
  comment: item,
  postAuthorId,
  userId,
  onReply,
  onDelete,
  small = false,
}: {
  comment: PostComment;
  postAuthorId?: string;
  userId: string | null;
  onReply: (c: PostComment) => void;
  onDelete: (c: PostComment) => void;
  small?: boolean;
}) {
  const pending = item.id.startsWith('pending-');
  const canDelete = !pending && (item.author_id === userId || postAuthorId === userId);
  const isAuthor = item.author_id === postAuthorId;
  return (
    <Pressable
      onLongPress={canDelete ? () => onDelete(item) : undefined}
      delayLongPress={350}
      accessibilityHint={canDelete ? tx('Long-press to delete') : undefined}
      className={`flex-row gap-2.5 ${pending ? 'opacity-60' : ''}`}
    >
      <Avatar profile={item.author} size={small ? 24 : 32} />
      <View className="flex-1 gap-1">
        <View className="rounded-[18px] rounded-tl-md bg-primary-soft px-3 py-2">
          <View className="flex-row items-center gap-1.5">
            <Text className="shrink text-xs font-semibold text-heading">
              {displayName(item.author)}
            </Text>
            {isAuthor ? (
              <View className="rounded-full bg-white/80 px-1.5 py-0.5">
                <Text className="text-[9px] font-bold uppercase text-primary">{tx('Author')}</Text>
              </View>
            ) : null}
          </View>
          <MentionText className="text-sm leading-5 text-foreground" text={item.body} />
        </View>
        <View className="flex-row items-center gap-4 px-3">
          <Text className="text-[11px] text-muted-foreground">{pending ? tx('Sending…') : timeAgo(item.created_at)}</Text>
          {!pending ? (
            <Pressable accessibilityRole="button" hitSlop={8} onPress={() => onReply(item)}>
              <Text className="text-[11px] font-semibold text-muted-foreground">{tx('Reply')}</Text>
            </Pressable>
          ) : null}
          {canDelete ? (
            <Pressable accessibilityRole="button" hitSlop={8} onPress={() => onDelete(item)}>
              <Text className="text-[11px] font-semibold text-muted-foreground">{tx('Delete')}</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}
