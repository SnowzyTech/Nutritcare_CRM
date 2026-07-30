import type { AuditEntry } from "@/modules/audit/services/audit-query.service";

export type HistoryReportMeta = {
  scope: string; // "General history" | "Personal history"
  rangeLabel: string;
  departmentLabel?: string;
  personLabel?: string;
  searchLabel?: string;
};

/**
 * Builds a multi-page vector PDF of the (filtered) activity history and triggers a
 * browser download. `jspdf-autotable` paginates the table automatically, so the
 * whole result set is included — not just the first screen. Mirrors the pattern in
 * `lib/analytics-report.ts`.
 */
export async function downloadHistoryReportPdf(
  rows: AuditEntry[],
  meta: HistoryReportMeta
) {
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginX = 40;
  const purple: [number, number, number] = [124, 58, 173];

  // jsPDF's built-in fonts don't include the Naira sign (₦, U+20A6); leaving it in
  // garbles the glyph AND breaks auto-table's width measurement (so the cell won't
  // wrap and overflows the column). Swap it for "NGN " which renders and measures fine.
  const clean = (s: string | null | undefined): string =>
    (s ?? "").replace(/₦\s?/g, "NGN ");

  const generatedAt = new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date());

  // ── Header ──
  doc.setTextColor(...purple);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("NutritCare CRM", marginX, 50);

  doc.setTextColor(110, 110, 110);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.text("History Report", marginX, 68);

  doc.setTextColor(60, 60, 60);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(meta.scope, pageWidth - marginX, 50, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setTextColor(110, 110, 110);
  doc.text(meta.rangeLabel, pageWidth - marginX, 66, { align: "right" });

  // Divider
  doc.setDrawColor(...purple);
  doc.setLineWidth(1.5);
  doc.line(marginX, 80, pageWidth - marginX, 80);

  // Filter summary + generated line
  const filterBits: string[] = [];
  if (meta.departmentLabel) filterBits.push(`Department: ${meta.departmentLabel}`);
  if (meta.personLabel) filterBits.push(`Staff: ${meta.personLabel}`);
  if (meta.searchLabel) filterBits.push(`Search: "${meta.searchLabel}"`);
  filterBits.push(`${rows.length} activit${rows.length === 1 ? "y" : "ies"}`);

  doc.setTextColor(90, 90, 90);
  doc.setFontSize(8.5);
  doc.text(filterBits.join("   ·   "), marginX, 96);
  doc.setTextColor(150, 150, 150);
  doc.text(`Generated: ${generatedAt}`, marginX, 108);

  // ── Table (auto-paginated) ──
  autoTable(doc, {
    startY: 122,
    head: [["Date & Time", "Name", "Department", "Action", "Description"]],
    body: rows.map((r) => {
      const change =
        r.before != null || r.after != null
          ? `  (${clean(r.before) || "—"} -> ${clean(r.after) || "—"})`
          : "";
      return [
        r.dateTime,
        clean(r.actorName),
        clean(r.department),
        clean(r.action),
        `${clean(r.description)}${change}`,
      ];
    }),
    theme: "grid",
    tableWidth: pageWidth - marginX * 2,
    headStyles: { fillColor: purple, textColor: 255, fontStyle: "bold", fontSize: 8.5 },
    bodyStyles: { fontSize: 8, textColor: 45, cellPadding: 3, overflow: "linebreak" },
    alternateRowStyles: { fillColor: [247, 243, 252] },
    columnStyles: {
      0: { cellWidth: 88 },
      1: { cellWidth: 92 },
      2: { cellWidth: 66 },
      3: { cellWidth: 66 },
      4: { cellWidth: "auto", overflow: "linebreak" },
    },
    margin: { left: marginX, right: marginX },
  });

  if (rows.length === 0) {
    const y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 24;
    doc.setTextColor(150, 150, 150);
    doc.setFontSize(10);
    doc.text("No activity matches these filters.", marginX, y);
  }

  // Footer on every page
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const ph = doc.internal.pageSize.getHeight();
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.5);
    doc.line(marginX, ph - 30, pageWidth - marginX, ph - 30);
    doc.setTextColor(150, 150, 150);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text("NutritCare CRM - Confidential", marginX, ph - 18);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - marginX, ph - 18, { align: "right" });
  }

  doc.save(`history-report-${Date.now()}.pdf`);
}
