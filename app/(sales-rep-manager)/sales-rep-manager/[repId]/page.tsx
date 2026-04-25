import { notFound } from "next/navigation";
import Link from "next/link";
import { getSalesRepById, getSalesRepOrderSummary, getSalesRepAnalytics } from "@/modules/users/services/users.service";
import { AnalyticsSection } from "./analytics-client";

export const dynamic = "force-dynamic";

export default async function RepDashboardPage({
  params,
}: {
  params: Promise<{ repId: string }>;
}) {
  const { repId } = await params;

  const [rep, orderSummary, analytics] = await Promise.all([
    getSalesRepById(repId),
    getSalesRepOrderSummary(repId),
    getSalesRepAnalytics(repId),
  ]);

  if (!rep) notFound();

  const teamName = rep.team?.name ?? "No Team";
  const currentAnalytics = {
    generalPerformance: analytics.current.generalPerformance,
    deliveryRate: analytics.current.deliveryRate,
    salesTotal: analytics.current.totalProductsSold,
    trend: analytics.trends.generalPerformance,
  };

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-10 pb-20">
      <div className="flex items-center gap-3">
        <span className="bg-[#3B0069] text-white text-sm font-bold uppercase tracking-wider px-3 py-1.5 rounded-full shadow-sm">
          Manager Mode
        </span>
        <span className="bg-[#F3E8FF] text-[#A020F0] text-[10px] font-bold px-2.5 py-0.5 rounded-md border border-[#D6BBFB]">
          {teamName}
        </span>
      </div>

      <div>
        <h2 className="text-xl font-bold text-gray-600 mb-6">Order</h2>

        <div className="flex items-center gap-8 border-b border-gray-100 pb-4 overflow-x-auto no-scrollbar mb-6">
          <div className="flex items-center gap-2 text-gray-900 font-bold text-sm shrink-0">
            All
            <span className="bg-[#D6BBFB] text-white text-[10px] px-2 py-0.5 rounded-lg">{orderSummary.total}</span>
          </div>
          <div className="text-gray-600 font-bold text-sm shrink-0">Pending({orderSummary.pending})</div>
          <div className="text-gray-600 font-bold text-sm shrink-0">Confirmed({orderSummary.confirmed})</div>
          <div className="text-gray-600 font-bold text-sm shrink-0">Delivered({orderSummary.delivered})</div>
          <div className="text-gray-600 font-bold text-sm shrink-0">Cancelled({orderSummary.cancelled})</div>
          <div className="text-gray-600 font-bold text-sm shrink-0">Failed({orderSummary.failed})</div>
        </div>

        <Link
          href={`/sales-rep-manager/${repId}/orders`}
          className="inline-flex items-center justify-center bg-[#FAF5FF] text-[#A020F0] px-8 py-3 rounded-xl text-sm font-bold hover:bg-[#F3E8FF] transition"
        >
          See All Orders
        </Link>
      </div>

      <div>
        <h2 className="text-xl font-bold text-gray-600 mb-6">Profile</h2>
        <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm flex flex-col">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-full overflow-hidden shrink-0">
                <img
                  src={rep.avatarUrl ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(rep.name)}&background=f3f4f6&color=6b7280`}
                  alt={rep.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="text-[22px] font-bold text-gray-800">{rep.name}</h2>
                  {rep.isTeamLead && (
                    <span className="bg-[#3B0069] text-white text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-md">
                      Team Lead
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-gray-400 font-medium">Sales Rep</span>
                  <span className="text-gray-600 font-bold">{teamName}</span>
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md border border-green-200">
                  <span className="text-xs font-semibold text-green-500">Active</span>
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                </div>
              </div>
            </div>

            <div className="text-right flex items-center gap-2">
              <p className="text-xs text-gray-400 font-medium text-right mr-2">
                {rep.name.split(" ")[0]}{"'"}s performance<br />this month
              </p>
              <div className="w-px h-10 bg-gray-200 mx-2"></div>
              <div className="text-right ml-2">
                <span className="text-green-500 font-black text-xl leading-none block">{analytics.current.generalPerformance}%</span>
                <span className="text-gray-400 text-[10px] font-medium">achieved</span>
              </div>
            </div>
          </div>

          <div className="w-full h-px bg-gray-100 mb-8"></div>

          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
            <div className="flex flex-wrap gap-8 lg:gap-12 flex-1">
              <div>
                <p className="text-[10px] text-gray-400 font-medium mb-1">Phone Number</p>
                <p className="text-lg font-bold text-[#3B0069]">{rep.phone ?? "—"}</p>
              </div>
              <div className="hidden lg:block w-px bg-gray-200 h-10"></div>
              <div>
                <p className="text-[10px] text-gray-400 font-medium mb-1">Whatsapp</p>
                <p className="text-lg font-bold text-[#3B0069]">{rep.whatsappNumber ?? "—"}</p>
              </div>
              <div className="hidden lg:block w-px bg-gray-200 h-10"></div>
              <div>
                <p className="text-[10px] text-gray-400 font-medium mb-1">Email</p>
                <p className="text-base font-bold text-[#3B0069] max-w-[150px] break-all">{rep.email}</p>
              </div>
              <div className="hidden lg:block w-px bg-gray-200 h-10"></div>
              <div>
                <p className="text-[10px] text-gray-400 font-medium mb-1">Team</p>
                <p className="text-lg font-bold text-gray-600">{teamName}</p>
              </div>
            </div>

            <Link
              href={`/sales-rep-manager/${repId}/profile`}
              className="shrink-0 flex items-center justify-center gap-2 border-[1.5px] border-[#A020F0] text-[#A020F0] px-8 py-3 rounded-xl text-sm font-bold hover:bg-[#FAF5FF] transition"
            >
              <span className="w-4 h-4 rounded-full border border-current flex items-center justify-center text-[10px]">
                👤
              </span>
              See Full Profile →
            </Link>
          </div>
        </div>
      </div>

      <AnalyticsSection
        repId={repId}
        repName={rep.name}
        currentAnalytics={currentAnalytics}
      />
    </div>
  );
}
