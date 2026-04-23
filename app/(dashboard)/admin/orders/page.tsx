"use client";

import { Search, SlidersHorizontal, ArrowUpDown, ChevronDown } from "lucide-react";
import Link from "next/link";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// export const metadata: Metadata = { title: "All Orders" }; // Removed because client component cannot export metadata


const nigerianStates = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue",
  "Borno", "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT",
  "Gombe", "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi",
  "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo",
  "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara",
];

const orders = [
  { id: 1, email: "adewale.johnson.ng@gmail.com", name: "Adewale Johnson", agent: "", agentState: "", state: "Kaduna", stateSub: "Kaduna", salesRep: "Oyetude", product: "Prosxact", quantity: 3, date: "Today", status: "pending" },
  { id: 2, email: "funke.adebayo.ng@gmail.com", name: "Funke Adebayo", agent: "", agentState: "", state: "Abia", stateSub: "Abia State", salesRep: "Tayo", product: "Shred Belly", quantity: 2, date: "Today", status: "pending" },
  { id: 3, email: "ibrahim.musa.ng@gmail.com", name: "Ibrahim Musa", agent: "Mr. Ola", agentState: "Lagos State", state: "Lagos", stateSub: "Lagos State", salesRep: "Mr. Olumide", product: "Fonio-Mill", quantity: 5, date: "Today", status: "failed" },
  { id: 4, email: "chinedu.okafor.ng@gmail.com", name: "Chinedu Okafor", agent: "Mr. Qudus", agentState: "Lagos State", state: "Lagos", stateSub: "Lagos State", salesRep: "Blessing Ehijie", product: "Trim and Tone", quantity: 4, date: "Today", status: "confirmed" },
  { id: 5, email: "blessing.eze.ng@gmail.com", name: "Blessing Eze", agent: "Mr. Oyelowo", agentState: "Ogun State", state: "Ogun", stateSub: "Ogun State", salesRep: "Sunmi", product: "Neuro-Vive Balm", quantity: 1, date: "Today", status: "cancelled" },
  { id: 6, email: "sola.ogunleye.ng@gmail.com", name: "Sola Ogunleye", agent: "", agentState: "", state: "Kano", stateSub: "Kano State", salesRep: "Yusuf", product: "Prosxact", quantity: 3, date: "Today", status: "pending" },
  { id: 7, email: "halima.abdullahi.ng@gmail.com", name: "Halima Abdullahi", agent: "Mr. Praise", agentState: "Ebonyi State", state: "Ebonyi", stateSub: "Ebonyi State", salesRep: "Deboarah", product: "Shred Belly", quantity: 6, date: "03-02-2026", status: "confirmed" },
  { id: 8, email: "victor.uche.ng@gmail.com", name: "Victor Uche", agent: "", agentState: "", state: "Oyo", stateSub: "Oyo State", salesRep: "Peace", product: "Fonio-Mill", quantity: 7, date: "04-02-2026", status: "pending" },
  { id: 9, email: "victor.uche.ng@gmail.com", name: "Victor Uche", agent: "Mrs. Sumni", agentState: "Oyo State", state: "Oyo", stateSub: "Oyo State", salesRep: "Esther", product: "Fonio-Mill", quantity: 7, date: "04-02-2026", status: "failed" },
  { id: 10, email: "victor.uche.ng@gmail.com", name: "Victor Uche", agent: "Mrs. Sumni", agentState: "Oyo State", state: "Oyo", stateSub: "Oyo State", salesRep: "Esther", product: "Fonio-Mill", quantity: 7, date: "04-02-2026", status: "failed" },
  { id: 11, email: "victor.uche.ng@gmail.com", name: "Victor Uche", agent: "Mrs. Sumni", agentState: "Oyo State", state: "", stateSub: "", salesRep: "", product: "Fonio-Mill", quantity: 7, date: "04-02-2026", status: "pending" },
];

const statusColors: Record<string, string> = {
  pending: "bg-amber-400",
  failed: "bg-red-500",
  confirmed: "bg-emerald-400",
  delivered: "bg-emerald-600",
  cancelled: "bg-orange-300",
};

export default function AllOrdersPage() {
  return (
    <div className="max-w-[1400px] mx-auto font-inter text-slate-900 pb-20">
      {/* ── Order Tabs ── */}
      <div className="bg-white rounded-xl p-3 flex gap-10 items-center shadow-sm border border-slate-50 mb-6 overflow-x-auto">
        <div className="flex items-center gap-2">
          <span className="text-[0.9rem] font-black text-purple-700">All</span>
          <span className="bg-purple-100 text-purple-600 text-[0.7rem] font-black px-2 py-0.5 rounded-[4px]">283</span>
        </div>
        {["Pending(70)", "Confirmed(68)", "Delivered(60)", "Cancelled(12)", "Failed(8)"].map((tab) => (
          <div key={tab} className="text-[0.9rem] font-semibold text-slate-400 whitespace-nowrap cursor-pointer hover:text-slate-600">
            {tab}
          </div>
        ))}
      </div>

      {/* ── Filter Bar ── */}
      <div className="flex flex-wrap items-center gap-3 mb-8">
        <div className="flex items-center gap-2 text-slate-400 font-bold text-sm mr-2">
          <SlidersHorizontal size={16} />
          Filter
        </div>

        {/* Date Filter */}
        <div className="relative">
          <input 
            type="date" 
            id="order-date-picker"
            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
            onChange={(e) => console.log(e.target.value)}
          />
          <button 
            type="button"
            className="flex items-center gap-2 px-3 py-1.5 border border-black rounded-lg bg-white text-[0.75rem] font-black shadow-sm pointer-events-none"
          >
            Date <ChevronDown size={14} />
          </button>
        </div>

        {/* Product dropdown */}
        <Select defaultValue="product">
          <SelectTrigger className="w-[110px] h-[32px] border-black rounded-lg bg-white text-[0.75rem] font-black shadow-sm px-2">
            <SelectValue placeholder="Product" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="product">Product</SelectItem>
            <SelectItem value="prosxact">Prosxact</SelectItem>
            <SelectItem value="shred-belly">Shred Belly</SelectItem>
          </SelectContent>
        </Select>

        {/* State dropdown */}
        <Select defaultValue="state">
          <SelectTrigger className="w-[110px] h-[32px] border-black rounded-lg bg-white text-[0.75rem] font-black shadow-sm px-2">
            <SelectValue placeholder="State" />
          </SelectTrigger>
          <SelectContent className="max-h-[300px]">
            <SelectItem value="state">State</SelectItem>
            {nigerianStates.map((state) => (
              <SelectItem key={state} value={state.toLowerCase()}>
                {state}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Team dropdown */}
        <Select defaultValue="team">
          <SelectTrigger className="w-[110px] h-[32px] border-black rounded-lg bg-white text-[0.75rem] font-black shadow-sm px-2">
            <SelectValue placeholder="Team" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="team">Team</SelectItem>
            <SelectItem value="team-1">Team 1</SelectItem>
            <SelectItem value="team-2">Team 2</SelectItem>
          </SelectContent>
        </Select>

        <button className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-slate-400 hover:bg-slate-50 transition-all">
          <ArrowUpDown size={16} />
        </button>

        <div className="flex gap-2 mx-4">
          <span className="bg-amber-100 text-amber-700 text-[0.65rem] font-black px-3 py-1 rounded-md uppercase">Pending</span>
          <span className="bg-emerald-50 text-emerald-600 text-[0.65rem] font-black px-3 py-1 rounded-md uppercase">Comfirmed</span>
          <span className="bg-emerald-500 text-white text-[0.65rem] font-black px-3 py-1 rounded-md uppercase">Delivered</span>
          <span className="bg-rose-100 text-rose-500 text-[0.65rem] font-black px-3 py-1 rounded-md uppercase">Cancelled</span>
          <span className="bg-rose-600 text-white text-[0.65rem] font-black px-3 py-1 rounded-md uppercase">Failed</span>
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-2 border border-slate-200 rounded-lg px-3 py-1.5 bg-white min-w-[240px] shadow-sm">
          <Search size={14} className="text-slate-400" />
          <input
            type="text"
            placeholder="search"
            className="border-none outline-none text-[0.8rem] text-slate-700 bg-transparent w-full placeholder:text-slate-400 font-medium"
          />
        </div>
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded-2xl shadow-[0_1px_6px_rgba(0,0,0,0.05)] overflow-hidden">
        {/* Header row */}
        <div className="grid grid-cols-[2.2fr_1.2fr_1.2fr_1.2fr_1.2fr_1.2fr_0.8fr_1fr] px-8 py-5 border-b border-slate-100 bg-slate-50/20">
          {["G-Mail", "Name", "Agent", "State", "Sales Rep", "Product", "Quantity", "Date"].map((h, i) => (
            <span key={i} className="text-[0.75rem] font-black text-slate-500 uppercase tracking-tight">
              {h}
            </span>
          ))}
        </div>

        {/* Rows */}
        <div className="divide-y divide-slate-50">
          {orders.map((order) => (
            <Link
              href={`/admin/orders/${order.id}`}
              key={order.id}
              className="grid grid-cols-[2.2fr_1.2fr_1.2fr_1.2fr_1.2fr_1.2fr_0.8fr_1fr] px-8 py-4 items-center hover:bg-slate-50/50 transition-colors group cursor-pointer"
            >
              {/* G-Mail + Status Dot */}
              <div className="flex items-center gap-4">
                <div className={`w-2 h-2 rounded-full ${statusColors[order.status]} shadow-sm`}></div>
                <span className="text-[0.85rem] font-medium text-slate-500 truncate max-w-[200px]">
                  {order.email}
                </span>
              </div>

              {/* Name */}
              <div className="leading-tight">
                 <p className="text-[0.85rem] font-bold text-slate-700">{order.name.split(" ")[0]}</p>
                 <p className="text-[0.85rem] font-bold text-slate-700">{order.name.split(" ")[1]}</p>
              </div>

              {/* Agent */}
              <div className="leading-tight">
                <p className="text-[0.85rem] font-bold text-slate-700">{order.agent || "-"}</p>
                <p className="text-[0.65rem] text-slate-400 font-bold uppercase">{order.agentState}</p>
              </div>

              {/* State */}
              <div className="leading-tight">
                <p className="text-[0.85rem] font-bold text-slate-700">{order.state}</p>
                <p className="text-[0.65rem] text-slate-400 font-bold uppercase">{order.stateSub}</p>
              </div>

              {/* Sales Rep */}
              <span className="text-[0.85rem] font-medium text-slate-600">
                {order.salesRep}
              </span>

              {/* Product */}
              <span className="text-[0.85rem] font-medium text-slate-600">
                {order.product}
              </span>

              {/* Quantity */}
              <span className="text-[0.85rem] font-bold text-slate-700 pl-4">
                {order.quantity}
              </span>

              {/* Date */}
              <span className="text-[0.85rem] font-medium text-slate-500">
                {order.date}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
