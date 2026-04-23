import type { Metadata } from "next";
import { ChevronDown, ArrowLeft, MessageSquare } from "lucide-react";
import Link from "next/link";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return { title: `Delivery Agent Profile - ${id}` };
}

const deliveryAgents = [
  { id: 1, name: "Mr Ola Adewale", state: "Lagos", phone: "0803 547 2198", email: "ola@gmail.com", performance: 83 },
  { id: 8, name: "Flymack | Kaduna", state: "Kaduna", phone: "091524472657", email: "tolanibimpe200@gamail.com", performance: 80, region: "Lagos Island", statesHandled: ["Ogun State", "Abia State"] },
];

export default async function DeliveryAgentFullProfilePage({ params }: Props) {
  const { id } = await params;
  const agentId = parseInt(id);
  const agent = deliveryAgents.find(a => a.id === agentId) || deliveryAgents[1];

  return (
    <div className="max-w-[1200px] mx-auto font-inter text-slate-900 pb-20">
      {/* ── Back Button ── */}
      <Link 
        href={`/admin/staff/delivery-agent/${id}`}
        className="inline-flex items-center gap-2 text-slate-400 hover:text-purple-600 mb-6 transition-colors group"
      >
        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
        <span className="text-sm font-bold">Back to Overview</span>
      </Link>

      {/* ── Header ── */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">{agent.name}’s Profile</h1>
        <div className="flex items-center gap-6">
           <span className="text-[0.95rem] text-slate-400 font-medium">Delivery Agent</span>
           <button className="w-12 h-12 rounded-full bg-purple-600 flex items-center justify-center text-white shadow-lg shadow-purple-200 hover:scale-110 transition-transform">
              <MessageSquare size={20} fill="currentColor" />
           </button>
        </div>
      </div>

      {/* ── Main Profile Card ── */}
      <div className="bg-white rounded-[32px] p-10 shadow-[0_1px_4px_rgba(0,0,0,0.02)] border border-slate-50 mb-8 relative">
         <div className="flex justify-between items-start">
            <div className="flex gap-8 items-center">
               {/* Avatar Container */}
               <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-slate-50 flex items-center justify-center overflow-hidden border-4 border-slate-50 shadow-inner">
                    {/* Mockup delivery logo */}
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-300 rounded-xl flex flex-col gap-1.5 items-center justify-center shadow-sm">
                       <div className="w-10 h-2.5 bg-white/60 rounded-full"></div>
                       <div className="w-10 h-2.5 bg-white/60 rounded-full"></div>
                       <div className="w-10 h-2.5 bg-white/60 rounded-full"></div>
                    </div>
                  </div>
                  <button className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-white border border-slate-100 shadow-sm flex items-center justify-center text-slate-400 hover:text-purple-600 transition-colors font-bold text-xl">
                    +
                  </button>
               </div>

               {/* Name & Badge */}
               <div>
                  <h2 className="text-3xl font-black text-slate-800">{agent.name}</h2>
                  <div className="flex items-center gap-4 mt-1">
                     <p className="text-[1.05rem] text-slate-400">Delivery Agent</p>
                     <div className="flex items-center gap-1.5 border border-emerald-500 rounded-lg px-2.5 py-0.5 text-emerald-500 text-[0.7rem] font-black uppercase">
                        Online <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                     </div>
                  </div>
               </div>
            </div>
         </div>

         {/* Separator Line */}
         <div className="h-[1px] bg-slate-100 my-10" />

         {/* Details Grid */}
         <div className="grid grid-cols-4 gap-y-12">
            <div>
               <p className="text-[0.7rem] text-slate-400 font-bold uppercase tracking-wider mb-2">Phone Number</p>
               <p className="text-[1.2rem] font-black text-purple-900 tracking-tight">{agent.phone}</p>
            </div>
            <div className="border-l border-slate-100 pl-8">
               <p className="text-[0.7rem] text-slate-400 font-bold uppercase tracking-wider mb-2">Whatsapp</p>
               <p className="text-[1.2rem] font-black text-purple-900 tracking-tight">{agent.phone}</p>
            </div>
            <div className="border-l border-slate-100 pl-8">
               <p className="text-[0.7rem] text-slate-400 font-bold uppercase tracking-wider mb-2">Email</p>
               <p className="text-[1rem] font-black text-purple-900 break-all pr-4">{agent.email}</p>
            </div>
            <div className="border-l border-slate-100 pl-8">
               <p className="text-[0.7rem] text-slate-400 font-bold uppercase tracking-wider mb-2">States Handled</p>
               <div className="flex gap-2">
                 {(agent.statesHandled || ["Lagos"]).map(s => (
                   <span key={s} className="bg-slate-50 text-slate-400 px-3 py-1 rounded-full text-[0.7rem] font-bold border border-slate-100 whitespace-nowrap">
                      {s}
                   </span>
                 ))}
               </div>
            </div>

            <div className="mt-4">
               <p className="text-[0.7rem] text-slate-400 font-bold uppercase tracking-wider mb-2">Region</p>
               <p className="text-[1.2rem] font-black text-slate-700">{agent.region || "Lagos Island"}</p>
            </div>
            
            {/* Performance Card - Centered in grid row */}
            <div className="col-span-2 flex justify-center mt-[-20px]">
               <div className="bg-white rounded-[28px] p-6 border border-slate-100 shadow-sm w-[350px]">
                  <div className="flex justify-between items-center mb-6">
                    <span className="text-[0.8rem] font-black text-slate-800">Performance</span>
                    <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1 rounded-lg text-[0.65rem] font-bold text-slate-500 border border-slate-100">
                      This Month <ChevronDown size={12} />
                    </div>
                  </div>
                  <div className="flex justify-between items-end">
                    <span className="text-[2.5rem] font-black leading-none">{agent.performance}%</span>
                    <div className="text-right">
                       <span className="text-[0.85rem] font-bold text-emerald-500">+12%</span>
                       <p className="text-[0.6rem] text-slate-400 font-medium">vs last month</p>
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
