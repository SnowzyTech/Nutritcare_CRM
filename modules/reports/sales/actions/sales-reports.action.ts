"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth/auth";
import { PERIOD_TYPES, periodFromKey } from "@/lib/lagos-time";
import { CUSTOMER_FEEDBACK_ACTION_MAX, CUSTOMER_FEEDBACK_STATUS_VALUES } from "@/lib/orders/customer-feedback";
import { buildReport } from "@/modules/reports/sales/builders";
import { TARGET_METRIC_VALUES } from "@/modules/reports/sales/metrics";
import {
  ACTION_ITEM_STATUS_VALUES,
  createActionItem,
  updateActionItem,
} from "@/modules/reports/sales/services/action-items.service";
import { updateFeedbackStatus } from "@/modules/reports/sales/services/feedback.service";
import {
  reopenReport,
  saveDraft,
  submitReport,
} from "@/modules/reports/sales/services/saved-report.service";
import { copyPreviousTargets, saveTargets } from "@/modules/reports/sales/services/targets.service";
import type { ReportNarrative } from "@/modules/reports/sales/types";

/**
 * Sales-report writes. Only the company sales manager may write; a SUPER_ADMIN
 * viewing /sales-manager is read-only (same rule as the rest of that dashboard).
 */

type Result<T = undefined> = { ok: true; data: T } | { ok: false; error: string };

async function requireManager(): Promise<{ id: string } | null> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "SALES_REP_MANAGER") return null;
  return { id: session.user.id };
}

const FORBIDDEN = { ok: false as const, error: "Only the sales manager can change reports." };

function revalidateReports(): void {
  revalidatePath("/sales-manager/reports", "layout");
}

const periodSchema = z.object({
  type: z.enum(PERIOD_TYPES),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

const text = (max: number) => z.string().trim().max(max).optional();

const narrativeSchema = z.object({
  backlog: z.record(z.string().max(40), z.object({ action: text(500), owner: text(120) })).optional(),
  review: z.record(z.string().max(40), z.object({ summary: text(2000), action: text(1000) })).optional(),
});

export async function saveReportDraftAction(input: unknown): Promise<Result> {
  const user = await requireManager();
  if (!user) return FORBIDDEN;
  const parsed = periodSchema.extend({ narrative: narrativeSchema }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid report data." };
  const period = periodFromKey(parsed.data.type, parsed.data.date);
  const res = await saveDraft(period, parsed.data.narrative as ReportNarrative, user.id);
  if (res === "locked") return { ok: false, error: "This report is submitted. Reopen it to edit." };
  // No revalidation: a draft changes nothing else on screen, and a refresh would
  // re-render the editor under the manager's cursor.
  return { ok: true, data: undefined };
}

/**
 * Submits the report. The figures are rebuilt HERE from live data (never taken
 * from the client) for the unfiltered company report, and frozen as the snapshot.
 */
export async function submitReportAction(input: unknown): Promise<Result> {
  const user = await requireManager();
  if (!user) return FORBIDDEN;
  const parsed = periodSchema.extend({ narrative: narrativeSchema }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid report data." };
  const period = periodFromKey(parsed.data.type, parsed.data.date);
  try {
    const doc = await buildReport(period.type, period.key, {});
    await submitReport(period, parsed.data.narrative as ReportNarrative, doc, user.id);
  } catch (err) {
    console.error("[submitReportAction]", err);
    return { ok: false, error: "Could not submit the report. Please try again." };
  }
  revalidateReports();
  return { ok: true, data: undefined };
}

export async function reopenReportAction(input: unknown): Promise<Result> {
  const user = await requireManager();
  if (!user) return FORBIDDEN;
  const parsed = periodSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid period." };
  await reopenReport(periodFromKey(parsed.data.type, parsed.data.date));
  revalidateReports();
  return { ok: true, data: undefined };
}

// ── Targets ──────────────────────────────────────────────────────────────────

const targetsSchema = periodSchema.extend({
  entries: z
    .array(
      z.object({
        teamId: z.string().min(1).max(64),
        metric: z.enum(TARGET_METRIC_VALUES),
        value: z.number().finite().min(0).max(1e12).nullable(),
      }),
    )
    .max(500),
});

export async function saveTargetsAction(input: unknown): Promise<Result> {
  const user = await requireManager();
  if (!user) return FORBIDDEN;
  const parsed = targetsSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Targets must be numbers of zero or more." };
  const period = periodFromKey(parsed.data.type, parsed.data.date);
  await saveTargets(period, parsed.data.entries, user.id);
  revalidateReports();
  return { ok: true, data: undefined };
}

export async function copyPreviousTargetsAction(input: unknown): Promise<Result<number>> {
  const user = await requireManager();
  if (!user) return FORBIDDEN;
  const parsed = periodSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid period." };
  const copied = await copyPreviousTargets(periodFromKey(parsed.data.type, parsed.data.date), user.id);
  revalidateReports();
  return { ok: true, data: copied };
}

// ── Challenges / management action items ─────────────────────────────────────

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => (v === "" ? null : v))
    .nullable();

const actionItemSchema = z.object({
  issue: z.string().trim().min(1, "Describe the issue.").max(500),
  teamOrLocation: optionalText(120),
  impact: optionalText(300),
  actionRequired: optionalText(500),
  owner: optionalText(120),
  status: z.enum(ACTION_ITEM_STATUS_VALUES),
});

export async function createActionItemAction(input: unknown): Promise<Result> {
  const user = await requireManager();
  if (!user) return FORBIDDEN;
  const parsed = actionItemSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid item." };
  await createActionItem(parsed.data, user.id);
  revalidateReports();
  return { ok: true, data: undefined };
}

export async function updateActionItemAction(id: string, input: unknown): Promise<Result> {
  const user = await requireManager();
  if (!user) return FORBIDDEN;
  const parsed = actionItemSchema.safeParse(input);
  const idOk = z.string().min(1).max(64).safeParse(id);
  if (!parsed.success || !idOk.success) return { ok: false, error: parsed.success ? "Invalid item." : (parsed.error.issues[0]?.message ?? "Invalid item.") };
  const found = await updateActionItem(idOk.data, parsed.data);
  if (!found) return { ok: false, error: "That item no longer exists." };
  revalidateReports();
  return { ok: true, data: undefined };
}

// ── Customer feedback status / action ────────────────────────────────────────

export async function updateFeedbackStatusAction(input: unknown): Promise<Result> {
  const user = await requireManager();
  if (!user) return FORBIDDEN;
  const parsed = z
    .object({
      id: z.string().min(1).max(64),
      status: z.enum(CUSTOMER_FEEDBACK_STATUS_VALUES),
      action: optionalText(CUSTOMER_FEEDBACK_ACTION_MAX),
    })
    .safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid feedback update." };
  const found = await updateFeedbackStatus(parsed.data.id, parsed.data.status, parsed.data.action);
  if (!found) return { ok: false, error: "That feedback no longer exists." };
  revalidateReports();
  return { ok: true, data: undefined };
}
