import type { Metadata } from "next";
import { ChevronDown, ArrowLeft, MessageSquare } from "lucide-react";
import Link from "next/link";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return { title: `Analytics - ${id}` };
}

const deliveryAgents = [
  { id: 1, name: "Mr Ola Adewale", state: "Lagos", phone: "0803 547 2198", email: "ola@gmail.com", performance: 83 },
  { id: 8, name: "Flymack | Kaduna", state: "Kaduna", phone: "091524472657", email: "FlymackLogistics@gmail.com", performance: 80, deliveryRate: 78 },
];

function StatCard({ 
  title, 
  value, 
  trend, 
  isProduct = false 
}: { 
  title: string; 
  value: string | number; 
  trend?: string; 
  isProduct?: boolean 
}) {
  return (
    <div className="bg-white rounded-[24px] p-8 shadow-sm border border-slate-50">
      <div className="flex justify-between items-center mb-10">
        <span className="text-[1rem] font-bold text-slate-700">{title}</span>
        <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg text-[0.75rem] font-bold text-slate-500 border border-slate-100 cursor-pointer">
          This Month <ChevronDown size={14} />
        </div>
      </div>
      <div className="flex justify-between items-end">
        <span className={`${isProduct ? "text-[2rem]" : "text-[3.5rem]"} font-black leading-none`}>
          {value}
        </span>
        {trend && (
          <div className="text-right">
            <span className={`text-[1rem] font-bold ${trend.startsWith('+') ? "text-emerald-500" : "text-slate-900"}`}>
              {trend}
            </span>
            <p className="text-[0.75rem] text-slate-400 font-medium whitespace-nowrap">vs last month</p>
          </div>
        )}
        {isProduct && (
           <div className="text-right leading-tight">
             <p className="text-emerald-500 text-[0.85rem] font-bold">Neuro-Vive Balm</p>
             <p className="text-slate-300 text-[0.8rem] font-medium">last month</p>
           </div>
        )}
      </div>
    </div>
  );
}

export default async function DeliveryAgentAnalyticsPage({ params }: Props) {
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
        <span className="text-sm font-bold">Back to Profile</span>
      </Link>

      {/* ── Header ── */}
      <div className="flex justify-between items-center mb-12">
        <h1 className="text-2xl font-bold">{agent.name}’s Analytics</h1>
        <div className="flex items-center gap-6">
           <span className="text-[0.95rem] text-slate-400 font-medium">Delivery Agent</span>
           <button className="w-12 h-12 rounded-full bg-purple-600 flex items-center justify-center text-white shadow-lg shadow-purple-200 hover:scale-110 transition-transform">
              <MessageSquare size={20} fill="currentColor" />
           </button>
        </div>
      </div>

      {/* ── Stats Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <StatCard title="Total Products Sold" value="180" trend="+21%" />
        <StatCard title="Best Selling Product" value="Prosxact" isProduct />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <StatCard title="Geeral Performance" value={`${agent.performance}%`} trend="+12%" />
        <StatCard title="Delivery Rate" value={`${agent.deliveryRate || 78}%`} trend="+12%" />
      </div>
    </div>
  );
}
