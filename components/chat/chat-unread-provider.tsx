"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useChatSocket } from "@/app/chat/_components/use-chat-socket";
import { useFallbackRefresh } from "@/lib/realtime/use-fallback-refresh";
import { getMyUnreadChatCountAction } from "@/modules/chat/actions/chat.action";

/**
 * Live total of the signed-in user's unread chat messages, for the Chat icon
 * badge on dashboards OUTSIDE /chat (which has its own full-screen layout and
 * per-conversation badges).
 *
 * The server count is the source of truth (`ConversationMember.unreadCount`):
 *  - seeded by the layout on render (`initialCount`),
 *  - bumped instantly when the socket delivers a new message, then reconciled
 *    against the server a moment later,
 *  - re-fetched on tab focus and socket reconnect (catches chats read on
 *    another device), with a slow poll ONLY while the socket is down — so it
 *    stays correct when realtime is not configured without paying for polling
 *    when it is (see useFallbackRefresh).
 */

const RECONCILE_DELAY_MS = 1_500;

const ChatUnreadContext = createContext<number>(0);

export function ChatUnreadProvider({
  initialCount,
  children,
}: {
  initialCount: number;
  children: React.ReactNode;
}) {
  const [count, setCount] = useState(initialCount);
  const inFlight = useRef(false);
  const reconcileTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refresh = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    try {
      const res = await getMyUnreadChatCountAction();
      if (res.ok) setCount(res.data);
    } finally {
      inFlight.current = false;
    }
  }, []);

  // A new message was fanned out to this user (the socket only ever sends a
  // user messages from conversations they belong to, never their own).
  useChatSocket((evt) => {
    if (evt.type !== "message.created") return;
    setCount((c) => c + 1);
    if (reconcileTimer.current) clearTimeout(reconcileTimer.current);
    reconcileTimer.current = setTimeout(() => void refresh(), RECONCILE_DELAY_MS);
  });

  // Mount check (the layout's count can be a cached render), focus, socket
  // reconnect, and a slow poll only while the socket is down.
  useFallbackRefresh(refresh);

  useEffect(() => {
    const timer = reconcileTimer;
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  return <ChatUnreadContext.Provider value={count}>{children}</ChatUnreadContext.Provider>;
}

/** Current unread chat total (0 outside a provider). */
export function useChatUnreadCount(): number {
  return useContext(ChatUnreadContext);
}
