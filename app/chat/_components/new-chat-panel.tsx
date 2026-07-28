"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Search, X } from "lucide-react";
import { searchDirectoryAction } from "@/modules/chat/actions/chat.action";
import type { DirectoryUser } from "@/modules/chat/services/conversations.service";
import { ChatAvatar, roleLabel, useOpenDirect } from "./chat-people";
import { useChatStore } from "./chat-store";

const DEBOUNCE_MS = 200;

/**
 * The people picker behind the ＋ button: search everyone, pick one, land in
 * the DM. It overlays the conversation-list pane rather than opening a modal,
 * so on mobile it reads as a full screen and on desktop it stays inside the
 * column it belongs to.
 */
export function NewChatPanel({ onClose }: { onClose: () => void }) {
  const { isOnline } = useChatStore();
  const { openDirect, pending, error } = useOpenDirect();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<DirectoryUser[]>([]);
  const [loading, setLoading] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // `loading` is raised by the keystroke handler (and starts true for the first
  // fetch), so the spinner covers the debounce window without this effect
  // having to set state on its way in.
  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      const res = await searchDirectoryAction(query);
      if (cancelled) return;
      setResults(res.ok ? res.data : []);
      setLoading(false);
    }, DEBOUNCE_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="absolute inset-0 z-20 flex flex-col bg-white">
      <header className="flex items-center gap-3 px-5 py-4">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="rounded-full p-1 text-gray-500 hover:bg-gray-100"
        >
          <X className="h-5 w-5" />
        </button>
        <h2 className="text-lg font-bold">New message</h2>
      </header>

      <div className="px-4 pb-3">
        <div className="flex items-center gap-2 rounded-full bg-gray-100 px-3 py-2">
          <Search className="h-4 w-4 text-gray-400" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setLoading(true);
            }}
            placeholder="Search people"
            className="w-full bg-transparent text-sm outline-none placeholder:text-gray-400"
          />
        </div>
      </div>

      {error && <p className="px-5 pb-2 text-xs text-red-500">{error}</p>}

      <div className="flex-1 overflow-y-auto">
        {loading && (
          <div className="flex justify-center py-6">
            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
          </div>
        )}
        {!loading && results.length === 0 && (
          <p className="px-5 py-6 text-sm text-gray-400">No one found.</p>
        )}
        {!loading &&
          results.map((u) => (
            <button
              key={u.id}
              type="button"
              disabled={pending}
              onClick={() => openDirect(u.id)}
              className="flex w-full items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-gray-50 disabled:opacity-60"
            >
              <ChatAvatar
                name={u.name}
                avatarUrl={u.avatarUrl}
                online={isOnline(u.id)}
                showPresence
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-gray-900">
                  {u.name}
                </span>
                <span className="block truncate text-xs text-gray-500">
                  {isOnline(u.id) ? "Online" : roleLabel(u.role)}
                </span>
              </span>
            </button>
          ))}
      </div>
    </div>
  );
}
