import { useSyncExternalStore } from 'react';

import type { ChatTurn } from '@/features/ai/api';
import { storage } from '@/lib/storage';

export type ChatMessage = ChatTurn & { id: string };

/**
 * A saved AI conversation (like the chat history in AI apps): its title is
 * the first question, `place` the destination it is about (Ask AI on a
 * destination page), or null for the general AI guide.
 */
export type Conversation = {
  id: string;
  title: string;
  place: string | null;
  placeName: string | null;
  updatedAt: number;
  messages: ChatMessage[];
};

/** Conversations kept per account, and messages per conversation (on the phone). */
const KEEP_CONVERSATIONS = 30;
const KEEP_MESSAGES = 40;
const EMPTY: Conversation[] = [];
const EMPTY_MESSAGES: ChatMessage[] = [];

const key = (userId: string) => `gtg.ai.conversations.${userId}`;

function read(userId: string): Conversation[] {
  return storage.get<Conversation[]>(key(userId), EMPTY);
}

function newConversation(messages: ChatMessage[], place: string | null, placeName: string | null): Conversation {
  const first = messages.find((m) => m.role === 'user')?.content ?? '';
  return {
    id: `c${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    title: titleFrom(first),
    place,
    placeName,
    updatedAt: Date.now(),
    messages: messages.slice(-KEEP_MESSAGES),
  };
}

/** The first question, tidied into a short title. */
export function titleFrom(question: string) {
  const one = question.replace(/\s+/g, ' ').trim();
  return one.length > 60 ? `${one.slice(0, 57).trimEnd()}…` : one || 'New chat';
}

export const conversations = {
  list: (userId: string) => read(userId),
  get: (userId: string, id: string) => read(userId).find((c) => c.id === id) ?? null,
  /** The newest conversation about a place (to continue it). */
  latestFor: (userId: string, place: string) => read(userId).find((c) => c.place === place) ?? null,

  /** Saves messages into a conversation (creating it when `id` is null); returns its id. Newest first. */
  save(userId: string, id: string | null, messages: ChatMessage[], place: string | null, placeName: string | null): string {
    const list = read(userId);
    const existing = id ? list.find((c) => c.id === id) : undefined;
    const conv: Conversation = existing
      ? { ...existing, messages: messages.slice(-KEEP_MESSAGES), updatedAt: Date.now() }
      : newConversation(messages, place, placeName);
    storage.set(key(userId), [conv, ...list.filter((c) => c.id !== conv.id)].slice(0, KEEP_CONVERSATIONS));
    return conv.id;
  },

  /**
   * Turns a chat saved by the previous version (one per screen, under
   * "gtg.ai.chat.<user>.<thread>") into a conversation, once. Call it when a
   * chat opens, not while rendering.
   */
  migrate(userId: string, thread: string, place: string | null, placeName: string | null) {
    const oldKey = `gtg.ai.chat.${userId}.${thread}`;
    const messages = storage.get<ChatMessage[]>(oldKey, EMPTY_MESSAGES);
    if (!messages.length) return;
    storage.remove(oldKey);
    const conv = newConversation(messages, place, placeName);
    storage.set(key(userId), [conv, ...read(userId)].slice(0, KEEP_CONVERSATIONS));
  },

  remove(userId: string, id: string) {
    storage.set(
      key(userId),
      read(userId).filter((c) => c.id !== id),
    );
  },
};

/** All saved conversations, newest first (re-renders when one changes). */
export function useConversations(userId: string | null): Conversation[] {
  return useSyncExternalStore(
    (cb) => (userId ? storage.subscribe(key(userId), cb) : () => undefined),
    () => (userId ? read(userId) : EMPTY),
  );
}
