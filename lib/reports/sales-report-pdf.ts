/**
 * PDF export of a sales report — rendered from the SAME ReportDocument the page
 * shows, in the template's section order, using the shared jsPDF helpers in
 * lib/reports/report-pdf.ts (header, NGN-safe text, tables). Client-only.
 */

import { customerFeedbackStatusLabel } from "@/lib/orders/customer-feedback";
import type { ReportDocument, ReportNarrative } from "@/modules/reports/sales/types";

const ACTION_STATUS: Record<string, string> = { OPEN: "Open", IN_PROGRESS: "In progress", DONE: "Done" };

export async function exportSalesReportPdf(
  report: ReportDocument,
  narrative: ReportNarrative,
  meta: { submittedBy: string; statusLine: string | null },
): Promise<void> {
  const { createReportDoc, dataTable, saveReport } = await import("@/lib/reports/report-pdf");

  const doc = await createReportDoc({
    brand: "Nucle CRM",
    title: `${report.title}${report.filterSummary ? ` (filtered: ${report.filterSummary})` : ""}`,
    submittedBy: meta.submittedBy,
    periodLabel: report.periodLabel,
  });

  let n = 0;
  const heading = (h: string) => `${++n}. ${h}`;

  for (const s of report.sections) {
    switch (s.kind) {
      case "table":
        dataTable(doc, {
          heading: heading(s.heading),
          head: s.head,
          body: s.rows.map((r) => r.map((c) => c.v)),
          emptyText: s.emptyText,
          columnStyles: Object.fromEntries(s.head.slice(1).map((_, i) => [i + 1, { halign: "right" }])),
        });
        break;
      case "backlog":
        dataTable(doc, {
          heading: heading(s.heading),
          head: ["Status", "Number", "Age / Days", "Action / Owner"],
          body: s.rows.map((r) => {
            const w = narrative.backlog?.[r.key];
            const actionOwner = [w?.action, w?.owner ? `(${w.owner})` : ""].filter(Boolean).join(" ");
            return [r.label, r.number.v, r.age.v, actionOwner || "-"];
          }),
          columnStyles: { 1: { halign: "right" }, 2: { halign: "right" } },
        });
        break;
      case "feedback":
        dataTable(doc, {
          heading: heading(s.heading),
          head: ["Category", "Count"],
          body: s.summary.map((c) => [c.label, c.count]),
          columnStyles: { 1: { halign: "right" } },
        });
        dataTable(doc, {
          head: ["Category", "Customer Feedback", "Product", "Status / Action"],
          body: s.items.map((i) => [
            i.categoryLabel,
            `${i.message} (${i.orderNumber}, ${i.rep})`,
            i.product ?? "-",
            `${customerFeedbackStatusLabel(i.status)}${i.action ? ` - ${i.action}` : ""}`,
          ]),
          emptyText: "No customer feedback recorded in this period.",
        });
        break;
      case "actions":
        dataTable(doc, {
          heading: heading(s.heading),
          head: ["Issue", "Team / Location", "Impact", "Action Required", "Owner", "Status"],
          body: s.items.map((i) => [
            i.issue,
            i.teamOrLocation ?? "-",
            i.impact ?? "-",
            i.actionRequired ?? "-",
            i.owner ?? "-",
            ACTION_STATUS[i.status] ?? i.status,
          ]),
          emptyText: "No open challenges.",
        });
        break;
      case "review":
        dataTable(doc, {
          heading: heading(s.heading),
          head: ["Area", "Summary", "Action Required"],
          body: s.areas.map((a) => {
            const w = narrative.review?.[a.key];
            return [a.label, w?.summary ?? a.prefill ?? "-", w?.action || "-"];
          }),
        });
        break;
    }
  }

  dataTable(doc, {
    heading: "Data Accuracy Checks",
    head: ["Check", "Flagged orders"],
    body: report.dataChecks.map((c) => [c.label, c.count]),
    columnStyles: { 1: { halign: "right" } },
  });

  if (meta.statusLine) {
    dataTable(doc, { head: ["Report status"], body: [[meta.statusLine]] });
  }

  const slug = { DAY: "sales-daily", WEEK: "sales-weekly", MONTH: "sales-monthly", QUARTER: "sales-quarterly" }[report.type];
  saveReport(doc, slug, report.periodLabel);
}
