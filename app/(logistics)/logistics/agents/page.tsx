"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, PlusCircle } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";

export default function AgentsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("Agents");

  const agentsData = Array.from({ length: 17 }, (_, i) => ({
    id: i + 1,
    name: i % 2 === 0 ? "John" : "Kenny",
    state: "Imo State",
    address: "Owerri",
    phones: ["09085635258", "08052588563"],
    status: "Active",
    addedBy: "Yusuf Adeyemi",
    action: "Created",
  }));

  const driversData = Array.from({ length: 10 }, (_, i) => ({
    id: i + 1,
    name: `Driver ${i + 1}`,
    state: "Lagos State",
    address: "Ikeja",
    phones: ["07012345678", "08187654321"],
    status: "Active",
    addedBy: "Yusuf Adeyemi",
    action: "Created",
  }));

  const currentData = activeTab === "Agents" ? agentsData : driversData;

  const handleRowClick = (id: number) => {
    if (activeTab === "Agents") {
      router.push(`/logistics/agents/${id}`);
    } else {
      router.push(`/logistics/agents/driver/${id}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Switcher */}
      <div className="flex justify-center mt-4">
        <div className="flex bg-white rounded-lg p-1 border shadow-sm w-full max-w-md">
          <button
            onClick={() => setActiveTab("Agents")}
            className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${
              activeTab === "Agents"
                ? "bg-[#faf5ff] text-[#ad1df4] border-[#ad1df4] border"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            Agents
          </button>
          <button
            onClick={() => setActiveTab("Drivers")}
            className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${
              activeTab === "Drivers"
                ? "bg-[#faf5ff] text-[#ad1df4] border-[#ad1df4] border"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            Drivers
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-xl p-4 flex items-center justify-between shadow-sm border border-gray-100">
        <div className="relative w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search..."
            className="w-full pl-10 pr-4 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-[#ad1df4] focus:border-[#ad1df4]"
          />
        </div>
        <div className="flex items-center gap-2">
          <Link href={activeTab === "Agents" ? "/logistics/agents/new" : "/logistics/agents/new-driver"}>
            <Button variant="outline" className="text-[#ad1df4] border-[#ad1df4] hover:bg-[#faf5ff] gap-2 font-semibold h-10">
              Add New {activeTab === "Agents" ? "Agent" : "Driver"} <PlusCircle className="w-5 h-5" />
            </Button>
          </Link>
          <Button variant="outline" className="text-gray-500 border-gray-300 hover:bg-gray-50 h-10 px-6 font-semibold">
            Excel
          </Button>
          <Button variant="outline" className="text-gray-500 border-gray-300 hover:bg-gray-50 h-10 px-6 font-semibold">
            Edit
          </Button>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#faf5ff] text-gray-500 uppercase font-semibold">
              <tr>
                <th className="px-4 py-4 w-10"><Checkbox className="border-gray-300" /></th>
                <th className="px-4 py-4">ID</th>
                <th className="px-4 py-4">{activeTab === "Agents" ? "Company/Agent Name" : "Driver Name"}</th>
                <th className="px-4 py-4">States</th>
                <th className="px-4 py-4">Address</th>
                <th className="px-4 py-4 text-center">Phone Numbers</th>
                <th className="px-4 py-4">Status</th>
                <th className="px-4 py-4">Review</th>
                <th className="px-4 py-4">Added By:</th>
                <th className="px-4 py-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {currentData.map((item) => (
                <tr 
                  key={item.id} 
                  className="hover:bg-[#faf5ff]/30 transition-colors cursor-pointer"
                  onClick={() => handleRowClick(item.id)}
                >
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}><Checkbox className="border-gray-300" /></td>
                  <td className="px-4 py-3 text-gray-600">{item.id}</td>
                  <td className="px-4 py-3 text-gray-700 font-medium">{item.name}</td>
                  <td className="px-4 py-3 text-gray-600">{item.state}</td>
                  <td className="px-4 py-3 text-gray-600">{item.address}</td>
                  <td className="px-4 py-3 text-[#ad1df4] font-medium text-center">
                    {item.phones.map((phone, idx) => (
                      <div key={idx}>{phone}</div>
                    ))}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{item.status}</td>
                  <td className="px-4 py-3">
                    <button className="text-[#ad1df4] font-semibold hover:underline">Add Review+</button>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{item.addedBy}</td>
                  <td className="px-4 py-3 text-gray-600">{item.action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex justify-end gap-2 pb-8">
        <Button variant="outline" className="h-8 text-xs bg-gray-200 text-gray-500 border-none hover:bg-gray-300 px-4">
          Previous
        </Button>
        <Button className="h-8 w-8 text-xs bg-[#ad1df4] hover:bg-[#8e14cc] text-white rounded-md">
          1
        </Button>
        <Button variant="outline" className="h-8 text-xs bg-gray-200 text-gray-500 border-none hover:bg-gray-300 px-4">
          Next
        </Button>
      </div>
    </div>
  );
}
