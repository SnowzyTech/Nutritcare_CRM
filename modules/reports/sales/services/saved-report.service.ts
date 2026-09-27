import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import type { Period, PeriodType } from "@/lib/lagos-time";
import type {
  ReportDocument,
  ReportNarrative,
  ReportSnapshot,
  SavedReportState,
  SnapshotDiff,
} from "@/modules/reports/sales/types";

/**
 * Saved sales reports. The manager's written sections are stored as a draft;
 * submitting also stores a snapshot of every figure as it stood. A submitted
 * report shows its snapshot, and any later change in the live figures is
 * listed as a difference — never silently reconciled (template rule).
 */

export async function getSavedReport(type: PeriodType, periodKey: string): Promise<SavedReportState & { snapshot: ReportSnapshot | null }> {
  const r = await prisma.salesReport.findUnique({
    where: { periodType_periodStart: { periodType: type, periodStart: periodKey } },
    select: {
      status: true,
      narrative: true,
      figures: true,
      submittedAt: true,
      updatedAt: true,
      author: { select: { name: true } },
    },
  });
  if (!r) {
    return { status: "NONE", narrative: {}, submittedAt: null, authorName: null, updatedAt: null, snapshot: null };
  }
  return {
    status: r.status === "SUBMITTED" ? "SUBMITTED" : "DRAFT",
    narrative: (r.narrative ?? {}) as ReportNarrative,
    submittedAt: r.submittedAt?.toISOString() ?? null,
    authorName: r.author.name,
    updatedAt: r.updatedAt.toISOString(),
    snapshot: (r.figures ?? null) as ReportSnapshot | null,
  };
}

export async function saveDraft(period: Period, narrative: ReportNarrative, userId: string): Promise<"saved" | "locked"> {
  const existing = await prisma.salesReport.findUnique({
    where: { periodType_periodStart: { periodType: period.type, periodStart: period.key } },
    select: { status: true },
  });
  if (existing?.status === "SUBMITTED") return "locked";
  await prisma.salesReport.upsert({
    where: { periodType_periodStart: { periodType: period.type, periodStart: period.key } },
    create: {
      periodType: period.type,
      periodStart: period.key,
      narrative: narrative as Prisma.InputJsonValue,
      authorId: userId,
    },
    update: { narrative: narrative as Prisma.InputJsonValue, authorId: userId },
  });
  return "saved";
}

/** The numeric sections of a report — what a submission freezes. */
export function snapshotOf(doc: ReportDocument): ReportSnapshot {
  return {
    generatedAt: doc.generatedAt,
    sections: doc.sections.filter(
      (s): s is Extract<typeof s, { kind: "table" | "backlog" }> => s.kind === "table" || s.kind === "backlog",
    ),
  };
}

/** Submit (or re-submit) with the figures as they stand now. */
export async function submitReport(
  period: Period,
  narrative: ReportNarrative,
  doc: ReportDocument,
  userId: string,
): Promise<void> {
  const figures = snapshotOf(doc) as unknown as Prisma.InputJsonValue;
  await prisma.salesReport.upsert({
    where: { periodType_periodStart: { periodType: period.type, periodStart: period.key } },
    create: {
      periodType: period.type,
      periodStart: period.key,
      narrative: narrative as Prisma.InputJsonValue,
      figures,
      status: "SUBMITTED",
      submittedAt: new Date(),
      authorId: userId,
    },
    update: {
      narrative: narrative as Prisma.InputJsonValue,
      figures,
      status: "SUBMITTED",
      submittedAt: new Date(),
      authorId: userId,
    },
  });
}

/** Reopens a submitted report for editing (its snapshot is kept until re-submitted). */
export async function reopenReport(period: Period): Promise<void> {
  await prisma.salesReport.updateMany({
    where: { periodType: period.type, periodStart: period.key },
    data: { status: "DRAFT" },
  });
}

/** Every figure that differs between the submitted snapshot and the live document. */
export function diffSnapshot(snapshot: ReportSnapshot, live: ReportDocument): SnapshotDiff[] {
  const diffs: SnapshotDiff[] = [];
  const liveByKey = new Map(snapshotOf(live).sections.map((s) => [s.key, s]));

  for (const snap of snapshot.sections) {
    const cur = liveByKey.get(snap.key);
    if (!cur || cur.kind !== snap.kind) continue;

    if (snap.kind === "table" && cur.kind === "table") {
      const liveRows = new Map(cur.rows.map((r) => [r[0]?.v ?? "", r]));
      for (const row of snap.rows) {
        const label = row[0]?.v ?? "";
        const liveRow = liveRows.get(label);
        if (!liveRow) continue;
        row.forEach((cell, i) => {
          if (i === 0) return;
          const now = liveRow[i]?.v;
          if (now !== undefined && now !== cell.v) {
            diffs.push({ section: snap.heading, row: label, column: snap.head[i] ?? "", submitted: cell.v, live: now });
          }
        });
      }
    } else if (snap.kind === "backlog" && cur.kind === "backlog") {
      const liveRows = new Map(cur.rows.map((r) => [r.key, r]));
      for (const row of snap.rows) {
        const now = liveRows.get(row.key);
        if (now && now.number.v !== row.number.v) {
          diffs.push({ section: snap.heading, row: row.label, column: "Number", submitted: row.number.v, live: now.number.v });
        }
      }
    }
  }
  return diffs;
}

export async function listSavedReports(limit = 60) {
  return prisma.salesReport.findMany({
    orderBy: [{ periodStart: "desc" }, { periodType: "asc" }],
    take: limit,
    select: {
      id: true,
      periodType: true,
      periodStart: true,
      status: true,
      submittedAt: true,
      updatedAt: true,
      author: { select: { name: true } },
    },
  });
}
