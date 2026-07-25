import type { Metadata } from "next";
import { auth } from "@/lib/auth/auth";
import {
  getGeneralActivity,
  getPersonalActivity,
  getDailySummary,
  DEPARTMENT_FILTERS,
} from "@/modules/audit/services/audit-query.service";
import { HistoryClient } from "./history-client";

export const metadata: Metadata = { title: "History" };

type PageProps = {
  searchParams: Promise<{
    tab?: string;
    department?: string;
    date?: string;
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
  const date = parseDate(params.date);
  const q = params.q?.trim() || undefined;

  const filters = { department, date, search: q };

  const [{ groups }, summary] =
    tab === "general"
      ? await Promise.all([
          getGeneralActivity(filters, { take: 200 }),
          getDailySummary(date),
        ])
      : [{ groups: await getPersonalActivity(userId, { date, search: q }) }, null];

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
      selectedDate={params.date ?? ""}
      search={params.q ?? ""}
      todayLabel={todayLabel}
    />
  );
}
