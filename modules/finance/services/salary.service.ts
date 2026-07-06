import { prisma } from "@/lib/db/prisma";

// Payroll is monthly. A record's month is derived from its `date` (kept as
// "YYYY-MM") so we can group/filter without a schema change.
export const monthKey = (d: Date) => d.toISOString().slice(0, 7);

export function monthRange(month: string): { start: Date; end: Date } {
  const [y, m] = month.split("-").map(Number);
  return {
    start: new Date(Date.UTC(y, m - 1, 1)),
    end: new Date(Date.UTC(y, m, 1)),
  };
}

export async function listSalaryRecords(filters: {
  company?: string;
  department?: string;
  designation?: string;
  level?: string;
  search?: string;
  month?: string;
} = {}) {
  const monthWhere =
    filters.month && filters.month !== "All"
      ? (() => {
          const { start, end } = monthRange(filters.month!);
          return { date: { gte: start, lt: end } };
        })()
      : {};

  return prisma.salaryRecord.findMany({
    where: {
      ...(filters.company && filters.company !== "All" ? { company: filters.company } : {}),
      ...(filters.department && filters.department !== "All" ? { department: filters.department } : {}),
      ...(filters.designation && filters.designation !== "All" ? { designation: filters.designation } : {}),
      ...(filters.level && filters.level !== "All" ? { level: filters.level } : {}),
      ...(filters.search ? { name: { contains: filters.search, mode: "insensitive" } } : {}),
      ...monthWhere,
    },
    orderBy: { createdAt: "asc" },
    take: 500,
  });
}

// Distinct payroll months that have records, newest first ("YYYY-MM").
export async function listSalaryMonths(): Promise<string[]> {
  const rows = await prisma.salaryRecord.findMany({
    select: { date: true },
    orderBy: { date: "desc" },
    take: 2000,
  });
  const months = new Set(rows.map(r => monthKey(r.date)));
  return [...months].sort().reverse();
}
