"use client";

import React, { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";

type DeliveryStatus = "All" | "Pending" | "In Transit" | "Delivered" | "Failed";

interface Delivery {
  id: string;
  orderId: string;
  agent: string;
  driver: string;
  time: string;
  address: string;
  status: Exclude<DeliveryStatus, "All">;
}

export default function DeliveriesPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<DeliveryStatus>("All");
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);

  const [deliveries, setDeliveries] = useState<Delivery[]>([
    { id: "1", orderId: "#ORD-4820", agent: "Clear Path", driver: "-", time: "-", address: "22, Adeola Odeku", status: "Pending" },
    { id: "2", orderId: "#ORD-4821", agent: "Bello & Co", driver: "J.Eze", time: "14:30", address: "14, Broad St. Lagos", status: "In Transit" },
    { id: "3", orderId: "#ORD-4817", agent: "Eco Supply", driver: "P.Adaku", time: "16:00", address: "18, Ozumba", status: "In Transit" },
    { id: "4", orderId: "#ORD-4819", agent: "Delta stores", driver: "A.Musa", time: "12:00", address: "7, Idowu Taylor", status: "Delivered" },
    { id: "5", orderId: "#ORD-4816", agent: "Fast Build", driver: "J.Eze", time: "11:00", address: "5, Eko Athlantic", status: "Delivered" },
    { id: "6", orderId: "#ORD-4818", agent: "Acme Ltd", driver: "K.Obi", time: "14:50", address: "3, Marina Road", status: "Failed" },
    { id: "7", orderId: "#ORD-4820", agent: "Clear Path", driver: "-", time: "-", address: "22, Adeola Odeku", status: "Pending" },
    { id: "8", orderId: "#ORD-4820", agent: "Clear Path", driver: "-", time: "-", address: "22, Adeola Odeku", status: "Pending" },
    { id: "9", orderId: "#ORD-4820", agent: "Clear Path", driver: "-", time: "-", address: "22, Adeola Odeku", status: "Pending" },
    { id: "10", orderId: "#ORD-4820", agent: "Clear Path", driver: "-", time: "-", address: "22, Adeola Odeku", status: "Pending" },
  ]);

  const filteredDeliveries = activeTab === "All"
    ? deliveries
    : deliveries.filter(d => d.status === activeTab);

  const toggleSelectAll = () => {
    if (selectedOrderIds.length === filteredDeliveries.length) {
      setSelectedOrderIds([]);
    } else {
      setSelectedOrderIds(filteredDeliveries.map(d => d.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedOrderIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const [isEditOpen, setIsEditOpen] = useState(false);

  const updateStatus = (newStatus: "Delivered" | "Failed") => {
    setDeliveries(prev => prev.map(d =>
      selectedOrderIds.includes(d.id) ? { ...d, status: newStatus } : d
    ));
    setSelectedOrderIds([]);
    setIsEditOpen(false);
  };

  const getTabColor = (tab: DeliveryStatus) => {
    if (activeTab !== tab) return "bg-[#f3f4f6] text-gray-500 hover:bg-gray-200";
    switch (tab) {
      case "All": return "bg-[#ad1df4] text-white";
      case "Pending": return "bg-[#ad1df4] text-white";
      case "In Transit": return "bg-[#ad1df4] text-white";
      case "Delivered": return "bg-[#ad1df4] text-white";
      case "Failed": return "bg-[#e11d48] text-white";
      default: return "bg-gray-200";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Pending": return <span className="px-6 py-1 rounded-full text-[10px] font-bold bg-[#fdf8e6] text-[#eab308] border border-[#fde68a]">Pending</span>;
      case "In Transit": return <span className="px-6 py-1 rounded-full text-[10px] font-bold bg-[#faf5ff] text-[#ad1df4] border border-[#f3e8ff]">In Transit</span>;
      case "Delivered": return <span className="px-6 py-1 rounded-full text-[10px] font-bold bg-[#f0fdf4] text-[#22c55e] border border-[#dcfce7]">Delivered</span>;
      case "Failed": return <span className="px-6 py-1 rounded-full text-[10px] font-bold bg-[#fef2f2] text-[#ef4444] border border-[#fee2e2]">Failed</span>;
      default: return null;
    }
  };

  const handleAssign = (delivery: Delivery) => {
    const params = new URLSearchParams();
    params.set("orderId", delivery.orderId);
    params.set("address", delivery.address);
    router.push(`/logistics/dispatch?${params.toString()}`);
  };

  return (
    <div className="space-y-6 pt-2">
      {/* Search and Top Actions */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder=""
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#ad1df4]"
          />
        </div>
        <Button variant="outline" className="text-gray-500 border-gray-200 font-medium px-6 h-10">
          Excel
        </Button>

        {/* Edit Dropdown */}
        <div className="relative">
          <Button
            variant="outline"
            disabled={selectedOrderIds.length === 0}
            onClick={() => setIsEditOpen(!isEditOpen)}
            className={`text-gray-500 border-gray-200 font-medium px-6 h-10 flex items-center gap-2 transition-all ${isEditOpen ? 'bg-gray-100 ring-1 ring-[#ad1df4]' : ''}`}
          >
            Edit
          </Button>

          {isEditOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setIsEditOpen(false)}></div>
              <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-gray-100 rounded-md shadow-xl z-20 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                <button
                  onClick={() => updateStatus("Delivered")}
                  className="w-full text-left px-4 py-2 text-xs font-bold text-gray-600 hover:bg-[#faf5ff] hover:text-[#ad1df4]"
                >
                  Delivered
                </button>
                <button
                  onClick={() => updateStatus("Failed")}
                  className="w-full text-left px-4 py-2 text-xs font-bold text-gray-600 hover:bg-red-50 hover:text-red-500"
                >
                  Failed
                </button>
              </div>
            </>
          )}
        </div>
      </div>


      {/* Tabs */}
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

      {/* Deliveries Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#faf5ff] text-gray-400 uppercase font-semibold">
              <tr>
                <th className="px-6 py-4 w-10">
                  <Checkbox
                    className="border-gray-300"
                    checked={selectedOrderIds.length === filteredDeliveries.length && filteredDeliveries.length > 0}
                    onCheckedChange={toggleSelectAll}
                  />
                </th>
                <th className="px-6 py-4 font-bold">Order ID</th>
                <th className="px-6 py-4 font-bold">Agent</th>
                <th className="px-6 py-4 font-bold">Driver</th>
                <th className="px-6 py-4 font-bold">Time</th>
                <th className="px-6 py-4 font-bold">Address</th>
                <th className="px-6 py-4 font-bold text-center">Status</th>
                <th className="px-6 py-4 font-bold text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredDeliveries.map((delivery, index) => (
                <tr key={index} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <Checkbox
                      className="border-gray-300"
                      checked={selectedOrderIds.includes(delivery.id)}
                      onCheckedChange={() => toggleSelect(delivery.id)}
                    />
                  </td>
                  <td className="px-6 py-4 font-bold text-gray-700">{delivery.orderId}</td>
                  <td className="px-6 py-4 text-gray-500 font-medium">{delivery.agent}</td>
                  <td className="px-6 py-4 text-gray-500 font-medium">{delivery.driver}</td>
                  <td className="px-6 py-4 text-gray-500 font-medium">{delivery.time}</td>
                  <td className="px-6 py-4 text-gray-500 font-medium">{delivery.address}</td>
                  <td className="px-6 py-4 text-center">
                    {getStatusBadge(delivery.status)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <Button
                      variant="outline"
                      onClick={() => handleAssign(delivery)}
                      className="h-7 text-[10px] font-bold px-6 rounded-md border border-gray-200 bg-gray-50 text-gray-500 hover:bg-gray-100"
                    >
                      Assign
                    </Button>
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


