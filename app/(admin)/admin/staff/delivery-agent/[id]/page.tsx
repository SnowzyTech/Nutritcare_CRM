import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronDown, ChevronRight, UserCircle, LayoutDashboard } from "lucide-react";
import { getDeliveryAgentById, getDeliveryAgentOrderSummary, getDeliveryAgentAnalytics } from "@/modules/delivery/services/agents.service";
import DeliveryAgentDetailClient from "./delivery-agent-detail-client";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const agent = await getDeliveryAgentById(id);
  return { title: agent ? `${agent.companyName} — Delivery Agent` : "Delivery Agent" };
}

export default async function DeliveryAgentDetailPage({ params }: Props) {
  const { id } = await params;
  const [agent, summary, analytics] = await Promise.all([
    getDeliveryAgentById(id),
    getDeliveryAgentOrderSummary(id),
    getDeliveryAgentAnalytics(id),
  ]);

  if (!agent) notFound();

  const { current } = analytics;
  const stateName = agent.state ? agent.state.replace(" State", "") : "—";

  return (
    <div className="max-w-[1200px] mx-auto font-inter text-slate-900 pb-20">
      {/* Header */}
      <div className="flex justify-between items-baseline mb-8">
        <h1 className="text-2xl font-bold">{agent.companyName}&apos;s Profile</h1>
        <span className="text-[0.95rem] text-slate-400">Delivery Agent</span>
      </div>

      {/* Order Section */}
      <section className="mb-10">
        <h2 className="text-lg font-bold mb-4 text-slate-600">Order</h2>
        <div className="bg-white rounded-xl p-4 px-6 flex gap-12 items-center shadow-sm border border-slate-50">
          <div className="flex items-center gap-2">
            <span className="text-[0.9rem] font-bold">All</span>
            <span className="bg-purple-50 text-purple-600 text-[0.7rem] font-black px-2 py-0.5 rounded-[4px]">
              {summary.total}
            </span>
          </div>
          <div className="text-[0.9rem] font-semibold text-slate-400">Pending({summary.pending})</div>
          <div className="text-[0.9rem] font-semibold text-slate-400">Delivered({summary.delivered})</div>
          <div className="text-[0.9rem] font-semibold text-slate-400">Failed({summary.failed})</div>
        </div>
        <button className="mt-4 bg-purple-50 hover:bg-purple-100 text-purple-600 px-6 py-2.5 rounded-lg text-[0.85rem] font-bold transition-colors">
          See All Orders
        </button>
      </section>

      {/* Profile Section */}
      <section className="mb-10">
        <h2 className="text-lg font-bold mb-4 text-slate-600">Profile</h2>
        <div className="bg-white rounded-[24px] p-8 shadow-[0_4px_24px_rgba(0,0,0,0.03)] border border-slate-50 relative">
          <div className="flex gap-6 mb-10">
            {/* Agent logo avatar */}
            <div className="w-20 h-20 rounded-2xl bg-slate-100 flex items-center justify-center overflow-hidden shadow-inner shrink-0 border border-slate-100">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-300 rounded-lg flex flex-col gap-1 items-center justify-center">
                <div className="w-8 h-2 bg-white/60 rounded-full"></div>
                <div className="w-8 h-2 bg-white/60 rounded-full"></div>
                <div className="w-8 h-2 bg-white/60 rounded-full"></div>
              </div>
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h3 className="text-[1.5rem] font-bold">{agent.companyName}</h3>
                {agent.status === "INACTIVE" && (
                  <span className="bg-red-500 text-white text-[0.65rem] font-black px-2 py-0.5 rounded-[4px] uppercase tracking-wider">
                    Suspended
                  </span>
                )}
              </div>
              <p className="text-[1rem] text-slate-400 mt-1 mb-3">
                Delivery Agent <span className="font-bold text-slate-600">{stateName}</span>
              </p>
              <div className={`inline-flex items-center gap-2 border rounded-full px-3 py-0.5 text-[0.75rem] font-bold ${
                agent.status === "ACTIVE" ? "border-emerald-500 text-emerald-500" : "border-red-400 text-red-400"
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${agent.status === "ACTIVE" ? "bg-emerald-500" : "bg-red-400"}`}></span>
                {agent.status === "ACTIVE" ? "Active" : "Inactive"}
              </div>
            </div>
          </div>

          <div className="flex justify-between items-end gap-10">
            <div className="flex flex-wrap gap-x-12 gap-y-6">
              <div>
                <p className="text-[0.75rem] text-slate-400 font-semibold mb-1 uppercase tracking-tight">Phone Number</p>
                <p className="text-[1.1rem] font-black text-purple-900">{agent.phone1}</p>
              </div>
              {agent.phone2 && (
                <div className="border-l border-slate-100 pl-12">
                  <p className="text-[0.75rem] text-slate-400 font-semibold mb-1 uppercase tracking-tight">Phone 2</p>
                  <p className="text-[1.1rem] font-black text-purple-900">{agent.phone2}</p>
                </div>
              )}
              <div className="border-l border-slate-100 pl-12">
                <p className="text-[0.75rem] text-slate-400 font-semibold mb-1 uppercase tracking-tight">State</p>
                <p className="text-[1.1rem] font-black text-slate-600">{agent.state ?? "—"}</p>
              </div>
              <div className="border-l border-slate-100 pl-12">
                <p className="text-[0.75rem] text-slate-400 font-semibold mb-1 uppercase tracking-tight">Delivery Rate</p>
                <p className="text-[1.1rem] font-black text-emerald-600">{current.deliveryRate}%</p>
              </div>
            </div>

            <Link
              href={`/admin/staff/delivery-agent/${id}/profile`}
              className="border-2 border-purple-600 bg-transparent hover:bg-purple-50 text-purple-600 px-6 py-2.5 rounded-xl text-[0.85rem] font-bold flex items-center gap-3 transition-all shrink-0 shadow-sm no-underline"
            >
              <UserCircle size={18} /> See Full Profile <ChevronRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* Analytics Section */}
      <section className="mb-10">
        <h2 className="text-lg font-bold mb-4 text-slate-600">Analytics</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* General Performance */}
          <div className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-50">
            <div className="flex justify-between items-center mb-10">
              <span className="text-[0.85rem] font-bold text-slate-700">General Performance</span>
              <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg text-[0.7rem] font-semibold text-slate-500 border border-slate-100">
                This Month <ChevronDown size={12} />
              </div>
            </div>
            <div className="flex justify-between items-end">
              <span className="text-[2.8rem] font-black leading-none">{current.generalPerformance}%</span>
              <div className="text-right">
                <span className="text-[0.85rem] font-bold text-slate-500">{analytics.trends.generalPerformance}</span>
                <p className="text-[0.65rem] text-slate-400 font-medium whitespace-nowrap">vs last month</p>
              </div>
            </div>
          </div>

          {/* Delivery Rate */}
          <div className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-50">
            <div className="flex justify-between items-center mb-10">
              <span className="text-[0.85rem] font-bold text-slate-700">Delivery Rate</span>
              <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg text-[0.7rem] font-semibold text-slate-500 border border-slate-100">
                This Month <ChevronDown size={12} />
              </div>
            </div>
            <div className="flex justify-between items-end">
              <span className="text-[2.8rem] font-black leading-none">{current.deliveryRate}%</span>
              <div className="text-right">
                <span className="text-[0.85rem] font-bold text-slate-500">{analytics.trends.deliveryRate}</span>
                <p className="text-[0.65rem] text-slate-400 font-medium whitespace-nowrap">vs last month</p>
              </div>
            </div>
          </div>

          {/* Deliveries Mini Chart */}
          <div className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-50">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[0.75rem] font-bold text-slate-700">Deliveries</p>
                <p className="text-[0.6rem] text-slate-400 font-medium leading-none mt-1">This month breakdown</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100">
                <div className="flex gap-[2px]">
                  <div className="w-1 h-1 rounded-full bg-slate-300"></div>
                  <div className="w-1 h-1 rounded-full bg-slate-300"></div>
                  <div className="w-1 h-1 rounded-full bg-slate-300"></div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-6">
              <div className="w-4 h-4 rounded-[4px] bg-emerald-500"></div>
              <span className="text-[1.4rem] font-black leading-none">{current.delivered}</span>
              <span className="text-[0.7rem] text-slate-400 font-bold mt-1 uppercase tracking-wider">Delivered</span>
            </div>
            <div className="flex items-end gap-1.5 h-[60px] mt-6">
              {[
                { v: current.delivered, color: "bg-emerald-500" },
                { v: current.failed, color: "bg-red-400" },
                { v: summary.pending, color: "bg-amber-400" },
              ].map((bar, i) => {
                const maxVal = Math.max(current.delivered, current.failed, summary.pending, 1);
                return (
                  <div
                    key={i}
                    className={`flex-1 rounded-t-[2px] ${bar.color}`}
                    style={{ height: `${Math.max(5, Math.round((bar.v / maxVal) * 100))}%` }}
                  ></div>
                );
              })}
            </div>
          </div>
        </div>

        <Link
          href={`/admin/staff/delivery-agent/${id}/analytics`}
          className="mt-6 border-2 border-purple-600 bg-transparent hover:bg-purple-50 text-purple-600 px-6 py-2.5 rounded-xl text-[0.85rem] font-bold flex items-center gap-3 transition-all inline-flex no-underline"
        >
          <LayoutDashboard size={18} /> See Full Analytics <ChevronRight size={16} />
        </Link>
      </section>

      {/* Advanced Section — client component for modals */}
      <DeliveryAgentDetailClient
        agentName={agent.companyName}
        agentId={id}
        agentStatus={agent.status}
      />
    </div>
  );
}
