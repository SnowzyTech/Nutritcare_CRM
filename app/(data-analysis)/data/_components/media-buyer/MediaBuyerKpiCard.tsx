import type { MediaBuyerMetric } from "@/modules/data-analysis/services/media-buyer-analysis.service";

/** Signed percent delta, coloured. "—" when the previous window had no base. */
export function TrendDelta({ value }: { value: string }) {
  if (value === "—") {
    return <span className="text-xs font-semibold text-gray-300">—</span>;
  }
  const up = value.startsWith("+");
  return (
    <span className={`text-xs font-bold ${up ? "text-emerald-500" : "text-rose-500"}`}>
      {value}
    </span>
  );
}

/**
 * KPI tile for the media-buyer screens. The delta-capable cards elsewhere in
 * this route group are all page-local, so this one is shared across the
 * media-buyer summary and analytics pages.
 */
export function MediaBuyerKpiCard({
  label,
  value,
  metric,
  hint,
  highlight,
}: {
  label: string;
  value: string | number;
  metric?: MediaBuyerMetric;
  hint?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl p-5 border min-h-[118px] flex flex-col justify-between ${
        highlight
          ? "bg-gradient-to-br from-[#4c1178] via-[#3b0d63] to-[#2a0847] border-transparent text-white shadow-lg shadow-purple-200/60"
          : "bg-white border-gray-50 shadow-sm"
      }`}
    >
      <p
        className={`text-[11px] font-bold uppercase tracking-wider ${
          highlight ? "text-purple-100" : "text-gray-400"
        }`}
      >
        {label}
      </p>
      <div className="flex items-end justify-between gap-2 mt-3">
        <span
          className={`text-3xl font-black leading-none ${
            highlight ? "text-white" : "text-gray-800"
          }`}
        >
          {typeof value === "number" ? value.toLocaleString() : value}
        </span>
        {metric && <TrendDelta value={metric.delta} />}
      </div>
      {(hint || metric) && (
        <p className={`text-[11px] mt-2 ${highlight ? "text-purple-200" : "text-gray-400"}`}>
          {hint ?? `vs ${metric!.previous.toLocaleString()} last period`}
        </p>
      )}
    </div>
  );
}

/** The shared views → leads → delivered funnel bar. */
export function FunnelBar({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) {
  const pct = max > 0 ? Math.max(2, Math.round((value / max) * 100)) : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-500 font-medium">{label}</span>
        <span className="font-bold text-gray-700">{value.toLocaleString()}</span>
      </div>
      <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}
