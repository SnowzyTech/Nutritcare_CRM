import React from "react";
import { InventoryStepper } from "@/components/dashboard/inventory/inventory-stepper";
import { StatsCard } from "@/components/dashboard/inventory/stats-card";
import { StockLevelsTable } from "@/components/dashboard/inventory/stock-levels-table";
import { StockMovementChart } from "@/components/dashboard/inventory/stock-movement-chart";
import { ReorderTable } from "@/components/dashboard/inventory/reorder-table";
import { AlertsList } from "@/components/dashboard/inventory/alerts-list";
import { inventoryStats } from "@/lib/mock-data/inventory";

export default function InventoryDashboardPage() {
  return (
    <div className="max-w-[1400px] mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Welcome Back, Felix</h1>
      </div>

      {/* Stepper */}
      <InventoryStepper />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard 
          label="Total SKUs" 
          value={inventoryStats.totalSkus.value} 
          status="Active" 
          statusColor="text-[#22C55E]"
          bgColor="bg-[#FDFBFF]"
        />
        <StatsCard 
          label="Low Stock Alerts" 
          value={inventoryStats.lowStock.value} 
          status="REORDER" 
          statusColor="text-[#F59E0B]"
          bgColor="bg-[#FFF4E5]"
        />
        <StatsCard 
          label="Expiring (7 Days )" 
          value={inventoryStats.expiring.value} 
          status="REVIEW" 
          statusColor="text-[#EF4444]"
          bgColor="bg-[#E8F0FF]"
        />
        <StatsCard 
          label="Open POs" 
          value={inventoryStats.openPos.value} 
          status="PENDING" 
          statusColor="text-white/90"
          bgColor="bg-[#FFB784]"
          textColor="text-white"
          labelColor="text-white/80"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-7 space-y-8">
          <StockLevelsTable />
          <ReorderTable />
        </div>

        {/* Right Column */}
        <div className="lg:col-span-5 space-y-8">
          <div className="h-[400px]">
            <StockMovementChart />
          </div>
          <AlertsList />
        </div>
      </div>
    </div>
  );
}
