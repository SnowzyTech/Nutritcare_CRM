"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, Search, Trash2, Printer } from "lucide-react";
import type { OutgoingOrder } from "@/lib/mock-data/warehouse";

interface Props {
  item: OutgoingOrder;
}

export default function OutgoingDetailClient({ item }: Props) {
  const currentStatus = item.status;

  const statusColor =
    currentStatus === "Received"
      ? "bg-[#059669] text-white"
      : "bg-gray-400 text-white";

  return (
    <div className="bg-[#FAFAFA] min-h-screen">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 bg-white">
        <Link
          href="/warehouse/outgoing"
          className="flex items-center gap-2 text-gray-600 text-[14px] font-medium hover:text-gray-900 transition-colors"
        >
          <div className="w-[22px] h-[22px] rounded-full border-2 border-gray-600 flex items-center justify-center">
            <ArrowLeft className="w-3 h-3 stroke-[3]" />
          </div>
          Back
        </Link>

        <div className="relative w-[400px]">
          <Search className="w-[16px] h-[16px] absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="search"
            className="w-full bg-gray-50 border-none rounded-lg py-2.5 pl-10 pr-4 text-[14px] text-gray-500 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#9747FF]"
          />
        </div>
      </div>

      <div className="px-8 py-8">
        <div className="flex gap-12 items-start">
          {/* Left — Title & Status */}
          <div className="flex-shrink-0">
            <h1 className="text-[22px] font-semibold text-gray-800">Stock Out</h1>
            <p className="text-[13px] text-gray-400 mt-0.5">Voucher</p>
            <span
              className={`inline-block mt-2 px-3 py-1 rounded text-[11px] font-semibold uppercase tracking-wide ${statusColor}`}
            >
              {currentStatus}
            </span>
          </div>

          {/* Right — Detail Fields */}
          <div className="flex-1 flex justify-end">
            <div className="w-full max-w-[480px] bg-white border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full text-[13px]">
                <tbody>
                  <tr className="border-b border-gray-100">
                    <td className="px-5 py-3 text-gray-500 font-medium w-[180px]">Order ID:</td>
                    <td className="px-5 py-3 text-gray-800 font-medium">{item.id}</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="px-5 py-3 text-gray-500 font-medium">State / Agent:</td>
                    <td className="px-5 py-3 text-[#9747FF] font-medium uppercase">{item.state} / {item.agent}</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="px-5 py-3 text-gray-500 font-medium">Quantity Sent</td>
                    <td className="px-5 py-3 text-gray-800 font-medium">{item.qtySent}</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="px-5 py-3 text-gray-500 font-medium">Other Info:</td>
                    <td className="px-5 py-3 text-gray-800 font-medium">{item.otherInfo}</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="px-5 py-3 text-gray-500 font-medium">Added By:</td>
                    <td className="px-5 py-3 text-gray-800 font-medium uppercase">{item.addedBy}</td>
                  </tr>
                  <tr>
                    <td className="px-5 py-3 text-gray-500 font-medium">Date:</td>
                    <td className="px-5 py-3 text-gray-800 font-medium">{item.date}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Product Table */}
        <div className="mt-10 border border-gray-200 rounded-lg overflow-hidden shadow-sm">
          <table className="w-full">
            <thead>
              <tr className="bg-[#4A0E78] text-white">
                <th className="px-4 py-2.5 text-[11px] font-medium text-left">Product</th>
                <th className="px-4 py-2.5 text-[11px] font-medium text-left">Quantity Sent</th>
                <th className="px-4 py-2.5 text-[11px] font-medium text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-100 bg-white">
                <td className="px-4 py-3 text-[12px] text-gray-600">{item.productName}</td>
                <td className="px-4 py-3 text-[12px] text-gray-500">{item.qtySent}</td>
                <td className="px-4 py-3 text-[12px] text-gray-600 text-right">{item.status}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Note */}
        <div className="mt-8">
          <h3 className="text-[13px] font-semibold text-gray-700 mb-2">Note</h3>
          <div className="bg-white border border-gray-200 rounded-lg px-5 py-4 min-h-[60px]">
            <p className="text-[13px] text-gray-500">—</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 mt-10">
          <button className="flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 text-[13px] font-medium px-5 h-[38px] rounded-md transition-colors">
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
          <button className="flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 text-[13px] font-medium px-5 h-[38px] rounded-md transition-colors">
            <Printer className="w-4 h-4" />
            PDF/Print
          </button>
        </div>
      </div>
    </div>
  );
}
