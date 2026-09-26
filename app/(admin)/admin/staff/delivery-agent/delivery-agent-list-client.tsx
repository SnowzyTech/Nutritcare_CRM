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

type DeliveryAgent = {
  id: string;
  companyName: string;
  state: string | null;
  phone1: string;
  status: "ACTIVE" | "INACTIVE";
  pendingOrders: number;
  performance: number;
};

const nigerianStates = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue",
  "Borno", "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT",
  "Gombe", "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi",
  "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo",
  "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara",
];

const avatarColors = [
  "bg-purple-600", "bg-rose-500", "bg-emerald-500", "bg-amber-500",
  "bg-blue-500", "bg-red-500", "bg-green-500", "bg-cyan-500",
];

function getInitials(name: string) {
  return name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
}

export default function DeliveryAgentListClient({ agents }: { agents: DeliveryAgent[] }) {
  const [search, setSearch] = useState("");
  const [stateFilter, setStateFilter] = useState<string | null>("all");

  const filtered = agents.filter(a => {
    const matchesSearch =
      a.companyName.toLowerCase().includes(search.toLowerCase()) ||
      a.phone1.includes(search);
    const matchesState =
      !stateFilter || stateFilter === "all" ||
      (a.state ?? "").toLowerCase().includes(stateFilter.toLowerCase());
    return matchesSearch && matchesState;
  });

  return (
    <div className="max-w-[1200px] mx-auto font-inter text-slate-900">
      <div className="flex justify-end mb-4">
        <span className="text-[0.95rem] text-slate-400 font-medium">Delivery Agents</span>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg bg-white text-[0.85rem] font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
          <SlidersHorizontal size={15} />
          Filter
        </button>

        <Select value={stateFilter} onValueChange={setStateFilter}>
          <SelectTrigger className="w-[140px] h-[38px] border-slate-200 rounded-lg bg-white text-[0.85rem] font-medium text-slate-700">
            <SelectValue placeholder="State" />
          </SelectTrigger>
          <SelectContent className="max-h-[300px]">
            <SelectItem value="all">All States</SelectItem>
            {nigerianStates.map(s => (
              <SelectItem key={s} value={s.toLowerCase()}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <button className="flex items-center gap-1 px-2.5 py-2 border border-slate-200 rounded-lg bg-white text-slate-400 hover:bg-slate-50 transition-colors">
          <ArrowUpDown size={15} />
        </button>

        <div className="flex-1" />

        <div className="flex items-center gap-2 border border-slate-200 rounded-lg px-4 py-2 bg-white min-w-[280px]">
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
        <div className="grid grid-cols-[2.5fr_1.5fr_1fr_1.5fr_1fr] px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          {["Name", "No of Pending Orders", "State", "Phone Number", "Performance"].map(h => (
            <span key={h} className="text-[0.8rem] font-bold text-slate-600 uppercase tracking-tight">{h}</span>
          ))}
        </div>

        <div className="divide-y divide-slate-50">
          {filtered.length === 0 ? (
            <div className="px-6 py-10 text-center text-slate-400 text-[0.9rem]">No agents found.</div>
          ) : (
            filtered.map((agent, i) => (
              <Link
                key={agent.id}
                href={`/admin/staff/delivery-agent/${agent.id}`}
                className="grid grid-cols-[2.5fr_1.5fr_1fr_1.5fr_1fr] px-6 py-4 items-center hover:bg-slate-50/80 transition-all duration-200 group no-underline"
              >
                <div className="flex items-center gap-3.5">
                  <div className={`w-9 h-9 rounded-full ${avatarColors[i % avatarColors.length]} flex items-center justify-center text-white text-[0.75rem] font-bold shrink-0 shadow-sm`}>
                    {getInitials(agent.companyName)}
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="text-[0.9rem] font-semibold text-slate-900 group-hover:text-purple-600 transition-colors">
                      {agent.companyName}
                    </span>
                    {agent.status === "INACTIVE" && (
                      <span className="text-[0.55rem] font-black text-white bg-red-500 rounded-[4px] px-1.5 py-0.5 tracking-wider uppercase">
                        SUSPENDED
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-[0.9rem] text-slate-600 font-medium pl-2.5">{agent.pendingOrders}</div>
                <div className="text-[0.9rem] text-slate-600 font-medium">
                  {agent.state ? agent.state.replace(" State", "") : "—"}
                </div>
                <div className="text-[0.9rem] text-slate-600 font-medium">{agent.phone1}</div>
                <div className="text-[0.9rem] font-bold text-slate-700">{agent.performance}%</div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
