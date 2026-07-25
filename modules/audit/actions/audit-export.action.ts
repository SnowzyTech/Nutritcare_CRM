"use server";

import { auth } from "@/lib/auth/auth";
import { isAdmin } from "@/lib/auth/role-routes";
import { getActivityForExport, type ActivityFilters } from "../services/audit-query.service";

function csvCell(value: string | null | undefined): string {
  const v = value ?? "";
  // Escape quotes and wrap in quotes if it contains a delimiter/newline.
  if (/[",\n]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
}

/**
 * Returns a CSV string of the audit activity matching the given filters.
 * Personal export passes `userId`; general export omits it (admin-only).
 */
export async function exportActivityCsvAction(
  filters: ActivityFilters
): Promise<{ csv: string } | { error: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  // General (system-wide) export is admin-only; personal export is scoped to self.
  if (!filters.userId && !isAdmin(session.user.role)) {
    return { error: "Unauthorized" };
  }
  if (filters.userId && filters.userId !== session.user.id && !isAdmin(session.user.role)) {
    return { error: "Unauthorized" };
  }

  const rows = await getActivityForExport(filters);
  const header = ["Date & Time", "Name", "Department", "Action", "Description", "Before", "After"];
  const lines = [header.join(",")];
  for (const r of rows) {
    lines.push(
      [
        csvCell(r.dateTime),
        csvCell(r.actorName),
        csvCell(r.department),
        csvCell(r.action),
        csvCell(r.description),
        csvCell(r.before),
        csvCell(r.after),
      ].join(",")
    );
  }
  return { csv: lines.join("\n") };
}
