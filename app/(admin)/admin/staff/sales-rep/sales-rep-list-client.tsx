"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, SlidersHorizontal, ArrowUpDown, ChevronDown } from "lucide-react";
import Image from "next/image";

type SalesRep = {
  id: string;
  name: string;
  phone: string | null;
  pendingOrders: number;
  performance: number;
  state?: string;
  avatarUrl?: string | null;
};

export default function SalesRepListClient({ reps }: { reps: SalesRep[] }) {
  const [search, setSearch] = useState("");
  const [selectedState, setSelectedState] = useState("__all__");

  const filtered = reps.filter(r => {
    const matchesSearch = r.name.toLowerCase().includes(search.toLowerCase()) ||
      (r.phone ?? "").includes(search);
    const matchesState = selectedState === "__all__" || r.state === selectedState;
    return matchesSearch && matchesState;
  });

  const nigerianStates = [
    "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno",
    "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "Gombe", "Imo",
    "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos",
    "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers",
    "Sokoto", "Taraba", "Yobe", "Zamfara", "FCT"
  ];

  return (
    <div className="max-w-[1200px] mx-auto">
      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex items-center gap-2 text-gray-400 font-medium text-sm">
          <SlidersHorizontal size={16} />
          Filter
        </div>

        {/* State Filter */}
        <div className="relative">
          <select
            value={selectedState}
            onChange={(e) => setSelectedState(e.target.value)}
            className="appearance-none bg-transparent text-sm text-gray-500 font-medium pl-2 pr-6 py-1 outline-none cursor-pointer"
          >
            <option value="__all__">State</option>
            {nigerianStates.map(state => (
              <option key={state} value={state}>{state}</option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-1 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>

        <button className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-gray-400 hover:bg-gray-50 transition-all">
          <ArrowUpDown size={16} />
        </button>

        <div className="flex-1" />

        <div className="flex items-center gap-2 border border-gray-200 rounded px-3 py-2 bg-white min-w-[200px]">
          <Search size={14} className="text-gray-400" />
          <input
            type="text"
            placeholder="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="border-none outline-none text-sm text-gray-600 bg-transparent w-full placeholder:text-gray-400"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-gray-50/50  overflow-hidden">
        {/* Header row */}
        <div className="grid grid-cols-[2fr_1.2fr_1fr_1.2fr_1fr] px-6 sm:px-8 py-4 border-b border-gray-100 bg-gray-50">
          {["Name", "No of Pending Orders", "State", "Phone Number", "Performance"].map(h => (
            <span key={h} className="text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</span>
          ))}
        </div>

        {/* Rows */}
        {filtered.length === 0 ? (
          <div className="py-20 text-center text-gray-400 text-sm bg-white">No sales reps found.</div>
        ) : (
          <div>
            {filtered.map((rep, i) => {
              const isEvenRow = i % 2 === 0;
              return (
                <Link
                  key={rep.id}
                  href={`/admin/staff/sales-rep/${rep.id}`}
                  className={`grid grid-cols-[2fr_1.2fr_1fr_1.2fr_1fr] px-6 sm:px-8 py-4 items-center border-b border-gray-50 last:border-0 transition-colors ${
                    isEvenRow ? "bg-white" : "bg-gray-50"
                  } hover:bg-gray-100/50`}
                >
                  {/* Name + Avatar */}
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 bg-gray-100">
                      {rep.avatarUrl ? (
                        <Image src={rep.avatarUrl} alt={rep.name} width={32} height={32} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-500">
                          {rep.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <span className="text-sm font-medium text-gray-700 truncate">
                      {rep.name}
                    </span>
                  </div>

                  {/* Pending Orders */}
                  <span className="text-sm text-gray-600 text-center">{rep.pendingOrders}</span>

                  {/* State */}
                  <span className="text-sm text-gray-600">{rep.state ?? "—"}</span>

                  {/* Phone Number */}
                  <span className="text-sm text-gray-600">{rep.phone ?? "—"}</span>

                  {/* Performance */}
                  <span className="text-sm text-gray-600">{rep.performance}%</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
