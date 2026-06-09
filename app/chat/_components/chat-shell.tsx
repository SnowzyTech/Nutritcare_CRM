"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { ArrowLeft, AtSign, Search } from "lucide-react";
import { getInitials } from "@/lib/utils";
import type { ConversationListItem } from "@/modules/chat/services/conversations.service";

function formatListTime(d: Date | string | null): string {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  if (sameDay) {
    return date.toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" });
  }
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString("en-NG", { day: "2-digit", month: "short" });
}

export function ChatShell({
  conversations,
  homeHref,
  children,
}: {
  conversations: ConversationListItem[];
  currentUserId: string;
  homeHref: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const activeId = pathname.startsWith("/chat/") ? pathname.split("/")[2] : null;
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter((c) => c.title.toLowerCase().includes(q));
  }, [conversations, query]);

  return (
    <div className="flex h-screen bg-white text-gray-900">
      {/* Conversation list pane */}
      <aside
        className={`${
          activeId ? "hidden md:flex" : "flex"
        } w-full shrink-0 flex-col border-r border-gray-100 md:w-80 lg:w-96`}
      >
        <header className="flex items-center gap-3 px-5 py-4">
          <Link
            href={homeHref}
            aria-label="Back to dashboard"
            className="rounded-full p-1 text-gray-500 hover:bg-gray-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-xl font-bold">Chat</h1>
        </header>

        <div className="px-4 pb-3">
          <div className="flex items-center gap-2 rounded-full bg-gray-100 px-3 py-2">
            <Search className="h-4 w-4 text-gray-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="search the agent"
              className="w-full bg-transparent text-sm outline-none placeholder:text-gray-400"
            />
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto">
          {filtered.length === 0 && (
            <p className="px-5 py-6 text-sm text-gray-400">No conversations.</p>
          )}
          {filtered.map((c) => {
            const isActive = c.id === activeId;
            return (
              <Link
                key={c.id}
                href={`/chat/${c.id}`}
                className={`flex items-center gap-3 px-5 py-3 transition-colors ${
                  isActive ? "bg-purple-50" : "hover:bg-gray-50"
                }`}
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-purple-100 text-sm font-semibold text-purple-700">
                  {getInitials(c.title)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-semibold text-gray-900">
                      {c.title}
                    </span>
                    <span className="shrink-0 text-[11px] text-gray-400">
                      {formatListTime(c.lastMessageAt)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-xs text-gray-500">
                      {c.lastMessageSender ? `${c.lastMessageSender}: ` : ""}
                      {c.lastMessagePreview ?? "No messages yet"}
                    </span>
                    <span className="flex shrink-0 items-center gap-1">
                      {c.hasUnreadMention && (
                        <AtSign className="h-3.5 w-3.5 text-purple-600" />
                      )}
                      {c.unreadCount > 0 && (
                        <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-purple-600 px-1.5 text-[11px] font-semibold text-white">
                          {c.unreadCount > 99 ? "99+" : c.unreadCount}
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Thread pane */}
      <section className={`${activeId ? "flex" : "hidden md:flex"} min-w-0 flex-1`}>
        {children}
      </section>
    </div>
  );
}
