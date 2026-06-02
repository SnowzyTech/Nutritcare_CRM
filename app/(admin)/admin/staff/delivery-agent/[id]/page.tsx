import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { UserCircle, LayoutDashboard, ArrowRight } from "lucide-react";
import { getDeliveryAgentById, getDeliveryAgentOrderSummary, getDeliveryAgentAnalytics } from "@/modules/delivery/services/agents.service";
import { parseMonthParam } from "@/lib/month-period";
import { MonthFilter } from "@/components/admin/month-filter";
import DeliveryAgentDetailClient from "./delivery-agent-detail-client";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ month?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const agent = await getDeliveryAgentById(id);
  return { title: agent ? `${agent.companyName} — Delivery Agent` : "Delivery Agent" };
}

export default async function DeliveryAgentDetailPage({ params, searchParams }: Props) {
  const { id } = await params;
  const period = parseMonthParam((await searchParams).month);
  const [agent, summary, analytics] = await Promise.all([
    getDeliveryAgentById(id),
    getDeliveryAgentOrderSummary(id),
    getDeliveryAgentAnalytics(id, period),
  ]);

  if (!agent) notFound();

  const { current } = analytics;
  const stateName = agent.state ? agent.state.replace(" State", "") : "—";

  return (
    <div className="max-w-[1200px] mx-auto pb-20">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-800">{agent.companyName}&apos;s Profile</h1>
        <span className="text-base text-gray-400">Delivery Agent</span>
      </div>

      {/* Order Section */}
      <section className="mb-10">
        <h2 className="text-lg font-bold mb-4 text-gray-600">Order</h2>
        <div className="bg-white rounded-xl p-2 flex items-center justify-center gap-6 sm:gap-10 mb-4 shadow-sm border border-gray-100">
          {[
            { label: "All", count: summary.total, active: true },
            { label: "Pending", count: summary.pending },
            { label: "Delivered", count: summary.delivered },
            { label: "Failed", count: summary.failed },
          ].map((tab) => (
            <button
              key={tab.label}
              className={`flex items-center gap-1 whitespace-nowrap px-4 sm:px-6 py-3 rounded-lg transition-all ${
                tab.active ? "bg-purple-50" : "hover:bg-gray-50"
              }`}
            >
              <span className={`text-sm sm:text-base font-bold ${tab.active ? "text-purple-700" : "text-gray-500"}`}>
                {tab.label}
              </span>
              {tab.active ? (
                <span className="bg-purple-200 text-purple-700 text-xs font-bold px-1.5 py-0.5 rounded">
                  {tab.count}
                </span>
              ) : (
                <span className="text-gray-400 text-sm font-medium">({tab.count})</span>
              )}
            </button>
          ))}
        </div>
        <Link
          href={`/admin/staff/delivery-agent/${id}/orders`}
          className="inline-block bg-purple-50 hover:bg-purple-100 text-purple-600 px-6 py-2.5 rounded-lg text-sm font-bold transition-colors no-underline"
        >
          See All Orders
        </Link>
      </section>

      {/* Profile Section */}
      <section className="mb-10">
        <h2 className="text-lg font-bold mb-4 text-gray-600">Profile</h2>
        <div className="bg-purple-50/50 rounded-2xl p-6 sm:p-8 border border-purple-100/50">
          <div className="flex flex-col sm:flex-row gap-6 mb-6">
            {/* Avatar */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden shrink-0">
              {agent.user?.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={agent.user.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-300 rounded-lg flex flex-col gap-1 items-center justify-center">
                  <div className="w-6 h-1.5 bg-white/60 rounded-full"></div>
                  <div className="w-6 h-1.5 bg-white/60 rounded-full"></div>
                  <div className="w-6 h-1.5 bg-white/60 rounded-full"></div>
                </div>
              )}
            </div>

            {/* Name & Role */}
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-800">{agent.companyName}</h3>
              </div>
              <p className="text-base text-gray-500 mt-1 mb-3">
                Delivery Agent <span className="font-bold text-gray-700">{stateName}</span>
              </p>
              <div className={`inline-flex items-center gap-2 border rounded-md px-3 py-1 text-xs font-medium ${
                agent.status === "ACTIVE" ? "border-green-500 text-green-600 bg-green-50" : "border-red-400 text-red-400"
              }`}>
                <span className={`w-2 h-2 rounded-full ${agent.status === "ACTIVE" ? "bg-green-500" : "bg-red-400"}`}></span>
                {agent.status === "ACTIVE" ? "Online" : "Offline"}
              </div>
            </div>
          </div>

          {/* Contact Info Row */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 pt-6 border-t border-purple-200/50">
            <div className="flex flex-wrap gap-x-8 gap-y-4">
              <div>
                <p className="text-xs text-gray-400 font-medium mb-1">Phone Number</p>
                <p className="text-lg font-bold text-purple-900">{agent.phone1 ?? "—"}</p>
              </div>
              {agent.phone2 && (
                <div>
                  <p className="text-xs text-gray-400 font-medium mb-1">Whatsapp</p>
                  <p className="text-lg font-bold text-purple-900">{agent.phone2}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-gray-400 font-medium mb-1">Email</p>
                <p className="text-lg font-bold text-purple-900 break-all">{agent.user?.email ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium mb-1">State</p>
                <p className="text-lg font-bold text-gray-600">{agent.state ?? "—"}</p>
              </div>
            </div>

            <Link
              href={`/admin/staff/delivery-agent/${id}/profile`}
              className="border-2 border-purple-500 text-purple-600 hover:bg-purple-50 px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shrink-0 no-underline"
            >
              <UserCircle size={16} /> See Full Profile <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* Analytics Section */}
      <section className="mb-10">
        <h2 className="text-lg font-bold mb-4 text-gray-600">Analytics</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* General Performance */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <span className="text-sm font-bold text-gray-700">General Performance</span>
              <MonthFilter />
            </div>
            <div className="flex justify-between items-end">
              <span className="text-4xl font-bold text-gray-600 leading-none">{current.generalPerformance}%</span>
              <span className={`text-sm font-bold ${analytics.trends.generalPerformance.startsWith("-") ? "text-rose-500" : "text-green-500"}`}>{analytics.trends.generalPerformance} <span className="text-gray-400 font-medium">vs last month</span></span>
            </div>
          </div>

          {/* Delivery Rate */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <span className="text-sm font-bold text-gray-700">Delivery Rate</span>
              <MonthFilter />
            </div>
            <div className="flex justify-between items-end">
              <span className="text-4xl font-bold text-gray-600 leading-none">{current.deliveryRate}%</span>
              <span className={`text-sm font-bold ${analytics.trends.deliveryRate.startsWith("-") ? "text-rose-500" : "text-green-500"}`}>{analytics.trends.deliveryRate} <span className="text-gray-400 font-medium">vs last month</span></span>
            </div>
          </div>

          {/* Sales Mini Chart */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 sm:col-span-2 lg:col-span-1">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-xs font-bold text-gray-700">Sales</p>
                <p className="text-[10px] text-gray-400 font-medium leading-none mt-0.5">Brief Report Lorem Ipsum</p>
              </div>
              <div className="w-6 h-6 rounded flex items-center justify-center">
                <div className="flex gap-[2px]">
                  <div className="w-0.5 h-0.5 rounded-full bg-gray-300"></div>
                  <div className="w-0.5 h-0.5 rounded-full bg-gray-300"></div>
                  <div className="w-0.5 h-0.5 rounded-full bg-gray-300"></div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-4 h-4 rounded bg-blue-500"></div>
              <span className="text-xl font-bold text-gray-800 leading-none">{current.delivered}</span>
              <span className="text-xs text-gray-400 font-medium mt-0.5">Sale</span>
            </div>

            <div className="flex items-end gap-1 h-[80px]">
              {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((day, i) => {
                const heights = [40, 55, 70, 85, 60, 75, 50];
                return (
                  <div key={day} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full rounded-t bg-blue-200"
                      style={{ height: `${heights[i]}%` }}
                    ></div>
                    <span className="text-[8px] text-gray-400">{day}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <Link
          href={`/admin/staff/delivery-agent/${id}/analytics`}
          className="mt-6 border-2 border-purple-500 text-purple-600 hover:bg-purple-50 px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all inline-flex no-underline"
        >
          <LayoutDashboard size={16} /> See Full Analytics <ArrowRight size={14} />
        </Link>
      </section>

      {/* Advanced Section */}
      <DeliveryAgentDetailClient
        agentName={agent.companyName}
        agentId={id}
        agentStatus={agent.status}
      />
    </div>
  );
}
