import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { isAdmin } from "./role-routes";
import {
  ACCOUNTING_PERMISSION_KEYS,
  canAccessAccounting,
  type AccountingPermission,
} from "./accounting-permissions";

export type AccountingAccess = Record<AccountingPermission, boolean>;

/**
 * Per-feature accounting access for the current user, read fresh from the DB on
 * every render (so an admin's grant/revoke takes effect on the next navigation).
 * Admins get full access; accountants get exactly what they were granted.
 */
export async function getAccountingAccess(): Promise<AccountingAccess> {
  const session = await auth();
  const role = session?.user?.role;

  const granted =
    !isAdmin(role) && session?.user?.id
      ? (
          await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { accountingPermissions: true },
          })
        )?.accountingPermissions ?? []
      : [];

  return Object.fromEntries(
    ACCOUNTING_PERMISSION_KEYS.map((key) => [key, canAccessAccounting(role, granted, key)])
  ) as AccountingAccess;
}

/** Guard a gated accounting route — redirect to the dashboard if not permitted. */
export async function requireAccountingPermission(key: AccountingPermission): Promise<void> {
  const session = await auth();
  const role = session?.user?.role;

  if (!session?.user?.id) redirect("/login");
  if (isAdmin(role)) return;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { accountingPermissions: true },
  });

  if (!canAccessAccounting(role, user?.accountingPermissions ?? [], key)) {
    redirect("/accounting");
  }
}
