"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { openDirectAction } from "@/modules/chat/actions/chat.action";
import { getInitials } from "@/lib/utils";
import { useChatStore } from "./chat-store";

/**
 * Shared people bits for the chat surface: the avatar (with presence dot), the
 * role label, and the single code path for opening a DM. Every entry point —
 * the ＋ picker, the profile card off a message bubble — funnels through
 * `useOpenDirect` so "open the conversation with X" behaves identically
 * wherever it's triggered from.
 */

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrator",
  SALES_REP: "Sales Representative",
  SALES_REP_MANAGER: "Sales Rep Manager",
  DELIVERY_AGENT: "Delivery Agent",
  DATA_ANALYST: "Data Analyst",
  ACCOUNTANT: "Accountant",
  INVENTORY_MANAGER: "Inventory Manager",
  WAREHOUSE_MANAGER: "Warehouse Manager",
  LOGISTICS_MANAGER: "Logistics Manager",
  MEDIA_BUYER: "Media Buyer",
};

export function roleLabel(role: string | null | undefined): string {
  if (!role) return "";
  return ROLE_LABELS[role] ?? role.replaceAll("_", " ").toLowerCase();
}

const SIZES = {
  sm: "h-9 w-9 text-xs",
  md: "h-11 w-11 text-sm",
  lg: "h-14 w-14 text-base",
} as const;

const DOT_SIZES = {
  sm: "h-2.5 w-2.5",
  md: "h-3 w-3",
  lg: "h-3.5 w-3.5",
} as const;

export function ChatAvatar({
  name,
  avatarUrl,
  size = "md",
  online = false,
  showPresence = false,
}: {
  name: string;
  avatarUrl?: string | null;
  size?: keyof typeof SIZES;
  online?: boolean;
  showPresence?: boolean;
}) {
  return (
    <span className="relative inline-flex shrink-0">
      {avatarUrl ? (
        // Cloudinary isn't in next.config's remote allowlist, and neither is the
        // rest of the chat's user-supplied imagery — same as the message bubble.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatarUrl}
          alt=""
          className={`${SIZES[size]} rounded-full object-cover`}
        />
      ) : (
        <span
          className={`${SIZES[size]} flex items-center justify-center rounded-full bg-purple-100 font-semibold text-purple-700`}
        >
          {getInitials(name)}
        </span>
      )}
      {showPresence && online && (
        <span
          aria-label="Online"
          className={`${DOT_SIZES[size]} absolute bottom-0 right-0 rounded-full border-2 border-white bg-emerald-500`}
        />
      )}
    </span>
  );
}

/**
 * Open (creating on first use) the DM with a user and navigate to it. Returns
 * a pending flag so callers can disable their trigger while the round-trip is
 * in flight — double-clicking must not look broken, even though `directKey`
 * already guarantees it can't create two conversations.
 */
export function useOpenDirect(): {
  openDirect: (peerUserId: string) => Promise<void>;
  pending: boolean;
  error: string | null;
} {
  const router = useRouter();
  const { ensureConversation } = useChatStore();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openDirect = useCallback(
    async (peerUserId: string) => {
      setPending(true);
      setError(null);
      const res = await openDirectAction(peerUserId);
      setPending(false);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      // Seed the list so the new DM is visible immediately; it is filtered out
      // of the server-rendered list until it has a message.
      ensureConversation(res.data.conversationId);
      router.push(`/chat/${res.data.conversationId}`);
    },
    [ensureConversation, router]
  );

  return { openDirect, pending, error };
}
