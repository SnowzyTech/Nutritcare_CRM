import { notFound } from "next/navigation";
import { getSalesRepById, getSalesRepAnalytics } from "@/modules/users/services/users.service";
import { getTeamOrders } from "@/modules/orders/services/orders.service";
import { monthRanges, parseMonthParam, monthLabel } from "@/lib/month-period";
import { calculateBonus } from "@/lib/bonus";
import { MonthSelect } from "@/app/(sales-rep)/sales-rep/analytics/month-select";
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
  searchParams: Promise<{ month?: string }>;
}) {
  const { repId } = await params;
  const { month } = await searchParams;
  const period = parseMonthParam(month);
  const rep = await getSalesRepById(repId);

  if (!rep) notFound();

  const [analytics, dbOrders] = await Promise.all([
    getSalesRepAnalytics(repId, period),
    getTeamOrders([repId]),
  ]);

  const { current, trends } = analytics;

  // Scope the product tables to the selected month so they match the stat cards
  // (which are month-scoped) and the sales-rep portal.
  const { currentStart, currentEnd } = monthRanges(period);
  const monthOrders = dbOrders.filter(
    o => o.createdAt >= currentStart && o.createdAt <= currentEnd
  );
  const tables = computeProductTables(monthOrders);

  const ml = monthLabel(period);
  const periodText = ml === "This Month" ? "this month" : `in ${ml}`;

  const data: AnalyticsData = {
    monthLabel: periodText,
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
      ...calculateBonus(current.kpi, current.total, "month"),
      kpi: current.kpi,
      periodLabel: "Monthly",
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
      monthSelector={<MonthSelect />}
    />
  );
}
