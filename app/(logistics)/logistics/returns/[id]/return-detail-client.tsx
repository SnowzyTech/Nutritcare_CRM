"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Search, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ReturnedMovementDetail } from "@/modules/inventory/services/inventory.service";

const STATUS_COLORS: Record<string, string> = {
  Returned: "bg-[#22c55e]",
  Damaged: "bg-red-500",
  Draft: "bg-gray-400",
  Recorded: "bg-[#22c55e]",
};

export function LogisticsReturnDetailClient({ detail }: { detail: ReturnedMovementDetail }) {
  const router = useRouter();

  const statusColor = STATUS_COLORS[detail.status] ?? "bg-gray-400";
  const statusLabel = detail.status.toUpperCase();

  return (
    <div className="space-y-10 pb-20 pt-2">
      {/* Top Header */}
      <div className="flex items-center justify-between px-1">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-3 text-gray-500 font-bold hover:text-[#ad1df4] transition-all"
        >
          <div className="w-8 h-8 rounded-full border-2 border-gray-400 flex items-center justify-center">
            <ArrowLeft className="w-5 h-5" />
          </div>
          <span className="text-lg">Back</span>
        </button>

        <div className="relative w-[350px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
          <input
            type="text"
            placeholder="search"
            className="w-full pl-10 pr-4 py-2.5 text-lg border-none rounded-lg focus:outline-none bg-white/50 text-gray-400 placeholder:text-gray-300 shadow-sm border border-gray-50"
          />
        </div>
      </div>

      {/* Details Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-50 p-12 space-y-12 min-h-[600px] flex flex-col justify-between">
        <div className="flex justify-between items-start">
          {/* Left: Title & Badge */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-gray-800">Returned</h1>
            <p className="text-sm text-gray-400 font-medium">Voucher</p>
            <div className="mt-4">
              <span className={`px-3 py-1 ${statusColor} text-white text-[10px] font-bold rounded-sm`}>
                {statusLabel}
              </span>
            </div>
          </div>

          {/* Right: Info Grid */}
          <div className="grid grid-cols-2 gap-x-12 gap-y-4 text-sm w-[400px]">
            <div className="text-gray-500 font-bold">RS-ID:</div>
            <div className="text-gray-700 font-bold">{detail.rsId}</div>

            <div className="text-gray-500 font-bold">Agent:</div>
            <div className="text-gray-700 font-bold">{detail.agent}</div>

            <div className="text-gray-500 font-bold">Quantity Returned:</div>
            <div className="text-gray-700 font-bold">{detail.qtyReturned}</div>

            <div className="text-gray-500 font-bold">Status:</div>
            <div className="text-gray-700 font-bold">
              {detail.status === "Damaged" ? (
                <span><span className="text-gray-700">Da</span><span className="text-gray-400">maged</span></span>
              ) : detail.status}
            </div>

            <div className="text-gray-500 font-bold">Recorded By:</div>
            <div className="text-gray-700 font-bold">{detail.addedBy}</div>

            <div className="text-gray-500 font-bold">Date:</div>
            <div className="text-gray-700 font-bold">{detail.date}</div>

            {detail.remarks && (
              <>
                <div className="text-gray-500 font-bold">Remarks:</div>
                <div className="text-gray-700 font-bold">{detail.remarks}</div>
              </>
            )}
          </div>
        </div>

        {/* Products Table */}
        <div className="border border-gray-100 rounded-lg overflow-hidden">
          <table className="w-full text-left text-[10px]">
            <thead className="bg-[#4a0b79] text-white">
              <tr>
                <th className="px-6 py-3 font-medium">Product</th>
                <th className="px-6 py-3 font-medium">Product Code</th>
                <th className="px-6 py-3 font-medium">Unit</th>
                <th className="px-6 py-3 font-medium text-right">Quantity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {detail.products.map((p) => (
                <tr key={p.id} className="text-gray-500 font-medium">
                  <td className="px-6 py-6">{p.product}</td>
                  <td className="px-6 py-6">{p.productCode}</td>
                  <td className="px-6 py-6">{p.unit}</td>
                  <td className="px-6 py-6 text-right">{p.quantity}</td>
                </tr>
              ))}
              {detail.products.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-400">No items recorded.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4 pt-6">
          <Button
            className="bg-[#f3f4f6] border-none text-gray-500 font-bold px-8 h-10 gap-2"
            onClick={() => window.print()}
          >
            <Printer className="w-4 h-4" />
            PDF/Print
          </Button>
        </div>
      </div>
    </div>
  );
}
