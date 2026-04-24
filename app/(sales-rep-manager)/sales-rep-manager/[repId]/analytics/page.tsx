import { notFound } from "next/navigation";
import { getSalesRepById, getSalesRepAnalytics } from "@/modules/users/services/users.service";
import { getTeamOrders } from "@/modules/orders/services/orders.service";
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
}: {
  params: Promise<{ repId: string }>;
}) {
  const { repId } = await params;
  const rep = await getSalesRepById(repId);

  if (!rep) notFound();

  const [analytics, dbOrders] = await Promise.all([
    getSalesRepAnalytics(repId),
    getTeamOrders([repId]),
  ]);

  const { current, trends } = analytics;
  const tables = computeProductTables(dbOrders);

  const data: AnalyticsData = {
    totalProductsSold: {
      value: String(current.totalProductsSold),
      trend: trends.totalProductsSold,
    },
    totalOrderCustomer: {
      value: String(current.distinctCustomers),
      trend: trends.distinctCustomers,
    },
    bestSellingProduct: {
      name: current.bestProduct?.name ?? "—",
      subtitle: "this month",
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
    recoveryRate: { value: "—", trend: "—" },
    kpi: { value: "—", trend: "—", target: "—" },
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
      showReports={false}
    />
  );
}
