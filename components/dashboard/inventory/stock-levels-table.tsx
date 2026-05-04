"use client";

import React from "react";
import { cn } from "@/lib/utils";
import type { StockLevelRow } from "@/modules/inventory/services/inventory.service";

export function StockLevelsTable({ stocks }: { stocks: StockLevelRow[] }) {
  return (
    <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
      <div className="bg-white px-6 py-4 flex justify-between items-center border-b border-gray-50">
        <h3 className="text-sm font-bold text-gray-400">Stock Levels</h3>
        <button className="bg-[#9D00FF] text-white text-[10px] font-bold px-5 py-2 rounded-lg hover:bg-[#8B00E0] transition-colors">
          Full Report &gt;
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-[10px] font-bold text-gray-500 uppercase tracking-wider bg-gray-50/80">
              <th className="px-6 py-4 w-10">
                <input type="checkbox" className="rounded border-gray-300 text-[#9D00FF] focus:ring-[#9D00FF]" />
              </th>
              <th className="px-4 py-4">SKU</th>
              <th className="px-4 py-4">PRODUCT</th>
              <th className="px-4 py-4">QTY</th>
              <th className="px-4 py-4">MIN</th>
              <th className="px-4 py-4">Status</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {stocks.map((item) => (
              <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4">
                  <input type="checkbox" className="rounded border-gray-300 text-[#9D00FF] focus:ring-[#9D00FF]" />
                </td>
                <td className="px-4 py-4 text-gray-500 font-medium">{item.sku}</td>
                <td className="px-4 py-4 text-gray-900 font-medium">{item.product}</td>
                <td className="px-4 py-4 text-gray-900 font-medium">{item.qty}</td>
                <td className="px-4 py-4 text-gray-500 font-medium">{item.min}</td>
                <td className="px-4 py-4">
                  <div
                    className={cn(
                      "text-[10px] font-bold text-center py-2 rounded-md w-20 text-white uppercase",
                      item.status === "OK" ? "bg-[#008037]" :
                      item.status === "Low" ? "bg-[#8B0000]" :
                      "bg-[#FFA500]"
                    )}
                  >
                    {item.status}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
