import { notFound } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import {
  getConversationForUser,
} from "@/modules/chat/services/conversations.service";
import { getMessages } from "@/modules/chat/services/messages.service";
import { ChatThread } from "../_components/chat-thread";

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const { conversationId } = await params;
  const session = await auth();
  if (!session?.user?.id) notFound();

  const conversation = await getConversationForUser(conversationId, session.user.id);
  if (!conversation) notFound();

  const { messages, nextCursor } = await getMessages(conversationId, session.user.id);

  return (
    <ChatThread
      key={conversationId}
      conversationId={conversationId}
      title={conversation.title ?? conversation.agent?.companyName ?? "Conversation"}
      subtitle={conversation.agent?.state ?? null}
      isArchived={conversation.isArchived}
      currentUserId={session.user.id}
      initialMessages={messages}
      initialCursor={nextCursor}
    />
  );
}
