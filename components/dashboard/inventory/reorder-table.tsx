"use client";

import React from "react";
import { cn } from "@/lib/utils";
import type { PurchaseOrderRow } from "@/modules/inventory/services/inventory.service";

export function ReorderTable({ orders }: { orders: PurchaseOrderRow[] }) {
  return (
    <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
      <div className="bg-white px-6 py-4 flex justify-between items-center border-b border-gray-50">
        <h3 className="text-sm font-bold text-gray-400">Reorder & Purchase orders</h3>
        <button className="bg-[#9D00FF] text-white text-[10px] font-bold px-6 py-2 rounded-lg hover:bg-[#8B00E0] transition-colors">
          +New PO
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="text-[10px] font-bold text-gray-500 uppercase tracking-wider bg-gray-50/80">
              <th className="px-6 py-4 w-10">
                <input type="checkbox" className="rounded border-gray-300 text-[#9D00FF] focus:ring-[#9D00FF]" />
              </th>
              <th className="px-4 py-4">PO #</th>
              <th className="px-4 py-4">SUPPLIER</th>
              <th className="px-4 py-4">ITEMS</th>
              <th className="px-4 py-4">DATE</th>
              <th className="px-4 py-4">STATUS</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {orders.map((order) => (
              <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4">
                  <input type="checkbox" className="rounded border-gray-300 text-[#9D00FF] focus:ring-[#9D00FF]" />
                </td>
                <td className="px-4 py-4 text-gray-500 font-medium">{order.poNumber}</td>
                <td className="px-4 py-4 text-gray-900 font-medium">{order.supplier}</td>
                <td className="px-4 py-4 text-gray-900 font-medium">{order.items}</td>
                <td className="px-4 py-4 text-gray-500 font-medium">{order.date}</td>
                <td className="px-4 py-4">
                  <div
                    className={cn(
                      "text-[10px] font-bold text-center py-1 rounded-full px-4 w-fit",
                      order.status === "In Transit"
                        ? "bg-[#F3E8FF] text-[#9D00FF]"
                        : "bg-[#FEF9C3] text-[#A16207]"
                    )}
                  >
                    {order.status}
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
