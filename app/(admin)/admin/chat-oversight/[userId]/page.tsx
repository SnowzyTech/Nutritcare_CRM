import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ChevronRight } from "lucide-react";
import {
  getOversightStaff,
  listDirectThreadsForStaff,
} from "@/modules/chat/services/chat-oversight.service";
import { ChatAvatar } from "@/app/chat/_components/chat-people";
import { roleLabel } from "@/lib/chat/role-label";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Chat Oversight" };

type PageProps = { params: Promise<{ userId: string }> };

export default async function StaffThreadsPage({ params }: PageProps) {
  const { userId } = await params;

  const staff = await getOversightStaff(userId);
  if (!staff) notFound();

  const threads = await listDirectThreadsForStaff(userId);

  return (
    <div className="p-6">
      <Link
        href="/admin/chat-oversight"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-purple-600"
      >
        <ArrowLeft className="h-4 w-4" />
        All staff
      </Link>

      <div className="mb-6 flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-5">
        <ChatAvatar name={staff.name} avatarUrl={staff.avatarUrl} size="lg" />
        <div>
          <h1 className="text-xl font-semibold text-gray-900">{staff.name}</h1>
          <p className="text-sm text-gray-500">{roleLabel(staff.role)}</p>
          <p className="mt-1 text-xs text-gray-400">
            {threads.length} direct {threads.length === 1 ? "message" : "messages"}
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        {threads.length === 0 ? (
          <p className="p-8 text-center text-sm text-gray-500">
            This staff member has no direct messages.
          </p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {threads.map((thread) => (
              <li key={thread.conversationId}>
                <Link
                  href={`/admin/chat-oversight/${userId}/${thread.conversationId}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-purple-50/60"
                >
                  <ChatAvatar
                    name={thread.peer?.name ?? "?"}
                    avatarUrl={thread.peer?.avatarUrl}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="truncate text-sm font-medium text-gray-900">
                        {thread.peer?.name ?? "Removed user"}
                      </p>
                      {thread.lastMessageAt && (
                        <span className="shrink-0 text-xs text-gray-400">
                          {formatDate(thread.lastMessageAt)}
                        </span>
                      )}
                    </div>
                    <p className="truncate text-xs text-gray-500">
                      {thread.lastMessageSender
                        ? `${thread.lastMessageSender}: `
                        : ""}
                      {thread.lastMessagePreview ?? "No messages"}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-gray-400">
                    {thread.messageCount} msg
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-gray-300" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
