import { auth } from "@/lib/auth/auth";
import { SalesRepManagerSidebarClient } from "./sales-rep-manager/sidebar-client";
import { MessageSquare } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSalesRepById } from "@/modules/users/services/users.service";
import { getRoleHome } from "@/lib/auth/role-routes";

export default async function SalesRepManagerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const user = session?.user;

  const userRecord = user?.id ? await getSalesRepById(user.id) : null;
  if (!userRecord?.isTeamLead) {
    redirect(getRoleHome(user?.role));
  }

  return (
    <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">
      <SalesRepManagerSidebarClient
        userName={user?.name ?? ""}
        userRole={user?.role ?? "Sales Rep"}
        userAvatar={userRecord?.avatarUrl ?? undefined}
      />
      <div className="flex flex-col flex-1 overflow-hidden relative">
        <header className="absolute top-0 right-0 left-0 h-16 md:h-20 px-4 md:px-8 flex justify-between items-center z-10 pointer-events-none">
          <div></div>
          <div className="flex items-center gap-3 md:gap-4 pointer-events-auto">
            <Link
              href="/sales-rep"
              className="bg-gray-900 text-white px-3 md:px-4 py-2 rounded-xl text-xs md:text-sm font-semibold hover:bg-gray-800 transition flex items-center gap-2"
            >
              ← <span className="hidden sm:inline">Sales Rep Mode</span>
              <span className="sm:hidden">Rep Mode</span>
            </Link>
            <Link
              href="/chat"
              className="w-9 h-9 md:w-10 md:h-10 bg-purple-100 text-[#A020F0] rounded-full flex items-center justify-center hover:bg-purple-200 transition"
              title="Chat"
            >
              <MessageSquare size={18} fill="currentColor" />
            </Link>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 pt-20 md:p-8 pb-24 md:pb-8">{children}</main>
      </div>
    </div>
  );
}
