"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Checkbox } from "@/components/ui/checkbox";
import type { IncomingGoodsRow } from "@/modules/warehouse/services/warehouse.service";
import { Filter, PlusCircle, ArrowUpDown, Search, ArrowLeft, AlertTriangle } from "lucide-react";

interface Props {
  goods: IncomingGoodsRow[];
  hasWarehouse: boolean;
}

export default function IncomingGoodsClient({ goods, hasWarehouse }: Props) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const isEmpty = goods.length === 0;

  const filteredGoods = goods.filter((g) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      g.siId.toLowerCase().includes(q) ||
      g.supplier.toLowerCase().includes(q) ||
      g.supplierRef.toLowerCase().includes(q) ||
      g.addedBy.toLowerCase().includes(q) ||
      g.status.toLowerCase().includes(q) ||
      g.product.toLowerCase().includes(q)
    );
  });

  if (!hasWarehouse) {
    return (
      <div className="flex flex-col h-full bg-[#FAFAFA] min-h-screen items-center justify-center">
        <div className="bg-white rounded-2xl shadow-sm p-12 flex flex-col items-center gap-4 w-[480px] text-center">
          <AlertTriangle className="w-12 h-12 text-amber-400" />
          <h2 className="text-[18px] font-semibold text-gray-700">No Warehouse Assigned</h2>
          <p className="text-[13px] text-gray-400 leading-relaxed">
            Your account is not linked to a warehouse yet. Please contact an administrator to assign
            you to a warehouse before you can manage incoming goods.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#FAFAFA] min-h-screen relative">
      {/* Top Bar */}
      <div className="flex items-center px-8 py-5">
        <div className="flex items-center gap-5">
          <button className="flex items-center gap-2 text-gray-700 font-medium text-[14px] hover:text-gray-900">
            <Filter className="w-[17px] h-[17px]" />
            Filter
          </button>
          <Link
            href="/warehouse/incoming-goods/add"
            className="flex items-center gap-1.5 text-gray-400 text-[14px] hover:text-gray-600"
          >
            Add New
            <PlusCircle className="w-[17px] h-[17px]" />
          </Link>
          <button className="text-gray-400 hover:text-gray-600">
            <ArrowUpDown className="w-[17px] h-[17px]" />
          </button>
        </div>

        <div className="relative w-[280px] ml-auto">
          <Search className="w-[15px] h-[15px] absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent border-none py-2 pl-9 pr-4 text-[14px] text-gray-500 placeholder:text-gray-400 focus:outline-none"
          />
        </div>
      </div>

      {isEmpty ? (
        <div className="flex-1 flex items-center justify-center mt-12">
          <div className="bg-white rounded-2xl shadow-sm p-12 flex flex-col items-center justify-center w-[500px] h-[380px]">
            <h2 className="text-[22px] font-semibold text-gray-600 mb-8">Stock In</h2>

            <div className="w-[120px] h-[120px] mb-6 flex items-center justify-center">
              <svg width="120" height="120" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M50 20L80 35L50 50L20 35L50 20Z" stroke="#D1D5DB" strokeWidth="4" strokeLinejoin="round"/>
                <path d="M20 35V65L50 80V50" stroke="#D1D5DB" strokeWidth="4" strokeLinejoin="round"/>
                <path d="M80 35V65L50 80V50" stroke="#D1D5DB" strokeWidth="4" strokeLinejoin="round"/>
                <path d="M65 45L85 65L75 75L55 55L65 45Z" fill="#D1D5DB" />
                <path d="M55 55L50 65L60 60L55 55Z" fill="#D1D5DB" />
              </svg>
            </div>

            <p className="text-gray-400 text-sm mb-6">Create Stock in</p>

            <Link
              href="/warehouse/incoming-goods/add"
              className="bg-[#9747FF] text-white text-sm font-medium px-6 py-2.5 rounded-lg hover:bg-purple-600 transition-colors"
            >
              Click to add Stock
            </Link>
          </div>
        </div>
      ) : (
        <div className="px-6 mt-1">
          <div className="bg-white rounded-md border border-gray-200">
            <div className="overflow-x-auto">
              <table className="w-full text-[11px] border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-400 text-left bg-white">
                    <th className="px-3 py-3 font-normal w-10 border-r border-gray-100">
                      <Checkbox className="border-gray-300 rounded-[3px] w-3.5 h-3.5" />
                    </th>
                    <th className="px-3 py-3 font-normal uppercase tracking-wider border-r border-gray-100">DATE</th>
                    <th className="px-3 py-3 font-normal uppercase tracking-wider border-r border-gray-100">SI-ID</th>
                    <th className="px-3 py-3 font-normal uppercase tracking-wider border-r border-gray-100">Supplier</th>
                    <th className="px-3 py-3 font-normal uppercase tracking-wider border-r border-gray-100">Supplier Ref</th>
                    <th className="px-3 py-3 font-normal uppercase tracking-wider border-r border-gray-100">Product</th>
                    <th className="px-3 py-3 font-normal uppercase tracking-wider border-r border-gray-100">Status</th>
                    <th className="px-3 py-3 font-normal uppercase tracking-wider border-r border-gray-100">Created Time</th>
                    <th className="px-3 py-3 font-normal uppercase tracking-wider">
                      <div className="flex items-center justify-between">
                        Added By
                        <Search className="w-[13px] h-[13px] cursor-pointer text-gray-800" strokeWidth={2.5} />
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredGoods.map((item) => (
                    <tr
                      key={item.id}
                      onClick={() => router.push(`/warehouse/incoming-goods/${item.id}`)}
                      className="border-b border-gray-100 hover:bg-gray-50/60 text-gray-500 bg-white cursor-pointer transition-colors"
                    >
                      <td className="px-3 py-2.5 border-r border-gray-100" onClick={(e) => e.stopPropagation()}>
                        <Checkbox className="border-gray-300 rounded-[3px] w-3.5 h-3.5" />
                      </td>
                      <td className="px-3 py-2.5 border-r border-gray-100 whitespace-nowrap">{item.date}</td>
                      <td className="px-3 py-2.5 border-r border-gray-100 whitespace-nowrap font-medium text-[#9747FF]">{item.siId}</td>
                      <td className="px-3 py-2.5 border-r border-gray-100">{item.supplier}</td>
                      <td className="px-3 py-2.5 border-r border-gray-100 text-[#9747FF]">{item.supplierRef}</td>
                      <td className="px-3 py-2.5 border-r border-gray-100">{item.product}</td>
                      <td className="px-3 py-2.5 border-r border-gray-100">{item.status}</td>
                      <td className="px-3 py-2.5 border-r border-gray-100 whitespace-nowrap">{item.createdTime}</td>
                      <td className="px-3 py-2.5 whitespace-nowrap">{item.addedBy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Back Button */}
      <div className="fixed bottom-6 right-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 font-medium text-[14px] hover:text-black transition-colors"
        >
          <div className="w-[22px] h-[22px] rounded-full border-2 border-gray-600 flex items-center justify-center">
            <ArrowLeft className="w-3 h-3 stroke-[3]" />
          </div>
          Back
        </button>
      </div>
    </div>
  );
}
