"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2, Download, Loader2, LockOpen, Send } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  reopenReportAction,
  saveReportDraftAction,
  submitReportAction,
} from "@/modules/reports/sales/actions/sales-reports.action";
import type {
  ReportDocument,
  ReportNarrative,
  SavedReportState,
  SnapshotDiff,
} from "@/modules/reports/sales/types";
import { ReportTable } from "./report-table";
import { ActionItemsTable, BacklogTable, FeedbackTable, ReviewTable } from "./narrative-sections";

const AUTOSAVE_MS = 1200;

/**
 * One sales report: the computed sections (read-only, every figure linked to its
 * orders), the manager's written sections (saved as a server draft while typing),
 * submit / reopen, the "figures changed since submission" banner, and PDF export.
 */
export function ReportWorkspace({
  report,
  saved,
  diffs,
  showingSnapshot,
  liveHref,
  snapshotHref,
  canManage,
  authorName,
}: {
  report: ReportDocument;
  saved: SavedReportState;
  diffs: SnapshotDiff[];
  /** True when the numeric sections come from the submitted snapshot. */
  showingSnapshot: boolean;
  liveHref: string;
  snapshotHref: string;
  canManage: boolean;
  authorName: string;
}) {
  const router = useRouter();
  const [narrative, setNarrative] = useState<ReportNarrative>(saved.narrative ?? {});
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [confirming, setConfirming] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [pending, start] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dirty = useRef(false);

  const submitted = saved.status === "SUBMITTED";
  const editable = canManage && !submitted && !report.filtered;
  const period = { type: report.type, date: report.periodKey };

  // Autosave the draft shortly after typing stops.
  useEffect(() => {
    if (!dirty.current || !editable) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      setSaveState("saving");
      const res = await saveReportDraftAction({ ...period, narrative });
      setSaveState(res.ok ? "saved" : "error");
      if (!res.ok) toast.error(res.error);
    }, AUTOSAVE_MS);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- period is derived from props that key this component
  }, [narrative, editable]);

  const setBacklog = useCallback((rowKey: string, field: "action" | "owner", value: string) => {
    dirty.current = true;
    setNarrative((n) => ({ ...n, backlog: { ...n.backlog, [rowKey]: { ...n.backlog?.[rowKey], [field]: value } } }));
  }, []);

  const setReview = useCallback((areaKey: string, field: "summary" | "action", value: string) => {
    dirty.current = true;
    setNarrative((n) => ({ ...n, review: { ...n.review, [areaKey]: { ...n.review?.[areaKey], [field]: value } } }));
  }, []);

  const withPrefills = (n: ReportNarrative): ReportNarrative => {
    const review = report.sections.find((s) => s.kind === "review");
    if (!review || review.kind !== "review") return n;
    const merged = { ...n.review };
    for (const a of review.areas) {
      if (merged[a.key]?.summary === undefined) merged[a.key] = { ...merged[a.key], summary: a.prefill };
    }
    return { ...n, review: merged };
  };

  const submit = () =>
    start(async () => {
      if (timer.current) clearTimeout(timer.current);
      const res = await submitReportAction({ ...period, narrative: withPrefills(narrative) });
      setConfirming(false);
      if (res.ok) {
        toast.success("Report submitted. Its figures are now frozen as submitted.");
        router.refresh();
      } else toast.error(res.error);
    });

  const reopen = () =>
    start(async () => {
      const res = await reopenReportAction(period);
      if (res.ok) {
        toast.success("Report reopened for editing.");
        router.refresh();
      } else toast.error(res.error);
    });

  const exportPdf = async () => {
    setExporting(true);
    try {
      const { exportSalesReportPdf } = await import("@/lib/reports/sales-report-pdf");
      const statusLine = submitted
        ? `Submitted by ${saved.authorName ?? "—"} on ${new Date(saved.submittedAt!).toLocaleString("en-NG", { timeZone: "Africa/Lagos" })}${
            showingSnapshot ? " — figures as submitted" : " — live figures"
          }`
        : "Draft — not yet submitted";
      await exportSalesReportPdf(report, withPrefills(narrative), { submittedBy: saved.authorName ?? authorName, statusLine });
    } catch (err) {
      console.error(err);
      toast.error("Could not generate the PDF.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Status / actions bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-sm">
        <div className="text-sm">
          {submitted ? (
            <span className="flex items-center gap-2 font-semibold text-emerald-700">
              <CheckCircle2 size={16} /> Submitted by {saved.authorName} ·{" "}
              {new Date(saved.submittedAt!).toLocaleString("en-NG", { timeZone: "Africa/Lagos", dateStyle: "medium", timeStyle: "short" })}
            </span>
          ) : report.filtered ? (
            <span className="text-gray-500">Filtered view — clear the filters to write or submit the report.</span>
          ) : (
            <span className="text-gray-500">
              {saved.status === "DRAFT" ? "Draft" : "Not started"}
              {editable && (
                <span className="ml-2 text-xs text-gray-400">
                  {saveState === "saving" ? "Saving…" : saveState === "saved" ? "All changes saved" : saveState === "error" ? "Not saved" : "Written sections save automatically"}
                </span>
              )}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {canManage && submitted && (
            <button type="button" onClick={reopen} disabled={pending} className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 hover:border-purple-300">
              <LockOpen size={15} /> Reopen
            </button>
          )}
          {editable &&
            (confirming ? (
              <>
                <button type="button" onClick={() => setConfirming(false)} className="rounded-lg px-3 py-2 text-sm text-gray-500">
                  Cancel
                </button>
                <button type="button" onClick={submit} disabled={pending} className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60">
                  {pending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />} Confirm — freeze figures & submit
                </button>
              </>
            ) : (
              <button type="button" onClick={() => setConfirming(true)} className="flex items-center gap-1.5 rounded-lg border border-emerald-600 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50">
                <Send size={15} /> Submit report
              </button>
            ))}
          <button type="button" onClick={exportPdf} disabled={exporting} className="flex items-center gap-1.5 rounded-lg bg-[#5C2B90] px-4 py-2 text-sm font-semibold text-white hover:bg-purple-800 disabled:opacity-60">
            {exporting ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />} Export PDF
          </button>
        </div>
      </div>

      {/* Submitted snapshot vs live (template: never silently reconcile) */}
      {submitted && !report.filtered && (
        <div className={cn("rounded-2xl border px-4 py-3 text-sm", diffs.length ? "border-amber-200 bg-amber-50" : "border-gray-100 bg-gray-50")}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className={cn("flex items-center gap-2 font-semibold", diffs.length ? "text-amber-800" : "text-gray-600")}>
              {diffs.length ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
              {showingSnapshot ? "Showing the figures as submitted." : "Showing live figures."}{" "}
              {diffs.length ? `${diffs.length} figure${diffs.length === 1 ? " has" : "s have"} changed since submission.` : "Live figures still match the submission."}
            </span>
            <Link href={showingSnapshot ? liveHref : snapshotHref} className="text-xs font-semibold text-[#5C2B90] hover:underline">
              {showingSnapshot ? "View live figures" : "View as submitted"}
            </Link>
          </div>
          {diffs.length > 0 && (
            <details className="mt-2">
              <summary className="cursor-pointer text-xs font-semibold text-amber-800">What changed</summary>
              <table className="mt-2 w-full text-xs">
                <thead>
                  <tr className="text-left text-amber-900">
                    <th className="py-1 pr-3">Section</th>
                    <th className="py-1 pr-3">Row</th>
                    <th className="py-1 pr-3">Column</th>
                    <th className="py-1 pr-3 text-right">Submitted</th>
                    <th className="py-1 text-right">Now</th>
                  </tr>
                </thead>
                <tbody>
                  {diffs.slice(0, 50).map((d, i) => (
                    <tr key={i} className="border-t border-amber-100 text-amber-900">
                      <td className="py-1 pr-3">{d.section}</td>
                      <td className="py-1 pr-3">{d.row}</td>
                      <td className="py-1 pr-3">{d.column}</td>
                      <td className="py-1 pr-3 text-right tabular-nums">{d.submitted}</td>
                      <td className="py-1 text-right tabular-nums font-semibold">{d.live}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </details>
          )}
        </div>
      )}

      {report.sections.map((s) => {
        switch (s.kind) {
          case "table":
            return <ReportTable key={s.key} section={s} />;
          case "backlog":
            return <BacklogTable key={s.key} section={s} values={narrative.backlog ?? {}} editable={editable} onChange={setBacklog} />;
          case "feedback":
            return <FeedbackTable key={s.key} section={s} canManage={canManage && !report.filtered} />;
          case "actions":
            return <ActionItemsTable key={s.key} section={s} canManage={canManage} />;
          case "review":
            return <ReviewTable key={s.key} section={s} values={narrative.review ?? {}} editable={editable} onChange={setReview} />;
        }
      })}
    </div>
  );
}
