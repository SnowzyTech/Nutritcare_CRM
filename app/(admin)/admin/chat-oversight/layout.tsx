import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { getRoleHome, isSuperAdmin } from "@/lib/auth/role-routes";

/**
 * Chat oversight is SUPER_ADMIN-only and deliberately NOT part of the revocable
 * `ADMIN_PAGES` registry — a limited ADMIN can never be granted it. Guarded here
 * the same way `/admin/account` guards itself, so every nested route inherits it.
 */
export default async function ChatOversightLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!isSuperAdmin(session.user.role)) redirect(getRoleHome(session.user.role));

  return <>{children}</>;
}
