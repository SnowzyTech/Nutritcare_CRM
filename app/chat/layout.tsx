import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { getRoleHome } from "@/lib/auth/role-routes";
import { listConversationsForUser } from "@/modules/chat/services/conversations.service";
import { ChatShell } from "./_components/chat-shell";

export const metadata: Metadata = {
  title: "Chat",
};

export default async function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const conversations = await listConversationsForUser(session.user.id);
  const homeHref = getRoleHome(session.user.role);

  return (
    <ChatShell conversations={conversations} homeHref={homeHref}>
      {children}
    </ChatShell>
  );
}
