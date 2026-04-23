import type { Metadata } from "next";
import { ChevronDown, ArrowLeft } from "lucide-react";
import Link from "next/link";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return { title: `Analytics - ${id}` };
}

const salesReps = [
  { id: 1, name: "Blessing Ehijie" },
  { id: 2, name: "Chiamaka Okorie" },
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
    <div className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-50">
      <div className="flex justify-between items-center mb-10">
        <span className="text-[0.85rem] font-bold text-slate-700">{title}</span>
        <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg text-[0.7rem] font-semibold text-slate-500 border border-slate-100 cursor-pointer">
          This Month <ChevronDown size={12} />
        </div>
      </div>
      <div className="flex justify-between items-end">
        <span className={`${isProduct ? "text-[1.8rem]" : "text-[2.8rem]"} font-black leading-none`}>
          {value}
        </span>
        {trend && (
          <div className="text-right">
            <span className={`text-[0.85rem] font-bold ${trend.startsWith('+') ? "text-emerald-500" : "text-slate-900"}`}>
              {trend}
            </span>
            <p className="text-[0.65rem] text-slate-400 font-medium whitespace-nowrap">vs last month</p>
          </div>
        )}
        {isProduct && (
           <div className="text-right leading-tight">
             <p className="text-emerald-500 text-[0.75rem] font-bold">Neuro-Vive Balm</p>
             <p className="text-slate-300 text-[0.7rem] font-medium">last month</p>
           </div>
        )}
      </div>
    </div>
  );
}

export default async function StaffAnalyticsPage({ params }: Props) {
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
        <span className="text-sm font-bold">Back to Profile</span>
      </Link>

      {/* ── Header ── */}
      <div className="flex justify-between items-baseline mb-8">
        <h1 className="text-2xl font-bold">{staff.name}’s Analytics</h1>
        <span className="text-[0.95rem] text-slate-400">Sales Representatives</span>
      </div>

      {/* ── Stats Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <StatCard title="Total Products Sold" value="180" trend="+21%" />
        <StatCard title="Total Order/Customer" value="64" trend="+12%" />
        <StatCard title="Best Selling Product" value="Prosxact" isProduct />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <StatCard title="General Performance" value="80%" trend="+12%" />
        <StatCard title="Upselling Rate" value="30%" trend="+12%" />
        <StatCard title="Comfirmation Rate" value="60%" trend="+12%" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard title="Delivery Rate" value="78%" trend="+12%" />
        <StatCard title="Cancellation Rate" value="8%" trend="+12%" />
        <StatCard title="Recovery Rate" value="27%" trend="+12%" />
      </div>

      {/* ── KPI Card ── */}
      <div className="max-w-[400px]">
        <div className="bg-gradient-to-br from-[#5b00a3] to-[#8B2FE8] rounded-[24px] p-8 text-white shadow-xl shadow-purple-100">
           <div className="flex justify-between items-start mb-4">
              <div>
                 <p className="text-[0.85rem] font-black uppercase tracking-widest opacity-80">KPI</p>
                 <h2 className="text-[3.5rem] font-black leading-none mt-2">21%</h2>
              </div>
              <div className="text-right">
                 <p className="text-[0.75rem] font-bold opacity-60">Target for the month:</p>
                 <p className="text-[1.1rem] font-black tracking-widest">XXXXXXX</p>
                 <p className="text-[0.85rem] font-bold mt-2 text-emerald-400">+12% <span className="text-white opacity-60 font-medium">vs last month</span></p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
