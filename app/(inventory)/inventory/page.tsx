import React from "react";
import { auth } from "@/lib/auth/auth";
import { InventoryStepper } from "@/components/dashboard/inventory/inventory-stepper";
import { StatsCard } from "@/components/dashboard/inventory/stats-card";
import { StockLevelsTable } from "@/components/dashboard/inventory/stock-levels-table";
import { StockMovementChart } from "@/components/dashboard/inventory/stock-movement-chart";
import { ReorderTable } from "@/components/dashboard/inventory/reorder-table";
import { AlertsList } from "@/components/dashboard/inventory/alerts-list";
import { getInventoryDashboardData } from "@/modules/inventory/services/inventory.service";

export default async function InventoryDashboardPage() {
  const [session, data] = await Promise.all([
    auth(),
    getInventoryDashboardData(),
  ]);

  const firstName = session?.user?.name?.split(" ")[0] ?? "Manager";

  return (
    <div className="max-w-[1400px] mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">
          Welcome Back, {firstName}
        </h1>
      </div>

      <InventoryStepper />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          label="Total Stocks"
          value={String(data.totalSkus)}
          status="Active"
          statusColor="text-[#22C55E]"
          bgColor="bg-[#FDFBFF]"
        />
        <StatsCard
          label="Low Stock Alerts"
          value={String(data.lowStockCount)}
          status="REORDER"
          statusColor="text-[#F59E0B]"
          bgColor="bg-[#FFF4E5]"
        />
        <StatsCard
          label="Expiring (7 Days)"
          value="0"
          status="REVIEW"
          statusColor="text-[#EF4444]"
          bgColor="bg-[#E8F0FF]"
        />
        <StatsCard
          label="Outogoing Stock"
          value={String(data.openPoCount)}
          status="PENDING"
          statusColor="text-white/90"
          bgColor="bg-[#FFB784]"
          textColor="text-white"
          labelColor="text-white/80"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 space-y-8">
          <StockLevelsTable stocks={data.stockLevels} />
          <ReorderTable orders={data.reorderRows} />
        </div>

        <div className="lg:col-span-5 space-y-8">
          <div className="h-[400px]">
            <StockMovementChart
              data={data.chartData}
              receivedTotal={data.receivedTotal}
              dispatchedTotal={data.dispatchedTotal}
            />
          </div>
          <AlertsList alerts={data.alerts} />
        </div>
      </div>
    </div>
  );
}
