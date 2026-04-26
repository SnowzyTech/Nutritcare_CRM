"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Search, Settings, Bell } from "lucide-react";

type FilterStatus = "All" | "Pending" | "Delivered" | "Failed" | "Rescheduled";

export default function DeliveryAgentOrders() {
  const [activeFilter, setActiveFilter] = useState<FilterStatus>("All");

  const orders = [
    // Pending/Rescheduled
    { id: "1", name: "Adewale Johnson", email: "adewale.johnson.ng@gmail.com", product: "2 Prosxact", time: "Today 10:36", status: "Rescheduled" },
    { id: "2", name: "Tunde Adebayo", email: "tunde.adebayo89@gmail.com", product: "6 Prosxact", time: "Today 10:36", status: "Pending" },
    { id: "3", name: "Samuel Adeyemi", email: "sam.adeyemi@gmail.com", product: "3 Neuro-Vive Balm", time: "Today 10:36", status: "Rescheduled" },
    { id: "4", name: "Peter Obioma", email: "peter.obioma@gmail.com", product: "2 Prosxact", time: "Today 10:36", status: "Rescheduled" },
    { id: "5", name: "Peter Obioma", email: "peter.obioma@gmail.com", product: "2 Prosxact", time: "Today 10:36", status: "Pending" },
    { id: "6", name: "Peter Obioma", email: "peter.obioma@gmail.com", product: "2 Prosxact", time: "Today 10:36", status: "Pending" },
    { id: "7", name: "Peter Obioma", email: "peter.obioma@gmail.com", product: "2 Prosxact", time: "Today 10:36", status: "Pending" },
    { id: "8", name: "Peter Obioma", email: "peter.obioma@gmail.com", product: "2 Prosxact", time: "Today 10:36", status: "Pending" },
    { id: "9", name: "Peter Obioma", email: "peter.obioma@gmail.com", product: "2 Prosxact", time: "Today 10:36", status: "Pending" },
    { id: "10", name: "Peter Obioma", email: "peter.obioma@gmail.com", product: "2 Prosxact", time: "Today 10:36", status: "Pending" },
    { id: "11", name: "Peter Obioma", email: "peter.obioma@gmail.com", product: "2 Prosxact", time: "Today 10:36", status: "Rescheduled" },
    { id: "12", name: "Peter Obioma", email: "peter.obioma@gmail.com", product: "2 Prosxact", time: "Today 10:36", status: "Pending" },
    
    // Delivered
    { id: "13", name: "Daniel Okafor", email: "daniel.okafor23@gmail.com", product: "4 Neuro-Vive Balm", time: "Today 10:36", status: "Delivered" },
    { id: "14", name: "Aisha Bello", email: "aishabello.dev@gmail.com", product: "4 Shred Belly", time: "Today 10:36", status: "Delivered" },
    { id: "15", name: "Zainab Musa", email: "zainabmusa_x@gmail.com", product: "10 Trim and Tone", time: "Today 10:36", status: "Delivered" },
    { id: "16", name: "Ibrahim Sadiq", email: "ibrahim.sadiq22@gmail.com", product: "2 After-Natal", time: "Today 10:36", status: "Delivered" },
    { id: "17", name: "Michael Johnson", email: "michaeljohnson.ng@gmail.com", product: "2 Neuro-Vive Balm", time: "Today 10:36", status: "Delivered" },
    { id: "18", name: "Hadiza Lawal", email: "hadiza.lawal7@gmail.com", product: "1 After-Natal", time: "Today 10:36", status: "Delivered" },
    { id: "19", name: "Hadiza Lawal", email: "hadiza.lawal7@gmail.com", product: "1 After-Natal", time: "Today 10:36", status: "Delivered" },
    { id: "20", name: "Hadiza Lawal", email: "hadiza.lawal7@gmail.com", product: "1 After-Natal", time: "Today 10:36", status: "Delivered" },
    { id: "21", name: "Hadiza Lawal", email: "hadiza.lawal7@gmail.com", product: "1 After-Natal", time: "Today 10:36", status: "Delivered" },
    { id: "22", name: "Hadiza Lawal", email: "hadiza.lawal7@gmail.com", product: "1 After-Natal", time: "Today 10:36", status: "Delivered" },
    { id: "23", name: "Hadiza Lawal", email: "hadiza.lawal7@gmail.com", product: "1 After-Natal", time: "Today 10:36", status: "Delivered" },
    { id: "24", name: "Hadiza Lawal", email: "hadiza.lawal7@gmail.com", product: "1 After-Natal", time: "Today 10:36", status: "Delivered" },

    // Failed
    { id: "25", name: "Blessing Chukwu", email: "blessing.chukwu01@gmail.com", product: "3 Fonio-Mill", time: "Today 10:36", status: "Failed" },
    { id: "26", name: "Funke Ogunleye", email: "funke.ogunleye@gmail.com", product: "2 Prosxact", time: "Today 10:36", status: "Failed" },
    { id: "27", name: "Funke Ogunleye", email: "funke.ogunleye@gmail.com", product: "2 Prosxact", time: "Today 10:36", status: "Failed" },
    { id: "28", name: "Funke Ogunleye", email: "funke.ogunleye@gmail.com", product: "2 Prosxact", time: "Today 10:36", status: "Failed" },
  ];

  const filteredOrders = orders.filter((order) => {
    if (activeFilter === "All") return true;
    if (activeFilter === "Pending") return order.status === "Pending" || order.status === "Rescheduled";
    return order.status === activeFilter;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Delivered": return <div className="w-2.5 h-2.5 rounded-full bg-[#22c55e]"></div>;
      case "Pending": return <div className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]"></div>;
      case "Failed": return <div className="w-2.5 h-2.5 rounded-full bg-[#ef4444]"></div>;
      case "Rescheduled": 
        return (
          <div className="w-2.5 h-2.5 rounded-full relative overflow-hidden bg-white border border-gray-100 flex">
            <div className="w-1/2 h-full bg-[#f59e0b]"></div>
            <div className="w-1/2 h-full bg-white"></div>
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {/* Mobile Top Header */}
      <div className="flex items-center justify-between lg:hidden">
        <div className="flex items-center gap-2">
          <img src="/nuycle-logo.png" alt="Nuycle Logo" className="h-8 w-auto object-contain" />
        </div>
        <div className="flex items-center gap-3">
          <button className="p-2 rounded-full border border-gray-100 bg-white text-gray-500 shadow-sm">
            <Settings className="w-5 h-5" />
          </button>
          <button className="p-2 rounded-full border border-gray-100 bg-white text-gray-500 shadow-sm relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-2.5 right-3 w-1.5 h-1.5 bg-[#ad1df4] rounded-full"></span>
          </button>
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-sm ml-1">
            <img 
              src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100" 
              alt="Profile" 
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="search"
          className="w-full pl-12 pr-4 py-3 bg-white rounded-2xl border-none shadow-sm focus:outline-none text-sm placeholder:text-gray-400"
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        <FilterTab label="All" active={activeFilter === "All"} onClick={() => setActiveFilter("All")} color="purple" />
        <FilterTab label="Pending(14)" active={activeFilter === "Pending"} onClick={() => setActiveFilter("Pending")} color="yellow" />
        <FilterTab label="Delivered(20)" active={activeFilter === "Delivered"} onClick={() => setActiveFilter("Delivered")} color="green" />
        <FilterTab label="Failed(4)" active={activeFilter === "Failed"} onClick={() => setActiveFilter("Failed")} color="red" />
        <FilterTab label="Rescheduled" active={activeFilter === "Rescheduled"} onClick={() => setActiveFilter("Rescheduled")} color="half" />
      </div>

      {/* Orders List */}
      <div className="space-y-6 pt-2">
        {filteredOrders.map((order) => (
          <Link key={order.id} href={`/delivery-agents/${order.id}`}>
            <div className="flex items-start justify-between mb-6 active:scale-[0.98] transition-transform">
              <div className="space-y-1">
                <h3 className="font-bold text-[#1e1e2d] text-base leading-none">{order.name}</h3>
                <p className="text-xs text-gray-400 font-medium">{order.email}</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right space-y-1">
                  <h4 className="font-bold text-[#1e1e2d] text-xs leading-none">{order.product}</h4>
                  <p className="text-[10px] text-gray-400 font-medium">{order.time}</p>
                </div>
                <div className="pt-1">
                  {getStatusIcon(order.status)}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function FilterTab({ 
  label, 
  active, 
  onClick, 
  color 
}: { 
  label: string; 
  active: boolean; 
  onClick: () => void;
  color: "purple" | "yellow" | "green" | "red" | "half";
}) {
  const getDot = () => {
    switch (color) {
      case "yellow": return <div className="w-2 h-2 rounded-full bg-[#f59e0b]"></div>;
      case "green": return <div className="w-2 h-2 rounded-full bg-[#22c55e]"></div>;
      case "red": return <div className="w-2 h-2 rounded-full bg-[#ef4444]"></div>;
      case "half": 
        return (
          <div className="w-2 h-2 rounded-full relative overflow-hidden bg-white flex">
            <div className="w-1/2 h-full bg-[#f59e0b]"></div>
            <div className="w-1/2 h-full bg-white border border-gray-100 border-l-0"></div>
          </div>
        );
      default: return null;
    }
  };

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap border ${
        active 
          ? "bg-[#ad1df4] text-white border-[#ad1df4]" 
          : "bg-[#f1f2f4] text-gray-400 border-transparent hover:bg-gray-200"
      }`}
    >
      {label}
      {getDot()}
    </button>
  );
}
