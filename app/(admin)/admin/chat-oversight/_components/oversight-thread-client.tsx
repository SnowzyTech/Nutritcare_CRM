"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Eye, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { MessageBubble } from "@/app/chat/_components/message-bubble";
import { ChatAvatar } from "@/app/chat/_components/chat-people";
import { roleLabel } from "@/lib/chat/role-label";
import { dayKey, dayLabel } from "@/lib/chat/day-label";
import { loadOversightMessagesAction } from "@/modules/chat/actions/chat-oversight.action";
import type { ChatMessage } from "@/modules/chat/services/messages.service";
import type { OversightPerson } from "@/modules/chat/services/chat-oversight.service";

/**
 * Read-only transcript of one staff member's DM.
 *
 * Deliberately NOT built on `ChatThread`: that component owns the socket
 * subscription, typing pings, the composer and `markReadAction` — all writes.
 * This view reuses only the presentational pieces (`MessageBubble`,
 * `ChatAvatar`, the day separators) and never mutates a thing. Older pages load
 * on an explicit click rather than on scroll, so a super admin can't
 * accidentally pull the whole history by resting on the scrollbar.
 */
export function OversightThreadClient({
  conversationId,
  staff,
  peer,
  initialMessages,
  initialCursor,
}: {
  conversationId: string;
  staff: OversightPerson;
  peer: OversightPerson | null;
  initialMessages: ChatMessage[];
  initialCursor: string | null;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [cursor, setCursor] = useState<string | null>(initialCursor);
  const [loading, setLoading] = useState(false);

  // The first message of each calendar day carries the separator.
  const showDayFor = useMemo(() => {
    const ids = new Set<string>();
    let prev = "";
    for (const m of messages) {
      const key = dayKey(m.createdAt);
      if (key !== prev) {
        ids.add(m.id);
        prev = key;
      }
    }
    return ids;
  }, [messages]);

  async function loadOlder() {
    if (!cursor || loading) return;
    setLoading(true);
    const res = await loadOversightMessagesAction({
      conversationId,
      staffUserId: staff.id,
      cursor,
    });
    setLoading(false);

    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    // Pages arrive oldest → newest, so they prepend as-is. Dedupe defensively:
    // a message deleted between pages would otherwise shift the cursor window.
    setMessages((prev) => {
      const seen = new Set(prev.map((m) => m.id));
      return [...res.data.messages.filter((m) => !seen.has(m.id)), ...prev];
    });
    setCursor(res.data.nextCursor);
  }

  return (
    <div className="flex h-full flex-col p-6">
      <Link
        href={`/admin/chat-oversight/${staff.id}`}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-purple-600"
      >
        <ArrowLeft className="h-4 w-4" />
        {staff.name}&rsquo;s conversations
      </Link>

      <div className="flex items-center gap-3 rounded-t-xl border border-b-0 border-gray-200 bg-white px-4 py-3">
        <ChatAvatar name={peer?.name ?? "?"} avatarUrl={peer?.avatarUrl} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-gray-900">
            {staff.name} &harr; {peer?.name ?? "Removed user"}
          </p>
          <p className="truncate text-xs text-gray-500">
            {roleLabel(staff.role)} &middot; {peer ? roleLabel(peer.role) : "—"}
          </p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
          <Eye className="h-3.5 w-3.5" />
          Read-only
        </span>
      </div>

      <div className="flex-1 space-y-1 overflow-y-auto border border-gray-200 bg-white px-4 py-4">
        <div className="flex justify-center pb-2">
          {cursor ? (
            <button
              type="button"
              onClick={loadOlder}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-60"
            >
              {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Load older messages
            </button>
          ) : (
            messages.length > 0 && (
              <span className="text-[11px] text-gray-400">
                Beginning of the conversation
              </span>
            )
          )}
        </div>

        {messages.length === 0 ? (
          <p className="py-10 text-center text-sm text-gray-500">
            No messages in this conversation.
          </p>
        ) : (
          messages.map((m) => (
            <div key={m.id}>
              {showDayFor.has(m.id) && (
                <div className="my-3 flex justify-center">
                  <span className="rounded-full bg-purple-50 px-3 py-1 text-[11px] font-medium text-purple-600">
                    {dayLabel(m.createdAt)}
                  </span>
                </div>
              )}
              <MessageBubble
                message={m}
                // The inspected staff member sits on the right, so the
                // transcript reads the way it did for them.
                isMine={m.senderId === staff.id}
                highlighted={false}
                registerRef={() => {}}
                showSenderAvatar
                readOnly
              />
            </div>
          ))
        )}
      </div>

      <p className="rounded-b-xl border border-t-0 border-gray-200 bg-gray-50 px-4 py-2.5 text-center text-xs text-gray-500">
        Viewing this conversation does not mark it as read or notify either
        participant.
      </p>
    </div>
  );
}
