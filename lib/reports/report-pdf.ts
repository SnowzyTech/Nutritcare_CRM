/**
 * Shared report PDF renderer.
 *
 * Generalises the house style already established by `lib/analytics-report.ts`
 * and `lib/history-report-pdf.ts`: client-side dynamic `jspdf` +
 * `jspdf-autotable` import, purple header, per-page footer, `doc.save()`.
 * Those two generators are left as-is; new departmental reports build on the
 * primitives here so every exported document looks like the same family.
 *
 * Usage:
 *   const doc = await createReportDoc({ title, subtitle, meta });
 *   kpiTable(doc, rows);
 *   dataTable(doc, { heading, head, body });
 *   narrativeSection(doc, { heading, fields });
 *   saveReport(doc, "sales-weekly", periodLabel);
 */

import type { ScorecardRow, TrendDirection } from "@/modules/reports/types";

// jsPDF/autotable have no useful public types for the bits we reach into, and
// the project already casts these the same way in the two existing generators.
type Doc = {
  internal: { pageSize: { getWidth(): number; getHeight(): number } };
  lastAutoTable: { finalY: number };
  setTextColor(r: number, g?: number, b?: number): void;
  setDrawColor(r: number, g?: number, b?: number): void;
  setFont(name: string, style?: string): void;
  setFontSize(size: number): void;
  setLineWidth(w: number): void;
  text(text: string | string[], x: number, y: number, opts?: { align?: string }): void;
  line(x1: number, y1: number, x2: number, y2: number): void;
  splitTextToSize(text: string, maxWidth: number): string[];
  addPage(): void;
  setPage(n: number): void;
  getNumberOfPages(): number;
  save(name: string): void;
};

type AutoTable = (doc: Doc, options: Record<string, unknown>) => void;

export const BRAND_PURPLE: [number, number, number] = [124, 58, 173];
export const MARGIN_X = 40;
const ROW_TINT: [number, number, number] = [247, 243, 252];

/** Bottom of the last rendered autotable. */
function lastY(doc: Doc): number {
  return doc.lastAutoTable.finalY;
}

/**
 * jsPDF's built-in fonts don't include the Naira sign (U+20A6). Leaving it in
 * garbles the glyph AND breaks autotable's width measurement, so the cell won't
 * wrap and overflows its column. Swap for "NGN " which renders and measures
 * fine. Lifted verbatim from `lib/history-report-pdf.ts`.
 */
export function clean(s: string | null | undefined): string {
  return (s ?? "").replace(/₦\s?/g, "NGN ");
}

/** Naira amount for report tables — no decimals, thousands separated. */
export function money(amount: number): string {
  return `NGN ${Math.round(amount).toLocaleString("en-NG")}`;
}

export function percent(value: number, dp = 1): string {
  return `${value.toFixed(dp)}%`;
}

const TREND_GLYPH: Record<TrendDirection, string> = {
  // jsPDF's helvetica has no real arrow glyphs, so use ASCII that always renders.
  up: "^",
  down: "v",
  flat: "-",
};

export function trendLabel(direction: TrendDirection, deltaPct: number | null): string {
  const glyph = TREND_GLYPH[direction];
  if (deltaPct === null || direction === "flat") return glyph;
  return `${glyph} ${Math.abs(deltaPct).toFixed(1)}%`;
}

async function loadPdf() {
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default as unknown as AutoTable;
  return { jsPDF, autoTable };
}

let autoTableRef: AutoTable | null = null;

export type ReportDocMeta = {
  /** Big purple wordmark, e.g. "NutritCare CRM". */
  brand?: string;
  /** Report name under the wordmark, e.g. "Sales Weekly Performance Review". */
  title: string;
  /** Right-hand bold line, e.g. the submitting manager. */
  submittedBy?: string;
  /** Right-hand secondary line, e.g. "Week Ending: 25 July 2026". */
  periodLabel: string;
};

/**
 * Creates the document and draws the standard header block. Returns the doc with
 * the cursor parked below the header — subsequent primitives flow down the page.
 */
export async function createReportDoc(meta: ReportDocMeta): Promise<Doc> {
  const { jsPDF, autoTable } = await loadPdf();
  autoTableRef = autoTable;

  const doc = new jsPDF({ unit: "pt", format: "a4" }) as unknown as Doc;
  const pageWidth = doc.internal.pageSize.getWidth();

  const generatedAt = new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date());

  doc.setTextColor(...BRAND_PURPLE);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text(meta.brand ?? "NutritCare CRM", MARGIN_X, 50);

  doc.setTextColor(110, 110, 110);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.text(clean(meta.title), MARGIN_X, 68);

  if (meta.submittedBy) {
    doc.setTextColor(60, 60, 60);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(clean(meta.submittedBy), pageWidth - MARGIN_X, 50, { align: "right" });
  }
  doc.setFont("helvetica", "normal");
  doc.setTextColor(110, 110, 110);
  doc.setFontSize(10);
  doc.text(clean(meta.periodLabel), pageWidth - MARGIN_X, 66, { align: "right" });

  doc.setDrawColor(...BRAND_PURPLE);
  doc.setLineWidth(1.5);
  doc.line(MARGIN_X, 80, pageWidth - MARGIN_X, 80);

  doc.setTextColor(150, 150, 150);
  doc.setFontSize(8);
  doc.text(`Generated: ${generatedAt}`, MARGIN_X, 94);

  // Seed lastAutoTable so the first primitive has a cursor to flow from.
  (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable = { finalY: 100 };

  return doc;
}

function requireAutoTable(): AutoTable {
  if (!autoTableRef) {
    throw new Error("createReportDoc() must be called before rendering report sections.");
  }
  return autoTableRef;
}

/** Section heading; returns the y to start content at. */
function heading(doc: Doc, text: string, gap = 26): number {
  const y = lastY(doc) + gap;
  doc.setTextColor(80, 80, 80);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(clean(text), MARGIN_X, y);
  return y + 8;
}

/**
 * The KPI scorecard every executive report opens with: metric, current, prior,
 * trend. Prior and trend columns are dropped when no row carries a prior value
 * (e.g. the logistics daily report, which shows Today / MTD instead).
 */
export function kpiTable(
  doc: Doc,
  rows: ScorecardRow[],
  opts: { heading?: string; currentLabel?: string; priorLabel?: string } = {},
): void {
  const autoTable = requireAutoTable();
  const startY = opts.heading ? heading(doc, opts.heading) : lastY(doc) + 22;

  const hasPrior = rows.some((r) => r.priorDisplay !== null && r.priorDisplay !== undefined);

  const head = hasPrior
    ? [["KPI", opts.currentLabel ?? "This Period", opts.priorLabel ?? "Last Period", "Trend"]]
    : [["KPI", opts.currentLabel ?? "Value"]];

  const body = rows.map((r) =>
    hasPrior
      ? [clean(r.label), clean(r.currentDisplay), clean(r.priorDisplay ?? "-"), trendLabel(r.trend, r.deltaPct)]
      : [clean(r.label), clean(r.currentDisplay)],
  );

  autoTable(doc, {
    startY,
    head,
    body,
    theme: "grid",
    headStyles: { fillColor: BRAND_PURPLE, textColor: 255, fontStyle: "bold", fontSize: 9 },
    bodyStyles: { fontSize: 9.5, textColor: 40, cellPadding: 4 },
    alternateRowStyles: { fillColor: ROW_TINT },
    columnStyles: hasPrior
      ? { 1: { halign: "right" }, 2: { halign: "right" }, 3: { halign: "center" } }
      : { 1: { halign: "right" } },
    margin: { left: MARGIN_X, right: MARGIN_X },
  });
}

export type DataTableSpec = {
  heading?: string;
  head: string[];
  body: (string | number)[][];
  /** Shown instead of the table when `body` is empty. */
  emptyText?: string;
  /** Column index → style overrides, e.g. right-aligning numbers. */
  columnStyles?: Record<number, Record<string, unknown>>;
};

/** A plain data table — delivery summaries, agent performance, backlog, etc. */
export function dataTable(doc: Doc, spec: DataTableSpec): void {
  const autoTable = requireAutoTable();
  const startY = spec.heading ? heading(doc, spec.heading) : lastY(doc) + 22;

  if (spec.body.length === 0) {
    doc.setTextColor(150, 150, 150);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.text(spec.emptyText ?? "No data for this period.", MARGIN_X, startY + 8);
    (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable = {
      finalY: startY + 14,
    };
    return;
  }

  autoTable(doc, {
    startY,
    head: [spec.head.map(clean)],
    body: spec.body.map((row) => row.map((c) => clean(String(c)))),
    theme: "striped",
    headStyles: { fillColor: BRAND_PURPLE, textColor: 255, fontStyle: "bold", fontSize: 8.5 },
    bodyStyles: { fontSize: 8.5, textColor: 45, cellPadding: 3, overflow: "linebreak" },
    alternateRowStyles: { fillColor: ROW_TINT },
    columnStyles: spec.columnStyles ?? {},
    margin: { left: MARGIN_X, right: MARGIN_X },
  });
}

export type NarrativeEntry = {
  question: string;
  /** Free prose, or bullet lines. Empty entries render as "Not provided". */
  answer: string;
  /** Render the answer as a bullet list, splitting on newlines. */
  bullets?: boolean;
};

/**
 * The written half of an executive report. Wraps prose to the page width and
 * breaks to a new page when it would otherwise run off the bottom — autotable
 * handles that for tables, but free text needs it done by hand.
 */
export function narrativeSection(
  doc: Doc,
  spec: { heading: string; entries: NarrativeEntry[] },
): void {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const maxWidth = pageWidth - MARGIN_X * 2;
  const bottomLimit = pageHeight - 60;

  let y = heading(doc, spec.heading) + 6;

  const ensureRoom = (needed: number) => {
    if (y + needed > bottomLimit) {
      doc.addPage();
      y = 60;
    }
  };

  for (const entry of spec.entries) {
    ensureRoom(30);

    doc.setTextColor(60, 60, 60);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    const qLines = doc.splitTextToSize(clean(entry.question), maxWidth);
    doc.text(qLines, MARGIN_X, y);
    y += qLines.length * 12 + 4;

    doc.setTextColor(70, 70, 70);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);

    const answer = entry.answer.trim();
    if (!answer) {
      doc.setTextColor(160, 160, 160);
      doc.setFont("helvetica", "italic");
      ensureRoom(14);
      doc.text("Not provided.", MARGIN_X + 10, y);
      y += 20;
      continue;
    }

    const paragraphs = entry.bullets
      ? answer.split("\n").map((l) => l.trim()).filter(Boolean)
      : [answer];

    for (const para of paragraphs) {
      const text = entry.bullets ? `-  ${para}` : para;
      const lines = doc.splitTextToSize(clean(text), maxWidth - 12);
      ensureRoom(lines.length * 12);
      doc.text(lines, MARGIN_X + 10, y);
      y += lines.length * 12 + (entry.bullets ? 2 : 6);
    }
    y += 10;
  }

  (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable = { finalY: y };
}

/**
 * A callout for report sections whose data the system doesn't track yet, so the
 * reader sees an explicit gap rather than a table of zeros.
 */
export function notTrackedSection(doc: Doc, title: string, reason: string): void {
  const pageWidth = doc.internal.pageSize.getWidth();
  const y = heading(doc, title);

  doc.setTextColor(150, 150, 150);
  doc.setFont("helvetica", "italic");
  doc.setFontSize(9);
  const lines = doc.splitTextToSize(clean(reason), pageWidth - MARGIN_X * 2 - 12);
  doc.text(lines, MARGIN_X + 10, y + 8);

  (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable = {
    finalY: y + 8 + lines.length * 12,
  };
}

/** Draws the footer on every page and triggers the browser download. */
export function saveReport(doc: Doc, reportSlug: string, periodLabel: string): void {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageCount = doc.getNumberOfPages();

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const ph = doc.internal.pageSize.getHeight();
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.5);
    doc.line(MARGIN_X, ph - 30, pageWidth - MARGIN_X, ph - 30);
    doc.setTextColor(150, 150, 150);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text("NutritCare CRM - Confidential", MARGIN_X, ph - 18);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - MARGIN_X, ph - 18, { align: "right" });
  }

  const safePeriod = periodLabel.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "");
  doc.save(`NutritCare-${reportSlug}-${safePeriod}.pdf`);
}
