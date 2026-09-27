import { prisma } from "@/lib/db/prisma";
import type { Period } from "@/lib/lagos-time";
import type { ActionItemRow } from "@/modules/reports/sales/types";

/**
 * "Challenges / Management Action" — tracked items that carry over from report
 * to report until closed. A period's report shows every item still open at its
 * end plus the ones closed during it.
 */

export const ACTION_ITEM_STATUSES = [
  { value: "OPEN", label: "Open" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "DONE", label: "Done" },
] as const;

export type ActionItemStatus = (typeof ACTION_ITEM_STATUSES)[number]["value"];

export const ACTION_ITEM_STATUS_VALUES = ACTION_ITEM_STATUSES.map((s) => s.value) as [
  ActionItemStatus,
  ...ActionItemStatus[],
];

export async function getActionItemsForPeriod(p: Period): Promise<ActionItemRow[]> {
  const rows = await prisma.salesActionItem.findMany({
    where: {
      createdAt: { lt: p.end },
      OR: [{ status: { not: "DONE" } }, { closedAt: { gte: p.start } }],
    },
    orderBy: [{ status: "asc" }, { createdAt: "asc" }],
    take: 200,
  });
  return rows.map((r) => ({
    id: r.id,
    issue: r.issue,
    teamOrLocation: r.teamOrLocation,
    impact: r.impact,
    actionRequired: r.actionRequired,
    owner: r.owner,
    status: r.status,
    createdAt: r.createdAt.toISOString(),
    closedAt: r.closedAt?.toISOString() ?? null,
  }));
}

export type ActionItemInput = {
  issue: string;
  teamOrLocation: string | null;
  impact: string | null;
  actionRequired: string | null;
  owner: string | null;
  status: ActionItemStatus;
};

export async function createActionItem(input: ActionItemInput, userId: string): Promise<void> {
  await prisma.salesActionItem.create({
    data: { ...input, createdById: userId, closedAt: input.status === "DONE" ? new Date() : null },
  });
}

export async function updateActionItem(id: string, input: ActionItemInput): Promise<boolean> {
  const existing = await prisma.salesActionItem.findUnique({ where: { id }, select: { status: true, closedAt: true } });
  if (!existing) return false;
  const closedAt =
    input.status === "DONE" ? (existing.status === "DONE" ? existing.closedAt : new Date()) : null;
  await prisma.salesActionItem.update({ where: { id }, data: { ...input, closedAt } });
  return true;
}
