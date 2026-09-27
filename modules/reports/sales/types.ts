/**
 * The sales report document — ONE shape rendered three ways: on screen
 * (components/reports/sales/*), to PDF (lib/reports/sales-report-pdf.ts), and
 * as the submitted snapshot (`SalesReport.figures`). Building everything from
 * the same data is what keeps the page, the PDF and the snapshot identical.
 *
 * Plain types — safe to import from client + server.
 */

import type { PeriodType } from "@/lib/lagos-time";

export type CellTone = "good" | "bad" | "muted" | "warn";

export type Cell = {
  /** Display text. */
  v: string;
  /** Drill-down to the exact orders behind this figure (template: traceability). */
  href?: string;
  align?: "left" | "right" | "center";
  tone?: CellTone;
  bold?: boolean;
};

export type TableSection = {
  kind: "table";
  key: string;
  heading: string;
  note?: string;
  head: string[];
  rows: Cell[][];
  emptyText?: string;
};

/** Backlog table: numbers are computed; "Action / Owner" is written by the manager. */
export type BacklogSection = {
  kind: "backlog";
  key: string;
  heading: string;
  note?: string;
  rows: { key: string; label: string; number: Cell; age: Cell }[];
};

export type FeedbackItem = {
  id: string;
  category: string;
  categoryLabel: string;
  message: string;
  product: string | null;
  orderId: string;
  orderNumber: string;
  rep: string;
  status: string;
  action: string | null;
  createdAt: string;
};

export type FeedbackSection = {
  kind: "feedback";
  key: string;
  heading: string;
  /** Count per category, in template order. */
  summary: { category: string; label: string; count: number; href?: string }[];
  items: FeedbackItem[];
};

export type ActionItemRow = {
  id: string;
  issue: string;
  teamOrLocation: string | null;
  impact: string | null;
  actionRequired: string | null;
  owner: string | null;
  status: string;
  createdAt: string;
  closedAt: string | null;
};

export type ActionItemsSection = {
  kind: "actions";
  key: string;
  heading: string;
  items: ActionItemRow[];
};

/** Weekly Management Review — Summary + Action Required per area, written by the manager. */
export type ReviewSection = {
  kind: "review";
  key: string;
  heading: string;
  areas: { key: string; label: string; prefill: string }[];
};

export type ReportSection =
  | TableSection
  | BacklogSection
  | FeedbackSection
  | ActionItemsSection
  | ReviewSection;

/** Small counts strip of the data-accuracy checks shown on every report. */
export type DataCheckSummary = { key: string; label: string; count: number; href: string };

export type ReportDocument = {
  type: PeriodType;
  periodKey: string;
  title: string;
  periodLabel: string;
  /** True when filters narrow the report — targets are hidden and it cannot be submitted. */
  filtered: boolean;
  filterSummary: string | null;
  sections: ReportSection[];
  dataChecks: DataCheckSummary[];
  generatedAt: string;
};

/** Written parts of a saved report, keyed by section/row. */
export type ReportNarrative = {
  /** Backlog rows: action + owner per backlog row key. */
  backlog?: Record<string, { action?: string; owner?: string }>;
  /** Weekly Management Review: summary + action per area key. */
  review?: Record<string, { summary?: string; action?: string }>;
};

/** What `SalesReport.figures` stores at submission — the numeric sections only. */
export type ReportSnapshot = {
  generatedAt: string;
  sections: (TableSection | BacklogSection)[];
};

export type SavedReportState = {
  status: "NONE" | "DRAFT" | "SUBMITTED";
  narrative: ReportNarrative;
  submittedAt: string | null;
  authorName: string | null;
  updatedAt: string | null;
};

/** One figure that differs between the submitted snapshot and live data. */
export type SnapshotDiff = {
  section: string;
  row: string;
  column: string;
  submitted: string;
  live: string;
};
