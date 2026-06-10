"use client";

import { createContext, useCallback, useContext, useState } from "react";
import type { ConversationListItem } from "@/modules/chat/services/conversations.service";

/**
 * Client-side mirror of the conversation list. It is seeded from the server on
 * load, then patched locally for the current user's own actions (opening a
 * thread, sending a message) so the list updates instantly without a
 * `router.refresh()` re-running every server component. Incoming messages from
 * other users are reconciled by the Phase 2 socket (and a fresh server load in
 * the meantime).
 */
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
};

const ChatStoreContext = createContext<ChatStore | null>(null);

export function ChatStoreProvider({
  initial,
  children,
}: {
  initial: ConversationListItem[];
  children: React.ReactNode;
}) {
  const [conversations, setConversations] = useState<ConversationListItem[]>(initial);

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
    ({
      conversationId,
      preview,
      senderName,
      at,
    }: {
      conversationId: string;
      preview: string;
      senderName: string | null;
      at: Date;
    }) => {
      setConversations((prev) => {
        const next = prev.map((c) =>
          c.id === conversationId
            ? {
                ...c,
                lastMessagePreview: preview,
                lastMessageSender: senderName,
                lastMessageAt: at,
              }
            : c
        );
        next.sort(
          (a, b) =>
            (b.lastMessageAt?.getTime() ?? 0) - (a.lastMessageAt?.getTime() ?? 0)
        );
        return next;
      });
    },
    []
  );

  return (
    <ChatStoreContext.Provider value={{ conversations, markRead, applyOutgoing }}>
      {children}
    </ChatStoreContext.Provider>
  );
}

export function useChatStore(): ChatStore {
  const ctx = useContext(ChatStoreContext);
  if (!ctx) throw new Error("useChatStore must be used within a ChatStoreProvider");
  return ctx;
}
