import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ChevronDown, History, Settings } from "lucide-react";
import { getStaffMemberById } from "@/modules/users/services/users.service";
import { formatDate } from "@/lib/utils";

const ROLE_LABELS: Record<string, string> = {
  INVENTORY_MANAGER: "Inventory Manager",
  ACCOUNTANT: "Accountant",
  WAREHOUSE_MANAGER: "Warehouse Manager",
  DATA_ANALYST: "Data Analyst",
  SALES_REP: "Sales Representative",
  SALES_REP_MANAGER: "Sales Rep Manager",
  LOGISTICS_MANAGER: "Logistics Manager",
  ADMIN: "Administrator",
};

type Props = {
  id: string;
  roleLabel: string;
  basePath: string;
};

export default async function StaffProfilePage({ id, roleLabel, basePath }: Props) {
  const member = await getStaffMemberById(id);
  if (!member) notFound();

  const initials = member.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
  const roleDisplay = ROLE_LABELS[member.role] ?? member.role;
  const daysSinceJoining = Math.floor(
    (Date.now() - new Date(member.createdAt).getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="max-w-[1200px] mx-auto font-inter text-slate-900 pb-20">
      <Link
        href={`${basePath}/${id}`}
        className="inline-flex items-center gap-2 text-slate-400 hover:text-purple-600 mb-6 transition-colors group no-underline"
      >
        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
        <span className="text-sm font-bold">Back to Overview</span>
      </Link>

      <div className="flex justify-between items-baseline mb-8">
        <h1 className="text-2xl font-bold">{member.name}&apos;s Profile</h1>
        <span className="text-[0.95rem] text-slate-400 font-medium">{roleLabel}</span>
      </div>

      <div className="bg-white rounded-[32px] p-10 shadow-[0_1px_4px_rgba(0,0,0,0.02)] border border-slate-50 mb-8">
        <div className="flex justify-between items-start">
          <div className="flex gap-8 items-center">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-purple-100 overflow-hidden border-4 border-slate-50 shadow-inner flex items-center justify-center">
                {member.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={member.avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl font-black text-purple-600">{initials}</span>
                )}
              </div>
              <button className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-white border border-slate-100 shadow-sm flex items-center justify-center text-slate-400 hover:text-purple-600 transition-colors font-bold text-xl">
                +
              </button>
            </div>

            <div>
              <h2 className="text-3xl font-black text-slate-800">{member.name}</h2>
              <div className="flex items-center gap-4 mt-1">
                <p className="text-[1.05rem] text-slate-400">{roleDisplay}</p>
                <div className={`flex items-center gap-1.5 border rounded-lg px-2.5 py-0.5 text-[0.7rem] font-black uppercase ${
                  member.isActive ? "border-emerald-500 text-emerald-500" : "border-slate-300 text-slate-400"
                }`}>
                  {member.isActive ? "Active" : "Inactive"}
                  <span className={`w-1.5 h-1.5 rounded-full ${member.isActive ? "bg-emerald-500" : "bg-slate-300"}`} />
                </div>
              </div>
            </div>
          </div>

          <div className="text-right">
            <p className="text-[0.8rem] text-slate-400 leading-tight">
              Member for<br />
              <span className="font-bold text-slate-900 text-[1rem]">{daysSinceJoining} days</span>
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
            <p className="text-[1.2rem] font-black text-purple-900 tracking-tight">{member.phone ?? "—"}</p>
          </div>
          <div className="border-l border-slate-100 pl-8">
            <p className="text-[0.7rem] text-slate-400 font-bold uppercase tracking-wider mb-2">WhatsApp</p>
            <p className="text-[1.2rem] font-black text-purple-900 tracking-tight">{member.whatsappNumber ?? member.phone ?? "—"}</p>
          </div>
          <div className="border-l border-slate-100 pl-8">
            <p className="text-[0.7rem] text-slate-400 font-bold uppercase tracking-wider mb-2">Email</p>
            <p className="text-[1rem] font-black text-purple-900 break-all pr-4">{member.email}</p>
          </div>
          <div className="border-l border-slate-100 pl-8">
            <p className="text-[0.7rem] text-slate-400 font-bold uppercase tracking-wider mb-2">Role</p>
            <p className="text-[1rem] font-black text-slate-600">{roleDisplay}</p>
          </div>

          <div className="mt-4">
            <p className="text-[0.7rem] text-slate-400 font-bold uppercase tracking-wider mb-2">Team</p>
            <p className="text-[1.2rem] font-black text-slate-700">{member.team?.name ?? "No Team"}</p>
          </div>
          <div className="border-l border-slate-100 pl-8 mt-4">
            <p className="text-[0.7rem] text-slate-400 font-bold uppercase tracking-wider mb-2">Account Status</p>
            <p className={`text-[1.2rem] font-black ${member.isActive ? "text-emerald-600" : "text-slate-400"}`}>
              {member.isActive ? "Active" : "Inactive"}
            </p>
          </div>
          <div className="border-l border-slate-100 pl-8 mt-4">
            <p className="text-[0.7rem] text-slate-400 font-bold uppercase tracking-wider mb-2">Member Since</p>
            <p className="text-[1rem] font-black text-slate-600">{formatDate(member.createdAt)}</p>
          </div>

          <div className="border-l border-slate-100 pl-8 mt-[-20px]">
            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <span className="text-[0.75rem] font-black text-slate-800">Account Age</span>
                <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-md text-[0.6rem] font-bold text-slate-500 border border-slate-100">
                  All Time <ChevronDown size={10} />
                </div>
              </div>
              <div className="flex justify-between items-end">
                <span className="text-[2.2rem] font-black leading-none">{daysSinceJoining}</span>
                <div className="text-right">
                  <p className="text-[0.55rem] text-slate-400 font-medium">days as a member</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mt-12 pt-8 border-t border-slate-50">
        <div>
          <p className="text-[0.75rem] text-slate-400 font-bold mb-1">Account Created on</p>
          <p className="text-[1.1rem] font-black text-slate-600">{formatDate(member.createdAt)}</p>
        </div>
        <button className="bg-purple-50 hover:bg-purple-100 text-purple-600 px-10 py-3 rounded-xl text-[0.85rem] font-black flex items-center gap-3 transition-all">
          <History size={16} /> Check Login History
        </button>
      </div>
    </div>
  );
}
