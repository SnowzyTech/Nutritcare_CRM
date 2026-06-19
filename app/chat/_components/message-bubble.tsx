"use client";

import { CornerUpLeft, Tag } from "lucide-react";
import { parseTokens } from "@/lib/chat/tokens";
import type { ChatMessage } from "@/modules/chat/services/messages.service";

function MessageBody({
  body,
  onOpenOrder,
}: {
  body: string;
  onOpenOrder: (orderId: string) => void;
}) {
  const segments = parseTokens(body);
  return (
    <span className="whitespace-pre-wrap break-words">
      {segments.map((seg, i) => {
        if (seg.kind === "text") return <span key={i}>{seg.text}</span>;
        if (seg.kind === "mention") {
          return (
            <span key={i} className="font-semibold text-purple-600">
              @{seg.label}
            </span>
          );
        }
        return (
          <button
            key={i}
            type="button"
            onClick={() => onOpenOrder(seg.orderId)}
            className="mx-0.5 inline-flex items-center gap-1 rounded-md bg-purple-100 px-1.5 py-0.5 align-baseline text-xs font-semibold text-purple-700 hover:bg-purple-200"
          >
            <Tag className="h-3 w-3" />
            {seg.label}
          </button>
        );
      })}
    </span>
  );
}

function formatBubbleTime(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  const time = date.toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" });
  const day = `${date.getDate()}/${date.getMonth() + 1}`;
  return `${time} | ${day}`;
}

export function MessageBubble({
  message,
  isMine,
  highlighted,
  registerRef,
  onReply,
  onJumpTo,
  onOpenOrder,
}: {
  message: ChatMessage;
  isMine: boolean;
  highlighted: boolean;
  registerRef: (id: string, el: HTMLDivElement | null) => void;
  onReply: (m: ChatMessage) => void;
  onJumpTo: (messageId: string) => void;
  onOpenOrder: (orderId: string) => void;
}) {
  if (message.type === "SYSTEM") {
    return (
      <div className="my-2 flex justify-center">
        <span className="rounded-full bg-gray-100 px-3 py-1 text-[11px] text-gray-500">
          {message.body}
        </span>
      </div>
    );
  }

  return (
    <div
      ref={(el) => registerRef(message.id, el)}
      className={`group flex w-full ${isMine ? "justify-end" : "justify-start"}`}
    >
      <div className={`flex max-w-[78%] items-end gap-2 ${isMine ? "flex-row-reverse" : ""}`}>
        <div
          className={`relative rounded-2xl px-3 py-2 text-sm transition-colors ${
            isMine ? "bg-purple-100" : "bg-gray-100"
          } ${highlighted ? "ring-2 ring-purple-400" : ""}`}
        >
          {!isMine && message.senderName && (
            <div className="mb-0.5 text-xs font-semibold text-gray-700">
              {message.senderName}
            </div>
          )}

          {message.replyToId && (message.replyPreview || message.replySender) && (
            <button
              type="button"
              onClick={() => onJumpTo(message.replyToId!)}
              className="mb-1 flex w-full flex-col items-start rounded-lg border-l-2 border-purple-400 bg-black/5 px-2 py-1 text-left"
            >
              <span className="text-[11px] font-semibold text-purple-600">
                {message.replySender ?? "Message"}
              </span>
              <span className="line-clamp-2 text-[11px] text-gray-600">
                {message.replyPreview}
              </span>
            </button>
          )}

          {message.deletedAt ? (
            <span className="text-gray-400 italic">This message was deleted</span>
          ) : (
            <>
              {message.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={message.imageUrl}
                  alt="attachment"
                  className="mb-1 max-h-72 rounded-lg object-cover"
                />
              )}
              {message.body && (
                <MessageBody body={message.body} onOpenOrder={onOpenOrder} />
              )}
            </>
          )}

          <div className="mt-1 text-right text-[10px] text-gray-400">
            {formatBubbleTime(message.createdAt)}
          </div>
        </div>

        {!message.deletedAt && (
          <button
            type="button"
            onClick={() => onReply(message)}
            aria-label="Reply"
            className="mb-2 rounded-full p-1 text-gray-400 opacity-0 transition-opacity hover:bg-gray-100 hover:text-gray-600 group-hover:opacity-100"
          >
            <CornerUpLeft className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
