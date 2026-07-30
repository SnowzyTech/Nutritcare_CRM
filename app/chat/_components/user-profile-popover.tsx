"use client";

import { useEffect } from "react";
import { Loader2, MessageCircle, X } from "lucide-react";
import { ChatAvatar, roleLabel, useOpenDirect } from "./chat-people";
import { useChatStore } from "./chat-store";

export type ProfileTarget = {
  id: string;
  name: string;
  avatarUrl: string | null;
  role?: string | null;
};

/**
 * The card you get by tapping someone in a group thread — the second way into
 * a DM, alongside the ＋ picker. Rendered from the thread (like OrderTagModal)
 * rather than from the bubble, so only one is ever mounted.
 */
export function UserProfilePopover({
  user,
  isSelf,
  onClose,
}: {
  user: ProfileTarget;
  isSelf: boolean;
  onClose: () => void;
}) {
  const { isOnline } = useChatStore();
  const { openDirect, pending, error } = useOpenDirect();
  const online = isOnline(user.id);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-label={user.name}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xs rounded-2xl bg-white p-5 shadow-xl"
      >
        <div className="flex items-start justify-between">
          <ChatAvatar
            name={user.name}
            avatarUrl={user.avatarUrl}
            size="lg"
            online={online}
            showPresence
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-1 text-gray-400 hover:bg-gray-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <h3 className="mt-3 truncate text-base font-semibold text-gray-900">
          {user.name}
        </h3>
        <p className="text-xs text-gray-500">{roleLabel(user.role)}</p>
        <p
          className={`mt-1 text-xs font-medium ${
            online ? "text-emerald-600" : "text-gray-400"
          }`}
        >
          {online ? "Online" : "Offline"}
        </p>

        {error && <p className="mt-2 text-xs text-red-500">{error}</p>}

        {!isSelf && (
          <button
            type="button"
            disabled={pending}
            onClick={() => openDirect(user.id)}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-purple-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-purple-700 disabled:opacity-60"
          >
            {pending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MessageCircle className="h-4 w-4" />
            )}
            Message
          </button>
        )}
      </div>
    </div>
  );
}
