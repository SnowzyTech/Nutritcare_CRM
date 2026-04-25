"use client";

import React, { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";

type DeliveryStatus = "All" | "Pending" | "In Transit" | "Delivered" | "Failed";

interface Delivery {
  id: string;
  orderId: string;
  customer: string;
  driver: string;
  time: string;
  address: string;
  status: Exclude<DeliveryStatus, "All">;
}

export default function DeliveriesPage() {
  const [activeTab, setActiveTab] = useState<DeliveryStatus>("All");

  const mockDeliveries: Delivery[] = [
    { id: "1", orderId: "#ORD-4820", customer: "Clear Path", driver: "-", time: "-", address: "22, Adeola Odeku", status: "Pending" },
    { id: "2", orderId: "#ORD-4821", customer: "Bello & Co", driver: "J.Eze", time: "14:30", address: "14, Broad St. Lagos", status: "In Transit" },
    { id: "3", orderId: "#ORD-4817", customer: "Eco Supply", driver: "P.Adaku", time: "16:00", address: "18, Ozumba", status: "In Transit" },
    { id: "4", orderId: "#ORD-4819", customer: "Delta stores", driver: "A.Musa", time: "12:00", address: "7, Idowu Taylor", status: "Delivered" },
    { id: "5", orderId: "#ORD-4816", customer: "Fast Build", driver: "J.Eze", time: "11:00", address: "5, Eko Athlantic", status: "Delivered" },
    { id: "6", orderId: "#ORD-4818", customer: "Acme Ltd", driver: "K.Obi", time: "14:50", address: "3, Marina Road", status: "Failed" },
  ];

  const filteredDeliveries = activeTab === "All" 
    ? mockDeliveries 
    : mockDeliveries.filter(d => d.status === activeTab);

  const getTabColor = (tab: DeliveryStatus) => {
    if (activeTab !== tab) return "bg-gray-100 text-gray-500 hover:bg-gray-200";
    switch (tab) {
      case "All": return "bg-[#ad1df4] text-white";
      case "Pending": return "bg-[#f59e0b] text-white";
      case "In Transit": return "bg-[#ad1df4] text-white";
      case "Delivered": return "bg-[#22c55e] text-white";
      case "Failed": return "bg-[#ef4444] text-white";
      default: return "bg-gray-200";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Pending": return <span className="px-6 py-1 rounded-full text-[10px] font-bold bg-[#fef3c7] text-[#d97706] border border-[#fde68a]">Pending</span>;
      case "In Transit": return <span className="px-6 py-1 rounded-full text-[10px] font-bold bg-[#faf5ff] text-[#ad1df4] border border-[#f3e8ff]">In Transit</span>;
      case "Delivered": return <span className="px-6 py-1 rounded-full text-[10px] font-bold bg-[#f0fdf4] text-[#22c55e] border border-[#dcfce7]">Delivered</span>;
      case "Failed": return <span className="px-6 py-1 rounded-full text-[10px] font-bold bg-[#fef2f2] text-[#ef4444] border border-[#fee2e2]">Failed</span>;
      default: return null;
    }
  };

  const getActionButton = (status: string) => {
    const commonClass = "h-7 text-[10px] font-bold px-6 rounded-md border border-gray-200 bg-gray-50 text-gray-500 hover:bg-gray-100";
    switch (status) {
      case "Pending": return <Button variant="outline" className={commonClass}>Assign</Button>;
      case "In Transit": return <Button variant="outline" className={commonClass}>Track</Button>;
      case "Delivered": return <Button variant="outline" className={commonClass}>View</Button>;
      case "Failed": return <Button variant="outline" className={commonClass}>Retry</Button>;
      default: return null;
    }
  };

  return (
    <div className="space-y-8 pt-6">
      {/* Tabs & Top Actions */}
      <div className="flex items-center justify-between">
        <div className="flex gap-4">
          {(["All", "Pending", "In Transit", "Delivered", "Failed"] as DeliveryStatus[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-1.5 rounded-md text-xs font-bold transition-all ${getTabColor(tab)}`}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="bg-[#f3f4f6] border-none text-gray-600 px-6 font-bold text-xs h-9">
            Export
          </Button>
          <Button className="bg-[#ad1df4] hover:bg-[#8e14cc] text-white px-6 font-bold text-xs h-9">
            +New Delivery
          </Button>
        </div>
      </div>

      {/* Deliveries Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#faf5ff] text-gray-500 uppercase font-semibold">
              <tr>
                <th className="px-6 py-4 w-10"><Checkbox className="border-gray-300" /></th>
                <th className="px-6 py-4 font-bold">Order ID</th>
                <th className="px-6 py-4 font-bold">Customer</th>
                <th className="px-6 py-4 font-bold">Driver</th>
                <th className="px-6 py-4 font-bold">Time</th>
                <th className="px-6 py-4 font-bold">Address</th>
                <th className="px-6 py-4 font-bold text-center">Status</th>
                <th className="px-6 py-4 font-bold text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredDeliveries.map((delivery) => (
                <tr key={delivery.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4"><Checkbox className="border-gray-300" /></td>
                  <td className="px-6 py-4 font-bold text-gray-700">{delivery.orderId}</td>
                  <td className="px-6 py-4 text-gray-600">{delivery.customer}</td>
                  <td className="px-6 py-4 text-gray-600">{delivery.driver}</td>
                  <td className="px-6 py-4 text-gray-600">{delivery.time}</td>
                  <td className="px-6 py-4 text-gray-600">{delivery.address}</td>
                  <td className="px-6 py-4 text-center">
                    {getStatusBadge(delivery.status)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {getActionButton(delivery.status)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
