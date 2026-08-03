import { auth } from "@/lib/auth/auth";
import { ReportView } from "@/components/reports/report-view";
import { PeriodSwitcher } from "@/components/reports/period-switcher";
import { LOGISTICS_MONTHLY } from "@/modules/reports/definitions";
import {
  monthLabel,
  monthRange,
  parseDayParam,
  previousMonthRange,
} from "@/modules/reports/services/period.service";
import {
  getAgentPerformance,
  getDeliveryBySku,
  getFieldStockByState,
  getLogisticsScorecard,
  getStateDeliveryPerformance,
  getStockAudit,
  getWarehouseDispatch,
  getWarehouseStock,
  NOT_TRACKED,
} from "@/modules/delivery/services/logistics-report.service";
import type { ReportTable } from "@/modules/reports/types";

export const dynamic = "force-dynamic";

function toParam(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}-01`;
}

export default async function LogisticsMonthlyReportPage({
  searchParams,
}: {
  // Next 16: searchParams is a Promise and must be awaited before reading it.
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const monthParam = typeof sp.month === "string" ? sp.month : undefined;

  const anchor = parseDayParam(monthParam);
  const current = monthRange(anchor);
  const prior = previousMonthRange(anchor);

  const [
    session,
    scorecard,
    bySku,
    byState,
    agents,
    dispatch,
    warehouseStock,
    fieldStock,
    audit,
  ] = await Promise.all([
    auth(),
    getLogisticsScorecard(current, prior),
    getDeliveryBySku(current, prior),
    getStateDeliveryPerformance(current),
    getAgentPerformance(current, prior),
    getWarehouseDispatch(current),
    getWarehouseStock(),
    getFieldStockByState(),
    getStockAudit(current),
  ]);

  const tables: ReportTable[] = [
    {
      key: "sku",
      heading: "Total Products Delivered by SKU",
      head: ["Product", "Units Delivered", "% of Total", "Prior Month"],
      body: bySku.map((r) => [
        r.product,
        r.unitsDelivered,
        `${r.sharePct.toFixed(1)}%`,
        r.priorUnits ?? "—",
      ]),
      emptyText: "No units delivered this month.",
    },
    {
      key: "states",
      heading: "State Delivery Performance (top 10)",
      head: ["State", "Orders Delivered", "Units Delivered", "Field Stock"],
      body: byState.slice(0, 10).map((r) => [
        r.state,
        r.ordersDelivered,
        r.unitsDelivered,
        r.fieldStock,
      ]),
      emptyText: "No deliveries recorded this month.",
    },
    {
      key: "agents",
      heading: "Delivery Agent Performance",
      head: ["Agent", "State", "Assigned", "Delivered", "Rate", "Units Held", "Status", "vs Prior"],
      body: agents.map((a) => [
        a.agent,
        a.state,
        a.assigned,
        a.delivered,
        `${a.ratePct.toFixed(1)}%`,
        a.unitsHeld,
        a.band,
        a.deltaPp === null ? "—" : `${a.deltaPp > 0 ? "+" : ""}${a.deltaPp.toFixed(1)}pp`,
      ]),
      emptyText: "No agent activity this month.",
    },
    {
      key: "dispatch",
      heading: "Warehouse Dispatch",
      head: ["Product", ...dispatch.warehouses, "Total"],
      body: dispatch.rows.map((r) => [
        r.product,
        ...dispatch.warehouses.map((w) => r.byWarehouse[w] ?? 0),
        r.total,
      ]),
      emptyText: "No dispatches recorded this month.",
    },
    {
      key: "warehouse-stock",
      heading: "Closing Warehouse Stock",
      head: ["Product", ...warehouseStock.warehouses, "Total"],
      body: warehouseStock.rows.map((r) => [
        r.product,
        ...warehouseStock.warehouses.map((w) => r.byWarehouse[w] ?? 0),
        r.total,
      ]),
      emptyText: "No warehouse stock on hand.",
    },
    {
      key: "field-stock",
      heading: "Agent Holding Stock by State",
      head: ["State", "Total Units"],
      body: fieldStock.map((r) => [r.state, r.totalUnits]),
      emptyText: "No stock held by agents.",
    },
    {
      key: "audit",
      // Flagged in the heading as well as the note below, because a variance
      // column that silently drifts is worse than no variance column.
      heading: "Stock Audit — PROVISIONAL (opening balance is reconstructed)",
      head: ["Product", "Opening", "Received", "Delivered", "Implied Close", "Actual Close", "Variance"],
      body: audit.map((r) => [
        r.product,
        r.opening,
        r.received,
        r.delivered,
        r.impliedClose,
        r.actualClose,
        r.variance,
      ]),
      emptyText: "No stock movement this month.",
    },
    {
      key: "shelf-life",
      heading: "Shelf Life / Time-Gone Analysis",
      head: [],
      body: [],
      notTrackedReason: NOT_TRACKED.shelfLife,
    },
    {
      key: "damage",
      heading: "Damage, Loss & Recovery Tracker",
      head: [],
      body: [],
      notTrackedReason: NOT_TRACKED.damage,
    },
  ];

  return (
    <ReportView
      slug="logistics-monthly"
      title="Monthly Logistics Report"
      submittedBy={session?.user?.name ?? "Logistics Manager"}
      periodLabel={monthLabel(current)}
      periodKey={toParam(anchor)}
      scorecard={scorecard.rows}
      scorecardCurrentLabel={monthLabel(current)}
      scorecardPriorLabel={monthLabel(prior)}
      tables={tables}
      narrative={LOGISTICS_MONTHLY}
      periodControl={
        <PeriodSwitcher
          unit="month"
          paramKey="month"
          current={toParam(anchor)}
          label={monthLabel(current)}
        />
      }
    />
  );
}
