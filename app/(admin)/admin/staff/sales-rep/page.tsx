import type { Metadata } from "next";
import Link from "next/link";
import { Search, SlidersHorizontal, ArrowUpDown, ChevronDown } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const metadata: Metadata = { title: "Sales Representatives" };

const salesReps = [
  { id: 1, name: "Blessing Ehijie", pendingOrders: 5, phone: "0803 547 2198", performance: 83 },
  { id: 2, name: "Chiamaka Okorie", pendingOrders: 12, phone: "0706 381 4402", performance: 87 },
  { id: 3, name: "Adebimpe Tolani", pendingOrders: 19, phone: "0803 547 2198", performance: 89 },
  { id: 4, name: "Ibrahim Sadiq", pendingOrders: 10, phone: "0816 992 1057", performance: 86 },
  { id: 5, name: "Emeka Nwankwo", pendingOrders: 20, phone: "0813 608 7749", performance: 86 },
  { id: 6, name: "Funmilayo Ogunleye", pendingOrders: 9, phone: "0905 274 6631", performance: 88 },
  { id: 7, name: "Tunde Ajayi", pendingOrders: 13, phone: "0806 447 3096", performance: 68 },
  { id: 8, name: "Zainab Bello", pendingOrders: 6, phone: "0703 915 4280", performance: 84 },
  { id: 9, name: "Blessing Efiong", pendingOrders: 17, phone: "0810 532 1184", performance: 71 },
];

const avatarColors = [
  "bg-purple-600", "bg-rose-500", "bg-emerald-500", "bg-amber-500", "bg-blue-500",
  "bg-red-500", "bg-green-500", "bg-cyan-500", "bg-orange-500",
];

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

function PerformanceBadge({ value }: { value: number }) {
  const isGood = value >= 85;
  const isFair = value >= 70;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[0.82rem] font-bold ${isGood ? "text-emerald-600 bg-emerald-50" : isFair ? "text-amber-600 bg-amber-50" : "text-rose-600 bg-rose-50"
        }`}
    >
      {value}%
    </span>
  );
}

export default function SalesRepPage() {
  return (
    <div className="max-w-[1200px] mx-auto font-inter text-slate-900">
      {/* ── Header Subtitle ── */}
      <div className="flex justify-end mb-4">
        <span className="text-[0.95rem] text-slate-400 font-medium">Sales Representatives</span>
      </div>

      {/* ── Toolbar ── */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg bg-white text-[0.85rem] font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm">
          <SlidersHorizontal size={15} />
          Filter
        </button>

        <Select defaultValue="team-2">
          <SelectTrigger className="w-[120px] h-[38px] border-slate-200 rounded-lg bg-white text-[0.85rem] font-medium text-slate-700 shadow-sm">
            <SelectValue placeholder="Team" />
          </SelectTrigger>
          <SelectContent>
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
            className="border-none outline-none text-[0.85rem] text-slate-700 bg-transparent w-full placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded-2xl shadow-[0_1px_6px_rgba(0,0,0,0.07)] overflow-hidden">
        {/* Header row */}
        <div className="grid grid-cols-[2fr_1.4fr_1.2fr_1fr] px-6 py-4 border-b border-slate-100 bg-[#ddd]">
          {["Name", "No of Pending Orders", "Phone Number", "Performance"].map((h) => (
            <span key={h} className="text-[0.8rem] font-bold text-slate-600 uppercase tracking-tight">
              {h}
            </span>
          ))}
        </div>

        {/* Rows */}
        <div className="divide-y divide-slate-50">
          {salesReps.map((rep, i) => (
            <Link
              key={rep.id}
              href={`/admin/staff/sales-rep/${rep.id}`}
              className="grid grid-cols-[2fr_1.4fr_1.2fr_1fr] px-6 py-4 items-center hover:bg-slate-50/80 transition-all duration-200 group no-underline"
            >
              {/* Name + avatar */}
              <div className="flex items-center gap-3.5">
                <div className={`w-9 h-9 rounded-full ${avatarColors[i % avatarColors.length]} flex items-center justify-center text-white text-[0.75rem] font-bold shrink-0 shadow-sm`}>
                  {getInitials(rep.name)}
                </div>
                <span className="text-[0.9rem] font-semibold text-slate-900 group-hover:text-purple-600 transition-colors">
                  {rep.name}
                </span>
              </div>

              <div className="text-[0.9rem] text-slate-600 font-medium">{rep.pendingOrders}</div>
              <div className="text-[0.9rem] text-slate-600 font-medium">{rep.phone}</div>
              <div><PerformanceBadge value={rep.performance} /></div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
