"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, SlidersHorizontal, ArrowUpDown } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type SalesRep = {
  id: string;
  name: string;
  phone: string | null;
  pendingOrders: number;
  performance: number;
};

const avatarColors = [
  "bg-purple-600", "bg-rose-500", "bg-emerald-500", "bg-amber-500", "bg-blue-500",
  "bg-red-500", "bg-green-500", "bg-cyan-500", "bg-orange-500",
];

function getInitials(name: string) {
  return name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
}

function PerformanceBadge({ value }: { value: number }) {
  const isGood = value >= 85;
  const isFair = value >= 70;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[0.82rem] font-bold ${
      isGood ? "text-emerald-600 bg-emerald-50" : isFair ? "text-amber-600 bg-amber-50" : "text-rose-600 bg-rose-50"
    }`}>
      {value}%
    </span>
  );
}

export default function SalesRepListClient({ reps }: { reps: SalesRep[] }) {
  const [search, setSearch] = useState("");

  const filtered = reps.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    (r.phone ?? "").includes(search)
  );

  return (
    <div className="max-w-[1200px] mx-auto font-inter text-slate-900">
      <div className="flex justify-end mb-4">
        <span className="text-[0.95rem] text-slate-400 font-medium">Sales Representatives</span>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg bg-white text-[0.85rem] font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm">
          <SlidersHorizontal size={15} />
          Filter
        </button>

        <Select defaultValue="all">
          <SelectTrigger className="w-[120px] h-[38px] border-slate-200 rounded-lg bg-white text-[0.85rem] font-medium text-slate-700 shadow-sm">
            <SelectValue placeholder="Team" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Teams</SelectItem>
            <SelectItem value="team-1">Team 1</SelectItem>
            <SelectItem value="team-2">Team 2</SelectItem>
            <SelectItem value="team-3">Team 3</SelectItem>
          </SelectContent>
        </Select>

        <button className="flex items-center gap-1 px-2.5 py-2 border border-slate-200 rounded-lg bg-white text-slate-400 hover:bg-slate-50 transition-colors shadow-sm">
          <ArrowUpDown size={15} />
        </button>

        <div className="flex-1" />

        <div className="flex items-center gap-2 border border-slate-200 rounded-lg px-4 py-2 bg-white min-w-[280px] shadow-sm">
          <Search size={15} className="text-slate-400" />
          <input
            type="text"
            placeholder="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="border-none outline-none text-[0.85rem] text-slate-700 bg-transparent w-full placeholder:text-slate-400"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-[0_1px_6px_rgba(0,0,0,0.07)] overflow-hidden">
        <div className="grid grid-cols-[2fr_1.4fr_1.2fr_1fr] px-6 py-4 border-b border-slate-100 bg-[#ddd]">
          {["Name", "No of Pending Orders", "Phone Number", "Performance"].map(h => (
            <span key={h} className="text-[0.8rem] font-bold text-slate-600 uppercase tracking-tight">{h}</span>
          ))}
        </div>

        <div className="divide-y divide-slate-50">
          {filtered.length === 0 ? (
            <div className="px-6 py-10 text-center text-slate-400 text-[0.9rem]">No sales reps found.</div>
          ) : (
            filtered.map((rep, i) => (
              <Link
                key={rep.id}
                href={`/admin/staff/sales-rep/${rep.id}`}
                className="grid grid-cols-[2fr_1.4fr_1.2fr_1fr] px-6 py-4 items-center hover:bg-slate-50/80 transition-all duration-200 group no-underline"
              >
                <div className="flex items-center gap-3.5">
                  <div className={`w-9 h-9 rounded-full ${avatarColors[i % avatarColors.length]} flex items-center justify-center text-white text-[0.75rem] font-bold shrink-0 shadow-sm`}>
                    {getInitials(rep.name)}
                  </div>
                  <span className="text-[0.9rem] font-semibold text-slate-900 group-hover:text-purple-600 transition-colors">
                    {rep.name}
                  </span>
                </div>
                <div className="text-[0.9rem] text-slate-600 font-medium">{rep.pendingOrders}</div>
                <div className="text-[0.9rem] text-slate-600 font-medium">{rep.phone ?? "—"}</div>
                <div><PerformanceBadge value={rep.performance} /></div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
