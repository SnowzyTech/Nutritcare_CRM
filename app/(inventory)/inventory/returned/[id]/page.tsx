"use client";

import React, { useState, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeftCircle, Search, Trash2, Printer, MessageCircle } from "lucide-react";
import { returnedStockData } from "@/lib/mock-data/returned-stock";

export default function ReturnedDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const { id } = use(params);

  // Look up this specific record by ID
  const record = returnedStockData.find((r) => r.id === Number(id));

  // Fallback if somehow not found
  if (!record) {
    return (
      <div className="max-w-[1400px] mx-auto py-20 text-center text-gray-400">
        <p>Record not found.</p>
        <button
          onClick={() => router.back()}
          className="mt-4 text-sm text-[#9D00FF] underline"
        >
          Go back
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto relative pb-10">
      {/* Floating Chat Icon */}
      <button className="absolute -top-4 right-0 w-12 h-12 bg-[#F6E8FF] rounded-full flex items-center justify-center text-[#9D00FF] shadow-sm hover:bg-[#ebd5fa] transition-colors z-50">
        <MessageCircle className="w-6 h-6 fill-current" />
      </button>

      {/* Top toolbar */}
      <div className="flex items-center gap-5 mb-12">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-[#9D00FF] transition-colors"
        >
          <ArrowLeftCircle className="w-5 h-5" />
          Back
        </button>

        <div className="flex-1 flex justify-center">
          <div className="flex items-center gap-2 text-gray-400 w-[400px]">
            <Search className="w-4 h-4 shrink-0" />
            <input
              type="text"
              placeholder="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="outline-none text-sm text-gray-600 bg-transparent w-full placeholder:text-gray-400"
            />
          </div>
        </div>

        {/* Placeholder to balance the space for centering */}
        <div className="w-[100px]" />
      </div>

      {/* Two-column: title/status left, detail card right */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* Left: Title + status badge */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Returned Stock</h1>
          <p className="text-sm text-gray-400 mt-0.5 mb-3">Voucher</p>
          <span
            className="inline-block px-3 py-1 text-[11px] font-bold text-teal-600 bg-teal-100/80 rounded-sm tracking-widest uppercase"
          >
            RETURNED
          </span>
        </div>

        {/* Right: Info card */}
        <div className="bg-gray-50 rounded-xl border border-gray-100 px-6 py-5 space-y-3">
          {[
            { label: "RS-ID:", value: record.rsId },
            { label: "Agent:", value: record.agent.toUpperCase() },
            { label: "Quantity Returned:", value: record.qtyReturned },
            { label: "Status:", value: record.status },
            { label: "Recorded By:", value: record.addedBy.toUpperCase() },
            { label: "Date:", value: record.date },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center gap-4">
              <span className="text-sm font-bold text-gray-700 w-44 shrink-0">{label}</span>
              <span className="text-sm font-medium text-gray-600">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Product table */}
      <div className="border border-gray-200 rounded-lg overflow-hidden mb-8 shadow-sm">
        <table className="w-full">
          <thead>
            <tr style={{ backgroundColor: "#3D0066" }}>
              <th className="text-left text-xs font-semibold text-white py-3 px-6">Product</th>
              <th className="text-center text-xs font-semibold text-white py-3 px-6">Product Code</th>
              <th className="text-center text-xs font-semibold text-white py-3 px-6">Unit</th>
              <th className="text-right text-xs font-semibold text-white py-3 px-6">Quantity</th>
            </tr>
          </thead>
          <tbody>
            {record.products.map((row) => (
              <tr key={row.id} className="border-t border-gray-100 bg-white">
                <td className="py-4 px-6 text-xs font-medium text-gray-600">{row.product}</td>
                <td className="py-4 px-6 text-xs text-gray-500 text-center">{row.productCode}</td>
                <td className="py-4 px-6 text-xs text-gray-500 text-center">{row.unit}</td>
                <td className="py-4 px-6 text-xs text-gray-500 text-right">{row.quantity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer Area: Extra Info & Action buttons */}
      <div className="flex items-start justify-between">
        {/* Left: Reason for Damage */}
        <div className="max-w-xl">
          {record.status === "Damaged" && record.remarks && (
            <div className="bg-amber-50/50 border border-amber-100 rounded-lg px-6 py-5">
              <h3 className="text-sm font-bold text-amber-800 mb-2">Reason for Damage:</h3>
              <p className="text-sm text-gray-700 leading-relaxed">{record.remarks}</p>
            </div>
          )}
        </div>

        {/* Right: Action buttons */}
        <div className="flex gap-3 shrink-0 ml-8">
          {/* Edit */}
          <button className="px-6 py-2.5 rounded-md text-sm font-semibold text-white bg-amber-400 hover:bg-amber-500 transition-colors">
            Edit
          </button>

          {/* Delete */}
          <button className="flex items-center gap-1.5 px-5 py-2.5 rounded-md text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors">
            <Trash2 className="w-4 h-4" />
            Delete
          </button>

          {/* PDF/Print */}
          <button className="flex items-center gap-1.5 px-5 py-2.5 rounded-md text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors">
            <Printer className="w-4 h-4" />
            PDF/Print
          </button>
        </div>
      </div>
    </div>
  );
}
