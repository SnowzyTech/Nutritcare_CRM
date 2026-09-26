"use client";

import { cn } from "@/lib/utils";
import { useChatUnreadCount } from "./chat-unread-provider";

/**
 * Red unread-count bubble for a Chat icon. Renders nothing at 0. Position it
 * with `className` (e.g. `absolute -top-1 -right-1` inside a `relative` parent).
 */
export function ChatUnreadBadge({ className }: { className?: string }) {
  const count = useChatUnreadCount();
  if (count <= 0) return null;
  const label = count > 99 ? "99+" : String(count);
  return (
    <span
      aria-label={`${count} unread message${count === 1 ? "" : "s"}`}
      className={cn(
        "inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold leading-none border-2 border-white pointer-events-none",
        className,
      )}
    >
      {label}
    </span>
  );
}
