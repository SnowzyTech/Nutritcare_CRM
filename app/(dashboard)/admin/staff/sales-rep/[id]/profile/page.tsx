import type { Metadata } from "next";
import { ChevronDown, ArrowLeft, Settings, History } from "lucide-react";
import Link from "next/link";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return { title: `Full Profile - ${id}` };
}

const salesReps = [
  { id: 1, name: "Blessing Ehijie", role: "Sales Rep", team: "Team 2", phone: "091524472657", whatsapp: "091524472657", email: "tolanibimpe200@gamail.com", teamLead: "Ehijie Blessing", branch: "Orelope, Lagos", states: "All", performance: 80 },
  { id: 2, name: "Chiamaka Okorie", role: "Sales Rep", team: "Team 1", phone: "07063814402", whatsapp: "07063814402", email: "chiamaka@gmail.com", teamLead: "Blessing Efiong", branch: "Ikeja, Lagos", states: "All", performance: 87 },
];

export default async function FullProfilePage({ params }: Props) {
  const { id } = await params;
  const staffId = parseInt(id);
  const staff = salesReps.find(s => s.id === staffId) || salesReps[0];

  return (
    <div className="max-w-[1200px] mx-auto font-inter text-slate-900 pb-20">
      {/* ── Back Button ── */}
      <Link 
        href={`/admin/staff/sales-rep/${id}`}
        className="inline-flex items-center gap-2 text-slate-400 hover:text-purple-600 mb-6 transition-colors group"
      >
        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
        <span className="text-sm font-bold">Back to Overview</span>
      </Link>

      {/* ── Header ── */}
      <div className="flex justify-between items-baseline mb-8">
        <h1 className="text-2xl font-bold">{staff.name}’s Profile</h1>
        <span className="text-[0.95rem] text-slate-400 font-medium">Sales Representatives</span>
      </div>

      {/* ── Main Profile Card ── */}
      <div className="bg-white rounded-[32px] p-10 shadow-[0_1px_4px_rgba(0,0,0,0.02)] border border-slate-50 mb-8 relative">
         <div className="flex justify-between items-start">
            <div className="flex gap-8 items-center">
               {/* Avatar with Plus */}
               <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-slate-200 overflow-hidden border-4 border-slate-50 shadow-inner">
                    <img src="https://github.com/shadcn.png" alt="" className="w-full h-full object-cover" />
                  </div>
                  <button className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-white border border-slate-100 shadow-sm flex items-center justify-center text-slate-400 hover:text-purple-600 transition-colors font-bold text-xl">
                    +
                  </button>
               </div>

               {/* Name & Badge */}
               <div>
                  <h2 className="text-3xl font-black text-slate-800">Adebimpe Tolani</h2>
                  <div className="flex items-center gap-4 mt-1">
                     <p className="text-[1.05rem] text-slate-400">
                        {staff.role} <span className="font-bold text-slate-600">{staff.team}</span>
                     </p>
                     <div className="flex items-center gap-1.5 border border-emerald-500 rounded-lg px-2.5 py-0.5 text-emerald-500 text-[0.7rem] font-black uppercase">
                        Online <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                     </div>
                  </div>
               </div>
            </div>

            {/* Top Right KPI & Edit */}
            <div className="text-right">
               <p className="text-[0.8rem] text-slate-400 leading-tight">
                Your KPI for this month is<br/>
                <span className="font-bold text-slate-900 text-[1rem]">XXXXX</span>
               </p>
               <button className="mt-8 border border-purple-400 text-purple-600 px-6 py-2 rounded-xl text-[0.75rem] font-black flex items-center gap-2 transition-all hover:bg-purple-50">
                 <Settings size={14} /> Edit Profile
               </button>
            </div>
         </div>

         {/* Separator Line */}
         <div className="h-[1px] bg-slate-100 my-10" />

         {/* Details Grid */}
         <div className="grid grid-cols-4 gap-y-12">
            <div>
               <p className="text-[0.7rem] text-slate-400 font-bold uppercase tracking-wider mb-2">Phone Number</p>
               <p className="text-[1.2rem] font-black text-purple-900 tracking-tight">{staff.phone}</p>
            </div>
            <div className="border-l border-slate-100 pl-8">
               <p className="text-[0.7rem] text-slate-400 font-bold uppercase tracking-wider mb-2">Whatsapp</p>
               <p className="text-[1.2rem] font-black text-purple-900 tracking-tight">{staff.whatsapp}</p>
            </div>
            <div className="border-l border-slate-100 pl-8">
               <p className="text-[0.7rem] text-slate-400 font-bold uppercase tracking-wider mb-2">Email</p>
               <p className="text-[1rem] font-black text-purple-900 break-all pr-4">{staff.email}</p>
            </div>
            <div className="border-l border-slate-100 pl-8">
               <p className="text-[0.7rem] text-slate-400 font-bold uppercase tracking-wider mb-2">States Handled</p>
               <span className="bg-slate-50 text-slate-400 px-4 py-1 rounded-full text-[0.75rem] font-bold border border-slate-100">
                  {staff.states}
               </span>
            </div>

            <div className="mt-4">
               <p className="text-[0.7rem] text-slate-400 font-bold uppercase tracking-wider mb-2">Team</p>
               <p className="text-[1.2rem] font-black text-slate-700">Team 1</p>
            </div>
            <div className="border-l border-slate-100 pl-8 mt-4">
               <p className="text-[0.7rem] text-slate-400 font-bold uppercase tracking-wider mb-2">Team Lead</p>
               <p className="text-[1.2rem] font-black text-slate-600">{staff.teamLead}</p>
            </div>
            <div className="border-l border-slate-100 pl-8 mt-4">
               <p className="text-[0.7rem] text-slate-400 font-bold uppercase tracking-wider mb-2">Branch</p>
               <p className="text-[1.2rem] font-black text-slate-600">{staff.branch}</p>
            </div>
            
            {/* Performance Card in Grid */}
            <div className="border-l border-slate-100 pl-8 mt-[-20px]">
               <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-[0.75rem] font-black text-slate-800">General Performance</span>
                    <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-md text-[0.6rem] font-bold text-slate-500 border border-slate-100">
                      This Month <ChevronDown size={10} />
                    </div>
                  </div>
                  <div className="flex justify-between items-end">
                    <span className="text-[2.2rem] font-black leading-none">80%</span>
                    <div className="text-right">
                       <span className="text-[0.75rem] font-bold text-emerald-500">+12%</span>
                       <p className="text-[0.55rem] text-slate-400 font-medium">vs last month</p>
                    </div>
                  </div>
               </div>
            </div>
         </div>
      </div>

      {/* ── Footer Info ── */}
      <div className="flex items-center justify-between mt-12 pt-8 border-t border-slate-50">
         <div>
            <p className="text-[0.75rem] text-slate-400 font-bold mb-1">Account Created on</p>
            <p className="text-[1.1rem] font-black text-slate-600">May 27th, 2025</p>
         </div>
         
         <button className="bg-purple-50 hover:bg-purple-100 text-purple-600 px-10 py-3 rounded-xl text-[0.85rem] font-black flex items-center gap-3 transition-all">
            Check Login History <ArrowLeft className="rotate-180" size={18} />
         </button>
      </div>
    </div>
  );
}
