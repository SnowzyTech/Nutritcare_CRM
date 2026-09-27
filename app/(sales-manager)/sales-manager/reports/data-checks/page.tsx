import type { Metadata } from "next";
import Link from "next/link";
import { ShieldAlert, ShieldCheck } from "lucide-react";
import {
  PERIOD_NOUN,
  PERIOD_TYPES,
  isPeriodType,
  nextPeriod,
  periodContaining,
  periodFromKey,
  previousPeriod,
  type PeriodType,
} from "@/lib/lagos-time";
import { cn } from "@/lib/utils";
import { drillHref, REPORTS_BASE } from "@/modules/reports/sales/drilldown";
import { filtersToParams, parseFilters } from "@/modules/reports/sales/filters";
import { DATA_CHECKS, OPEN_ORDERS } from "@/modules/reports/sales/views";
import { countGroup } from "@/modules/reports/sales/services/views.service";
import { getFilterOptions } from "@/modules/reports/sales/services/filter-options.service";
import { FilterBar } from "@/components/reports/sales/filter-bar";
import { PeriodNav } from "@/components/reports/sales/period-nav";

export const metadata: Metadata = { title: "Data checks" };
export const dynamic = "force-dynamic";

type SP = Record<string, string | string[] | undefined>;

const TYPE_LABEL: Record<PeriodType, string> = { DAY: "Day", WEEK: "Week", MONTH: "Month", QUARTER: "Quarter" };

/**
 * Template section 7 — data accuracy rules. Every check is a flag for review
 * with the exact orders behind it; nothing here changes any record.
 */
export default async function DataChecksPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const typeRaw = typeof sp.type === "string" ? sp.type : undefined;
  const type: PeriodType = isPeriodType(typeRaw) ? typeRaw : "MONTH";
  const period = periodFromKey(type, typeof sp.date === "string" ? sp.date : undefined);
  const filters = parseFilters(sp);

  const periodChecks = DATA_CHECKS.filter((c) => c.scope === "period");
  const openChecks = DATA_CHECKS.filter((c) => c.scope === "open");
  const [p, o, options] = await Promise.all([
    countGroup({ start: period.start, end: period.end }, undefined, filters, Object.fromEntries(periodChecks.map((c) => [c.key, c.where]))),
    countGroup({}, OPEN_ORDERS, filters, Object.fromEntries(openChecks.map((c) => [c.key, c.where]))),
    getFilterOptions(),
  ]);

  const href = (t: PeriodType, key: string) => {
    const params = filtersToParams(filters);
    params.set("type", t);
    params.set("date", key);
    return `${REPORTS_BASE}/data-checks?${params.toString()}`;
  };
  const current = periodContaining(type);

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Data checks</h1>
          <p className="mt-1 text-sm text-gray-500">
            Discrepancies are flagged for review — the system never changes or reconciles figures on its own.
          </p>
        </div>
        <PeriodNav
          label={period.label}
          noun={PERIOD_NOUN[type]}
          prevHref={href(type, previousPeriod(period).key)}
          nextHref={href(type, nextPeriod(period).key)}
          currentHref={href(type, current.key)}
          isCurrent={current.key === period.key}
        />
      </header>

      <div className="flex flex-wrap gap-1.5">
        {PERIOD_TYPES.map((t) => (
          <Link
            key={t}
            href={href(t, periodContaining(t, period.start).key)}
            className={cn(
              "rounded-lg border px-4 py-1.5 text-sm font-semibold",
              t === type ? "border-[#5C2B90] bg-[#5C2B90] text-white" : "border-gray-200 bg-white text-gray-600 hover:border-purple-300",
            )}
          >
            {TYPE_LABEL[t]}
          </Link>
        ))}
      </div>

      <FilterBar options={options} filters={filters} />

      <div className="grid gap-3 md:grid-cols-2">
        {DATA_CHECKS.map((c) => {
          const count = (c.scope === "period" ? p[c.key] : o[c.key])?.count ?? 0;
          return (
            <Link
              key={c.key}
              href={drillHref({ type, periodKey: period.key, view: `check:${c.key}`, filters })}
              prefetch={false}
              className={cn(
                "flex items-start justify-between gap-4 rounded-2xl border bg-white p-4 shadow-sm transition hover:border-purple-300",
                count > 0 ? "border-amber-200" : "border-gray-100",
              )}
            >
              <div className="flex gap-3">
                {count > 0 ? <ShieldAlert className="mt-0.5 shrink-0 text-amber-500" size={18} /> : <ShieldCheck className="mt-0.5 shrink-0 text-emerald-500" size={18} />}
                <div>
                  <p className="text-sm font-bold text-gray-800">{c.label}</p>
                  <p className="mt-0.5 text-xs text-gray-500">{c.description}</p>
                  <p className="mt-1 text-[11px] uppercase tracking-wide text-gray-400">
                    {c.scope === "open" ? "All open orders" : `Orders received · ${period.label}`}
                  </p>
                </div>
              </div>
              <span className={cn("text-2xl font-bold tabular-nums", count > 0 ? "text-amber-600" : "text-gray-300")}>{count}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
