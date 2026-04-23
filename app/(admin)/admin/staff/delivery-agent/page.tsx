import type { Metadata } from "next";
import Link from "next/link";
import { Search, SlidersHorizontal, ArrowUpDown } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const metadata: Metadata = { title: "Delivery Agents" };

const deliveryAgents = [
  { id: 1, name: "Mr Ola Adewale", pendingOrders: 5, state: "Lagos", phone: "0803 547 2198", performance: 83, badge: null },
  { id: 2, name: "Mr. Qudus Aina", pendingOrders: 12, state: "Lagos", phone: "0706 381 4402", performance: 87, badge: null },
  { id: 3, name: "Mr. Praise Ike", pendingOrders: 19, state: "Ebonyi", phone: "0803 547 2198", performance: 89, badge: null },
  { id: 4, name: "Flymack | Lagos", pendingOrders: 13, state: "Lagos", phone: "0806 447 3096", performance: 68, badge: null },
  { id: 5, name: "Mr Oyelowo John", pendingOrders: 10, state: "Osun", phone: "0816 992 1057", performance: 86, badge: null },
  { id: 6, name: "Mrs. Sumni", pendingOrders: 20, state: "Oyo", phone: "0813 608 7749", performance: 86, badge: null },
  { id: 7, name: "Mr. Adeola Isaiah", pendingOrders: 9, state: "Ogun", phone: "0905 274 6631", performance: 88, badge: null },
  { id: 8, name: "Flymack | Kaduna", pendingOrders: 13, state: "Kaduna", phone: "0806 447 3096", performance: 68, badge: "SUSPENDED" },
  { id: 9, name: "AirPeace", pendingOrders: 6, state: "Kwara", phone: "0703 915 4280", performance: 84, badge: null },
  { id: 10, name: "Mr. Okong Ife", pendingOrders: 17, state: "Rivers", phone: "0810 532 1184", performance: 71, badge: null },
];

const nigerianStates = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue",
  "Borno", "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT",
  "Gombe", "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi",
  "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo",
  "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara",
];

const avatarColors = [
  "bg-purple-600", "bg-rose-500", "bg-emerald-500", "bg-amber-500", "bg-blue-500",
  "bg-red-500", "bg-green-500", "bg-cyan-500", "bg-orange-500", "bg-indigo-500",
];

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

export default function DeliveryAgentPage() {
  return (
    <div className="max-w-[1200px] mx-auto font-inter text-slate-900">
      {/* ── Header Subtitle ── */}
      <div className="flex justify-end mb-4">
        <span className="text-[0.95rem] text-slate-400 font-medium">Delivery Agents</span>
      </div>

      {/* ── Toolbar ── */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        {/* Filter */}
        <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg bg-white text-[0.85rem] font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
          <SlidersHorizontal size={15} />
          Filter
        </button>

        {/* State dropdown */}
        <Select>
          <SelectTrigger className="w-[140px] h-[38px] border-slate-200 rounded-lg bg-white text-[0.85rem] font-medium text-slate-700">
            <SelectValue placeholder="State" />
          </SelectTrigger>
          <SelectContent className="max-h-[300px]">
            {nigerianStates.map((state) => (
              <SelectItem key={state} value={state.toLowerCase()}>
                {state}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Sort */}
        <button className="flex items-center gap-1 px-2.5 py-2 border border-slate-200 rounded-lg bg-white text-slate-400 hover:bg-slate-50 transition-colors">
          <ArrowUpDown size={15} />
        </button>

        <div className="flex-1" />

        {/* Search */}
        <div className="flex items-center gap-2 border border-slate-200 rounded-lg px-4 py-2 bg-white min-w-[280px]">
          <Search size={15} className="text-slate-400" />
          <input
            type="text"
            placeholder="search"
            className="border-none outline-none text-[0.85rem] text-slate-700 bg-transparent w-full placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded-2xl shadow-[0_1px_6px_rgba(0,0,0,0.07)] overflow-hidden">
        {/* Header row */}
        <div className="grid grid-cols-[2.5fr_1.5fr_1fr_1.5fr_1fr] px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          {["Name", "No of Pending Orders", "State", "Phone Number", "Performance"].map((h) => (
            <span key={h} className="text-[0.8rem] font-bold text-slate-600 uppercase tracking-tight">
              {h}
            </span>
          ))}
        </div>

        {/* Rows */}
        <div className="divide-y divide-slate-50">
          {deliveryAgents.map((agent, i) => (
            <Link
              key={agent.id}
              href={`/admin/staff/delivery-agent/${agent.id}`}
              className="grid grid-cols-[2.5fr_1.5fr_1fr_1.5fr_1fr] px-6 py-4 items-center hover:bg-slate-50/80 transition-all duration-200 group no-underline"
            >
              {/* Name + avatar */}
              <div className="flex items-center gap-3.5">
                <div className={`w-9 h-9 rounded-full ${avatarColors[i % avatarColors.length]} flex items-center justify-center text-white text-[0.75rem] font-bold shrink-0 shadow-sm`}>
                  {getInitials(agent.name)}
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="text-[0.9rem] font-semibold text-slate-900 group-hover:text-purple-600 transition-colors">
                    {agent.name}
                  </span>
                  {agent.badge && (
                    <span
                      className={`text-[0.55rem] font-black text-white ${
                        agent.badge === "SUSPENDED" ? "bg-red-500" : "bg-purple-600"
                      } rounded-[4px] px-1.5 py-0.5 tracking-wider uppercase`}
                    >
                      {agent.badge}
                    </span>
                  )}
                </div>
              </div>

              <div className="text-[0.9rem] text-slate-600 font-medium pl-2.5">{agent.pendingOrders}</div>
              <div className="text-[0.9rem] text-slate-600 font-medium">{agent.state}</div>
              <div className="text-[0.9rem] text-slate-600 font-medium">{agent.phone}</div>
              <div className="text-[0.9rem] font-bold text-slate-700">{agent.performance}%</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
