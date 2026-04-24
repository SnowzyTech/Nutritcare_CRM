import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronDown, ChevronRight, UserCircle, LayoutDashboard } from "lucide-react";
import { getSalesRepById, getSalesRepOrderSummary } from "@/modules/users/services/users.service";
import SalesRepDetailClient from "./sales-rep-detail-client";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const rep = await getSalesRepById(id);
  return { title: rep ? `${rep.name} — Sales Rep` : "Sales Rep" };
}

export default async function SalesRepDetailPage({ params }: Props) {
  const { id } = await params;
  const [rep, orderSummary] = await Promise.all([
    getSalesRepById(id),
    getSalesRepOrderSummary(id),
  ]);

  if (!rep) notFound();

  const firstName = rep.name.split(" ")[0];
  // Compute delivery rate for analytics cards
  const dispatched = orderSummary.delivered + orderSummary.failed;
  const deliveryRate = dispatched > 0 ? Math.round((orderSummary.delivered / dispatched) * 100) : 0;
  const total = orderSummary.total;
  const confirmationRate = total > 0
    ? Math.round(((orderSummary.confirmed + orderSummary.delivered) / total) * 100)
    : 0;
  const generalPerformance = Math.round(deliveryRate * 0.6 + confirmationRate * 0.4);

  return (
    <div className="max-w-[1200px] mx-auto font-inter text-slate-900 pb-20">
      {/* Header */}
      <div className="flex justify-between items-baseline mb-8">
        <h1 className="text-2xl font-bold">{rep.name}&apos;s Profile</h1>
        <span className="text-[0.95rem] text-slate-400">Sales Representatives</span>
      </div>

      {/* Order Section */}
      <section className="mb-10">
        <h2 className="text-lg font-bold mb-4 text-slate-600">Order</h2>
        <div className="bg-white rounded-xl p-4 px-6 flex gap-8 items-center shadow-sm border border-slate-50">
          <div className="flex items-center gap-2">
            <span className="text-[0.9rem] font-bold">All</span>
            <span className="bg-purple-50 text-purple-600 text-[0.7rem] font-black px-2 py-0.5 rounded-[4px]">
              {orderSummary.total}
            </span>
          </div>
          <div className="text-[0.9rem] font-semibold text-slate-400">Pending({orderSummary.pending})</div>
          <div className="text-[0.9rem] font-semibold text-slate-400">Confirmed({orderSummary.confirmed})</div>
          <div className="text-[0.9rem] font-semibold text-slate-400">Delivered({orderSummary.delivered})</div>
          <div className="text-[0.9rem] font-semibold text-slate-400">Cancelled({orderSummary.cancelled})</div>
          <div className="text-[0.9rem] font-semibold text-slate-400">Failed({orderSummary.failed})</div>
        </div>
        <Link
          href={`/admin/orders`}
          className="mt-4 inline-block bg-purple-50 hover:bg-purple-100 text-purple-600 px-6 py-2.5 rounded-lg text-[0.85rem] font-bold transition-colors no-underline"
        >
          See All Orders
        </Link>
      </section>

      {/* Profile Section */}
      <section className="mb-10">
        <h2 className="text-lg font-bold mb-4 text-slate-600">Profile</h2>
        <div className="bg-white rounded-[24px] p-8 shadow-[0_4px_24px_rgba(0,0,0,0.03)] border border-slate-50 relative">
          <div className="flex gap-6 mb-10">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-full bg-purple-100 flex items-center justify-center overflow-hidden shadow-inner shrink-0">
              {rep.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={rep.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl font-black text-purple-600">
                  {rep.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                </span>
              )}
            </div>

            {/* Name & Role */}
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h3 className="text-[1.5rem] font-bold">{rep.name}</h3>
                {rep.isTeamLead && (
                  <span className="bg-slate-900 text-white text-[0.65rem] font-black px-2 py-0.5 rounded-[4px] uppercase tracking-wider">
                    Team Lead
                  </span>
                )}
              </div>
              <p className="text-[1rem] text-slate-400 mt-1 mb-3">
                Sales Rep{rep.team && <> <span className="font-bold text-slate-600">{rep.team.name}</span></>}
              </p>
              <div className={`inline-flex items-center gap-2 border rounded-full px-3 py-0.5 text-[0.75rem] font-bold ${
                rep.isActive ? "border-emerald-500 text-emerald-500" : "border-slate-300 text-slate-400"
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${rep.isActive ? "bg-emerald-500 animate-pulse" : "bg-slate-300"}`}></span>
                {rep.isActive ? "Active" : "Inactive"}
              </div>
            </div>

            {/* KPI */}
            <div className="text-right">
              <p className="text-[0.8rem] text-slate-400 leading-tight">
                {firstName}&apos;s performance<br />
                this month
              </p>
              <div className="mt-2">
                <span className="text-[1.6rem] font-black text-emerald-500 leading-none">{generalPerformance}%</span>
                <p className="text-[0.75rem] text-slate-400 font-medium">achieved</p>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-end gap-10">
            <div className="flex flex-wrap gap-x-12 gap-y-6">
              <div>
                <p className="text-[0.75rem] text-slate-400 font-semibold mb-1">Phone Number</p>
                <p className="text-[1.1rem] font-bold text-purple-900">{rep.phone ?? "—"}</p>
              </div>
              <div className="border-l border-slate-100 pl-12">
                <p className="text-[0.75rem] text-slate-400 font-semibold mb-1">Whatsapp</p>
                <p className="text-[1.1rem] font-bold text-purple-900">{rep.whatsappNumber ?? rep.phone ?? "—"}</p>
              </div>
              <div className="border-l border-slate-100 pl-12">
                <p className="text-[0.75rem] text-slate-400 font-semibold mb-1">Email</p>
                <p className="text-[1.1rem] font-bold text-purple-900">{rep.email}</p>
              </div>
              <div className="border-l border-slate-100 pl-12">
                <p className="text-[0.75rem] text-slate-400 font-semibold mb-1">Team</p>
                <p className="text-[1.1rem] font-bold text-slate-600">{rep.team?.name ?? "No Team"}</p>
              </div>
            </div>

            <Link
              href={`/admin/staff/sales-rep/${id}/profile`}
              className="border-2 border-purple-600 bg-transparent hover:bg-purple-50 text-purple-600 px-6 py-2.5 rounded-xl text-[0.85rem] font-bold flex items-center gap-3 transition-all shrink-0 no-underline"
            >
              <UserCircle size={18} /> See Full Profile <ChevronRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* Analytics Section */}
      <section className="mb-10">
        <h2 className="text-lg font-bold mb-4 text-slate-600">Analytics</h2>
        <div className="grid grid-cols-3 gap-6">
          {/* General Performance */}
          <div className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-50">
            <div className="flex justify-between items-center mb-10">
              <span className="text-[0.85rem] font-bold text-slate-700">General Performance</span>
              <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg text-[0.7rem] font-semibold text-slate-500 border border-slate-100">
                All Time <ChevronDown size={12} />
              </div>
            </div>
            <div className="flex justify-between items-end">
              <span className="text-[2.8rem] font-black leading-none">{generalPerformance}%</span>
              <div className="text-right">
                <span className="text-[0.85rem] font-bold text-slate-500">{orderSummary.total} orders</span>
                <p className="text-[0.65rem] text-slate-400 font-medium">total</p>
              </div>
            </div>
          </div>

          {/* Delivery Rate */}
          <div className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-50">
            <div className="flex justify-between items-center mb-10">
              <span className="text-[0.85rem] font-bold text-slate-700">Delivery Rate</span>
              <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg text-[0.7rem] font-semibold text-slate-500 border border-slate-100">
                All Time <ChevronDown size={12} />
              </div>
            </div>
            <div className="flex justify-between items-end">
              <span className="text-[2.8rem] font-black leading-none">{deliveryRate}%</span>
              <div className="text-right">
                <span className="text-[0.85rem] font-bold text-slate-500">{orderSummary.delivered} delivered</span>
                <p className="text-[0.65rem] text-slate-400 font-medium">of {dispatched} dispatched</p>
              </div>
            </div>
          </div>

          {/* Sales Mini Chart */}
          <div className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-50">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[0.75rem] font-bold text-slate-700">Orders</p>
                <p className="text-[0.6rem] text-slate-400 font-medium leading-none mt-1">Status breakdown</p>
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
              <span className="text-[1.4rem] font-black leading-none">{orderSummary.delivered}</span>
              <span className="text-[0.7rem] text-slate-400 font-bold mt-1 uppercase tracking-wider">Delivered</span>
            </div>

            <div className="flex items-end gap-1.5 h-[60px] mt-6">
              {[
                { v: orderSummary.delivered, color: "bg-emerald-500" },
                { v: orderSummary.confirmed, color: "bg-blue-500" },
                { v: orderSummary.pending, color: "bg-amber-400" },
                { v: orderSummary.cancelled, color: "bg-rose-400" },
                { v: orderSummary.failed, color: "bg-red-600" },
              ].map((bar, i) => {
                const maxVal = Math.max(orderSummary.delivered, orderSummary.confirmed, orderSummary.pending, orderSummary.cancelled, orderSummary.failed, 1);
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
          href={`/admin/staff/sales-rep/${id}/analytics`}
          className="mt-6 border-2 border-purple-600 bg-transparent hover:bg-purple-50 text-purple-600 px-6 py-2.5 rounded-xl text-[0.85rem] font-bold flex items-center gap-3 transition-all inline-flex no-underline"
        >
          <LayoutDashboard size={18} /> See Full Analytics <ChevronRight size={16} />
        </Link>
      </section>

      {/* Advanced Section — interactive, uses client component */}
      <SalesRepDetailClient staffName={rep.name} staffId={id} />
    </div>
  );
}
