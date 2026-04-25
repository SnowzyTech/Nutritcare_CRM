import { auth } from "@/lib/auth/auth";
import type { Metadata } from "next";
import Link from "next/link";
import { SalesRepSidebarClient } from "./sales-rep/sidebar-client";
import { getSalesRepById } from "@/modules/users/services/users.service";

export const metadata: Metadata = {
  title: {
    default: "Sales Rep Dashboard",
    template: "%s | Nutricare CRM",
  },
};

export default async function SalesRepLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const userId = session?.user?.id;

  const userRecord = userId ? await getSalesRepById(userId) : null;
  const isTeamLead = userRecord?.isTeamLead === true;

  return (
    <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">
      <SalesRepSidebarClient user={session?.user} />

      <div className="flex flex-col flex-1 overflow-hidden relative">
        {isTeamLead && (
          <header className="absolute top-0 right-0 left-0 h-20 px-8 flex justify-end items-center z-10 pointer-events-none">
            <div className="pointer-events-auto">
              <Link
                href="/sales-rep-manager"
                className="bg-gray-900 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-gray-800 transition flex items-center gap-2"
              >
                Manager Mode →
              </Link>
            </div>
          </header>
        )}
        <main className="flex-1 overflow-y-auto p-8">{children}</main>
      </div>
    </div>
  );
}
