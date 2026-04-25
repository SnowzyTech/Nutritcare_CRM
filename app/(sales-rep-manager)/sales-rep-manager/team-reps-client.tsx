"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, SlidersHorizontal, ArrowUpDown } from "lucide-react";

export type TeamRepItem = {
  id: string;
  name: string;
  pendingOrders: number;
  phone: string | null;
  performance: number;
  avatarUrl: string | null;
};

interface TeamRepsClientProps {
  reps: TeamRepItem[];
  teamName: string;
}

export function TeamRepsClient({ reps, teamName }: TeamRepsClientProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredReps = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return reps;
    return reps.filter(
      r =>
        r.name.toLowerCase().includes(q) ||
        (r.phone ?? "").toLowerCase().includes(q)
    );
  }, [reps, searchQuery]);

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-6">
      {/* Manager Mode Header */}
      <div className="flex items-center gap-3">
        <span className="bg-[#3B0069] text-white text-sm font-bold uppercase tracking-wider px-3 py-1.5 rounded-full shadow-sm">
          Manager Mode
        </span>
        <span className="bg-[#F3E8FF] text-[#A020F0] text-[10px] font-bold px-2.5 py-0.5 rounded-md border border-[#D6BBFB]">
          {teamName}
        </span>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-4 bg-white p-3 rounded-2xl shadow-sm border border-gray-100">
        <button className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors">
          <SlidersHorizontal size={18} />
          <span className="text-sm font-medium">Filter</span>
        </button>
        <div className="relative">
          <select
            className="appearance-none bg-gray-50 border border-gray-100 rounded-lg pl-3 pr-8 py-2 text-sm text-gray-500 font-medium outline-none hover:bg-gray-100 transition-colors cursor-pointer"
            defaultValue={teamName}
          >
            <option>{teamName}</option>
          </select>
          <ArrowUpDown
            size={14}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
        </div>
        <div className="ml-auto relative">
          <input
            type="text"
            placeholder="Search by name or phone…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-100 w-64 transition-all"
          />
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {filteredReps.length === 0 ? (
          <div className="py-20 text-center text-gray-400 text-sm">
            {reps.length === 0 ? "No active sales reps in this team." : "No reps match your search."}
          </div>
        ) : (
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-[11px] w-16">
                  Avatar
                </th>
                <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-[11px]">
                  Name
                </th>
                <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-[11px] text-center">
                  Pending Orders
                </th>
                <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-[11px]">
                  Phone Number
                </th>
                <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-[11px] text-right">
                  Performance
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredReps.map((rep, idx) => (
                <tr
                  key={rep.id}
                  className={`group hover:bg-purple-50/50 transition-colors ${
                    idx % 2 === 0 ? "bg-white" : "bg-gray-50/30"
                  }`}
                >
                  <td className="px-6 py-4">
                    <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-sm border border-purple-200 overflow-hidden shrink-0">
                      {rep.avatarUrl ? (
                        <img
                          src={rep.avatarUrl}
                          alt={rep.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        rep.name.charAt(0)
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-bold text-gray-900">
                    <Link href={`/sales-rep-manager/${rep.id}`} className="hover:underline">
                      {rep.name}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-center font-medium text-gray-600">
                    {rep.pendingOrders}
                  </td>
                  <td className="px-6 py-4 text-gray-500 font-medium">{rep.phone ?? "—"}</td>
                  <td className="px-6 py-4 text-right">
                    <span className="inline-flex items-center justify-center bg-green-50 text-green-700 px-3 py-1 rounded-full font-bold text-xs border border-green-100">
                      {rep.performance}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
