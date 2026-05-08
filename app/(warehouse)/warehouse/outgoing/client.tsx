"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Checkbox } from "@/components/ui/checkbox";
import type { OutgoingOrder } from "@/lib/mock-data/warehouse";
import { Filter, PlusCircle, ArrowUpDown, Search, ArrowLeft, ChevronDown } from "lucide-react";

interface Props {
  items: OutgoingOrder[];
}

export default function OutgoingClient({ items }: Props) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAction, setSelectedAction] = useState("");
  const isEmpty = items.length === 0;

  const filteredItems = items.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.productName.toLowerCase().includes(q) ||
      item.state.toLowerCase().includes(q) ||
      item.agent.toLowerCase().includes(q) ||
      item.otherInfo.toLowerCase().includes(q) ||
      item.status.toLowerCase().includes(q) ||
      item.addedBy.toLowerCase().includes(q)
    );
  });

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
            href="/warehouse/outgoing/add"
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
        /* ── Empty State ──────────────────────────────────────── */
        <div className="flex-1 flex items-center justify-center mt-12">
          <div className="bg-white rounded-2xl shadow-sm p-12 flex flex-col items-center justify-center w-[500px] h-[380px]">
            <h2 className="text-[18px] font-semibold text-gray-600 mb-6">Outgoing Stock</h2>

            <div className="w-[100px] h-[100px] mb-5 flex items-center justify-center">
              <svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M30 70V35L50 25L70 35V70" stroke="#D1D5DB" strokeWidth="3" strokeLinejoin="round"/>
                <path d="M30 35L50 45L70 35" stroke="#D1D5DB" strokeWidth="3" strokeLinejoin="round"/>
                <path d="M50 45V70" stroke="#D1D5DB" strokeWidth="3"/>
                <path d="M25 65H75" stroke="#D1D5DB" strokeWidth="3" strokeLinecap="round"/>
                <path d="M55 55L65 55" stroke="#D1D5DB" strokeWidth="3" strokeLinecap="round"/>
                <path d="M60 50L60 60" stroke="#D1D5DB" strokeWidth="3" strokeLinecap="round"/>
              </svg>
            </div>

            <p className="text-gray-400 text-[12px] mb-5">Create Outgoing Stock</p>

            <Link
              href="/warehouse/outgoing/add"
              className="bg-[#9747FF] text-white text-[12px] font-medium px-5 py-2 rounded-md hover:bg-purple-600 transition-colors"
            >
              Click to Add Stock
            </Link>
          </div>
        </div>
      ) : (
        /* ── Data View ────────────────────────────────────────── */
        <div className="px-6">
          {/* Select Action + Go button */}
          <div className="flex items-center gap-3 mb-4 mt-4">
            <div className="relative">
              <select
                value={selectedAction}
                onChange={(e) => setSelectedAction(e.target.value)}
                className="appearance-none w-[160px] h-[34px] border border-gray-200 rounded-md px-3 pr-8 text-[12px] text-gray-400 bg-white focus:outline-none focus:ring-1 focus:ring-[#9747FF] focus:border-[#9747FF]"
              >
                <option value="">Select Action</option>
                <option value="delete">Delete</option>
                <option value="export">Export</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            <button className="bg-[#9747FF] hover:bg-[#7C3AED] text-white text-[12px] font-medium px-5 h-[34px] rounded-md transition-colors">
              Go
            </button>
          </div>

          {/* Table */}
          <div className="bg-white rounded-md border border-gray-200">
            <div className="overflow-x-auto">
              <table className="w-full text-[11px] border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-400 text-left bg-white">
                    <th className="px-3 py-3 font-normal w-10 border-r border-gray-100">
                      <Checkbox className="border-gray-300 rounded-[3px] w-3.5 h-3.5" />
                    </th>
                    <th className="px-3 py-3 font-normal uppercase tracking-wider border-r border-gray-100">ID</th>
                    <th className="px-3 py-3 font-normal uppercase tracking-wider border-r border-gray-100">DATE</th>
                    <th className="px-3 py-3 font-normal uppercase tracking-wider border-r border-gray-100">Product Name</th>
                    <th className="px-3 py-3 font-normal uppercase tracking-wider border-r border-gray-100">State</th>
                    <th className="px-3 py-3 font-normal uppercase tracking-wider border-r border-gray-100">Agent</th>
                    <th className="px-3 py-3 font-normal uppercase tracking-wider border-r border-gray-100">Other Info</th>
                    <th className="px-3 py-3 font-normal uppercase tracking-wider border-r border-gray-100">QTY Sent</th>
                    <th className="px-3 py-3 font-normal uppercase tracking-wider border-r border-gray-100">Status</th>
                    <th className="px-3 py-3 font-normal uppercase tracking-wider">
                      <div className="flex items-center justify-between">
                        Added By:
                        <Search className="w-[13px] h-[13px] cursor-pointer text-gray-800" strokeWidth={2.5} />
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item) => (
                    <tr
                      key={item.id}
                      onClick={() => router.push(`/warehouse/outgoing/${item.id}`)}
                      className="border-b border-gray-100 hover:bg-gray-50/60 text-gray-500 bg-white cursor-pointer transition-colors"
                    >
                      <td className="px-3 py-2.5 border-r border-gray-100" onClick={(e) => e.stopPropagation()}>
                        <Checkbox className="border-gray-300 rounded-[3px] w-3.5 h-3.5" />
                      </td>
                      <td className="px-3 py-2.5 border-r border-gray-100">{item.id}</td>
                      <td className="px-3 py-2.5 border-r border-gray-100 whitespace-nowrap">{item.date}</td>
                      <td className="px-3 py-2.5 border-r border-gray-100">{item.productName}</td>
                      <td className="px-3 py-2.5 border-r border-gray-100 text-[#9747FF]">{item.state}</td>
                      <td className="px-3 py-2.5 border-r border-gray-100 text-[#9747FF]">{item.agent}</td>
                      <td className="px-3 py-2.5 border-r border-gray-100">{item.otherInfo}</td>
                      <td className="px-3 py-2.5 border-r border-gray-100">{item.qtySent}</td>
                      <td className="px-3 py-2.5 border-r border-gray-100">{item.status}</td>
                      <td className="px-3 py-2.5 whitespace-nowrap">{item.addedBy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Back Button — bottom right */}
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
