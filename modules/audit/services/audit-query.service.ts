import { prisma } from "@/lib/db/prisma";
import type { Prisma, UserRole } from "@prisma/client";
import {
  ROLE_TO_UI_DEPT,
  UI_DEPT_LABELS,
  rolesForDepartment,
} from "@/lib/staff-departments";

// ── Types ─────────────────────────────────────────────────────────────────────
export type AuditEntry = {
  id: string;
  dateTime: string;
  actorName: string;
  department: string;
  action: string;
  description: string;
  before?: string | null;
  after?: string | null;
};

export type AuditGroup = { label: string; date: string; entries: AuditEntry[] };

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtDateTime(date: Date): string {
  return date.toLocaleString("en-NG", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Human department label for an actor role. */
export function departmentLabel(role: string | null | undefined): string {
  if (!role) return "—";
  if (role === "ADMIN" || role === "SUPER_ADMIN") return "Admin";
  if (role === "MEDIA_BUYER") return "Media Buyer";
  const dept = ROLE_TO_UI_DEPT[role];
  return dept ? UI_DEPT_LABELS[dept] : role;
}

function str(v: unknown): string | null {
  if (typeof v === "string") return v;
  if (typeof v === "number") return String(v);
  return null;
}

type LogRow = {
  id: string;
  action: string;
  details: Prisma.JsonValue;
  createdAt: Date;
  actorName: string | null;
  actorRole: string | null;
};

function mapEntry(log: LogRow): AuditEntry {
  const details = (log.details ?? {}) as Record<string, unknown>;
  const description =
    typeof details.description === "string"
      ? details.description
      : `${log.action}`;
  return {
    id: log.id,
    dateTime: fmtDateTime(log.createdAt),
    actorName: log.actorName ?? "Unknown",
    department: departmentLabel(log.actorRole),
    action: log.action,
    description,
    before: str(details.before),
    after: str(details.after),
  };
}

/** Group audit rows into Today / A Day Ago / older buckets (newest first). */
function groupByDay(logs: LogRow[]): AuditGroup[] {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayStart = new Date(todayStart.getTime() - 86400000);

  const groups = new Map<string, AuditGroup>();
  for (const log of logs) {
    const d = log.createdAt;
    let label: string;
    let dateStr: string;
    if (d >= todayStart) {
      label = "Today";
      dateStr = todayStart.toLocaleDateString("en-NG", { month: "long", day: "numeric", year: "numeric" });
    } else if (d >= yesterdayStart) {
      label = "A Day Ago";
      dateStr = yesterdayStart.toLocaleDateString("en-NG", { month: "long", day: "numeric", year: "numeric" });
    } else {
      label = d.toLocaleDateString("en-NG", { month: "long", day: "numeric" });
      dateStr = d.toLocaleDateString("en-NG", { month: "long", day: "numeric", year: "numeric" });
    }
    if (!groups.has(label)) groups.set(label, { label, date: dateStr, entries: [] });
    groups.get(label)!.entries.push(mapEntry(log));
  }
  return [...groups.values()];
}

// ── Where builder ─────────────────────────────────────────────────────────────
export type ActivityFilters = {
  userId?: string; // exact actor (person filter) or Personal-tab self
  department?: string; // one of DEPARTMENT_FILTERS values
  dateFrom?: Date; // inclusive start day
  dateTo?: Date; // inclusive end day
  search?: string;
  excludeSuperAdmin?: boolean; // hide SUPER_ADMIN activity (for limited-admin viewers)
};

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function buildWhere(filters: ActivityFilters): Prisma.AuditLogWhereInput {
  const where: Prisma.AuditLogWhereInput = {};
  if (filters.userId) where.userId = filters.userId;

  if (filters.department && filters.department !== "ALL") {
    let roles = rolesForDepartment(filters.department);
    if (filters.excludeSuperAdmin) roles = roles.filter((r) => r !== "SUPER_ADMIN");
    where.actorRole = { in: roles };
  } else if (filters.excludeSuperAdmin) {
    // No department constraint → exclude super-admin rows across the board.
    where.NOT = { actorRole: "SUPER_ADMIN" };
  }

  if (filters.dateFrom || filters.dateTo) {
    const createdAt: Prisma.DateTimeFilter = {};
    if (filters.dateFrom) createdAt.gte = startOfDay(filters.dateFrom);
    if (filters.dateTo) {
      // Inclusive of the whole `to` day → strictly before the next day.
      createdAt.lt = new Date(startOfDay(filters.dateTo).getTime() + 86400000);
    }
    where.createdAt = createdAt;
  }

  if (filters.search) {
    const q = filters.search;
    where.OR = [
      { actorName: { contains: q, mode: "insensitive" } },
      { action: { contains: q, mode: "insensitive" } },
      { details: { path: ["description"], string_contains: q } },
    ];
  }

  return where;
}

/** Active staff belonging to a department filter value (for the person picker). */
export async function getStaffByDepartment(
  dept: string,
  excludeSuperAdmin = false
): Promise<{ id: string; name: string }[]> {
  if (!dept || dept === "ALL") return [];
  let roles = rolesForDepartment(dept);
  if (excludeSuperAdmin) roles = roles.filter((r) => r !== "SUPER_ADMIN");
  if (roles.length === 0) return [];
  return prisma.user.findMany({
    where: { role: { in: roles as UserRole[] }, isActive: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}

const SELECT = {
  id: true,
  action: true,
  details: true,
  createdAt: true,
  actorName: true,
  actorRole: true,
} as const;

// ── Public queries ────────────────────────────────────────────────────────────

/** The current user's own activity (Personal History tab). */
export async function getPersonalActivity(
  userId: string,
  filters: Omit<ActivityFilters, "userId" | "department"> = {}
): Promise<AuditGroup[]> {
  const logs = await prisma.auditLog.findMany({
    where: buildWhere({ ...filters, userId }),
    orderBy: { createdAt: "desc" },
    take: 200,
    select: SELECT,
  });
  return groupByDay(logs);
}

/** System-wide activity (General History tab), paginated by cursor. */
export async function getGeneralActivity(
  filters: ActivityFilters = {},
  opts: { cursor?: string; take?: number } = {}
): Promise<{ groups: AuditGroup[]; nextCursor: string | null }> {
  const take = opts.take ?? 50;
  const logs = await prisma.auditLog.findMany({
    where: buildWhere(filters),
    orderBy: { createdAt: "desc" },
    take: take + 1,
    ...(opts.cursor ? { cursor: { id: opts.cursor }, skip: 1 } : {}),
    select: SELECT,
  });

  const hasMore = logs.length > take;
  const page = hasMore ? logs.slice(0, take) : logs;
  const nextCursor = hasMore ? page[page.length - 1]!.id : null;
  return { groups: groupByDay(page), nextCursor };
}

/** Flat list of matching rows (used by CSV export — respects the same filters). */
export async function getActivityForExport(
  filters: ActivityFilters
): Promise<AuditEntry[]> {
  const logs = await prisma.auditLog.findMany({
    where: buildWhere(filters),
    orderBy: { createdAt: "desc" },
    take: 5000,
    select: SELECT,
  });
  return logs.map(mapEntry);
}

// ── Daily summary scoreboard ──────────────────────────────────────────────────
export type DailySummary = {
  totalActions: number;
  perDepartment: { label: string; count: number }[];
  deletions: number;
  totalDiscountValue: number;
  remittanceCount: number;
  remittanceTotal: number;
};

export async function getActivitySummary(
  filters: ActivityFilters = {}
): Promise<DailySummary> {
  // Reflect the current view. With no date range chosen, default the scoreboard
  // to today so it stays a meaningful "recent" snapshot rather than all-time.
  const f: ActivityFilters = { ...filters };
  if (!f.dateFrom && !f.dateTo) {
    const now = new Date();
    f.dateFrom = now;
    f.dateTo = now;
  }

  const logs = await prisma.auditLog.findMany({
    where: buildWhere(f),
    select: { action: true, actorRole: true, details: true },
  });

  const perDept = new Map<string, number>();
  let deletions = 0;
  let totalDiscountValue = 0;
  let remittanceCount = 0;
  let remittanceTotal = 0;

  for (const log of logs) {
    const label = departmentLabel(log.actorRole);
    perDept.set(label, (perDept.get(label) ?? 0) + 1);

    const action = log.action.toLowerCase();
    if (action.includes("delet")) deletions++;

    const details = (log.details ?? {}) as Record<string, unknown>;
    const amount = typeof details.amount === "number" ? details.amount : 0;
    if (log.action === "Discount") totalDiscountValue += amount;
    if (log.action === "Remittance") {
      remittanceCount++;
      remittanceTotal += amount;
    }
  }

  return {
    totalActions: logs.length,
    perDepartment: [...perDept.entries()]
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count),
    deletions,
    totalDiscountValue,
    remittanceCount,
    remittanceTotal,
  };
}
