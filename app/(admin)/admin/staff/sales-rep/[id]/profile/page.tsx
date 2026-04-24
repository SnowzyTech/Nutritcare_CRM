import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ChevronDown, ArrowLeft, Settings, History } from "lucide-react";
import Link from "next/link";
import { getSalesRepById, getSalesRepOrderSummary } from "@/modules/users/services/users.service";
import { formatDate } from "@/lib/utils";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const rep = await getSalesRepById(id);
  return { title: rep ? `${rep.name} — Full Profile` : "Full Profile" };
}

export default async function SalesRepFullProfilePage({ params }: Props) {
  const { id } = await params;
  const [rep, orderSummary] = await Promise.all([
    getSalesRepById(id),
    getSalesRepOrderSummary(id),
  ]);

  if (!rep) notFound();

  const dispatched = orderSummary.delivered + orderSummary.failed;
  const deliveryRate = dispatched > 0 ? Math.round((orderSummary.delivered / dispatched) * 100) : 0;
  const confirmationRate = orderSummary.total > 0
    ? Math.round(((orderSummary.confirmed + orderSummary.delivered) / orderSummary.total) * 100)
    : 0;
  const generalPerformance = Math.round(deliveryRate * 0.6 + confirmationRate * 0.4);

  return (
    <div className="max-w-[1200px] mx-auto font-inter text-slate-900 pb-20">
      <Link
        href={`/admin/staff/sales-rep/${id}`}
        className="inline-flex items-center gap-2 text-slate-400 hover:text-purple-600 mb-6 transition-colors group no-underline"
      >
        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
        <span className="text-sm font-bold">Back to Overview</span>
      </Link>

      <div className="flex justify-between items-baseline mb-8">
        <h1 className="text-2xl font-bold">{rep.name}&apos;s Profile</h1>
        <span className="text-[0.95rem] text-slate-400 font-medium">Sales Representatives</span>
      </div>

      <div className="bg-white rounded-[32px] p-10 shadow-[0_1px_4px_rgba(0,0,0,0.02)] border border-slate-50 mb-8 relative">
        <div className="flex justify-between items-start">
          <div className="flex gap-8 items-center">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-purple-100 overflow-hidden border-4 border-slate-50 shadow-inner flex items-center justify-center">
                {rep.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={rep.avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl font-black text-purple-600">
                    {rep.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                  </span>
                )}
              </div>
              <button className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-white border border-slate-100 shadow-sm flex items-center justify-center text-slate-400 hover:text-purple-600 transition-colors font-bold text-xl">
                +
              </button>
            </div>

            <div>
              <h2 className="text-3xl font-black text-slate-800">{rep.name}</h2>
              <div className="flex items-center gap-4 mt-1">
                <p className="text-[1.05rem] text-slate-400">
                  Sales Rep{rep.team && <> <span className="font-bold text-slate-600">{rep.team.name}</span></>}
                </p>
                <div className={`flex items-center gap-1.5 border rounded-lg px-2.5 py-0.5 text-[0.7rem] font-black uppercase ${
                  rep.isActive ? "border-emerald-500 text-emerald-500" : "border-slate-300 text-slate-400"
                }`}>
                  {rep.isActive ? "Active" : "Inactive"}
                  <span className={`w-1.5 h-1.5 rounded-full ${rep.isActive ? "bg-emerald-500" : "bg-slate-300"}`}></span>
                </div>
              </div>
            </div>
          </div>

          <div className="text-right">
            <p className="text-[0.8rem] text-slate-400 leading-tight">
              Overall performance<br />
              <span className="font-bold text-slate-900 text-[1rem]">{generalPerformance}% score</span>
            </p>
            <button className="mt-8 border border-purple-400 text-purple-600 px-6 py-2 rounded-xl text-[0.75rem] font-black flex items-center gap-2 transition-all hover:bg-purple-50">
              <Settings size={14} /> Edit Profile
            </button>
          </div>
        </div>

        <div className="h-[1px] bg-slate-100 my-10" />

        <div className="grid grid-cols-4 gap-y-12">
          <div>
            <p className="text-[0.7rem] text-slate-400 font-bold uppercase tracking-wider mb-2">Phone Number</p>
            <p className="text-[1.2rem] font-black text-purple-900 tracking-tight">{rep.phone ?? "—"}</p>
          </div>
          <div className="border-l border-slate-100 pl-8">
            <p className="text-[0.7rem] text-slate-400 font-bold uppercase tracking-wider mb-2">Whatsapp</p>
            <p className="text-[1.2rem] font-black text-purple-900 tracking-tight">{rep.whatsappNumber ?? rep.phone ?? "—"}</p>
          </div>
          <div className="border-l border-slate-100 pl-8">
            <p className="text-[0.7rem] text-slate-400 font-bold uppercase tracking-wider mb-2">Email</p>
            <p className="text-[1rem] font-black text-purple-900 break-all pr-4">{rep.email}</p>
          </div>
          <div className="border-l border-slate-100 pl-8">
            <p className="text-[0.7rem] text-slate-400 font-bold uppercase tracking-wider mb-2">States Handled</p>
            <span className="bg-slate-50 text-slate-400 px-4 py-1 rounded-full text-[0.75rem] font-bold border border-slate-100">
              All
            </span>
          </div>

          <div className="mt-4">
            <p className="text-[0.7rem] text-slate-400 font-bold uppercase tracking-wider mb-2">Team</p>
            <p className="text-[1.2rem] font-black text-slate-700">{rep.team?.name ?? "No Team"}</p>
          </div>
          <div className="border-l border-slate-100 pl-8 mt-4">
            <p className="text-[0.7rem] text-slate-400 font-bold uppercase tracking-wider mb-2">Role</p>
            <p className="text-[1.2rem] font-black text-slate-600">Sales Rep</p>
          </div>
          <div className="border-l border-slate-100 pl-8 mt-4">
            <p className="text-[0.7rem] text-slate-400 font-bold uppercase tracking-wider mb-2">Total Orders</p>
            <p className="text-[1.2rem] font-black text-slate-600">{orderSummary.total}</p>
          </div>

          {/* Performance Card */}
          <div className="border-l border-slate-100 pl-8 mt-[-20px]">
            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <span className="text-[0.75rem] font-black text-slate-800">General Performance</span>
                <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-md text-[0.6rem] font-bold text-slate-500 border border-slate-100">
                  All Time <ChevronDown size={10} />
                </div>
              </div>
              <div className="flex justify-between items-end">
                <span className="text-[2.2rem] font-black leading-none">{generalPerformance}%</span>
                <div className="text-right">
                  <span className="text-[0.75rem] font-bold text-slate-500">{orderSummary.delivered}D / {orderSummary.failed}F</span>
                  <p className="text-[0.55rem] text-slate-400 font-medium">delivered / failed</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mt-12 pt-8 border-t border-slate-50">
        <div>
          <p className="text-[0.75rem] text-slate-400 font-bold mb-1">Account Created on</p>
          <p className="text-[1.1rem] font-black text-slate-600">{formatDate(rep.createdAt)}</p>
        </div>
        <button className="bg-purple-50 hover:bg-purple-100 text-purple-600 px-10 py-3 rounded-xl text-[0.85rem] font-black flex items-center gap-3 transition-all">
          <History size={16} /> Check Login History
        </button>
      </div>
    </div>
  );
}
