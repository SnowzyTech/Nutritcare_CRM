"use client";

import { useState } from "react";
import { Search, SlidersHorizontal, ArrowUpDown, ChevronDown, RefreshCw, X, CheckCircle2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// export const metadata: Metadata = { title: "Order Assignment" }; // Removed because client component cannot export metadata

const nigerianStates = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue",
  "Borno", "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT",
  "Gombe", "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi",
  "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo",
  "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara",
];

const orders = [
  { id: 1, email: "adewale.johnson.ng@gmai", name: "Adewale Johnson", agent: "", agentState: "", salesRep: "Blessing Efiong", product: "Prosxact", quantity: 3, date: "03-02-26", status: "pending" },
  { id: 2, email: "funke.adebayo.ng@gmail.c", name: "Funke Adebayo", agent: "", agentState: "", salesRep: "Funmilayo Ogunleye", product: "Shred Belly", quantity: 2, date: "03-02-26", status: "pending" },
  { id: 3, email: "ibrahim.musa.ng@gmail.co", name: "Ibrahim Musa", agent: "Mr. Ola", agentState: "Lagos State", salesRep: "Adebimpe Tolani", product: "Fonio-Mill", quantity: 5, date: "03-02-26", status: "failed" },
  { id: 4, email: "chinedu.okafor.ng@gmail.c", name: "Chinedu Okafor", agent: "Mr. Qudus", agentState: "Lagos State", salesRep: "Mr. Qudus", product: "Trim and Tone", quantity: 4, date: "03-02-26", status: "confirmed" },
  { id: 5, email: "blessing.eze.ng@gmail.com", name: "Blessing Eze", agent: "Mr. Oyelowo", agentState: "Ogun State", salesRep: "Mr. Oyelowo", product: "Neuro-Vive Balm", quantity: 1, date: "03-02-26", status: "cancelled" },
  { id: 6, email: "sola.ogunleye.ng@gmail.cc", name: "Sola Ogunleye", agent: "", agentState: "", salesRep: "Zainab Bello", product: "Prosxact", quantity: 3, date: "03-02-26", status: "pending" },
  { id: 7, email: "victor.uche.ng@gmail.com", name: "Victor Uche", agent: "", agentState: "", salesRep: "Emeka Nwankwo", product: "Fonio-Mill", quantity: 7, date: "03-02-26", status: "pending" },
  { id: 8, email: "victor.uche.ng@gmail.com", name: "Victor Uche", agent: "Mrs. Sumni", agentState: "Oyo State", salesRep: "Blessing Efiong", product: "Fonio-Mill", quantity: 7, date: "03-02-26", status: "failed" },
  { id: 9, email: "victor.uche.ng@gmail.com", name: "Victor Uche", agent: "Mrs. Sumni", agentState: "Oyo State", salesRep: "Mrs. Sumni", product: "Fonio-Mill", quantity: 7, date: "03-02-26", status: "confirmed" },
  { id: 10, email: "victor.uche.ng@gmail.com", name: "Victor Uche", agent: "Mrs. Sumni", agentState: "Oyo State", salesRep: "Blessing Efiong", product: "Fonio-Mill", quantity: 7, date: "03-02-26", status: "confirmed" },
  { id: 11, email: "victor.uche.ng@gmail.com", name: "Victor Uche", agent: "Mrs. Sumni", agentState: "Oyo State", salesRep: "Chiamaka Okorie", product: "Fonio-Mill", quantity: 7, date: "03-02-26", status: "confirmed" },
  { id: 12, email: "victor.uche.ng@gmail.com", name: "Victor Uche", agent: "Mrs. Sumni", agentState: "Oyo State", salesRep: "Chiamaka Okorie", product: "Fonio-Mill", quantity: 7, date: "03-02-26", status: "confirmed" },
  { id: 13, email: "victor.uche.ng@gmail.com", name: "Victor Uche", agent: "Mrs. Sumni", agentState: "Oyo State", salesRep: "Emeka Nwankwo", product: "Fonio-Mill", quantity: 7, date: "03-02-26", status: "confirmed" },
  { id: 14, email: "victor.uche.ng@gmail.com", name: "Victor Uche", agent: "Mrs. Sumni", agentState: "Oyo State", salesRep: "Emeka Nwankwo", product: "Fonio-Mill", quantity: 7, date: "03-02-26", status: "confirmed" },
];

const statusColors: Record<string, string> = {
  pending: "bg-amber-400",
  failed: "bg-red-500",
  confirmed: "bg-emerald-300",
  delivered: "bg-emerald-500",
  cancelled: "bg-orange-300",
};

const staffMembers = [
  { id: 1, name: "Emeka Nwankwo", orders: 20 },
  { id: 2, name: "Zainab Bello", orders: 25 },
  { id: 3, name: "Tunde Ajayi", orders: 29 },
  { id: 4, name: "Blessing Efiong", orders: 31 },
];

export default function OrderAssignmentPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

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
            id="assign-date-picker"
            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
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
          <span className="bg-emerald-50 text-emerald-600 text-[0.65rem] font-black px-3 py-1 rounded-md uppercase">Confirmed</span>
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
      <div className="bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.02)] overflow-hidden border border-slate-50">
        {/* Header row */}
        <div className="grid grid-cols-[2.2fr_1.2fr_1.2fr_1.2fr_1.2fr_0.8fr_1fr_0.4fr] px-8 py-5 border-b border-slate-100 bg-slate-50/30">
          {["G-Mail", "Name", "Agent", "Sales Rep", "Product", "Quantity", "Date", ""].map((h, i) => (
            <span key={i} className="text-[0.75rem] font-black text-slate-500 uppercase tracking-tight">
              {h}
            </span>
          ))}
        </div>

        {/* Rows */}
        <div className="divide-y divide-slate-50">
          {orders.map((order) => (
            <div
              key={order.id}
              className="grid grid-cols-[2.2fr_1.2fr_1.2fr_1.2fr_1.2fr_0.8fr_1fr_0.4fr] px-8 py-4 items-center hover:bg-slate-50/50 transition-colors group cursor-default"
            >
              {/* G-Mail + Status Dot */}
              <div className="flex items-center gap-4">
                <div className={`w-2.5 h-2.5 rounded-full ${statusColors[order.status]} shadow-sm`}></div>
                <span className="text-[0.85rem] font-medium text-slate-500 truncate max-w-[180px]">
                  {order.email}
                </span>
              </div>

              {/* Name */}
              <span className="text-[0.85rem] font-bold text-slate-700">
                {order.name}
              </span>

              {/* Agent */}
              <div className="leading-tight">
                <p className="text-[0.85rem] font-bold text-slate-700">{order.agent || "-"}</p>
                <p className="text-[0.65rem] text-slate-400 font-bold uppercase">{order.agentState}</p>
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

              {/* Selection Circle */}
              <div className="flex justify-end">
                <div className="w-5 h-5 rounded-full border-2 border-slate-200 group-hover:border-purple-300 transition-colors cursor-pointer"></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Action Button ── */}
      <div className="mt-8 flex justify-end">
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-8 py-3.5 rounded-xl text-[0.9rem] font-black shadow-lg shadow-purple-200 transition-all active:scale-95 group"
        >
          <RefreshCw size={18} className="group-hover:rotate-180 transition-transform duration-500" />
          Re-Assign Order
        </button>
      </div>

      {/* ── Reassign Modal ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Overlay */}
          <div 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" 
            onClick={() => setIsModalOpen(false)}
          />
          
          {/* Modal Content */}
          <div className="relative bg-white rounded-[40px] shadow-2xl w-full max-w-[1200px] max-h-[90vh] overflow-y-auto p-12 animate-in fade-in zoom-in duration-300">
            {/* Header */}
            <div className="flex items-center justify-between mb-10">
               <h2 className="text-2xl font-black text-slate-600">12 orders selected</h2>
               
               <div className="flex-1 max-w-2xl px-10">
                  <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5">
                    <Search size={18} className="text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="search" 
                      className="bg-transparent border-none outline-none w-full text-[1rem] placeholder:text-slate-300 font-medium"
                    />
                  </div>
               </div>

               <button 
                onClick={() => setIsModalOpen(false)}
                className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors"
               >
                  <X size={20} />
               </button>
            </div>

            {/* Top Selection Grid */}
            <div className="grid grid-cols-4 gap-4 mb-12">
               {[1, 2, 3, 4].map((col) => (
                 <div key={col} className="bg-slate-50/50 rounded-3xl p-6 border border-slate-50 space-y-5">
                    {staffMembers.map((staff) => (
                      <div key={staff.id} className="flex items-center justify-between group cursor-pointer">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden shrink-0">
                              <img src={`https://i.pravatar.cc/100?u=${staff.id}`} alt="" className="w-full h-full object-cover" />
                           </div>
                           <div className="leading-tight">
                              <p className="text-[0.85rem] font-bold text-slate-700">{staff.name}</p>
                              <p className="text-[0.7rem] text-slate-400 font-medium">{staff.orders} Orders Today</p>
                           </div>
                        </div>
                        <div className="w-5 h-5 rounded-full border-2 border-slate-200 group-hover:border-purple-300 transition-colors"></div>
                      </div>
                    ))}
                 </div>
               ))}
            </div>

            {/* Assign To Label */}
            <div className="flex justify-between items-center mb-8 border-t border-slate-50 pt-8">
               <h3 className="text-xl font-black text-slate-400">Assign to</h3>
               <span className="text-xl font-black text-slate-400">12 Sales Rep Selected</span>
            </div>

            {/* Bottom Selected Grid */}
            <div className="grid grid-cols-4 gap-4 mb-10">
               {[...Array(9)].map((_, i) => (
                 <div key={i} className="flex items-center justify-between bg-slate-50/80 rounded-2xl p-4 border border-slate-50 shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-center gap-3">
                       <div className="w-9 h-9 rounded-full bg-slate-200 overflow-hidden shrink-0 border-2 border-white shadow-sm">
                          <img src={`https://i.pravatar.cc/100?u=${i + 10}`} alt="" className="w-full h-full object-cover" />
                       </div>
                       <div className="leading-tight">
                          <p className="text-[0.85rem] font-bold text-slate-700">Emeka Nwankwo</p>
                          <p className="text-[0.7rem] text-slate-400 font-medium">20 Orders Today</p>
                       </div>
                    </div>
                    <button className="w-7 h-7 rounded-full bg-white flex items-center justify-center text-slate-400 hover:text-red-500 shadow-sm border border-slate-100 transition-colors">
                       <X size={14} />
                    </button>
                 </div>
               ))}
            </div>

            {/* Footer Button */}
            <div className="flex justify-end pt-4">
               <button className="bg-purple-600 hover:bg-purple-700 text-white px-12 py-4 rounded-xl text-[1rem] font-black shadow-xl shadow-purple-100 transition-all active:scale-95">
                  Assign Orders Equally
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
