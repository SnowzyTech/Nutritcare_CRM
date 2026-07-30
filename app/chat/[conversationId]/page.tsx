import { notFound } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { getThreadForUser } from "@/modules/chat/services/messages.service";
import { ChatThread } from "../_components/chat-thread";

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const { conversationId } = await params;
  const session = await auth();
  if (!session?.user?.id) notFound();

  const thread = await getThreadForUser(conversationId, session.user.id);
  if (!thread) notFound();

  const { conversation, messages, nextCursor } = thread;
  const isDirect = conversation.type === "DIRECT";

  return (
    <ChatThread
      key={conversationId}
      conversationId={conversationId}
      // A DM is named after whoever you're talking to, resolved per-viewer
      // rather than denormalized onto the row.
      title={
        isDirect
          ? conversation.peer?.name ?? "Direct message"
          : conversation.title ?? conversation.agent?.companyName ?? "Conversation"
      }
      subtitle={isDirect ? null : conversation.agent?.state ?? null}
      isArchived={conversation.isArchived}
      currentUserId={session.user.id}
      initialMessages={messages}
      initialCursor={nextCursor}
      conversationType={conversation.type}
      peer={conversation.peer}
      memberUserIds={conversation.memberUserIds}
    />
  );
}
