import type { Metadata } from "next";
import { Search, SlidersHorizontal, ArrowUpDown, ChevronDown, ChevronRight } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const metadata: Metadata = { title: "Manage Account" };

const activationRequests = [
  { id: 1, name: "Oyindamola Joseph", role: "Sales Rep", date: "16 Feb", initials: "OJ", color: "bg-purple-600" },
  { id: 2, name: "Makinde Wale", role: "Inventory Mag.", date: "16 Feb", initials: "MW", color: "bg-rose-500" },
  { id: 3, name: "Chinyere Ifekwuku", role: "Accounting", date: "Fri, 16 Feb", initials: "CI", color: "bg-blue-500" },
  { id: 4, name: "Marvelous David", role: "Data", date: "Fri, 16 Feb", initials: "MD", color: "bg-emerald-600" },
  { id: 5, name: "Inioluwa Grace", role: "Sales Rep", date: "Fri, 16 Feb", initials: "IG", color: "bg-amber-600" },
];

const teamLeads = {
  Sales: [
    { id: 1, label: "Team Lead 1", name: "Victoria Ademuyiwa", initials: "VA", color: "bg-purple-600" },
    { id: 2, label: "Team Lead 2", name: "Chinedu Okafor", initials: "CO", color: "bg-rose-500" },
    { id: 3, label: "Team Lead 3", name: "Tunde Adeyemi", initials: "TA", color: "bg-blue-500" },
    { id: 4, label: "Team Lead 4", name: "Zainab Musa", initials: "ZM", color: "bg-slate-700" },
  ],
  "Inventory/Logistics": [
    { id: 1, label: "Team Lead 1", name: "Emeka Nwankwo", initials: "EN", color: "bg-slate-700" },
    { id: 2, label: "Team Lead 2", name: "Tolulope Adebayo", initials: "TA", color: "bg-purple-600" },
    { id: 3, label: "Team Lead 3", name: "Ibrahim Garba", initials: "IG", color: "bg-rose-500" },
  ],
  Accounting: [
    { id: 1, label: "Team Lead 1", name: "Ngozi Eze", initials: "NE", color: "bg-blue-500" },
  ],
  Data: [
    { id: 1, label: "Team Lead 1", name: "Samuel Olatunji", initials: "SO", color: "bg-amber-600" },
  ],
};

function Avatar({ initials, color, size = "w-[52px] h-[52px]" }: { initials: string; color: string; size?: string }) {
  return (
    <div className={`${size} rounded-full ${color} flex items-center justify-center text-white text-[0.8rem] font-black shrink-0 shadow-sm`}>
      {initials}
    </div>
  );
}

function TeamLeadCard({ label, name, initials, color }: { label: string; name: string; initials: string; color: string }) {
  return (
    <div className="flex items-center gap-3.5">
      <Avatar initials={initials} color={color} size="w-11 h-11" />
      <div className="leading-tight">
        <p className="text-[0.7rem] text-slate-400 font-bold uppercase tracking-wider">{label}</p>
        <p className="text-[0.9rem] font-bold text-slate-900 mt-0.5">{name}</p>
      </div>
    </div>
  );
}

export default function ManageAccountPage() {
  return (
    <div className="max-w-[1200px] mx-auto font-inter text-slate-900 pb-20">
      {/* ── Toolbar ── */}
      <div className="flex flex-wrap items-center gap-3 mb-8">
        <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg bg-white text-[0.85rem] font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm">
          <SlidersHorizontal size={15} />
          Filter
        </button>

        <Select defaultValue="dept">
          <SelectTrigger className="w-[110px] h-[38px] border-slate-200 rounded-lg bg-white text-[0.85rem] font-bold text-slate-700 shadow-sm">
            <SelectValue placeholder="Dept." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="sales">Sales</SelectItem>
            <SelectItem value="inventory">Inventory</SelectItem>
            <SelectItem value="data">Data</SelectItem>
          </SelectContent>
        </Select>

        <Select defaultValue="team-2">
          <SelectTrigger className="w-[110px] h-[38px] border-slate-200 rounded-lg bg-white text-[0.85rem] font-bold text-slate-700 shadow-sm">
            <SelectValue placeholder="Team" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="team-1">Team 1</SelectItem>
            <SelectItem value="team-2">Team 2</SelectItem>
          </SelectContent>
        </Select>

        <button className="flex items-center gap-1 px-2.5 py-2 border border-slate-200 rounded-lg bg-white text-slate-400 hover:bg-slate-50 transition-all shadow-sm">
          <ArrowUpDown size={15} />
        </button>

        <button className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 rounded-lg text-[0.82rem] font-black uppercase tracking-wider transition-all shadow-md shadow-purple-200">
          See all Staffs
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

      {/* ── Account Activation Requests ── */}
      <section className="bg-white rounded-[24px] p-8 shadow-[0_4px_24px_rgba(0,0,0,0.03)] border border-slate-50 mb-8">
        <h2 className="text-[1.1rem] font-black text-slate-900 mb-6 flex items-center gap-2">
          Account Activation Requests
          <span className="w-2 h-2 rounded-full bg-purple-600 animate-pulse"></span>
        </h2>

        <div className="flex gap-6 overflow-x-auto pb-4 custom-scrollbar">
          {activationRequests.map((req) => (
            <div key={req.id} className="flex flex-col rounded-2xl overflow-hidden border border-slate-100 min-w-[170px] max-w-[190px] shadow-sm bg-slate-50/30 group hover:shadow-md transition-all duration-300">
              <div className={`h-[130px] ${req.color} flex items-center justify-center relative overflow-hidden`}>
                <span className="text-[2.5rem] font-black text-white/90 relative z-10 transition-transform group-hover:scale-110 duration-500">
                  {req.initials}
                </span>
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </div>

              <div className="p-4 bg-white flex-1">
                <p className="font-bold text-[0.9rem] text-slate-900 truncate">{req.name}</p>
                <div className="flex justify-between items-center mt-1.5">
                  <p className="text-[0.75rem] text-slate-400 font-bold uppercase tracking-tight">{req.role}</p>
                  <p className="text-[0.7rem] text-slate-300 font-medium">{req.date}</p>
                </div>

                <div className="flex flex-col gap-2 mt-5">
                  <button className="w-full py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-[0.8rem] font-black transition-colors shadow-sm">
                    Confirm
                  </button>
                  <button className="w-full py-2 rounded-lg bg-transparent hover:bg-purple-50 text-purple-600 text-[0.8rem] font-black transition-colors">
                    Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
          
          <button className="flex flex-col items-center justify-center gap-2 px-6 rounded-2xl border-2 border-dashed border-slate-100 bg-slate-50/30 hover:bg-purple-50 hover:border-purple-100 text-purple-600 font-black text-[0.85rem] transition-all min-w-[100px]">
            See all <ChevronRight size={18} />
          </button>
        </div>
      </section>

      {/* ── Team Leads ── */}
      <section className="bg-white rounded-[24px] p-8 shadow-[0_4px_24px_rgba(0,0,0,0.03)] border border-slate-50 mb-10">
        <h2 className="text-[1.1rem] font-black text-slate-900 mb-8">Team Leads</h2>

        <div className="space-y-10">
          <div>
            <p className="text-[0.8rem] font-black text-slate-400 uppercase tracking-widest mb-4">Sales</p>
            <div className="bg-slate-50/50 rounded-2xl p-6 flex flex-wrap gap-12 border border-slate-50">
              {teamLeads.Sales.map((lead) => (
                <TeamLeadCard key={lead.id} {...lead} />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <p className="text-[0.8rem] font-black text-slate-400 uppercase tracking-widest mb-4">Inventory / Logistics</p>
              <div className="bg-slate-50/50 rounded-2xl p-6 flex flex-wrap gap-12 border border-slate-50 h-[calc(100%-36px)]">
                {teamLeads["Inventory/Logistics"].map((lead) => (
                  <TeamLeadCard key={lead.id} {...lead} />
                ))}
              </div>
            </div>

            <div>
              <p className="text-[0.8rem] font-black text-slate-400 uppercase tracking-widest mb-4">Accounting</p>
              <div className="bg-slate-50/50 rounded-2xl p-6 flex flex-col gap-6 border border-slate-50 h-[calc(100%-36px)]">
                {teamLeads.Accounting.map((lead) => (
                  <TeamLeadCard key={lead.id} {...lead} />
                ))}
              </div>
            </div>
          </div>

          <div>
            <p className="text-[0.8rem] font-black text-slate-400 uppercase tracking-widest mb-4">Data</p>
            <div className="bg-slate-50/50 rounded-2xl p-6 flex flex-wrap gap-12 border border-slate-50">
              {teamLeads.Data.map((lead) => (
                <TeamLeadCard key={lead.id} {...lead} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── View Log in History CTA ── */}
      <button className="px-10 py-4 rounded-xl bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 text-white text-[1rem] font-black shadow-xl shadow-purple-200 transition-all active:scale-95">
        View Log in History
      </button>
    </div>
  );
}
