"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
}: {
  conversationId: string;
  title: string;
  subtitle: string | null;
  isArchived: boolean;
  currentUserId: string;
  initialMessages: ChatMessage[];
  initialCursor: string | null;
}) {
  const { markRead, applyOutgoing } = useChatStore();
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [cursor, setCursor] = useState<string | null>(initialCursor);
  const [loadingMore, setLoadingMore] = useState(false);
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [openOrderId, setOpenOrderId] = useState<string | null>(null);
  const [highlightId, setHighlightId] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const refs = useRef<Map<string, HTMLDivElement>>(new Map());
  const highlightTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  return (
    <div className="flex h-full w-full flex-col bg-white">
      {/* Header */}
      <header className="flex items-center gap-3 border-b border-gray-100 px-4 py-3">
        <Link href="/chat" className="rounded-full p-1 text-gray-500 hover:bg-gray-100 md:hidden">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 text-sm font-semibold text-purple-700">
          {title.slice(0, 2).toUpperCase()}
        </div>
        <div className="min-w-0">
          <h2 className="truncate text-base font-semibold">{title}</h2>
          {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
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
      />

      {openOrderId && (
        <OrderTagModal orderId={openOrderId} onClose={() => setOpenOrderId(null)} />
      )}
    </div>
  );
}
