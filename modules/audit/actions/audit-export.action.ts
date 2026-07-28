"use server";

import { auth } from "@/lib/auth/auth";
import { isAdmin, isSuperAdmin } from "@/lib/auth/role-routes";
import {
  getActivityForExport,
  type ActivityFilters,
  type AuditEntry,
} from "../services/audit-query.service";

/**
 * Returns all audit rows matching the filters, for the downloadable PDF report.
 * Personal report passes `userId` (self); general report is admin-only.
 */
export async function getActivityReportRowsAction(
  filters: ActivityFilters
): Promise<{ rows: AuditEntry[] } | { error: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  // General (system-wide) report is admin-only; personal report is scoped to self.
  if (!filters.userId && !isAdmin(session.user.role)) {
    return { error: "Unauthorized" };
  }
  if (filters.userId && filters.userId !== session.user.id && !isAdmin(session.user.role)) {
    return { error: "Unauthorized" };
  }

  // Server-authoritative: a limited admin's report can never include super-admin
  // rows, regardless of what the client passed in `filters`.
  const rows = await getActivityForExport({
    ...filters,
    excludeSuperAdmin: !isSuperAdmin(session.user.role),
  });
  return { rows };
}
