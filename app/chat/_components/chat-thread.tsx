"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import {
  sendMessageAction,
  markReadAction,
  loadMoreMessagesAction,
  loadMessagesAroundAction,
  firstUnreadMentionAction,
} from "@/modules/chat/actions/chat.action";
import type { ChatMessage } from "@/modules/chat/services/messages.service";
import { toPlainText } from "@/lib/chat/tokens";
import { MessageBubble } from "./message-bubble";
import { MessageComposer } from "./message-composer";
import { OrderTagModal } from "./order-tag-modal";
import { useChatStore } from "./chat-store";
import { ChatAvatar } from "./chat-people";
import { UserProfilePopover, type ProfileTarget } from "./user-profile-popover";

/** Don't re-announce "typing" more often than this while someone types on. */
const TYPING_PING_MS = 2000;
/** Announce "stopped" after this much keyboard silence. */
const TYPING_IDLE_MS = 3000;

function dayKey(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toDateString();
}

function dayLabel(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  const now = new Date();
  if (date.toDateString() === now.toDateString()) return "Today";
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString("en-NG", { day: "2-digit", month: "long", year: "numeric" });
}

export function ChatThread({
  conversationId,
  title,
  subtitle,
  isArchived,
  currentUserId,
  initialMessages,
  initialCursor,
  conversationType,
  peer,
  memberUserIds,
}: {
  conversationId: string;
  title: string;
  subtitle: string | null;
  isArchived: boolean;
  currentUserId: string;
  initialMessages: ChatMessage[];
  initialCursor: string | null;
  conversationType: "AGENT_GROUP" | "DIRECT";
  peer: { id: string; name: string; role: string; avatarUrl: string | null } | null;
  memberUserIds: string[];
}) {
  const { markRead, applyOutgoing, subscribeIncoming, isOnline, typingIn, sendTyping } =
    useChatStore();
  const isDirect = conversationType === "DIRECT";
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [cursor, setCursor] = useState<string | null>(initialCursor);
  const [loadingMore, setLoadingMore] = useState(false);
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [openOrderId, setOpenOrderId] = useState<string | null>(null);
  const [openProfile, setOpenProfile] = useState<ProfileTarget | null>(null);
  const [highlightId, setHighlightId] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const refs = useRef<Map<string, HTMLDivElement>>(new Map());
  const highlightTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTypingPing = useRef(0);
  const typingIdleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const registerRef = useCallback((id: string, el: HTMLDivElement | null) => {
    if (el) refs.current.set(id, el);
    else refs.current.delete(id);
  }, []);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "auto") => {
    bottomRef.current?.scrollIntoView({ behavior });
  }, []);

  const flash = useCallback((messageId: string) => {
    const el = refs.current.get(messageId);
    if (!el) return false;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    setHighlightId(messageId);
    if (highlightTimer.current) clearTimeout(highlightTimer.current);
    highlightTimer.current = setTimeout(() => setHighlightId(null), 2000);
    return true;
  }, []);

  const jumpTo = useCallback(
    async (messageId: string) => {
      if (flash(messageId)) return;
      // Not loaded — fetch a window around the target, then flash.
      const res = await loadMessagesAroundAction(conversationId, messageId);
      if (res.ok) {
        setMessages(res.data.messages);
        setCursor(null); // window load resets pagination
        requestAnimationFrame(() => flash(messageId));
      }
    },
    [conversationId, flash]
  );

  // On open: jump to first unread mention if any, else bottom; then mark read.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await firstUnreadMentionAction(conversationId);
      if (cancelled) return;
      const mentionId = res.ok ? res.data.messageId : null;
      if (mentionId && refs.current.has(mentionId)) flash(mentionId);
      else scrollToBottom("auto");
      markRead(conversationId); // clear the list badge instantly
      await markReadAction(conversationId);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  // Live messages from other members (the socket excludes our own sends, so no
  // duplicate with the optimistic append). We're viewing this thread, so keep
  // it marked read as messages arrive.
  useEffect(() => {
    return subscribeIncoming(conversationId, (incoming) => {
      setMessages((prev) =>
        prev.some((m) => m.id === incoming.id) ? prev : [...prev, incoming]
      );
      requestAnimationFrame(() => scrollToBottom("smooth"));
      markRead(conversationId);
      markReadAction(conversationId);
    });
  }, [conversationId, subscribeIncoming, markRead, scrollToBottom]);

  // Typing goes straight to the socket server, never through the app — an
  // ephemeral hint isn't worth a DB round-trip per keystroke burst.
  const recipients = useMemo(
    () => memberUserIds.filter((id) => id !== currentUserId),
    [memberUserIds, currentUserId]
  );

  const stopTyping = useCallback(() => {
    if (typingIdleTimer.current) {
      clearTimeout(typingIdleTimer.current);
      typingIdleTimer.current = null;
    }
    if (lastTypingPing.current === 0) return; // never announced; nothing to undo
    lastTypingPing.current = 0;
    sendTyping(conversationId, recipients, false);
  }, [conversationId, recipients, sendTyping]);

  const handleTyping = useCallback(() => {
    const now = Date.now();
    if (now - lastTypingPing.current > TYPING_PING_MS) {
      lastTypingPing.current = now;
      sendTyping(conversationId, recipients, true);
    }
    if (typingIdleTimer.current) clearTimeout(typingIdleTimer.current);
    typingIdleTimer.current = setTimeout(stopTyping, TYPING_IDLE_MS);
  }, [conversationId, recipients, sendTyping, stopTyping]);

  // Leaving the thread must retract the hint, or the other side sees a
  // "typing…" that only expires on its TTL.
  useEffect(() => stopTyping, [stopTyping]);

  async function handleLoadMore() {
    if (!cursor || loadingMore) return;
    setLoadingMore(true);
    const container = scrollRef.current;
    const prevHeight = container?.scrollHeight ?? 0;
    const res = await loadMoreMessagesAction(conversationId, cursor);
    if (res.ok) {
      setMessages((prev) => [...res.data.messages, ...prev]);
      setCursor(res.data.nextCursor);
      requestAnimationFrame(() => {
        if (container) container.scrollTop = container.scrollHeight - prevHeight;
      });
    }
    setLoadingMore(false);
  }

  function onScroll() {
    if (scrollRef.current && scrollRef.current.scrollTop < 60) handleLoadMore();
  }

  async function handleSend(body: string, imageUrl: string | null, replyToId: string | null) {
    const res = await sendMessageAction({ conversationId, body, imageUrl, replyToId });
    if (res.ok) {
      setMessages((prev) => [...prev, res.data]);
      setReplyTo(null);
      requestAnimationFrame(() => scrollToBottom("smooth"));
      // Patch the list locally instead of refetching every server component.
      applyOutgoing({
        conversationId,
        preview: res.data.imageUrl && !res.data.body ? "📷 Photo" : toPlainText(res.data.body),
        senderName: res.data.senderName,
        at: new Date(res.data.createdAt),
      });
    }
  }

  useEffect(
    () => () => {
      if (highlightTimer.current) clearTimeout(highlightTimer.current);
    },
    []
  );

  // Precompute which messages start a new day so render stays side-effect free.
  const showDayFor = new Set<string>();
  let prevDay = "";
  for (const m of messages) {
    const k = dayKey(m.createdAt);
    if (k !== prevDay) {
      showDayFor.add(m.id);
      prevDay = k;
    }
  }

  const typingUserIds = typingIn(conversationId);
  const typingLabel = describeTyping(typingUserIds, messages, isDirect);
  const peerOnline = isOnline(peer?.id);

  // Presence when we know it, then typing, then whatever the caller passed.
  let headerSub: string | null = subtitle;
  if (isDirect) headerSub = peerOnline ? "Online" : null;
  if (typingLabel) headerSub = typingLabel;

  return (
    <div className="flex h-full w-full flex-col bg-white">
      {/* Header */}
      <header className="flex items-center gap-3 border-b border-gray-100 px-4 py-3">
        <Link href="/chat" className="rounded-full p-1 text-gray-500 hover:bg-gray-100 md:hidden">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        {isDirect && peer ? (
          <button
            type="button"
            onClick={() =>
              setOpenProfile({
                id: peer.id,
                name: peer.name,
                avatarUrl: peer.avatarUrl,
                role: peer.role,
              })
            }
            className="rounded-full"
            aria-label={`View ${peer.name}`}
          >
            <ChatAvatar
              name={peer.name}
              avatarUrl={peer.avatarUrl}
              online={peerOnline}
              showPresence
            />
          </button>
        ) : (
          <ChatAvatar name={title} />
        )}
        <div className="min-w-0">
          <h2 className="truncate text-base font-semibold">{title}</h2>
          {headerSub && (
            <p
              className={`truncate text-xs ${
                typingLabel
                  ? "text-purple-600"
                  : isDirect && peerOnline
                    ? "text-emerald-600"
                    : "text-gray-400"
              }`}
            >
              {headerSub}
            </p>
          )}
        </div>
      </header>

      {/* Messages */}
      <div ref={scrollRef} onScroll={onScroll} className="flex-1 space-y-1 overflow-y-auto px-4 py-3">
        {loadingMore && (
          <div className="flex justify-center py-2">
            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
          </div>
        )}
        {messages.map((m) => {
          const showDay = showDayFor.has(m.id);
          return (
            <div key={m.id}>
              {showDay && (
                <div className="my-3 flex justify-center">
                  <span className="rounded-full bg-purple-50 px-3 py-1 text-[11px] font-medium text-purple-600">
                    {dayLabel(m.createdAt)}
                  </span>
                </div>
              )}
              <MessageBubble
                message={m}
                isMine={m.senderId === currentUserId}
                highlighted={highlightId === m.id}
                registerRef={registerRef}
                onReply={setReplyTo}
                onJumpTo={jumpTo}
                onOpenOrder={setOpenOrderId}
                onOpenProfile={setOpenProfile}
                showSenderAvatar={!isDirect}
              />
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <MessageComposer
        conversationId={conversationId}
        disabled={isArchived}
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(null)}
        onSend={handleSend}
        onTyping={handleTyping}
        onStopTyping={stopTyping}
      />

      {openOrderId && (
        <OrderTagModal orderId={openOrderId} onClose={() => setOpenOrderId(null)} />
      )}

      {openProfile && (
        <UserProfilePopover
          user={openProfile}
          isSelf={openProfile.id === currentUserId}
          onClose={() => setOpenProfile(null)}
        />
      )}
    </div>
  );
}

/**
 * Name the people typing. Names come from the loaded messages — the socket only
 * carries ids, and a lookup would be a round-trip for a hint that expires in
 * seconds. Anyone who hasn't spoken in this page of history stays anonymous.
 */
function describeTyping(
  userIds: string[],
  messages: ChatMessage[],
  isDirect: boolean
): string | null {
  if (userIds.length === 0) return null;
  if (isDirect || userIds.length > 2) {
    return userIds.length > 1 ? "Several people are typing…" : "typing…";
  }
  const names = userIds.map((id) => {
    const msg = messages.find((m) => m.senderId === id);
    return msg?.senderName ?? null;
  });
  const known = names.filter((n): n is string => !!n);
  if (known.length === 0) return "typing…";
  if (known.length === 1 && userIds.length === 1) return `${known[0]} is typing…`;
  return `${known.join(" and ")} are typing…`;
}
