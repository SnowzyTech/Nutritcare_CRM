"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Copy, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import type { PeriodType } from "@/lib/lagos-time";
import { formatCurrency } from "@/lib/utils";
import { TARGET_METRICS, type TargetMetric } from "@/modules/reports/sales/metrics";
import { copyPreviousTargetsAction, saveTargetsAction } from "@/modules/reports/sales/actions/sales-reports.action";

type Values = Record<string, Partial<Record<TargetMetric, number>>>;

const cellKey = (teamId: string, metric: TargetMetric) => `${teamId}|${metric}`;

function parse(v: string): number | undefined {
  return v.trim() === "" ? undefined : Number(v);
}

/** Teams × metrics target grid for one period. Only changed cells are sent on save. */
export function TargetsGrid({
  type,
  periodKey,
  periodLabel,
  teams,
  initial,
  canManage,
}: {
  type: PeriodType;
  periodKey: string;
  periodLabel: string;
  teams: { id: string; name: string }[];
  initial: Values;
  canManage: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [draft, setDraft] = useState<Record<string, string>>(() => {
    const d: Record<string, string> = {};
    for (const t of teams) {
      for (const m of TARGET_METRICS) {
        const v = initial[t.id]?.[m.value];
        d[cellKey(t.id, m.value)] = v === undefined ? "" : String(v);
      }
    }
    return d;
  });

  const changed = useMemo(
    () =>
      Object.entries(draft).filter(([k, v]) => {
        const [teamId, metric] = k.split("|") as [string, TargetMetric];
        return parse(v) !== initial[teamId]?.[metric];
      }),
    [draft, initial],
  );

  const isBad = (v: string) => v.trim() !== "" && (!Number.isFinite(Number(v)) || Number(v) < 0);
  const invalid = Object.values(draft).some(isBad);

  const totals = TARGET_METRICS.map((m) => {
    let sum = 0;
    let any = false;
    for (const t of teams) {
      const v = draft[cellKey(t.id, m.value)] ?? "";
      if (v.trim() && !isBad(v)) {
        sum += Number(v);
        any = true;
      }
    }
    return any ? sum : null;
  });

  const save = () =>
    start(async () => {
      const entries = changed.map(([k, v]) => {
        const [teamId, metric] = k.split("|") as [string, TargetMetric];
        return { teamId, metric, value: parse(v) ?? null };
      });
      const res = await saveTargetsAction({ type, date: periodKey, entries });
      if (res.ok) {
        toast.success("Targets saved");
        router.refresh();
      } else toast.error(res.error);
    });

  const copy = () =>
    start(async () => {
      const res = await copyPreviousTargetsAction({ type, date: periodKey });
      if (res.ok) {
        toast.success(
          res.data
            ? `Copied ${res.data} target${res.data === 1 ? "" : "s"} from the previous period`
            : "Nothing to copy — the previous period has no targets for the empty cells",
        );
        router.refresh();
      } else toast.error(res.error);
    });

  if (teams.length === 0) {
    return (
      <p className="rounded-2xl border border-gray-100 bg-white p-6 text-sm text-gray-500">
        No sales teams yet. Create teams under Teams first.
      </p>
    );
  }

  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-bold text-gray-800">Targets — {periodLabel}</h2>
        {canManage && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={copy}
              disabled={pending}
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 hover:border-purple-300 disabled:opacity-60"
            >
              <Copy size={15} /> Copy from previous period
            </button>
            <button
              type="button"
              onClick={save}
              disabled={pending || changed.length === 0 || invalid}
              className="flex items-center gap-1.5 rounded-lg bg-[#5C2B90] px-4 py-2 text-sm font-semibold text-white hover:bg-purple-800 disabled:opacity-50"
            >
              {pending ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Save
              {changed.length ? ` (${changed.length})` : ""}
            </button>
          </div>
        )}
      </div>
      <div className="overflow-x-auto rounded-lg border border-gray-100">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-[#5C2B90] text-white">
              <th className="px-3 py-2 text-left font-semibold">Team</th>
              {TARGET_METRICS.map((m) => (
                <th key={m.value} className="px-3 py-2 text-right font-semibold whitespace-nowrap">
                  {m.label}
                  {m.format === "currency" ? " (₦)" : ""}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {teams.map((t, i) => (
              <tr key={t.id} className={i % 2 ? "bg-purple-50/40" : "bg-white"}>
                <td className="px-3 py-2 font-medium text-gray-700 whitespace-nowrap">{t.name}</td>
                {TARGET_METRICS.map((m) => {
                  const k = cellKey(t.id, m.value);
                  const v = draft[k] ?? "";
                  return (
                    <td key={m.value} className="px-1.5 py-1.5">
                      <input
                        inputMode="decimal"
                        aria-label={`${t.name} ${m.label} target`}
                        disabled={!canManage}
                        value={v}
                        onChange={(e) => setDraft((d) => ({ ...d, [k]: e.target.value }))}
                        placeholder="—"
                        className={`w-28 rounded-md border px-2 py-1.5 text-right text-sm tabular-nums outline-none focus:border-[#5C2B90] disabled:bg-gray-50 ${
                          isBad(v) ? "border-red-400" : "border-gray-200"
                        }`}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
            <tr className="border-t-2 border-gray-200 bg-gray-50 font-semibold">
              <td className="px-3 py-2 text-gray-800">Company (sum)</td>
              {TARGET_METRICS.map((m, i) => {
                const total = totals[i];
                return (
                  <td key={m.value} className="px-3 py-2 text-right tabular-nums text-gray-800">
                    {total === null ? "—" : m.format === "currency" ? formatCurrency(total) : total.toLocaleString("en-NG")}
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>
      {!canManage && <p className="mt-3 text-xs text-gray-400">Read-only: only the sales manager can set targets.</p>}
    </section>
  );
}
