"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import type { ConversationListItem } from "@/modules/chat/services/conversations.service";
import type { ChatMessage } from "@/modules/chat/services/messages.service";
import { getConversationListItemAction } from "@/modules/chat/actions/chat.action";
import { extractMentionUserIds, toPlainText } from "@/lib/chat/tokens";
import { useChatSocket, type ChatSocketEvent, type SendTyping } from "./use-chat-socket";

/**
 * Client-side mirror of the conversation list. It is seeded from the server on
 * load, then kept live by two sources without ever re-running server
 * components:
 *   - the current user's own actions (opening a thread, sending a message), and
 *   - `message.created` events pushed by the chat socket server.
 *
 * Open threads subscribe via `subscribeIncoming` so a live message appends to
 * the thread they're viewing; the list badges/preview are patched here.
 *
 * The store also holds the two ephemeral, socket-only signals — who is online
 * and who is typing — because both are cross-cutting: the list pane and the
 * open thread render them from the same state.
 */
type ThreadHandler = (message: ChatMessage) => void;

/** A typing hint disappears on its own if the "stopped" frame never lands. */
const TYPING_TTL_MS = 4000;

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
  /** Insert/refresh a conversation the client may not have in its list yet. */
  ensureConversation: (conversationId: string) => void;
  isOnline: (userId: string | null | undefined) => boolean;
  /** User ids currently typing in a conversation (never includes the viewer). */
  typingIn: (conversationId: string) => string[];
  sendTyping: SendTyping;
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
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(() => new Set());
  const [typingMap, setTypingMap] = useState<Record<string, string[]>>({});
  const subscribersRef = useRef<Map<string, Set<ThreadHandler>>>(new Map());
  // Conversations we've already asked the server for, so a burst of messages in
  // a brand-new DM triggers one fetch instead of one per message.
  const fetchingRef = useRef<Set<string>>(new Set());
  // Mirror of the ids we hold, so an event handler can test membership without
  // reaching into a state updater to do it.
  const idsRef = useRef<Set<string>>(new Set(initial.map((c) => c.id)));
  const typingTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

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

  /**
   * Pull a conversation the client has never seen — the first message of a DM
   * someone else just started, or the DM the user just opened from the picker.
   */
  const ensureConversation = useCallback((conversationId: string) => {
    if (fetchingRef.current.has(conversationId)) return;
    fetchingRef.current.add(conversationId);
    (async () => {
      const res = await getConversationListItemAction(conversationId);
      if (res.ok) {
        setConversations((prev) => {
          if (prev.some((c) => c.id === conversationId)) return prev;
          // A freshly opened DM has no last message, so recency sorting would
          // bury it at the bottom. Pin it to the top until it has one.
          return res.data.lastMessageAt
            ? sortByRecency([res.data, ...prev])
            : [res.data, ...prev];
        });
      }
      fetchingRef.current.delete(conversationId);
    })();
  }, []);

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

  const clearTyping = useCallback((conversationId: string, userId: string) => {
    const key = `${conversationId}:${userId}`;
    const timer = typingTimers.current.get(key);
    if (timer) {
      clearTimeout(timer);
      typingTimers.current.delete(key);
    }
    setTypingMap((prev) => {
      const current = prev[conversationId];
      if (!current || !current.includes(userId)) return prev;
      const next = current.filter((id) => id !== userId);
      const copy = { ...prev };
      if (next.length === 0) delete copy[conversationId];
      else copy[conversationId] = next;
      return copy;
    });
  }, []);

  const applyTyping = useCallback(
    (conversationId: string, userId: string, typing: boolean) => {
      if (userId === currentUserId) return;
      const key = `${conversationId}:${userId}`;
      const existing = typingTimers.current.get(key);
      if (existing) clearTimeout(existing);

      if (!typing) {
        typingTimers.current.delete(key);
        clearTyping(conversationId, userId);
        return;
      }

      typingTimers.current.set(
        key,
        setTimeout(() => clearTyping(conversationId, userId), TYPING_TTL_MS)
      );
      setTypingMap((prev) => {
        const current = prev[conversationId] ?? [];
        if (current.includes(userId)) return prev;
        return { ...prev, [conversationId]: [...current, userId] };
      });
    },
    [clearTyping, currentUserId]
  );

  const dispatchIncoming = useCallback(
    (evt: ChatSocketEvent) => {
      if (evt.type === "presence.snapshot") {
        setOnlineUserIds(new Set(evt.userIds));
        return;
      }
      if (evt.type === "presence.update") {
        setOnlineUserIds((prev) => {
          const next = new Set(prev);
          if (evt.online) next.add(evt.userId);
          else next.delete(evt.userId);
          return next;
        });
        return;
      }
      if (evt.type === "typing") {
        applyTyping(evt.conversationId, evt.userId, evt.typing);
        return;
      }

      const message: ChatMessage = {
        ...evt.message,
        createdAt: new Date(evt.message.createdAt),
      };

      // A message ends any typing hint from its sender.
      if (message.senderId) applyTyping(evt.conversationId, message.senderId, false);

      const handlers = subscribersRef.current.get(evt.conversationId);
      const isOpen = !!handlers && handlers.size > 0;
      if (isOpen) handlers!.forEach((h) => h(message));

      const mentionsMe = extractMentionUserIds(message.body).includes(currentUserId);
      const preview =
        message.imageUrl && !message.body ? "📷 Photo" : toPlainText(message.body);

      // Unknown conversation — a DM that didn't exist when this page loaded.
      // Fetch the real row rather than synthesizing a half-populated one;
      // `bumpPreview` would otherwise drop the message on the floor.
      if (!idsRef.current.has(evt.conversationId)) {
        ensureConversation(evt.conversationId);
        return;
      }

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
    [applyTyping, currentUserId, ensureConversation]
  );

  const sendTyping = useChatSocket(dispatchIncoming);

  const isOnline = useCallback(
    (userId: string | null | undefined) => !!userId && onlineUserIds.has(userId),
    [onlineUserIds]
  );

  const typingIn = useCallback(
    (conversationId: string) => typingMap[conversationId] ?? [],
    [typingMap]
  );

  useEffect(() => {
    idsRef.current = new Set(conversations.map((c) => c.id));
  }, [conversations]);

  useEffect(() => {
    const timers = typingTimers.current;
    return () => {
      timers.forEach((t) => clearTimeout(t));
      timers.clear();
    };
  }, []);

  return (
    <ChatStoreContext.Provider
      value={{
        conversations,
        markRead,
        applyOutgoing,
        subscribeIncoming,
        ensureConversation,
        isOnline,
        typingIn,
        sendTyping,
      }}
    >
      {children}
    </ChatStoreContext.Provider>
  );
}

function sortByRecency(items: ConversationListItem[]): ConversationListItem[] {
  return [...items].sort(
    (a, b) =>
      (b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0) -
      (a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0)
  );
}

/**
 * Patch one conversation's last-message fields and re-sort to the top.
 * Returns the input untouched when the conversation isn't in the list — the
 * caller treats that identity as "I've never seen this one" and goes and gets it.
 */
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
  return sortByRecency(next);
}

export function useChatStore(): ChatStore {
  const ctx = useContext(ChatStoreContext);
  if (!ctx) throw new Error("useChatStore must be used within a ChatStoreProvider");
  return ctx;
}
