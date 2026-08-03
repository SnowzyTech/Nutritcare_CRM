/**
 * Shared shapes for the departmental reporting system.
 *
 * A report is a KPI scorecard (computed) plus narrative sections (written by the
 * submitting manager). Phase 1 generates and exports; nothing is persisted, so
 * these types describe the in-memory report only. See
 * docs/reports/ for the source documents these mirror.
 */

export type TrendDirection = "up" | "down" | "flat";

/** How a metric should be rendered — drives both the screen and the PDF. */
export type MetricFormat = "number" | "currency" | "percent" | "text";

/**
 * One line of an executive scorecard. Services compute the raw numbers and the
 * display strings together so the screen and the PDF can never disagree.
 */
export type ScorecardRow = {
  label: string;
  format: MetricFormat;
  current: number;
  currentDisplay: string;
  /** Null when there is no comparison period (e.g. a "Today / MTD" scorecard). */
  prior: number | null;
  priorDisplay: string | null;
  trend: TrendDirection;
  /** Percent change vs prior; null when prior is absent or zero. */
  deltaPct: number | null;
  /**
   * For rates where a fall is bad and a rise is good this is just `trend`, but
   * cancellations invert it — services set this so the UI can colour correctly
   * without re-deriving the polarity.
   */
  isGood: boolean | null;
};

/** A question put to the manager in a narrative section. */
export type NarrativeField = {
  key: string;
  question: string;
  kind: "text" | "bullets" | "choice";
  /** For `choice` fields, e.g. Low / Medium / High impact. */
  options?: string[];
  placeholder?: string;
};

export type NarrativeSectionDef = {
  key: string;
  heading: string;
  fields: NarrativeField[];
};

/** Manager-entered answers, keyed by `NarrativeField.key`. */
export type NarrativeValues = Record<string, string>;

/** A rendered data table, shared by the screen and the PDF export. */
export type ReportTable = {
  key: string;
  heading: string;
  head: string[];
  body: (string | number)[][];
  emptyText?: string;
  /** Set when the underlying data isn't tracked yet — renders as a callout. */
  notTrackedReason?: string;
};

export type ReportDefinition = {
  slug: string;
  title: string;
  narrative: NarrativeSectionDef[];
};
