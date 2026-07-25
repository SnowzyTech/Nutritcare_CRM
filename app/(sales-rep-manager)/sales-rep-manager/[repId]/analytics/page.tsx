import { notFound } from "next/navigation";
import { getSalesRepById, getSalesRepAnalytics } from "@/modules/users/services/users.service";
import { getTeamOrders } from "@/modules/orders/services/orders.service";
import { calculateBonus } from "@/lib/bonus";
import { AnalyticsPeriodToggle } from "../../analytics/period-toggle";
import { parseRange, resolveAnalyticsPeriod } from "../../analytics/analytics-period";
import { AnalyticsDashboardClient, AnalyticsData } from "../../analytics/analytics-dashboard-client";

export const dynamic = "force-dynamic";

function computeProductTables(orders: Array<{
  status: string;
  items: Array<{ productId: string; quantity: number; product: { name: string } }>;
}>) {
  const deliveredOrders = orders.filter(o => o.status === "DELIVERED");
  const productSales: Record<string, { name: string; qty: number }> = {};
  deliveredOrders.forEach(o => {
    o.items.forEach(item => {
      if (!productSales[item.productId]) productSales[item.productId] = { name: item.product.name, qty: 0 };
      productSales[item.productId].qty += item.quantity;
    });
  });
  const bestSellingTable = Object.values(productSales)
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 10)
    .map(p => ({ product: p.name, amountSold: p.qty }));

  const upsellCounts: Record<string, { name: string; count: number }> = {};
  orders.forEach(o => {
    if (o.items.length <= 1) return;
    o.items.forEach(item => {
      if (!upsellCounts[item.productId]) upsellCounts[item.productId] = { name: item.product.name, count: 0 };
      upsellCounts[item.productId].count++;
    });
  });
  const upsellingTable = Object.values(upsellCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
    .map(p => ({ product: p.name, noOfUpsell: p.count }));

  return { bestSellingTable, upsellingTable };
}

export default async function RepAnalyticsPage({
  params,
  searchParams,
}: {
  params: Promise<{ repId: string }>;
  searchParams: Promise<{ month?: string; range?: string }>;
}) {
  const { repId } = await params;
  const { month, range: rangeParam } = await searchParams;
  const range = parseRange(rangeParam);
  const { periodArg, currentStart, currentEnd, periodText, vsLabel, bonusPeriod, bonusPeriodLabel } =
    resolveAnalyticsPeriod(range, month);
  const rep = await getSalesRepById(repId);

  if (!rep) notFound();

  const [analytics, dbOrders] = await Promise.all([
    getSalesRepAnalytics(repId, periodArg),
    getTeamOrders([repId]),
  ]);

  const { current, trends } = analytics;

  // Scope the product tables to the selected window so they match the stat cards.
  const periodOrders = dbOrders.filter(
    o => o.createdAt >= currentStart && o.createdAt <= currentEnd
  );
  const tables = computeProductTables(periodOrders);

  const data: AnalyticsData = {
    monthLabel: periodText,
    vsLabel,
    totalProductsSold: {
      value: String(current.delivered),
      trend: trends.delivered,
    },
    totalOrderCustomer: {
      value: String(current.total),
      trend: trends.total,
    },
    bestSellingProduct: {
      name: current.bestProduct?.name ?? "—",
      subtitle: periodText,
    },
    generalPerformance: {
      value: `${current.generalPerformance}%`,
      trend: trends.generalPerformance,
    },
    upsellingRate: {
      value: `${current.upsellRate}%`,
      trend: trends.upsellRate,
    },
    confirmationRate: {
      value: `${current.confirmationRate}%`,
      trend: trends.confirmationRate,
    },
    deliveryRate: {
      value: `${current.deliveryRate}%`,
      trend: trends.deliveryRate,
    },
    cancellationRate: {
      value: `${current.cancellationRate}%`,
      trend: trends.cancellationRate,
    },
    recoveryRate: { value: `${current.recoveryRate}%`, trend: trends.recoveryRate },
    reorderRate: { value: `${current.reorderRate}%`, trend: trends.reorderRate },
    kpi: {
      value: `${current.kpi}%`,
      trend: trends.kpi,
      target: "65%",
      delivered: current.delivered,
      handled: current.total,
    },
    bonus: {
      ...(bonusPeriod
        ? calculateBonus(current.kpi, current.total, bonusPeriod)
        : { amount: 0, eligible: false, reason: "Bonuses apply to weekly/monthly periods" }),
      kpi: current.kpi,
      periodLabel: bonusPeriodLabel,
    },
    bestSellingTable: tables.bestSellingTable,
    upsellingTable: tables.upsellingTable,
  };

  return (
    <AnalyticsDashboardClient
      header={{
        type: "rep",
        repName: rep.name,
        repTeam: rep.team?.name ?? "No Team",
      }}
      data={data}
      monthSelector={<AnalyticsPeriodToggle />}
    />
  );
}
