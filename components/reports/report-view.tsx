"use client";

/**
 * Shared executive-report view.
 *
 * Renders the computed half read-only (scorecard + data tables) and the written
 * half as a form, then exports both to PDF through `lib/reports/report-pdf.ts`.
 *
 * Phase 1 does not persist submissions, so narrative answers are kept in
 * component state and mirrored to localStorage under
 * `report-draft:{slug}:{periodKey}` — otherwise a manager loses everything they
 * typed by navigating away.
 */

import { useCallback, useEffect, useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  NarrativeSectionDef,
  NarrativeValues,
  ReportTable,
  ScorecardRow,
} from "@/modules/reports/types";

export type ReportViewProps = {
  /** Used for the PDF filename and the draft key, e.g. "sales-weekly". */
  slug: string;
  title: string;
  submittedBy: string;
  periodLabel: string;
  /** Stable key for the period, so drafts don't leak across weeks. */
  periodKey: string;
  scorecard: ScorecardRow[];
  scorecardCurrentLabel?: string;
  scorecardPriorLabel?: string;
  /** Optional second scorecard, e.g. the MTD column on the daily reports. */
  secondaryScorecard?: { heading: string; rows: ScorecardRow[]; currentLabel?: string };
  tables: ReportTable[];
  narrative: NarrativeSectionDef[];
  /** Pre-written answers (e.g. the auto-detected biggest mover). */
  prefill?: NarrativeValues;
  /** Period switcher rendered above the report. */
  periodControl?: React.ReactNode;
};

const TREND_GLYPH = { up: "▲", down: "▼", flat: "—" } as const;

function TrendCell({ row }: { row: ScorecardRow }) {
  if (row.prior === null) return <span className="text-gray-300">—</span>;
  const colour =
    row.isGood === null ? "text-gray-400" : row.isGood ? "text-emerald-600" : "text-red-600";
  return (
    <span className={cn("font-semibold tabular-nums", colour)}>
      {TREND_GLYPH[row.trend]}
      {row.deltaPct !== null && ` ${Math.abs(row.deltaPct).toFixed(1)}%`}
    </span>
  );
}

function Scorecard({
  rows,
  currentLabel,
  priorLabel,
}: {
  rows: ScorecardRow[];
  currentLabel?: string;
  priorLabel?: string;
}) {
  const hasPrior = rows.some((r) => r.prior !== null);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-[#5C2B90] text-white">
            <th className="text-left px-4 py-2.5 font-semibold">KPI</th>
            <th className="text-right px-4 py-2.5 font-semibold">{currentLabel ?? "This Period"}</th>
            {hasPrior && (
              <>
                <th className="text-right px-4 py-2.5 font-semibold">{priorLabel ?? "Last Period"}</th>
                <th className="text-center px-4 py-2.5 font-semibold">Trend</th>
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.label} className={i % 2 ? "bg-purple-50/40" : "bg-white"}>
              <td className="px-4 py-2.5 text-gray-700">{row.label}</td>
              <td className="px-4 py-2.5 text-right font-semibold text-gray-900 tabular-nums">
                {row.currentDisplay}
              </td>
              {hasPrior && (
                <>
                  <td className="px-4 py-2.5 text-right text-gray-500 tabular-nums">
                    {row.priorDisplay ?? "—"}
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <TrendCell row={row} />
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DataTable({ table }: { table: ReportTable }) {
  if (table.notTrackedReason) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
        <p className="text-sm font-semibold text-amber-900">{table.heading}</p>
        <p className="mt-1 text-sm text-amber-800">Not tracked yet — {table.notTrackedReason}</p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-gray-700">
        {table.heading}
      </h3>
      {table.body.length === 0 ? (
        <p className="text-sm italic text-gray-400">
          {table.emptyText ?? "No data for this period."}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-100">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-600">
                {table.head.map((h) => (
                  <th key={h} className="px-3 py-2 text-left font-semibold whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.body.map((row, i) => (
                <tr key={i} className={i % 2 ? "bg-purple-50/30" : "bg-white"}>
                  {row.map((cell, j) => (
                    <td
                      key={j}
                      className={cn(
                        "px-3 py-2 whitespace-nowrap",
                        j === 0 ? "text-gray-700" : "text-right tabular-nums text-gray-900",
                      )}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function ReportView({
  slug,
  title,
  submittedBy,
  periodLabel,
  periodKey,
  scorecard,
  scorecardCurrentLabel,
  scorecardPriorLabel,
  secondaryScorecard,
  tables,
  narrative,
  prefill,
  periodControl,
}: ReportViewProps) {
  const draftKey = `report-draft:${slug}:${periodKey}`;
  const [values, setValues] = useState<NarrativeValues>(prefill ?? {});
  const [exporting, setExporting] = useState(false);

  // Restore any draft for this exact report + period. Runs on period change too,
  // so switching weeks swaps in that week's draft rather than carrying text over.
  //
  // This has to be a post-mount effect rather than a lazy useState initializer:
  // the server renders `prefill`, so reading localStorage during the first
  // client render would produce different textarea values and break hydration.
  // Restoring persisted state after mount is the one-shot sync-from-external-
  // system case the set-state-in-effect rule is warning about generally, so it
  // is disabled here deliberately rather than worked around.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = window.localStorage.getItem(draftKey);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setValues(saved ? { ...(prefill ?? {}), ...JSON.parse(saved) } : (prefill ?? {}));
    } catch {
      setValues(prefill ?? {});
    }
    // `prefill` is derived server-side and stable per period; keying on draftKey
    // alone keeps this from looping on every parent render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftKey]);

  const update = useCallback(
    (key: string, value: string) => {
      setValues((prev) => {
        const next = { ...prev, [key]: value };
        try {
          window.localStorage.setItem(draftKey, JSON.stringify(next));
        } catch {
          // Private mode or quota — the report still exports from state.
        }
        return next;
      });
    },
    [draftKey],
  );

  const onExport = useCallback(async () => {
    setExporting(true);
    try {
      const { createReportDoc, kpiTable, dataTable, narrativeSection, notTrackedSection, saveReport } =
        await import("@/lib/reports/report-pdf");

      const doc = await createReportDoc({ title, submittedBy, periodLabel });

      kpiTable(doc, scorecard, {
        heading: "1. Scorecard",
        currentLabel: scorecardCurrentLabel,
        priorLabel: scorecardPriorLabel,
      });

      if (secondaryScorecard) {
        kpiTable(doc, secondaryScorecard.rows, {
          heading: secondaryScorecard.heading,
          currentLabel: secondaryScorecard.currentLabel,
        });
      }

      for (const section of narrative) {
        narrativeSection(doc, {
          heading: section.heading,
          entries: section.fields.map((f) => ({
            question: f.question,
            answer: values[f.key] ?? "",
            bullets: f.kind === "bullets",
          })),
        });
      }

      for (const table of tables) {
        if (table.notTrackedReason) {
          notTrackedSection(doc, table.heading, table.notTrackedReason);
        } else {
          dataTable(doc, {
            heading: table.heading,
            head: table.head,
            body: table.body,
            emptyText: table.emptyText,
          });
        }
      }

      saveReport(doc, slug, periodKey);
    } finally {
      setExporting(false);
    }
  }, [
    narrative,
    periodKey,
    periodLabel,
    scorecard,
    scorecardCurrentLabel,
    scorecardPriorLabel,
    secondaryScorecard,
    slug,
    submittedBy,
    tables,
    title,
    values,
  ]);

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">{title}</h1>
          <p className="mt-1 text-sm text-gray-500">
            {submittedBy} · {periodLabel}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {periodControl}
          <button
            onClick={onExport}
            disabled={exporting}
            className="inline-flex items-center gap-2 rounded-lg bg-[#5C2B90] px-4 py-2 text-sm font-semibold text-white transition hover:bg-purple-800 disabled:opacity-60"
          >
            {exporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            Export PDF
          </button>
        </div>
      </header>

      <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-bold text-gray-800">Scorecard</h2>
        <Scorecard
          rows={scorecard}
          currentLabel={scorecardCurrentLabel}
          priorLabel={scorecardPriorLabel}
        />
        {secondaryScorecard && (
          <>
            <h2 className="mb-4 mt-8 text-lg font-bold text-gray-800">
              {secondaryScorecard.heading}
            </h2>
            <Scorecard
              rows={secondaryScorecard.rows}
              currentLabel={secondaryScorecard.currentLabel}
            />
          </>
        )}
      </section>

      {narrative.map((section) => (
        <section
          key={section.key}
          className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
        >
          <h2 className="mb-4 text-lg font-bold text-gray-800">{section.heading}</h2>
          <div className="space-y-5">
            {section.fields.map((field) => (
              <div key={field.key}>
                <label
                  htmlFor={field.key}
                  className="mb-1.5 block text-sm font-semibold text-gray-700"
                >
                  {field.question}
                </label>

                {field.kind === "choice" ? (
                  <div className="flex flex-wrap gap-2">
                    {(field.options ?? []).map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => update(field.key, opt)}
                        className={cn(
                          "rounded-lg border px-3 py-1.5 text-sm font-medium transition",
                          values[field.key] === opt
                            ? "border-[#5C2B90] bg-[#5C2B90] text-white"
                            : "border-gray-200 bg-white text-gray-600 hover:border-purple-300",
                        )}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                ) : (
                  <textarea
                    id={field.key}
                    rows={field.kind === "bullets" ? 4 : 3}
                    value={values[field.key] ?? ""}
                    onChange={(e) => update(field.key, e.target.value)}
                    placeholder={
                      field.placeholder ??
                      (field.kind === "bullets" ? "One point per line" : "Your answer")
                    }
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 outline-none transition focus:border-[#5C2B90] focus:ring-1 focus:ring-[#5C2B90]"
                  />
                )}
              </div>
            ))}
          </div>
        </section>
      ))}

      {tables.length > 0 && (
        <section className="space-y-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-800">Supporting Data</h2>
          {tables.map((table) => (
            <DataTable key={table.key} table={table} />
          ))}
        </section>
      )}

      <p className="pb-4 text-xs text-gray-400">
        Draft answers are saved in this browser only. Export the PDF to share this report.
      </p>
    </div>
  );
}
