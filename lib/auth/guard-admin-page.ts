import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { canAccessAdminPage, type AdminPageKey } from "./admin-pages";
import { isAdmin } from "./role-routes";

/**
 * Server-side guard for a revocable admin page. Reads the user's revoked-pages
 * list fresh from the DB on every render, so a SUPER_ADMIN's revocation takes
 * effect on the admin's very next navigation (no stale-token window).
 *
 * Call from the relevant section `layout.tsx` (or page) with its page key.
 */
export async function requireAdminPageAccess(pageKey: AdminPageKey): Promise<void> {
  const session = await auth();
  const role = session?.user?.role;

  if (!session?.user?.id) redirect("/login");
  // SUPER_ADMIN and non-admin roles (e.g. specialists reaching shared /chat) aren't
  // governed by per-admin revocation; middleware already gates admin-only routes.
  if (!isAdmin(role) || role === "SUPER_ADMIN") return;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { revokedAdminPages: true },
  });

  if (!canAccessAdminPage(role, user?.revokedAdminPages ?? [], pageKey)) {
    redirect("/admin");
  }
}
