import React from "react";
import { Warehouse, Users, Boxes } from "lucide-react";

interface Props {
  totalStockWithAgents: number;
  totalStockInWarehouse: number;
  totalStock: number;
  agentCount: number;
  warehouseCount: number;
}

export function StockSummaryCard({
  totalStockWithAgents,
  totalStockInWarehouse,
  totalStock,
  agentCount,
  warehouseCount,
}: Props) {
  const rows = [
    {
      key: "total",
      label: "Total Stock",
      value: totalStock,
      sub: "products in the system",
      icon: Boxes,
      iconBg: "bg-[#E6FBEA]",
      iconColor: "text-[#22C55E]",
    },
    {
      key: "warehouse",
      label: "Stock In Warehouse",
      value: totalStockInWarehouse,
      sub: `products across ${warehouseCount.toLocaleString()} warehouse${warehouseCount === 1 ? "" : "s"}`,
      icon: Warehouse,
      iconBg: "bg-[#E8F0FF]",
      iconColor: "text-[#2E85FF]",
    },
    {
      key: "agents",
      label: "Stock With Agents",
      value: totalStockWithAgents,
      sub: `products across ${agentCount.toLocaleString()} delivery agent${agentCount === 1 ? "" : "s"}`,
      icon: Users,
      iconBg: "bg-[#FFF4E5]",
      iconColor: "text-[#F59E0B]",
    },
  ];

  return (
    <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
      <div className="bg-white px-6 py-4 border-b border-gray-50">
        <h3 className="text-sm font-bold text-gray-400">Inventory Snapshot</h3>
      </div>
      <div className="divide-y divide-gray-50">
        {rows.map((row) => {
          const Icon = row.icon;
          return (
            <div key={row.key} className="flex items-center gap-4 px-6 py-5">
              <div className={`h-11 w-11 rounded-xl flex items-center justify-center ${row.iconBg}`}>
                <Icon className={`h-5 w-5 ${row.iconColor}`} />
              </div>
              <div className="flex-1">
                <div className="text-sm font-bold text-gray-700">{row.label}</div>
                <div className="text-[11px] font-medium text-gray-400">{row.sub}</div>
              </div>
              <div className="text-2xl font-black text-gray-800 tracking-tight">
                {row.value.toLocaleString()}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
