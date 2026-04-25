"use client";

import React, { useState } from "react";
import { 
  ChevronLeft, 
  ChevronRight, 
  RefreshCcw, 
  Plus, 
  Filter, 
  ChevronDown, 
  ArrowUpDown,
  Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

type OrderStatus = "All" | "Pending" | "Confirmed" | "Delivered" | "Cancelled" | "Failed";

export default function SalesSheetPage() {
  const [activeTab, setActiveTab] = useState<OrderStatus>("All");

  const tabs = [
    { label: "All", count: 38 },
    { label: "Pending" },
    { label: "Confirmed", count: 8 },
    { label: "Delivered", count: 7 },
    { label: "Cancelled", count: 2 },
    { label: "Failed" },
  ];

  const legend = [
    { label: "Pending", color: "bg-[#fef3c7] text-[#d97706] border-[#fde68a]" },
    { label: "Comfirmed", color: "bg-[#f0fdf4] text-[#4ade80] border-[#dcfce7]" }, // Match typo in mockup "Comfirmed"
    { label: "Delivered", color: "bg-[#22c55e] text-white" },
    { label: "Cancelled", color: "bg-[#fef2f2] text-[#f87171] border-[#fee2e2]" },
    { label: "Failed", color: "bg-[#ef4444] text-white" },
  ];

  const orders = [
    { email: "adewale.johnson.ng@gmail.com", name: "Adewale Johnson", agent: "", product: "Prosxact", qty: 3, date: "03-02-2026", status: "Pending", color: "#f59e0b" },
    { email: "funke.adebayo.ng@gmail.com", name: "Funke Adebayo", agent: "", product: "Shred Belly", qty: 2, date: "03-02-2026", status: "Pending", color: "#f59e0b" },
    { email: "ibrahim.musa.ng@gmail.com", name: "Ibrahim Musa", agent: "Mr. Ola", agentState: "Lagos State", product: "Fonio-Mill", qty: 5, date: "03-02-2026", status: "Failed", color: "#ef4444" },
    { email: "chinedu.okafor.ng@gmail.com", name: "Chinedu Okafor", agent: "Mr. Qudus", agentState: "Lagos State", product: "Trim and Tone", qty: 4, date: "03-02-2026", status: "Comfirmed", color: "#4ade80" },
    { email: "blessing.eze.ng@gmail.com", name: "Blessing Eze", agent: "Mr. Oyelowo", agentState: "Ogun State", product: "Neuro-Vive Balm", qty: 1, date: "03-02-2026", status: "Cancelled", color: "#f87171" },
    { email: "sola.ogunleye.ng@gmail.com", name: "Sola Ogunleye", agent: "", product: "Prosxact", qty: 3, date: "03-02-2026", status: "Pending", color: "#f59e0b" },
    { email: "halima.abdullahi.ng@gmail.com", name: "Halima Abdullahi", agent: "Mr. Praise", agentState: "Ebonyi State", product: "Shred Belly", qty: 6, date: "03-02-2026", status: "Delivered", color: "#22c55e" },
    { email: "victor.uche.ng@gmail.com", name: "Victor Uche", agent: "", product: "Fonio-Mill", qty: 7, date: "04-02-2026", status: "Pending", color: "#f59e0b" },
    { email: "victor.uche.ng@gmail.com", name: "Victor Uche", agent: "Mrs. Sunmi", agentState: "Oyo State", product: "Fonio-Mill", qty: 7, date: "04-02-2026", status: "Failed", color: "#ef4444" },
    { email: "victor.uche.ng@gmail.com", name: "Victor Uche", agent: "Mrs. Sunmi", agentState: "Oyo State", product: "Fonio-Mill", qty: 7, date: "04-02-2026", status: "Delivered", color: "#22c55e" },
    { email: "victor.uche.ng@gmail.com", name: "Victor Uche", agent: "Mrs. Sunmi", agentState: "Oyo State", product: "Fonio-Mill", qty: 7, date: "04-02-2026", status: "Pending", color: "#f3f4f6" },
  ];

  return (
    <div className="space-y-6 pb-20">
      {/* Header with Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <button className="text-gray-400 hover:text-gray-600 transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button className="text-gray-400 hover:text-gray-600 transition-colors">
              <ChevronRight className="w-5 h-5" />
            </button>
            <button className="text-[#ad1df4] hover:text-[#8e14cc] transition-colors ml-2">
              <RefreshCcw className="w-4 h-4" />
            </button>
          </div>
          <h1 className="text-3xl font-bold text-gray-800">Sales Sheet</h1>
        </div>

        <div className="flex items-center gap-4">
          <button className="w-12 h-12 rounded-full border-2 border-[#ad1df4] flex items-center justify-center text-[#ad1df4] hover:bg-[#faf5ff] transition-colors">
            <Plus className="w-8 h-8" />
          </button>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-1 flex">
        {tabs.map((tab) => (
          <button
            key={tab.label}
            onClick={() => setActiveTab(tab.label as OrderStatus)}
            className={`flex-1 py-3 text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === tab.label
                ? "bg-[#faf5ff] text-[#ad1df4]"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
            {tab.count && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                activeTab === tab.label ? "bg-[#ad1df4] text-white" : "bg-gray-100 text-gray-500"
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Filter and Legend Toolbar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-gray-500 font-bold text-xs uppercase cursor-pointer">
            <Filter className="w-4 h-4" />
            Filter
          </div>
          <div className="flex items-center gap-2 text-gray-400 font-medium text-xs cursor-pointer border border-gray-200 px-3 py-1.5 rounded-lg">
            Date <ChevronDown className="w-4 h-4" />
          </div>
          <button className="text-gray-400 hover:text-gray-600 transition-colors">
            <ArrowUpDown className="w-4 h-4" />
          </button>

          {/* Legend Badges */}
          <div className="flex items-center gap-2 ml-4">
            {legend.map((item) => (
              <span key={item.label} className={`px-4 py-1 rounded text-[10px] font-bold border ${item.color}`}>
                {item.label}
              </span>
            ))}
          </div>
        </div>

        <div className="relative w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            type="text"
            placeholder="search"
            className="w-full pl-9 pr-4 py-2 text-xs border border-gray-100 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#ad1df4]"
          />
        </div>
      </div>

      {/* Sales Sheet Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#f8f9fa] text-gray-500 uppercase font-bold">
              <tr>
                <th className="px-6 py-5 w-16"></th>
                <th className="px-6 py-5">G-Mail</th>
                <th className="px-6 py-5">Name</th>
                <th className="px-6 py-5">Agent</th>
                <th className="px-6 py-5">Product</th>
                <th className="px-6 py-5">Quantity</th>
                <th className="px-6 py-5">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.map((order, idx) => (
                <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="w-2.5 h-2.5 rounded-full mx-auto" style={{ backgroundColor: order.color }}></div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{order.email}</td>
                  <td className="px-6 py-4 font-bold text-gray-700">{order.name}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-gray-700 font-medium">{order.agent}</span>
                      <span className="text-[10px] text-gray-400">{order.agentState}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{order.product}</td>
                  <td className="px-6 py-4 text-gray-600 text-center pr-12">{order.qty}</td>
                  <td className="px-6 py-4 text-gray-600">{order.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
