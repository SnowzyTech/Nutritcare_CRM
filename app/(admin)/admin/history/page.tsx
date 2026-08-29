import type { Metadata } from "next";
import { auth } from "@/lib/auth/auth";
import { isSuperAdmin } from "@/lib/auth/role-routes";
import {
  getGeneralActivity,
  getPersonalActivity,
  getActivitySummary,
  getStaffByDepartment,
  type ActivityFilters,
} from "@/modules/audit/services/audit-query.service";
import { DEPARTMENT_FILTERS } from "@/lib/staff-departments";
import { HistoryClient } from "./history-client";

export const metadata: Metadata = { title: "History" };

type PageProps = {
  searchParams: Promise<{
    tab?: string;
    department?: string;
    person?: string;
    from?: string;
    to?: string;
    q?: string;
  }>;
};

function parseDate(s?: string): Date | undefined {
  if (!s) return undefined;
  const d = new Date(`${s}T00:00:00`);
  return isNaN(d.getTime()) ? undefined : d;
}

export default async function HistoryPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const session = await auth();
  const userId = session?.user?.id ?? "";

  const tab = params.tab === "personal" ? "personal" : "general";
  const department = params.department ?? "ALL";
  const person = params.person || undefined;
  const dateFrom = parseDate(params.from);
  const dateTo = parseDate(params.to);
  const q = params.q?.trim() || undefined;

  // Limited admins (any non-super viewer) must not see super-admin activity.
  const excludeSuperAdmin = !isSuperAdmin(session?.user?.role);

  const filters: ActivityFilters =
    tab === "general"
      ? { department, userId: person, dateFrom, dateTo, search: q, excludeSuperAdmin }
      : { dateFrom, dateTo, search: q, excludeSuperAdmin };

  const [{ groups }, summary, staff] =
    tab === "general"
      ? await Promise.all([
          getGeneralActivity(filters, { take: 200 }),
          getActivitySummary(filters),
          getStaffByDepartment(department, excludeSuperAdmin),
        ])
      : [
          { groups: await getPersonalActivity(userId, filters) },
          null,
          [] as { id: string; name: string }[],
        ];

  const todayLabel = new Date().toLocaleDateString("en-NG", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <HistoryClient
      tab={tab}
      userId={userId}
      groups={groups}
      summary={summary}
      departments={DEPARTMENT_FILTERS}
      selectedDepartment={department}
      staff={staff}
      selectedPerson={person ?? ""}
      selectedFrom={params.from ?? ""}
      selectedTo={params.to ?? ""}
      search={params.q ?? ""}
      todayLabel={todayLabel}
    />
  );
}
