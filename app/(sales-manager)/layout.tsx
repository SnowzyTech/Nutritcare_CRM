import { auth } from "@/lib/auth/auth";
import { SalesRepManagerSidebarClient } from "../(sales-rep-manager)/sales-rep-manager/sidebar-client";
import { MessageSquare } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSalesRepById } from "@/modules/users/services/users.service";
import { getRoleHome, isCompanySalesManager } from "@/lib/auth/role-routes";
import { CanManageProvider } from "../(sales-rep-manager)/sales-rep-manager/_lib/base-path";

/**
 * Dedicated dashboard for the company-wide Sales Rep Manager (role
 * SALES_REP_MANAGER). Shares every screen with the team-lead dashboard under
 * (sales-rep-manager), but lives at its own /sales-manager URL root and unlocks
 * company-manager-only powers (mark delivered/failed, team management).
 */
export default async function SalesManagerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const user = session?.user;

  // The dedicated SALES_REP_MANAGER plus SUPER_ADMIN (read-only oversight) may
  // view this dashboard. Mutating actions still re-check SALES_REP_MANAGER, and
  // the CanManageProvider hides those controls for the super-admin.
  if (!isCompanySalesManager(user?.role)) {
    redirect(getRoleHome(user?.role));
  }
  const canManage = user?.role === "SALES_REP_MANAGER";

  const userRecord = user?.id ? await getSalesRepById(user.id) : null;

  return (
    <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">
      <SalesRepManagerSidebarClient
        userName={user?.name ?? ""}
        userRole="Sales Rep Manager"
        userAvatar={userRecord?.avatarUrl ?? undefined}
      />
      <div className="flex flex-col flex-1 overflow-hidden relative">
        <header className="absolute top-0 right-0 left-0 h-16 md:h-20 px-4 md:px-8 flex justify-between items-center z-10 pointer-events-none">
          <div></div>
          <div className="flex items-center gap-3 md:gap-4 pointer-events-auto">
            <Link
              href="/chat"
              className="w-9 h-9 md:w-10 md:h-10 bg-purple-100 text-[#A020F0] rounded-full flex items-center justify-center hover:bg-purple-200 transition"
              title="Chat"
            >
              <MessageSquare size={18} fill="currentColor" />
            </Link>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 pt-20 md:p-8 pb-24 md:pb-8">
          <CanManageProvider value={canManage}>{children}</CanManageProvider>
        </main>
      </div>
    </div>
  );
}
