"use server";

import { z } from "zod";
import { auth } from "@/lib/auth/auth";
import { isSuperAdmin } from "@/lib/auth/role-routes";
import { getOversightMessagesPage } from "../services/chat-oversight.service";
import type { ChatMessage } from "../services/messages.service";

type Result<T> = { ok: true; data: T } | { ok: false; error: string };

const loadSchema = z.object({
  conversationId: z.string().min(1),
  staffUserId: z.string().min(1),
  cursor: z.string().min(1).nullable().optional(),
});

/**
 * Load an older page of a staff member's DM transcript for the oversight view.
 *
 * The role check is re-derived from the session on every call — a server action
 * is a public endpoint, so the page-level guard proves nothing here.
 */
export async function loadOversightMessagesAction(
  input: z.infer<typeof loadSchema>
): Promise<Result<{ messages: ChatMessage[]; nextCursor: string | null }>> {
  try {
    const session = await auth();
    if (!session?.user?.id) return { ok: false, error: "Unauthorized" };
    if (!isSuperAdmin(session.user.role)) return { ok: false, error: "Forbidden" };

    const data = loadSchema.parse(input);
    const page = await getOversightMessagesPage(
      data.conversationId,
      data.staffUserId,
      data.cursor ?? undefined
    );
    if (!page) return { ok: false, error: "Conversation not found." };

    return { ok: true, data: page };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Could not load messages.",
    };
  }
}
