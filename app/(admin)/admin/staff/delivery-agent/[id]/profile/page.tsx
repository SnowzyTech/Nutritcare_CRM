import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ChevronDown, ArrowLeft, MessageSquare, History } from "lucide-react";
import Link from "next/link";
import { getDeliveryAgentById, getDeliveryAgentOrderSummary } from "@/modules/delivery/services/agents.service";
import { formatDate } from "@/lib/utils";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const agent = await getDeliveryAgentById(id);
  return { title: agent ? `${agent.companyName} — Full Profile` : "Delivery Agent Profile" };
}

export default async function DeliveryAgentFullProfilePage({ params }: Props) {
  const { id } = await params;
  const [agent, summary] = await Promise.all([
    getDeliveryAgentById(id),
    getDeliveryAgentOrderSummary(id),
  ]);

  if (!agent) notFound();

  const dispatched = summary.delivered + summary.failed;
  const deliveryRate = dispatched > 0 ? Math.round((summary.delivered / dispatched) * 100) : 0;

  // statesCovered is a JSON field — could be string[] or null
  const statesCovered: string[] = Array.isArray(agent.statesCovered)
    ? (agent.statesCovered as string[])
    : agent.state
    ? [agent.state]
    : [];

  return (
    <div className="max-w-[1200px] mx-auto font-inter text-slate-900 pb-20">
      <Link
        href={`/admin/staff/delivery-agent/${id}`}
        className="inline-flex items-center gap-2 text-slate-400 hover:text-purple-600 mb-6 transition-colors group no-underline"
      >
        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
        <span className="text-sm font-bold">Back to Overview</span>
      </Link>

      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">{agent.companyName}&apos;s Profile</h1>
        <div className="flex items-center gap-6">
          <span className="text-[0.95rem] text-slate-400 font-medium">Delivery Agent</span>
          <button className="w-12 h-12 rounded-full bg-purple-600 flex items-center justify-center text-white shadow-lg shadow-purple-200 hover:scale-110 transition-transform">
            <MessageSquare size={20} fill="currentColor" />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[32px] p-10 shadow-[0_1px_4px_rgba(0,0,0,0.02)] border border-slate-50 mb-8 relative">
        <div className="flex justify-between items-start">
          <div className="flex gap-8 items-center">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-slate-50 flex items-center justify-center overflow-hidden border-4 border-slate-50 shadow-inner">
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

            <div>
              <h2 className="text-3xl font-black text-slate-800">{agent.companyName}</h2>
              <div className="flex items-center gap-4 mt-1">
                <p className="text-[1.05rem] text-slate-400">Delivery Agent</p>
                <div className={`flex items-center gap-1.5 border rounded-lg px-2.5 py-0.5 text-[0.7rem] font-black uppercase ${
                  agent.status === "ACTIVE" ? "border-emerald-500 text-emerald-500" : "border-red-400 text-red-400"
                }`}>
                  {agent.status === "ACTIVE" ? "Active" : "Inactive"}
                  <span className={`w-1.5 h-1.5 rounded-full ${agent.status === "ACTIVE" ? "bg-emerald-500" : "bg-red-400"}`}></span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="h-[1px] bg-slate-100 my-10" />

        <div className="grid grid-cols-4 gap-y-12">
          <div>
            <p className="text-[0.7rem] text-slate-400 font-bold uppercase tracking-wider mb-2">Phone Number</p>
            <p className="text-[1.2rem] font-black text-purple-900 tracking-tight">{agent.phone1}</p>
          </div>
          <div className="border-l border-slate-100 pl-8">
            <p className="text-[0.7rem] text-slate-400 font-bold uppercase tracking-wider mb-2">Phone 2</p>
            <p className="text-[1.2rem] font-black text-purple-900 tracking-tight">{agent.phone2 ?? "—"}</p>
          </div>
          <div className="border-l border-slate-100 pl-8">
            <p className="text-[0.7rem] text-slate-400 font-bold uppercase tracking-wider mb-2">State</p>
            <p className="text-[1rem] font-black text-purple-900 break-all pr-4">{agent.state ?? "—"}</p>
          </div>
          <div className="border-l border-slate-100 pl-8">
            <p className="text-[0.7rem] text-slate-400 font-bold uppercase tracking-wider mb-2">States Covered</p>
            {statesCovered.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {statesCovered.map(s => (
                  <span key={s} className="bg-slate-50 text-slate-400 px-3 py-1 rounded-full text-[0.7rem] font-bold border border-slate-100 whitespace-nowrap">
                    {s}
                  </span>
                ))}
              </div>
            ) : (
              <span className="bg-slate-50 text-slate-400 px-4 py-1 rounded-full text-[0.75rem] font-bold border border-slate-100">
                {agent.state ?? "—"}
              </span>
            )}
          </div>

          <div className="mt-4">
            <p className="text-[0.7rem] text-slate-400 font-bold uppercase tracking-wider mb-2">Region</p>
            <p className="text-[1.2rem] font-black text-slate-700">{agent.state ?? "—"}</p>
          </div>

          {/* Performance card spanning 2 columns */}
          <div className="col-span-2 flex justify-center mt-[-20px]">
            <div className="bg-white rounded-[28px] p-6 border border-slate-100 shadow-sm w-[350px]">
              <div className="flex justify-between items-center mb-6">
                <span className="text-[0.8rem] font-black text-slate-800">Delivery Performance</span>
                <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1 rounded-lg text-[0.65rem] font-bold text-slate-500 border border-slate-100">
                  All Time <ChevronDown size={12} />
                </div>
              </div>
              <div className="flex justify-between items-end">
                <span className="text-[2.5rem] font-black leading-none">{deliveryRate}%</span>
                <div className="text-right">
                  <span className="text-[0.85rem] font-bold text-slate-500">{summary.delivered}D / {summary.failed}F</span>
                  <p className="text-[0.6rem] text-slate-400 font-medium">delivered / failed</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 border-l border-slate-100 pl-8">
            <p className="text-[0.7rem] text-slate-400 font-bold uppercase tracking-wider mb-2">Total Orders</p>
            <p className="text-[1.2rem] font-black text-slate-600">{summary.total}</p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mt-12 pt-8 border-t border-slate-50">
        <div>
          <p className="text-[0.75rem] text-slate-400 font-bold mb-1">Agent Added on</p>
          <p className="text-[1.1rem] font-black text-slate-600">{formatDate(agent.createdAt)}</p>
        </div>
        <button className="bg-purple-50 hover:bg-purple-100 text-purple-600 px-10 py-3 rounded-xl text-[0.85rem] font-black flex items-center gap-3 transition-all">
          <History size={16} /> Check Activity History
        </button>
      </div>
    </div>
  );
}
