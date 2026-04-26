"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, PlusCircle } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";

type AgentRow = {
  id: string;
  companyName: string;
  state: string | null;
  address: string | null;
  phone1: string;
  phone2: string | null;
  phone3: string | null;
  status: string;
  addedBy: { name: string };
  user: { id: string } | null;
};

interface Props {
  agents: AgentRow[];
  drivers: AgentRow[];
}

export default function AgentsListClient({ agents, drivers }: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"Agents" | "Drivers">("Agents");
  const [search, setSearch] = useState("");

  const currentData = activeTab === "Agents" ? agents : drivers;

  const filtered = currentData.filter((item) => {
    const q = search.toLowerCase();
    return (
      item.companyName.toLowerCase().includes(q) ||
      (item.state ?? "").toLowerCase().includes(q) ||
      item.phone1.includes(q)
    );
  });

  const handleRowClick = (id: string) => {
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
          {(["Agents", "Drivers"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${
                activeTab === tab
                  ? "bg-[#faf5ff] text-[#ad1df4] border-[#ad1df4] border"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-xl p-4 flex items-center justify-between shadow-sm border border-gray-100">
        <div className="relative w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, state, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-[#ad1df4] focus:border-[#ad1df4]"
          />
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={
              activeTab === "Agents"
                ? "/logistics/agents/new"
                : "/logistics/agents/new-driver"
            }
          >
            <Button
              variant="outline"
              className="text-[#ad1df4] border-[#ad1df4] hover:bg-[#faf5ff] gap-2 font-semibold h-10"
            >
              Add New {activeTab === "Agents" ? "Agent" : "Driver"}{" "}
              <PlusCircle className="w-5 h-5" />
            </Button>
          </Link>
          <Button
            variant="outline"
            className="text-gray-500 border-gray-300 hover:bg-gray-50 h-10 px-6 font-semibold"
          >
            Excel
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#faf5ff] text-gray-500 uppercase font-semibold">
              <tr>
                <th className="px-4 py-4 w-10">
                  <Checkbox className="border-gray-300" />
                </th>
                <th className="px-4 py-4">
                  {activeTab === "Agents" ? "Company/Agent Name" : "Driver Name"}
                </th>
                <th className="px-4 py-4">State</th>
                <th className="px-4 py-4">Address</th>
                <th className="px-4 py-4 text-center">Phone Numbers</th>
                <th className="px-4 py-4">Status</th>
                <th className="px-4 py-4">Review</th>
                <th className="px-4 py-4">Added By</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-gray-400">
                    No {activeTab.toLowerCase()} found
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-[#faf5ff]/30 transition-colors cursor-pointer"
                    onClick={() => handleRowClick(item.id)}
                  >
                    <td
                      className="px-4 py-3"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Checkbox className="border-gray-300" />
                    </td>
                    <td className="px-4 py-3 text-gray-700 font-medium">
                      {item.companyName}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {item.state ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {item.address ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-[#ad1df4] font-medium text-center">
                      <div>{item.phone1}</div>
                      {item.phone2 && <div>{item.phone2}</div>}
                      {item.phone3 && <div>{item.phone3}</div>}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          item.status === "ACTIVE"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-red-100 text-red-600"
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        className="text-[#ad1df4] font-semibold hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Add Review+
                      </button>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {item.addedBy.name}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination — static for now */}
      <div className="flex justify-end gap-2 pb-8">
        <Button
          variant="outline"
          className="h-8 text-xs bg-gray-200 text-gray-500 border-none hover:bg-gray-300 px-4"
        >
          Previous
        </Button>
        <Button className="h-8 w-8 text-xs bg-[#ad1df4] hover:bg-[#8e14cc] text-white rounded-md">
          1
        </Button>
        <Button
          variant="outline"
          className="h-8 text-xs bg-gray-200 text-gray-500 border-none hover:bg-gray-300 px-4"
        >
          Next
        </Button>
      </div>
    </div>
  );
}
