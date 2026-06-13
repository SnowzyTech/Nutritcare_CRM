"use server";

import { z } from "zod";
import { auth } from "@/lib/auth/auth";
import {
  getMessages,
  getMessagesAround,
  sendMessage,
  markConversationRead,
  findFirstUnreadMention,
  type ChatMessage,
} from "../services/messages.service";
import {
  searchMembersForMention,
  searchOrdersForTag,
  getOrderTagSummary,
} from "../services/tags.service";
import { publishMessageCreated } from "@/lib/chat/socket";

type Result<T> = { ok: true; data: T } | { ok: false; error: string };

async function requireUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session.user.id;
}

const sendSchema = z.object({
  conversationId: z.string().min(1),
  body: z.string().max(8000).default(""),
  imageUrl: z.string().url().nullable().optional(),
  replyToId: z.string().min(1).nullable().optional(),
});

export async function sendMessageAction(
  input: z.infer<typeof sendSchema>
): Promise<Result<ChatMessage>> {
  try {
    const userId = await requireUserId();
    const data = sendSchema.parse(input);
    const { message, recipientUserIds } = await sendMessage({
      conversationId: data.conversationId,
      senderId: userId,
      body: data.body,
      imageUrl: data.imageUrl ?? null,
      replyToId: data.replyToId ?? null,
    });
    // Realtime fan-out (best-effort; no-op when the socket server is unset).
    await publishMessageCreated({
      conversationId: data.conversationId,
      recipientUserIds,
      message,
    });
    return { ok: true, data: message };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to send" };
  }
}

export async function markReadAction(conversationId: string): Promise<Result<true>> {
  try {
    const userId = await requireUserId();
    await markConversationRead(conversationId, userId);
    return { ok: true, data: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function loadMoreMessagesAction(
  conversationId: string,
  cursor: string
): Promise<Result<{ messages: ChatMessage[]; nextCursor: string | null }>> {
  try {
    const userId = await requireUserId();
    const data = await getMessages(conversationId, userId, cursor);
    return { ok: true, data };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function loadMessagesAroundAction(
  conversationId: string,
  anchorMessageId: string
): Promise<Result<{ messages: ChatMessage[] }>> {
  try {
    const userId = await requireUserId();
    const data = await getMessagesAround(conversationId, userId, anchorMessageId);
    if (!data) return { ok: false, error: "Message not found" };
    return { ok: true, data };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function firstUnreadMentionAction(
  conversationId: string
): Promise<Result<{ messageId: string | null }>> {
  try {
    const userId = await requireUserId();
    const messageId = await findFirstUnreadMention(conversationId, userId);
    return { ok: true, data: { messageId } };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function searchMentionAction(conversationId: string, q: string) {
  try {
    const userId = await requireUserId();
    const data = await searchMembersForMention(conversationId, userId, q.trim());
    return { ok: true as const, data };
  } catch {
    return { ok: false as const, error: "Failed" };
  }
}

export async function searchOrderTagAction(q: string) {
  try {
    await requireUserId();
    const data = await searchOrdersForTag(q.trim());
    return { ok: true as const, data };
  } catch {
    return { ok: false as const, error: "Failed" };
  }
}

export async function getOrderTagSummaryAction(orderId: string) {
  try {
    const userId = await requireUserId();
    const data = await getOrderTagSummary(orderId, userId);
    if (!data) return { ok: false as const, error: "Order not found" };
    return { ok: true as const, data };
  } catch {
    return { ok: false as const, error: "Failed" };
  }
}
