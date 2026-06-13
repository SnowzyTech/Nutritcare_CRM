"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";
import type { ConversationListItem } from "@/modules/chat/services/conversations.service";
import type { ChatMessage } from "@/modules/chat/services/messages.service";
import { extractMentionUserIds, toPlainText } from "@/lib/chat/tokens";
import { useChatSocket, type ChatSocketEvent } from "./use-chat-socket";

/**
 * Client-side mirror of the conversation list. It is seeded from the server on
 * load, then kept live by two sources without ever re-running server
 * components:
 *   - the current user's own actions (opening a thread, sending a message), and
 *   - `message.created` events pushed by the chat socket server.
 *
 * Open threads subscribe via `subscribeIncoming` so a live message appends to
 * the thread they're viewing; the list badges/preview are patched here.
 */
type ThreadHandler = (message: ChatMessage) => void;

type ChatStore = {
  conversations: ConversationListItem[];
  /** Clear unread badge + mention glyph for a conversation the user just opened. */
  markRead: (conversationId: string) => void;
  /** Patch last-message preview + bump to top after the user sends a message. */
  applyOutgoing: (args: {
    conversationId: string;
    preview: string;
    senderName: string | null;
    at: Date;
  }) => void;
  /** An open thread registers to receive live messages for its conversation. */
  subscribeIncoming: (conversationId: string, handler: ThreadHandler) => () => void;
};

const ChatStoreContext = createContext<ChatStore | null>(null);

export function ChatStoreProvider({
  initial,
  currentUserId,
  children,
}: {
  initial: ConversationListItem[];
  currentUserId: string;
  children: React.ReactNode;
}) {
  const [conversations, setConversations] = useState<ConversationListItem[]>(initial);
  const subscribersRef = useRef<Map<string, Set<ThreadHandler>>>(new Map());

  const markRead = useCallback((conversationId: string) => {
    setConversations((prev) =>
      prev.map((c) =>
        c.id === conversationId
          ? { ...c, unreadCount: 0, hasUnreadMention: false }
          : c
      )
    );
  }, []);

  const applyOutgoing = useCallback(
    (args: {
      conversationId: string;
      preview: string;
      senderName: string | null;
      at: Date;
    }) => {
      setConversations((prev) => bumpPreview(prev, args.conversationId, args));
    },
    []
  );

  const subscribeIncoming = useCallback(
    (conversationId: string, handler: ThreadHandler) => {
      let set = subscribersRef.current.get(conversationId);
      if (!set) {
        set = new Set();
        subscribersRef.current.set(conversationId, set);
      }
      set.add(handler);
      return () => {
        const s = subscribersRef.current.get(conversationId);
        if (s) {
          s.delete(handler);
          if (s.size === 0) subscribersRef.current.delete(conversationId);
        }
      };
    },
    []
  );

  const dispatchIncoming = useCallback(
    (evt: ChatSocketEvent) => {
      const message: ChatMessage = {
        ...evt.message,
        createdAt: new Date(evt.message.createdAt),
      };

      const handlers = subscribersRef.current.get(evt.conversationId);
      const isOpen = !!handlers && handlers.size > 0;
      if (isOpen) handlers!.forEach((h) => h(message));

      const mentionsMe = extractMentionUserIds(message.body).includes(currentUserId);
      const preview =
        message.imageUrl && !message.body ? "📷 Photo" : toPlainText(message.body);

      setConversations((prev) =>
        bumpPreview(
          prev,
          evt.conversationId,
          {
            preview,
            senderName: message.senderName,
            at: message.createdAt,
          },
          // When the thread is open the user is actively reading, so keep it
          // read; otherwise raise the unread count and mention glyph.
          isOpen ? { unread: "reset" } : { unread: "increment", mentionsMe }
        )
      );
    },
    [currentUserId]
  );

  useChatSocket(dispatchIncoming);

  return (
    <ChatStoreContext.Provider
      value={{ conversations, markRead, applyOutgoing, subscribeIncoming }}
    >
      {children}
    </ChatStoreContext.Provider>
  );
}

/** Patch one conversation's last-message fields and re-sort to the top. */
function bumpPreview(
  prev: ConversationListItem[],
  conversationId: string,
  patch: { preview: string; senderName: string | null; at: Date },
  unread?: { unread: "reset" } | { unread: "increment"; mentionsMe: boolean }
): ConversationListItem[] {
  let found = false;
  const next = prev.map((c) => {
    if (c.id !== conversationId) return c;
    found = true;
    const base = {
      ...c,
      lastMessagePreview: patch.preview,
      lastMessageSender: patch.senderName,
      lastMessageAt: patch.at,
    };
    if (!unread) return base;
    if (unread.unread === "reset") {
      return { ...base, unreadCount: 0, hasUnreadMention: false };
    }
    return {
      ...base,
      unreadCount: c.unreadCount + 1,
      hasUnreadMention: c.hasUnreadMention || unread.mentionsMe,
    };
  });
  if (!found) return prev;
  next.sort(
    (a, b) => (b.lastMessageAt?.getTime() ?? 0) - (a.lastMessageAt?.getTime() ?? 0)
  );
  return next;
}

export function useChatStore(): ChatStore {
  const ctx = useContext(ChatStoreContext);
  if (!ctx) throw new Error("useChatStore must be used within a ChatStoreProvider");
  return ctx;
}
