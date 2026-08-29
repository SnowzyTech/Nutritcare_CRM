import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getOversightThread } from "@/modules/chat/services/chat-oversight.service";
import { OversightThreadClient } from "../../_components/oversight-thread-client";

export const metadata: Metadata = { title: "Chat Oversight" };

type PageProps = { params: Promise<{ userId: string; conversationId: string }> };

export default async function OversightThreadPage({ params }: PageProps) {
  const { userId, conversationId } = await params;

  // Null covers all three failure modes with one 404: unknown conversation, an
  // AGENT_GROUP, or a conversation this staff member isn't part of.
  const thread = await getOversightThread(conversationId, userId);
  if (!thread) notFound();

  return (
    <OversightThreadClient
      conversationId={thread.conversationId}
      staff={thread.staff}
      peer={thread.peer}
      initialMessages={thread.messages}
      initialCursor={thread.nextCursor}
    />
  );
}
