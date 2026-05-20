import type { Metadata } from "next";
import { auth } from "@/lib/auth/auth";
import { getUserById } from "@/modules/auth/services/auth.service";
import { getInitials } from "@/lib/utils";
import { AccountingSidebar } from "./accounting/_components/AccountingSidebar";

export const metadata: Metadata = {
  title: {
    default: "Accounting Dashboard",
    template: "%s | Nutricare CRM",
  },
};

export default async function AccountingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const userId = session?.user?.id;
  const dbUser = userId ? await getUserById(userId) : null;

  const user = {
    name: dbUser?.name ?? session?.user?.name ?? "Accountant",
    email: dbUser?.email ?? session?.user?.email ?? "",
    avatarUrl: dbUser?.avatarUrl ?? null,
    role: dbUser?.role ?? "ACCOUNTANT",
    initials: getInitials(dbUser?.name ?? session?.user?.name ?? ""),
  };

  return (
    <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">
      <AccountingSidebar user={user} />
      <div className="flex flex-col flex-1 overflow-hidden relative">
        <main className="flex-1 overflow-y-auto no-scrollbar">{children}</main>
      </div>
    </div>
  );
}
